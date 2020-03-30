import GridExpanderConfig from "../../configuration/GridExpanderConfiguration"


/**
 * Class representing the option to collapse or expand the grid layout
 *
 * @param {Canvas} canvas The canvas to render this expander on
 * @private
 */
class GridExpander {
  constructor(canvas) {
    this.svg = null
    this.canvas = canvas
    this.config = { ...GridExpanderConfig }

    // position for hide representation
    this.expandedX = 0
    this.expandedY = 0

    // position for show representation
    this.collapsedX = 0
    this.collapsedY = 0

    // current state
    this.isExpanded = false

    // the re-render function reference
    this.reRenderFunc = null
  }


  renderAsMin() {
    this.render()
  }

  renderAsMax() {
    this.render()
  }


  /**
   * Sets the final X position
   * @param {Number} finalX the final X position
   */
  setFinalX(finalX) {
    this.finalX = finalX
  }

  getFinalY() {
    return this.finalY
  }


  /**
   * Sets the final Y position
   * @param {Number} finalY the final Y position
   */
  setFinalY(finalY) {
    this.finalY = finalY
  }


  /**
   * Renders the grid expander
   *
   * @param {Number} X The X position for collapsed representation
   * @param {Number} Y The Y position for collapsed representation
   * @private
   */
  render(X = this.finalX + this.config.width / 2, Y = this.finalY) {
    const svg = this.canvas.group().draggable()
    svg.css("cursor", "pointer")
    svg.id("gridExpander")

    const w = this.config.width
    const h = this.config.height

    const createText = (innerText) => {
      const fobj = this.canvas.foreignObject(w, h)

      const background = document.createElement("div")
      background.style.background = this.config.labelBackground
      background.style.padding = `${this.config.offset / 2}px`
      background.style.textAlign = "center"
      background.style.width = `${this.config.minTextWidth}px`

      const label = document.createElement("div")
      label.innerText = innerText
      label.style.color = this.config.labelColor
      label.style.fontSize = `${this.config.labelFontSize}px`
      label.style.fontFamily = this.config.labelFontFamily
      label.style.fontWeight = this.config.labelFontWeight
      label.style.fontStyle = this.config.labelFontStyle

      background.appendChild(label)
      fobj.add(background)
      fobj.css("user-select", "none")
      fobj.height(background.clientHeight)

      return fobj
    }

    // create new elements
    const showMore = createText(this.config.expandText)
    const showLess = createText(this.config.collapseText)

    svg.add(showMore)
    svg.add(showLess)


    // animate new elements into position
    svg
      .center(X, Y)

    showMore
      .scale(0.001)
      .center(X, Y)
      .animate({ duration: this.config.animationSpeed })
      .transform({ scale: 1, position: [X, Y] })

    showLess
      .attr({ opacity: 0 })
      .scale(0.001)
      .center(X, Y)
      .animate({ duration: this.config.animationSpeed })
      .transform({ scale: 1, position: [X, Y] })


    // add tooltip
    svg.on("mouseover", (ev) => {
      const tooltip = document.getElementById("tooltip")
      tooltip.innerHTML = this.isExpanded ? "Collapse layout" : "Expand layout"
      tooltip.style.display = "block"

      tooltip.style.left = `${ev.clientX - tooltip.clientWidth / 2}px`
      tooltip.style.top = `${ev.clientY - tooltip.clientHeight - 20}px`

      showLess
        .transform({ scale: 1.05, position: [X, Y] })
    })

    // remove tooltip
    svg.on("mouseout", () => {
      const tooltip = document.getElementById("tooltip")
      tooltip.style.display = "none"

      showLess
        .transform({ scale: 0.95, position: [X, Y] })
    })


    if (this.reRenderFunc) {
      svg.on("click", this.reRenderFunc)
      // svg.on("dblclick", this.reRenderFunc)
    }

    this.isExpanded = false
    this.svg = svg
  }

  changeToShowMoreText() {
    this
      .svg
      .get(0)
      .attr({ opacity: 0 })

    this
      .svg
      .get(1)
      .attr({ opacity: 1 })


    this.isExpanded = true
  }

  changeToHideMoreText() {
    this
      .svg
      .get(0)
      .attr({ opacity: 1 })

    this
      .svg
      .get(1)
      .attr({ opacity: 0 })


    this.isExpanded = false
  }


  transformToFinalPosition() {
    this
      .svg
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .transform({ position: [this.finalX + this.config.width / 2, this.finalY] })
      .attr({ opacity: 1 })
  }


  /**
   * Function to determine if the expander is already rendered
   */
  isRendered() {
    return this.svg !== null
  }


  /**
   * Function to assign the grid re-render function to this expander
   * @param {Function} reRenderFunc The re-render function
   */
  setReRenderFunc(reRenderFunc) {
    this.reRenderFunc = reRenderFunc
  }


  removeNode() {
    this.svg.remove()
    this.svg = null
  }

  getIsExpanded() {
    return this.isExpanded
  }

  setExpandedX(expandedX) {
    this.expandedX = expandedX
  }

  setExpandedY(expandedY) {
    this.expandedY = expandedY
  }

  setCollapsedX(collapsedX) {
    this.collapsedX = collapsedX
  }

  setCollapsedY(collapsedY) {
    this.collapsedY = collapsedY
  }

  getCollapsedX() {
    return this.collapsedX
  }

  getCollapsedY() {
    return this.collapsedY
  }

  getMinWidth() {
    return this.config.width
  }

  getMaxWidth() {
    return this.config.width
  }

  getMinHeight() {
    return this.config.height
  }

  getMaxHeight() {
    return this.config.height
  }
}


export default GridExpander
