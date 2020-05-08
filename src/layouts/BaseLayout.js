/* eslint-disable no-nested-ternary */
import RiskNode from "../nodes/RiskNode"
import AssetNode from "../nodes/AssetNode"
import RequirementNode from "../nodes/RequirementNode"
import CustomNode from "../nodes/CustomNode"
import ControlNode from "../nodes/ControlNode"
import ThinEdge from "../edges/ThinEdge"
import BoldEdge from "../edges/BoldEdge"

import { singlePostRequest, multiplePostRequests } from "../utils/HttpRequests"
import { buildTreeFromIds } from "../utils/TreeConstruction"
import NodeFactory from "../nodes/NodeFactory"
import EdgeFactory from "../edges/EdgeFactory"


/**
 * This is the base class for layouts.
 *
 * @category Layouts
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

    this.currentOffset = 0


    this.tree = null


    this.layoutReferences = []
    this.globalLayoutSpacing = 0
  }


  /**
  * Registers a new event listener to the layout.
  * @param {Object} [opts={ }] An object containing additional information.
  * @param {Number} [opts.event=click] The layout where to add the event listener.
  * @param {Number} [opts.modifier=undefined] The modifier name.
  * @param {Number} [opts.func=null] The method name.
  */
  registerEventListener({ event = "click", modifier = undefined, func = null }) {
    // remove default event listener
    if (this.events.find((d) => d.defaultEvent === true)) {
      this.events = this.events.filter((e) => e.defaultEvent !== true)
    }

    // add new event listener
    this.events.push({ event, modifier, func })
  }


  /**
   * Loads the initial tree layout data.
   * @async
   */
  async loadInitialGridDataAsync() {
    // only load the amount of nodes determined by the limit nodes configuration
    const limit = this.config.limitNodes ? this.config.limitNodes : this.nodeData.length
    const ids = this.nodeData.map((n) => n.id).slice(0, limit)


    if (ids.length) {
      const nodes = await singlePostRequest(`${this.config.databaseUrl}/${this.config.nodeEndpoint}`, ids)
      this.createRepresentations({ nodes })
    }

    return this
  }


  /**
   * Loads the new requested data from the backend and updates the layout.
   */
  async updateGridDataAsync() {
    const arr1 = this.nodeData.map((n) => n.id)
    const arr2 = this.nodes.map((n) => n.id)
    const difference = arr1.filter((x) => !arr2.includes(x))

    if (difference.length) {
      const nodes = await singlePostRequest(`${this.config.databaseUrl}/${this.config.nodeEndpoint}`, difference)
      this.createRepresentations({ nodes })
    }

    this.calculateLayout({})
    this.updateLayoutsToTheRight({})
    this.renderLayout({ isReRender: true })
  }


  /**
   * Rebuilds the entire grid layout.
   * @async
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.removeOldData=true] Determines if the intial graph data should also be removed.
   */
  async rebuildGridLayoutAsync({ removeOldData = true }) {
    await this.removeLayoutAsync({ removeOldData })
    await this.loadInitialGridDataAsync()
  }


  /**
   * Loads the initial tree layout data.
   * @async
   */
  async loadInitialTreeDataAsync() {
    // first, load the root node
    const response1 = await singlePostRequest(`${this.config.databaseUrl}/${this.config.nodeEndpoint}`, [this.rootId])
    const root = response1[0] || null
    if (root === null) {
      throw new Error(`Failed to load root id ${this.rootId}.`)
    }


    // unfortunately make a request for each depth level
    let nodes = [root]
    let childNodeIds = root.children
    for (let i = 0; i < this.renderDepth && childNodeIds.length > 0; i += 1) {
      const response = await singlePostRequest(`${this.config.databaseUrl}/${this.config.nodeEndpoint}`, childNodeIds)
      const children = response
      childNodeIds = children.map((c) => c.children).flat()
      nodes.push(children)
    }

    // create fake root
    nodes = nodes.flat()
    nodes.find((n) => n.id === this.rootId).parent = null


    // construct a tree data structure to generate edges and calculate node positions
    const trees = buildTreeFromIds(nodes)


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

    // FIXME: cauption while updating a layout, this variable limits the amount of visible nodes
    //        and if not updated properly, some nodes won't render
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
    const edgesToFetch = requiredEdges.filter((edge) => this.edgeData.find((e) => e.fromNode === edge.fromNode && e.toNode === e.toNode))

    const edges = await singlePostRequest(`${this.config.databaseUrl}/${this.config.edgeEndpoint}`, edgesToFetch)


    // create node and edge visualizations
    this.createRepresentations({ nodes, edges })

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


  /**
   * Performs an add or removal operations.
   * @async
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.clickedNode=null] The clicked node.
   */
  async updateTreeDataAsync({ clickedNode = null }) {
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
          currentNode.removeSVG({})
        }
        currentNode.children.forEach((child) => queue.push(child))
      }

      // update current information
      clickedNode.setChildren([])
      this.nodes = this.nodes.filter((node) => !nodesToRemove.map((n) => n.id).includes(node.id))


      // find edges that we need to remove and update
      const edgesToRemove = [...nodesToRemove.map((n) => n.outgoingEdges)].flat()
      const edgesToBeUpdated = []
      this.edges.forEach((edge) => {
        if (edgesToRemove.includes(edge) === false) {
          edgesToBeUpdated.push(edge)
        } else {
          edge.removeSVG({})
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
      const nodes = await singlePostRequest(`${this.config.databaseUrl}/${this.config.nodeEndpoint}`, requestedNodes)

      // find edges between new children and clicked node
      const requiredEdges = []
      nodes.forEach((node) => requiredEdges.push({ fromNode: node.id, toNode: clickedNode.id }))

      // only fetch edges known to the graph
      const edgesToFetch = requiredEdges.filter((edge) => this.edgeData.find((e) => e.fromNode === edge.fromNode && e.toNode === e.toNode))
      const edges = await singlePostRequest(`${this.config.databaseUrl}/${this.config.edgeEndpoint}`, edgesToFetch)

      // create node and edge visualizations
      this.createRepresentations({ nodes, edges })

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


    // calculate the coordinates from where new nodes originate
    const coords = clickedNode.coords[clickedNode.coords.length - 1]
    const x = coords[0]
    const y = coords[1]

    this.updateLayoutsToTheRight({ isReRender: true, x, y })
  }


  /**
   * Rebuilds the entire tree layout.
   * @async
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.removeOldData=true] Determines if the intial graph data should also be removed.
   */
  async rebuildTreeLayoutAsync({ removeOldData = true }) {
    await this.removeLayoutAsync({ removeOldData })
    await this.loadInitialTreeDataAsync()
  }


  /**
   * Loads the initial contextual layout data.
   * @async
   */
  async loadInitialContextualDataAsync() {
    // load focus and assigned node
    const response1 = await multiplePostRequests([
      { url: `${this.config.databaseUrl}/${this.config.nodeEndpoint}`, body: [this.focusId] },
      { url: `${this.config.databaseUrl}/${this.config.contextualRelationshipEndpoint}`, body: [this.focusId] },
    ])
    const focus = response1[0][0] || null
    if (focus === null) {
      throw new Error(`Failed to load the focus node ${this.focusId}.`)
    }
    const assigned = response1[1]


    const nodesToFetch = []

    // check if we need to fetch an assigned node along with some attached risks ids
    if (assigned.length === undefined && this.config.showAssignedConnection === true) {
      nodesToFetch.push(...assigned.risks)
      nodesToFetch.push(assigned.assigned)

      const response = await singlePostRequest(`${this.config.databaseUrl}/${this.config.nodeEndpoint}`, [assigned.assigned])
      const parentDependencies = response[0].parent !== null ? response[0].parent instanceof Array ? response[0].parent : [response[0].parent] : []
      const childDependencies = response[0].children
      nodesToFetch.push(...parentDependencies)
      nodesToFetch.push(...childDependencies)
      this.assignedInfo = assigned
    }

    // parents
    const parentIds = focus.parent !== null ? focus.parent instanceof Array ? focus.parent : [focus.parent] : []
    nodesToFetch.push(...parentIds)

    // children
    const childrenIds = focus.children
    nodesToFetch.push(...childrenIds)

    // edges
    const requiredEdges = [
      ...parentIds.map((id) => ({ fromNode: this.focusId, toNode: id })),
      ...childrenIds.map((id) => ({ fromNode: id, toNode: this.focusId })),
    ]

    // ..but, only edges known to the graph
    const edgesToFetch = requiredEdges.filter((edge) => this.edgeData.find((e) => e.fromNode === edge.fromNode && e.toNode === e.toNode))


    const response2 = await multiplePostRequests([
      { url: `${this.config.databaseUrl}/${this.config.nodeEndpoint}`, body: nodesToFetch },
      { url: `${this.config.databaseUrl}/${this.config.edgeEndpoint}`, body: edgesToFetch },
    ])
    const nodes = response2[0]
    const edges = response2[1]


    // create node and edge visualizations, first for the focus in detailed representation, then for all others in minimal
    this.createRepresentations({ nodes: [focus], edges: [], renderingSize: "max" })
    this.createRepresentations({ nodes, edges, renderingSize: "min" })


    // fallback: if an edge was not provided, create it manualy as solid edge
    requiredEdges.forEach((e) => {
      const existingEdge = edges.find((x) => x.fromNode === e.fromNode && x.toNode === e.toNode)

      if (existingEdge === undefined) {
        const fromNode = this.nodes.find((n) => n.id === e.fromNode)
        const toNode = this.nodes.find((n) => n.id === e.toNode)

        if (fromNode !== undefined && toNode !== undefined) {
          const edge = EdgeFactory.create(
            { type: "bold", config: { animationSpeed: this.config.animationSpeed } },
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

    // update references
    this.focusNode = this.getContextualFocusNode()
    this.assignedNode = this.getContextualAssignedNode()
    this.childNodes = this.getContextualChildNodes(this.focusNode)
    this.parentNodes = this.getContextualParentNodes(this.focusNode)
    this.riskNodes = this.getContextualRiskNodes()
    this.assignedChildNodes = this.getAssignedChildNodes(this.assignedNode)
    this.assignedParentNodes = this.getAssignedParentNodes(this.assignedNode)
  }


  /**
   * Helper method that collects items related for removal.
   */
  collectRemovals({ clickedNode, isParentOperation }) {
    const nodesToRemove = []
    const edgesToRemove = this.edges
    const objectsToRemove = []


    const { assignedNode } = this
    const { childNodes } = this
    const { parentNodes } = this
    const { riskNodes } = this
    const { assignedChildNodes } = this
    const { assignedParentNodes } = this

    if (this.assignedInfo !== null) {
      nodesToRemove.push(assignedNode)
    }

    if (this.assignedInfo !== null) {
      nodesToRemove.push(...assignedParentNodes)
      nodesToRemove.push(...assignedChildNodes)
    }

    nodesToRemove.push(...riskNodes)

    if (this.riskConnection) {
      this.riskConnection.removeSVG({ withAnimation: false })
    }
    this.riskConnection = null

    // remove existing layout information
    if (isParentOperation === true) {
      // remove SVGs to the bottom

      this.containerConnections.forEach((connection) => {
        objectsToRemove.push({ svg: connection, opts: { X: connection.getFinalX(), Y: connection.getFinalY() + 50, withAnimation: true } })
      })
      this.containerConnections = []

      this.containers.forEach((container) => {
        objectsToRemove.push({ svg: container, opts: { X: container.getFinalX(), Y: container.getFinalY() + 50, withAnimation: true } })
      })
      this.containers = []

      this.expanders.forEach((expander) => {
        objectsToRemove.push({ svg: expander, opts: { X: expander.getFinalX(), Y: expander.getFinalY() + 50, withAnimation: true } })
      })
      this.expanders = []

      if (this.assignedConnection) {
        objectsToRemove.push({ svg: this.assignedConnection, opts: { X: this.assignedConnection.getFinalX(), Y: this.assignedConnection.getFinalY() + 50, withAnimation: true } })
      } this.assignedConnection = null

      nodesToRemove.push(...childNodes)
      nodesToRemove.push(...parentNodes.filter((n) => n.id !== clickedNode.id))
    } else {
      // remove SVGs to the top

      this.containerConnections.forEach((connection) => {
        objectsToRemove.push({ svg: connection, opts: { X: connection.getFinalX(), Y: connection.getFinalY() - 50, withAnimation: true } })
      })
      this.containerConnections = []

      this.containers.forEach((container) => {
        objectsToRemove.push({ svg: container, opts: { X: container.getFinalX(), Y: container.getFinalY() - 50, withAnimation: true } })
      })
      this.containers = []

      this.expanders.forEach((expander) => {
        objectsToRemove.push({ svg: expander, opts: { X: expander.getFinalX(), Y: expander.getFinalY() - 50, withAnimation: true } })
      })
      this.expanders = []
      if (this.assignedConnection) {
        objectsToRemove.push({ svg: this.assignedConnection, opts: { X: this.assignedConnection.getFinalX(), Y: this.assignedConnection.getFinalY() - 50, withAnimation: true } })
      }
      this.assignedConnection = null


      nodesToRemove.push(...parentNodes)
      nodesToRemove.push(...childNodes.filter((n) => n.id !== clickedNode.id))
    }
    return { nodesToRemove, edgesToRemove, objectsToRemove }
  }


  /**
   * Performs an add or removal operations.
   * @async
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.clickedNode=null] The clicked node.
   * @param {Number} [opts.isParentOperation=false] Determines the directions where nodes translate while removing and adding.
   */
  async updateContextualDataAsync({ clickedNode = null, isParentOperation = false }) {
    // transform clickedNode to focus and focus to child or parent
    const { focusNode } = this


    const oldFocusX = focusNode.getFinalX()
    const oldFocusY = focusNode.getFinalY()

    clickedNode.setFinalX(oldFocusX)
    clickedNode.setFinalY(oldFocusY)


    // restore expander values
    this.areChildrenExpended = false
    this.areParentsExpended = false
    this.areRisksExpended = false
    this.areAssignedParentExpanded = false
    this.areAssignedChildrenExpanded = false

    // collect nodes, edges and other objects that will be removed
    const { nodesToRemove, edgesToRemove, objectsToRemove } = this.collectRemovals({ clickedNode, isParentOperation })


    this.nodes = [clickedNode, focusNode]
    this.edges = []


    const oldFocus = focusNode
    const newFocus = clickedNode
    this.focusId = newFocus.getId()

    newFocus.setNodeSize("max")
    oldFocus.setNodeSize("min")


    // load new data

    // load focus and assigned node
    const response1 = await singlePostRequest(`${this.config.databaseUrl}/${this.config.contextualRelationshipEndpoint}`, [this.focusId])
    //  const response = await singlePostRequest(`${this.config.databaseUrl}/${this.config.nodeEndpoint}`, [assigned.assigned])
    const assigned = response1

    const nodesToFetch = []

    // check if we need to fetch an assigned node and some attached risks
    if (assigned.length === undefined && this.config.showAssignedConnection === true) {
      nodesToFetch.push(...assigned.risks)
      nodesToFetch.push(assigned.assigned)

      const response = await singlePostRequest(`${this.config.databaseUrl}/${this.config.nodeEndpoint}`, [assigned.assigned])
      const parentDependencies = response[0].parent !== null ? response[0].parent instanceof Array ? response[0].parent : [response[0].parent] : []
      const childDependencies = response[0].children
      nodesToFetch.push(...parentDependencies)
      nodesToFetch.push(...childDependencies)
      this.assignedInfo = assigned
    } else {
      this.assignedInfo = null
    }


    // get parent and child ids minus the old focus node
    let newParentIds
    let newChildrenIds
    if (isParentOperation) {
      newParentIds = newFocus.parentId !== null ? newFocus.parentId instanceof Array ? newFocus.parentId : [newFocus.parentId] : []
      newChildrenIds = newFocus.childrenIds.filter((id) => id !== oldFocus.id)
    } else {
      newParentIds = newFocus.parentId !== null ? newFocus.parentId instanceof Array ? newFocus.parentId : [newFocus.parentId] : []
      newParentIds = newParentIds.filter((id) => id !== oldFocus.id)
      newChildrenIds = newFocus.childrenIds
    }

    nodesToFetch.push(...newParentIds)
    nodesToFetch.push(...newChildrenIds)


    // load edges
    const requiredEdges = [
      ...newParentIds.map((id) => ({ fromNode: this.focusId, toNode: id })),
      ...newChildrenIds.map((id) => ({ fromNode: id, toNode: this.focusId })),
    ]

    // add missing edge (caused by not fetching the old focus)
    if (isParentOperation) {
      requiredEdges.push({ fromNode: oldFocus.id, toNode: newFocus.id })
    } else {
      requiredEdges.push({ fromNode: newFocus.id, toNode: oldFocus.id })
    }

    // ..but, only edges known to the graph
    const edgesToFetch = requiredEdges.filter((edge) => this.edgeData.find((e) => e.fromNode === edge.fromNode && e.toNode === e.toNode))


    const response2 = await multiplePostRequests([
      { url: `${this.config.databaseUrl}/${this.config.nodeEndpoint}`, body: nodesToFetch },
      { url: `${this.config.databaseUrl}/${this.config.edgeEndpoint}`, body: edgesToFetch },
    ])
    const newNodes = response2[0]
    const newEdges = response2[1]


    // create node and edge visualizations, first for the focus in detailed representation, then for all others in minimal
    this.createRepresentations({ nodes: newNodes, edges: newEdges, renderingSize: "min" })


    // fallback: if an edge was not provided, create it manualy as solid edge
    requiredEdges.forEach((e) => {
      const existingEdge = newEdges.find((x) => x.fromNode === e.fromNode && x.toNode === e.toNode)

      if (existingEdge === undefined) {
        const fromNode = this.nodes.find((n) => n.id === e.fromNode)
        const toNode = this.nodes.find((n) => n.id === e.toNode)

        if (fromNode !== undefined && toNode !== undefined) {
          const edge = EdgeFactory.create(
            { type: "bold", config: { animationSpeed: this.config.animationSpeed } },
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


    // remove existing SVGs ()
    nodesToRemove.forEach((node) => {
      node.removeSVG({ isContextualNode: true, isContextualParentOperation: isParentOperation })
    })

    edgesToRemove.forEach((edge) => {
      edge.removeSVG({ isContextualEdge: true, isContextualParentOperation: isParentOperation })
    })

    objectsToRemove.forEach(({ svg, opts }) => {
      svg.removeSVG(opts)
    })


    // update references
    this.focusNode = this.getContextualFocusNode()
    this.assignedNode = this.getContextualAssignedNode()
    this.childNodes = this.getContextualChildNodes(this.focusNode)
    this.parentNodes = this.getContextualParentNodes(this.focusNode)
    this.riskNodes = this.getContextualRiskNodes()
    this.assignedChildNodes = this.getAssignedChildNodes(this.assignedNode)
    this.assignedParentNodes = this.getAssignedParentNodes(this.assignedNode)


    let prevLayoutWidth = 0
    this.layoutReferences.forEach((llayout) => {
      if (llayout === this) {
        this.calculateLayout({ offset: prevLayoutWidth, isReRender: true, oldFocusNode: oldFocus })
        this.renderLayout({ isReRender: true, clickedNodId: clickedNode.id, oldFocusNode: oldFocus })
      } else {
        llayout.calculateLayout({ offset: prevLayoutWidth })
        llayout.renderLayout({ isReRender: true, prevLayoutWidth })
      }

      prevLayoutWidth += llayout.layoutInfo.w + (this.globalLayoutSpacing)
    })
  }


  /**
 * Rebuilds the entire contextual layout.
 * @async
 * @param {Object} [opts={ }] An object containing additional information.
 * @param {Number} [opts.removeOldData=true] Determines if the intial graph data should also be removed.
 */
  async rebuildContextualLayoutAsync({ removeOldData = true }) {
    await this.removeLayoutAsync({ removeOldData })
    await this.loadInitialContextualDataAsync()
  }


  /**
   * Loads the initial radial layout data.
   * @async
   */
  async loadInitialRadialDataAsync() {
    // first, load the root node
    const response1 = await singlePostRequest(`${this.config.databaseUrl}/${this.config.nodeEndpoint}`, [this.rootId])
    const root = response1[0] || null
    if (root === null) {
      throw new Error(`Failed to load root id ${this.rootId}.`)
    }


    // unfortunately make a request for each depth level
    let nodes = [root]
    let childNodeIds = root.children
    for (let i = 0; i < this.renderDepth && childNodeIds.length > 0; i += 1) {
      const response = await singlePostRequest(`${this.config.databaseUrl}/${this.config.nodeEndpoint}`, childNodeIds)
      const children = response
      childNodeIds = children.map((c) => c.children).flat()
      nodes.push(children)
    }

    // create fake root
    nodes = nodes.flat()
    nodes.find((n) => n.id === this.rootId).parent = null


    // construct a tree data structure to generate edges and calculate node positions
    const trees = buildTreeFromIds(nodes)


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
    // FIXME: bug when updating form a renderdepth of <0 to 0 (does not work)
    checkVisibilityRecursive(tree, 999)


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
    const edgesToFetch = requiredEdges.filter((edge) => this.edgeData.find((e) => e.fromNode === edge.fromNode && e.toNode === e.toNode))
    const edges = await singlePostRequest(`${this.config.databaseUrl}/${this.config.edgeEndpoint}`, edgesToFetch)


    // create node and edge visualizations
    this.createRepresentations({ nodes, edges })

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


  /**
   * Performs an add or removal operations.
   * @async
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.clickedNode=null] The clicked node.
   */
  async updateRadialDataAsync({ clickedNode = null }) {
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
          currentNode.removeSVG({})
        }
        currentNode.children.forEach((child) => queue.push(child))
      }

      // update current information
      clickedNode.setChildren([])
      this.nodes = this.nodes.filter((node) => !nodesToRemove.map((n) => n.id).includes(node.id))


      // find edges that we need to remove and update
      const edgesToRemove = [...nodesToRemove.map((n) => n.outgoingEdges)].flat()
      const edgesToBeUpdated = []
      this.edges.forEach((edge) => {
        if (edgesToRemove.includes(edge) === false) {
          edgesToBeUpdated.push(edge)
        } else {
          edge.removeSVG({})
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
      const nodes = await singlePostRequest(`${this.config.databaseUrl}/${this.config.nodeEndpoint}`, requestedNodes)

      // find edges between new children and clicked node
      const requiredEdges = []
      nodes.forEach((node) => requiredEdges.push({ fromNode: node.id, toNode: clickedNode.id }))

      // only fetch edges known to the graph
      const edgesToFetch = requiredEdges.filter((edge) => this.edgeData.find((e) => e.fromNode === edge.fromNode && e.toNode === e.toNode))
      const edges = await singlePostRequest(`${this.config.databaseUrl}/${this.config.edgeEndpoint}`, edgesToFetch)

      // create node and edge visualizations
      this.createRepresentations({ nodes, edges })

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


    // calculate the coordinates from where new nodes originate
    const coords = clickedNode.coords[clickedNode.coords.length - 1]
    const x = coords[0]
    const y = coords[1]

    this.updateLayoutsToTheRight({ isReRender: true, x, y })
  }


  /**
   * Rebuilds the entire tree layout.
   * @async
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.removeOldData=true] Determines if the intial graph data should also be removed.
   */
  async rebuildRadialLayoutAsync({ removeOldData = true }) {
    await this.removeLayoutAsync({ removeOldData })
    await this.loadInitialRadialDataAsync()
  }


  /**
   * Updates all layouts to the right if necessary.
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Boolean} [opts.isReRender=false] Determines if the layout is re-renderd.
   * @param {Number} [opts.x=null] The x coordinate for the clicked node.
   * @param {Number} [opts.y=null] The y coordinate for the clicked node.
   */
  updateLayoutsToTheRight({ isReRender = false, x = null, y = null }) {
    let prevLayoutWidth = 0
    this.layoutReferences.forEach((llayout) => {
      llayout.calculateLayout({ offset: prevLayoutWidth })
      llayout.renderLayout({ isReRender, x, y })

      prevLayoutWidth += llayout.layoutInfo.w + (this.globalLayoutSpacing)
    })
  }


  /**
   * Removes existing SVG elements and data references.
   * @async
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Boolean} [opts.removeOldData=true] Determines if the intial graph data should also be removed.
   * @param {Boolean} [opts.delayTime=this.config.animationSpeed + 25] Determines the amount of how long the wait until all removal animations are completed.
   */
  async removeLayoutAsync({ removeOldData = true, delayTime = this.config.animationSpeed + 25 }) {
    if (removeOldData === true) {
      this.nodeData = []
      this.edgeData = []
    }


    this.nodes.forEach((node) => node.removeSVG({}))
    this.nodes = []

    this.edges.forEach((edge) => edge.removeSVG({}))
    this.edges = []

    this.leafs.forEach((leaf) => leaf.removeSVG({}))
    this.leafs = []

    if (this.gridExpander) {
      this.gridExpander.removeSVG({})
      this.gridExpander = null
    }


    const delay = (time) => new Promise((resolve) => setTimeout(resolve, time))

    // wait some time to see the SVG objects disappear
    await delay(delayTime)
    this.canvas.clear()

  }


  /**
   * Creates SVG representations for data based on a provided type.
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Array.<BaseNode>} [opts.nodes=[]] Existing SVG representations for nodes.
   * @param {Array.<BaseEdge>} [opts.edges=[]] Existing SVG representations for edges.
   * @param {String} [opts.renderingSize=this.config.renderingSize] Determines the node render representation defined on layout level.
   */
  createRepresentations({ nodes = [], edges = [], renderingSize = this.config.renderingSize }) {
    // load the current zoom from the SVG DOM storage
    const currentZoomLevel = this.canvas.parent().attr().zoomCurrent
    const currenZoomThreshold = this.canvas.parent().attr().zoomThreshold

    // create nodes with the factory design pattern
    nodes.forEach((rawNode) => {
      const node = NodeFactory.create(
        { ...rawNode, config: { ...rawNode.config, animationSpeed: this.config.animationSpeed } },
        this.canvas,
        this.additionalNodeRepresentations,
      )

      // register the current layout dictated node size
      node.setNodeSize(renderingSize)
      this.nodes.push(node)
    })

    // create edges with the factory design pattern
    edges.forEach((rawEdge) => {
      const fromNode = this.nodes.find((n) => n.id === rawEdge.fromNode)
      const toNode = this.nodes.find((n) => n.id === rawEdge.toNode)
      const type = rawEdge.type || "solid"
      const config = { ...rawEdge.config, animationSpeed: this.config.animationSpeed }
      const edge = EdgeFactory.create({ ...rawEdge, type, config }, this.canvas, fromNode, toNode, this.additionalEdgeRepresentations)

      // set the label and add a layout reference (only for SVG arrow heads required)
      edge.setLabel(rawEdge.label || null)
      edge.setLayoutId(this.layoutIdentifier)
      this.edges.push(edge)
    })

    // check if the newley created labels should not be visible
    if (currentZoomLevel <= currenZoomThreshold) {
      // NOTE: this sort of delay is unfortunately needed since svgdotjs takes some time to create an
      //       SVG object to add it to the DOM
      setTimeout(() => {
        const labels = document.querySelectorAll("#label")
        labels.forEach((doc) => {
          doc.style.opacity = "0"
        })
      }, 5)
    }
  }


  // some other useful methods..
  getCurrentOffset() {
    return this.currentOffset
  }

  setLayoutIdentifier(id) {
    this.layoutIdentifier = id
  }

  setGlobalLayoutSpacing(globalLayoutSpacing) {
    this.globalLayoutSpacing = globalLayoutSpacing
  }

  getAdditionalNodeRepresentations() {
    return this.additionalNodeRepresentations
  }

  getAdditionalEdgeRepresentations() {
    return this.additionalEdgeRepresentations
  }

  registerAdditionalNodeRepresentation({
    control = {}, asset = {}, custom = {}, requirement = {}, risk = {},
  }) {
    this.additionalNodeRepresentations = {
      control, asset, custom, requirement, risk,
    }
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
    // add a nested DOM element
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

  setRenderDepth(renderDepth) {
    this.renderDepth = renderDepth
  }

  getRenderDepth() {
    return this.renderDepth
  }

  setFocusId(focusId) {
    this.focusId = focusId
  }

  getFocusId() {
    return this.focusId
  }

  setRootId(rootId) {
    this.rootId = rootId
  }

  getRootId() {
    return this.rootId
  }
}

export default BaseLayout
