/* eslint-disable no-bitwise */
import Filter from "@svgdotjs/svg.filter.js"
import clamp from "clamp-js"
import FallbackControlIcon from "../resources/fallbackControlIcon.svg"
import FallbackAssetIcon from "../resources/fallbackAssetIcon.svg"
import FallbackRiskIcon from "../resources/fallbackRiskIcon.svg"
import FallbackCustomIcon from "../resources/fallbackCustomIcon.svg"

// https://medium.com/@yuribett/javascript-abstract-method-with-es6-5dbea4b00027


const LightenDarkenColor = (col, amt) => {
  const num = parseInt(col, 16)
  const r = (num >> 16) + amt
  const b = ((num >> 8) & 0x00FF) + amt
  const g = (num & 0x0000FF) + amt
  const newColor = g | (b << 8) | (r << 16)
  return newColor.toString(16)
}

/**
 * Base class for all node representations
 * @param {Data} data the raw data object to represent
 * @param {Canvas} canvas the svg canvas element to render the node on
 */
class BaseNode {
  constructor(data, canvas) {
    this.svg = null
    this.canvas = canvas
    this.config = {} // set by class

    // node data
    this.id = data.id || 0
    this.label = data.label || ""
    this.type = data.type || "unkown"
    this.tooltipText = data.tooltipText || null
    this.description = data.description || null
    this.keyValuePairs = data.keyValuePairs || []
    this.state = data.state || null
    this.attributes = new Map() // TODO: key value paired map


    // layout data
    this.depth = 0
    this.parent = null
    this.parentId = data.parentId || null

    this.children = []
    this.childrenIds = data.childrenIds || []
    this.prevSibling = data.prevSibling || null
    this.modifier = 0
    this.mod = 0


    // node position
    this.initialX = 0
    this.initialY = 0
    this.finalX = 0
    this.finalY = 0
    this.currentX = 0
    this.currentY = 0


    this.x = 0
    this.y = 0


    // node info
    this.nodeSize = "min" // minimal or maximal representation
    this.opacity = 1
    this.isHidden = false
    this.currentWidth = 0
    this.currentHeight = 0


    // events
    this.events = []
    this.outgoingEdges = []
    this.incomingEdges = []
  }


  addIncomingEdge(incomingEdge) {
    this.incomingEdges.push(incomingEdge)
  }

  addOutgoingEdge(outgoingEdge) {
    this.outgoingEdges.push(outgoingEdge)
  }

  transformToPosition(X = this.initialX, Y = this.initialY) {
    this
      .svg
      .animate({ duration: this.config.animationSpeed })
      .transform({ position: [X, Y] })
  }

  transformToFinalPosition() {
    this
      .svg
      .attr({ opacity: 1 })
      .animate({ duration: this.config.animationSpeed })
      .transform({ position: [this.finalX, this.finalY] })
      .attr({ opacity: 1 })
  }

  transformToInitialPosition() {
    this.svg.back()
    this
      .svg
      .attr({ opacity: 1 })
      .animate({ duration: this.config.animationSpeed })
      .transform({ position: [this.initialX, this.initialY] })
      .attr({ opacity: 1 })
  }

  isRendered() {
    return this.svg !== null
  }

  removeNode(X = this.initialX, Y = this.initialY, opts = { animation: true }) {
    if (opts.animation === true) {
      if (this.svg !== null) {
        this
          .svg
          .animate({ duration: this.config.animationSpeed })
          .transform({ scale: 0.001, position: [X, Y] })
          .after(() => {
            this.svg.remove()
            this.svg = null
          })
      }
    } else {
      this.svg.remove()
      this.svg = null
    }
  }


  getSVGBbox() {
    return this.svg.bbox()
  }


  // TODO: ask: shall the library export a method where the user can change the default
  //            mouse events for every interaction function
  addEvent(event, func) {
    // this.svg.on(event, func)
    // console.log(this.svg)
    this.events = [...this.events, { event, func }]
    // console.log(this.getNodeSize())
  }


