import BaseLayout from "./BaseLayout"
import RadialLeaf from "./helpers/RadialLeaf"
import RadialLayoutConfiguration from "../configuration/RadialLayoutConfiguration"
import { buildTreeFromNodes } from "../utils/TreeConstruction"
import { calculateDistance } from "../utils/Calculations"

/**
 * This class is calculates and renders the radial layout.
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

  async expandOrCollapseDataAsyncEvent(node) {
    const leaf = this.leafs.find((l) => l.id === node.id)
    if (leaf !== undefined) {
      leaf.removeSVG()
      this.leafs = this.leafs.filter((l) => l.id !== node.id)
    }


    await this.updateRadialDataAsync(node)
  }


  registerEventListener(event, modifier, func) {
    // remove default event listener
    if (this.events.find((d) => d.defaultEvent === true)) {
      this.events = this.events.filter((e) => e.defaultEvent !== true)
    }

    // add new event listener
    this.events.push({ event, modifier, func })
  }

  // calculates the radial layout positions for all given nodes and edges
  calculateLayout(offset = 0, { isReRender = false }) {
    this.initialOffset = offset

    // updates the depth level for each node
    const updateNodeDepth = (node, depth) => {
      node.setDepth(depth)
      node.children.forEach((child) => {
        updateNodeDepth(child, depth + 1)
      })
    }

    // calculates the X and Y position for nodes and edges
    const calculateFinalPosition = (node, root, alfa, beta) => {

      const w = this.config.renderingSize === "max" ? node.getMaxWidth() : node.getMinWidth()
      const h = this.config.renderingSize === "max" ? node.getMaxHeight() : node.getMinHeight()

      // center root
      if (node.parentId === null || node.id === this.rootId) {
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

      // find the number of children in the subtree
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
          calculateFinalPosition(child, root, theta, mü)
        }


        // calculate edge
        const e = this.edges.find((e) => e.fromNode.id === child.id && e.toNode.id === node.id)
        e.calculateEdge()

        node.addIncomingEdge(e)
        child.addOutgoingEdge(e)

        theta = mü
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

          const existing = this.leafs.find((l) => l.id === currentNode.getId())

          if (existing === undefined) {


            const leaf = new RadialLeaf(this.canvas, currentNode, root, this.config)
            leaf.parentChildren = this.nodes.filter(n => n.getDepth() === currentNode.getDepth() + 1).length

            leaf.setLayoutId(this.layoutIdentifier)
            this.leafs.push(leaf)

          }


        }
        currentNode.children.forEach((child) => {
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
        const h = this.config.renderingSize === "max" ? node.getMaxHeight() : node.getMinHeight()
        return node.getFinalX() - w - Math.max(w, h) / 1.5 // .. and add some space for leafs
      }))
      const vAdjustment = Math.min(...rendered.map((node) => {
        const w = this.config.renderingSize === "max" ? node.getMaxWidth() : node.getMinWidth()
        const h = this.config.renderingSize === "max" ? node.getMaxHeight() : node.getMinHeight()
        return node.getFinalY() - h - Math.max(w, h) / 1.5 // .. and add some space for leafs
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

      // this.canvas.circle(5).fill("#000").center(x0, y0)
      // this.canvas.circle(5).fill("#75f").center(x1, y1)
      // this.canvas.circle(15).fill("#f75").center(x2, y2 + 300)
      // if (this.l1) {
      //   this.l1.remove()
      //   this.l2.remove()
      // }

      // this.l1 = this.canvas.line(x0, y0, x0, 300).stroke({ width: 2, color: "red" })
      // this.l2 = this.canvas.line(x1, y0, x1, 300).stroke({ width: 2, color: "red" })

      // const oldCx = this.layoutInfo.x
      this.layoutInfo = {
        x: x0,
        y: y0,
        cx: (x0 + x2) / 2,
        cy: (y0 + y2) / 2,
        w: calculateDistance(x0, y0, x1, y1),
        h: calculateDistance(x1, y1, x2, y2),
      }

      // // shift layout to right if it took space from a left layout
      // const shiftValue = oldCx - this.layoutInfo.x
      // if (shiftValue > 0) {
      //   // console.log("new", shiftValue, this.layoutInfo.x)
      //   this.nodes.forEach(node => {
      //     node.setFinalX(node.getFinalX() + shiftValue)
      //   })
      //   this.edges.forEach(edge => {
      //     edge.setFinalToX((edge.getFinalToX() + shiftValue))
      //     edge.setFinalFromX((edge.getFinalFromX() + shiftValue))
      //   })
      //   this.layoutInfo = {
      //     ...this.layoutInfo,
      //     x: this.layoutInfo.x + shiftValue,
      //     cx: this.layoutInfo.cx + shiftValue
      //   }
      //   this.l2.dx(shiftValue)
      // }

    }

    const tree = buildTreeFromNodes(this.nodes)[0]
    updateNodeDepth(tree, 0)
    calculateFinalPosition(tree, tree, 0, 2 * Math.PI)
    calculateLeafs(tree)
    calculateLayoutInfo(tree)



    this.tree = tree
    console.log("Radial", this.layoutInfo)
    return this.layoutInfo
  }

  renderLayout({ isReRender = false, x = null, y = null }) {
    const X = x ? x : this.nodes.find((n) => n.id === this.rootId).getFinalX()
    const Y = y ? y : this.nodes.find((n) => n.id === this.rootId).getFinalY()


    const renderNodes = () => {
      const toRender = [this.tree]
      while (toRender.length) {
        const current = toRender.shift()
        const node = this.nodes.find((n) => n.id === current.id)

        if (node.isRendered() === false) {

          if (this.config.renderingSize === "max") node.renderAsMax(X, Y)
          if (this.config.renderingSize === "min") node.renderAsMin(X, Y)

          // find provided events
          const eventStr = [...new Set(this.events.map((e) => e.event))].toString().split(",")
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
        } else if (node.isRendered() === true) { // update nodes
          node.transformToFinalPosition()
        }

        current.children.forEach((child) => {
          toRender.push(child)
        })
      }
    }

    // render possible leafs
    const renderLeafs = () => {
      this.leafs.forEach((leaf) => {
        if (leaf.isRendered() === false) {
          leaf.render()
        } else if (leaf.isRendered() === true) {
          // console.lo
          leaf.transformToFinalPosition(isReRender)
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

    // this.canvas.children().transform({ translateY: 500, translateX: 600 })
  }
}


export default RadialLayout
