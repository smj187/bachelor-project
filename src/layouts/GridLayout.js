import BaseLayout from "./BaseLayout"
import GridExpander from "./helpers/GridExpander"
import GridLayoutConfiguration from "../configuration/GridLayoutConfiguration"


/**
 * This class calculates and renders the grid layout.
 */
class GridLayout extends BaseLayout {
  constructor(customConfig = {}, events = [], additionalNodeRepresentations) {
    super(additionalNodeRepresentations)
    this.config = { ...GridLayoutConfiguration, ...customConfig }

    // layout specific
    this.gridExpander = null
    this.registerMouseEvents(events)
  }


  /**
   * Overrides the default mouse behaviour for the grid layout.
   * @param {Object} events The events to be added.
   */
  registerMouseEvents(events) {


    const expandGridLayoutEvent = async () => {
      if (this.currentLayoutState === "show more") {
        this.currentLayoutState = "show less"
        this.config = { ...this.config, limitNodes: this.config.cachedLimit }
        delete this.config.cachedLimit
        this.gridExpander.changeToHideMoreText()
      } else {
        this.currentLayoutState = "show more"
        this.config = { ...this.config, cachedLimit: this.config.limitNodes, limitNodes: this.nodeData.length }
        this.gridExpander.changeToShowMoreText()
      }

      const tooltip = document.getElementById("tooltip")
      tooltip.style.display = "none"

      await this.loadAdditionalGridDataAsync()
      console.log("rerender")

      // update all layouts to the right
      const prevW = this.layoutInfo.w
      this.calculateLayout()
      const newW = this.layoutInfo.w
      this.renderLayout()



      // update all layouts right side
      this.layoutReferences.forEach((llayout, i) => {
        if (i > this.layoutReferences.indexOf(this)) {
          llayout.calculateLayout(newW - prevW)
          llayout.renderLayout()
        }
      })
    }

    if (events.length > 0) {
      this.events = [
        {
          name: "expandGridLayoutEvent",
          func: expandGridLayoutEvent,
          mouse: events.find(e => e.name === "expandGridLayoutEvent").mouse || "click",
          modifier: events.find(e => e.name === "expandGridLayoutEvent").modifier || "shiftKey",
        }
      ]
    } else {
      this.events = [
        {
          name: "expandGridLayoutEvent",
          func: expandGridLayoutEvent,
          mouse: "click",
          modifier: "shiftKey"
        }
      ]
    }
  }


