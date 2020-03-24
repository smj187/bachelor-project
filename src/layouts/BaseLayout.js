import RiskNode from "../nodes/RiskNode"
import AssetNode from "../nodes/AssetNode"
import RequirementNode from "../nodes/RequirementNode"
import CustomNode from "../nodes/CustomNode"
import ControlNode from "../nodes/ControlNode"
import ThinEdge from "../edges/ThinEdge"
import BoldEdge from "../edges/BoldEdge"


class BaseLayout {
  constructor() {
    this.canvas = null


    this.rawNodes = []
    this.rawEdges = []

    this.nodes = []
    this.edges = []

    this.currentLayoutWidth = 0
    this.currentLayoutHeight = 0

    this.info = {
      currentX: 0,
      currentY: 0,
      currentWidth: 0,
      currentHeight: 0,
      currentState: "expanded",
    }

    this.tree = null
  }

  getNodeData() {
    return this.nodeData
  }

  getEdgeData() {
    return this.edgeData
  }

  async createGridDataAsync(nodeData, edgeData) {
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
      // node.addEvent("dblclick", () => { this.manageDataAsync(node) })

      this.nodes.push(node)
    })


    // re-calculate and re-render layout
    this.calculateLayout()
    this.renderLayout()
  }


  async createContextualDataAsync(nodeData, edgeData) {
    this.nodeData = nodeData
    this.edgeData = edgeData

    // load focus, children and parents

    // load attached node and attached risks
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
      node.addEvent("dblclick", () => { this.manageDataAsync(node) })

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

  // eslint-disable-next-line class-methods-use-this
  async manageDataAsync(clickedNode) {
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
        node.addEvent("dblclick", () => { this.manageDataAsync(node) })

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

  removeLayout() {
    this.nodes.forEach((node) => {
      node.removeNode()
    })

    this.edges.forEach((edge) => {
      edge.removeEdge()
    })

    this.leafs.forEach((leaf) => {
      leaf.removeLeaf()
    })
  }


  setConfig(config) {
    this.config = { ...this.config, ...config }
  }

  setCanvas(canvas) {
    this.canvas = canvas.nested()
  }

  setRawNodes(rawNodes) {
    this.rawNodes = [...rawNodes]
  }

  setRawEdges(rawEdges) {
    this.rawEdges = [...rawEdges]
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
}


export default BaseLayout
