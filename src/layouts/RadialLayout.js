import BaseLayout from "./BaseLayout"
import RadialLeaf from "./helpers/RadialLeaf"
import RadialLayoutConfiguration from "../configuration/RadialLayoutConfiguration"
import { buildTreeFromNodes } from "../utils/TreeConstruction"
import { calculateDistance } from "../utils/Calculations"

/**
 * This class is calculates and renders the radial layout.
 */
/**
 * This class represents data within a radial tree layout. The algorithm to achieve this visualization is based on
 * a proposal from Andrew Pavlo.
 *
 * @category Layouts
 * @param {Object} [customConfig={ }] Overrides default layout configuration properties.
 *                                    Available options: {@link RadialLayoutConfiguration}
 * @param {Object} [customEvents={ }] Overrides event listener configuration properties.
 * @param {Object} [customNodes={ }] Overrides default node representation properties.
 * @param {Object} [customEdges={ }] Overrides default edge representation properties.
 *
 * @see https://scholarworks.rit.edu/cgi/viewcontent.cgi?article=1355&context=theses
 */
class RadialLayout extends BaseLayout {
  constructor(customConfig = {}, customEventlisteners = [], customNodes = {}, customEdges = {}) {
    super(customNodes, customEdges)

    if (customConfig.rootId === undefined) {
      throw new Error("No root element reference id provided")
    }

    this.config = { ...RadialLayoutConfiguration, ...customConfig }

    // layout specific
    this.rootId = customConfig.rootId
    this.renderDepth = customConfig.renderDepth || 0

    // events
    this.events = [
      {
        event: "click",
        modifier: undefined,
        func: "expandOrCollapseEvent",
        defaultEvent: true,
      },
    ]
    customEventlisteners.forEach((event) => {
      this.registerEventListener(event.event, event.modifier, event.func)
    })
  }


  /**
   * Event method which either loads more data or removes existing data.
   * @param {BaseNode} node The node that recieved the event.
   * @async
   */
  async expandOrCollapseDataAsyncEvent(node) {
    // remove clicked leaf indication
    const leaf = this.leafs.find((l) => l.getId() === node.getId())
    if (leaf !== undefined) {
      leaf.removeSVG()
      this.leafs = this.leafs.filter((l) => l.getId() !== node.getId())
    }

    // update the underlying data structure
    await this.updateRadialDataAsync({ clickedNode: node })
  }


