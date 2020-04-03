/* eslint-disable no-nested-ternary */
import RiskNode from "../nodes/RiskNode"
import AssetNode from "../nodes/AssetNode"
import RequirementNode from "../nodes/RequirementNode"
import CustomNode from "../nodes/CustomNode"
import ControlNode from "../nodes/ControlNode"
import ThinEdge from "../edges/ThinEdge"
import BoldEdge from "../edges/BoldEdge"

import { Request, RequestMultiple } from "../utils/HttpRequests"
import NodeFactory from "../nodes/NodeFactory"
import EdgeFactory from "../edges/EdgeFactory"


class BaseLayout {
  constructor() {
    this.canvas = null


    this.nodes = []
    this.edges = []
    this.leafs = []


    this.currentLayoutState = null


    this.layoutInfo = {
      x: 0,
      y: 0,
      cx: 0,
      cy: 0,
      w: 0,
      h: 0,
    }


    this.tree = null


    this.layoutReferences = []
  }


  async loadAdditionalGridDataAsync() {
    const existingNodeIds = this.nodes.map((n) => n.id)
    const additionalNodes = this.nodeData.filter((n) => !existingNodeIds.includes(n.id))

    if (additionalNodes.length) {
      const ids = additionalNodes.map((n) => n.id)
      const { data: nodes } = await Request(`${this.config.databaseUrl}/${this.config.nodeEndpoint}`, ids)

      this.createRepresentations(nodes)
    }

    return this
  }

  async loadInitialGridDataAsync() {
    const limit = this.config.limitNodes ? this.config.limitNodes : this.nodeData.length

    const ids = this.nodeData.map((n) => n.id).slice(0, limit)
    if (ids.length) {
      const { data: nodes } = await Request(`${this.config.databaseUrl}/${this.config.nodeEndpoint}`, ids)
      this.createRepresentations(nodes)
    }

    return this
  }

  async removeGridDataAsync(newGraph) {
    const nodes = newGraph.getNodes().map((n) => n.id)
    this.removeRepresentation(nodes)
  }

  async updateGraphStructure(newGraph, newConfiguration) {
    this.nodeData = newGraph.getNodes()
    this.edgeData = newGraph.getEdges()

    this.removeGridDataAsync(newGraph)

    this.config = { ...this.config, ...newConfiguration }

    if (newConfiguration.limitColumns) {
      this.removeLayout()
    }

    return this
  }

  async updateLayoutConfiguration(newConfiguration) {
    this.config = { ...this.config, ...newConfiguration }

    if (newConfiguration.limitColumns) {
      this.removeLayout()
    }
    return this
  }


  async loadInitialContextualDataAsync() {
    // load focus and assigned info
    const request1 = [
      {
        url: `${this.config.databaseUrl}/${this.config.nodeEndpoint}`,
        body: [this.focusId],
      },
      {
        url: `${this.config.databaseUrl}/${this.config.contextualRelationshipEndpoint}`,
        body: [this.focusId],
      },
    ]

    const response1 = await RequestMultiple(request1)

    const focus = response1[0].data[0]
    const assignedInfo = response1[1].data


    // load parents, children, assigned, risks and edges
    const parentIds = focus.parent !== null
      ? focus.parent instanceof Array ? focus.parent : [focus.parent]
      : []
    const childrenIds = focus.children
    const assignedId = assignedInfo.assigned
    const riskIds = assignedInfo !== []
      ? [...assignedInfo.risks]
      : []

    const parentEdges = parentIds.map((id) => ({ fromNode: this.focusId, toNode: id }))
    const childrenEdges = childrenIds.map((id) => ({ fromNode: id, toNode: this.focusId }))

    const request2 = [
      {
        url: `${this.config.databaseUrl}/${this.config.nodeEndpoint}`,
        body: [...parentIds, ...childrenIds, assignedId, ...riskIds],
      },
      {
        url: `${this.config.databaseUrl}/${this.config.edgeEndpoint}`,
        body: [...parentEdges, ...childrenEdges],
      },
    ]

    const response2 = await RequestMultiple(request2)
    const nodes = response2[0].data
    const edges = response2[1].data
    console.log(nodes, edges)


    // console.log(this.focusId)
    console.log(parentIds)
    console.log(childrenIds)
    console.log(assignedId)
    console.log(riskIds)
    console.log(parentEdges)
    console.log(childrenEdges)


    return this
  }


