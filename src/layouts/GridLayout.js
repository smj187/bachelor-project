import BaseLayout from "./BaseLayout"
import GridExpander from "./helpers/GridExpander"
import GridConfiguration from "../configuration/GridConfiguration"
import LayoutBackground from "./helpers/LayoutBackground"


class GridLayout extends BaseLayout {
  constructor(customConfig = {}) {
    super()


    this.config = { ...GridConfiguration, ...customConfig }
    this.expander = null
    this.layoutBackground = null
  }

  calculateLayout() {
    const calculateFinalPosition = () => {
      const limit = this.config.limit ? this.config.limit : this.nodes.length
      const nodes = this.nodes.slice(0, limit)


      // create grid expander only if required
      if (this.config.limit < this.nodeData.length && this.expander === null) {
        const expander = new GridExpander(this.canvas)
        this.expander = expander
      }


      const cols = this.config.maxColumns
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
        console.log("no expander")
        return
      } if (this.config.limit === null) {
        console.log("no limit")
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

      console.log("1")

      if (this.expander) {
        y2 = this.expander.getFinalY() + this.config.spacing / 2 + this.expander.config.height / 2
      }

      // this.canvas.circle(5).fill("#f75").center(x2, y2)


      // bottom left
      const x3 = x0
      const y3 = y2
      // this.canvas.circle(5).fill("#000").center(x3, y3)

      // TODO: store layout width and height info


      if (this.config.renderLayoutBackground === true && this.layoutBackground === null) {
        // console.log("2")
        this.layoutBackground = new LayoutBackground(this.canvas, this.config)
      }
      if (this.layoutBackground) {
        this.layoutBackground.setCornders([[x0, y0], [x1, y1], [x2, y2], [x3, y3]])
      }
    }

    calculateFinalPosition()
    calculateExpander()
    calculateBackground()
  }


  renderLayout() {
    const limit = this.config.limit ? this.config.limit : this.nodes.length

    const X = this.nodes[0].getFinalX()
    const Y = this.nodes[0].getFinalY()

    if (this.layoutBackground) {
      if (this.layoutBackground.svg === null) {
        this.layoutBackground.render()
      } else {
        this.layoutBackground.transform()
      }
    }


    // if an expander exists, render it
    if (this.expander) {
      const reRenderFunc = () => {
        if (this.currentLayoutState === "show more") {
          this.currentLayoutState = "show less"
          this.config = {
            ...this.config,
            // eslint-disable-next-line no-underscore-dangle
            limit: this.config.__cachedLimit,
          }
          // eslint-disable-next-line no-underscore-dangle
          delete this.config.__cachedLimit
          this.expander.changeToHideMoreText()

          if (this.layoutBackground) {
            // this.layoutBackground.remove()
            // this.layoutBackground.transform()
          }
        } else {
          this.currentLayoutState = "show more"
          this.config = {
            ...this.config,
            __cachedLimit: this.config.limit,
            limit: this.nodeData.length,
          }

          this.expander.changeToShowMoreText()

          if (this.layoutBackground) {
            // this.layoutBackground.remove()
            // this.layoutBackground.transform()
          }
        }

        const tooltip = document.getElementById("tooltip")
        tooltip.style.display = "none"

        this.loadAdditionalGridDataAsync()
      }
      if (this.expander.svg === null) {
        this.expander.setReRenderFunc(reRenderFunc)
        this.expander.render(X, Y)
      }
      this.expander.transformToFinalPosition()
    }
    if (this.config.limit === null && this.expander) {
      this.expander.removeNode()
    }


    // render nodes
    this.nodes.forEach((node, i) => {
      // render new nodes
      if (i <= limit && node.isRendered() === false) {
        if (node.isRendered() === false) {
          if (this.config.renderingSize === "max") node.renderAsMax(X, Y)
          if (this.config.renderingSize === "min") node.renderAsMin(X, Y)
        }
        node.transformToFinalPosition()
      }

      // remove existing nodes
      if (i >= limit && node.isRendered() === true) {
        node.removeNode(null, null, { animation: false })
      }
    })
  }
}


export default GridLayout
