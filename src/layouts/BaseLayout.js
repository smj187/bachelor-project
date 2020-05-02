/* eslint-disable no-nested-ternary */
import RiskNode from "../nodes/RiskNode"
import AssetNode from "../nodes/AssetNode"
import RequirementNode from "../nodes/RequirementNode"
import CustomNode from "../nodes/CustomNode"
import ControlNode from "../nodes/ControlNode"
import ThinEdge from "../edges/ThinEdge"
import BoldEdge from "../edges/BoldEdge"

import { Request, RequestMultiple } from "../utils/HttpRequests"
import { constructTree } from "../utils/TreeConstruction"
import NodeFactory from "../nodes/NodeFactory"
import EdgeFactory from "../edges/EdgeFactory"


/**
 * This is the base class for layouts.
 * @property {Object} additionalNodeRepresentations An object containing additional node representations.
 * @property {Object} additionalEdgeRepresentations An object containing additional edge representations.
 */
class BaseLayout {
  constructor(additionalNodeRepresentations, additionalEdgeRepresentations) {
    this.layoutIdentifier = null
    this.canvas = null


    this.nodes = []
    this.edges = []
    this.leafs = []
    this.events = []

    this.currentLayoutState = null

    if (additionalNodeRepresentations !== undefined) {
      this.additionalNodeRepresentations = {
        asset: additionalNodeRepresentations.asset || {},
        control: additionalNodeRepresentations.control || {},
        custom: additionalNodeRepresentations.custom || {},
        requirement: additionalNodeRepresentations.requirement || {},
        risk: additionalNodeRepresentations.risk || {},
      }
    } else {
      this.additionalNodeRepresentations = {}
    }

    if (additionalEdgeRepresentations != undefined) {
      this.additionalEdgeRepresentations = {
        thinEdge: additionalEdgeRepresentations.thinEdge || {},
        boldEdge: additionalEdgeRepresentations.boldEdge || {},
        customEdge: additionalEdgeRepresentations.customEdge || {},
      }
    } else {
      this.additionalEdgeRepresentations = {}
    }


    this.layoutInfo = {
      x: 0,
      y: 0,
      cx: 0,
      cy: 0,
      w: 0,
      h: 0,
    }

    this.initialOffset = 0


    this.tree = null


    this.layoutReferences = []
  }



  // GRID
  async loadAdditionalGridDataAsync() {
    const arr1 = this.nodeData.map((n) => n.id)
    const arr2 = this.nodes.map((n) => n.id)
    const difference = arr1.filter((x) => !arr2.includes(x))


    if (difference.length) {
      const response = await Request(`${this.config.databaseUrl}/${this.config.nodeEndpoint}`, difference)
      this.createRepresentations(response)
    }

    return this
  }

  async loadInitialGridDataAsync() {
    const limit = this.config.limitNodes ? this.config.limitNodes : this.nodeData.length
    const ids = this.nodeData.map((n) => n.id).slice(0, limit)
    if (ids.length) {
      const response = await Request(`${this.config.databaseUrl}/${this.config.nodeEndpoint}`, ids)
      this.createRepresentations(response)
    }

    return this
  }

  async updateGridDataWithConfigAsync(newGraph, newConfiguration) {
    this.nodeData = newGraph.getNodes()
    this.edgeData = newGraph.getEdges()

    const nodes = newGraph.getNodes().map((n) => n.id)
    this.removeRepresentation(nodes)

    this.config = { ...this.config, ...newConfiguration }

    if (newConfiguration.limitColumns) {
      await this.removeLayoutAsync()
    }

    return this
  }


