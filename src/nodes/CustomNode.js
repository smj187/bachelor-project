import clamp from "clamp-js"
import BaseNode from "./BaseNode"


/**
 * Default configuration for asset nodes
 * @typedef {CustomConfig} CustomConfig
 *
 * @param {String} [nodeType="rect"] The form the node is rendered. "path" for a custom SVG element
 * @param {String} [svg=null] The custom SVG path that is rendered as node if nodeType is set to "path"
 *
 * @param {Number} [maxWidth=275] The nodes maximal width
 * @param {Number} [maxHeight=175] The nodes maximal height
 * @param {Number} [minWidth=150] The nodes minimal width
 * @param {Number} [minHeight=80] The nodes minimal height
 *
 * @param {String} [iconUrl=null] The path to the image icon (if this value is null, the default icon is used)
 * @param {Number} [minIconOpacity=0.3] The basic visibility of the icon
 * @param {Number} [minIconSize=70] The width and height for the image icon
 * @param {Number} [minIconTranslateX=0] Moves the icon horizontally
 * @param {Number} [minIconTranslateY=0] Moves the icon vertically
 * @param {Number} [maxIconOpacity=0.4] The basic visibility of the icon
 * @param {Number} [maxIconSize=200] The width and height for the image icon
 * @param {Number} [maxIconTranslateX=0] Moves the icon horizontally
 * @param {Number} [maxIconTranslateY=0] Moves the icon vertically
 *
 * @param {Number} [offset=8] The spacing used by padding and margin
 * @param {Number} [animationSpeed=300] The animation in milliseconds
 * @param {Number} [borderRadius=5] The border radius
 * @param {Number} [borderStrokeWidth=1] The border stroke width
 * @param {String} [borderStrokeColor="#222222"] The border color
 * @param {String} [borderStrokeDasharray="0"] Gaps inside border
 * @param {String} [backgroundColor="#ffffff"] The background color for the rendered node
 *
 * @param {Number} [minTextWidth=145] The minimal text width for the label
 * @param {Number} [minTextHeight=75] The minimal text height for the label
 * @param {Number} [minTextTranslateX=0] Moves the label horizontally
 * @param {Number} [minTextTranslateY=0] The the label vertically
 * @param {Number} [maxTextWidth=260] The maximal text width for the description
 * @param {Number} [maxTextHeight=220] The maximal text height for the description
 * @param {Number} [maxTextTranslateX=0] The the description horizontally
 * @param {Number} [maxTextTranslateY=0] The the description vertically
 * @param {String} [labelColor="#444444"] The label text color
 * @param {String} [labelFontFamily="Montserrat"] The label font family
 * @param {Number} [labelFontSize=16] The label font size
 * @param {Number} [labelFontWeight=600] The label font weight
 * @param {String} [labelFontStyle="normal"] The label font style
 * @param {String} [labelBackground="#ffffffcc"] The label background color
 * @param {String} [detailsColor="#444444"] The details text color
 * @param {String} [detailsFontFamily="Montserrat"] The details family
 * @param {Number} [detailsFontSize=12] The details font size
 * @param {Number} [detailsFontWeight=600] The details font weight
 * @param {String} [detailsFontStyle="normal"] The details font style
 * @param {String} [detailsBackground="#ffffff"] The details text background color
 *
 */
const CustomConfig = {

  nodeType: "rect", // rect or path
  svg: null,

  // large node
  maxWidth: 275,
  maxHeight: 175,


  // small node
  minWidth: 150,
  minHeight: 80,


  // icon
  iconUrl: null,
  minIconOpacity: 0.3,
  minIconSize: 70,
  minIconTranslateX: 0,
  minIconTranslateY: 0,
  maxIconOpacity: 0.4,
  maxIconSize: 200,
  maxIconTranslateX: 0,
  maxIconTranslateY: 0,


  // node
  offset: 8,
  animationSpeed: 300,
  borderRadius: 5,
  borderStrokeWidth: 1,
  borderStrokeColor: "#222222",
  borderStrokeDasharray: "0",
  backgroundColor: "#ffffff",


  // text
  minTextWidth: 145,
  minTextHeight: 75,
  minTextTranslateX: 0,
  minTextTranslateY: 0,
  maxTextWidth: 260,
  maxTextHeight: 220,
  maxTextTranslateX: 0,
  maxTextTranslateY: 0,
  labelColor: "#444444",
  labelFontFamily: "Montserrat",
  labelFontSize: 16,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#ffffffcc",
  detailsColor: "#444444",
  detailsFontFamily: "Montserrat",
  detailsFontSize: 12,
  detailsFontWeight: 600,
  detailsFontStyle: "normal",
  detailsBackground: "#ffffffcc",
}


