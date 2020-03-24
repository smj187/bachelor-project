
const GridExpanderConfig = {
  // large representation (for calculations)
  maxWidth: 130,
  maxHeight: 40,


  // small representation (for calculations)
  minWidth: 130,
  minHeight: 40,


  // actual text size
  width: 130,
  height: 40,


  // node
  offset: 8,
  animationSpeed: 300,
  borderRadius: 5,
  borderStrokeWidth: 0,
  borderStrokeColor: "#aaa",
  borderStrokeDasharray: "0",
  backgroundColor: "#ffffff",


  // text
  labelColor: "#84a8f2",
  labelFontFamily: "Montserrat",
  labelFontSize: 12,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#fff",
}

class GridExpander {
  constructor(canvas, renderingSize) {
    this.svg = null
    this.canvas = canvas
    this.config = { ...GridExpanderConfig, renderingSize }
    this.isShowLess = false

    this.expandX = 0
    this.expandY = 0

    this.collapseX = 0
    this.collapseY = 0

    this.prevNode = null
  }

  setPrevNode(prevNode) {
    this.prevNode = prevNode
  }

  isRendered() {
    return this.svg !== null
  }


  renderExpander(innerText, funcExp, funcLess) {
    const svg = this.canvas.group()
    svg.css("cursor", "pointer")
    svg.id("gridExpander")
    const X = this.expandX
    const Y = this.expandY

    this.innerText = innerText
    this.funcExp = funcExp
    this.funcLess = funcLess


    const w = this.config.width
    const h = this.config.height


    const textMore = this.canvas.foreignObject(w, h)
    const background = document.createElement("div")
    const label = document.createElement("p")
    label.innerText = `${innerText}`
    label.style.color = this.config.labelColor
    label.style.textAlign = "center"
    label.style.padding = `${this.config.offset / 2}px`
    label.style.background = this.config.labelBackground
    label.style.fontSize = `${this.config.labelFontSize}px`
    label.style.fontFamily = this.config.labelFontFamily
    label.style.fontWeight = this.config.labelFontWeight
    label.style.fontStyle = this.config.labelFontStyle
    background.appendChild(label)
    textMore.add(background)
    textMore.height(background.clientHeight)


    const textLess = this.canvas.foreignObject(w, h)
    const backgroundLess = document.createElement("div")
    const labelLess = document.createElement("p")
    labelLess.innerText = "Show Less"
    labelLess.style.color = this.config.labelColor
    labelLess.style.textAlign = "center"
    labelLess.style.padding = `${this.config.offset / 2}px`
    labelLess.style.background = this.config.labelBackground
    labelLess.style.fontSize = `${this.config.labelFontSize}px`
    labelLess.style.fontFamily = this.config.labelFontFamily
    labelLess.style.fontWeight = this.config.labelFontWeight
    labelLess.style.fontStyle = this.config.labelFontStyle
    backgroundLess.appendChild(labelLess)
    textLess.add(backgroundLess)
    textLess.height(backgroundLess.clientHeight)


    svg.add(textMore)
    svg.add(textLess)


    svg
      .center(X, Y)


    textLess
      .center(X, Y)
      .scale(0.001)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: 0 })
      .transform({ scale: 1 })

    textMore
      .center(X, Y)
      .scale(0.001)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: 1 })
      .transform({ scale: 1 })

    svg.on("click", this.funcExp)

    this.svg = svg

    this.isExpanded = false
  }

  transform() {
    if (this.isExpanded) {
      // console.log("to col")
      this.isExpanded = false

      this.svg.on("click", this.funcExp)
      this.svg.off("click", this.funcLess)

      this.svg.get(0).attr({ opacity: 1 })
      this.svg.get(1).attr({ opacity: 0 })
      this
        .svg
        .animate({ duration: this.config.animationSpeed })
        .transform({ position: [this.expandX, this.expandY] })
    } else {
      // console.log("to exp")
      this.isExpanded = true
      this.svg.off("click", this.funcExp)
      this.svg.on("click", this.funcLess)

      this.svg.get(0).attr({ opacity: 0 })
      this.svg.get(1).attr({ opacity: 1 })


      this
        .svg
        .animate({ duration: this.config.animationSpeed })
        .transform({ position: [this.collapseX, this.collapseY] })
    }
  }

  removeNode() {
    if (this.svg !== null) {
      this
        .svg
        .animate({ duration: this.config.animationSpeed })
        .transform({ scale: 0.001 })
        .after(() => {
          this.svg.remove()
          this.svg = null
        })
    }
  }

  addEvent(func) {
    this.svg.on("click", func)
  }

  setFinalX(finalX) {
    this.finalX = finalX
  }

  setFinalY(finalY) {
    this.finalY = finalY
  }

  getFinalX() {
    return this.finalX
  }

  getFinalY() {
    return this.finalY
  }
}


export default GridExpander
