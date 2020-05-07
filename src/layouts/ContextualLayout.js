import BaseLayout from "./BaseLayout"
import ContextualContainer from "./helpers/ContextualContainer"
import GridExpander from "./helpers/GridExpander"
import ContextualRiskConnection from "./helpers/ContextualRiskConnection"
import ContextualContainerConnection from "./helpers/ContextualContainerConnection"
import ContextualLayoutConfiguration from "../configuration/ContextualLayoutConfiguration"
import ContextualConnection from "./helpers/ContextualConnection"
import { calculateDistance } from "../utils/Calculations"
import BoldEdge from "../edges/BoldEdge"

const colorshift = (col, amt) => {
  const num = parseInt(col, 16)
  const r = (num >> 16) + amt
  const b = ((num >> 8) & 0x00FF) + amt
  const g = (num & 0x0000FF) + amt
  const newColor = g | (b << 8) | (r << 16)
  return newColor.toString(16)
}
/**
 * This class calculates and renders the contextual layout.
 *
 * @category Layouts
 */
class ContextualLayout extends BaseLayout {
  constructor(customConfig = {}, customEventlisteners = [], customNodes = {}, customEdges = {}) {
    super(customNodes, customEdges)


    if (customConfig.focusId === undefined) {
      throw new Error("No Focus element reference id provided")
    }

    this.config = { ...ContextualLayoutConfiguration, ...customConfig }


    // layout specific
    this.focusId = customConfig.focusId
    this.areChildrenExpended = false
    this.areParentsExpended = false
    this.areRisksExpended = false
    this.assignedInfo = null
    this.riskConnection = null
    this.assignedConnection = null
    this.containerConnections = []
    this.containers = []
    this.expanders = []

    this.focus = null
    this.parents = []
    this.children = []
    this.assgined = null
    this.risks = []




    // events
    this.events = [
      {
        event: "click",
        modifier: undefined,
        func: "expandOrCollapseGridEvent",
        defaultEvent: true,
      },
      {
        event: "click",
        modifier: undefined,
        func: "traverseInLayoutEvent",
        defaultEvent: true,
      }
    ]
    customEventlisteners.forEach((event) => {
      this.registerEventListener(event.event, event.modifier, event.func)
    })
  }

  async expandOrCollapseGridEvent({ isParentOperation = false, type = "parent" }) {


    // node references
    const focusNode = this.nodes.find(n => n.getId() === this.focusId)
    const childNodes = this.nodes.filter(n => focusNode.childrenIds.includes(n.id))
    const riskNodes = this.nodes.filter(n => this.assignedInfo.risks.includes(n.id))
    const parentIds = focusNode.parentId !== null
      ? focusNode.parentId instanceof Array ? focusNode.parentId : [focusNode.parentId]
      : []
    const parentNodes = this.nodes.filter(n => parentIds.includes(n.id))

    const addOrRemoveNodes = (upperLimit, currentLimit, offset, nodes) => {

      // add new nodes
      if (upperLimit >= currentLimit) {
        const notRenderedNodes = nodes.filter((n) => n.isRendered() === false)

        // create new SVGs
        notRenderedNodes.forEach((node) => {
          node.setInitialX(node.getFinalX())
          node.setInitialY(node.getFinalY() + offset)
          node.renderAsMin({})
        })

      } else {
        // else, remove nodes again
        const nodesToHide = nodes.filter((c, i) => i >= upperLimit)

        // remove SVGs
        nodesToHide.forEach((node) => {
          node.removeSVG({ isContextualNode: true, isContextualParentOperation: isParentOperation })
        })

      }
    }

    const updateContainer = (containerName, opts) => {
      const container = this.containers.find(c => c.type === containerName)
      container.update(opts)
    }



    if (type === "parent") {
      // determines how far down nodes animate in
      const offset = isParentOperation ? -50 : 50

      // limitations
      const upperLimit = this.config.riskContainerNodeLimit
      const currentLimit = riskNodes.filter(n => n.isRendered() === true).length

      addOrRemoveNodes(upperLimit, currentLimit, offset, parentNodes)
      updateContainer("parent", { areParentsExpended: this.areParentsExpended })
    }

    if (type === "child") {
      // determines how far down nodes animate in
      const offset = isParentOperation ? -50 : 50


      // limitations
      const upperLimit = this.config.childContainerNodeLimit
      const currentLimit = childNodes.filter(n => n.isRendered() === true).length

      addOrRemoveNodes(upperLimit, currentLimit, offset, childNodes)
      updateContainer("child", { areChildrenExpended: this.areChildrenExpended })
    }

    if (type === "risk") {
      // determines how far down nodes animate in
      const offset = isParentOperation ? -50 : 50

      // limitations
      const upperLimit = this.config.riskContainerNodeLimit
      const currentLimit = riskNodes.filter(n => n.isRendered() === true).length


      addOrRemoveNodes(upperLimit, currentLimit, offset, riskNodes)
      updateContainer("risk", { areRisksExpended: this.areRisksExpended })

    }
  }





