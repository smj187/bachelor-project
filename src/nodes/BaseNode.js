import Filter from "@svgdotjs/svg.filter.js"
import clamp from "clamp-js"
import FallbackControlIcon from "../resources/fallbackControlIcon.svg"
import FallbackAssetIcon from "../resources/fallbackAssetIcon.svg"
import FallbackRiskIcon from "../resources/fallbackRiskIcon.svg"
import FallbackCustomIcon from "../resources/fallbackCustomIcon.svg"
import Colorshift from "../utils/Colorshift"



/**
 * This is the base class for nodes.
 * @property {Data} data Loaded data from a database.
 * @property {Canvas} canvas The nested canvas to render the node on.
 *
 */
class BaseNode {
  constructor(data, canvas) {

    this.svg = null
    this.canvas = canvas
    this.config = { ...data.config } // first add any override values 

    // node data
    this.id = data.id || 0
    this.label = data.label || ""
    this.type = data.type || "unkown"
    this.tooltipText = data.tooltipText || null
    this.description = data.description || null
    this.keyValuePairs = data.keyValuePairs || []
    this.state = data.state || null
    this.attributes = new Map()


    // layout data
    this.depth = 0
    this.parent = null
    this.parentId = data.parent || null

    this.children = []
    this.childrenIds = data.children || []
    this.invisibleChildren = data.invisibleChildren || []
    this.prevSibling = null
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
    this.nodeSize = "min"
    this.opacity = 1
    this.isHidden = false
    this.currentWidth = 0
    this.currentHeight = 0
    this.coords = []


    // events
    this.events = []
    this.outgoingEdges = []
    this.incomingEdges = []
  }






  /**
   * Transforms a node to its final rendered position.
   * @param {Number} X=finalX The final X position.
   * @param {Number} Y=finalY The final Y position.
   */
  transformToFinalPosition(X = this.finalX, Y = this.finalY) {
    if (this.isRendered() === false) {
      return
    }



    this.currentX = X
    this.currentY = Y
    this.coords.push([this.currentX, this.currentY])


    this
      .svg
      .animate({ duration: this.config.animationSpeed })
      .transform({ position: [X, Y] })
  }


  /**
   * Transforms a node from its final position to its initial rendered position.
   * @param {Number} X=initialX The initial X position.
   * @param {Number} Y=initialY The initial Y position.
   */
  transformToInitialPosition(X = this.initialX, Y = this.initialY) {


    this.currentX = X
    this.currentY = Y

    this.coords.push([this.currentX, this.currentY])

    this.svg.back()
    this
      .svg
      .attr({ opacity: 1 })
      .animate({ duration: this.config.animationSpeed })
      .transform({ position: [X, Y] })
      .attr({ opacity: 1 })
  }




  /**
   * Removes the rendered SVG node from the canvas.
   * @param {Number} X The X position to move the elements before removing them. 
   * @param {Number} Y The Y position to move the elements before removing them.
   * @param {Object} opts An object containing additional configuration to control certain behaviours.
   */
  removeNode(X = this.initialX, Y = this.initialY, opts = { animation: true, opacity: 1 }) {
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
    } else if (opts.opacity === 0) {
      if (this.svg !== null) {
        this
          .svg
          .attr({ opacity: 1 })
          .animate({ duration: this.config.animationSpeed })
          .transform({ position: [X, Y] })
          .attr({ opacity: 0 })
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



  /**
   * Adds an event and a method to the node.
   * @param {Event} event The provided event.
   * @param {Method} func The provided method.
   */
  addEvent(event, func) {
    this.events = [...this.events, { event, func }]
  }


  /**
   * Creates the initial SVG object reference.
   */
  createSVGElement() {
    // const svg = this.canvas.group().draggable()
    const svg = this.canvas.group()
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
        const color = add.composite(add.flood(`#${Colorshift(toDark, -10)}`), blur, "in")
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
      // const filter = this.canvas.defs().get(i)
      // node.filterWith(filter)
    })

    this.events.forEach(({ event, func }) => {
      svg.on(event, func)
    })


    return svg
  }


  /**
   * Creates the nodes SVG shape.
   */
  createNode() {
    let node = null
    const width = 1
    const height = 1
    if (this.type === "custom") { // custom
      if (this.config.nodeType === "rect") {
        node = this.canvas.rect(width, height)
      } else if (this.config.nodeType === "ellipse") {
        node = this.canvas.ellipse(width, height)
      } else if (this.config.nodeType === "path") {
        node = this.canvas.path(this.config.svgPathElement)
      } else {
        node = this.canvas.rect(width, height)
      }
    } else { // default
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
    const i = [...this.canvas.defs().node.childNodes].findIndex((d) => d.id === "defaultNodeBorderFilter") || -1
    if (i === -1) {
      const filter = new Filter()
      filter.id("defaultNodeBorderFilter")
      const blur = filter.offset(0, 0).in(filter.$source).gaussianBlur(2)
      const color = filter.composite(filter.flood("#fff"), blur, "in")
      filter.merge(color, filter.$source)
      // this.canvas.defs().add(filter)
      // node.filterWith(filter)
    } else {
      // const filter = this.canvas.defs().get(i)
      // node.filterWith(filter)
    }

    return node
  }


  /**
   * Creates the nodes icon.
   */
  createIcon() {
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

    icon.size(1, 1)
    return icon
  }


  /**
   * Creates the nodes label.
   */
  createLabel(textAlign = "center") {
    const fobj = this.canvas.foreignObject(this.config.minTextWidth, 1)


    if (this.label === "") {
      return fobj
    }

    const background = document.createElement("div")
    background.style.background = this.config.labelBackground
    background.style.padding = `${this.config.offset / 2}px`
    background.style.textAlign = textAlign
    background.style.width = `${this.config.minTextWidth}px`
    background.setAttribute("id", "min-label")

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


  /**
   * Determins where the node is rendered or not.
   * @returns True, if the SVG is rendered, else false.
   */
  isRendered() {
    return this.svg !== null
  }


  addIncomingEdge(incomingEdge) {
    this.incomingEdges.push(incomingEdge)
  }

  addOutgoingEdge(outgoingEdge) {
    this.outgoingEdges.push(outgoingEdge)
  }

  getSVGBbox() {
    return this.svg.bbox()
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

  getIsHidden() {
    return this.isHidden
  }

  setIsHidden(isHidden) {
    this.isHidden = isHidden
  }

  getAttributes() {
    return this.attributes
  }

  setAttributes(attributes) {
    this.attributes = attributes
  }

  setNodeSize(nodeSize) {
    this.nodeSize = nodeSize
  }

  getCurrentX() {
    return this.currentX
  }
  getCurrentY() {
    return this.currentY
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

  getSVG() {
    return this.svg
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
