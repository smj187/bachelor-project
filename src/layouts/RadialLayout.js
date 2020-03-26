import BaseLayout from "./BaseLayout"


const RadialConfig = {
  maxLayoutWidth: 600,
  maxLayoutHeight: 600,

  // where to translate a given layout
  translateX: 0,
  translateY: 0,

  // layout animation speed
  animationSpeed: 300,

  // how a layout starts
  layoutState: "expanded", // expanded, collapsed // TODO: ask: even needed?

  // hide all other layouts and center selected one
  hideOtherLayouts: false, // TODO:

  // radial radius (first radius only)
  radialRadius: 200,

  // user defined delta angle constant (second+ radius)
  radiusDelta: 150,

  hAspect: 4 / 3,
  wAspect: 4 / 4,

  // how to render all nodes
  renderingSize: "min", // min, max
}

class RadialLayout extends BaseLayout {
  constructor(customRadialConfig = {}) {
    super()


    this.config = { ...RadialConfig, ...customRadialConfig }
  }

  // calculates the radial layout positions for all given nodes and edges
  calculateLayout() {
    // construct a tree
    const constructTree = (array, parentRef, rootRef) => {
      let root = rootRef !== undefined ? rootRef : []
      const parent = parentRef !== undefined ? parentRef : { id: null }
      const children = array.filter((child) => child.parentId === parent.id)
      // console.log("0", children, parent, parentRef)
      if (children.length > 0) {
        if (parent.id === null) {
          // console.log("1", children)
          root = children
        } else {
          parent.children = children
          // console.log("2", children)
        }

        children.forEach((child) => {
          // console.log("chid", child, child instanceof Number)
          constructTree(array, child)
        })
      }
      return root
    }


    const updateNodeDepth = (node, depth) => {
      node.setDepth(depth)
      node.children.forEach((child) => {
        updateNodeDepth(child, depth + 1)
      })
    }


    const calcRadialPositions = (node, alfa, beta) => {
      // center root
      if (node.parentId === null) {
        node.setFinalX(this.config.maxLayoutWidth / 2 + this.config.translateX)
        node.setFinalY(this.config.maxLayoutHeight / 2 + this.config.translateY)
      }

      // depth of node inside tree
      const depth = node.getDepth()

      // theta
      let theta = alfa

      // multipler for depth levels after the first circle
      const delta = this.config.radiusDelta

      // innermost circle radius + delta angle
      const radius = this.config.radialRadius + (delta * depth)


      const BFS = (root) => {
        const visited = []
        const queue = []
        let leaves = 0

        queue.push(root)
        visited.push(root)

        while (queue.length) {
          const current = queue.shift()

          current.children.forEach((child) => {
            if (!queue.includes(child)) {
              queue.push(child)
            }
          })

          if (current.children.length === 0) {
            leaves += 1
          }
        }


        return leaves
      }

      // number of children in the subtree
      const children = BFS(node)


      node.children.forEach((child) => {
        // number of leaves in subtree
        const lambda = BFS(child)
        const mü = theta + ((lambda / children) * (beta - alfa))

        const x = radius * Math.cos((theta + mü) / 2) * this.config.hAspect
        const y = radius * Math.sin((theta + mü) / 2) * this.config.wAspect

        child.setFinalX(x + this.config.maxLayoutWidth / 2 + this.config.translateX)
        child.setFinalY(y + this.config.maxLayoutHeight / 2 + this.config.translateY)

        if (child.children.length > 0) {
          calcRadialPositions(child, theta, mü)
        }

        theta = mü
      })
    }


    // calculate edges
    const calcRadialEdges = (edges) => {
      edges.forEach((edge) => {
        edge.calculateEdge()
      })
    }

    const tree = constructTree(this.nodes)[0] // TODO: where is the root?
    updateNodeDepth(tree, 0)
    calcRadialPositions(tree, 0, 2 * Math.PI)
    calcRadialEdges(this.edges)
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

    // this.nodes.forEach((node) => {
    // })


    this.edges.forEach((edge) => {
      if (edge.svg === null) {
        edge.render(this.centerX, this.centerY)
      }
      edge.transformToFinalPosition()
    })


    // this.edges.forEach((edge) => {
    // })
  }
}


export default RadialLayout