  removeLayout() {
    this.nodes.forEach((node) => {
      node.removeNode()
    })

    // grid
    if (this.expander) {
      this.expander.removeNode()
    }

    this.nodes = []


    // this.edges.forEach((edge) => {
    //   edge.removeEdge()
    // })

    // this.leafs.forEach((leaf) => {
    //   leaf.removeLeaf()
    // })
  }


  createRepresentations(nodes = [], edges = [], renderingSize = this.config.renderingSize) {
    nodes.forEach((rawNode) => {
      const node = NodeFactory.create(rawNode, this.canvas)
      node.setNodeSize(renderingSize)
      this.nodes.push(node)
    })

    edges.forEach((rawEdge) => {
      const edge = EdgeFactory.create(rawEdge, this.canvas)
      this.nodes.push(edge)
    })
  }

  removeRepresentation(nodes = [], edges = []) {
    this.nodes = this.nodes.filter((node) => {
      if (!nodes.includes(node.getId())) {
        node.removeNode(undefined, undefined, { animation: false })
        return false
      }
      return true
    })

    // this.edges = this.nodes.filter((node) => {
    //   if (!nodes.includes(node.getId())) {
    //     node.removeNode(undefined, undefined, { animation: false })
    //     return false
    //   }
    //   return true
    // })
  }


  async createContextualDataAsync(nodeData, edgeData) {
    this.nodeData = nodeData
    this.edgeData = edgeData


    // in order to load parents and children, the data of the focus node has to be loaded first
    const focusNode = this.nodeData.find((n) => n.id === this.startNodeId)
    const focusFetchUrl = `${this.config.databaseUrl}/nodes?id=${focusNode.id}`
    const fetchedFocus = await fetch(focusFetchUrl).then((data) => data.json())
    this.createNodeFromData(fetchedFocus[0], "max")
    this.focus = this.nodes.find((n) => n.id === this.startNodeId)


    // load parents and children passed on edges inside the graph structure
    const parentChildNodeIds = this.edgeData.map((e) => {
      if (e.startNodeId === this.startNodeId) {
        return e.endNodeId
      }
      if (e.endNodeId === this.startNodeId) {
        return e.startNodeId
      }
      return null
    }).filter((id) => id !== null)
    const mapNodeIdsToUrl = (id) => `id=${id}&`
    const nodeIdsToFetch = parentChildNodeIds.map(mapNodeIdsToUrl).join("").slice(0, -1)
    const nodeFetchUrl = `${this.config.databaseUrl}/nodes?${nodeIdsToFetch}`
    const fetchedNodes = await fetch(nodeFetchUrl).then((data) => data.json())

    fetchedNodes.forEach((rawNode) => {
      this.createNodeFromData(rawNode, "min")
    })
    const parentNodeIds = this.edgeData.filter((e) => e.startNodeId === this.startNodeId).map((e) => e.endNodeId)
    const childNodeIds = this.edgeData.filter((e) => e.endNodeId === this.startNodeId).map((e) => e.startNodeId)
    this.parents = this.nodes.filter((n) => parentNodeIds.includes(n.id))
    this.children = this.nodes.filter((n) => childNodeIds.includes(n.id))


    // here we load attached risks which are attached to a different node
    const assignedNodeDataUrl = `${this.config.databaseUrl}/RiskEdgeConnectionTable?startNodeId=${this.startNodeId}`
    const assignedNodeData = await fetch(assignedNodeDataUrl).then((data) => data.json())
    const assignedNodeId = assignedNodeData[0].endNodeId
    const riskIds = assignedNodeData[0].risks

    const assignedNodeUrl = `${this.config.databaseUrl}/nodes?id=${assignedNodeId}`
    const assignedNode = await fetch(assignedNodeUrl).then((data) => data.json())
    this.createNodeFromData(assignedNode[0], "min")
    this.assginedNode = this.nodes.find((n) => n.id === assignedNodeId)

    const riskIdsToFetch = riskIds.map(mapNodeIdsToUrl).join("").slice(0, -1)
    const riskFetchUrl = `${this.config.databaseUrl}/nodes?${riskIdsToFetch}`
    const fetchedRisks = await fetch(riskFetchUrl).then((data) => data.json())

    fetchedRisks.forEach((rawNode) => {
      this.createNodeFromData(rawNode, "min")
    })
    this.risks = this.nodes.filter((n) => riskIds.includes(n.id))
    const config = {
      color1: "#F26A7C", color2: "#F26A7C", labelTranslateY: -20, labelColor: "#ff8e9e",
    }
    const connection = new BoldEdge(this.canvas, this.focus, this.assginedNode, config)
    connection.setLabel("associated")
    this.edges.push(connection)


    // load edges
    const parentChildEdges = this.edgeData.filter((e) => {
      if (e.startNodeId === this.startNodeId) {
        return true
      }
      if (e.endNodeId === this.startNodeId) {
        return true
      }
      return false
    })

    // fetch edges based on given ids
    const mapEdgeIdsToUrl = (n) => `endNodeId=${n.endNodeId}&startNodeId=${n.startNodeId}&`
    const edgeIdsToFetch = parentChildEdges.map(mapEdgeIdsToUrl).join("").slice(0, -1)
    const edgeFetchUrl = `${this.config.databaseUrl}/edges?${edgeIdsToFetch}`
    const fetchedEdges = await fetch(edgeFetchUrl).then((data) => data.json())

    // create new edges
    fetchedEdges.forEach((rawEdge) => {
      const fromNode = this.nodes.find((n) => n.id === rawEdge.startNodeId)
      const toNode = this.nodes.find((n) => n.id === rawEdge.endNodeId)

      let edge = null
      if (rawEdge.type === "solid") edge = new ThinEdge(this.canvas, fromNode, toNode, { type: "solid" })
      else if (rawEdge.type === "dashed") edge = new ThinEdge(this.canvas, fromNode, toNode, { type: "dashed" })
      else if (rawEdge.type === "bold") edge = new BoldEdge(this.canvas, fromNode, toNode, { type: "bold" })
      else edge = new ThinEdge(this.canvas, fromNode, toNode, { type: "solid" })

      fromNode.addOutgoingEdge(edge)
      toNode.addIncomingEdge(edge)
      edge.setLabel(rawEdge.label)
      this.edges.push(edge)
    })


    // re-calculate and re-render layout
    this.calculateLayout()
    this.renderLayout()
  }

