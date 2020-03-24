import BaseEdge from "./BaseEdge"

const ThinEdgeConfig = {
  offset: 8,
  animationSpeed: 300,
  type: "solid",

  // arrow
  strokeWidth: 2,
  strokeColor: "#aaa",
  strokeDasharray: "7 5",
  marker: "M 0 0 L 6 3 L 0 6 z",


  // text
  labelColor: "#777",
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
  }


  /**
   * Creates the initial SVG element and adds hover effect
   */
  render(X, Y) {
    const svg = this.canvas.group() // .draggable()
    svg.css("cursor", "default")
    svg.id(`edge#${this.fromNode.id}_${this.toNode.id}`)

    const line = `M${this.finalFromX},${this.finalFromY} L${this.finalToX},${this.finalToY}`
    const dasharray = this.config.type === "dashed" ? this.config.strokeDasharray : "0"
    const path = this.canvas.path(line).stroke({
      width: this.config.strokeWidth,
      color: this.config.strokeColor,
      dasharray,
    })

    // create a re-useable marker
    const i = [...this.canvas.defs().node.childNodes].findIndex((d) => d.id === "defaultThinMarker")
    if (i === -1) {
      const marker = this.canvas.marker(12, 6, (add) => {
        add.path(this.config.marker).fill(this.config.strokeColor).dx(1)
      })
      marker.id("defaultThinMarker")
      this.canvas.defs().add(marker)
      path.marker("end", marker)
    } else {
      const marker = this.canvas.defs().get(i)
      path.marker("end", marker)
    }


    svg.add(path)

    if (this.label !== null) {
      const label = this.createLabel()
      svg.add(label)
    }

    svg.attr({ opacity: 0 })
    svg.center(X, Y)

    this.svg = svg
  }


  /**
   * Transform an edge to its final rendered position
   */
  transformToFinalPosition() {
    this
      .svg
      .back()


    this
      .svg
      .scale(0.001)
      .attr({ opacity: 1 })
      .animate({ duration: this.config.animationSpeed })
      .transform({ scale: 1 })


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
  transformToInitialPosition(X = this.finalFromX, Y = this.finalFromY) {
    this
      .svg
      .back()

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
