
const GridExpanderConfiguration = {
  animationSpeed: 300,

  expanderWidth: 105,
  expanderHeight: 40,
  expanderTextColor: "#222",
  expanderPadding: 8,
  expanderFontFamily: "Montserrat",
  expanderFontSize: 12,
  expanderFontWeight: 700,
  expanderFontStyle: "normal",
  expanderBackground: "#fff",
}

/**
 * Class representing the option to collapse or expand the grid layout
 *
 * @param {Canvas} canvas The canvas to render this expander on
 * @private
 */
class GridExpander {
  constructor(canvas, type) {
    this.svg = null
    this.type = type
    this.canvas = canvas
    this.config = { ...GridExpanderConfiguration }

    // the re-render function reference
    this.reRenderFunc = null
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
  }


  render(X = this.finalX + this.config.expanderWidth / 2, Y = this.finalY) {
    const svg = this.canvas.group()
    svg.css("cursor", "pointer")
    svg.id("gridExpander")


    const w = this.config.expanderWidth
    const h = this.config.expanderHeight

    const createText = (innerText) => {
      const fobj = this.canvas.foreignObject(w, h)

      const background = document.createElement("div")
      background.style.background = this.config.expanderBackground
      background.style.padding = `${this.config.expanderPadding / 2}px`
      background.style.textAlign = "left"

      const label = document.createElement("div")
      label.innerText = innerText
      label.style.color = this.config.expanderTextColor
      label.style.fontSize = `${this.config.expanderFontSize}px`
      label.style.fontFamily = this.config.expanderFontFamily
      label.style.fontWeight = this.config.expanderFontWeight
      label.style.fontStyle = this.config.expanderFontStyle

      background.appendChild(label)
      fobj.add(background)
      fobj.css("user-select", "none")
      fobj.height(background.clientHeight)

      return fobj
    }

    // create new elements
    const showMore = createText("Load more data")
    const showLess = createText("Show less data")

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
      // const tooltip = document.getElementById("tooltip")
      // tooltip.innerHTML = this.isExpanded ? "Collapse layout" : "Expand layout"
      // tooltip.style.display = "block"

      // tooltip.style.left = `${ev.clientX - tooltip.clientWidth / 2}px`
      // tooltip.style.top = `${ev.clientY - tooltip.clientHeight - 20}px`

      showLess.transform({ scale: 1.05, position: [X, Y] })
      showMore.transform({ scale: 1.05, position: [X, Y] })
    })

    // remove tooltip
    svg.on("mouseout", () => {
      // const tooltip = document.getElementById("tooltip")
      // tooltip.style.display = "none"

      showLess.transform({ scale: 0.95, position: [X, Y] })
      showMore.transform({ scale: 0.95, position: [X, Y] })
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
      .attr({ opacity: 1 })
      .animate({ duration: this.config.animationSpeed })
      .transform({ position: [this.finalX + this.config.expanderWidth / 2, this.finalY] })
      .attr({ opacity: 1 })
  }


  isRendered() {
    return this.svg !== null
  }


  setReRenderFunc(reRenderFunc) {
    this.reRenderFunc = reRenderFunc
  }


  removeNode() {
    if (this.svg !== null) {
      this.svg.remove()
      this.svg = null
    }
  }

  getIsExpanded() {
    return this.isExpanded
  }

  getFinalX() {
    return this.finalX
  }

  setFinalX(finalX) {
    this.finalX = finalX
  }

  getFinalY() {
    return this.finalY
  }

  setFinalY(finalY) {
    this.finalY = finalY
  }
}


export default GridExpander