  async manageContextualDataAsync(clickedNode) {
    // remove all elements but the clicked node
    const removedNodes = []
    const nodesToRemove = this.nodes // .filter((n) => n.id !== clickedNode.id)
    const X = this.focus.getFinalX()
    const Y = this.focus.getFinalY()

    // remove children
    nodesToRemove.forEach((child) => {
      child.removeNode(X, Y)
      removedNodes.push(child.id)
    })
    clickedNode.setChildren([])
    // this.nodes = this.nodes.filter((node) => !removedNodes.includes(node.id))
    this.nodes = []


    // remove containers
    this.containers.forEach((container) => {
      container.removeContainer(X, Y)
    })
    this.containers = []

    // remove edges
    this.edges.forEach((edge) => {
      edge.removeEdge(X, Y)
    })
    this.edges = []

    // transform clicked node into max and position it to focus
    // clickedNode.setInitialXY(clickedNode.getFinalX(), clickedNode.getFinalY())
    // clickedNode.transformToMax(X, Y)


    // clear layout
    this.focus = null
    this.parents = []
    this.children = []
    this.assginedNode = null
    this.assignedRisks = []
    this.containers = []

    // this.nodes[0].transformToMax(X, Y)


    // // add data

    this.startNodeId = clickedNode.id
    this.createContextualDataAsync(this.nodeData, this.edgeData)

    // // in order to load parents and children, the data of the focus node has to be loaded first
    // const focusFetchUrl = `${this.config.databaseUrl}/nodes?id=${clickedNode.getId()}`
    // const fetchedFocus = await fetch(focusFetchUrl).then((data) => data.json())
    // console.log(fetchedFocus[0])
    // this.createNodeFromData(fetchedFocus[0], "max")
    // this.focus = this.nodes.find((n) => n.id === fetchedFocus[0].id)


    // // load parents and children edges
    // const parentEdgeFetchUrl = `${this.config.databaseUrl}/edges?startNodeId=${fetchedFocus[0].id}`
    // const childrenEdgeFetchUrl = `${this.config.databaseUrl}/edges?endNodeId=${fetchedFocus[0].id}`
    // const fetchedParentEdges = await fetch(parentEdgeFetchUrl).then((data) => data.json())
    // const fetchedChildrenEdges = await fetch(childrenEdgeFetchUrl).then((data) => data.json())
    // const fetchedEdges = [...fetchedChildrenEdges, ...fetchedParentEdges]


    // // load nodes based on edngNodeIds in edge response
    // const nodeIds = fetchedEdges.map((e) => e.endNodeId)
    // const mapNodeIdsToUrl = (id) => `id=${id}&`
    // const nodeIdsToFetch = nodeIds.map(mapNodeIdsToUrl).join("").slice(0, -1)
    // const nodeFetchUrl = `${this.config.databaseUrl}/nodes?${nodeIdsToFetch}`
    // const fetchedNodes = await fetch(nodeFetchUrl).then((data) => data.json())
    // fetchedNodes.forEach((rawNode) => {
    //   this.createNodeFromData(rawNode, "min")
    // })
    // // console.log(fetchedEdges)

    // const parentNodeIds = fetchedEdges.filter((e) => e.endNodeId !== clickedNode.id).map((n) => n.endNodeId)
    // const childNodeIds = fetchedEdges.filter((e) => e.startNodeId !== clickedNode.id).map((n) => n.startNodeId)
    // this.parents = this.nodes.filter((n) => parentNodeIds.includes(n.id))
    // this.children = this.nodes.filter((n) => childNodeIds.includes(n.id))
    // console.log(childNodeIds, this.nodes)
    // // // this.parents = this.nodes.filter((n) => parentNodeIds.includes(n.id))
    // // // this.children = this.nodes.filter((n) => childNodeIds.includes(n.id))


    // create new edges
    // fetchedEdges.forEach((rawEdge) => {
    //   const fromNode = this.nodes.find((n) => n.id === rawEdge.startNodeId)
    //   const toNode = this.nodes.find((n) => n.id === rawEdge.endNodeId)

    //   let edge = null
    //   if (rawEdge.type === "solid") edge = new ThinEdge(this.canvas, fromNode, toNode, { type: "solid" })
    //   else if (rawEdge.type === "dashed") edge = new ThinEdge(this.canvas, fromNode, toNode, { type: "dashed" })
    //   else if (rawEdge.type === "bold") edge = new BoldEdge(this.canvas, fromNode, toNode, { type: "bold" })
    //   else edge = new ThinEdge(this.canvas, fromNode, toNode, { type: "solid" })

    //   fromNode.addOutgoingEdge(edge)
    //   toNode.addIncomingEdge(edge)
    //   edge.setLabel(rawEdge.label)
    //   this.edges.push(edge)
    // })

    // load parents and children passed on those edges
    // console.log(fetchedEdges)
  }

