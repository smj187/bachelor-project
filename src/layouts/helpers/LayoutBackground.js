class LayoutBackground {
  constructor(canvas, config) {
    this.canvas = canvas
    this.config = config

    this.svg = null

    this.corners = []
  }

  setCornders(corners) {
    this.corners = corners
  }

  render() {
    const p0 = this.corners[0]
    const p1 = this.corners[1]
    const p2 = this.corners[2]

    const cx = (p0[0] + p2[0]) / 2
    const cy = (p0[1] + p2[1]) / 2

    const dx = p1[0] - p0[0]
    const dy = p1[1] - p0[1]

    const hx = p2[0] - p1[0]
    const hy = p2[1] - p1[1]

    const w = Math.sqrt(dx * dx + dy * dy)
    const h = Math.sqrt(hx * hx + hy * hy)


    const svg = this.canvas.rect(w, h)
    svg.fill(this.config.layoutBackgroundColor)
    svg.radius(this.config.layoutBackgroundBorderRadius)
    svg.stroke({
      width: this.config.layoutBackgroundBorderStrokeWidth,
      color: this.config.layoutBackgroundBorderStrokeColor,
      dasharray: this.config.layoutBackgroundBorderStrokeDasharray,
    })
    svg.id("gridBackground")

    svg.back()
    svg
      .attr({ opacity: 0 })
      .center(cx, cy)
      .scale(0.001)
      .animate({ duration: this.config.animationSpeed })
      .attr({ opacity: 1 })
      .transform({ scale: 1 })
      .after(() => svg.back())


    this.svg = svg
  }

  transform() {
    console.log("tranf")
    const p0 = this.corners[0]
    const p1 = this.corners[1]
    const p2 = this.corners[2]

    const cx = (p0[0] + p2[0]) / 2
    const cy = (p0[1] + p2[1]) / 2

    const dx = p1[0] - p0[0]
    const dy = p1[1] - p0[1]

    const hx = p2[0] - p1[0]
    const hy = p2[1] - p1[1]

    const w = Math.sqrt(dx * dx + dy * dy)
    const h = Math.sqrt(hx * hx + hy * hy)

    console.log(this.svg.bbox())
    console.log(w, h)

    this
      .svg
      .animate({ duration: this.config.animationSpeed })
      .size(w, h)
  }

  remove() {
    this.svg.remove()
    this.svg = null
  }
}

export default LayoutBackground
