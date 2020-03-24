import BaseLayout from "./BaseLayout"
import Leaf from "./helpers/LeafExtension"

const TreeConfig = {
  maxLayoutWidth: 600,
  minHeight: window.innerHeight - 10,

  // where to translate a given layout
  translateX: 0,
  translateY: 0,

  // layout animation speed
  animationSpeed: 300,

  // how a layout starts
  layoutState: "expanded", // expanded, collapsed // TODO: ask: even needed?

  // tree orientation
  orientation: "vertical", // vertical, horizontal

  // hide all other layouts and center selected one
  hideOtherLayouts: false, // TODO:

  // node spacing
  vSpacing: 100,
  hSpacing: 25,

  // how to render all nodes
  renderingSize: "min", // min, max

  // renders additional edges to indicate loadable nodes
  showAdditionEdges: true, // true, false
}


class TreeLayout extends BaseLayout {
  constructor(customTreeConfig = {}) {
    super()
    this.config = { ...TreeConfig, ...customTreeConfig }

    this.leafs = []
  }


  calculateLayout() {
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


    const InitializeNodes = (node, parent, prevSibling, depth) => {
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

      node.children.forEach((child, i) => {
        const prev = i >= 1 ? node.children[i - 1] : null
        InitializeNodes(child, node, prev, depth + 1)
      })
    }

    const finalizeTree = (node) => {
      node.setFinalX(node.getFinalX() + this.config.translateX)
      node.setFinalY(node.getFinalY() + this.config.translateY)

      node.children.forEach((child) => {
        finalizeTree(child)
      })
    }

    const CalculateFinalPositions = (node, modifier) => {
      if (isVertical) {
        node.setFinalX(node.getFinalX() + modifier)
      } else {
        node.setFinalY(node.getFinalY() + modifier)
      }


      node.children.forEach((child) => {
        CalculateFinalPositions(child, node.modifier + modifier)
      })
    }


    const CalculateInitialX = (node) => {
      node.children.forEach((child) => {
        CalculateInitialX(child)
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
      if (this.config.showAdditionEdges === false) {
        return
      }

      if (node.children.length === 0 && node.childrenIds.length > 0) {
        const leaf = new Leaf(this.canvas, node)
        leaf.finalX = node.finalX
        const h = this.config.renderingSize === "max" ? node.config.maxHeight : node.config.minHeight
        leaf.finalY = node.finalY + h + 35
        leaf.initialX = initialX
        leaf.initialY = initialY
        leaf.addEvent("dblclick", () => { this.manageDataAsync(node) })
        this.leafs.push(leaf)
      }

      node.children.forEach((child) => {
        addLeaf(child, initialX, initialY)
      })
    }


    const root = constructTree(this.nodes)[0] // TODO: filter for root
    InitializeNodes(root, null, null, 0)
    CalculateInitialX(root)
    CalculateFinalPositions(root, 0)
    fixOverlappingConflicts(root)
    centerRoot(root)
    finalizeTree(root)
    calcRadialEdges(this.edges)
    addLeaf(root, root.getFinalX(), root.getFinalY())

    // console.log(root)
  }


  renderLayout() {
    this.centerX = this.nodes[0].getFinalX()
    this.centerY = this.nodes[0].getFinalY()


    this.nodes.forEach((node) => {
      if (this.config.renderingSize === "max") {
        if (node.svg === null) node.renderAsMax(this.centerX, this.centerY)
      } else if (this.config.renderingSize === "min") {
        if (node.svg === null) {
          node.renderAsMin(this.centerX, this.centerY)
        }
      }
      node.transformToFinalPosition()
    })


    this.leafs.forEach((leaf) => {
      leaf.render()
      leaf.transformToFinalPosition()
    })


    this.edges.forEach((edge) => {
      if (edge.svg === null) {
        edge.render(this.centerX, this.centerY)
      }
      edge.transformToFinalPosition()
    })
  }
}


export default TreeLayout