  createNodeFromData(data, renderingSize) {
    let node
    if (data.type === "risk") node = new RiskNode(data, this.canvas)
    if (data.type === "asset") node = new AssetNode(data, this.canvas)
    if (data.type === "custom") node = new CustomNode(data, this.canvas)
    if (data.type === "requirement") node = new RequirementNode(data, this.canvas)
    if (data.type === "control") node = new ControlNode(data, this.canvas)

    // sets the currently used rendering size
    node.setNodeSize(renderingSize)
    if (data.type === "control") {
      node.addEvent("dblclick", () => { this.manageContextualDataAsync(node) })
    }

    this.nodes.push(node)
  }


  async createRadialDataAsync(nodeData, edgeData) { // FIXME: ask: what if an edge dose not exist?
    this.nodeData = nodeData
    this.edgeData = edgeData


    // find children ids that we need to fetch
    const mapNodeIdsToUrl = (n) => `id=${n.id}&`
    const nodeIdsToFetch = nodeData.map(mapNodeIdsToUrl).join("").slice(0, -1)
    const nodeFetchUrl = `${this.config.databaseUrl}/nodes?${nodeIdsToFetch}`
    const fetchedNodes = await fetch(nodeFetchUrl).then((data) => data.json())


    // create new nodes
    fetchedNodes.forEach((rawNode) => {
      let node
      if (rawNode.type === "risk") node = new RiskNode(rawNode, this.canvas)
      if (rawNode.type === "asset") node = new AssetNode(rawNode, this.canvas)
      if (rawNode.type === "custom") node = new CustomNode(rawNode, this.canvas)
      if (rawNode.type === "requirement") node = new RequirementNode(rawNode, this.canvas)
      if (rawNode.type === "control") node = new ControlNode(rawNode, this.canvas)

      // sets the currently used rendering size
      node.setNodeSize(this.config.renderingSize)
      node.addEvent("dblclick", () => { this.manageTreeDataAsync(node) })

      this.nodes.push(node)
    })


    // construct a tree data structure to generate edges and calculate node positions
    const constructTree = (array, parentRef, rootRef) => {
      let root = rootRef !== undefined ? rootRef : []
      const parent = parentRef !== undefined ? parentRef : { id: null }
      const children = array.filter((child) => child.parentId === parent.id)
      if (children.length > 0) {
        if (parent.id === null) {
          root = children
        } else {
          parent.children = children
        }

        children.forEach((child) => {
          constructTree(array, child)
        })
      }
      return root
    }
    const tree = constructTree(fetchedNodes)[0] // FIXME: where is the root?


    // find edges that the layout needs
    const createEdges = (root, edgeList) => {
      if (root.children) {
        root.children.forEach((child) => {
          edgeList.push({ startNodeId: child.id, endNodeId: root.id })
          createEdges(child, edgeList)
        })
      }
      return edgeList
    }
    const requiredEdges = [...new Set(createEdges(tree, []))]


    // fetch edges based on given ids
    const mapEdgeIdsToUrl = (n) => `endNodeId=${n.endNodeId}&startNodeId=${n.startNodeId}&`
    const edgeIdsToFetch = requiredEdges.map(mapEdgeIdsToUrl).join("").slice(0, -1)
    const edgeFetchUrl = `${this.config.databaseUrl}/edges?${edgeIdsToFetch}`
    const fetchedEdges = await fetch(edgeFetchUrl).then((data) => data.json())


    // create new edges
    fetchedEdges.forEach((rawEdge) => {
      const fromNode = this.nodes.find((n) => n.id === rawEdge.startNodeId)
      const toNode = this.nodes.find((n) => n.id === rawEdge.endNodeId)


      let edge = null
      if (rawEdge.type === "solid") edge = new ThinEdge(this.canvas, fromNode, toNode, { type: "solid" })
      else if (rawEdge.type === "dashed") edge = new ThinEdge(this.canvas, fromNode, toNode, { type: "dashed" })
      else if (rawEdge.type === "bold") edge = new BoldEdge(this.canvas, fromNode, toNode, { type: "bold" })
      else edge = new ThinEdge(this.canvas, fromNode, toNode, { type: "solid" })

      fromNode.addOutgoingEdge(edge)
      toNode.addIncomingEdge(edge)
      edge.setLabel(rawEdge.label)
      this.edges.push(edge)
    })


    // re-calculate and re-render layout
    this.calculateLayout()
    this.renderLayout()
  }