  /**
   * Loads the initial tree layout data.
   * @async
   */
  async loadInitialTreeDataAsync() {

    // first, load the root node
    const response1 = await Request(`${this.config.databaseUrl}/${this.config.nodeEndpoint}`, [this.rootId])
    const root = response1[0] || null
    if (root === null) {
      throw new Error(`Failed to load root id ${this.rootId}.`)
    }


    // unfortunately make a request for each depth level
    let nodes = [root]
    let childNodeIds = root.children
    for (let i = 0; i < this.renderDepth && childNodeIds.length > 0; i += 1) {
      const response = await Request(`${this.config.databaseUrl}/${this.config.nodeEndpoint}`, childNodeIds)
      const children = response
      childNodeIds = children.map((c) => c.children).flat()
      nodes.push(children)
    }

    // create fake root
    nodes = nodes.flat()
    nodes.find((n) => n.id === this.rootId).parent = null


    // construct a tree data structure to generate edges and calculate node positions
    const trees = constructTree(nodes)


    // search for the root tree node
    let tree = null
    const searchRootRecursive = (root, currentRootId) => {
      if (root.id === currentRootId) {
        tree = root
        return root
      }
      root.children.forEach((child) => {
        searchRootRecursive(child, currentRootId)
      })
    }

    trees.forEach((tree) => searchRootRecursive(tree, this.rootId))

    if (tree === null) {
      throw new Error(`Failed to create tree. Root ${this.rootId} was not found within the provided data.`)
    }


    // transform children deeper than the current render depth to "invisible" children
    const checkVisibilityRecursive = (node, visibleNodeLimit) => {
      if (isNaN(node)) {
        node.visible = true
        if (node.children.length < visibleNodeLimit) {
          node.children.forEach((child) => {
            checkVisibilityRecursive(child, visibleNodeLimit)
          })
        } else {
          const ids = node.children.map((n) => (isNaN(n) ? n.id : n))
          nodes = nodes.filter((n) => !ids.includes(n.id))
          node.invisibleChildren = ids
          node.children = []
        }
      }
    }
    checkVisibilityRecursive(tree, this.config.visibleNodeLimit)



    // calculate unique edges between the nodes
    const createEdgeConnections = (root, edgeList) => {
      if (root.children) {
        root.children.forEach((child) => {
          edgeList.push({ fromNode: child.id, toNode: root.id })
          createEdgeConnections(child, edgeList)
        })
      }
      return edgeList
    }
    const requiredEdges = [...new Set(createEdgeConnections(tree, []))]


    // only fetch edges known to the graph
    const edgesToFetch = requiredEdges.filter(edge => {
      return this.edgeData.find((e) => e.fromNode === edge.fromNode && e.toNode === e.toNode)
    })

    const edges = await Request(`${this.config.databaseUrl}/${this.config.edgeEndpoint}`, edgesToFetch)


    // create node and edge visualizations
    this.createRepresentations(nodes, edges)

    // fallback: if an edge was not provided, create it manualy as solid edge
    requiredEdges.forEach((e) => {
      const existingEdge = edges.find((x) => x.fromNode === e.fromNode && x.toNode === e.toNode)

      if (existingEdge === undefined) {
        const fromNode = this.nodes.find((n) => n.id === e.fromNode)
        const toNode = this.nodes.find((n) => n.id === e.toNode)

        if (fromNode !== undefined && toNode !== undefined) {

          const edge = EdgeFactory.create(
            { type: "solid", config: { animationSpeed: this.config.animationSpeed } },
            this.canvas,
            fromNode,
            toNode,
            this.additionalEdgeRepresentations,
          )
          // dont add a label
          edge.setLabel(null)
          edge.setLayoutId(this.layoutIdentifier)
          this.edges.push(edge)
        }
      }
    })

    return this
  }


