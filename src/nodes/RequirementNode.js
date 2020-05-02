import clamp from "clamp-js"
import BaseNode from "./BaseNode"
import RequirementNodeConfiguration from "../configuration/RequirementNodeConfiguration"


/**
 * This class is responsible for the visual representation of requirements.
 * @property {Data} data Loaded data from a database.
 * @property {Canvas} canvas The nested canvas to render the node on.
 * @property {Object} overrideRepresentation An optional object that contains information to override default representations.
 */
class RequirementNode extends BaseNode {
  constructor(data, canvas, overrideRepresentation = {}) {
    super(data, canvas)

    this.config = { ...RequirementNodeConfiguration, ...data.config, ...overrideRepresentation }


    // map color to respected state
    if (data.state !== null || data.state !== undefined) {
      const defaultState = { state: data.state, name: data.state, color: "#84a8f2" }
      const state = this.config.states.find((s) => s.state === data.state.toLowerCase()) || defaultState
      this.config = {
        ...this.config,
        borderStrokeColor: state.color,
        backgroundColor: state.color,
      }
    }
  }


  /**
   * Creates the requirements details description.
   *
   * @return {ForeignObject} A foreign object containing some html and the node's label.
   */
  createRequirementDetails() {
    const fobj = this.canvas.foreignObject(this.config.maxTextWidth, this.config.maxTextHeight)

    // add text background
    const background = document.createElement("div")
    background.style.display = "flex"
    background.style.flexDirection = "column"
    background.style.alignItems = "center"
    background.setAttribute("id", "label")
    fobj.add(background)

    // add label
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
    clamp(label, { clamp: this.config.maxLabelLineClamp })
    background.appendChild(label)

    // add status, if any exists
    const status = document.createElement("p")
    if (this.state !== null) {
      const res = this.config.states.find((s) => s.state.toLowerCase() === this.state.toLowerCase())
      if (res !== undefined) {
        status.innerHTML = res.name
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
    }

    // add description background
    const descriptionBg = document.createElement("div")
    background.appendChild(descriptionBg)

    // add description text
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

    return fobj
  }

  /**
   * Transforms the node to its final rendered position.
   * @param {Number} [X=finalX] The final X position.
   * @param {Number} [Y=finalY] The final Y position.
   */
  transformToFinalPosition(X = this.finalX, Y = this.finalY) {
    if (this.isRendered() === false) {
      return
    }

    this.currentX = X
    this.currentY = Y
    this.coords.push([this.currentX, this.currentY])

    if (this.getNodeSize() === "min") {
      this.svg.get(0).animate({ duration: this.config.animationSpeed }).center(X, Y)
      this.svg.get(1).animate({ duration: this.config.animationSpeed }).center(X, Y)
    } else {
      this.svg.get(0).animate({ duration: this.config.animationSpeed }).center(X, Y)
      this.svg.get(1).animate({ duration: this.config.animationSpeed }).center(X, Y)
    }
  }


  /**
  * Renders a requirement node in minimal representation.
  * @param  {Number} [IX=initialX] The initial X render position.
  * @param  {Number} [IY=initialY] The initial Y render position.
  * @param  {Number} [FX=finalX] The final X render position.
  * @param  {Number} [FY=finalY] The final Y render position.
  */
  renderAsMin(IX = this.initialX, IY = this.initialY, FX = this.finalX, FY = this.finalY) {
    // create svg elements
    const svg = this.createSVGElement()
    const node = this.createNode()
    const text = this.createLabel()

    svg.add(node)
    svg.add(text)


    // animate new elements into position
    node
      .center(IX, IY)
      .width(this.config.minWidth)
      .height(this.config.minHeight)
      .dmove(-this.config.minWidth / 2, -this.config.minHeight / 2)
      .animate({ duration: this.config.animationSpeed })
      .center(FX, FY)

    text
      .size(this.config.minTextWidth, text.children()[0].node.clientHeight)
      .center(IX, IY)
      .scale(0.001)
      .transform({ scale: 1, translate: [this.config.minTextTranslateX, this.config.minTextTranslateY] })
      .animate({ duration: this.config.animationSpeed })
      .center(FX, FY)


    this.currentWidth = this.config.minWidth
    this.currentHeight = this.config.minHeight
    this.nodeSize = "min"


    this.currentX = IX
    this.currentY = IY
    this.coords.push([this.finalX, this.finalY])


    this.svg = svg
  }


  /**
  * Renders a requirement node in detailed representation.
  * @param  {Number} [IX=initialX] The initial X render position.
  * @param  {Number} [IY=initialY] The initial Y render position.
  * @param  {Number} [FX=finalX] The final X render position.
  * @param  {Number} [FY=finalY] The final Y render position.
  */
  renderAsMax(IX = this.initialX, IY = this.initialY, FX = this.finalX, FY = this.finalY) {
    // create svg elements
    const svg = this.createSVGElement()
    const node = this.createNode()
    const text = this.createRequirementDetails()

    svg.add(node)
    svg.add(text)


    // animate new elements into position
    node
      .center(IX, IY)
      .width(this.config.maxWidth)
      .height(this.config.maxHeight)
      .dmove(-this.config.maxWidth / 2, -this.config.maxHeight / 2)
      .animate({ duration: this.config.animationSpeed })
      .center(FX, FY)

    text
      .center(IX, IY)
      .scale(0.001)
      .transform({ scale: 1, translate: [this.config.maxTextTranslateX, this.config.maxTextTranslateY] })
      .animate({ duration: this.config.animationSpeed })
      .center(FX, FY)


    this.currentWidth = this.config.maxWidth
    this.currentHeight = this.config.maxHeight
    this.nodeSize = "max"

    this.currentX = IX
    this.currentY = IY
    this.coords.push([this.finalX, this.finalY])


    this.svg = svg
  }


  /**
  * Transforms a node from minimal version to detailed representation.
  * @param {Number} [X=finalX] The final X render position.
  * @param {Number} [Y=finalY] The final Y render position.
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

    // old text position
    const tx = this.svg.get(2).bbox().cx
    const ty = this.svg.get(2).bbox().cy

    this
      .svg
      .get(1)
      .remove()


    // create new elements
    const text = this.createRequirementDetails()

    this.svg.add(text)


    // put new elements into position
    text
      .attr({ opacity: 0 })
      .center(tx, ty)
      .scale(0.001)
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: 1 })
      .transform({ scale: 1, translate: [this.config.maxTextTranslateX, this.config.maxTextTranslateY] })


    this.currentWidth = this.config.maxWidth
    this.currentHeight = this.config.maxHeight
    this.nodeSize = "max"
    this.currentX = X
    this.currentY = Y
  }


  /**
  * Transforms a node from detailed representation to minimal version.
  * @param {Number} [X=finalX] The final X render position.
  * @param {Number} [Y=finalY] The final Y render position.
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

    // old text position
    const tx = this.svg.get(1).bbox().cx
    const ty = this.svg.get(1).bbox().cy

    this
      .svg
      .get(1)
      .remove()


    // create new elements
    const text = this.createLabel()

    this.svg.add(text)


    // put new elements into position
    text
      .attr({ opacity: 0 })
      .center(tx, ty)
      .scale(0.001)
      .size(this.config.minTextWidth, text.children()[0].node.clientHeight)
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