  createSVGElement() {
    const svg = this.canvas.group().draggable()
    // const svg = this.canvas.group()
    svg.css("cursor", "pointer")
    svg.id(`node#${this.id}`)

    svg.on("mouseover", () => {
      svg.front()

      if (this.tooltipText !== null && this.nodeSize === "min") {
        svg.on("mousemove", (ev) => {
        // show tooltip
          const tooltip = document.getElementById("tooltip")
          tooltip.innerHTML = this.tooltipText
          tooltip.style.display = "block"

          tooltip.style.left = `${ev.clientX - tooltip.clientWidth / 2}px`
          tooltip.style.top = `${ev.clientY - tooltip.clientHeight - 15}px`
        })
      }


      // remove border dasharray
      const node = this.svg.get(0)
      node.stroke({
        width: this.config.borderStrokeWidth,
        color: this.config.borderStrokeColor,
        dasharray: 0,
      })

      // add hover highlight
      let toDark = this.config.borderStrokeColor.substr(1)
      if (this.type === "requirement") {
        toDark = this.config.backgroundColor.substr(1)
      }

      node.filterWith((add) => {
        const blur = add.offset(0, 0).in(add.$source).gaussianBlur(3)
        const color = add.composite(add.flood(`#${LightenDarkenColor(toDark, -10)}`), blur, "in")
        add.merge(color, add.$source)
      })
    })

    svg.on("mouseout", () => {
      // reset border stroke
      const node = this.svg.get(0)
      node.stroke({
        width: this.config.borderStrokeWidth,
        color: this.config.borderStrokeColor,
        dasharray: this.config.borderStrokeDasharray,
      })

      svg.off("mousemove", null)

      // remove the tooltip
      const tooltip = document.getElementById("tooltip")
      tooltip.style.display = "none"

      // remove hover highlight
      node.filterer().remove()
      const i = [...this.canvas.defs().node.childNodes].findIndex((d) => d.id === "defaultNodeBorderFilter")
      const filter = this.canvas.defs().get(i)
      node.filterWith(filter)
    })

    this.events.forEach(({ event, func }) => {
      svg.on(event, func)
    })


    return svg
  }


  createNode(width = 0, height = 0) {
    let node = null
    if (this.type === "custom") {
      if (this.config.nodeType === "rect") {
        node = this.canvas.rect(width, height)
      } else if (this.config.nodeType === "ellipse") {
        node = this.canvas.ellipse(width, height)
      } else if (this.config.nodeType === "path") {
        node = this.canvas.path(this.config.svg)
      }
    } else {
      node = this.canvas.rect(width, height)
    }

    node.fill(this.config.backgroundColor)
    node.stroke({
      width: this.config.borderStrokeWidth,
      color: this.config.borderStrokeColor,
      dasharray: this.config.borderStrokeDasharray,
    })
    if (this.config.nodeType !== "path") {
      node.radius(this.config.borderRadius)
    }

    // add a re-usable light and color highlight
    const i = [...this.canvas.defs().node.childNodes].findIndex((d) => d.id === "defaultNodeBorderFilter")
    if (i === -1) {
      const filter = new Filter()
      filter.id("defaultNodeBorderFilter")
      const blur = filter.offset(0, 0).in(filter.$source).gaussianBlur(2)
      const color = filter.composite(filter.flood("#fff"), blur, "in")
      filter.merge(color, filter.$source)
      this.canvas.defs().add(filter)
      node.filterWith(filter)
    } else {
      const filter = this.canvas.defs().get(i)
      node.filterWith(filter)
    }


    return node
  }


  createIcon(size = 0) {
    let icon = null
    if (this.config.iconUrl === null) {
      if (this.type === "control") {
        icon = this.canvas.image(FallbackControlIcon)
      }
      if (this.type === "risk") {
        icon = this.canvas.image(FallbackRiskIcon)
      }
      if (this.type === "asset") {
        icon = this.canvas.image(FallbackAssetIcon)
      }
      if (this.type === "custom") {
        icon = this.canvas.image(FallbackCustomIcon)
      }
    } else {
      icon = this.canvas.image(this.config.iconUrl)
    }

    icon.size(size, size)
    return icon
  }


