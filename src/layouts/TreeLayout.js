import BaseLayout from "./BaseLayout"
import Leaf from "./helpers/TreeLeaf"
import TreeLayoutConfiguration from "../configuration/TreeLayoutConfiguration"
import { buildTreeFromNodes } from "../utils/TreeConstruction"
import { calculateDistance } from "../utils/Calculations"



/**
 * This class depicts given data within a tree layout. The algorithm to achieve this visualization is based on the Reingold-Tilford Algorithm. The main calculation process
 * is based on the initial work found in an article, but extended in such a way that it fits the needs for the defined scope of this project.
 *
 * @param {Object} [customConfig={ }] Overrides default layout configuration properties. Available options: {@link TreeLayoutConfiguration}
 * @param {Object} [customEvents={ }] Overrides event listener configuration properties.
 * @param {Object} [customNodes={ }] Overrides default node representation properties.
 *
 * @see https://rachel53461.wordpress.com/2014/04/20/algorithm-for-drawing-trees/
 */
class TreeLayout extends BaseLayout {
  constructor(customConfig = {}, customEventlisteners = [], customNodes = {}, customEdges = {}) {
    super(customNodes, customEdges)


    if (customConfig.rootId === undefined) {
      throw new Error("No root element reference id provided")
    }

    this.config = { ...TreeLayoutConfiguration, ...customConfig }


    // layout specific
    this.rootId = customConfig.rootId
    this.renderDepth = customConfig.renderDepth || 0
    this.leafs = []

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
   */
  async expandOrCollapseDataAsyncEvent(node) {
    // remove clicked leaf indication
    const leaf = this.leafs.find((l) => l.id === node.id)
    if (leaf !== undefined) {
      leaf.removeSVG()
      this.leafs = this.leafs.filter((l) => l.id !== node.id)
    }

    // update the underlying data structure
    await this.updateTreeDataAsync(node)
  }


  /**
   * Registers a new event listener to the layout.
   * @param {String} event The layout where to add the event listener.
   * @param {String} modifier The modifier name.
   * @param {String} func The method name.
   */
  registerEventListener(event, modifier, func) {
    // remove default event listener
    if (this.events.find((d) => d.defaultEvent === true)) {
      this.events = this.events.filter((e) => e.defaultEvent !== true)
    }

    // add new event listener
    this.events.push({ event, modifier, func })
  }


  /**
   * Calculates the tree layout based on an underlying algorithm.
   * @param {Number} [offset=0] Determines the space the layout has to shift in order to avoid overlapping layouts.
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Boolean} [opts.isReRender=false] Determines if the layout is rerenderd.
   * @param {Number} [opts.x=null] The x coordinate for the clicked node.
   * @param {Number} [opts.y=null] The y coordinate for the clicked node.
   */
  calculateLayout(offset = 0, { isReRender = false }) {
    const isVertical = this.config.orientation === "vertical"
    this.initialOffset = offset


    // initialize the tree with required information
    const initializeNodes = (node, parent = null, prevSibling = null, depth = 0) => {
      node.setDepth(depth)
      node.setParent(parent)
      node.setPrevSibling(prevSibling)

      if (isVertical) {
        node.setFinalY(depth + this.config.translateY)
      } else {
        node.setFinalX(depth + this.config.translateX)
      }

      if (node.getChildren() === undefined) {
        node.setChildren([])
      }

      node.children.forEach((child, i) => {
        const prev = i >= 1 ? node.children[i - 1] : null
        initializeNodes(child, node, prev, depth + 1)
      })
    }

    // calculates the initial X and Y position
    const calculateXYPositions = (node) => {
      node.children.forEach((child) => {
        calculateXYPositions(child)
      })

      let w = this.config.renderingSize === "max" ? node.config.maxWidth : node.config.minWidth
      let h = this.config.renderingSize === "max" ? node.config.maxHeight : node.config.minHeight
      w += this.config.hSpacing
      h += this.config.vSpacing

      if (isVertical) {
        node.setFinalY(node.getDepth() * h)

        // if node has no children
        if (node.children.length === 0) {
          // set x to prev siblings x, or 0 for first node in row
          if (!node.isLeftMost()) {
            node.setFinalX(node.getPrevSibling().getFinalX() + w)
          } else {
            node.setFinalX(0)
          }
        } else if (node.children.length === 1) {
          if (node.isLeftMost()) {
            node.setFinalX(node.children[0].getFinalX())
          } else {
            node.setFinalX(node.getPrevSibling().getFinalX() + w)
            node.setModifier(node.getFinalX() - node.children[0].getFinalX())
          }
        } else { // center node on 2+ nodes
          const left = node.getLeftMostChild()
          const right = node.getRightMostChild()
          const mid = (left.getFinalX() + right.getFinalX()) / 2

          if (node.isLeftMost()) {
            node.setFinalX(mid)
          } else {
            node.setFinalX(node.getPrevSibling().getFinalX() + w)
            node.setModifier(node.getFinalX() - mid)
          }
        }
      } else {
        node.setFinalX(node.getDepth() * w)

        // if node has no children
        if (node.children.length === 0) {
          // set y to prev siblings y, or 0 for first node in col
          if (!node.isLeftMost()) {
            node.setFinalY(node.getPrevSibling().getFinalY() + h)
          } else {
            node.setFinalY(0)
          }
        } else if (node.children.length === 1) {
          if (node.isLeftMost()) {
            node.setFinalY(node.children[0].getFinalY())
          } else {
            node.setFinalY(node.getPrevSibling().getFinalY() + h)
            node.setModifier(node.getFinalY() - node.children[0].getFinalY())
          }
        } else { // center node on 2+ nodes
          const left = node.getLeftMostChild()
          const right = node.getRightMostChild()
          const mid = (left.getFinalY() + right.getFinalY()) / 2

          if (node.isLeftMost()) {
            node.setFinalY(mid)
          } else {
            node.setFinalY(node.getPrevSibling().getFinalY() + h)
            node.setModifier(node.getFinalY() - mid)
          }
        }
      }

      if (node.children.length === 1) {
        // fixConflicts(node)
      }
    }

    // apply shift modifier
    const calculateModifier = (node, modifier = 0) => {
      if (isVertical) {
        node.setFinalX(node.getFinalX() + modifier)
      } else {
        node.setFinalY(node.getFinalY() + modifier)
      }

      node.children.forEach((child) => {
        calculateModifier(child, node.modifier + modifier)
      })
    }

    // fixes any possible node overlapps
    const fixConflicts = (node) => {
      node.children.forEach((child) => {
        fixConflicts(child)
      })

      const getLeftContour = (current) => {
        let value = -Infinity
        const queue = [current]
        while (queue.length !== 0) {
          const deq = queue.shift()
          deq.children.forEach((child) => {
            queue.push(child)
          })
          if (isVertical) {
            value = Math.max(value, deq.getFinalX())
          } else {
            value = Math.max(value, deq.getFinalY())
          }
        }
        return value
      }

      const getRightContour = (current) => {
        let value = Infinity
        const queue = [current]
        while (queue.length !== 0) {
          const deq = queue.shift()
          deq.children.forEach((child) => {
            queue.push(child)
          })
          if (isVertical) {
            value = Math.min(value, deq.getFinalX())
          } else {
            value = Math.min(value, deq.getFinalY())
          }
        }
        return value
      }

      const shift = (current, value) => {
        const queue = [current]
        while (queue.length !== 0) {
          const deq = queue.shift()
          deq.children.forEach((child) => {
            queue.push(child)
          })

          if (isVertical) {
            deq.setFinalX(deq.getFinalX() + value)
          } else {
            deq.setFinalY(deq.getFinalY() + value)
          }
        }
      }

      let distance = 0
      const w = this.config.renderingSize === "max" ? node.config.maxWidth : node.config.minWidth
      const h = this.config.renderingSize === "max" ? node.config.maxHeight : node.config.minHeight
      if (isVertical) {
        distance = w + this.config.hSpacing
      } else {
        distance = h + this.config.vSpacing
      }

      // fix spacing issues for 2+ child nodes
      for (let i = 0; i < node.children.length - 1; i += 1) {
        const c1 = getLeftContour(node.children[i])
        const c2 = getRightContour(node.children[i + 1])

        if (c1 >= c2) {
          shift(node.children[i + 1], c1 - c2 + distance)
        }
      }

      // fix spacing issue for 1 child
      const fixOneChildProblem = (node) => {
        if (isReRender) {
          const depthNodes = this.nodes.filter(n => n.depth === node.depth + 1)
          if (depthNodes.length === 1) {
            return
          }
        }


        let nodes = []

        // find parent nodes
        const addParents = (node) => {
          nodes.push(node)
          if (node.parent) {
            addParents(node.parent)
          }
        }

        // find children  nodes
        const addChildren = (node) => {
          nodes.push(node)
          node.children.forEach((child) => {
            addChildren(child)
          })
        }

        addParents(node)
        addChildren(node)

        // remove root and dupplicate
        // nodes = nodes.filter(n => n.id !== this.rootId)
        nodes = [...new Set(nodes)]

        const sibs = []
        let sibling = node.getNextSibling()
        while (sibling) {
          sibs.push(sibling)
          sibling = sibling.getNextSibling()
        }

        // dont adjust the right most node
        if (sibs.length === 0) {
          return
        }

        sibs.forEach((sibling) => {
          if (sibling.children.length === 0) {
            sibling.setFinalX(sibling.getFinalX() + w / 2 + this.config.hSpacing / 2)
          }
        })


        // console.log(sibs)
        nodes.forEach((node) => {
          if (isVertical) {
            node.setFinalX(node.getFinalX() + w / 2 + this.config.hSpacing / 2)
          } else {
            node.setFinalY(node.getFinalY() + h / 2 + this.config.vSpacing / 2)
          }
        })
      }

      if (node.children.length === 1) {
        fixOneChildProblem(node)
      }
    }

    // center node between two nodes if it does not have any children but left and right do
    const fixZeroChildProblem = (node) => {
      node.children.forEach((child) => {
        fixZeroChildProblem(child)
      })


      if (node.children.length > 0 || node.depth >= this.renderDepth) {
        return
      }

      const prev = node.prevSibling
      // const next = this.nodes.filter(n => n.depth === node.depth && n.prevSibling !== null).find(n => n.prevSibling.id === node.id)
      const next = node.getNextSibling()

      if (!next || !prev) {
        return
      }

      if (isVertical) {
        node.setFinalX((prev.getFinalX() + next.getFinalX()) / 2)
      } else {
        node.setFinalY((prev.getFinalY() + next.getFinalY()) / 2)
      }
    }

    // fix root and move it to the absolute layout center
    const centerRootNode = (node) => {
      if (isVertical) {
        let minX = 0
        let maxX = 0
        const queue = [node]
        while (queue.length) {
          const deq = queue.shift()

          minX = Math.min(deq.getFinalX(), minX)
          maxX = Math.max(deq.getFinalX(), maxX)
          deq.children.forEach((child) => queue.push(child))
        }
        node.setFinalX((minX + maxX) / 2)
      } else {
        let minY = 0
        let maxY = 0
        const queue = [node]
        while (queue.length) {
          const deq = queue.shift()

          minY = Math.min(deq.getFinalY(), minY)
          maxY = Math.max(deq.getFinalY(), maxY)
          deq.children.forEach((child) => queue.push(child))
        }
        node.setFinalY((minY + maxY) / 2)
      }
    }

    // helper method to tell each edge to calculate its position
    const calculateEdgePositions = (edges) => {
      edges.forEach((edge) => {
        edge.calculateEdge()
      })
    }

    // add a visual indication that there is more data available
    const calculateLeafs = (node) => {
      if (this.config.showLeafIndications === false) {
        return
      }
      const root = node

      const addLeaf = (currentNode) => {
        if (currentNode.hasNoChildren() && (currentNode.hasChildrenIds() || currentNode.getInvisibleChildren().length >= this.config.visibleNodeLimit)) {
          if (currentNode.getInvisibleChildren().length > 0) {
            currentNode.setChildrenIds(currentNode.getInvisibleChildren())
          }
          const existing = this.leafs.find((l) => l.id === currentNode.getId())

          if (existing === undefined) {
            const leaf = new Leaf(this.canvas, currentNode, this.config)
            const x = x ? x : currentNode.getFinalX()
            const y = y ? y : currentNode.getFinalY()

            leaf.setLayoutId(this.layoutIdentifier)
            leaf.setFinalX(x)
            leaf.setFinalY(y)
            leaf.setInitialX(root.getFinalX())
            leaf.setInitialY(root.getFinalY())
            leaf.setIsReRender(isReRender || false)
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
      removeLeaf(node)
    }

    // calculate the layout dimensions and move off screen objects into the screen
    const calculateLayoutInfo = (tree) => {
      const toRender = [tree]
      const rendered = []
      while (toRender.length) {
        const current = toRender.shift()
        const node = this.nodes.find((n) => n.id === current.id)
        rendered.push(node)

        current.children.forEach((child) => {
          toRender.push(child)
        })
      }

      const hAdjustment = Math.min(...rendered.map((node) => {
        const w = this.config.renderingSize === "max" ? node.getMaxWidth() : node.getMinWidth()
        return node.getFinalX() - w
      }))
      const vAdjustment = Math.min(...rendered.map((node) => {
        const h = this.config.renderingSize === "max" ? node.getMaxHeight() : node.getMinHeight()
        return node.getFinalY() - h
      }))

      rendered.forEach((node) => {
        const x = ((node.getFinalX() - hAdjustment) + offset) + this.config.translateX
        const y = (node.getFinalY() - vAdjustment) + this.config.translateY
        node.setFinalX(x)
        node.setFinalY(y)
      })
      this.edges.forEach((edge) => {
        edge.setFinalToX((edge.getFinalToX() - hAdjustment) + offset + this.config.translateX)
        edge.setFinalToY(edge.getFinalToY() - vAdjustment + this.config.translateY)
        edge.setFinalFromX((edge.getFinalFromX() - hAdjustment) + offset + this.config.translateX)
        edge.setFinalFromY(edge.getFinalFromY() - vAdjustment + this.config.translateY)
      })


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


      // this.canvas.line(x1, y1, x2, y2).stroke({ width: 2, color: "red" })
      if (this.l1) {
        this.l1.remove()
        this.l2.remove()
      }

      this.l1 = this.canvas.line(x0, y0, x0, 300).stroke({ width: 2, color: "red" })
      this.l2 = this.canvas.line(x1, y0, x1, 300).stroke({ width: 2, color: "red" })


      const oldCx = this.layoutInfo.x
      this.layoutInfo = {
        x: x0,
        y: y0,
        cx: (x0 + x2) / 2,
        cy: (y0 + y2) / 2,
        w: calculateDistance(x0, y0, x1, y1),
        h: calculateDistance(x1, y1, x2, y2),
      }

      // shift layout to right if it took space from a left layout
      const shiftValue = oldCx - this.layoutInfo.x
      if (shiftValue > 0) {
        // 
        this.nodes.forEach(node => {
          node.setFinalX(node.getFinalX() + shiftValue)
        })
        this.edges.forEach(edge => {
          edge.setFinalToX((edge.getFinalToX() + shiftValue))
          edge.setFinalFromX((edge.getFinalFromX() + shiftValue))
        })
        this.layoutInfo = {
          ...this.layoutInfo,
          x: this.layoutInfo.x + shiftValue,
          cx: this.layoutInfo.cx + shiftValue
        }
        this.l2.dx(shiftValue)
      }
      if (isReRender === true) {
        console.log(offset)
      }
      // console.log("new", shiftValue, isReRender)
    }

    // inform nodes about incoming and outgoing edges
    const addEdgeReferences = (node) => {
      node.children.forEach((child) => {
        const func = (edge) => edge.fromNode.getId() === child.getId() && edge.toNode.getId() === node.getId()
        const e = this.edges.find((edge) => func(edge))
        node.addIncomingEdge(e)
        child.addOutgoingEdge(e)

        addEdgeReferences(child)
      })
    }

    const tree = buildTreeFromNodes(this.nodes)[0]
    initializeNodes(tree)
    calculateXYPositions(tree)
    calculateModifier(tree)

    fixConflicts(tree)
    fixZeroChildProblem(tree)
    centerRootNode(tree)

    calculateEdgePositions(this.edges)
    calculateLeafs(tree)
    calculateLayoutInfo(tree)
    addEdgeReferences(tree)


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
    const X = x ? x : this.nodes.find((n) => n.id === this.rootId).getFinalX()
    const Y = y ? y : this.nodes.find((n) => n.id === this.rootId).getFinalY()


    // render nodes and edges
    const renderNodes = () => {
      this.nodes.forEach((node) => {
        // render nodes
        if (node.isRendered() === false) {
          if (this.config.renderingSize === "max") node.renderAsMax(X, Y)
          if (this.config.renderingSize === "min") node.renderAsMin(X, Y)

          // find provided events
          const eventStr = [...new Set(this.events.map((e) => e.event))].toString().split(",")
          // console.log(eventStr, this.events)
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
            // add all provided event
            this.events.forEach((myevent) => {
              if (myevent.event === type && myevent.modifier === modifier) {
                this.expandOrCollapseDataAsyncEvent(node)
              }
            })
          })


          // render edge references
          node.outgoingEdges.forEach((edge) => {
            if (edge.isRendered() === false) {
              edge.render(X, Y)
            }
          })

          // or transform nodes into position
        } else if (node.isRendered() === true) {
          node.transformToFinalPosition()
        }
      })
    }

    // render possible leafs
    const renderLeafs = () => {
      this.leafs.forEach((leaf) => {
        if (leaf.isRendered() === false) {
          leaf.render(isReRender === true)
        } else if (leaf.isRendered() === true) {
          // console.log("transform leaf", leaf)
          leaf.transformToFinalPosition({})
        }
      })
    }

    // update edges
    const renderEdges = () => {
      this.edges.forEach((edge) => {
        if (edge.isRendered() === true) {
          edge.transformToFinalPosition({ isReRender: isReRender || false })
        }
      })
    }

    renderNodes()
    renderLeafs()
    renderEdges()
  }
}


export default TreeLayout
