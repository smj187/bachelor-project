import { intersect, shape } from "svg-intersections"
import clamp from "clamp-js"


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
  }



  /**
   * Calculates the two points indicating the starting and end point for edges.
   * @param {Object} opts Additional configuration required for calculating certain edges.
   */
  calculateEdge(opts = { isContextualParent: false, isContextualChild: false }) {
    let fx = this.fromNode.getFinalX()
    let fy = this.fromNode.getFinalY()

    let tx = this.toNode.getFinalX()
    let ty = this.toNode.getFinalY()

    if (opts.isContextualParent) {
      fx = tx
    }

    if (opts.isContextualChild) {
      tx = fx
    }


    const line = shape("line", {
      x1: fx,
      y1: fy,
      x2: tx,
      y2: ty,
    })


    // from intersection point calculation
    const w2 = this.fromNode.getNodeSize() === "min" ? this.fromNode.config.minWidth : this.fromNode.config.maxWidth
    const h2 = this.fromNode.getNodeSize() === "min" ? this.fromNode.config.minHeight : this.fromNode.config.maxHeight
    const rect2 = shape("rect", {
      x: fx - w2 / 2 - this.fromNode.config.borderStrokeWidth / 2 - this.config.offset / 2,
      y: fy - h2 / 2 - this.fromNode.config.borderStrokeWidth / 2 - this.config.offset / 2,
      width: w2 + this.fromNode.config.borderStrokeWidth + this.config.offset,
      height: h2 + this.fromNode.config.borderStrokeWidth + this.config.offset,
      rx: this.fromNode.config.borderRadius,
      ry: this.fromNode.config.borderRadius,
    })

    const fromPoints = intersect(rect2, line)
    // console.log(fromPoints)
    this.finalFromX = fromPoints.points[0].x
    this.finalFromY = fromPoints.points[0].y


    // to intersection point calculation
    const w1 = this.toNode.getNodeSize() === "min" ? this.toNode.config.minWidth : this.toNode.config.maxWidth
    const h1 = this.toNode.getNodeSize() === "min" ? this.toNode.config.minHeight : this.toNode.config.maxHeight
    const rect1 = shape("rect", {
      x: tx - w1 / 2 - this.toNode.config.borderStrokeWidth / 2 - this.config.offset / 2,
      y: ty - h1 / 2 - this.toNode.config.borderStrokeWidth / 2 - this.config.offset / 2,
      width: w1 + this.toNode.config.borderStrokeWidth + this.config.offset,
      height: h1 + this.toNode.config.borderStrokeWidth + this.config.offset,
      rx: this.toNode.config.borderRadius,
      ry: this.toNode.config.borderRadius,
    })

    const toPoints = intersect(rect1, line)
    this.finalToX = toPoints.points[0].x
    this.finalToY = toPoints.points[0].y


    // this.canvas.circle(5).fill("#75f").center(this.finalFromX, this.finalFromY)
    // this.canvas.circle(5).fill("#0f0").center(this.finalToX, this.finalToY)
  }


  /**
   * Updates the two points indicating an edge.
   */
  updateEdgePosition() {
    const fx = this.fromNode.getFinalX()
    const fy = this.fromNode.getFinalY()

    const tx = this.toNode.getFinalX()
    const ty = this.toNode.getFinalY()

    // this.canvas.circle(5).fill("#75f").center(fx, fy)
    // this.canvas.circle(5).fill("#000").center(tx, ty)

    const line = shape("line", {
      x1: fx,
      y1: fy,
      x2: tx,
      y2: ty,
    })


    // from intersection point calculation
    const w2 = this.fromNode.getNodeSize() === "min" ? this.fromNode.config.minWidth : this.fromNode.config.maxWidth
    const h2 = this.fromNode.getNodeSize() === "min" ? this.fromNode.config.minHeight : this.fromNode.config.maxHeight
    const rect2 = shape("rect", {
      x: fx - w2 / 2 - this.fromNode.config.borderStrokeWidth / 2 - this.config.offset / 2,
      y: fy - h2 / 2 - this.fromNode.config.borderStrokeWidth / 2 - this.config.offset / 2,
      width: w2 + this.fromNode.config.borderStrokeWidth + this.config.offset,
      height: h2 + this.fromNode.config.borderStrokeWidth + this.config.offset,
      rx: this.fromNode.config.borderRadius,
      ry: this.fromNode.config.borderRadius,
    })

    const fromPoints = intersect(rect2, line)
    // console.log(fromPoints)
    this.finalFromX = fromPoints.points[0].x
    this.finalFromY = fromPoints.points[0].y


    // to intersection point calculation
    const w1 = this.toNode.getNodeSize() === "min" ? this.toNode.config.minWidth : this.toNode.config.maxWidth
    const h1 = this.toNode.getNodeSize() === "min" ? this.toNode.config.minHeight : this.toNode.config.maxHeight
    const rect1 = shape("rect", {
      x: tx - w1 / 2 - this.toNode.config.borderStrokeWidth / 2 - this.config.offset / 2,
      y: ty - h2 / 2 - this.toNode.config.borderStrokeWidth / 2 - this.config.offset / 2,
      width: w1 + this.toNode.config.borderStrokeWidth + this.config.offset,
      height: h1 + this.toNode.config.borderStrokeWidth + this.config.offset,
      rx: this.toNode.config.borderRadius,
      ry: this.toNode.config.borderRadius,
    })

    const toPoints = intersect(rect1, line)
    this.finalToX = toPoints.points[0].x
    this.finalToY = toPoints.points[0].y


    // this.canvas.circle(5).fill("#75f").center(this.finalFromX, this.finalFromY)
    // this.canvas.circle(5).fill("#000").center(this.finalToX, this.finalToY)
  }


  /**
   * Removes the rendered SVG edge from the canvas.
   * @param {Number} X The X position to move the elements before removing them.
   * @param {Number} Y The Y position to move the elements before removing them.
   */
  removeEdge(X = 0, Y = 0) {
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
    background.style.width = "100px"
    background.style.minWidth = "100px" // FIXME: this creates a new row for each word

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


  /**
   * Updates the new label.
   * @param {String} label The new label.
   */
  setLabel(label) {
    this.label = label || null
  }
}

export default BaseEdge
