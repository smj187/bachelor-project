import BaseEdge from "./BaseEdge"

const ThinEdgeConfig = {
  offset: 8,
  animationSpeed: 300,
  type: "solid",

  // arrow
  strokeWidth: 2,
  strokeColor: "#afd4ed",
  strokeDasharray: "0",
  marker: "M 0 0 L 8 4 L 0 8 z",


  // text
  labelColor: "#222222",
  labelFontFamily: "Montserrat",
  labelFontSize: 16,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#ffffffcc",
}

class ThinEdge extends BaseEdge {
  constructor(canvas, fromNode, toNode, customThinEdgeConfig = {}) {
    super(canvas, fromNode, toNode)

    this.config = { ...ThinEdgeConfig, ...customThinEdgeConfig }


    this.calculate()
  }


  /**
   * Creates the initial SVG element and adds hover effect
   */
  createSVGElement() {
    const svg = this.canvas.group() // .draggable()
    svg.css("cursor", "default")
    svg.id(`edge#${this.fromNode.id}_${this.toNode.id}`)


    const line = `M${this.finalFromX},${this.finalFromY} L${this.finalFromX},${this.finalFromY}`
    const path = this.canvas.path(line).stroke({
      width: this.config.strokeWidth,
      color: this.config.strokeColor,
      dasharray: this.config.strokeDasharray,
    })
    const marker = this.canvas.marker(14, 8, (add) => {
      add.path(this.config.marker).fill(this.config.strokeColor).dx(1)
    })
    path.marker("end", marker)
    svg.add(path)


    if (this.label !== null) {
      const label = this.createLabel()
      svg.add(label)
    }

    svg.attr({ opacity: 0 })

    this.svg = svg
  }


  /**
   * Transform an edge to its final rendered position
   */
  transformToFinal() {
    this
      .svg
      .attr({ opacity: 1 })

    this
      .svg
      .get(0)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .plot(`M${this.finalFromX},${this.finalFromY} L${this.finalToX},${this.finalToY}`)
      .attr({ opacity: 1 })

    if (this.label) {
      this
        .svg
        .get(1)
        .attr({ opacity: 0 })
        .animate({ duration: this.config.animationSpeed })
        .center((this.finalFromX + this.finalToX) / 2, (this.finalFromY + this.finalToY) / 2)
        .attr({ opacity: 1 })
    }
  }


  /**
   * Transform an edge from its visible position to its initial rendered position
   * @param {Number} [X=finalFromX] The x-position the edge will be translated
   * @param {Number} [Y=finalFromY] The y-position the edge will be translated
   */
  transformToInitial(X = this.finalFromX, Y = this.finalFromY) {
    this
      .svg
      .get(0)
      .attr({ opacity: 1 })
      .animate({ duration: this.config.animationSpeed })
      .plot(`M${X},${Y} L${X},${Y}`)
      .attr({ opacity: 0 })

    if (this.label) {
      this
        .svg
        .get(1)
        .attr({ opacity: 1 })
        .animate({ duration: this.config.animationSpeed })
        .center(X, Y)
        .attr({ opacity: 0 })
    }
  }
}


export default ThinEdge
