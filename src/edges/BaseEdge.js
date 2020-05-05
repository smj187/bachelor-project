
import clamp from "clamp-js"
import { calculateNodeLineIntersection } from "../utils/Calculations"

/**
 * This is the base class for edges.
 *
 * @property {Data} data The loaded data element from a database.
 * @property {Canvas} canvas The nested canvas to render the edge on.
 * @property {BaseNode} fromNode The starting node reference.
 * @property {BaseNode} toNode The ending node reference.
 */
class BaseEdge {
  constructor(data, canvas, fromNode, toNode) {
    this.svg = null
    this.data = data
    this.canvas = canvas
    this.fromNode = fromNode
    this.toNode = toNode
    this.label = null
    this.config = { ...data.config }


    // node position
    this.initialX = 0
    this.initialY = 0
    this.finalToX = 0
    this.finalToY = 0
    this.finalFromX = 0
    this.finalFromY = 0


    this.opacity = 1
    this.isHidden = false
    this.layoutId = null
  }


  /**
   * Calculates the two points indicating the starting and end point for edges.
   * 
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.isContextualParent=false] Determines if the current edge is a contextual parent edge.
   * @param {Number} [opts.isContextualChild=false] Determines if the current edge is a contextual child edge
   */
  calculateEdge({ isContextualParent = false, isContextualChild = false }) {
    let fx = this.fromNode.getFinalX()
    const fy = this.fromNode.getFinalY()


    let tx = this.toNode.getFinalX()
    const ty = this.toNode.getFinalY()

    if (isContextualParent) {
      fx = tx
    }

    if (isContextualChild) {
      tx = fx
    }


    const fromIntersection = calculateNodeLineIntersection(fx, fy, tx, ty, this.fromNode)
    this.finalFromX = fromIntersection.x
    this.finalFromY = fromIntersection.y


    const toIntersection = calculateNodeLineIntersection(tx, ty, fx, fy, this.toNode)
    this.finalToX = toIntersection.x
    this.finalToY = toIntersection.y
  }


  removeEdge(X = 0, Y = 0) { // TODO: remove
    if (this.svg !== null) {
      this
        .svg
        .attr({ opacity: 1 })
        .animate({ duration: this.config.animationSpeed })
        .transform({ scale: 0.001, position: [X, Y] })
        .attr({ opacity: 0 })
        .after(() => {
          if (this.svg !== null) {
            this.svg.remove()
            this.svg = null
          }
        })
    }
  }


  /**
   * Removes the rendered SVG object from the canvas.
   */
  removeSVG() {
    if (this.isRendered() === false) return

    const x = (this.finalFromX + this.finalToX) / 2
    const y = (this.finalFromY + this.finalToY) / 2
    this.svg.back()
    this.svg
      .animate({ duration: this.config.animationSpeed })
      .transform({ scale: 0.001, position: [x, y + 100] })
      .after(() => {
        try { this.svg.remove() } catch (error) { }
        this.svg = null
      })
  }


  /**
   * Determins where the edge is rendered or not.
   * @returns True, if the SVG is rendered, else false.
   */
  isRendered() {
    return this.svg !== null
  }


  /**
   * Creates a label responsible for holding the edge description.
   */
  createLabel() {
    const fobj = this.canvas.foreignObject(0, 0)

    const background = document.createElement("div")
    background.style.background = this.config.labelBackground
    background.style.padding = `${this.config.offset / 2}px`
    background.style.textAlign = "center"
    background.style.width = `${this.config.labelWidth}px`
    background.style.wordWrap = "break-word"
    background.setAttribute("id", "label")

    const label = document.createElement("p")
    label.innerText = this.label
    label.style.color = this.config.labelColor
    label.style.fontSize = `${this.config.labelFontSize}px`
    label.style.fontFamily = this.config.labelFontFamily
    label.style.fontWeight = this.config.labelFontWeight
    label.style.fontStyle = this.config.labelFontStyle
    clamp(label, { clamp: this.config.labelLineClamp })

    background.appendChild(label)
    fobj.add(background)

    fobj.css("user-select", "none")
    fobj.width(background.clientWidth)
    fobj.height(background.clientHeight)
    fobj.center(this.finalFromX, this.finalFromY)

    return fobj
  }


  /**
   * Updates the new label.
   * @param {String} label The new label.
   */
  setLabel(label) {
    this.label = label || null
  }


  setFinalToX(finalToX) {
    this.finalToX = finalToX
  }

  setFinalToY(finalToY) {
    this.finalToY = finalToY
  }

  getFinalToX() {
    return this.finalToX
  }

  getFinalToY() {
    return this.finalToY
  }

  setFinalFromX(finalFromX) {
    this.finalFromX = finalFromX
  }

  setFinalFromY(finalFromY) {
    this.finalFromY = finalFromY
  }

  getFinalFromX() {
    return this.finalFromX
  }

  getFinalFromY() {
    return this.finalFromY
  }

  setLayoutId(layoutId) {
    this.layoutId = layoutId
  }

  getLayoutId() {
    return this.layoutId
  }

  getToNode() {
    return this.toNode
  }

  getFromNode() {
    return this.fromNode
  }
}

export default BaseEdge
