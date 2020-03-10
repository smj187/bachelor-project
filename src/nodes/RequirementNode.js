import clamp from "clamp-js"
import BaseNode from "./BaseNode"

/**
 * @typedef
 */


/**
 * Default configuration for requirement nodes
 * @typedef {RequirementConfig} RequirementConfig
 *
 * @param {Number} [maxWidth=370] The nodes maximal width
 * @param {Number} [maxHeight=200] The nodes maximal height
 * @param {Number} [minWidth=155] The nodes minimal width
 * @param {Number} [minHeight=50] The nodes minimal height
 *
 * @param {Object} state // TODO: create a proper type
 * @param {String} state.state A specific requirement state
 * @param {String} state.name The display name of a specific requirement state
 * @param {String} state.color The color attached to a specifc state
 * @param {Array} [states=Array[state]] An array of aviable requirement states
 *
 * @param {Number} [offset=8] The spacing used by padding and margin
 * @param {Number} [animationSpeed=300] The animation in milliseconds
 * @param {Number} [borderRadius=8] The border radius
 * @param {Number} [borderStrokeWidth=1] The border stroke width
 * @param {String} [borderStrokeColor="#666666"] The border color
 * @param {String} [borderStrokeDasharray="0"] Gaps inside border
 * @param {String} [backgroundColor="#ffffff"] The background color for the rendered node
 *
 * @param {Number} [minTextWidth=150] The minimal text width for the label
 * @param {Number} [minTextHeight=45] The minimal text height for the label
 * @param {Number} [minTextTranslateX=0] Moves the label horizontally
 * @param {Number} [minTextTranslateY=0] The the label vertically
 * @param {Number} [maxTextWidth=365] The maximal text width for the description
 * @param {Number} [maxTextHeight=195] The maximal text height for the description
 * @param {Number} [maxTextTranslateX=0] The the description horizontally
 * @param {Number} [maxTextTranslateY=0] The the description vertically
 * @param {String} [labelColor="#222222"] The label text color for details
 * @param {String} [labelColor="#ffffff"] The label text color for minimal nodes
 * @param {String} [labelFontFamily="Montserrat"] The label font family
 * @param {Number} [labelFontSize=14] The label font size
 * @param {Number} [labelFontWeight=600] The label font weight
 * @param {String} [labelFontStyle="normal"] The label font style
 * @param {String} [labelBackground="none"] The label background color
 * @param {String} [detailsColor="#222222"] The details text color
 * @param {String} [detailsFontFamily="Montserrat"] The details family
 * @param {Number} [detailsFontSize=12] The details font size
 * @param {Number} [detailsFontWeight=600] The details font weight
 * @param {String} [detailsFontStyle="normal"] The details font style
 * @param {String} [detailsBackground="none"] The details text background color
 */
const RequirementConfig = {
  // large node
  maxWidth: 370,
  maxHeight: 200,


  // small node
  minWidth: 155,
  minHeight: 50,


  // available node states
  states: [
    { state: "fulfilled", name: "Fulfilled", color: "#7ed167" },
    { state: "partially-fulfilled", name: "Partially Fulfilled", color: "#ffc453" },
    { state: "not-fulfilled", name: "Not Fulfilled", color: "#ff6655" },
    { state: "Unknown State", name: "Unknown State", color: "#84a8f2" },
  ],


  // node
  offset: 8,
  animationSpeed: 300,
  borderRadius: 8,
  borderStrokeWidth: 1,
  borderStrokeColor: "#666666",
  borderStrokeDasharray: "0",
  backgroundColor: "#ffffff",


  // text
  minTextWidth: 150,
  minTextHeight: 45,
  minTextTranslateX: 0,
  minTextTranslateY: 0,
  maxTextWidth: 365,
  maxTextHeight: 195,
  maxTextTranslateX: 0,
  maxTextTranslateY: 0,
  maxLabelColor: "#222222",
  labelColor: "#ffffff",
  labelFontFamily: "Montserrat",
  labelFontSize: 14,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "none",
  detailsColor: "#222222",
  detailsFontFamily: "Montserrat",
  detailsFontSize: 12,
  detailsFontWeight: 600,
  detailsFontStyle: "normal",
  detailsBackground: "none",
}


