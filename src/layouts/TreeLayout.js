import BaseLayout from "./BaseLayout"
import Leaf from "./helpers/TreeLeaf"
import TreeLayoutConfiguration from "../configuration/TreeLayoutConfiguration"


/**
 * This class depicts given data within a tree layout. 
 * 
 * @param {Object} [customConfig={ }] Overrides default layout configuration properties. Available options: {@link TreeLayoutConfiguration}
 * @param {Object} [customEvents={ }] Overrides event listener configuration properties.
 * @param {Object} [customNodes={ }] Overrides default node representation properties.
 * 
 */
class TreeLayout extends BaseLayout {
  constructor(customConfig = {}, customEventlisteners = [], customNodes = {}) {
    super(customNodes)

    if (customConfig.root === undefined) {
      throw new Error("No Focus element reference id provided")
    }

    if (customConfig.renderDepth === undefined) {
      throw new Error("The tree layout requires a defined render depth")
    }

    this.config = { ...TreeLayoutConfiguration, ...customConfig }

    // layout specific
    this.rootId = customConfig.root
    this.renderDepth = customConfig.renderDepth
    this.leafs = []

    // events
    this.events = [
      {
        event: "dblclick",
        modifier: undefined,
        func: "expandOrCollapseEvent",
        defaultEvent: true
      }
    ]
    customEventlisteners.forEach(event => {
      this.registerEventListener(event.event, event.modifier, event.func)
    })
  }


