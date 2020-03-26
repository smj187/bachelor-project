const ContextualConfig = {

  offset: 8,
  animationSpeed: 300,

  color: "#ff8e9e",

  blockarrowLineWidth: 3,
  blockarrowArrowWidth: 10,
  blockarrowArrowLength: 5,
}


class ContextualConainer {
  constructor(canvas, contextualConfig, type) {
    this.canvas = canvas
    this.svg = null
    this.config = { ...ContextualConfig, ...contextualConfig }
    this.type = type

    this.initialX = 0
    this.initialY = 0
    this.finalX = 0
    this.finalY = 0

    this.w = 0
    this.h = 0
    this.cx = 0
    this.cy = 0

    this.fromPoint = null
    this.toPoint = null
  }

  setColor(color) {
    this.config = { ...this.config, color }
  }


  render(X, Y) {
    const svg = this.canvas.group().draggable()
    const node = this.canvas.rect(0, 0).draggable()

    if (this.type === "riskContainer") {
      node.fill(this.config.riskContainerBackgroundColor)
      node.radius(this.config.riskContainderBorderRadius)
      node.stroke({
        color: this.config.riskContainerBorderStrokeColor,
        width: this.config.riskContainerBorderStrokeWidth,
      })
    } else if (this.type === "childrenContainer") {
      node.fill(this.config.childrenContainerBackgroundColor)
      node.radius(this.config.childrenContainderBorderRadius)
      node.stroke({
        color: this.config.childrenContainerBorderStrokeColor,
        width: this.config.childrenContainerBorderStrokeWidth,
      })
    } else if (this.type === "parentContainer") {
      node.fill(this.config.parentContainerBackgroundColor)
      node.radius(this.config.parentContainderBorderRadius)
      node.stroke({
        color: this.config.parentContainerBorderStrokeColor,
        width: this.config.parentContainerBorderStrokeWidth,
      })
    }

    svg.add(node)
    svg.id(this.type)
    svg.center(X, Y)
    this.svg = svg

    this.fromPoint.y -= this.config.offset
    this.toPoint.y += this.config.offset

    // this.canvas.circle(5).center(this.fromPoint.x, this.fromPoint.y).fill("#000")
    // this.canvas.circle(5).center(this.toPoint.x, this.toPoint.y).fill("#99f")

    // add edge
    const lw = this.config.blockarrowLineWidth
    const aw = this.config.blockarrowArrowWidth
    const al = this.config.blockarrowArrowLength

    const dx = this.toPoint.x - this.fromPoint.x
    const dy = this.toPoint.y - this.fromPoint.y
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
    path.fill(this.config.color)
    this.ex = this.toPoint.x
    this.ey = (this.toPoint.y + this.fromPoint.y) / 2
    path.center(this.ex, this.ey)
    path.rotate(angle)
    path.scale(0.0001)
    svg.add(path)

    // this.canvas.circle(5).center(this.cx, this.cy).fill("#f75")
    // this.canvas.circle(5).center(p2x, p2y).fill("#6f7")
  }


  transform() {
    this
      .svg
      .back()

    this
      .svg
      .get(0)
      .animate({ duration: this.config.animationSpeed })
      .size(this.w, this.h)
      .center(this.cx, this.cy)

    this
      .svg
      .get(1)

      .animate({ duration: this.config.animationSpeed })
      .transform({
        scale: 1,
        rotate: this.angle,
        position: [this.ex, this.ey],
      })
  }


  removeContainer(X, Y) {
    if (this.svg !== null) {
      this
        .svg
        .animate({ duration: this.config.animationSpeed })
        .transform({ scale: 0.001, position: [X, Y] })
        .after(() => {
          this.svg.remove()
          this.svg = null
        })
    }
  }
}

export default ContextualConainer