  /**
   * Performs an add or removal operations.
   * @param {BaseNode} clickedNode The clicked node.
   * @async
   */
  async updateTreeDataAsync(clickedNode) {

    // if the clicked node has no renderd children, its an add operation, else its a remove operation
    const isAddOperation = clickedNode.children.map((child) => child.svg).length === 0

    // remove operation
    if (isAddOperation === false) {

      // find nodes for removal
      const nodesToRemove = []
      const queue = [clickedNode]
      while (queue.length) {
        const currentNode = queue.shift()

        if (clickedNode.id !== currentNode.id) {
          nodesToRemove.push(currentNode)
          currentNode.removeSVG()
        }
        currentNode.children.forEach((child) => queue.push(child))
      }

      // update current information
      clickedNode.setChildren([])
      this.nodes = this.nodes.filter((node) => !nodesToRemove.map(n => n.id).includes(node.id))


      // find edges that we need to remove and update
      const edgesToRemove = [...nodesToRemove.map((n) => n.outgoingEdges)].flat()
      const edgesToBeUpdated = []
      this.edges.forEach((edge) => {
        if (edgesToRemove.includes(edge) === false) {
          edgesToBeUpdated.push(edge)
        } else {
          edge.removeSVG()
        }
      })

      // update current information
      this.edges = []
      this.edges = [...edgesToBeUpdated]
    }


    // add operation
    if (isAddOperation === true) {
      if (clickedNode.childrenIds.length === 0) return

      const requestedNodes = clickedNode.childrenIds.map((n) => (isNaN(n) ? n.id : n))
      const nodes = await Request(`${this.config.databaseUrl}/${this.config.nodeEndpoint}`, requestedNodes)

      // find edges between new children and clicked node
      const requiredEdges = []
      nodes.forEach((node) => requiredEdges.push({ fromNode: node.id, toNode: clickedNode.id }))

      // only fetch edges known to the graph
      const edgesToFetch = requiredEdges.filter(edge => {
        return this.edgeData.find((e) => e.fromNode === edge.fromNode && e.toNode === e.toNode)
      })
      const edges = await Request(`${this.config.databaseUrl}/${this.config.edgeEndpoint}`, edgesToFetch)

      // create node and edge visualizations
      this.createRepresentations(nodes, edges)

      // fallback: if an edge was not provided, create it manualy as solid edge
      requiredEdges.forEach((e) => {
        const existingEdge = edges.find((x) => x.fromNode === e.fromNode && x.toNode === e.toNode)

        if (existingEdge === undefined) {
          const fromNode = this.nodes.find((n) => n.id === e.fromNode)
          const toNode = this.nodes.find((n) => n.id === e.toNode)

          if (fromNode !== undefined && toNode !== undefined) {

            const edge = EdgeFactory.create(
              { type: "solid", config: { animationSpeed: this.config.animationSpeed } },
              this.canvas,
              fromNode,
              toNode,
              this.additionalEdgeRepresentations,
            )
            // dont add a label
            edge.setLabel(null)
            edge.setLayoutId(this.layoutIdentifier)
            this.edges.push(edge)
          }
        }
      })
    }

    this.updateLayoutsToTheRight(clickedNode)


    const coords = clickedNode.coords[clickedNode.coords.length - 1]
    const x = coords[0]
    const y = coords[1]

    this.renderLayout({ isReRender: true, x, y })
  }


  /**
   * Rebuilds the entire tree layout.
   * @async
   */
  async rebuildTreeLayout() {
    await this.removeLayoutAsync()
    await this.loadInitialTreeDataAsync()
  }


  /**
   * Updates all layouts to the right if necessary.
   */
  updateLayoutsToTheRight({ isReRender = false }) {
    const index = this.layoutReferences.indexOf(this)
    const layouts = this.layoutReferences.slice(0, index)
    const offset = layouts.map((l) => l.layoutInfo.w).reduce((a, b) => a + b, 0)

    const prevInfo = this.layoutInfo
    this.calculateLayout(offset, { isReRender: true })
    const w = this.layoutInfo.w + this.config.translateX

    // update all layouts right side
    this.layoutReferences.forEach((llayout, i) => {
      if (i > index) {

        llayout.calculateLayout(llayout.initialOffset + (w - prevInfo.w), {})
        llayout.renderLayout({})
      }
    })

    if (isReRender === true) {
      this.renderLayout({})
    }
  }













