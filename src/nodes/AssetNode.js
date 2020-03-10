import clamp from "clamp-js"
import BaseNode from "./BaseNode"

/**
 * Default configuration for asset nodes
 * @typedef {AssetConfig} AssetConfig
 *
 * @param {Number} [maxWidth=350] The nodes maximal width
 * @param {Number} [maxHeight=225] The nodes maximal height
 * @param {Number} [minWidth=150] The nodes minimal width
 * @param {Number} [minHeight=80] The nodes minimal height
 *
 * @param {String} [iconUrl=null] The path to the image icon (if this value is null, the default icon is used)
 * @param {Number} [minIconOpacity=0.5] The basic visibility of the icon
 * @param {Number} [minIconSize=70] The width and height for the image icon
 * @param {Number} [minIconTranslateX=0] Moves the icon horizontally
 * @param {Number} [minIconTranslateY=0] Moves the icon vertically
 * @param {Number} [maxIconOpacity=0.75] The basic visibility of the icon
 * @param {Number} [maxIconSize=30] The width and height for the image icon
 * @param {Number} [maxIconTranslateX=-140] Moves the icon horizontally
 * @param {Number} [maxIconTranslateY=-85] Moves the icon vertically
 *
 * @param {Number} [offset=8] The spacing used by padding and margin
 * @param {Number} [animationSpeed=300] The animation in milliseconds
 * @param {Number} [borderRadius=5] The border radius
 * @param {Number} [borderStrokeWidth=1] The border stroke width
 * @param {String} [borderStrokeColor="#84a8f2"] The border color
 * @param {String} [borderStrokeDasharray="5"] Gaps inside border
 * @param {String} [backgroundColor="#ffffff"] The background color for the rendered node
 *
 * @param {Number} [minTextWidth=145] The minimal text width for the label
 * @param {Number} [minTextHeight=75] The minimal text height for the label
 * @param {Number} [minTextTranslateX=0] Moves the label horizontally
 * @param {Number} [minTextTranslateY=0] The the label vertically
 * @param {Number} [maxTextWidth=345] The maximal text width for the description
 * @param {Number} [maxTextHeight=220] The maximal text height for the description
 * @param {Number} [maxTextTranslateX=0] The the description horizontally
 * @param {Number} [maxTextTranslateY=0] The the description vertically
 * @param {String} [labelColor="#7fa5f5"] The label text color
 * @param {String} [labelFontFamily="Montserrat"] The label font family
 * @param {Number} [labelFontSize=16] The label font size
 * @param {Number} [labelFontWeight=600] The label font weight
 * @param {String} [labelFontStyle="normal"] The label font style
 * @param {String} [labelBackground="#ffffffcc"] The label background color
 * @param {String} [detailsColor="#7fa5f5"] The details text color
 * @param {String} [detailsFontFamily="Montserrat"] The details family
 * @param {Number} [detailsFontSize=12] The details font size
 * @param {Number} [detailsFontWeight=600] The details font weight
 * @param {String} [detailsFontStyle="normal"] The details font style
 * @param {String} [detailsBackground="#ffffff"] The details text background color
 */
const AssetConfig = {
  // large node
  maxWidth: 350,
  maxHeight: 225,


  // small node
  minWidth: 150,
  minHeight: 80,


  // icon
  iconUrl: null,
  minIconOpacity: 0.5,
  minIconSize: 70,
  minIconTranslateX: 0,
  minIconTranslateY: 0,
  maxIconOpacity: 0.75,
  maxIconSize: 30,
  maxIconTranslateX: -140,
  maxIconTranslateY: -85,


  // node
  offset: 8,
  animationSpeed: 300,
  borderRadius: 5,
  borderStrokeWidth: 1,
  borderStrokeColor: "#84a8f2",
  borderStrokeDasharray: "5",
  backgroundColor: "#ffffff",


  // text
  minTextWidth: 145,
  minTextHeight: 75,
  minTextTranslateX: 0,
  minTextTranslateY: 0,
  maxTextWidth: 345,
  maxTextHeight: 220,
  maxTextTranslateX: 0,
  maxTextTranslateY: 0,
  labelColor: "#7fa5f5",
  labelFontFamily: "Montserrat",
  labelFontSize: 16,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#ffffff",
  detailsColor: "#7fa5f5",
  detailsFontFamily: "Montserrat",
  detailsFontSize: 12,
  detailsFontWeight: 600,
  detailsFontStyle: "normal",
  detailsBackground: "#ffffff",
}