  /**
   * Calculates the radial layout positions for all given nodes and edges.
   *
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.offset=0] Determines the space the layout has to shift in order to avoid overlapping layouts.
   */
  calculateLayout({ offset = 0 }) {
    this.currentOffset = offset


    // updates the depth level for each node
    const updateNodeDepth = (node, depth) => {
      node.setDepth(depth)
      node.getChildren().forEach((child) => {
        updateNodeDepth(child, depth + 1)
      })
    }


    // calculates the X and Y position for nodes and edges
    const calculateFinalPosition = (node, root, alfa, beta) => {
      const w = this.config.renderingSize === "max" ? node.getMaxWidth() : node.getMinWidth()
      const h = this.config.renderingSize === "max" ? node.getMaxHeight() : node.getMinHeight()

      // center root
      if (node.getParentId() === null || node.getId() === this.rootId) {
        node.setFinalX(this.config.translateX + w / 2)
        node.setFinalY(this.config.translateY)
      }


      // depth of node inside tree
      const depth = node.getDepth()

      // theta
      let theta = alfa

      // multipler for depth levels after the first circle
      const delta = Math.max(w, h)

      // innermost circle radius + delta angle
      const radius = Math.max(w, h) * 1.35 + (delta * depth)


      const BFS = (rootNode) => {
        const visited = []
        const queue = []
        let leaves = 0

        queue.push(rootNode)
        visited.push(rootNode)

        while (queue.length) {
          const currentNode = queue.shift()

          currentNode.getChildren().forEach((child) => {
            if (!queue.includes(child)) {
              queue.push(child)
            }
          })

          if (currentNode.getChildren().length === 0) {
            leaves += 1
          }
        }


        return leaves
      }

      // find the number of children in the subtree
      const children = BFS(node)

      node.getChildren().forEach((child) => {
        // number of leaves in subtree
        const lambda = BFS(child)
        const mü = theta + ((lambda / children) * (beta - alfa))

        // calculate the respected positions
        const x = radius * Math.cos((theta + mü) / 2) * this.config.hAspect
        const y = radius * Math.sin((theta + mü) / 2) * this.config.wAspect

        child.setFinalX(x + this.config.translateX + w / 2)
        child.setFinalY(y + this.config.translateY)

        if (child.getChildren().length > 0) {
          calculateFinalPosition(child, root, theta, mü)
        }


        // calculate edge
        const edge = this.edges.find((e) => {
          const existingFromNode = e.getFromNode().getId() === child.getId()
          const existingToNode = e.getToNode().getId() === node.getId()
          return existingFromNode && existingToNode
        })
        edge.calculateEdge({})

        // add edge references to the node
        node.addIncomingEdge(edge)
        child.addOutgoingEdge(edge)

        theta = mü
      })
    }


    // add a visual indication that there is more data available
    const calculateLeafs = (node) => {
      if (this.config.showLeafIndications === false) {
        return
      }
      const root = node


      // adds leafs to a given node if necessary
      const addLeaf = (currentNode) => {
        const hasNoChildren = currentNode.hasNoChildren()
        const hasInvisibleChildren = currentNode.getInvisibleChildren().length >= this.config.visibleNodeLimit
        const hasChildIds = currentNode.hasChildrenIds()

        if (hasNoChildren && (hasChildIds || hasInvisibleChildren)) {
          // find existing leaf
          const existing = this.leafs.find((l) => l.getId() === currentNode.getId())

          // only create a leaf once per node
          if (existing === undefined) {
            const leaf = new RadialLeaf(this.canvas, currentNode, root, this.config)
            leaf.setParentChildren(this.nodes.filter((n) => n.getDepth() === currentNode.getDepth() + 1).length)
            leaf.setLayoutId(this.layoutIdentifier)
            this.leafs.push(leaf)
          }
        }
        currentNode.getChildren().forEach((child) => {
          addLeaf(child, root)
        })
      }

      const removeLeaf = () => {
        const toRemove = []
        const existingNodeIds = this.nodes.map((n) => n.getId())
        this.leafs.forEach((leaf) => {
          if (!existingNodeIds.includes(leaf.getId())) {
            toRemove.push(leaf)
          }
        })

        toRemove.forEach((leaf) => {
          leaf.removeSVG()
        })
        this.leafs = this.leafs.filter((leaf) => !toRemove.map((l) => l.getId()).includes(leaf.getId()))
      }


      // add new leafs
      addLeaf(node)

      // remove existing leafs which are not used anymore
      removeLeaf()
    }


    // calculate the layout dimensions and move off screen objects into the screen
    const calculateLayoutInfo = (tree) => {
      const toRender = [tree]
      const rendered = []

      // de-flatten the current tree
      while (toRender.length) {
        const current = toRender.shift()
        const node = this.nodes.find((n) => n.getId() === current.getId())
        rendered.push(node)

        current.getChildren().forEach((child) => {
          toRender.push(child)
        })
      }


      // calculate the vertical adjustment
      const hAdjustment = Math.min(...rendered.map((node) => {
        const w = this.config.renderingSize === "max" ? node.getMaxWidth() : node.getMinWidth()
        const h = this.config.renderingSize === "max" ? node.getMaxHeight() : node.getMinHeight()
        return node.getFinalX() - w - Math.max(w, h) / 1.5
      }))

      // calculate the horizontal adjustment
      const vAdjustment = Math.min(...rendered.map((node) => {
        const w = this.config.renderingSize === "max" ? node.getMaxWidth() : node.getMinWidth()
        const h = this.config.renderingSize === "max" ? node.getMaxHeight() : node.getMinHeight()
        return node.getFinalY() - h - Math.max(w, h) / 1.5
      }))


      // update nodes
      rendered.forEach((node) => {
        const x = ((node.getFinalX() - hAdjustment) + offset) + this.config.translateX
        const y = (node.getFinalY() - vAdjustment) + this.config.translateY
        node.setFinalX(x)
        node.setFinalY(y)
      })

      // update edges
      this.edges.forEach((edge) => {
        edge.setFinalToX((edge.getFinalToX() - hAdjustment) + offset + this.config.translateX)
        edge.setFinalToY(edge.getFinalToY() - vAdjustment + this.config.translateY)
        edge.setFinalFromX((edge.getFinalFromX() - hAdjustment) + offset + this.config.translateX)
        edge.setFinalFromY(edge.getFinalFromY() - vAdjustment + this.config.translateY)
      })


      // calculate the layout info by gathering information about three points
      const x0 = Math.min(...rendered.map((n) => {
        const w = this.config.renderingSize === "max" ? n.getMaxWidth() : n.getMinWidth()
        return n.getFinalX() - w
      }))
      const y0 = 0

      const x1 = Math.max(...rendered.map((n) => {
        const w = this.config.renderingSize === "max" ? n.getMaxWidth() : n.getMinWidth()
        return n.getFinalX() + w
      }))
      const y1 = 0

      const x2 = x1
      const y2 = Math.max(...rendered.map((n) => {
        const h = this.config.renderingSize === "max" ? n.getMaxHeight() : n.getMinHeight()
        return n.getFinalY() + h
      }))


      // create the layout info object
      this.layoutInfo = {
        x: x0,
        y: y0,
        cx: (x0 + x2) / 2,
        cy: (y0 + y2) / 2,
        w: calculateDistance(x0, y0, x1, y1),
        h: calculateDistance(x1, y1, x2, y2),
      }
    }


    // initial calculations
    const tree = buildTreeFromNodes(this.nodes)[0]
    updateNodeDepth(tree, 0)
    calculateFinalPosition(tree, tree, 0, 2 * Math.PI)

    // leafs
    calculateLeafs(tree)

    // layout info
    calculateLayoutInfo(tree)


    this.tree = tree
    return this.layoutInfo
  }