  // RADIAL
  async loadInitialRadialDataAsync() {

    // first, load the root node
    const response1 = await Request(`${this.config.databaseUrl}/${this.config.nodeEndpoint}`, [this.rootId])
    const root = response1[0] || null
    if (root === null) {
      throw new Error(`Failed to load root id ${this.rootId}.`)
    }


    // unfortunately make a request for each depth level
    let nodes = [root]
    let childNodeIds = root.children
    for (let i = 0; i < this.renderDepth && childNodeIds.length > 0; i += 1) {
      const response = await Request(`${this.config.databaseUrl}/${this.config.nodeEndpoint}`, childNodeIds)
      const children = response
      childNodeIds = children.map((c) => c.children).flat()
      nodes.push(children)
    }

    // create fake root
    nodes = nodes.flat()
    nodes.find((n) => n.id === this.rootId).parent = null


    // construct a tree data structure to generate edges and calculate node positions
    const trees = constructTree(nodes)


    // search for the root tree node
    let tree = null
    const searchRootRecursive = (root, currentRootId) => {
      if (root.id === currentRootId) {
        tree = root
        return root
      }
      root.children.forEach((child) => {
        searchRootRecursive(child, currentRootId)
      })
    }

    trees.forEach((tree) => searchRootRecursive(tree, this.rootId))

    if (tree === null) {
      throw new Error(`Failed to create tree. Root ${this.rootId} was not found within the provided data.`)
    }


    // transform children deeper than the current render depth to "invisible" children
    const checkVisibilityRecursive = (node, visibleNodeLimit) => {
      if (isNaN(node)) {
        node.visible = true
        if (node.children.length < visibleNodeLimit) {
          node.children.forEach((child) => {
            checkVisibilityRecursive(child, visibleNodeLimit)
          })
        } else {
          const ids = node.children.map((n) => (isNaN(n) ? n.id : n))
          nodes = nodes.filter((n) => !ids.includes(n.id))
          node.invisibleChildren = ids
          node.children = []
        }
      }
    }
    checkVisibilityRecursive(tree, this.config.visibleNodeLimit)



    // calculate unique edges between the nodes
    const createEdgeConnections = (root, edgeList) => {
      if (root.children) {
        root.children.forEach((child) => {
          edgeList.push({ fromNode: child.id, toNode: root.id })
          createEdgeConnections(child, edgeList)
        })
      }
      return edgeList
    }
    const requiredEdges = [...new Set(createEdgeConnections(tree, []))]


    // only fetch edges known to the graph
    const edgesToFetch = requiredEdges.filter(edge => {
      return this.edgeData.find((e) => e.fromNode === edge.fromNode && e.toNode === e.toNode)
    })

    const edges = await Request(`${this.config.databaseUrl}/${this.config.edgeEndpoint}`, edgesToFetch)


    // create node and edge visualizations
    this.createRepresentations(nodes, edges)

    // fallback: if an edge was not provided, create it manualy as solid edge
    requiredEdges.forEach((e) => {
      const existingEdge = edges.find((x) => x.fromNode === e.fromNode && x.toNode === e.toNode)

      if (existingEdge === undefined) {
        const fromNode = this.nodes.find((n) => n.id === e.fromNode)
        const toNode = this.nodes.find((n) => n.id === e.toNode)

        if (fromNode !== undefined && toNode !== undefined) {

          const edge = EdgeFactory.create(
            { type: "solid", config: { animationSpeed: this.config.animationSpeed } },
            this.canvas,
            fromNode,
            toNode,
            this.additionalEdgeRepresentations,
          )
          // dont add a label
          edge.setLabel(null)
          edge.setLayoutId(this.layoutIdentifier)
          this.edges.push(edge)
        }
      }
    })

    return this
  }

  async updateRadialDataAsync(clickedNode) {
    // if the clicked node has no renderd children, its an add operation, else its a remove operation
    const isAddOperation = clickedNode.children.map((child) => child.svg).length === 0

    // remove operation
    if (isAddOperation === false) {

      // find nodes for removal
      const nodesToRemove = []
      const queue = [clickedNode]
      while (queue.length) {
        const currentNode = queue.shift()

        if (clickedNode.id !== currentNode.id) {
          nodesToRemove.push(currentNode)
          currentNode.removeSVG()
        }
        currentNode.children.forEach((child) => queue.push(child))
      }

      // update current information
      clickedNode.setChildren([])
      this.nodes = this.nodes.filter((node) => !nodesToRemove.map(n => n.id).includes(node.id))


      // find edges that we need to remove and update
      const edgesToRemove = [...nodesToRemove.map((n) => n.outgoingEdges)].flat()
      const edgesToBeUpdated = []
      this.edges.forEach((edge) => {
        if (edgesToRemove.includes(edge) === false) {
          edgesToBeUpdated.push(edge)
        } else {
          edge.removeSVG()
        }
      })

      // update current information
      this.edges = []
      this.edges = [...edgesToBeUpdated]
    }


    // add operation
    if (isAddOperation === true) {
      if (clickedNode.childrenIds.length === 0) return

      const requestedNodes = clickedNode.childrenIds.map((n) => (isNaN(n) ? n.id : n))
      const nodes = await Request(`${this.config.databaseUrl}/${this.config.nodeEndpoint}`, requestedNodes)

      // find edges between new children and clicked node
      const requiredEdges = []
      nodes.forEach((node) => requiredEdges.push({ fromNode: node.id, toNode: clickedNode.id }))

      // only fetch edges known to the graph
      const edgesToFetch = requiredEdges.filter(edge => {
        return this.edgeData.find((e) => e.fromNode === edge.fromNode && e.toNode === e.toNode)
      })
      const edges = await Request(`${this.config.databaseUrl}/${this.config.edgeEndpoint}`, edgesToFetch)

      // create node and edge visualizations
      this.createRepresentations(nodes, edges)

      // fallback: if an edge was not provided, create it manualy as solid edge
      requiredEdges.forEach((e) => {
        const existingEdge = edges.find((x) => x.fromNode === e.fromNode && x.toNode === e.toNode)

        if (existingEdge === undefined) {
          const fromNode = this.nodes.find((n) => n.id === e.fromNode)
          const toNode = this.nodes.find((n) => n.id === e.toNode)

          if (fromNode !== undefined && toNode !== undefined) {

            const edge = EdgeFactory.create(
              { type: "solid", config: { animationSpeed: this.config.animationSpeed } },
              this.canvas,
              fromNode,
              toNode,
              this.additionalEdgeRepresentations,
            )
            // dont add a label
            edge.setLabel(null)
            edge.setLayoutId(this.layoutIdentifier)
            this.edges.push(edge)
          }
        }
      })
    }

    this.updateLayoutsToTheRight(clickedNode)


    const coords = clickedNode.coords[clickedNode.coords.length - 1]
    const x = coords[0]
    const y = coords[1]

    this.renderLayout({ isReRender: true, x, y })
  }