  /**
   * Event method which either loads more data or removes existing data. 
   * @param {BaseNode} node The node that recieved the event.
   */
  async expandOrCollapseDataAsyncEvent(node) {
    // remove clicked leaf indication
    const leaf = this.leafs.find(l => l.id === node.id)
    if (leaf !== undefined) {
      leaf.removeLeaf()
      this.leafs = this.leafs.filter(l => l.id !== node.id)
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
    if (this.events.find(d => d.defaultEvent === true)) {
      this.events = this.events.filter(e => e.defaultEvent !== true)
    }

    // add new event listener
    this.events.push({ event, modifier, func })
  }






  /**
   * Calculates the tree layout based on an underlying algorithm.
   * @param {Number} [offset=0] Determines the space the layout has to shift right in order to avoid overlapping layouts.
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Boolean} opts.isReRender Determines if the layout is rerenderd.
   * @param {Number} opts.x The x coordinate for the clicked node.
   * @param {Number} opts.y The y coordinate for the clicked node.
   */
  calculateLayout(offset = 0, opts = {}) {
    const isVertical = this.config.orientation === "vertical"

    // construct the final tree that is visible
    const buildTreeFromNodes = (array, parentRef, rootRef) => {
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
          buildTreeFromNodes(array, child)
        })
      }
      return root
    }

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

      for (let i = 0; i < node.children.length - 1; i += 1) {
        const c1 = getLeftContour(node.children[i])
        const c2 = getRightContour(node.children[i + 1])

        if (c1 >= c2) {
          shift(node.children[i + 1], c1 - c2 + distance)
        }
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

    // add a visual indication that there are more nodes loadable
    const calculateLeafs = (node) => {
      if (this.config.showLeafIndications === false) {
        return
      }
      const root = node
      const config = {
        animationSpeed: this.config.animationSpeed,
        strokeWidth: this.config.leafStrokeWidth,
        strokeColor: this.config.leafStrokeColor,
        marker: this.config.leafMarker,
      }

      const addLeaf = (node) => {
        if (node.children.length === 0 && (node.childrenIds.length > 0 || node.invisibleChildren.length >= this.config.visibleNodeLimit)) {
          if (node.invisibleChildren.length > 0) {
            node.childrenIds = node.invisibleChildren
          }
          const existing = this.leafs.find(l => l.id === node.id)

          if (existing === undefined) {
            const isHorizontal = this.config.orientation === "horizontal"
            const leaf = new Leaf(this.canvas, node, this.config.leafIndicationLimit, config, isHorizontal)
            const x = opts.x ? opts.x : node.finalX
            const y = opts.y ? opts.y : node.finalY
            leaf.finalX = x
            leaf.finalY = y
            leaf.initialX = root.getFinalX()
            leaf.initialY = root.getFinalY()
            leaf.isReRender = opts.isReRender || false
            this.leafs.push(leaf)

          }

        }
        node.children.forEach((child) => {
          addLeaf(child, root)
        })
      }

      const removeLeaf = () => {
        const toRemove = []
        const existingNodeIds = this.nodes.map(n => n.id)
        this.leafs.forEach(leaf => {
          if (!existingNodeIds.includes(leaf.id)) {
            toRemove.push(leaf)
          }
        })

        toRemove.forEach(leaf => {
          leaf.removeLeaf()
        })
        this.leafs = this.leafs.filter(l => !toRemove.map(l => l.id).includes(l.id))
      }

      // add new leafs
      addLeaf(node)

      // remove existing leafs which are not used anymore
      removeLeaf(node)
    }

    // calculate the layout dimensions
    const calculateLayoutInfo = (tree) => {
      const toRender = [tree]
      const rendered = []
      while (toRender.length) {
        const current = toRender.shift()
        const node = this.nodes.find(n => n.id === current.id)
        rendered.push(node)

        current.children.forEach(child => {
          toRender.push(child)
        })
      }

      const hAdjustment = Math.min(...rendered.map(node => {
        const w = this.config.renderingSize === "max" ? node.getMaxWidth() : node.getMinWidth()
        return node.getFinalX() - w
      }))
      const vAdjustment = Math.min(...rendered.map(node => {
        const h = this.config.renderingSize === "max" ? node.getMaxHeight() : node.getMinHeight()
        return node.getFinalY() - h
      }))

      rendered.forEach(node => {
        const x = ((node.getFinalX() - hAdjustment) + offset) + this.config.translateX
        const y = (node.getFinalY() - vAdjustment) + this.config.translateY
        node.setFinalX(x)
        node.setFinalY(y)
      })
      this.edges.forEach(edge => {
        edge.finalToX = (edge.finalToX - hAdjustment) + offset + this.config.translateX
        edge.finalFromX = (edge.finalFromX - hAdjustment) + offset + this.config.translateX
        edge.finalToY = edge.finalToY - vAdjustment + this.config.translateY
        edge.finalFromY = edge.finalFromY - vAdjustment + this.config.translateY
      })

      const x0 = Math.min(...rendered.map(n => {
        const w = this.config.renderingSize === "max" ? n.getMaxWidth() : n.getMinWidth()
        return n.getFinalX() - w
      }))
      const y0 = 0

      const x1 = Math.max(...rendered.map(n => {
        const w = this.config.renderingSize === "max" ? n.getMaxWidth() : n.getMinWidth()
        return n.getFinalX() + w
      }))
      const y1 = 0

      const x2 = x1
      const y2 = Math.max(...rendered.map((n) => {
        const h = this.config.renderingSize === "max" ? n.getMaxHeight() : n.getMinHeight()
        return n.getFinalY() + h
      }))

      const calculateDistance = (sx, sy, tx, ty) => {
        const dx = tx - sx
        const dy = ty - sy
        return Math.sqrt(dx * dx + dy * dy)
      }


      this.layoutInfo = {
        x: x0,
        y: y0,
        cx: (x0 + x2) / 2,
        cy: (y0 + y2) / 2,
        w: calculateDistance(x0, y0, x1, y1),
        h: calculateDistance(x1, y1, x2, y2),
      }
    }

    // inform nodes about incoming and outgoing edges
    const addEdgeReferences = (node) => {
      node.children.forEach(child => {
        const e = this.edges.find(e => e.fromNode.id === child.id && e.toNode.id === node.id)
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
   * @param {Boolean} opts.isReRender Determines if the layout is rerenderd.
   * @param {Number} opts.x The x coordinate for the clicked node.
   * @param {Number} opts.y The y coordinate for the clicked node.
   */
  renderLayout(opts = {}) {
    const X = opts.x ? opts.x : this.nodes.find(n => n.id === this.rootId).getFinalX()
    const Y = opts.y ? opts.y : this.nodes.find(n => n.id === this.rootId).getFinalY()


    // render nodes and edges
    const renderNodes = () => {
      this.nodes.forEach((node) => {

        // render nodes
        if (node.isRendered() === false) {
          if (this.config.renderingSize === "max") node.renderAsMax(X, Y)
          if (this.config.renderingSize === "min") node.renderAsMin(X, Y)


          // find provided events
          const eventStr = [...new Set(this.events.map(e => e.event))].toString().split(",")
          // console.log(eventStr, this.events)
          node.svg.on(eventStr, (e) => {
            const type = e.type
            let modifier = undefined
            if (e.altKey === true) {
              modifier = "altKey"
            } else if (e.ctrlKey === true) {
              modifier = "ctrlKey"
            } else if (e.shiftKey === true) {
              modifier = "shiftKey"
            }
            // add all provided event
            this.events.forEach(myevent => {
              // console.log(myevent.event, type, "-", myevent.modifier, modifier, myevent)
              if (myevent.event === type && myevent.modifier === modifier) {
                this.expandOrCollapseDataAsyncEvent(node)
              }
            })
          })




          // render edge references
          node.outgoingEdges.forEach(edge => {
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
          leaf.render(opts.isReRender === true ? true : false)
        } else if (leaf.isRendered() === true) {
          leaf.transformToFinalPosition()
        }
      })
    }

    // update edges
    const renderEdges = () => {
      this.edges.forEach((edge) => {
        if (edge.isRendered() === true) {
          edge.transformToFinalPosition({ isReRender: opts.isReRender || false })
        }
      })
    }

    renderNodes()
    renderLeafs(opts)
    renderEdges(opts)
  }
}


export default TreeLayout
