import BaseLayout from "./BaseLayout"
import RadialLayoutConfiguration from "../configuration/RadialLayoutConfiguration"


/**
 * This class is calculates and renders the radial layout.
 */
class RadialLayout extends BaseLayout {
  constructor(customConfig = {}, events = [], additionalNodeRepresentations) {
    super(additionalNodeRepresentations)

    if (customConfig.root === undefined) {
      throw new Error("No Focus element reference id provided")
    }

    if (customConfig.renderDepth === undefined) {
      throw new Error("The radial layout requires a defined render depth")
    }

    this.config = { ...RadialLayoutConfiguration, ...customConfig }

    // layout specific
    this.rootId = customConfig.root
    this.renderDepth = customConfig.renderDepth
    this.registerMouseEvents(events)

  }


  registerMouseEvents(events) {

    const loadOrHideData = async (node) => { await this.updateRadialDataAsync(node) }
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

  // calculates the radial layout positions for all given nodes and edges
  calculateLayout(offset = 0) {
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

    const updateNodeDepth = (node, depth) => {
      node.setDepth(depth)
      node.children.forEach((child) => {
        updateNodeDepth(child, depth + 1)
      })
    }

    const calculateFinalPosition = (node, alfa, beta) => {

      const w = this.config.renderingSize === "max" ? node.getMaxWidth() : node.getMinWidth()

      // center root
      if (node.parentId === null || node.id === this.tree.id) {
        node.setFinalX(this.config.translateX + w / 2)
        node.setFinalY(this.config.translateY)
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

        child.setFinalX(x + this.config.translateX + w / 2)
        child.setFinalY(y + this.config.translateY)

        if (child.children.length > 0) {
          calculateFinalPosition(child, theta, mü)
        }

        // calculate edge
        const e = this.edges.find(e => e.fromNode.id === child.id && e.toNode.id === node.id)
        e.calculateEdge()

        node.addIncomingEdge(e)
        child.addOutgoingEdge(e)

        theta = mü
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




    this.tree = constructTree(this.nodes)[0]
    updateNodeDepth(this.tree, 0)
    calculateFinalPosition(this.tree, 0, 2 * Math.PI)
    adjustPositions(this.tree)

    // console.log("Radial", this.layoutInfo)
    return this.layoutInfo
  }

  renderLayout() {

    const X = this.nodes.find(n => n.id === this.rootId).getFinalX()
    const Y = this.nodes.find(n => n.id === this.rootId).getFinalY()

    // console.log(this.nodes)
    // console.log(this.edges)

    const renderNodes = () => {

      const toRender = [this.tree]
      while (toRender.length) {
        const current = toRender.shift()
        const node = this.nodes.find(n => n.id === current.id)

        if (node.isRendered() === false) {

          // add add or remove event
          // node.addEvent("dblclick", () => { this.updateRadialDataAsync(node) })

          if (this.config.renderingSize === "max") node.renderAsMax(X, Y)
          if (this.config.renderingSize === "min") node.renderAsMin(X, Y)

          node.svg.on(this.events[0].mouse, (e) => {
            if (this.events[0].modifier !== null) {
              if (this.events[0].modifier, e[this.events[0].modifier]) {
                this.events[0].func(node)
              }
            }
          })

          //   this.gridExpander.svg.on(this.events[0].mouse, (e) => {
          //   if (this.events[0].modifier !== null) {
          //     if (this.events[0].modifier, e[this.events[0].modifier]) {
          //       this.events[0].func()
          //     }
          //   } else {
          //     this.expandGridLayoutEvent()
          //   }
          // })



          node.outgoingEdges.forEach(edge => {
            if (edge.isRendered() === false) {
              edge.render(X, Y)
            }
          })
        } else if (node.isRendered() === true) { // update nodes
          node.transformToFinalPosition()
        }

        current.children.forEach(child => {
          toRender.push(child)
        })
      }

      this.edges.forEach((edge) => {
        if (edge.isRendered() === true) {
          edge.transformToFinalPosition()
        }
      })

    }

    renderNodes()


  }
}


export default RadialLayout