  /**
   * Renders the tree layout by creating SVG objects representing nodes, leafs and edges.
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Boolean} [opts.isReRender=false] Determines if the layout is rerenderd.
   * @param {Number} [opts.x=null] The x coordinate for the clicked node.
   * @param {Number} [opts.y=null] The y coordinate for the clicked node.
   */
  renderLayout({ isReRender = false, x = null, y = null }) {
    // get the position where to start rendering the nodes from
    const X = x || this.nodes.find((n) => n.getId() === this.rootId).getFinalX()
    const Y = y || this.nodes.find((n) => n.getId() === this.rootId).getFinalY()

    // render nodes and edges
    const renderNodes = () => {
      const toRender = [this.tree]
      while (toRender.length) {
        const current = toRender.shift()
        const node = this.nodes.find((n) => n.getId() === current.getId())

        // render nodes
        if (node.isRendered() === false) {
          if (this.config.renderingSize === "max") node.renderAsMax({ IX: X, IY: Y })
          if (this.config.renderingSize === "min") node.renderAsMin({ IX: X, IY: Y })

          // find provided events
          const eventStr = [...new Set(this.events.map((e) => e.event))].toString().split(",")

          // attach events to SVG object
          node.svg.on(eventStr, (e) => {
            const { type } = e
            let modifier
            if (e.altKey === true) {
              modifier = "altKey"
            } else if (e.ctrlKey === true) {
              modifier = "ctrlKey"
            } else if (e.shiftKey === true) {
              modifier = "shiftKey"
            }
            // add provided events
            this.events.forEach((myevent) => {
              if (myevent.event === type && myevent.modifier === modifier) {
                this.expandOrCollapseDataAsyncEvent(node)
              }
            })
          })


          // render edge references
          node.getOutgoingEdges().forEach((edge) => {
            if (edge.isRendered() === false) edge.render({ X, Y })
          })

          // or transform nodes into position
        } else if (node.isRendered() === true) {
          node.transformToFinalPosition({})
        }

        current.getChildren().forEach((child) => {
          toRender.push(child)
        })
      }
    }


    // render possible leafs
    const renderLeafs = () => {
      this.leafs.forEach((leaf) => {
        // only render leaf one time
        if (leaf.isRendered() === false) leaf.render({ isReRender: false })

        // else, if its already rendered, transform the leaf to its final position
        else if (leaf.isRendered() === true) leaf.transformToFinalPosition({ isReRender })
      })
    }


    // update edges
    const renderEdges = () => {
      this.edges.forEach((edge) => {
        // if edge is rendered, transform it to its final position
        if (edge.isRendered() === true) edge.transformToFinalPosition({ isReRender })
      })
    }

    renderNodes()
    renderLeafs()
    renderEdges()
  }
}


export default RadialLayout