  async traverseInLayoutEvent(node) {
    if (node.id === this.focusId) {
      return
    }
    await this.updateContextualDataAsync({ clickedNode: node })
  }



  calculateLayout({ offset = 0, isReRender = false, isParentOperation = false }) {
    this.currentOffset = offset
    // console.log(this.nodes, this.edges)

    this.canvas.circle(15).center(offset, 10).fill("red")
    this.canvas.circle(15).center(offset, this.config.layoutHeight).fill("red")
    this.canvas.circle(15).center(offset + this.config.layoutWidth, 10).fill("orange")
    this.canvas.circle(15).center(offset + this.config.layoutWidth, this.config.layoutHeight).fill("orange")

    const focusNode = this.nodes.find(n => n.getId() === this.focusId)
    const assginedNode = this.nodes.find(n => n.getId() === this.assignedInfo.assigned)
    const childNodes = this.nodes.filter(n => focusNode.childrenIds.includes(n.id))

    const parentIds = focusNode.parentId !== null
      ? focusNode.parentId instanceof Array ? focusNode.parentId : [focusNode.parentId]
      : []
    const parentNodes = this.nodes.filter(n => parentIds.includes(n.id))

    const riskNodes = this.nodes.filter(n => this.assignedInfo.risks.includes(n.id))



    // calculate focus position
    const calculateFocusPosition = () => {
      // the focus element area takes 3/2 of available space


      const x = (this.config.layoutWidth / 3) + offset + this.config.focusXShift
      const y = (this.config.layoutHeight / 2)

      focusNode.setInitialX(x)
      focusNode.setInitialY(y + 50)

      focusNode.setFinalX(x)
      focusNode.setFinalY(y)
    }

    // caculate assgined node position
    const calculateAssignedPosition = () => {
      // skip this method if no assigned information is provided
      if (this.assignedInfo === null) {
        return
      }

      const w = assginedNode.getMinWidth()
      const x = (this.config.layoutWidth - w / 2) + offset
      const y = (this.config.layoutHeight / 2)

      assginedNode.setInitialX(x)
      assginedNode.setInitialY(y + 50)

      assginedNode.setFinalX(x)
      assginedNode.setFinalY(y)
    }

    const calculateAssignedConnection = () => {
      // skip this method if no assigned information is provided
      if (this.assignedInfo === null) {
        return
      }

      const assignedConnection = new ContextualConnection(this.canvas, focusNode, assginedNode, this.config)
      assignedConnection.setLayoutId(this.layoutIdentifier)

      this.assignedConnection = assignedConnection
    }

    const calculateNodePositions = (nodes, type) => {
      // skip this method if no assigned information is provided
      if (nodes.length === 0) {
        return
      }

      // only show a restricted amount of nodes
      let limitedNodes
      let cols
      let containerLimitation
      let showExpander


      if (type === "child") {
        limitedNodes = nodes.slice(0, this.config.childContainerNodeLimit)
        cols = this.config.childContainerColumns
        containerLimitation = this.config.childContainerColumns
        showExpander = this.config.showChildExpander



      } else if (type === "parent") {
        limitedNodes = nodes.slice(0, this.config.parentContainerNodeLimit)
        cols = this.config.parentContainerColumns
        containerLimitation = this.config.parentContainerColumns
        showExpander = this.config.showParentExpander


      } else if (type === "risk") {
        limitedNodes = nodes.slice(0, this.config.riskContainerNodeLimit)
        cols = this.config.riskContainerColumns
        containerLimitation = this.config.riskContainerColumns
        showExpander = this.config.showRiskExpander
      }


      let nodeIndex = 0
      const nodeCols = []
      const nodeRows = []


      // divide nodes into sets of rows
      for (let i = 0; i < nodes.length; i += 1) {
        const row = []
        for (let j = 0; j < cols; j += 1) {
          const node = nodes[nodeIndex]
          if (node !== undefined) {
            row.push(node)
            nodeIndex += 1
          }
        }
        if (row.length) {
          nodeRows.push(row)
        }
      }

      // divide nodes into sets of columns
      nodeIndex = 0
      for (let i = 0; i < cols; i += 1) {
        nodeCols.push([])
      }
      nodes.forEach((node, i) => {
        const col = nodeCols[i % cols]
        col.push(node)
      })




      // calculate initial position
      nodes.forEach((node) => {
        const w = node.getMinWidth()
        const h = node.getMinHeight()


        let x
        let y

        if (type === "child") {
          x = this.config.spacing + w / 2
          y = this.config.spacing
            + focusNode.getFinalY()
            + focusNode.getMaxHeight() / 2
            + this.config.childrenFocusDistance
            + this.config.spacing * 2
            + h / 2
        }

        if (type === "parent") {
          x = this.config.spacing + node.getMinWidth() / 2
          y = focusNode.getFinalY()
            - focusNode.getMaxHeight() / 2
            - this.config.parentFocusDistance
            - this.config.spacing * 3
            - node.getMinHeight() / 2
        }
        if (type === "risk") {
          x = this.config.spacing + w / 2
          y = this.config.spacing
            + focusNode.getFinalY()
            + this.config.riskConnectionDistance
            + this.config.spacing
            + h / 2
        }


        node.setFinalX(x)
        node.setFinalY(y)
      })






      // find row spacing
      let rowSpacing = 0
      nodeRows.forEach((row) => {
        const h = row.map((n) => n.getMinHeight())
        const max = Math.max(...h)
        rowSpacing = Math.max(rowSpacing, max)
      })

      // calculate y positions
      nodeRows.forEach((row, i) => {
        if (i >= 1) {
          row.forEach((n) => {
            const h = (rowSpacing + this.config.spacing) * i

            if (type === "child") {
              n.setFinalY(n.getFinalY() + h)
            }
            if (type === "parent") {
              n.setFinalY(n.getFinalY() - h)
            }
            if (type === "risk") {
              n.setFinalY(n.getFinalY() + h)
            }
          })
        }
      })


      // find col spacing
      let columnSpacing = 0
      nodeRows.forEach((row) => {
        const w = row.map((n) => n.getMinWidth())
        const max = Math.max(...w)
        columnSpacing = Math.max(columnSpacing, max)
      })

      // calculate x positions
      nodeCols.forEach((column, i) => {
        if (i >= 1) {
          column.forEach((n) => {
            const w = (columnSpacing + this.config.spacing) * i
            n.setFinalX(n.getFinalX() + w)
          })
        }
      })


      // calculate container
      // top left
      let x0 = Math.min(...nodes.map((n) => {
        const w = n.getMinWidth()
        return n.getFinalX() - w / 2 - this.config.spacing / 1
      }))

      let y0 = Math.min(...nodes.map((n) => {
        const h = n.getMinHeight()
        return n.getFinalY() - h / 2 - this.config.spacing / 1
      }))


      // top right
      let x1 = Math.max(...nodes.map((n) => {
        const w = n.getMinWidth()
        return n.getFinalX() + w / 2 + this.config.spacing / 1
      }))

      let y1 = y0



      // adjust X position
      let adjustment = focusNode.getFinalX() - (x0 + x1) / 2
      if (type === "risk") {
        adjustment += this.config.riskFocusDistance
      }
      nodes.forEach((node) => {
        node.setFinalX(node.getFinalX() + adjustment)
      })




      // absolute bottom right
      let x2 = x1
      let y2 = Math.max(...nodes.map((n) => {
        const h = n.getMinHeight()
        return n.getFinalY() + h / 2 + this.config.spacing / 1
      }))

      // absolute bottom left
      let x3 = x0
      let y3 = y2

      let maxcx = (x0 + x2) / 2
      let maxcy = (y0 + y2) / 2



      // minimal button left
      let x4 = x0
      let y4 = Math.max(...limitedNodes.map((n) => {
        const h = n.getMinHeight()
        return n.getFinalY() + h / 2 + this.config.spacing / 1
      }))

      // minimal button right
      let x5 = x1
      let y5 = y4

      let mincx = (x0 + x5) / 2
      let mincy = (y0 + y5) / 2



      // the same, but in reverse for the parent container
      let x6 = x0
      let y6 = Math.min(...limitedNodes.map((n) => {
        const h = n.getMinHeight()
        return n.getFinalY() - h / 2 - this.config.spacing / 1
      }))

      let x7 = x1
      let y7 = y6




      x0 += adjustment
      x1 += adjustment
      x2 += adjustment
      x3 += adjustment
      x4 += adjustment
      x5 += adjustment
      x6 += adjustment
      x7 += adjustment
      maxcx += adjustment
      mincx += adjustment



      // this.canvas.circle(5).fill("#000").center(x0, y0)
      // this.canvas.circle(5).fill("#75f").center(x1, y1)
      // this.canvas.circle(5).fill("#f75").center(x2, y2)
      // this.canvas.circle(5).fill("#00f").center(x3, y3)
      // this.canvas.circle(5).fill("#f00").center(x4, y4)
      // this.canvas.circle(5).fill("#ff0").center(x5, y5)
      // this.canvas.circle(1).fill("#ccc").center(x6, y6)
      // this.canvas.circle(1).fill("#222").center(x7, y7)
      // this.canvas.circle(5).fill("#1f1").center(maxcx, maxcy)
      // this.canvas.circle(5).fill("#000").center(mincx, mincy)


      let xx0 = x0
      let yy0 = y0
      if (type === "parent") {

        x0 = x6
        y0 = y6

        x1 = x7
        y1 = y7

        mincx = (x6 + x5) / 2
        mincy = (y6 + y5) / 2
      }

      const maxHeight = (type === "child" || type === "risk")
        ? calculateDistance(x1, y1, x2, y2)
        : calculateDistance(xx0, yy0, x4, y4)



      // set initial render position
      nodes.forEach(node => {
        node.setInitialX(focusNode.getFinalX())
        node.setInitialY(focusNode.getFinalY())
      })


      // calculate container
      if (limitedNodes.length <= containerLimitation) {
        return
      }



      // we only want the limited amount of nodes to calculate the container info
      const containerInfo = {
        type,
        maxcx,
        maxcy,
        mincx,
        mincy,
        minHeight: calculateDistance(x0, y0, x4, y4),
        maxHeight,
        width: calculateDistance(x0, y0, x1, y1)
      }

      const container = new ContextualContainer(this.canvas, focusNode, containerInfo, this.config)
      container.setLayoutId(this.layoutIdentifier)
      container.setType(type)
      this.containers.push(container)



      // calculate expander
      if (showExpander === false) {
        return
      }

      // calculate expander
      if (nodes.length > limitedNodes.length) {

        const expander = new GridExpander(this.canvas, this.config)
        expander.setLayoutId(this.layoutIdentifier)
        expander.setType(type)

        if (type === "child") {
          expander.setIsLayoutExpended(this.areChildrenExpended)
        }
        if (type === "parent") {
          expander.setIsLayoutExpended(this.areParentsExpended)
        }
        if (type === "risk") {
          expander.setIsLayoutExpended(this.areRisksExpended)
        }


        // expander on top
        if (type === "risk" || type === "child") {
          const ex = x0 + this.config.spacing
          const ey = y0 - this.config.spacing * 1.5

          expander.setFinalX(ex)
          expander.setFinalY(ey)
        } else {
          const ex = x0 + this.config.spacing
          const ey = y3 + this.config.spacing * 1.5

          expander.setFinalX(ex)
          expander.setFinalY(ey)
        }

        this.expanders.push(expander)
      }
    }

    const calculateRiskConnection = () => {
      if (this.assignedInfo === null || riskNodes.length === 0) {
        return
      }
      const contextualRiskConnection = new ContextualRiskConnection(
        this.canvas,
        riskNodes,
        this.containers.find(c => c.type === "risk"),
        focusNode,
        assginedNode,
        this.assignedConnection,
        this.config)
      contextualRiskConnection.setLayoutId(this.layoutIdentifier)
      this.riskConnection = contextualRiskConnection
    }


    const calculateContainerEdges = () => {
      const parentContainer = this.containers.find(c => c.type === "parent") || null
      const childContainer = this.containers.find(c => c.type === "child") || null

      // skip this method if no containers exist
      // if (parentContainer === null && childContainer === null) {
      //   return
      // }

      // calculate container edges
      if (parentContainer !== null) {
        const containerConnection = new ContextualContainerConnection(this.canvas, focusNode, parentContainer, parentNodes, this.config)
        containerConnection.setLayoutId(this.layoutIdentifier)
        containerConnection.setType("parent")
        this.containerConnections.push(containerConnection)
      }

      if (childContainer !== null) {
        const containerConnection = new ContextualContainerConnection(this.canvas, focusNode, childContainer, childNodes, this.config)
        containerConnection.setLayoutId(this.layoutIdentifier)
        containerConnection.setType("child")
        this.containerConnections.push(containerConnection)
      }


      // calculate parent edges
      const parentEdges = this.edges.filter(e => e.fromNode.id === focusNode.id)
      const childEdges = this.edges.filter(e => e.toNode.id === focusNode.id)
      if (parentContainer === null) {




        parentEdges.forEach(edge => {

          // update fromNode X position only for bold edges
          edge.calculateEdge({ isContextualParent: true })
        })
      } else {
        this.edges = this.edges.filter(e => e.fromNode.id !== focusNode.id)
      }


      // calculate child edges
      if (childContainer === null) {
        childEdges.forEach(edge => {
          edge.calculateEdge({ isContextualChild: true })
        })
      } else {
        this.edges = this.edges.filter(e => e.toNode.id !== focusNode.id)
      }
    }




    const calculateLayoutInfo = () => {
      const nodes = [
        ...this.parents.slice(0, this.config.parentContainerNodeLimit),
        ...this.children.slice(0, this.config.childContainerNodeLimit),
        ...this.risks.slice(0, this.config.riskContainerNodeLimit),
        this.assgined,
      ]


      let x0 = Math.min(...nodes.map((n) => {
        const w = n.getMinWidth()
        return n.getFinalX() - w / 2 - this.config.spacing * 2
      }))

      if (this.parents.length === 0 && this.children.length === 0) {
        x0 = this.focus.getFinalX() - this.focus.getMaxWidth() / 2 - this.config.spacing * 2
      }

      const y0 = 0
      // this.canvas.circle(5).fill("#f75").center(x0, y0)


      // top right
      let x1 = Math.max(...nodes.map((n) => {
        const w = n.getMinWidth()
        return n.getFinalX() + w / 2 + this.config.spacing / 2
      }))

      if (this.parents.length === 0 && this.children.length === 0) {
        x1 = this.focus.getFinalX() + this.focus.getMaxWidth() / 2 + this.config.spacing * 2
      }

      const y1 = y0
      // this.canvas.circle(5).fill("#75f").center(x1, y1)


      // bottom right
      const x2 = x1
      const y2 = Math.max(...this.nodes.map((n) => {
        const h = n.getMinHeight()
        return n.getFinalY() + h / 2 + this.config.spacing / 2
      }))

      if (this.risks.length === 0 && this.children.length === 0) {
        y2 = this.focus.getFinalY() + this.focus.getMaxHeight() / 2 + this.config.spacing * 2
      }
      // this.canvas.circle(5).fill("#f75").center(x2, y2)


      // bottom left
      const x3 = x0
      const y3 = y2
      // this.canvas.circle(5).fill("#000").center(x3, y3)


      const cx = (x0 + x2) / 2
      const cy = (y0 + y2) / 2
      // this.canvas.circle(5).fill("#1f1").center(cx, cy)

      // store layout width and height info
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


    calculateFocusPosition()
    calculateAssignedPosition()
    calculateAssignedConnection()

    calculateNodePositions(childNodes, "child")
    calculateNodePositions(parentNodes, "parent")
    calculateNodePositions(riskNodes, "risk")

    calculateRiskConnection()

    calculateContainerEdges()


    // calculateParentEdges()
    // calculateChildEdges()
    // calculateFocusAssginedEdge()

    // calculateLayoutInfo()


    return this.layoutInfo
  }


  renderLayout({ isReRender = false, x = null, y = null, isParentOperation = false }) {
    this.centerX = this.config.maxLayoutWidth / 2
    this.centerY = this.config.maxLayoutHeight / 2
    const focusNode = this.nodes.find(n => n.getId() === this.focusId)

    const X = focusNode.getFinalX()
    const Y = focusNode.getFinalY()

    const renderContainers = () => {
      this.containers.forEach((container) => {
        // if (container.isRendered() === false) {
        container.render({ isParentOperation })
        // }

        // if (container.isRendered() === true) {
        //   container.transformToFinalPosition()
        // }
      })
    }



    const renderExpanders = () => {



      this.expanders.forEach(expander => {
        expander.render({ cx: X, cy: Y })

        // find provided events
        const events = this.events.filter(e => e.func === "expandOrCollapseGridEvent")
        const eventStr = [...new Set(events.map((e) => e.event))].toString().split(",")


        // attach events to SVG object
        expander.svg.on(eventStr, (e) => {
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
          events.forEach((myevent) => {
            if (myevent.event === type && myevent.modifier === modifier) {

              if (expander.type === "child") {
                // change the current expand state
                this.areChildrenExpended = !this.areChildrenExpended

                // update the expanders text
                if (this.areChildrenExpended === true) {
                  expander.changeToShowMoreText()
                } else {
                  expander.changeToHideMoreText()
                }
              }

              if (expander.type === "parent") {
                // change the current expand state
                this.areParentsExpended = !this.areParentsExpended

                // update the expanders text
                if (this.areParentsExpended === true) {
                  expander.changeToShowMoreText()
                } else {
                  expander.changeToHideMoreText()
                }
              }


              if (expander.type === "risk") {
                // change the current expand state
                this.areRisksExpended = !this.areRisksExpended

                // update the expanders text
                if (this.areRisksExpended === true) {
                  expander.changeToShowMoreText()
                } else {
                  expander.changeToHideMoreText()
                }
              }

              this.expandOrCollapseGridEvent({ isParentOperation, type: expander.type })

            }
          })
        })

      })

      this.expanders.forEach((expander) => {
        // if (expander.type === "childExpander" && expander.isRendered() === false) {
        //   const reRenderFunc = () => {
        //     if (this.config.cachedChildNodeLimit === undefined) {
        //       this.config = {
        //         ...this.config,
        //         cachedChildNodeLimit: this.config.childContainerNodeLimit,
        //         childContainerNodeLimit: this.children.length,
        //       }

        //       this.calculateLayout()
        //       const childExpander = this.expanders.find((e) => e.type === "childExpander")
        //       childExpander.transformToFinalPosition()
        //       this.containers.find((c) => c.type === "child").update()

        //       const notRenderedNodes = this.children.filter((n) => n.isRendered() === false)
        //       notRenderedNodes.forEach((child) => {
        //         child.renderAsMin(child.getFinalX(), child.getFinalY())
        //       })

        //       expander.changeToShowMoreText()
        //     } else {
        //       this.config = {
        //         ...this.config,
        //         cachedChildNodeLimit: this.config.childContainerNodeLimit,
        //         childContainerNodeLimit: this.config.cachedChildNodeLimit,
        //       }
        //       delete this.config.cachedChildNodeLimit

        //       this.calculateLayout()
        //       const childExpander = this.expanders.find((e) => e.type === "childExpander")
        //       childExpander.transformToFinalPosition()
        //       this.containers.find((c) => c.type === "child").update()

        //       const nodesToHide = this.children.filter((c, i) => i >= this.config.childContainerNodeLimit)
        //       nodesToHide.forEach((node) => {
        //         node.removeNode(null, null, { animation: false })
        //       })


        //       expander.changeToHideMoreText()
        //     }
        //   }
        //   expander.setReRenderFunc(reRenderFunc)
        //   expander.render(X, Y)
        //   expander.transformToFinalPosition()
        // }

        // if (expander.type === "parentExpander" && expander.isRendered() === false) {
        //   const reRenderFunc = () => {
        //     if (this.config.cachedParentContainerNodeLimit === undefined) {
        //       this.config = {
        //         ...this.config,
        //         cachedParentContainerNodeLimit: this.config.parentContainerNodeLimit,
        //         parentContainerNodeLimit: this.parents.length,
        //       }

        //       this.calculateLayout()
        //       const childExpander = this.expanders.find((e) => e.type === "parentExpander")
        //       childExpander.transformToFinalPosition()
        //       this.containers.find((c) => c.type === "parent").update()

        //       const notRenderedNodes = this.parents.filter((n) => n.isRendered() === false)
        //       notRenderedNodes.forEach((child) => {
        //         child.renderAsMin(child.getFinalX(), child.getFinalY())
        //       })

        //       expander.changeToShowMoreText()
        //     } else {
        //       this.config = {
        //         ...this.config,
        //         cachedParentContainerNodeLimit: this.config.parentContainerNodeLimit,
        //         parentContainerNodeLimit: this.config.cachedParentContainerNodeLimit,
        //       }
        //       delete this.config.cachedParentContainerNodeLimit

        //       this.calculateLayout()
        //       const childExpander = this.expanders.find((e) => e.type === "parentExpander")
        //       childExpander.transformToFinalPosition()
        //       this.containers.find((c) => c.type === "parent").update()

        //       const nodesToHide = this.parents.filter((c, i) => i >= this.config.parentContainerNodeLimit)
        //       nodesToHide.forEach((node) => {
        //         node.removeNode(null, null, { animation: false })
        //       })


        //       expander.changeToHideMoreText()
        //     }
        //   }
        //   expander.setReRenderFunc(reRenderFunc)
        //   expander.render(X, Y)
        //   expander.transformToFinalPosition()
        // }

        // if (expander.type === "riskExpander" && expander.isRendered() === false) {
        //   const reRenderFunc = () => {
        //     if (this.config.cachedRiskContainerNodeLimit === undefined) {
        //       this.config = {
        //         ...this.config,
        //         cachedRiskContainerNodeLimit: this.config.riskContainerNodeLimit,
        //         riskContainerNodeLimit: this.risks.length,
        //       }

        //       this.calculateLayout()
        //       const childExpander = this.expanders.find((e) => e.type === "riskExpander")
        //       childExpander.transformToFinalPosition()
        //       this.containers.find((c) => c.type === "risk").update()

        //       const notRenderedNodes = this.risks.filter((n) => n.isRendered() === false)
        //       notRenderedNodes.forEach((child) => {
        //         // console.log(child.getFinalX(), child.getFinalY())
        //         child.renderAsMin(child.getFinalX(), child.getFinalY())
        //       })

        //       expander.changeToShowMoreText()
        //     } else {
        //       this.config = {
        //         ...this.config,
        //         cachedRiskContainerNodeLimit: this.config.riskContainerNodeLimit,
        //         riskContainerNodeLimit: this.config.cachedRiskContainerNodeLimit,
        //       }
        //       delete this.config.cachedRiskContainerNodeLimit

        //       this.calculateLayout()
        //       const childExpander = this.expanders.find((e) => e.type === "riskExpander")
        //       childExpander.transformToFinalPosition()
        //       this.containers.find((c) => c.type === "risk").update()

        //       const nodesToHide = this.risks.filter((c, i) => i >= this.config.riskContainerNodeLimit)
        //       nodesToHide.forEach((node) => {
        //         node.removeNode(null, null, { animation: false })
        //       })


        //       expander.changeToHideMoreText()
        //     }
        //   }
        //   expander.setReRenderFunc(reRenderFunc)
        //   expander.render(X, Y)
        //   expander.transformToFinalPosition()
        // }
      })
    }

    const renderConnections = () => {


      if (this.assignedConnection) {
        this.assignedConnection.render({ isParentOperation })
      }

      if (this.riskConnection) {
        this.riskConnection.render({ isParentOperation: false })
      }
    }

    const makeFocus = async (node) => {
      // remove event

      node.svg.off("click")

      // close expander (if open)
      if (this.config.cachedChildNodeLimit !== undefined) {
        this.config = {
          ...this.config,
          cachedChildNodeLimit: this.config.childContainerNodeLimit,
          childContainerNodeLimit: this.config.cachedChildNodeLimit,
        }
        delete this.config.cachedChildNodeLimit
      }
      if (this.config.cachedParentContainerNodeLimit !== undefined) {
        this.config = {
          ...this.config,
          cachedParentContainerNodeLimit: this.config.parentContainerNodeLimit,
          parentContainerNodeLimit: this.config.cachedParentContainerNodeLimit,
        }
        delete this.config.cachedParentContainerNodeLimit
      }

      if (this.config.cachedRiskContainerNodeLimit !== undefined) {
        this.config = {
          ...this.config,
          cachedRiskContainerNodeLimit: this.config.riskContainerNodeLimit,
          riskContainerNodeLimit: this.config.cachedRiskContainerNodeLimit,
        }
        delete this.config.cachedRiskContainerNodeLimit
      }


      // remove nodes
      const nodesToRemove = this.nodes.filter((n) => {
        if (n.id === node.id) {
          return false
        }
        // if (n.id === this.focus.id) {
        //   return false
        // }
        return true
      })

      nodesToRemove.forEach((nodeToRemove) => {
        nodeToRemove.removeNode(nodeToRemove.getFinalX(), nodeToRemove.getFinalY() + 100, { opacity: 0 })
      })
      this.assgined = null
      this.risks = []
      this.parents = []
      this.children = []

      // remove other stuff
      this.containers.forEach((container) => {
        container.removeContainer(container.getFinalX(), container.getFinalY() + 100)
      })
      this.containers = []

      this.expanders.forEach((expander) => {
        expander.removeNode()
      })
      this.expanders = []

      this.connections.forEach((connection) => {
        connection.removeConnection()
      })
      this.connections = []

      // remove edges
      this.parentEdges.forEach((edge) => {
        edge.removeEdge()
      })
      this.parentEdges = []
      this.childEdges.forEach((edge) => {
        edge.removeEdge()
      })
      this.childEdges = []

      // console.log(this.focus)
      this.nodes = this.nodes.filter((n) => n.id === node.id)
      this.edges = []


      const fx = this.focus.getFinalX()
      const fy = this.focus.getFinalY()
      node.transformToMax(fx, fy)
      node.transformToFinalPosition(fx, fy)
      this.focus.transformToMin()

      this.focus = node
      await this.loadAdditionalContextualDataAsync()
    }


    const renderNodes = () => {
      const assginedNode = this.nodes.find(n => n.getId() === this.assignedInfo.assigned)
      const childNodes = this.nodes.filter(n => focusNode.childrenIds.includes(n.id))
      const parentIds = focusNode.parentId !== null
        ? focusNode.parentId instanceof Array ? focusNode.parentId : [focusNode.parentId]
        : []
      const parentNodes = this.nodes.filter(n => parentIds.includes(n.id))
      const riskNodes = this.nodes.filter(n => this.assignedInfo.risks.includes(n.id))


      assginedNode.renderAsMin({})


      childNodes.forEach((child, i) => {
        if (i < this.config.childContainerNodeLimit) {
          child.renderAsMin({})
        }
      })

      parentNodes.forEach((parent, i) => {
        if (i < this.config.parentContainerNodeLimit) {
          parent.renderAsMin({})
        }
      })

      riskNodes.forEach((risk, i) => {
        if (i < this.config.riskContainerNodeLimit) {
          risk.renderAsMin({})
        }
      })

      const eventNodes = [...parentNodes, ...childNodes]

      eventNodes.forEach(node => {
        if (node.isRendered() === true) {
          // find provided events
          const events = this.events.filter(e => e.func === "traverseInLayoutEvent")
          const eventStr = [...new Set(events.map((e) => e.event))].toString().split(",")

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
            events.forEach((myevent) => {
              if (myevent.event === type && myevent.modifier === modifier) {
                this.traverseInLayoutEvent(node)
              }
            })
          })



        }
      })

      focusNode.renderAsMax({})
      // if (this.assgined !== null) {
      //   if (this.assgined.isRendered() === false) {
      //     this.assgined.renderAsMin(X, Y)
      //   } else if (this.assgined.isRendered() === true) {
      //     this.assgined.transformToFinalPosition()
      //   }
      // }


      // if (this.focus.isRendered() === false) {
      //   this.focus.renderAsMax(X, Y)
      // } else if (this.focus.isRendered() === true) {
      //   this.focus.transformToFinalPosition()
      // }

      // this.parents.forEach((parent, i) => {
      //   if (i < this.config.parentContainerNodeLimit) {
      //     if (parent.isRendered() === false) {
      //       parent.addEvent("click", () => makeFocus(parent))
      //       parent.renderAsMin(X, Y)
      //     } else if (parent.isRendered() === true) {
      //       parent.transformToFinalPosition()
      //     }
      //   }
      // })

      // this.children.forEach((child, i) => {
      //   if (i < this.config.childContainerNodeLimit) {
      //     if (child.isRendered() === false) {
      //       child.addEvent("click", () => makeFocus(child))
      //       child.renderAsMin(X, Y)
      //     } else if (child.isRendered() === true) {
      //       child.transformToFinalPosition()
      //     }
      //   }
      // })

      // this.risks.forEach((risk, i) => {
      //   if (i < this.config.riskContainerNodeLimit) {
      //     if (risk.isRendered() === false) {
      //       risk.renderAsMin(X, Y)
      //     } else if (risk.isRendered() === true) {
      //       risk.transformToFinalPosition()
      //     }
      //   }
      // })
    }

