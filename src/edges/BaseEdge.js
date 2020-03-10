import { intersect, shape } from "svg-intersections"
import clamp from "clamp-js"


/**
 * Base class for all edge representations
 * @param {Canvas} canvas the svg canvas element to render the node on
 * @param {BaseNode} fromNode The from node
 * @param {BaseNode} toNode The to node
 */
class BaseEdge {
  constructor(canvas, fromNode, toNode) {
    this.svg = null
    this.canvas = canvas
    this.fromNode = fromNode
    this.toNode = toNode
    this.label = null


    // node position
    this.initialX = 0
    this.initialY = 0


    this.finalToX = 0
    this.finalToY = 0
    this.finalFromX = 0
    this.finalFromY = 0


    this.opacity = 1
    this.isHidden = false
  }


  /**
   * Calculates two end points to create an edge
   * @private
   */
  calculate() {
    const line = shape("line", {
      x1: this.fromNode.currentX,
      y1: this.fromNode.currentY,
      x2: this.toNode.currentX,
      y2: this.toNode.currentY,
    })

    const borderWidthTo = this.toNode.config.borderStrokeWidth
    const widthTo = this.toNode.currentWidth + borderWidthTo + this.config.offset
    const heightTo = this.toNode.currentHeight + borderWidthTo + this.config.offset
    const rectTo = shape("rect", {
      x: this.toNode.currentX - widthTo / 2 - borderWidthTo / 2 - this.config.offset / 2,
      y: this.toNode.currentY - heightTo / 2 - borderWidthTo / 2 - this.config.offset / 2,
      width: widthTo + borderWidthTo + this.config.offset,
      height: heightTo + borderWidthTo + this.config.offset,
      rx: this.toNode.config.borderRadius,
      ry: this.toNode.config.borderRadius,
    })

    const borderWidthFrom = this.fromNode.config.borderStrokeWidth

    const widthFrom = this.fromNode.currentWidth + borderWidthFrom + this.config.offset
    const heightFrom = this.fromNode.currentHeight + borderWidthFrom + this.config.offset
    const rectFrom = shape("rect", {
      x: this.fromNode.currentX - widthFrom / 2 - borderWidthFrom / 2 - this.config.offset / 2,
      y: this.fromNode.currentY - heightFrom / 2 - borderWidthFrom / 2 - this.config.offset / 2,
      width: widthFrom + borderWidthFrom + this.config.offset,
      height: heightFrom + borderWidthFrom + this.config.offset,
      rx: this.fromNode.config.borderRadius,
      ry: this.fromNode.config.borderRadius,
    })


    const { points: toPoints } = intersect(rectTo, line)
    const { points: fromPoints } = intersect(rectFrom, line)
    this.finalToX = toPoints[0].x
    this.finalToY = toPoints[0].y
    this.finalFromX = fromPoints[0].x
    this.finalFromY = fromPoints[0].y


    // this.canvas.circle(5).fill("#f75").center(this.finalToX, this.finalToY)
    // this.canvas.circle(5).fill("#0f0").center(this.finalFromX, this.finalFromY)
  }


  /**
   * Creates the edge label
   * @private
   */
  createLabel() {
    const fobj = this.canvas.foreignObject(0, 0)

    const background = document.createElement("div")
    background.style.background = this.config.labelBackground
    background.style.padding = `${this.config.offset / 2}px`
    background.style.textAlign = "center"
    background.style.width = "fit-content" // uncomment this for more than one word

    const label = document.createElement("p")
    label.innerText = this.label
    label.style.color = this.config.labelColor
    label.style.fontSize = `${this.config.labelFontSize}px`
    label.style.fontFamily = this.config.labelFontFamily
    label.style.fontWeight = this.config.labelFontWeight
    label.style.fontStyle = this.config.labelFontStyle
    clamp(label, { clamp: 2 })

    background.appendChild(label)
    fobj.add(background)

    fobj.width(background.clientWidth)
    fobj.height(background.clientHeight)
    fobj.center(this.finalFromX, this.finalFromY)

    return fobj
  }


  setLabel(label) {
    this.label = label
  }
}

export default BaseEdge