/**
 * Class representing the visualization of custom elements
 * @param {Data} data the raw node data
 * @param {Canvas} canvas the canvas to render the node on
 * @param {CustomConfig} customConfig custom config to override the default values
 *
 * @example
 * // a custom node with a given svg shape
 * const config1 = {
 *    nodeType: "path",
 *    svg: "M 0, 0 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0",
 *    minTextWidth: 145,
 *    minIconSize: 100,
 *    minWidth: 150,
 *    minHeight: 150,
 *    maxTextWidth: 250,
 *    maxIconSize: 200,
 *    maxWidth: 300,
 *    maxHeight: 300,
 *    maxTextTranslateX: 5,
 *    maxTextTranslateY: -20
 * }
 * const custom1 = NodeFactory.create(data.find(d => d.type === "custom"), canvas)
 * custom1.setConfig(config1)
 * custom1.setInitialXY(200, 90)
 * custom1.renderAsMin()
 *
 * const custom2 = NodeFactory.create(data.find(d => d.type === "custom"), canvas)
 * custom2.setConfig(config1)
 * custom2.setInitialXY(200, 350)
 * custom2.renderAsMax()
 *
 * setTimeout(() => custom1.transformToMax(200, 350), 500)
 * setTimeout(() => custom2.transformToMin(200, 90), 500)
 *
 *
 * // or a normal custom node
 * const config2 = {
 *    maxWidth: 275,
 *    maxHeight: 175,
 *    maxIconSize: 150,
 *    maxTextWidth: 260,
 *    maxTextHeight: 175,
 *    maxTextTranslateX: 5,
 *    maxTextTranslateY: 2
 * }
 * const custom3 = NodeFactory.create(data.find(d => d.type === "custom"), canvas)
 * custom3.setConfig(config2)
 * custom3.setInitialXY(550, 110)
 * custom3.renderAsMax()
 *
 * const custom4 = NodeFactory.create(data.find(d => d.type === "custom"), canvas)
 * custom4.setConfig(config2)
 * custom4.setInitialXY(550, 350)
 * custom4.renderAsMin()
 *
 * setTimeout(() => custom4.transformToMax(550, 110), 500)
 * setTimeout(() => custom3.transformToMin(550, 350), 500)
 */
class CustomNode extends BaseNode {
  constructor(data, canvas, customConfig) {
    super(data, canvas)

    this.config = { ...CustomConfig, ...customConfig }
  }


  /**
   * Creates the custom details description
   * @private
   */
  createCustomDetails() {
    const text = this.canvas.foreignObject(this.config.maxTextWidth, this.config.maxTextHeight)
    const background = document.createElement("div")
    background.style.width = `${this.config.maxTextWidth}px`
    background.style.height = `${this.config.maxTextHeight}px`
    background.style.display = "flex"
    background.style.flexDirection = "column"
    background.style.justifyContent = "center"
    background.style.alignItems = "center"
    text.add(background)

    // add label
    const label = document.createElement("p")
    label.innerText = this.label
    label.style.padding = `${this.config.offset * 1.5}px ${this.config.offset / 2}px ${this.config.offset / 2}px 0px`
    label.style.color = this.config.labelColor
    label.style.fontSize = `${this.config.labelFontSize + 4}px`
    label.style.fontFamily = this.config.labelFontFamily
    label.style.fontWeight = this.config.labelFontWeight
    label.style.fontStyle = this.config.labelFontStyle
    label.style.textAlign = "center"
    label.style.background = this.config.detailsBackground
    label.style.width = "fit-content"
    background.appendChild(label)

    // add description
    const descriptionBg = document.createElement("div")
    descriptionBg.style.overflow = "hidden"
    descriptionBg.style.margin = `${this.config.offset}px ${this.config.offset}px ${this.config.offset}px 0`
    background.appendChild(descriptionBg)

    const description = document.createElement("p")
    description.innerText = this.description
    description.style.color = this.config.detailsColor
    description.style.fontSize = `${this.config.detailsFontSize}px`
    description.style.fontFamily = this.config.detailsFontFamily
    description.style.fontWeight = this.config.detailsFontWeight
    description.style.fontStyle = this.config.detailsFontStyle
    description.style.background = this.config.detailsBackground
    description.style.width = "fit-content"
    descriptionBg.appendChild(description)

    // fix overflow text
    clamp(description, { clamp: `${this.config.maxTextHeight - label.clientHeight - this.config.offset * 2.5}px` })
    return text
  }