  async updateRadialDataWithConfigAsync(newGraph, newConfiguration) {
    this.nodeData = newGraph.getNodes()
    this.edgeData = newGraph.getEdges()


    this.removeRepresentation(this.nodes, this.edges)

    await this.loadInitialRadialDataAsync()


    const index = this.layoutReferences.indexOf(this)
    const layouts = this.layoutReferences.slice(0, index)
    const offset = layouts.map((l) => l.layoutInfo.w).reduce((a, b) => a + b, 0)

    const prevW = this.layoutInfo.w
    this.calculateLayout(offset)

    const newW = this.layoutInfo.w

    // update all layouts right side
    this.layoutReferences.forEach((llayout, i) => {
      if (i > index) {
        llayout.calculateLayout(newW - prevW)
        llayout.renderLayout()
      }
    })

    this.renderLayout()
  }


  async removeLayoutAsync() {
    this.nodeData = []
    this.edgeData = []

    this.nodes.forEach((node) => {
      node.removeSVG()
    })

    this.nodes = []

    this.edges.forEach((edge) => {
      edge.removeSVG()
    })

    this.edges = []

    this.leafs.forEach((leaf) => {
      leaf.removeSVG()
    })

    this.leafs = []

    // grid layout
    if (this.gridExpander) {
      this.gridExpander.removeNode()
    }


    const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))
    await sleep(this.config.animationSpeed + 25)
    this.canvas.clear()
  }

  async updateLayoutConfiguration(newConfiguration) {
    this.config = { ...this.config, ...newConfiguration }

    if (newConfiguration.limitColumns) {
      this.removeLayout()
    }
    return this
  }

  async updateGridLayoutConfiguration(newConfiguration) {
    this.config = { ...this.config, ...newConfiguration }
    console.log("update", this)
  }




  async loadAdditionalContextualDataAsync() {
    // load focus and assigned info

    const request1 = [

      {
        url: `${this.config.databaseUrl}/${this.config.contextualRelationshipEndpoint}`,
        body: [this.focus.id],
      },
    ]
    const response1 = await RequestMultiple(request1)

    const assignedInfo = response1[0].data

    // update focus data


    // load parents, children, assigned, risks and edges
    const parentIds = this.focus.parentId !== null
      ? this.focus.parentId instanceof Array ? this.focus.parentId : [this.focus.parentId]
      : []
    const { childrenIds } = this.focus

    const assignedId = assignedInfo.assigned

    const riskIds = assignedInfo.assigned !== undefined
      ? [...assignedInfo.risks]
      : []

    const parentEdgeIds = parentIds.map((id) => ({ fromNode: this.focus.id, toNode: id }))
    const childEdgeIds = childrenIds.map((id) => ({ fromNode: id, toNode: this.focus.id }))

    const request2 = [
      {
        url: `${this.config.databaseUrl}/${this.config.nodeEndpoint}`,
        body: [...parentIds, ...childrenIds, assignedId, ...riskIds],
      },
      {
        url: `${this.config.databaseUrl}/${this.config.edgeEndpoint}`,
        body: [...parentEdgeIds, ...childEdgeIds],
      },
    ]

    const response2 = await RequestMultiple(request2)
    const nodeData = response2[0].data
    const edgeData = response2[1].data


    // create representations
    this.createRepresentations(nodeData, edgeData, "min")

    // create not existing child and parent edges manually
    const find = (x, e) => x.fromNode === e.fromNode && x.toNode === e.toNode
    const childEdges = edgeData.filter((e) => childEdgeIds.find((x) => find(x, e)))
    const parentEdges = edgeData.filter((e) => parentEdgeIds.find((x) => find(x, e)))

    const checkEdges = (edges, edgeIds) => {
      const existingEdges = edges.map(({ fromNode, toNode }) => ({ fromNode, toNode }))

      edgeIds.forEach((e) => {
        const existingEdge = existingEdges.find((x) => x.fromNode === e.fromNode && x.toNode === e.toNode)
        if (existingEdge === undefined) {
          const fromNode = this.nodes.find((n) => n.id === e.fromNode)
          const toNode = this.nodes.find((n) => n.id === e.toNode)
          const edge = EdgeFactory.create({ type: "bold" }, this.canvas, fromNode, toNode)

          edge.setLabel(null)
          this.edges.push(edge)
        }
      })
    }

    if (childEdges.length < childrenIds.length) {
      checkEdges(childEdges, childEdgeIds)
    }

    if (parentEdges.length < parentEdgeIds.length) {
      checkEdges(parentEdges, parentEdgeIds)
    }


    this.parents = this.nodes.filter((n) => parentIds.includes(n.id)) || []
    this.children = this.nodes.filter((n) => childrenIds.includes(n.id)) || []
    this.assgined = this.nodes.find((n) => n.id === assignedId) || null
    this.risks = this.nodes.filter((n) => riskIds.includes(n.id)) || []
    this.parentEdges = this.edges.filter((e) => {
      const found = parentEdgeIds.find(({ fromNode, toNode }) => fromNode === e.fromNode.id && toNode === e.toNode.id)
      return found
    }) || []

    this.childEdges = this.edges.filter((e) => {
      const found = childEdgeIds.find(({ fromNode, toNode }) => fromNode === e.fromNode.id && toNode === e.toNode.id)
      return found
    }) || []


    const layouts = this.layoutReferences.slice(0, this.layoutReferences.indexOf(this))
    const offset = layouts.map((l) => l.layoutInfo.w).reduce((a, b) => a + b, 0)

    this.calculateLayout(offset)
    this.renderLayout()


    // this.focus.addEvent("click", () => makeFocus(parent))
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

    const parentEdgeIds = parentIds.map((id) => ({ fromNode: this.focusId, toNode: id }))
    const childEdgeIds = childrenIds.map((id) => ({ fromNode: id, toNode: this.focusId }))

    const request2 = [
      {
        url: `${this.config.databaseUrl}/${this.config.nodeEndpoint}`,
        body: [...parentIds, ...childrenIds, assignedId, ...riskIds],
      },
      {
        url: `${this.config.databaseUrl}/${this.config.edgeEndpoint}`,
        body: [...parentEdgeIds, ...childEdgeIds],
      },
    ]

    const response2 = await RequestMultiple(request2)
    const nodeData = response2[0].data
    const edgeData = response2[1].data

    // create representations
    this.createRepresentations(response1[0].data, [], "max")
    this.createRepresentations(nodeData, edgeData, "min")

    // create not existing child and parent edges manually
    const find = (x, e) => x.fromNode === e.fromNode && x.toNode === e.toNode
    const childEdges = edgeData.filter((e) => childEdgeIds.find((x) => find(x, e)))
    const parentEdges = edgeData.filter((e) => parentEdgeIds.find((x) => find(x, e)))

    const checkEdges = (edges, edgeIds) => {
      const existingEdges = edges.map(({ fromNode, toNode }) => ({ fromNode, toNode }))

      edgeIds.forEach((e) => {
        const existingEdge = existingEdges.find((x) => x.fromNode === e.fromNode && x.toNode === e.toNode)

        if (existingEdge === undefined) {
          const fromNode = this.nodes.find((n) => n.id === e.fromNode)
          const toNode = this.nodes.find((n) => n.id === e.toNode)
          const edge = EdgeFactory.create({ type: "bold" }, this.canvas, fromNode, toNode)

          edge.setLabel(null)
          this.edges.push(edge)
        }
      })
    }

    if (childEdges.length < childrenIds.length) {
      checkEdges(childEdges, childEdgeIds)
    }


    if (parentEdges.length < parentEdgeIds.length) {
      checkEdges(parentEdges, parentEdgeIds)
    }


    // assign loaded data
    this.focus = this.nodes.find((n) => n.id === this.focusId)
    this.parents = this.nodes.filter((n) => parentIds.includes(n.id))
    this.children = this.nodes.filter((n) => childrenIds.includes(n.id))
    this.assgined = this.nodes.find((n) => n.id === assignedId)
    this.risks = this.nodes.filter((n) => riskIds.includes(n.id))
    this.parentEdges = this.edges.filter((e) => {
      const found = parentEdgeIds.find(({ fromNode, toNode }) => fromNode === e.fromNode.id && toNode === e.toNode.id)
      return found
    })

    this.childEdges = this.edges.filter((e) => {
      const found = childEdgeIds.find(({ fromNode, toNode }) => fromNode === e.fromNode.id && toNode === e.toNode.id)
      return found
    })


    return this
  }


  createRepresentations(nodes = [], edges = [], renderingSize = this.config.renderingSize) {
    const currentZoomLevel = this.canvas.parent().attr().zoomCurrent
    const currenZoomThreshold = this.canvas.parent().attr().zoomThreshold

    nodes.forEach((rawNode) => {
      const node = NodeFactory.create(
        { ...rawNode, config: { ...rawNode.config, animationSpeed: this.config.animationSpeed } },
        this.canvas,
        this.additionalNodeRepresentations,
      )

      node.setNodeSize(renderingSize)
      this.nodes.push(node)
    })

    edges.forEach((rawEdge) => {
      const fromNode = this.nodes.find((n) => n.id === rawEdge.fromNode)
      const toNode = this.nodes.find((n) => n.id === rawEdge.toNode)
      const type = rawEdge.type || "solid"
      const config = { ...rawEdge.config, animationSpeed: this.config.animationSpeed }
      const edge = EdgeFactory.create({ ...rawEdge, type, config }, this.canvas, fromNode, toNode, this.additionalEdgeRepresentations)

      edge.setLabel(rawEdge.label || null)
      edge.setLayoutId(this.layoutIdentifier)
      this.edges.push(edge)
    })


    if (currentZoomLevel <= currenZoomThreshold) {
      setTimeout(() => { // this sort timeous is unfortunately needed..
        const labels = document.querySelectorAll("#label")
        labels.forEach((doc) => {
          doc.style.opacity = "0"
        })
      }, 1)
    }
  }

  removeRepresentation(nodes = [], edges = []) {
    this.nodes = this.nodes.filter((node) => {
      if (!nodes.includes(node.getId())) {
        node.removeNode(0, 0, { animation: true })
        return false
      }
      return true
    })

    this.edges = this.edges.filter((edge) => {
      if (!edges.includes(edge.id)) {
        edge.removeEdge(0, 0, { animation: false })
        return false
      }
      return true
    })
  }


  async createContextualDataAsync(nodeData, edgeData) {
    this.nodeData = nodeData
    this.edgeData = edgeData


    // in order to load parents and children, the data of the focus node has to be loaded first
    const focusNode = this.nodeData.find((n) => n.id === this.fromNodeId)
    const focusFetchUrl = `${this.config.databaseUrl}/nodes?id=${focusNode.id}`
    const fetchedFocus = await fetch(focusFetchUrl).then((data) => data.json())
    this.createNodeFromData(fetchedFocus[0], "max")
    this.focus = this.nodes.find((n) => n.id === this.fromNodeId)


    // load parents and children passed on edges inside the graph structure
    const parentChildNodeIds = this.edgeData.map((e) => {
      if (e.fromNodeId === this.fromNodeId) {
        return e.toNodeId
      }
      if (e.toNodeId === this.fromNodeId) {
        return e.fromNodeId
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
    const parentNodeIds = this.edgeData.filter((e) => e.fromNodeId === this.fromNodeId).map((e) => e.toNodeId)
    const childNodeIds = this.edgeData.filter((e) => e.toNodeId === this.fromNodeId).map((e) => e.fromNodeId)
    this.parents = this.nodes.filter((n) => parentNodeIds.includes(n.id))
    this.children = this.nodes.filter((n) => childNodeIds.includes(n.id))


    // here we load attached risks which are attached to a different node
    const assignedNodeDataUrl = `${this.config.databaseUrl}/RiskEdgeConnectionTable?fromNodeId=${this.fromNodeId}`
    const assignedNodeData = await fetch(assignedNodeDataUrl).then((data) => data.json())
    const assignedNodeId = assignedNodeData[0].toNodeId
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
      if (e.fromNodeId === this.fromNodeId) {
        return true
      }
      if (e.toNodeId === this.fromNodeId) {
        return true
      }
      return false
    })

    // fetch edges based on given ids
    const mapEdgeIdsToUrl = (n) => `toNodeId=${n.toNodeId}&fromNodeId=${n.fromNodeId}&`
    const edgeIdsToFetch = parentChildEdges.map(mapEdgeIdsToUrl).join("").slice(0, -1)
    const edgeFetchUrl = `${this.config.databaseUrl}/edges?${edgeIdsToFetch}`
    const fetchedEdges = await fetch(edgeFetchUrl).then((data) => data.json())

    // create new edges
    fetchedEdges.forEach((rawEdge) => {
      const fromNode = this.nodes.find((n) => n.id === rawEdge.fromNodeId)
      const toNode = this.nodes.find((n) => n.id === rawEdge.toNodeId)

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

    this.fromNodeId = clickedNode.id
    this.createContextualDataAsync(this.nodeData, this.edgeData)

    // // in order to load parents and children, the data of the focus node has to be loaded first
    // const focusFetchUrl = `${this.config.databaseUrl}/nodes?id=${clickedNode.getId()}`
    // const fetchedFocus = await fetch(focusFetchUrl).then((data) => data.json())
    // console.log(fetchedFocus[0])
    // this.createNodeFromData(fetchedFocus[0], "max")
    // this.focus = this.nodes.find((n) => n.id === fetchedFocus[0].id)


    // // load parents and children edges
    // const parentEdgeFetchUrl = `${this.config.databaseUrl}/edges?fromNodeId=${fetchedFocus[0].id}`
    // const childrenEdgeFetchUrl = `${this.config.databaseUrl}/edges?toNodeId=${fetchedFocus[0].id}`
    // const fetchedParentEdges = await fetch(parentEdgeFetchUrl).then((data) => data.json())
    // const fetchedChildrenEdges = await fetch(childrenEdgeFetchUrl).then((data) => data.json())
    // const fetchedEdges = [...fetchedChildrenEdges, ...fetchedParentEdges]


    // // load nodes based on edngNodeIds in edge response
    // const nodeIds = fetchedEdges.map((e) => e.toNodeId)
    // const mapNodeIdsToUrl = (id) => `id=${id}&`
    // const nodeIdsToFetch = nodeIds.map(mapNodeIdsToUrl).join("").slice(0, -1)
    // const nodeFetchUrl = `${this.config.databaseUrl}/nodes?${nodeIdsToFetch}`
    // const fetchedNodes = await fetch(nodeFetchUrl).then((data) => data.json())
    // fetchedNodes.forEach((rawNode) => {
    //   this.createNodeFromData(rawNode, "min")
    // })
    // // console.log(fetchedEdges)

    // const parentNodeIds = fetchedEdges.filter((e) => e.toNodeId !== clickedNode.id).map((n) => n.toNodeId)
    // const childNodeIds = fetchedEdges.filter((e) => e.fromNodeId !== clickedNode.id).map((n) => n.fromNodeId)
    // this.parents = this.nodes.filter((n) => parentNodeIds.includes(n.id))
    // this.children = this.nodes.filter((n) => childNodeIds.includes(n.id))
    // console.log(childNodeIds, this.nodes)
    // // // this.parents = this.nodes.filter((n) => parentNodeIds.includes(n.id))
    // // // this.children = this.nodes.filter((n) => childNodeIds.includes(n.id))


    // create new edges
    // fetchedEdges.forEach((rawEdge) => {
    //   const fromNode = this.nodes.find((n) => n.id === rawEdge.fromNodeId)
    //   const toNode = this.nodes.find((n) => n.id === rawEdge.toNodeId)

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


  setLayoutIdentifier(id) {
    this.layoutIdentifier = id
  }




  registerAdditionalNodeRepresentation({ control = {}, asset = {}, custom = {}, requirement = {}, risk = {} }) {
    this.additionalNodeRepresentations = { control, asset, custom, requirement, risk }
  }

  registerAdditionalEdgeRepresentation({ thinEdge = {}, boldEdge = {}, customEdge = {} }) {
    this.additionalEdgeRepresentations = { thinEdge, boldEdge, customEdge }
  }


  setLayoutReferences(layoutReferences) {
    this.layoutReferences = layoutReferences
  }

  getLayoutReferences() {
    return this.layoutReferences
  }

  getLayoutIdentifier() {
    return this.layoutIdentifier
  }

  setConfig(config) {
    this.config = { ...this.config, ...config }
  }

  getConfig(key) {
    return this.config[key]
  }

  setCanvas(canvas) {
    this.canvas = canvas.nested() // .draggable()

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

  setRenderDepth(renderDepth) {
    this.renderDepth = renderDepth
  }

  getRenderDepth() {
    return this.renderDepth
  }

  setRootId(rootId) {
    this.rootId = rootId
  }

  getRootId() {
    return this.rootId
  }
}


export default BaseLayout
// 1669