  /**
   * Calulates the layout.
   * @param {Number} offset=0 The width from other layouts.
   */
  calculateLayout(offset = 0) {



    // add additional translation towards X
    this.config = { ...this.config, translateX: this.config.translateX + offset }

    // calculate nodes' final position
    const calculateFinalPosition = () => {
      const limit = this.config.limitNodes ? this.config.limitNodes : this.nodes.length
      const nodes = this.nodes.slice(0, limit)

      // create and assign a grid expander only if required
      if (this.config.limitNodes < this.nodeData.length && this.gridExpander === null) {
        const expander = new GridExpander(this.canvas)
        this.gridExpander = expander
      }


      // calculate columns and rows
      const cols = this.config.limitColumns
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

      // set initial position
      this.nodes.forEach((node) => {
        const w = this.config.renderingSize === "max" ? node.getMaxWidth() : node.getMinWidth()
        const h = this.config.renderingSize === "max" ? node.getMaxHeight() : node.getMinHeight()
        const x = this.config.spacing + this.config.translateX + w / 2
        const y = this.config.spacing + this.config.translateY + h / 2
        node.setFinalX(x)
        node.setFinalY(y)
      })

      // find row spacing
      let rowSpacing = 0
      nodeRows.forEach((row) => {
        const h = row.map((n) => (this.config.renderingSize === "max" ? n.getMaxHeight() : n.getMinHeight()))
        const max = Math.max(...h)
        rowSpacing = Math.max(rowSpacing, max)
      })

      // calculate y positions
      nodeRows.forEach((row, i) => {
        if (i >= 1) {
          row.forEach((n) => {
            const h = (rowSpacing + this.config.spacing) * i
            n.setFinalY(n.getFinalY() + h)
          })
        }
      })

      // find col spacing
      let columnSpacing = 0
      nodeRows.forEach((row) => {
        const w = row.map((n) => (this.config.renderingSize === "max" ? n.getMaxWidth() : n.getMinWidth()))
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
    }

    // calculate an expander button
    const calculateExpander = () => {
      if (this.gridExpander === null || this.config.limitNodes === null) {
        return
      }

      // get lowest X coordinate
      const minX = Math.min(...this.nodes.map((n) => n.getFinalX()))
      const minNode = this.nodes.find((n) => n.getFinalX() === minX)
      const w = this.config.renderingSize === "max" ? minNode.getMaxWidth() : minNode.getMinWidth()
      const x = minX - w / 2

      // get deepest Y coordinate
      const maxY = Math.max(...this.nodes.map((n) => n.getFinalY()))
      const maxNode = this.nodes.find((n) => n.getFinalY() === maxY)
      const h = this.config.renderingSize === "max" ? maxNode.getMaxHeight() : maxNode.getMinHeight()
      const y = maxY + h + this.config.spacing

      this.gridExpander.setFinalX(x)
      this.gridExpander.setFinalY(y)
    }

    // calculate the layout dimensions
    const calculateLayoutInfo = () => {
      // top left
      const x0 = Math.min(...this.nodes.map((n) => {
        const w = this.config.renderingSize === "max" ? n.getMaxWidth() : n.getMinWidth()
        return n.getFinalX() - w / 2 - this.config.spacing / 2
      }))
      const y0 = 0


      // top right
      const x1 = Math.max(...this.nodes.map((n) => {
        const w = this.config.renderingSize === "max" ? n.getMaxWidth() : n.getMinWidth()
        return n.getFinalX() + w / 2 + this.config.spacing / 2
      }))

      const y1 = y0


      // bottom right
      const x2 = x1
      let y2 = Math.max(...this.nodes.map((n) => {
        const h = this.config.renderingSize === "max" ? n.getMaxHeight() : n.getMinHeight()
        return n.getFinalY() + h / 2 + this.config.spacing / 2
      }))

      if (this.gridExpander !== null && this.config.limitNodes !== null) {
        y2 = this.gridExpander.getFinalY() + this.config.spacing / 2 + this.gridExpander.config.expanderHeight / 2
      }


      // store layout width and height info
      const calculateDistance = (sx, sy, tx, ty) => {
        const dx = tx - sx
        const dy = ty - sy
        return Math.sqrt(dx * dx + dy * dy)
      }


      // this.canvas.circle(5).fill("#000").center(x0, y0)
      // this.canvas.circle(5).fill("#75f").center(x1, y1)
      // this.canvas.circle(5).fill("#f75").center(x2, y2)
      // this.canvas.circle(5).fill("#1f1").center((x0 + x2) / 2, (y0 + y2) / 2)

      this.layoutInfo = {
        x: x0,
        y: y0,
        cx: (x0 + x2) / 2,
        cy: (y0 + y2) / 2,
        w: calculateDistance(x0, y0, x1, y1),
        h: calculateDistance(x1, y1, x2, y2),
      }
    }

    calculateFinalPosition()
    calculateExpander()
    calculateLayoutInfo()

    // console.log("Grid", this.layoutInfo)

    return this.layoutInfo
  }


  /**
   * Renders the layout. First, it renders the grid expander, but only if required. Second, it renders
   * all required nodes and transforms them into position.
   */
  renderLayout() {

    var start = window.performance.now();

    const limit = this.config.limitNodes ? this.config.limitNodes : this.nodes.length
    const X = this.layoutInfo.cx
    const Y = this.layoutInfo.cy

    // renders the grid expander
    const renderExpander = () => {
      if (this.config.limitNodes === null && this.gridExpander.isRendered() === true) {
        this.gridExpander.removeNode()
        return
      }

      if (this.gridExpander === null || this.config.limitNodes === null) {
        return
      }


      if (this.gridExpander.isRendered() === true) {
        this.gridExpander.transformToFinalPosition()
        return
      }


      if (this.gridExpander.svg === null) {

        this.gridExpander.render(X, Y)
        // add event to expander
        this.gridExpander.svg.on(this.events[0].mouse, (e) => {
          if (this.events[0].modifier !== null) {
            if (this.events[0].modifier, e[this.events[0].modifier]) {
              this.events[0].func()
            }
          } else {
            this.expandGridLayoutEvent()
          }
        })
      }
      this.gridExpander.transformToFinalPosition()
    }

    // renders visual node representations
    const renderNodes = () => {
      this.nodes.forEach((node, i) => {
        // console.log(node)
        if (i <= limit && node.isRendered() === false) { // create non-existing nodes

          if (this.config.renderingSize === "max") node.renderAsMax(X, Y)
          if (this.config.renderingSize === "min") {
            node.renderAsMin(X, Y)
          }

        } else if (node.isRendered() === true) { // update nodes
          // console.log("trf", node)
          node.transformToFinalPosition()
        }

        // remove existing nodes
        if (i >= limit && node.isRendered() === true) {
          node.removeNode(null, null, { animation: false })
        }
      })
    }

    renderExpander()
    renderNodes()



    var end = window.performance.now();
    var time = end - start;
    console.log(`${time}+`)

  }
}


export default GridLayout