  /**
   * Renders a custom node in minimal version
   * @param {Number} X the initial X position
   * @param {Number} Y the initial Y position
   */
  renderAsMin(X = this.initialX, Y = this.initialY) {
    // create svg elements
    const svg = this.createSVGElement()
    const node = this.createNode()
    const icon = this.createIcon()
    const text = this.createLabel()

    svg.add(node)
    svg.add(icon)
    svg.add(text)


    // animate new elements into position
    svg
      .center(X, Y)

    if (this.config.nodeType === "path") {
      node
        .scale(0.001)
        .center(X, Y)
        .animate({ duration: this.config.animationSpeed })
        .transform({ scale: 1 })
    } else {
      node
        .center(X, Y)
        .animate({ duration: this.config.animationSpeed })
        .width(this.config.minWidth)
        .height(this.config.minHeight)
        .dmove(-this.config.minWidth / 2, -this.config.minHeight / 2)
    }

    icon
      .size(0, 0)
      .center(X, Y)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: this.config.minIconOpacity })
      .size(this.config.minIconSize, this.config.minIconSize)
      .dx(-this.config.minIconSize / 2 + this.config.minIconTranslateX)
      .dy(-this.config.minIconSize / 2 + this.config.minIconTranslateY)

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
   * Renders a custom node in maximal version
   * @param {Number} X the initial X position
   * @param {Number} Y the initial Y position
   */
  renderAsMax(X = this.initialX, Y = this.initialY) {
    // create svg elements
    const svg = this.createSVGElement()
    const node = this.createNode()
    const icon = this.createIcon()
    const text = this.createCustomDetails()

    svg.add(node)
    svg.add(icon)
    svg.add(text)


    // animate new elements into position
    svg
      .center(X, Y)


    if (this.config.nodeType === "path") {
      node
        .center(X, Y)
        .animate({ duration: this.config.animationSpeed })
        .width(this.config.maxWidth)
        .height(this.config.maxHeight)
        .dmove(-this.config.maxWidth / 4, -this.config.maxHeight / 4)
    } else {
      node
        .center(X, Y)
        .animate({ duration: this.config.animationSpeed })
        .width(this.config.maxWidth)
        .height(this.config.maxHeight)
        .dmove(-this.config.maxWidth / 2, -this.config.maxHeight / 2)
    }

    icon
      .size(0, 0)
      .center(X, Y)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: this.config.maxIconOpacity })
      .size(this.config.maxIconSize, this.config.maxIconSize)
      .dx(-this.config.maxIconSize / 2 + this.config.maxIconTranslateX)
      .dy(-this.config.maxIconSize / 2 + this.config.maxIconTranslateY)

    text
      .size(this.config.maxTextWidth, text.children()[0].node.clientHeight)
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
   * @param {Number} X the final X position
   * @param {Number} Y the final Y position
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
      .get(2)
      .remove()

    this
      .svg
      .get(1)
      .remove()


    // create new elements
    const icon = this.createIcon()
    const text = this.createCustomDetails()

    this.svg.add(icon)
    this.svg.add(text)


    // put new elements into position
    icon
      .size(0, 0)
      .center(this.initialX, this.initialY)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: this.config.maxIconOpacity })
      .size(this.config.maxIconSize, this.config.maxIconSize)
      .cx(X - this.config.maxIconSize / 2 + this.config.maxIconTranslateX + this.config.maxIconSize / 2)
      .cy(Y - this.config.maxIconSize / 2 + this.config.maxIconTranslateY + this.config.maxIconSize / 2)

    text
      .center(this.initialX, this.initialY)
      .scale(0.001)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: 1 })
      .transform({ scale: 1, translate: [this.config.maxTextTranslateX, this.config.maxTextTranslateY] })
      .center(X, Y)


    this.currentWidth = this.config.minWidth
    this.currentHeight = this.config.minHeight
    this.nodeSize = "max"
    this.currentX = X
    this.currentY = Y
  }


  /**
   * Transforms a node from maximal version to minimal version
   * @param {Number} X the final X position
   * @param {Number} Y the final Y position
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
      .get(2)
      .remove()

    this
      .svg
      .get(1)
      .remove()


    // create new elements
    const icon = this.createIcon()
    const text = this.createLabel()

    this.svg.add(icon)
    this.svg.add(text)


    // put new elements into position
    icon
      .center(this.initialX, this.initialY)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: this.config.minIconOpacity })
      .size(this.config.minIconSize, this.config.minIconSize)
      .dx(-this.config.minIconSize / 2 + this.config.minIconTranslateX)
      .dy(-this.config.minIconSize / 2 + this.config.minIconTranslateY)
      .center(X, Y)

    text
      .center(this.initialX, this.initialY)
      .size(this.config.minTextWidth, text.children()[0].node.clientHeight)
      .scale(0.001)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: 1 })
      .transform({ scale: 1, translate: [this.config.minTextTranslateX, this.config.minTextTranslateY] })
      .center(X, Y)


    this.currentWidth = this.config.minWidth
    this.currentHeight = this.config.minHeight
    this.nodeSize = "min"
    this.currentX = X
    this.currentY = Y
  }
}


export default CustomNode
