const ContextualConfig = {

  offset: 8,
  animationSpeed: 300,

  color: "#ff8e9e",

  blockarrowLineWidth: 3,
  blockarrowArrowWidth: 10,
  blockarrowArrowLength: 5,
}


class ContextualConainer {
  constructor(canvas, type, config, ix, iy, cx, cy, w, h) {
    this.canvas = canvas
    this.svg = null
    this.type = type
    this.config = config

    this.initialX = ix
    this.initialY = iy
    this.finalX = cx
    this.finalY = cy
    this.w = w
    this.h = h

    this.dy = 0
  }

  render(X = this.initialX, Y = this.initialY) {
    const svg = this.canvas.rect(0, 0).draggable()

    if (this.type === "child") {
      svg.radius(this.config.childContainderBorderRadius)
      svg.stroke({ width: this.config.childContainerBorderStrokeWidth })
      svg.stroke({ color: this.config.childContainerBorderStrokeColor })
      svg.fill({ color: this.config.childContainerBackgroundColor })
    } else if (this.type === "parent") {
      svg.radius(this.config.parentContainderBorderRadius)
      svg.stroke({ width: this.config.parentContainerBorderStrokeWidth })
      svg.stroke({ color: this.config.parentContainerBorderStrokeColor })
      svg.fill({ color: this.config.parentContainerBackgroundColor })
    } else if (this.type === "risk") {
      svg.radius(this.config.riskContainderBorderRadius)
      svg.stroke({ width: this.config.riskContainerBorderStrokeWidth })
      svg.stroke({ color: this.config.riskContainerBorderStrokeColor })
      svg.fill({ color: this.config.riskContainerBackgroundColor })
    }


    svg.center(X, Y)

    this.svg = svg
  }

  update() {
    this
      .svg
      .animate({ duration: this.config.animationSpeed })
      .height(this.h)
      .dy(this.dy)
  }

  transformToFinalPosition(X = this.finalX, Y = this.finalY) {
    this
      .svg
      .back()

    this
      .svg
      .animate({ duration: this.config.animationSpeed })
      .size(this.w, this.h)
      .center(X, Y)
  }

  transformToInitialPosition(X = this.finalX, Y = this.finalY) {
    this
      .svg
      .back()

    this.svg.back()
    this
      .svg
      .animate({ duration: this.config.animationSpeed })
      .center(X, Y)
      .size(0, 0)
      .attr({ opacity: 0 })
      .after(() => this.svg.attr({ opacity: 1 }))
  }


  removeContainer(X, Y) {
    if (this.svg !== null) {
      this
        .svg
        .attr({ opacity: 1 })
        .animate({ duration: this.config.animationSpeed })
        .transform({ position: [X, Y] })
        .attr({ opacity: 0 })
        .after(() => {
          this.svg.remove()
          this.svg = null
        })
    }
  }

  isRendered() {
    return this.svg !== null
  }

  getFinalX() {
    return this.finalX
  }


  getFinalY() {
    return this.finalY
  }
}

export default ContextualConainer
