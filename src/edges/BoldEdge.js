import BaseEdge from "./BaseEdge"
import BoldEdgeConfiguration from "../configuration/BoldEdgeConfiguration"


/**
 * This class is responsible for the visual representation of bold edges.
 * @property {Data} data The loaded data element from a database.
 * @property {Canvas} canvas The nested canvas to render the edge on.
 * @property {BaseEdge} fromNode The starting node reference.
 * @property {BaseEdge} toNode The ending node reference.
 * @property {Object} customRepresentation An object containing information to change the default visualization.
 *
 * @see BoldEdgeConfiguration
 *
 */
class BoldEdge extends BaseEdge {
  constructor(data, canvas, fromNode, toNode, customRepresentation = {}) {
    super(data, canvas, fromNode, toNode)

    this.config = { ...BoldEdgeConfiguration, ...customRepresentation }
  }


  /**
   * Calculates and renders a bold edge between two given nodes.
   * @param {Number} [X=finalFromX] The final X position.
   * @param {Number} [Y=finalFromY] The final Y position.
   */
  render(X = this.finalFromX, Y = this.finalFromY) {
    const svg = this.canvas.group()
    svg.css("cursor", "default")
    svg.id(`boldEdge#${this.layoutId}_${this.fromNode.id}_${this.toNode.id}`)
    svg.back()


    const plot = this.generateBoldArrow()
    const path = this.canvas.path(plot).stroke({
      color: this.config.strokeColor,
      width: this.config.strokeWidth,
      dasharray: this.config.strokeDasharray,
    })


    if (this.config.color !== null) {
      path.fill(this.config.color)
    } else {
      const theta = Math.atan2(this.finalToY - this.finalFromY, this.finalToX - this.finalFromX)
      path.rotate(-(theta) * (180 / Math.PI))
      let c1 = this.fromNode.config.borderStrokeColor
      let c2 = this.toNode.config.borderStrokeColor
      if ((-(theta) * (180 / Math.PI)) > 90) {
        const t = c1
        c1 = c2
        c2 = t
      }
      const gradient = this.canvas.gradient("linear", (add) => {
        add.stop(0, c1)
        add.stop(1, c2)
      })

      // svgdotjs bug: if a gradient gets an id, there is no way to create a gradient with a different color pairing
      // gradient.id("defaultBoldGradient")
      path.fill(gradient)
      path.rotate((theta) * (180 / Math.PI))
    }

    path.center(X, Y)
    svg.add(path)


    if (this.label !== null) {
      const label = this.createLabel()
      label.center(X, Y)
      svg.add(label)
    }


    // put new elements into position
    const cx = (this.finalFromX + this.finalToX) / 2
    const cy = (this.finalFromY + this.finalToY) / 2

    svg
      .get(0)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: 1 })
      .center(cx, cy)

    if (this.label !== null) {
      svg
        .get(1)
        .attr({ opacity: 0 })
        .animate({ duration: this.config.animationSpeed })
        .attr({ opacity: 1 })
        .center(cx + this.config.labelTranslateX, cy + this.config.labelTranslateY)
    }

    this.svg = svg
  }


  /**
   * Transforms an edge to its final rendered position.
   */
  transformToFinalPosition() {
    this.svg.back()

    const plot = this.generateBoldArrow()
    const cx = (this.finalFromX + this.finalToX) / 2
    const cy = (this.finalFromY + this.finalToY) / 2

    this
      .svg
      .get(0)
      .animate({ duration: this.config.animationSpeed })
      .plot(plot)

    if (this.label !== null) {
      this
        .svg
        .get(1)
        .animate({ duration: this.config.animationSpeed })
        .center(cx + this.config.labelTranslateX, cy + this.config.labelTranslateY)
    }
  }


  /**
  * Helper method to create a bold arrow based on the SVG path.
  * @return {String} The path in string format
  */
  generateBoldArrow() {
    const { lineWidth } = this.config
    const { arrowWidth } = this.config
    const { arrowHeight } = this.config


    const dx = this.finalToX - this.finalFromX
    const dy = this.finalToY - this.finalFromY
    const length = Math.sqrt(dx * dx + dy * dy)

    const delta = (Math.PI / 180) * 90
    const theta = Math.atan2(this.finalToY - this.finalFromY, this.finalToX - this.finalFromX)


    const x0 = this.finalFromX
    const y0 = this.finalFromY

    const x1 = x0 + (lineWidth / 2) * Math.cos(theta + delta)
    const y1 = y0 + (lineWidth / 2) * Math.sin(theta + delta)

    const x2 = x1 + (length - arrowHeight) * Math.cos(theta)
    const y2 = y1 + (length - arrowHeight) * Math.sin(theta)

    const x3 = x2 + ((arrowWidth - lineWidth) / 2) * Math.cos(theta + delta)
    const y3 = y2 + ((arrowWidth - lineWidth) / 2) * Math.sin(theta + delta)

    const x4 = this.finalToX
    const y4 = this.finalToY

    const x5 = x3 + arrowWidth * Math.cos(theta - delta)
    const y5 = y3 + arrowWidth * Math.sin(theta - delta)

    const x6 = x5 + ((arrowWidth - lineWidth) / 2) * Math.cos(theta + delta)
    const y6 = y5 + ((arrowWidth - lineWidth) / 2) * Math.sin(theta + delta)

    const x7 = x0 + (lineWidth / 2) * Math.cos(theta + delta * -1)
    const y7 = y0 + (lineWidth / 2) * Math.sin(theta + delta * -1)


    // this.canvas.circle(2).fill("#0f0").center(x0, y0)
    // this.canvas.circle(2).fill("#75f").center(x1, y1)
    // this.canvas.circle(2).fill("#00f").center(x2, y2)
    // this.canvas.circle(2).fill("#f00").center(x3, y3)
    // this.canvas.circle(2).fill("#ccc").center(x4, y4)
    // this.canvas.circle(2).fill("#222").center(x5, y5)
    // this.canvas.circle(2).fill("#000").center(x6, y6)
    // this.canvas.circle(2).fill("#f0f").center(x7, y7)
    // this.canvas.circle(2).fill("#f0f").center(cx, cy)

    const plot = `
      M ${x0},${y0}
      L ${x1},${y1}
      L ${x2},${y2}
      L ${x3},${y3}
      L ${x4},${y4}
      L ${x5},${y5}
      L ${x6},${y6}
      L ${x7},${y7}
      L ${x0},${y0}
    `
    return plot
  }
}

export default BoldEdge
