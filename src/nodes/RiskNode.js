import clamp from "clamp-js"
import BaseNode from "./BaseNode"


/**
 * Default configuration for risk nodes
 * @typedef {RiskConfig} RiskConfig
 *
 * @param {Number} [maxWidth=300] The nodes maximal width
 * @param {Number} [maxHeight=150] The nodes maximal height
 * @param {Number} [minWidth=150] The nodes minimal width
 * @param {Number} [minHeight=50] The nodes minimal height
 *
 * @param {String} [iconUrl=null] The path to the image icon (if this value is null, the default icon is used)
 * @param {Number} [minIconOpacity=0.6] The basic visibility of the icon
 * @param {Number} [minIconSize=35] The width and height for the image icon
 * @param {Number} [minIconTranslateX=-50] Moves the icon horizontally
 * @param {Number} [minIconTranslateY=0] Moves the icon vertically
 * @param {Number} [maxIconOpacity=0.75] The basic visibility of the icon
 * @param {Number} [maxIconSize=30] The width and height for the image icon
 * @param {Number} [maxIconTranslateX=-120] Moves the icon horizontally
 * @param {Number} [maxIconTranslateY=-55] Moves the icon vertically
 *
 * @param {Number} [offset=8] The spacing used by padding and margin
 * @param {Number} [animationSpeed=300] The animation in milliseconds
 * @param {Number} [borderRadius=4] The border radius
 * @param {Number} [borderStrokeWidth=1] The border stroke width
 * @param {String} [borderStrokeColor="#F26A7C"] The border color
 * @param {String} [borderStrokeDasharray="5 10"] Gaps inside border
 * @param {String} [backgroundColor="#ffffff"] The background color for the rendered node
 *
 * @param {Number} [minTextWidth=100] The minimal text width for the label
 * @param {Number} [minTextHeight=45] The minimal text height for the label
 * @param {Number} [minTextTranslateX=22] Moves the label horizontally
 * @param {Number} [minTextTranslateY=0] The the label vertically
 * @param {Number} [maxTextWidth=295] The maximal text width for the description
 * @param {Number} [maxTextHeight=145] The maximal text height for the description
 * @param {Number} [maxTextTranslateX=0] The the description horizontally
 * @param {Number} [maxTextTranslateY=0] The the description vertically
 * @param {String} [labelColor="#ff8e9e"] The label text color
 * @param {String} [labelFontFamily="Montserrat"] The label font family
 * @param {Number} [labelFontSize=14] The label font size
 * @param {Number} [labelFontWeight=600] The label font weight
 * @param {String} [labelFontStyle="normal"] The label font style
 * @param {String} [labelBackground="transparent"] The label background color
 * @param {String} [detailsColor="#ff8e9e"] The details text color
 * @param {String} [detailsFontFamily="Montserrat"] The details family
 * @param {Number} [detailsFontSize=12] The details font size
 * @param {Number} [detailsFontWeight=600] The details font weight
 * @param {String} [detailsFontStyle="normal"] The details font style
 * @param {String} [detailsBackground="transparent"] The details text background color
 */
const RiskConfig = {
  // large node
  maxWidth: 300,
  maxHeight: 150,


  // small node
  minWidth: 150,
  minHeight: 50,


  // icon
  iconUrl: null,
  minIconOpacity: 0.6,
  minIconSize: 35,
  minIconTranslateX: -50,
  minIconTranslateY: 0,
  maxIconOpacity: 0.75,
  maxIconSize: 30,
  maxIconTranslateX: -120,
  maxIconTranslateY: -55,


  // node
  offset: 8,
  animationSpeed: 300,
  borderRadius: 4,
  borderStrokeWidth: 1,
  borderStrokeColor: "#F26A7C",
  borderStrokeDasharray: "5 10",
  backgroundColor: "#ffffff",


  // text
  minTextWidth: 100,
  minTextHeight: 45,
  minTextTranslateX: 22,
  minTextTranslateY: 0,
  maxTextWidth: 295,
  maxTextHeight: 145,
  maxTextTranslateX: 0,
  maxTextTranslateY: 0,
  labelColor: "#ff8e9e",
  labelFontFamily: "Montserrat",
  labelFontSize: 14,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "transparent",
  detailsColor: "#ff8e9e",
  detailsFontFamily: "Montserrat",
  detailsFontSize: 12,
  detailsFontWeight: 600,
  detailsFontStyle: "normal",
  detailsBackground: "transparent",
}


/**
 * Class representing the visualization of risks
 * @param {Data} data the raw node data
 * @param {Canvas} canvas the canvas to render the node on
 * @param {RiskConfig} customRiskConfig custom config to override default values
 *
 * @example
 * const risk1 = NodeFactory.create(data.find(d => d.type === "risk"), canvas)
 * risk1.setInitialXY(200, 100)
 * risk1.renderAsMin()
 *
 * const risk2 = NodeFactory.create(data.find(d => d.type === "risk"), canvas)
 * risk2.setInitialXY(200, 400)
 * risk2.renderAsMax()
 *
 * setTimeout(() => risk1.transformToMax(200, 200), 500)
 * setTimeout(() => risk2.transformToMin(200, 350), 500)
 *
 */
class RiskNode extends BaseNode {
  constructor(data, canvas, customRiskConfig) {
    super(data, canvas)

    this.config = { ...RiskConfig, ...customRiskConfig }
  }


