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

    this.fallbackIcons = []
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







  async loadInitialContextualDataAsync() {
    // load focus and assigned node
    const response1 = await multiplePostRequests([
      { url: `${this.config.databaseUrl}/${this.config.nodeEndpoint}`, body: [this.focusId] },
      { url: `${this.config.databaseUrl}/${this.config.contextualRelationshipEndpoint}`, body: [this.focusId] }
    ])
    const focus = response1[0][0] || null
    if (focus === null) {
      throw new Error(`Failed to load the focus node ${this.focusId}.`)
    }
    const assigned = response1[1]

    const nodesToFetch = []

    // check if we need to fetch an assigned node and some attached risks
    if (assigned.length === undefined) { // format: {focus: 36, assigned: 60, risks: Array(5)}
      nodesToFetch.push(...assigned.risks)
      nodesToFetch.push(assigned.assigned)
      this.assignedInfo = assigned
    }

    // load parents
    const parentIds = focus.parent !== null ? focus.parent instanceof Array ? focus.parent : [focus.parent] : []
    nodesToFetch.push(...parentIds)

    // load children
    const childrenIds = focus.children
    nodesToFetch.push(...childrenIds)

    // load edges
    const requiredEdges = [
      ...parentIds.map((id) => ({ fromNode: this.focusId, toNode: id })),
      ...childrenIds.map((id) => ({ fromNode: id, toNode: this.focusId }))
    ]

    // ..but, only edges known to the graph
    const edgesToFetch = requiredEdges.filter((edge) => this.edgeData.find((e) => e.fromNode === edge.fromNode && e.toNode === e.toNode))


    const response2 = await multiplePostRequests([
      { url: `${this.config.databaseUrl}/${this.config.nodeEndpoint}`, body: nodesToFetch },
      { url: `${this.config.databaseUrl}/${this.config.edgeEndpoint}`, body: edgesToFetch }
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
  }



  async updateContextualDataAsync({ clickedNode = null }) {

    // transform clickedNode to focus and focus to child or parent
    const focusNode = this.nodes.find(n => n.getId() === this.focusId)
    // console.log(focusNode, clickedNode)

    const oldFocusX = focusNode.getFinalX()
    const oldFocusY = focusNode.getFinalY()

    clickedNode.setFinalX(oldFocusX)
    clickedNode.setFinalY(oldFocusY)
    console.log(clickedNode.id, "transformToMax")
    clickedNode.transformToMax({})


    // remove existing layout information


    // load new data


    // create new data
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
    this.layoutReferences.forEach((llayout, i) => {
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

    this.edges.forEach((edge) => edge.removeSVG())
    this.edges = []

    this.leafs.forEach((leaf) => leaf.removeSVG())
    this.leafs = []

    if (this.gridExpander) {
      this.gridExpander.removeSVG()
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
      }, 1)
    }
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

  setRootId(rootId) {
    this.rootId = rootId
  }

  getRootId() {
    return this.rootId
  }
}

export default BaseLayout