  createLabel(textAlign = "center") { // FIXME: html text gets highlighted way to often
    const fobj = this.canvas.foreignObject(this.config.minTextWidth, 0)

    const background = document.createElement("div")
    background.style.background = this.config.labelBackground
    background.style.padding = `${this.config.offset / 2}px`
    background.style.textAlign = textAlign
    background.style.width = `${this.config.minTextWidth}px`

    const label = document.createElement("div")
    label.innerText = this.label
    label.style.color = this.config.labelColor
    label.style.fontSize = `${this.config.labelFontSize}px`
    label.style.fontFamily = this.config.labelFontFamily
    label.style.fontWeight = this.config.labelFontWeight
    label.style.fontStyle = this.config.labelFontStyle
    clamp(label, { clamp: 2 })

    background.appendChild(label)
    fobj.add(background)
    fobj.css("user-select", "none")

    fobj.dmove(this.config.borderStrokeWidth, this.config.borderStrokeWidth)

    return fobj
  }


  isLeaf() {
    return this.children.length === 0
  }

  isLeftMost() {
    if (this.parent === null || this.parent === undefined) {
      return true
    }

    return this.parent.children[0] === this
  }

  isRightMost() {
    if (this.parent === null || this.parent === undefined) {
      return true
    }
    return this.parent.children[this.children.length - 1] === this
  }

  getLeftMostChild() {
    if (this.children.length === 0) {
      return null
    }
    return this.children[0]
  }

  getRightMostChild() {
    if (this.children.length === 0) {
      return null
    }
    return this.children[this.children.length - 1]
  }

  getPrevSibling() {
    if (this.parent === null || this.parent === undefined || this.isLeftMost()) {
      return null
    }
    return this.parent.children[this.parent.children.indexOf(this) - 1]
  }

  setPrevSibling(prevSibling) {
    this.prevSibling = prevSibling
  }

  getNextSibling() {
    if (this.parent === null || this.isRightMost()) {
      return null
    }
    return this.parent.children[this.parent.children.indexOf(this) + 1]
  }

  getLeftMostSibling() {
    if (this.parent === null) {
      return null
    }
    if (this.isLeftMost()) {
      return this
    }
    return this.parent.children[0]
  }

  getRightMostSibling() {
    if (this.children.length === 0) {
      return null
    }
    return this.children[this.children.length - 1]
  }

  setModifier(modifier) {
    this.modifier = modifier
  }

  getModifier() {
    return this.modifier
  }


  getMinWidth() {
    return this.config.minWidth
  }

  getMaxWidth() {
    return this.config.maxWidth
  }

  getMinHeight() {
    return this.config.minHeight
  }

  getMaxHeight() {
    return this.config.maxHeight
  }


  setConfig(config) {
    this.config = { ...this.config, ...config }
  }


  getConfig() {
    return this.config
  }


  getFinalX() {
    return this.finalX
  }


  getFinalY() {
    return this.finalY
  }


  setFinalX(finalX) {
    this.finalX = finalX
  }


  setFinalY(finalY) {
    this.finalY = finalY
  }


  setFinalXY(finalX, finalY) {
    this.finalX = finalX
    this.finalY = finalY
  }


  getInitialX() {
    return this.initialX
  }


  getInitialY() {
    return this.initialY
  }


  setInitialX(initialX) {
    this.initialX = initialX
  }


  setInitialY(initialY) {
    this.initialY = initialY
  }


  setInitialXY(initialX, initialY) {
    this.initialX = initialX
    this.initialY = initialY
  }


  getCurrentWidth() {
    return this.currentWidth
  }


  getCurrentHeight() {
    return this.currentHeight
  }


  getNodeSize() {
    return this.nodeSize
  }

  isRoot() {
    return this.parentId === null
  }

  getChildren() {
    return this.children
  }

  setChildren(children) {
    this.children = children
  }


  setNodeSize(nodeSize) {
    this.nodeSize = nodeSize
  }

  getParent() {
    return this.parent
  }

  setParent(parent) {
    this.parent = parent
  }

  setDepth(depth) {
    this.depth = depth
  }

  getDepth() {
    return this.depth
  }

  moveToFront() {
    this.svg.front()
  }

  moveToBack() {
    this.svg.back()
  }

  getId() {
    return this.id
  }
}


export default BaseNode
