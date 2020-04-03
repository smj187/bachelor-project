import BaseLayout from "./BaseLayout"
import GridExpander from "./helpers/GridExpander"
import GridConfiguration from "../configuration/GridConfiguration"


class GridLayout extends BaseLayout {
  constructor(customConfig = {}) {
    super()
    this.config = { ...GridConfiguration, ...customConfig }
    this.expander = null
  }

  calculateLayout(offset = 0) {
    this.config = { ...this.config, translateX: this.config.translateX + offset }
    const calculateFinalPosition = () => {
      const limit = this.config.limitNodes ? this.config.limitNodes : this.nodes.length
      const nodes = this.nodes.slice(0, limit)


      // create grid expander only if required
      if (this.config.limitNodes < this.nodeData.length && this.expander === null) {
        const expander = new GridExpander(this.canvas)
        this.expander = expander
      }


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


      // console.log(nodeRows)
      // console.log(nodeCols)
      // console.log("----")

      // calculate initial position
      this.nodes.forEach((node) => {
        const w = this.config.renderingSize === "max" ? node.getMaxWidth() : node.getMinWidth()
        const h = this.config.renderingSize === "max" ? node.getMaxHeight() : node.getMinHeight()
        const x = this.config.spacing + this.config.translateX + w / 2// +w / 1
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

    const calculateExpander = () => {
      // collapsed state
      if (this.expander === null) {
        return
      }

      if (this.config.limitNodes === null) {
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


      // this.canvas.circle(5).fill("#f75").center(x, y)

      this.expander.setFinalX(x)
      this.expander.setFinalY(y)
    }

    const calculateBackground = () => {
      // top left
      const { nodes } = this
      const x0 = Math.min(...nodes.map((n) => {
        const w = this.config.renderingSize === "max" ? n.getMaxWidth() : n.getMinWidth()
        return n.getFinalX() - w / 2 - this.config.spacing / 2
      }))
      const y0 = Math.min(...nodes.map((n) => {
        const h = this.config.renderingSize === "max" ? n.getMaxHeight() : n.getMinHeight()
        return n.getFinalY() - h / 2 - this.config.spacing / 2
      }))

      // this.canvas.circle(5).fill("#000").center(x0, y0)


      // top right
      const x1 = Math.max(...nodes.map((n) => {
        const w = this.config.renderingSize === "max" ? n.getMaxWidth() : n.getMinWidth()
        return n.getFinalX() + w / 2 + this.config.spacing / 2
      }))

      const y1 = y0
      // this.canvas.circle(5).fill("#75f").center(x1, y1)


      // bottom right
      const x2 = x1
      let y2 = Math.max(...nodes.map((n) => {
        const h = this.config.renderingSize === "max" ? n.getMaxHeight() : n.getMinHeight()
        return n.getFinalY() + h / 2 + this.config.spacing / 2
      }))

      if (this.expander !== null && this.config.limitNodes !== null) {
        y2 = this.expander.getFinalY() + this.config.spacing / 2 + this.expander.config.expanderHeight / 2
      }
      // this.canvas.circle(5).fill("#f75").center(x2, y2)


      // bottom left
      // const x3 = x0
      // const y3 = y2
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

    calculateFinalPosition()
    calculateExpander()
    calculateBackground()

    return this.layoutInfo
  }


  renderLayout() {
    const limit = this.config.limitNodes ? this.config.limitNodes : this.nodes.length
    const X = this.layoutInfo.cx
    const Y = this.layoutInfo.cy


    const renderExpander = () => {
      if (this.config.limitNodes === null && this.expander.isRendered() === true) {
        this.expander.removeNode()
        return
      }

      if (this.expander === null) {
        return
      }


      if (this.expander.isRendered() === true) {
        this.expander.transformToFinalPosition()
        return
      }

      if (this.config.limitNodes === null) {
        return
      }

      const reRenderFunc = async () => {
        if (this.currentLayoutState === "show more") {
          this.currentLayoutState = "show less"
          this.config = { ...this.config, limitNodes: this.config.cachedLimit }
          delete this.config.cachedLimit
          this.expander.changeToHideMoreText()
        } else {
          this.currentLayoutState = "show more"
          this.config = { ...this.config, cachedLimit: this.config.limitNodes, limitNodes: this.nodeData.length }
          this.expander.changeToShowMoreText()
        }

        const tooltip = document.getElementById("tooltip")
        tooltip.style.display = "none"

        await this.loadInitialGridDataAsync() // update all layouts to the right


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
      if (this.expander.svg === null) {
        this.expander.setReRenderFunc(reRenderFunc)
        this.expander.render(X, Y)
      }
      this.expander.transformToFinalPosition()
    }

    const renderNodes = () => {
      this.nodes.forEach((node, i) => {
      // render new nodes
        if (i <= limit && node.isRendered() === false) {
          if (node.isRendered() === false) {
            if (this.config.renderingSize === "max") node.renderAsMax(X, Y)
            if (this.config.renderingSize === "min") node.renderAsMin(X, Y)
          }
        }

        if (node.isRendered() === true) {
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
  }
}


export default GridLayout
