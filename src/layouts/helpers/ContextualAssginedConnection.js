
class ContextualAssginedConnection {
  constructor(canvas, focusNode, assignedNode, config) {
    this.canvas = canvas
    this.focusNode = focusNode
    this.assignedNode = assignedNode
    this.config = config

    // layout info
    this.layoutId = 0
    this.finalX = 0
    this.finalY = 0
  }

  render({ isParentOperation = false }) {
    const svg = this.canvas.group()
    svg.id(`contextualAssginedConnection#${this.focusNode.id}_${this.assignedNode.id}`)


    // calculate the connection
    const fw = this.focusNode.getMaxWidth()
    const aw = this.assignedNode.getMinWidth()

    const x0 = this.focusNode.getFinalX() + fw / 2 + this.config.riskConnectionOffset
    const y0 = this.focusNode.getFinalY() + this.config.riskConnectionLineWidth / 2

    const x1 = this.assignedNode.getFinalX() - aw / 2 - this.config.riskConnectionOffset - this.config.riskConnectionarrowHeight
    const y1 = y0

    const x2 = x1
    const y2 = this.assignedNode.getFinalY() + (this.config.riskConnectionArrowWidth - (this.config.riskConnectionLineWidth) / 2)

    const x3 = this.assignedNode.getFinalX() - aw / 2 - this.config.riskConnectionOffset
    const y3 = this.assignedNode.getFinalY()

    const x4 = x1
    const y4 = this.assignedNode.getFinalY() - (this.config.riskConnectionArrowWidth - (this.config.riskConnectionLineWidth) / 2)

    const x5 = x1
    const y5 = this.assignedNode.getFinalY() - this.config.riskConnectionLineWidth / 2

    const x6 = x0
    const y6 = this.focusNode.getFinalY() - this.config.riskConnectionLineWidth / 2

    const cx = (x6 + x3) / 2
    const cy = y3


    const plot = `
      M ${x0},${y0}
      L ${x1},${y1}
      L ${x2},${y2}
      L ${x3},${y3}
      L ${x4},${y4}
      L ${x5},${y5}
      L ${x6},${y6}
      L ${x0},${y0}
    `


    // draw the arrow
    const path = this.canvas.path(plot).stroke({
      color: this.config.riskConnectionStrokeColor,
      width: this.config.riskConnectionStrokeWidth,
      dasharray: this.config.riskConnectionStrokeDasharray,
    })
    path.fill(this.config.riskConnectionColor)

    svg.add(path)


    // create the foreign object which holds
    const fobj = this.canvas.foreignObject(1, this.config.riskConnectionLabelFontSize + this.config.riskConnectionOffset)


    // create the label background
    const background = document.createElement("div")
    background.style.background = this.config.riskConnectionLabelBackground
    background.style.padding = `${this.config.riskConnectionOffset / 2}px`
    background.style.textAlign = "center"
    background.style.width = "fit-content"
    background.style.wordWrap = "break-word"
    background.setAttribute("id", "label")


    // create the actual label text
    const label = document.createElement("p")
    label.innerText = this.config.riskConnectionLabelText
    label.style.color = this.config.riskConnectionLabelColor
    label.style.fontSize = `${this.config.riskConnectionLabelFontSize}px`
    label.style.fontFamily = this.config.riskConnectionLabelFontFamily
    label.style.fontWeight = this.config.riskConnectionLabelFontWeight
    label.style.fontStyle = this.config.riskConnectionLabelFontStyle

    background.appendChild(label)

    fobj.add(background)

    // disable the user-select css property
    fobj.css("user-select", "none")
    const labelWidth = label.clientWidth + this.config.riskConnectionLabelFontSize
    label.innerText = this.config.riskConnectionLabelText.replace(/_/g, " ")
    fobj.width(labelWidth)
    fobj.center(cx, cy - 25 / 1.05 - this.config.riskConnectionLineWidth / 2)

    svg.add(fobj)
    svg.back()

    // center connection
    svg
      .get(0)
      .dy(isParentOperation ? -50 : 50)
      .animate({ duration: this.config.animationSpeed })
      .dy(isParentOperation ? 50 : -50)

    let y = cy - 25 / 1.5 - this.config.riskConnectionLineWidth / 2
    this.finalX = cx
    if (isParentOperation) {
      y -= 50
      this.finalY = y
    } else {
      y += 50
      this.finalY = y
    }
    svg
      .get(1)
      .center(cx, y)
      .animate({ duration: this.config.animationSpeed })
      .center(cx, cy - 25 / 1.5 - this.config.riskConnectionLineWidth / 2)


    this.svg = svg
  }

  transformToFinalPosition({ isParentOperation = false, X = this.finalX, Y = this.finalY }) {
    if (isParentOperation) {
      this.svg
        .animate({ duration: this.config.animationSpeed })
        .center(X, Y - 50)
    } else {
      this.svg
        .animate({ duration: this.config.animationSpeed })
        .center(X, Y + 50)
    }
  }


  /**
   * Removes the leaf node from the canvas and resets clears its SVG representation.
   */
  removeSVG() {
    if (this.isRendered()) {
      this.svg.remove()
      this.svg = null
    }
  }


  isRendered() {
    return this.svg !== null
  }

  setLayoutId(layoutId) {
    this.layoutId = layoutId
  }
}

export default ContextualAssginedConnection
