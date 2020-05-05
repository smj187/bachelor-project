import Filter from "@svgdotjs/svg.filter.js"
import clamp from "clamp-js"

import FallbackControlIcon from "../resources/fallbackControlIcon.svg"
import FallbackAssetIcon from "../resources/fallbackAssetIcon.svg"
import FallbackRiskIcon from "../resources/fallbackRiskIcon.svg"
import FallbackCustomIcon from "../resources/fallbackCustomIcon.svg"


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

    this.animation = null
  }

  removeNode(X = this.initialX, Y = this.initialY, opts = { animation: true, opacity: 1 }, clickedNode) { // TODO: remove
    console.log(clickedNode)

    if (opts.animation === true) {
      if (this.svg !== null) {
        this.svg.back()

        this
          .svg
          .animate({ duration: this.config.animationSpeed })
          .transform({ scale: 0.001, position: [X, Y] })
          .during(() => {
            console.log(clickedNode.finalX)
          })
          .after(() => {
            this.svg.remove()
            this.svg = null
          })
      }
    } else if (opts.opacity === 0) {
      if (this.svg !== null) {
        this.svg.back()
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
   * Creates the initial SVG object reference and the drop shadow for mouse hover effects.
   * @return {SVG} A bare bone SVG object.
   * 
   * @see https://github.com/svgdotjs/svg.filter.js
   */
  createSVGElement() {

    // create the SVG object on the canvas.

    const svg = this.canvas.group().draggable()
    // const svg = this.canvas.group()

    // attach some CSS and an ID
    svg.css("cursor", "pointer")
    svg.id(`node#${this.id}`)


    // register a hover event
    svg.on("mouseover", () => {
      svg.front()

      const currentZoomLevel = this.canvas.parent().attr().zoomCurrent
      const currenZoomThreshold = this.canvas.parent().attr().zoomThreshold

      // show tooltip only if text is set, the node is in minimal representation and the
      // current zoom level is smaller then the threshold
      if (this.tooltipText !== null && this.nodeSize === "min" && currentZoomLevel <= currenZoomThreshold) {
        // add a show tooltip event
        svg.on("mousemove", (ev) => {
          const tooltip = document.getElementById("tooltip")
          tooltip.innerHTML = this.tooltipText
          tooltip.style.display = "block"

          tooltip.style.fontFamily = this.config.labelFontFamily
          tooltip.style.left = `${ev.clientX - tooltip.clientWidth / 2}px`
          tooltip.style.top = `${ev.clientY - tooltip.clientHeight - 15}px`
        })
      }


      // remove border dasharray (this improves the visual appearance of a node has a dashed border)
      const node = this.svg.get(0)
      node.stroke({
        width: this.config.borderStrokeWidth,
        color: this.config.borderStrokeColor,
        dasharray: 0,
      })


      // find a color add a highlight based on that color
      let toDark = this.config.borderStrokeColor.substr(1)
      if (this.type === "requirement") {
        toDark = this.config.backgroundColor.substr(1)
      }


      // attach the drop shadow
      node.filterWith((add) => {
        const blur = add.offset(0, 0).in(add.$source).gaussianBlur(3)
        const color = add.composite(add.flood(`#${toDark}`), blur, "in")
        add.merge(color, add.$source)
      })
    })


    // register an event that listens of the cursor leaves the nodes SVG object
    svg.on("mouseout", () => {

      // reset border stroke to its original value
      const node = this.svg.get(0)
      node.stroke({
        width: this.config.borderStrokeWidth,
        color: this.config.borderStrokeColor,
        dasharray: this.config.borderStrokeDasharray,
      })

      // remove the tooltip listener event
      svg.off("mousemove", null)

      // remove the tooltip
      const tooltip = document.getElementById("tooltip")
      tooltip.style.display = "none"

      // remove hover highlight
      node.filterer().remove()
    })




    return svg
  }


  /**
   * Creates the nodes actual SVG shape.
   * @return {SVG} The node as SVG representation.
   * 
   * @see https://svgjs.com/docs/3.0/shape-elements/#svg-rect
   * @see https://svgjs.com/docs/3.0/shape-elements/#svg-ellipse
   * @see https://svgjs.com/docs/3.0/shape-elements/#svg-path
   */
  createNode() {
    let node = null
    const width = 1
    const height = 1

    // create the SVG shape
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


    // the the background
    node.fill(this.config.backgroundColor)

    // add some border stroke
    node.stroke({
      width: this.config.borderStrokeWidth,
      color: this.config.borderStrokeColor,
      dasharray: this.config.borderStrokeDasharray,
    })

    // add a radius
    if (this.config.nodeType !== "path") {
      node.radius(this.config.borderRadius)
    }

    // create a re-usable drop shadow
    const defId = "defaultNodeBorderFilter"
    const i = [...this.canvas.defs().node.childNodes].findIndex((d) => d.id === defId) || -1
    if (i === -1) {
      const filter = new Filter()
      filter.id(defId)
      const blur = filter.offset(0, 0).in(filter.$source).gaussianBlur(2)
      const color = filter.composite(filter.flood("#fff"), blur, "in")
      filter.merge(color, filter.$source)
    }

    return node
  }


  /**
   * Creates the nodes icon.
   * @return {SVG} The icon image.
   * 
   * @see https://svgjs.com/docs/3.0/shape-elements/#svg-image
   */
  createIcon() {
    let icon = null

    // use a default icon
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
    } else { // or a provided one
      icon = this.canvas.image(this.config.iconUrl)
    }


    // set the starting size (Note: 0 is not accepted by the library)
    icon.size(1, 1)
    return icon
  }


  /**
   * Creates the nodes label using HTML.
   * @return {SVG} The label in HTML format.
   * 
   * @see https://svgjs.com/docs/3.0/shape-elements/#svg-foreignobject
   * @see https://github.com/xavi160/Clamp.js
   */
  createLabel() {
    // create the foreign object which holds 
    // Note: this.config.minTextHeight is actually not useful for a colored background, therefore its omitted
    const fobj = this.canvas.foreignObject(this.config.minTextWidth, 1)

    // simply return if there is no label provided
    if (this.label === "") return fobj


    // create the label background
    const background = document.createElement("div")
    background.style.background = this.config.labelBackground
    background.style.padding = `${this.config.offset / 2}px`
    background.style.textAlign = "center"
    background.style.width = `${this.config.minTextWidth}px`
    background.setAttribute("id", "label")


    // create the actual label text
    const label = document.createElement("div")
    label.innerText = this.label
    label.style.color = this.config.labelColor
    label.style.fontSize = `${this.config.labelFontSize}px`
    label.style.fontFamily = this.config.labelFontFamily
    label.style.fontWeight = this.config.labelFontWeight
    label.style.fontStyle = this.config.labelFontStyle


    // adjust the the line size
    clamp(label, { clamp: this.config.minLabelLineClamp })

    // add the label to the background element
    background.appendChild(label)


    // add the HTML to the SVG
    fobj.add(background)


    // disable the user-select css property
    fobj.css("user-select", "none")

    // adjust the svg position
    fobj.dmove(this.config.borderStrokeWidth, this.config.borderStrokeWidth)

    return fobj
  }


  /**
   * Removes the rendered SVG object from the canvas.
   */
  removeSVG() {
    if (this.isRendered() === false) return

    const x = this.finalX
    const y = this.finalY

    this.svg.back()

    this.svg
      .animate({ duration: this.config.animationSpeed })
      .transform({ scale: 0.001, position: [x, y + 100] })
      .after(() => {
        try { this.svg.remove() } catch (error) { }
        this.svg = null
      })
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

  getOutgoingEdges() {
    return this.outgoingEdges
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

  hasNoChildren() {
    return this.children.length === 0
  }

  hasChildren() {
    return this.children.length > 0
  }

  hasNoChildrenIds() {
    return this.childrenIds.length === 0
  }

  getChildrenIds() {
    return this.childrenIds
  }

  hasChildrenIds() {
    return this.childrenIds.length > 0
  }

  setChildrenIds(childrenIds) {
    this.childrenIds = childrenIds
  }

  getInvisibleChildren() {
    return this.invisibleChildren
  }

  setInvisibleChildren(invisibleChildren) {
    this.invisibleChildren = invisibleChildren
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

  getParentId() {
    return this.parentId
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
