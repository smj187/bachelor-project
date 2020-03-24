import BaseEdge from "./BaseEdge"

const BoldEdgeConfig = {
  offset: 8,
  animationSpeed: 300,

  color1: "#555",
  color2: "#555",

  blockarrowLineWidth: 3,
  blockarrowArrowWidth: 10,
  blockarrowArrowLength: 5,


  labelColor: "#222222",
  labelFontFamily: "Montserrat",
  labelFontSize: 16,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#ffffffcc",
}

class BoldEdge extends BaseEdge {
  constructor(canvas, fromNode, toNode, customBoldEdgeConfig = {}) {
    super(canvas, fromNode, toNode)


    this.config = { ...BoldEdgeConfig, ...customBoldEdgeConfig }

    this.calculate()
  }


  /**
   * Creates the initial SVG element and adds hover effect
   */
  createSVGElement() {
    const svg = this.canvas.group()
    svg.css("cursor", "default")
    svg.id(`edge#${this.fromNode.id}_${this.toNode.id}`)

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


    // create new elements
    const lw = this.config.blockarrowLineWidth
    const aw = this.config.blockarrowArrowWidth
    const al = this.config.blockarrowArrowLength

    const dx = this.finalToX - this.finalFromX
    const dy = this.finalToY - this.finalFromY
    const len = Math.sqrt(dx * dx + dy * dy)
    const dW = aw - lw
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI
    this.angle = angle

    const svgPath = `
      M 0,${-lw / 2}
      h ${len - al}
      v ${-dW / 2}
      L ${len},0
      L ${len - al},${aw / 2}
      v ${-dW / 2}
      H 0
      Z
    `

    const path = this.canvas.path()
    path.plot(svgPath)

    const getColor = (where) => {
      if (where.type === "requirement") {
        return where.config.backgroundColor
      }
      return where.config.borderStrokeColor
    }

    const c1 = getColor(this.fromNode)
    const c2 = getColor(this.toNode)
    const gradient = this.canvas.gradient("linear", (add) => {
      add.stop(0, c1)
      add.stop(1, c2)
    })
    path.fill(gradient)
    path.center(this.finalFromX, this.finalFromY)
    path.rotate(angle)
    path.scale(0.0001)
    this.svg.add(path)

    if (this.label !== null) {
      const label = this.createLabel()
      this.svg.add(label)
    }


    // put new elements into position
    this
      .svg
      .get(0)
      .attr({ opacity: 0 })
      .animate({ duration: this.config.animationSpeed })
      .transform({
        scale: 1,
        rotate: angle,
        position: [(this.finalFromX + this.finalToX) / 2, (this.finalFromY + this.finalToY) / 2],
      })

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
    const blockArrow = this.svg.get(0)
    const label = this.svg.get(1)

    blockArrow
      .attr({ opacity: 1 })
      .animate({ duration: this.config.animationSpeed })
      .transform({ position: [X, Y], scale: 0.0001, rotate: this.angle })
      .attr({ opacity: 0 })
      .after(() => blockArrow.remove())

    if (this.label) {
      label
        .attr({ opacity: 1 })
        .animate({ duration: this.config.animationSpeed })
        .transform({ position: [X, Y], scale: 0.0001 })
        .attr({ opacity: 0 })
        .after(() => label.remove())
    }
  }
}

export default BoldEdge
