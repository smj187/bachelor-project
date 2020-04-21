import BaseLayout from "./BaseLayout"
import Leaf from "./helpers/LeafExtension"
import TreeLayoutConfiguration from "../configuration/TreeLayoutConfiguration"


/**
 * This class is calculates and renders the tree layout.
 */
class TreeLayout extends BaseLayout {
  constructor(customConfig = {}, events = [], additionalNodeRepresentations) {
    super(additionalNodeRepresentations)

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
    this.registerMouseEvents(events)

  }

  registerMouseEvents(events) {

    const loadOrHideData = async (node) => {
      this.leafs.forEach(leaf => {
        leaf.removeLeaf()
      })
      this.leafs = []
      await this.updateTreeDataAsync(node)
    }
    if (events.length > 0) {
      this.events = [
        {
          name: "nodeEvent",
          func: loadOrHideData,
          mouse: events.find(e => e.name === "nodeEvent").mouse || "dblclick",
          modifier: events.find(e => e.name === "nodeEvent").modifier || "ctrlKey",
        }
      ]
    } else {
      this.events = [
        {
          name: "nodeEvent",
          func: loadOrHideData,
          mouse: "dblclick",
          modifier: "ctrlKey",
        }
      ]
    }

  }


  calculateLayout(offset = 0) {
    const isVertical = this.config.orientation === "vertical"

    // construct a tree
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


    const initializeNodes = (node, parent, prevSibling, depth) => {
      node.setDepth(depth)
      node.setParent(parent)
      node.setPrevSibling(prevSibling)

      if (isVertical) {
        node.setFinalY(depth)
      } else {
        node.setFinalX(depth)
      }

      if (node.getChildren() === undefined) {
        node.setChildren([])
      }

      // if (node.children.length <= this.config.childLimit) {
      node.children.forEach((child, i) => {
        const prev = i >= 1 ? node.children[i - 1] : null
        initializeNodes(child, node, prev, depth + 1)
      })
      // } else {
      // node.childrenIds = node.children.map(c => c.id)
      // node.children = []
      // this.nodes = this.nodes
      // }


    }

    const finalizeTree = (node) => {
      node.setFinalX(node.getFinalX() + this.config.translateX)
      node.setFinalY(node.getFinalY() + this.config.translateY)

      node.children.forEach((child) => {
        finalizeTree(child)
      })
    }

    const calculateFinalPositions = (node, modifier) => {
      if (isVertical) {
        node.setFinalX(node.getFinalX() + modifier)
      } else {
        node.setFinalY(node.getFinalY() + modifier)
      }


      node.children.forEach((child) => {
        calculateFinalPositions(child, node.modifier + modifier)
      })
    }


    const calculateInitialX = (node) => {
      node.children.forEach((child) => {
        calculateInitialX(child)
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


    const fixOverlappingConflicts = (node) => {
      node.children.forEach((child) => {
        fixOverlappingConflicts(child)
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

    const centerRoot = (node) => {
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

    const calcRadialEdges = (edges) => {
      edges.forEach((edge) => {
        edge.calculateEdge()
      })
    }

    const addLeaf = (node, initialX, initialY) => {
      if (this.config.showLeafNodes === false) {
        return
      }

      if (node.children.length === 0 && node.childrenIds.length > 0) {
        const leaf = new Leaf(this.canvas, node)
        leaf.finalX = node.finalX
        const h = this.config.renderingSize === "max" ? node.config.maxHeight : node.config.minHeight
        leaf.finalY = node.finalY + h + 35
        leaf.initialX = initialX
        leaf.initialY = initialY
        // leaf.addEvent("dblclick", () => { this.manageDataAsync(node) })
        this.leafs.push(leaf)
      }

      node.children.forEach((child) => {
        addLeaf(child, initialX, initialY)
      })
    }

    const adjustPositions = (tree) => {
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

      // this.canvas.circle(5).fill("#000").center(x0, y0)
      // this.canvas.circle(5).fill("#75f").center(x1, y1)
      // this.canvas.circle(5).fill("#f75").center(x2, y2)

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

    const addEdgeReferences = (node) => {
      node.children.forEach(child => {
        const e = this.edges.find(e => e.fromNode.id === child.id && e.toNode.id === node.id)
        node.addIncomingEdge(e)
        child.addOutgoingEdge(e)

        addEdgeReferences(child)
      })
    }


    const root = constructTree(this.nodes)[0] // TODO: re-write
    initializeNodes(root, null, null, 0)
    calculateInitialX(root)
    calculateFinalPositions(root, 0)
    fixOverlappingConflicts(root)
    centerRoot(root)
    finalizeTree(root)
    calcRadialEdges(this.edges)
    addLeaf(root, root.getFinalX(), root.getFinalY())
    adjustPositions(root)
    addEdgeReferences(root)

    // console.log(root)
  }


  renderLayout() {
    const X = this.nodes.find(n => n.id === this.rootId).getFinalX()
    const Y = this.nodes.find(n => n.id === this.rootId).getFinalY()

    const findChildren = (root) => {
      const nodes = []
      const queue = [root]
      while (queue.length) {
        const cur = queue.shift()
        nodes.push(cur)
        cur.children.forEach(child => queue.push(child))
      }
      return nodes
    }

    const renderNodes = () => {
      this.nodes.forEach((node) => {
        if (node.isRendered() === false) {
          if (this.config.renderingSize === "max") node.renderAsMax(X, Y)
          if (this.config.renderingSize === "min") node.renderAsMin(X, Y)

          if (node.children.length > this.config.childLimit) {
            // this.events[0].func(node)


            // console.log(node.children)
          }


          node.svg.on(this.events[0].mouse, (e) => {
            if (this.events[0].modifier !== null) {
              if (this.events[0].modifier, e[this.events[0].modifier]) {
                this.events[0].func(node)
              }
            }
          })
          node.outgoingEdges.forEach(edge => {
            if (edge.isRendered() === false) {
              edge.render(X, Y)
            }
          })

        } else if (node.isRendered() === true) {
          node.transformToFinalPosition()
        }
      })


      this.leafs.forEach((leaf) => {
        leaf.render()
        leaf.transformToFinalPosition()
      })


      this.edges.forEach((edge) => {
        if (edge.isRendered() === false) {
          edge.render(X, Y)
        } else if (edge.isRendered() === true) {

          edge.transformToFinalPosition()
        }
      })
    }

    renderNodes()


  }
}


export default TreeLayout
