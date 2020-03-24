import BaseLayout from "./BaseLayout"
import GridExpander from "./helpers/GridExpander"


const GridConfig = {
  // limit layout width
  maxLayoutWidth: 600,

  // how many nodes shall be rendered before showing "load more more"
  limitedTo: 1,

  // where to translate a given layout
  translateX: 0,
  translateY: 0,

  // layout animation speed for all nodes and edges
  animationSpeed: 300,

  // hide all other layouts and center selected one
  hideOtherLayouts: false, // TODO:

  // node spacing
  spacing: 32,

  // how to render all nodes
  renderingSize: "min", // min max
}

class GridLayout extends BaseLayout {
  constructor(customGridConfig = {}) {
    super()


    this.config = { ...GridConfig, ...customGridConfig }

    this.gridExpander = null
  }

  calculateLayout() { // TODO: ask: grid can query all the data at once, but only render a limited amount?
    let currentWidth = 0
    let currentHeight = 0
    let rowMaxHeight = 0

    if (this.gridExpander === null) {
      this.gridExpander = new GridExpander(this.canvas, this.config.renderingSize)
    }

    // add expander to nodes
    this.nodes = [...this.nodes, this.gridExpander]

    this.nodes.forEach((node, i) => {
      const w = this.config.renderingSize === "max" ? node.config.maxWidth : node.config.minWidth
      const h = this.config.renderingSize === "max" ? node.config.maxHeight : node.config.minHeight

      rowMaxHeight = Math.max(h, rowMaxHeight)

      // calculate initial position
      const x = w / 2 + this.config.spacing + this.config.translateX
      const y = h / 2 + this.config.spacing + this.config.translateY


      // check if new element position is larger than the available space
      if (currentWidth > this.config.maxLayoutWidth) {
        currentWidth = 0
        currentHeight += rowMaxHeight + this.config.spacing
      }

      node.setFinalX(currentWidth + x)
      currentWidth += w + this.config.spacing

      node.setFinalY(currentHeight + y)


      if (i === this.config.limitedTo) {
        this.gridExpander.expandX = node.getFinalX()
        this.gridExpander.expandY = node.getFinalY()
        this.gridExpander.setPrevNode(this.nodes[i - 1])
      }
      if (i === this.nodes.length - 1) {
        this.gridExpander.collapseX = node.getFinalX()
        this.gridExpander.collapseY = node.getFinalY()
        this.gridExpander.setPrevNode(this.nodes[i - 1])
      }
    })
  }


  renderLayout() {
    this.nodes.forEach((node, i) => {
      // renders a limited amount of nodes
      if (i < this.config.limitedTo && !node.isRendered()) {
        if (this.config.renderingSize === "max") {
          if (node.svg === null) node.renderAsMax(node.getFinalX(), node.getFinalY())
        } else if (this.config.renderingSize === "min") {
          if (node.svg === null) node.renderAsMin(node.getFinalX(), node.getFinalY())
        }
      }

      if (i >= this.config.limitedTo && !(node instanceof GridExpander) && node.isRendered()) {
        node.removeNode()
      }


      // renders the expand button
      if (node instanceof GridExpander && node.svg === null) {
        const funcExp = () => {
          this.gridExpander.transform()
          this.config = { ...this.config, limitedTo: this.nodes.length, prevLimitedTo: this.config.limitedTo }
          this.renderLayout()
        }

        const funcLess = () => {
          this.gridExpander.transform()
          this.config = { ...this.config, limitedTo: this.config.prevLimitedTo, prevLimitedTo: undefined }
          this.renderLayout()
        }


        node.renderExpander(`Show ${this.nodes.length - this.config.limitedTo} More`, funcExp, funcLess)
      }
    })
  }
}


export default GridLayout
