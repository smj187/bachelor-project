import BaseEdge from "./BaseEdge"
import CustomEdgeConfiguration from "../configuration/CustomEdgeConfiguration"


/**
 * This class is responsible for the visual representation of custom edges.
 *
 * @category SVG Representations
 * @subcategory Edges
 * @property {Data} data The loaded data element from a database.
 * @property {Canvas} canvas The nested canvas to render the edge on.
 * @property {BaseEdge} fromNode The starting node reference.
 * @property {BaseEdge} toNode The ending node reference.
 * @property {Object} customRepresentation An object containing information to change the default visualization.
 *
 * @see CustomEdgeConfiguration
 *
 */
class CustomEdge extends BaseEdge {
  constructor(data, canvas, fromNode, toNode, customRepresentation = {}) {
    super(data, canvas, fromNode, toNode)
    this.config = { ...CustomEdgeConfiguration, ...this.config, ...customRepresentation }

    this.animation = null
  }


  /**
  * Calculates and renders a custom edge between two given nodes.
  *
  * @param {Object} [opts={ }] An object containing additional information.
  * @param {Number} [opts.FX=this.finalFromX] The final X render position.
  * @param {Number} [opts.FY=this.finalFromY] The final Y render position.
  */
  render({ X = this.finalFromX, Y = this.finalFromY }) {
    // create the bare bone SVG object
    const svg = this.createSVGElement(`customEdge#${this.layoutId}_${this.fromNode.id}_${this.toNode.id}`)

    // the line that connects two nodes
    const line = `M${this.finalFromX},${this.finalFromY} L${this.finalToX},${this.finalToY}`

    // the lines dash array
    const dasharray = this.config.strokeDasharray !== "0" ? this.config.strokeDasharray : "0"

    // draw the line
    const path = this.canvas.path(line).stroke({
      width: this.config.strokeWidth,
      color: this.config.strokeColor,
      dasharray,
    })

    // create a re-useable marker
    const defId = `defaultCustomMarker#${this.layoutId}`
    const i = [...this.canvas.defs().node.childNodes].findIndex((d) => d.id === defId)
    if (i === -1) {
      const marker = this.canvas.marker(this.config.markerWidth, this.config.markerHeight, (add) => {
        add.path(this.config.marker).fill(this.config.strokeColor).dx(1)
      })
      marker.id(defId)
      this.canvas.defs().add(marker)
      path.marker("end", marker)
    } else {
      const marker = this.canvas.defs().get(i)
      path.marker("end", marker)
    }

    svg.add(path)


    // add label
    console.log(this)
    if (this.label !== null) {
      const label = this.createLabel()
      svg.add(label)
    }


    // animate into position
    svg.center(X, Y)
    svg.back()

    svg
      .scale(0.001)
      .attr({ opacity: 1 })
      .animate({ duration: this.config.animationSpeed })
      .transform({ scale: 1 })

    svg
      .get(0)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .plot(`M${this.finalFromX},${this.finalFromY} L${this.finalToX},${this.finalToY}`)
      .attr({ opacity: 1 })

    if (this.label) {
      const x = (this.finalFromX + this.finalToX) / 2 + this.config.labelTranslateX
      const y = (this.finalFromY + this.finalToY) / 2 + this.config.labelTranslateY
      svg
        .get(1)
        .attr({ opacity: 0 })
        .animate({ duration: this.config.animationSpeed })
        .center(x, y)
        .attr({ opacity: 1 })
    }
    this.svg = svg
  }


  /**
   * Transforms an edge to its final rendered position.
   */
  transformToFinalPosition() {
    this.svg.back()

    // cancel an ongoing animation
    if (this.animation !== null) {
      this.animation.unschedule()
    }

    // re-render the edge
    this.animation = this
      .svg
      .get(0)
      .animate({ duration: this.config.animationSpeed })
      .plot(`M${this.finalFromX},${this.finalFromY} L${this.finalToX},${this.finalToY}`)
      .after(() => {
        this.animation = null
      })

    // re-positions the la
    bel
    if (this.label) {
      const x = (this.finalFromX + this.finalToX) / 2 + this.config.labelTranslateX
      const y = (this.finalFromY + this.finalToY) / 2 + this.config.labelTranslateY
      this
        .svg
        .get(1)
        .animate({ duration: this.config.animationSpeed })
        .center(x, y)
    }
  }
}

export default CustomEdge