/**
 * Class representing the visualization of requirements
 * @param {Data} data the raw node data
 * @param {Canvas} canvas the canvas to render the node on
 * @param {RequirementConfig} customRequirementConfig custom config to override the default values
 *
 * @example
 * const requirement1 = NodeFactory.create(data.find(d => d.type === "requirement"), canvas)
 * requirement1.setInitialXY(200, 100)
 * requirement1.renderAsMin()
 *
 * const requirement2 = NodeFactory.create(data.find(d => d.type === "requirement"), canvas)
 * requirement2.setInitialXY(200, 400)
 * requirement2.renderAsMax()
 *
 * setTimeout(() => requirement1.transformToMax(200, 200), 500)
 * setTimeout(() => requirement2.transformToMin(200, 350), 500)
 */
class RequirementNode extends BaseNode {
  constructor(data, canvas, customRequirementConfig) {
    super(data, canvas)

    this.config = { ...RequirementConfig, ...customRequirementConfig }

    // map color to respected state
    if (data.state !== null || data.state !== undefined) {
      const state = this.config.states.find((s) => s.state === data.state)
      this.config = {
        ...this.config,
        borderStrokeColor: state.color,
        backgroundColor: state.color,
      }
    }
  }


  /**
   * Creates the requirements details description
   * @private
   */
  createRequirementDetails() {
    const text = this.canvas.foreignObject(this.config.maxTextWidth, this.config.maxTextHeight)

    const background = document.createElement("div")
    background.style.display = "flex"
    background.style.flexDirection = "column"
    background.style.alignItems = "center"
    text.add(background)

    // create label
    const label = document.createElement("p")
    label.innerHTML = this.label
    label.style.textAlign = "center"
    label.style.background = this.config.labelBackground
    label.style.marginTop = `${this.config.offset}px`
    label.style.color = this.config.maxLabelColor
    label.style.fontSize = `${this.config.labelFontSize + 4}px`
    label.style.fontFamily = this.config.labelFontFamily
    label.style.fontWeight = this.config.labelFontWeight
    label.style.fontStyle = this.config.labelFontStyle
    background.appendChild(label)

    // create status, if any exists
    const status = document.createElement("p")
    if (this.state !== null) {
      status.innerHTML = this.config.states.find((s) => s.state.toLowerCase() === this.state.toLowerCase()).name
      status.style.background = "#222"
      status.style.color = "#fff"
      status.style.fontSize = `${this.config.labelFontSize + 2}px`
      status.style.fontFamily = this.config.labelFontFamily
      status.style.fontWeight = "normal"
      status.style.textAlign = "center"
      status.style.width = "fit-content"
      status.style.padding = `${this.config.offset / 2}px ${this.config.offset / 1.5}px`
      status.style.borderRadius = `${this.config.borderRadius / 2}px`
      status.style.margin = `${this.config.offset}px ${this.config.offset}px`
      background.appendChild(status)
    }

    // create description
    const descriptionBg = document.createElement("div")
    background.appendChild(descriptionBg)
    const description = document.createElement("p")
    description.style.background = this.config.detailsBackground
    description.style.padding = `0 ${this.config.offset}px`
    description.style.margin = `0 ${this.config.offset}px ${this.config.offset}px ${this.config.offset}px`
    if (this.state === null) {
      description.style.marginTop = `${this.config.offset}px`
    }
    description.style.color = this.config.detailsColor
    description.style.fontSize = `${this.config.detailsFontSize}px`
    description.style.fontFamily = this.config.detailsFontFamily
    description.style.fontWeight = this.config.detailsFontWeight
    description.style.fontStyle = this.config.detailsFontStyle
    description.innerText = this.description
    descriptionBg.appendChild(description)


    const h = this.config.maxTextHeight - label.clientHeight - status.clientHeight - this.config.offset * 3.5
    clamp(description, { clamp: `${h}px` })
    return text
  }