  async manageTreeDataAsync(clickedNode) {
    const BFS = (root) => {
      const remove = []
      const queue = []

      queue.push(root)


      while (queue.length) {
        const current = queue.shift()
        if (current.id !== root.id) {
          remove.push(current)
        }

        current.children.forEach((child) => {
          if (!queue.includes(child)) {
            queue.push(child)
          }
        })
      }

      return remove
    }

    // skip, if node has no children
    if (clickedNode.childrenIds.length === 0) {
      return
    }


    const isAddOperation = clickedNode.children.map((child) => child.svg).length === 0

    // add new data
    if (isAddOperation) {
      // find children ids that we need to fetch
      const requestedNodes = []
      const existingNodes = this.nodes.map((n) => n.id)
      clickedNode.childrenIds.forEach((id) => {
        if (!existingNodes.includes(id)) {
          requestedNodes.push(id)
        }
      })

      // remove leafs (tree specific)
      this.leafs.forEach((leafe) => {
        leafe.removeLeaf(clickedNode.getFinalX(), clickedNode.getFinalY())
      })
      this.leafs = []


      // fetch children based on given ids
      const mapNodeIdsToUrl = (id) => `id=${id}&`
      const nodeIdsToFetch = requestedNodes.map(mapNodeIdsToUrl).join("").slice(0, -1)
      const nodeFetchUrl = `${this.config.databaseUrl}/nodes?${nodeIdsToFetch}`
      const fetchedNodes = await fetch(nodeFetchUrl).then((data) => data.json())


      // create new children nodes
      fetchedNodes.forEach((rawNode) => {
        let node
        if (rawNode.type === "risk") node = new RiskNode(rawNode, this.canvas)
        if (rawNode.type === "asset") node = new AssetNode(rawNode, this.canvas)
        if (rawNode.type === "custom") node = new CustomNode(rawNode, this.canvas)
        if (rawNode.type === "requirement") node = new RequirementNode(rawNode, this.canvas)
        if (rawNode.type === "control") node = new ControlNode(rawNode, this.canvas)

        // sets the currently used rendering size
        node.setNodeSize(this.config.renderingSize)
        node.addEvent("dblclick", () => { this.manageTreeDataAsync(node) })

        this.nodes.push(node)
      })


      // find edges between new children and clicked node
      const requiredEdges = []
      fetchedNodes.forEach((node) => {
        requiredEdges.push({ startNodeId: node.id, endNodeId: clickedNode.id })
      })


      // fetch edges based on given ids
      const mapEdgeIdsToUrl = (n) => `endNodeId=${n.endNodeId}&startNodeId=${n.startNodeId}&`
      const edgeIdsToFetch = requiredEdges.map(mapEdgeIdsToUrl).join("").slice(0, -1)
      const edgeFetchUrl = `${this.config.databaseUrl}/edges?${edgeIdsToFetch}`
      const fetchedEdges = await fetch(edgeFetchUrl).then((data) => data.json())


      // create new edges
      fetchedEdges.forEach((rawEdge) => {
        const fromNode = this.nodes.find((n) => n.id === rawEdge.startNodeId)
        const toNode = this.nodes.find((n) => n.id === rawEdge.endNodeId)


        let edge = null
        if (rawEdge.type === "solid") edge = new ThinEdge(this.canvas, fromNode, toNode, { type: "solid" })
        else if (rawEdge.type === "dashed") edge = new ThinEdge(this.canvas, fromNode, toNode, { type: "dashed" })
        else if (rawEdge.type === "bold") edge = new BoldEdge(this.canvas, fromNode, toNode, { type: "bold" })
        else edge = new ThinEdge(this.canvas, fromNode, toNode, { type: "solid" })

        fromNode.addOutgoingEdge(edge)
        toNode.addIncomingEdge(edge)
        edge.setLabel(rawEdge.label)
        this.edges.push(edge)
      })


      // re-calculate and re-render layout
      this.calculateLayout()
      this.renderLayout()
    }

    // remove existing data
    if (isAddOperation === false) {
      // find children ids that we need to remove
      const removedNodes = []
      const nodesToRemove = BFS(clickedNode)
      const X = clickedNode.getFinalX()
      const Y = clickedNode.getFinalY()


      // remove children
      nodesToRemove.forEach((child) => {
        child.removeNode(X, Y)
        removedNodes.push(child.id)
      })
      clickedNode.setChildren([])
      this.nodes = this.nodes.filter((node) => !removedNodes.includes(node.id))


      // find edges that we need to remove
      const edgesToRemove = [...nodesToRemove.map((n) => n.outgoingEdges)].flat()
      const edgesToBeUpdated = []
      this.edges.forEach((edge) => {
        if (edgesToRemove.includes(edge) === false) {
          edgesToBeUpdated.push(edge)
        }
      })


      // remove edges
      edgesToRemove.forEach((edge) => {
        edge.removeEdge(clickedNode.getFinalX(), clickedNode.getFinalY())
      })
      this.edges = []
      this.edges = [...edgesToBeUpdated]


      // remove leafs (tree specific)
      this.leafs.forEach((leafe) => {
        leafe.removeLeaf(clickedNode.getFinalX(), clickedNode.getFinalY())
      })
      this.leafs = []

      // re-calculate and re-render layout
      this.calculateLayout()
      this.renderLayout()


      // update existing edges
      this.edges.forEach((edge) => {
        edge.updateEdgePosition()
      })
    }
  }

  setLayoutReferences(layoutReferences) {
    this.layoutReferences = layoutReferences
  }

  getLayoutReferences() {
    return this.layoutReferences
  }


  setConfig(config) {
    this.config = { ...this.config, ...config }
  }

  getConfig(key) {
    return this.config[key]
  }

  setCanvas(canvas) {
    this.canvas = canvas.nested()
  }


  setNodes(nodes) {
    this.nodes = nodes
  }

  getNodes() {
    return this.nodes
  }

  getEdges() {
    return this.edges
  }

  setEdges(edges) {
    this.edges = edges
  }

  setNodeData(nodeData) {
    this.nodeData = nodeData
  }

  getNodeData() {
    return this.nodeData
  }

  setEdgeData(edgeData) {
    this.edgeData = edgeData
  }

  getEdgeData() {
    return this.edgeData
  }
}


export default BaseLayout
