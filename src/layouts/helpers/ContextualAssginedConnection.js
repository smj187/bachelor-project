
/**
 * This class calculates and constructs a visible connection between the focus node and the assigned node.
 *
 * @category Layouts
 * @subcategory Helpers
 * @property {Canvas} canvas The current canvas to render the element on.
 * @property {BaseNode} focusNode The currently active focus node.
 * @property {BaseNode} assignedNode The currently active assigned node.
 * @property {ContextualLayoutConfiguration} config An object containing visual restrictions.
 */
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


  /**
   * Calculates and renders the connection.
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.isParentOperation=false] An indication whether a parent or child node was elected new focus.
   */
  render({ isParentOperation = false }) {
    const svg = this.canvas.group()
    svg.id(`contextualAssginedConnection#${this.focusNode.id}_${this.assignedNode.id}`)

    const {
      riskConnectionOffset, riskConnectionLineWidth, riskConnectionarrowHeight, riskConnectionArrowWidth,
    } = this.config


    const fw = this.focusNode.getMaxWidth()
    const aw = this.assignedNode.getMinWidth()

    // calculate points forming the connection
    const x0 = this.focusNode.getFinalX() + fw / 2 + riskConnectionOffset
    const y0 = this.focusNode.getFinalY() + riskConnectionLineWidth / 2

    const x1 = this.assignedNode.getFinalX() - aw / 2 - riskConnectionOffset - riskConnectionarrowHeight
    const y1 = y0

    const x2 = x1
    const y2 = this.assignedNode.getFinalY() + (riskConnectionArrowWidth - (riskConnectionLineWidth) / 2)

    const x3 = this.assignedNode.getFinalX() - aw / 2 - riskConnectionOffset
    const y3 = this.assignedNode.getFinalY()

    const x4 = x1
    const y4 = this.assignedNode.getFinalY() - (riskConnectionArrowWidth - (riskConnectionLineWidth) / 2)

    const x5 = x1
    const y5 = this.assignedNode.getFinalY() - riskConnectionLineWidth / 2

    const x6 = x0
    const y6 = this.focusNode.getFinalY() - riskConnectionLineWidth / 2

    const cx = (x6 + x3) / 2
    const cy = y3


    // the actual connection as path argument
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


    // create the SVG connection
    const path = this.canvas.path(plot).stroke({
      color: this.config.riskConnectionStrokeColor,
      width: this.config.riskConnectionStrokeWidth,
      dasharray: this.config.riskConnectionStrokeDasharray,
    })
    path.fill(this.config.riskConnectionColor)
    svg.add(path)


    // create a foreign object which holds the "attached risks" label
    const fobj = this.canvas.foreignObject(1, this.config.riskConnectionLabelFontSize + riskConnectionOffset)


    // create the label background
    const background = document.createElement("div")
    background.style.background = this.config.riskConnectionLabelBackground
    background.style.padding = `${riskConnectionOffset / 2}px`
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
    label.style.width = "max-content"
    label.style.wordWrap = "break-word"


    // add the label to the background element
    background.appendChild(label)


    // add the HTML to the SVG
    fobj.add(background)


    // disable the user-select css property
    fobj.css("user-select", "none")


    // set the labels with
    const labelWidth = label.clientWidth + this.config.riskConnectionLabelFontSize
    label.innerText = this.config.riskConnectionLabelText.replace(/_/g, " ")
    fobj.width(labelWidth)


    // move the label into initial position
    fobj.center(cx, cy - 25 / 1.05 - riskConnectionLineWidth / 2)


    // add fobj to svg
    svg.add(fobj)
    svg.back()


    // put svg into position
    // move to initial position (- -> bottom; + -> top)
    const dy1 = isParentOperation ? -50 : 50
    const dy2 = isParentOperation ? 50 : -50
    svg.get(0).dy(dy1).animate({ duration: this.config.animationSpeed }).dy(dy2)


    // set the final position
    if (isParentOperation) {
      this.finalX = cx
      this.finalY = cy - 25 / 1.5 - riskConnectionLineWidth / 2 - 50
    } else {
      this.finalX = cx
      this.finalY = cy - 25 / 1.5 - riskConnectionLineWidth / 2 + 50
    }

    // move to label into final position
    const translateX = this.config.riskConnectionLabelTranslateX
    const translateY = this.config.riskConnectionLabelTranslateY
    if (isParentOperation === true) {
      console.log("TODO:")
      svg
        .get(1)
        .center(cx, cy - 25 - riskConnectionLineWidth / 2)
        .animate({ duration: this.config.animationSpeed })
        .center(cx + translateX, cy - 25 / 1.5 - riskConnectionLineWidth / 2 + translateY)
    } else {
      svg
        .get(1)
        .center(cx, cy + 25 - riskConnectionLineWidth / 2)
        .animate({ duration: this.config.animationSpeed })
        .center(cx + translateX, cy - 25 / 1.5 - riskConnectionLineWidth / 2 + translateY)
    }


    this.svg = svg
  }


  /**
   * Transforms the assigned connection into its final position.
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.isParentOperation=false] An indication whether a parent or child node was elected new focus.
   * @param {Number} [opts.X=this.finalX] The calculated final X position.
   * @param {Number} [opts.X=this.finalY] The calculated final X position.
   */
  transformToFinalPosition({ isParentOperation = false, X = this.finalX, Y = this.finalY }) {
    if (isParentOperation) {
      // come from top
      this.svg
        .animate({ duration: this.config.animationSpeed })
        .center(X, Y - 50)
    } else {
      // come from bottom
      this.svg
        .animate({ duration: this.config.animationSpeed })
        .center(X, Y + 50)
    }
  }


  /**
   * Removes the connection.
   */
  removeSVG() {
    if (this.isRendered()) {
      this.svg.remove()
      this.svg = null
    }
  }


  /**
   * Determins if the SVG object is rendered.
   * @returns True, if the SVG is rendered, else false.
   */
  isRendered() {
    return this.svg !== null
  }

  setLayoutId(layoutId) {
    this.layoutId = layoutId
  }

  getFinalX() {
    return this.finalX
  }

  getFinalY() {
    return this.finalY
  }
}

export default ContextualAssginedConnection