  /**
   * Renders a requirement node in minimal version
   * @param {Number} [X=initialX] the initial X render position
   * @param {Number} [Y=initialY] the initial Y render position
   */
  renderAsMin(X = this.initialX, Y = this.initialY) {
    // create svg elements
    const svg = this.createSVGElement()
    const node = this.createNode()
    const text = this.createLabel()

    svg.add(node)
    svg.add(text)


    // animate new elements into position
    svg
      .center(X, Y)

    node
      .center(X, Y)
      .animate({ duration: this.config.animationSpeed })
      .width(this.config.minWidth)
      .height(this.config.minHeight)
      .dmove(-this.config.minWidth / 2, -this.config.minHeight / 2)

    text
      .size(this.config.minTextWidth, text.children()[0].node.clientHeight)
      .center(X, Y)
      .scale(0.001)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: 1 })
      .transform({ scale: 1, translate: [this.config.minTextTranslateX, this.config.minTextTranslateY] })


    this.currentWidth = this.config.minWidth
    this.currentHeight = this.config.minHeight
    this.nodeSize = "min"
    this.currentX = X
    this.currentY = Y
    this.opacity = 1
    this.isHidden = false
    this.svg = svg
  }


  /**
   * Renders a requirement node in maximal version
   * @param {Number} [X=initialX] the initial X render position
   * @param {Number} [Y=initialY] the initial Y render position
   */
  renderAsMax(X = this.initialX, Y = this.initialY) {
    // create svg elements
    const svg = this.createSVGElement()
    const node = this.createNode()
    const text = this.createRequirementDetails()

    svg.add(node)
    svg.add(text)


    // animate new elements into position
    svg
      .center(X, Y)

    node
      .center(X, Y)
      .animate({ duration: this.config.animationSpeed })
      .width(this.config.maxWidth)
      .height(this.config.maxHeight)
      .dmove(-this.config.maxWidth / 2, -this.config.maxHeight / 2)

    text
      .center(X, Y)
      .scale(0.001)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: 1 })
      .transform({ scale: 1, translate: [this.config.maxTextTranslateX, this.config.maxTextTranslateY] })


    this.currentWidth = this.config.maxWidth
    this.currentHeight = this.config.maxHeight
    this.nodeSize = "max"
    this.currentX = X
    this.currentY = Y
    this.opacity = 1
    this.isHidden = false
    this.svg = svg
  }


  /**
   * Transforms a node from minimal version to maximal version
   * @param {Number} [X=finalX] the final X render position
   * @param {Number} [Y=finaY] the final Y render position
   */
  transformToMax(X = this.finalX, Y = this.finalY) {
    // update current elements
    this
      .svg
      .get(0)
      .animate({ duration: this.config.animationSpeed })
      .width(this.config.maxWidth)
      .height(this.config.maxHeight)
      .center(X, Y)

    this
      .svg
      .get(1)
      .remove()


    // create new elements
    const text = this.createRequirementDetails()

    this.svg.add(text)


    // put new elements into position
    text
      .center(X, Y)
      .scale(0.001)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: 1 })
      .transform({ scale: 1, translate: [this.config.maxTextTranslateX, this.config.maxTextTranslateY] })


    this.currentWidth = this.config.minWidth
    this.currentHeight = this.config.minHeight
    this.nodeSize = "max"
    this.currentX = X
    this.currentY = Y
  }


  /**
   * Transforms a node from maximal version to minimal version
   * @param {Number} [X=finalX] the final X render position
   * @param {Number} [Y=finaY] the final Y render position
   */
  transformToMin(X = this.finalX, Y = this.finalY) {
    // update current elements
    this
      .svg
      .get(0)
      .animate({ duration: this.config.animationSpeed })
      .width(this.config.minWidth)
      .height(this.config.minHeight)
      .center(X, Y)

    this
      .svg
      .get(1)
      .remove()


    // create new elements
    const text = this.createLabel()

    this.svg.add(text)


    // put new elements into position
    text
      .size(this.config.minTextWidth, text.children()[0].node.clientHeight)
      .center(X, Y)
      .scale(0.001)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: 1 })
      .transform({ scale: 1, translate: [this.config.minTextTranslateX, this.config.minTextTranslateY] })


    this.currentWidth = this.config.minWidth
    this.currentHeight = this.config.minHeight
    this.nodeSize = "min"
    this.currentX = X
    this.currentY = Y
  }
}


export default RequirementNode