    const renderEdges = () => {
      this.edges.forEach((edge) => {
        const isContextualBoldEdge = edge instanceof BoldEdge
        if (edge.isRendered() === false) edge.render({ X, Y, isContextualBoldEdge })
      })
      // this.parentEdges.forEach((edge) => {
      //   if (edge.isRendered() === false) {
      //     edge.render(X, Y)
      //   } else if (edge.isRendered() === true) {
      //     edge.transformToFinalPosition()
      //   }
      // })

      // this.childEdges.forEach((edge) => {
      //   if (edge.isRendered() === false) {
      //     edge.render(X, Y)
      //   } else if (edge.isRendered() === true) {
      //     edge.transformToFinalPosition()
      //   }
      // })
    }

    const renderContainerConnections = () => {
      this.containerConnections.forEach(con => {
        con.render({ isParentOperation })
      })
    }


    // rendering
    renderContainers()
    renderExpanders()
    renderConnections()
    renderNodes()
    renderContainerConnections()
    renderEdges()


    // // render containers
    // this.containers.forEach((container) => {
    //   container.render(X, Y)
    //   container.transform()
    // })


    // this.edges.forEach((edge) => {
    //   if (edge.svg === null) {
    //     edge.render(X, Y)
    //   }
    //   edge.transformToFinalPosition()
    // })
  }
}


export default ContextualLayout