  /**
   * Creates the risk details description
   * @private
   */
  createRiskDetails() {
    // create svg obj to store html
    const text = this.canvas.foreignObject(this.config.maxTextWidth, this.config.maxTextHeight)
    const background = document.createElement("div")
    background.style.width = `${this.config.maxTextWidth}px`
    background.style.height = `${this.config.maxTextHeight}px`
    background.style.display = "grid"
    background.style.alignItems = "center"
    background.style.gridTemplateColumns = "auto 10px auto"
    background.style.gridTemplateRows = `${this.config.labelFontSize + 4 + this.config.offset * 2}px auto`
    text.add(background)

    // create label
    const label = document.createElement("p")
    label.innerText = this.label
    label.style.background = this.config.labelBackground
    label.style.padding = `
      ${this.config.offset}px 
      ${this.config.offset / 2}px 
      ${this.config.offset / 1.5}px 
      ${this.config.offset / 2}px
    `
    label.style.color = this.config.labelColor
    label.style.fontSize = `${this.config.labelFontSize + 4}px`
    label.style.fontFamily = this.config.labelFontFamily
    label.style.fontWeight = this.config.labelFontWeight
    label.style.fontStyle = this.config.labelFontStyle
    if (this.state !== null) {
      label.style.textAlign = "right"
    } else {
      label.style.width = "inherit"
      label.style.textAlign = "center"
    }

    label.style.marginTop = `${this.config.offset}px`
    label.style.height = "fit-content"
    label.style.gridRow = "1"
    label.style.gridColumn = "1"
    background.appendChild(label)

    // create status, if any exists
    if (this.state !== null) {
      const seperator = document.createElement("p")
      seperator.innerText = "•"

      seperator.style.background = this.config.labelBackground
      seperator.style.padding = `
        ${this.config.offset}px 
        ${this.config.offset / 2}px 
        ${this.config.offset / 1.5}px 
        ${this.config.offset / 2}px
      `
      seperator.style.color = this.config.labelColor
      seperator.style.fontSize = `${this.config.labelFontSize + 4}px`
      seperator.style.fontFamily = this.config.labelFontFamily
      seperator.style.fontWeight = "900"
      seperator.style.fontStyle = this.config.labelFontStyle
      seperator.style.marginTop = `${this.config.offset}px`
      seperator.style.height = "fit-content"
      seperator.style.gridRow = "1"
      seperator.style.gridColumn = "2"
      background.appendChild(seperator)

      const status = document.createElement("p")
      status.innerText = this.state

      status.style.background = this.config.labelBackground
      status.style.padding = `
        ${this.config.offset}px 
        ${this.config.offset / 2}px 
        ${this.config.offset / 1.5}px 
        ${this.config.offset / 2}px
      `
      status.style.color = this.config.labelColor
      status.style.fontSize = `${this.config.labelFontSize + 4}px`
      status.style.fontFamily = this.config.labelFontFamily
      status.style.fontWeight = this.config.labelFontWeight
      status.style.fontStyle = this.config.labelFontStyle
      status.style.fontStyle = "italic"
      status.style.marginTop = `${this.config.offset}px`
      status.style.height = "fit-content"
      status.style.gridRow = "1"
      status.style.gridColumn = "3"
      background.appendChild(status)
    }

    // create description
    const descriptionBg = document.createElement("div")
    descriptionBg.style.gridRow = "2"
    descriptionBg.style.gridColumn = "1 / 4"
    descriptionBg.style.width = "fit-content"
    background.appendChild(descriptionBg)

    const description = document.createElement("p")
    description.innerText = this.description
    description.style.background = this.config.detailsBackground
    description.style.height = `${this.config.maxTextHeight - label.clientHeight - this.config.offset * 2}px`
    description.style.padding = `0 ${this.config.offset * 1.5}px`
    description.style.color = this.config.detailsColor
    description.style.fontSize = `${this.config.detailsFontSize}px`
    description.style.fontFamily = this.config.detailsFontFamily
    description.style.fontWeight = this.config.detailsFontWeight
    description.style.fontStyle = this.config.detailsFontStyle
    descriptionBg.appendChild(description)

    clamp(description, { clamp: `${this.config.maxTextHeight - label.clientHeight - this.config.offset * 2}px` })
    return text
  }


  /**
   * Renders a risk node in minimal version
   * @param {Number} [X=initialX] the initial X render position
   * @param {Number} [Y=initialY] the initial Y render position
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

    node
      .center(X, Y)
      .animate({ duration: this.config.animationSpeed })
      .width(this.config.minWidth)
      .height(this.config.minHeight)
      .dmove(-this.config.minWidth / 2, -this.config.minHeight / 2)

    icon
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
   * Renders a risk node in maximal version
   * @param {Number} [X=initialX] the initial X render position
   * @param {Number} [Y=initialY] the initial Y render position
   */
  renderAsMax(X = this.initialX, Y = this.initialY) {
    // create svg elements
    const svg = this.createSVGElement()
    const node = this.createNode()
    const icon = this.createIcon()
    const text = this.createRiskDetails()

    svg.add(node)
    svg.add(icon)
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

    icon
      .center(X, Y)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: this.config.maxIconOpacity })
      .size(this.config.maxIconSize, this.config.maxIconSize)
      .dx(-this.config.maxIconSize / 2 + this.config.maxIconTranslateX)
      .dy(-this.config.maxIconSize / 2 + this.config.maxIconTranslateY)

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
      .get(2)
      .remove()

    this
      .svg
      .get(1)
      .remove()


    // create new elements
    const icon = this.createIcon()
    const text = this.createRiskDetails()

    this.svg.add(icon)
    this.svg.add(text)


    // put new elements into position
    icon
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
  }
}


export default RiskNode