/**
 * Class representing the visualization of assets
 * @param {Data} data the raw node data
 * @param {Canvas} canvas the canvas to render the node on
 * @param {AssetConfig} customAssetConfig custom config to override default values
 *
 * @example
 * const asset1 = NodeFactory.create(data.find(d => d.type === "asset"), canvas)
 * asset1.setInitialXY(200, 450)
 * asset1.renderAsMin()
 *
 * const asset2 = NodeFactory.create(data.find(d => d.type === "asset"), canvas)
 * asset2.setInitialXY(200, 150)
 * asset2.renderAsMax()
 *
 * setTimeout(() => asset1.transformToMax(200, 150), 500)
 * setTimeout(() => asset2.transformToMin(200, 450), 500)
 *
 */
class AssetNode extends BaseNode {
  constructor(data, canvas, customAssetConfig) {
    super(data, canvas)

    this.config = { ...AssetConfig, ...customAssetConfig }
  }

  /**
   * Creates the asset details description
   * @private
   */
  createAssetDetails() {
    const text = this.canvas.foreignObject(this.config.maxTextWidth, this.config.maxTextHeight)
    const background = document.createElement("div")
    text.add(background)

    background.style.width = `${this.config.maxTextWidth}px`
    background.style.height = `${this.config.maxTextHeight}px`
    background.style.display = "grid"
    background.style.gridTemplateColumns = "50% 50%"


    const labelBg = document.createElement("div")
    labelBg.style.gridColumn = "1 / 3"
    labelBg.style.display = "flex"
    labelBg.style.justifyContent = "center"
    background.appendChild(labelBg)

    const label = document.createElement("p")
    label.innerHTML = this.label
    label.style.textAlign = "center"

    label.style.background = this.config.labelBackground
    label.style.margin = `${this.config.offset * 2}px 0 ${this.config.offset}px`
    label.style.color = this.config.labelColor
    label.style.fontSize = `${this.config.labelFontSize + 4}px`
    label.style.fontFamily = this.config.labelFontFamily
    label.style.fontWeight = this.config.labelFontWeight
    label.style.fontStyle = this.config.labelFontStyle
    labelBg.appendChild(label)

    const descriptionBg = document.createElement("div")
    if (this.keyValuePairs.length === 0) {
      descriptionBg.style.gridRow = "2"
      descriptionBg.style.gridColumn = "1 / 3"
    }
    descriptionBg.style.overflow = "hidden"
    background.appendChild(descriptionBg)
    const description = document.createElement("p")
    description.style.background = this.config.detailsBackground
    description.style.padding = `${this.config.offset / 2}px 0 ${this.config.offset / 2}px ${this.config.offset}px`
    description.style.color = this.config.detailsColor
    description.style.fontSize = `${this.config.detailsFontSize}px`
    description.style.fontFamily = this.config.detailsFontFamily
    description.style.fontWeight = this.config.detailsFontWeight
    description.style.fontStyle = this.config.detailsFontStyle
    description.innerText = this.description
    descriptionBg.appendChild(description)
    const maxH = this.config.maxTextHeight - label.clientHeight - this.config.offset * 5
    clamp(description, { clamp: `${maxH}px` })
    descriptionBg.style.height = `${description.clientHeight - 2}px`

    const kvBg = document.createElement("div")
    kvBg.style.overflow = "hidden"
    background.appendChild(kvBg)
    let kvH = 0
    this.keyValuePairs.forEach((elem) => {
      const key = document.createElement("p")
      key.innerText = `• ${elem.key}`
      key.style.color = this.config.detailsColor
      key.style.fontSize = `${this.config.detailsFontSize + 1}px`
      key.style.fontFamily = this.config.detailsFontFamily
      key.style.fontWeight = this.config.detailsFontWeight
      key.style.fontStyle = this.config.detailsFontStyle
      kvBg.appendChild(key)

      const value = document.createElement("p")
      value.innerText = `${elem.value}`
      value.style.color = this.config.detailsColor
      value.style.fontSize = `${this.config.detailsFontSize}px`
      value.style.fontFamily = this.config.detailsFontFamily
      value.style.fontWeight = this.config.detailsFontWeight - 200
      value.style.fontStyle = this.config.detailsFontStyle
      value.style.marginBottom = `${this.config.offset / 2}px`
      value.style.marginLeft = `${this.config.offset}px`
      kvBg.appendChild(value)


      kvH += key.clientHeight + value.clientHeight
      if (kvH > maxH) {
        kvBg.removeChild(key)
        kvBg.removeChild(value)
      }
    })


    return text
  }


  /**
   * Renders an asset node in minimal version
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
   * Renders an asset node in maximal version
   * @param {Number} [X=initialX] the initial X render position
   * @param {Number} [Y=initialY] the initial Y render position
   */
  renderAsMax(X = this.initialX, Y = this.initialY) {
    // create svg elements
    const svg = this.createSVGElement()
    const node = this.createNode()
    const icon = this.createIcon()
    const text = this.createAssetDetails()

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
    const text = this.createAssetDetails()

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


export default AssetNode
