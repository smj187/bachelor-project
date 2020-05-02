import BaseLayout from "./BaseLayout"
import RadialLeaf from "./helpers/RadialLeaf"
import RadialLeaf1 from "./helpers/RadialLeaf1"
import RadialLayoutConfiguration from "../configuration/RadialLayoutConfiguration"
import { buildTreeFromNodes } from "../utils/TreeConstruction"

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
        event: "dblclick",
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


    const updateNodeDepth = (node, depth) => {
      node.setDepth(depth)
      node.children.forEach((child) => {
        updateNodeDepth(child, depth + 1)
      })
    }

    const calculateFinalPosition = (node, root, alfa, beta) => {

      const w = this.config.renderingSize === "max" ? node.getMaxWidth() : node.getMinWidth()

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
      const delta = this.config.radiusDelta

      // innermost circle radius + delta angle
      const radius = this.config.initialRadius + (delta * depth)


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
        // if (child.hasNoChildren() && (child.hasChildrenIds() || child.getInvisibleChildren().length >= this.config.visibleNodeLimit)) {
        //   const leaf = new RadialLeaf1(this.canvas, child, root, this.config)
        //   leaf.parentId = node.id
        //   calculateFinalPosition(leaf, root, theta, mü)
        //   this.leafs.push(lea)
        // }

        if (child.children.length > 0) {
          calculateFinalPosition(child, root, theta, mü)
        }


        // if (child.hasNoChildren() && (child.hasChildrenIds() || child.getInvisibleChildren().length >= this.config.visibleNodeLimit)) {
        //   const x0 = root.getFinalX()
        //   const y0 = root.getFinalY()
        //   const x1 = child.getFinalX()
        //   const y1 = child.getFinalY()

        //   const w = this.config.renderingSize === "max" ? node.config.maxWidth : node.config.minWidth
        //   const h = this.config.renderingSize === "max" ? node.config.maxHeight : node.config.minHeight

        //   // this.canvas.circle(10).center(x0, y0).fill("#f75")
        //   // this.canvas.circle(10).center(x1, y1).fill("#f0f")
        //   // this.canvas.rect(10, 10).center(x1, y1)

        //   const x2 = x0 * this.config.hAspect
        //   const y2 = y0 * this.config.wAspect
        //   // const r = radius + (delta * 3)
        //   const r = radius + (delta * (depth + 2)) + Math.min(w, h)
        //   // console.log(radius + this.config.initialRadius, x2, y2)
        //   // this.canvas.ellipse(r * this.config.hAspect, r * this.config.wAspect).center(x0, y0).fill("none").stroke({ width: 1, color: "red" })



        //   const angle = Math.atan2(y1 - y0, x1 - x0)
        //   // // console.log(child.id, theta, mü, angle)
        //   // // console.log(alfa, beta, theta)

        //   // console.log(Math.min(w,h))

        //   const x3 = x1 + (this.config.radiusDelta * 2) * Math.cos(angle)
        //   const y3 = y1 + (this.config.radiusDelta * 2) * Math.sin(angle)

        //   const line = { x1, y1, x3, y3 }
        //   const circle = { x0, y0, r, }
        //   const leaf = new RadialLeaf(this.canvas, child, root, this.config, line, circle)
        //   leaf.id = i
        //   console.log("-->", this.nodes.filter(n => n.depth === depth + 1).length)
        //   leaf.parentChildren = this.nodes.filter(n => n.depth === depth + 1).length
        //   leaf.rootX = x0
        //   leaf.rootY = y0
        //   this.leafs.push(leaf)

        //   // this.canvas.rect(10, 10).center(x3, y3).fill("#000")

        // }

        // calculate edge
        const e = this.edges.find((e) => e.fromNode.id === child.id && e.toNode.id === node.id)
        e.calculateEdge()

        node.addIncomingEdge(e)
        child.addOutgoingEdge(e)

        theta = mü
      })
    }

    const calculateLeafs = (node) => {
      const root = node
      const addLeaf = (currentNode) => {
        if (currentNode.hasNoChildren() && (currentNode.hasChildrenIds() || currentNode.getInvisibleChildren().length >= this.config.visibleNodeLimit)) {
          // console.log("cur", currentNode)


          if (currentNode.getInvisibleChildren().length > 0) {
            // currentNode.setChildrenIds(currentNode.getInvisibleChildren())
          }
          const existing = this.leafs.find((l) => l.id === currentNode.getId())
          // console.log(existing)
          if (existing === undefined) {

            const x0 = root.getFinalX()
            const y0 = root.getFinalY()
            const x1 = currentNode.getFinalX()
            const y1 = currentNode.getFinalY()

            const w = this.config.renderingSize === "max" ? node.config.maxWidth : node.config.minWidth
            const h = this.config.renderingSize === "max" ? node.config.maxHeight : node.config.minHeight

            // this.canvas.circle(10).center(x0, y0).fill("#f75")
            // this.canvas.circle(10).center(x1, y1).fill("#f0f")
            // this.canvas.rect(10, 10).center(x1, y1)

            const x2 = x0 * this.config.hAspect
            const y2 = y0 * this.config.wAspect
            // const r = radius + (delta * 3)


            // find max radius
            const depth = currentNode.getDepth()


            const leaf = new RadialLeaf(this.canvas, currentNode, root, this.config)
            // console.log("-->", this.nodes.filter(n => n.depth === depth + 1).length)
            leaf.parentChildren = this.nodes.filter(n => n.depth === depth + 1).length
            console.log("create leaf for", currentNode.id)


            leaf.rootX = x0
            leaf.rootY = y0
            this.leafs.push(leaf)

            // this.canvas.rect(10, 10).center(x3, y3).fill("#000")

            //   if (currentNode.getInvisibleChildren().length > 0) {
            //     currentNode.setChildrenIds(currentNode.getInvisibleChildren())
            //   }
            //   const existing = this.leafs.find((l) => l.id === currentNode.getId())

            //   if (existing === undefined) {
            //     const isHorizontal = this.config.orientation === "horizontal"
            //     const leaf = new Leaf(this.canvas, currentNode, config, isHorizontal)
            //     const x = x ? x : currentNode.getFinalX()
            //     const y = y ? y : currentNode.getFinalY()

            //     leaf.setFinalX(x)
            //     leaf.setFinalY(y)
            //     leaf.setInitialX(root.getFinalX())
            //     leaf.setInitialY(root.getFinalY())
            //     leaf.setIsReRender(isReRender || false)
            //     this.leafs.push(leaf)
            //   }
            // }
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




      addLeaf(node)
      removeLeaf()
    }

    const adjustPositions = (tree) => {
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
        return node.getFinalX() - w - this.config.radiusDelta / 1.5 // .. and add some space for leafs
      }))
      const vAdjustment = Math.min(...rendered.map((node) => {
        const h = this.config.renderingSize === "max" ? node.getMaxHeight() : node.getMinHeight()
        return node.getFinalY() - h - this.config.radiusDelta / 1.5 // .. and add some space for leafs
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

      const calculateDistance = (sx, sy, tx, ty) => {
        const dx = tx - sx
        const dy = ty - sy
        return Math.sqrt(dx * dx + dy * dy)
      }

      // this.canvas.line(x1, y1, x2, y2).stroke({ width: 2, color: "red" })


      this.layoutInfo = {
        x: x0,
        y: y0,
        cx: (x0 + x2) / 2,
        cy: (y0 + y2) / 2,
        w: calculateDistance(x0, y0, x1, y1),
        h: calculateDistance(x1, y1, x2, y2),
      }
    }

    const tree = buildTreeFromNodes(this.nodes)[0]
    updateNodeDepth(tree, 0)
    calculateFinalPosition(tree, tree, 0, 2 * Math.PI)
    calculateLeafs(tree)
    adjustPositions(tree)

    this.tree = tree
    // console.log("Radial", this.layoutInfo, this.nodes, this.tree)
    return this.layoutInfo
  }

  renderLayout({ isReRender = false, x = null, y = null }) {
    const X = x ? x : this.nodes.find((n) => n.id === this.rootId).getFinalX()
    const Y = y ? y : this.nodes.find((n) => n.id === this.rootId).getFinalY()

    // console.log(this.nodes)
    // console.log(this.edges)

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
          leaf.render(isReRender === true)
        } else if (leaf.isRendered() === true) {
          leaf.transformToFinalPosition()
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
