const ContextualConnectionConfig = {
  offset: 8,
  animationSpeed: 300,

  color1: null,
  color2: null,

  blockarrowLineWidth: 25,
  blockarrowArrowWidth: 40,
  blockarrowArrowLength: 20,


  labelColor: "#222",
  labelFontFamily: "Montserrat",
  labelFontSize: 16,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#ffffffcc",
  labelTranslateX: 0,
  labelTranslateY: 0,
}


class ContextualContainerConnection {
  constructor(canvas, ix, iy, fx, fy, tx, ty, color1, color2, offset) {
    this.canvas = canvas
    this.svg = null

    this.config = { ...ContextualConnectionConfig }


    this.initialX = ix
    this.initialY = iy
    this.fx = fx
    this.fy = fy
    this.tx = tx
    this.ty = ty
    this.color1 = color1
    this.color2 = color2

    this.offset = offset
  }


  render() {
    // this.canvas.circle(5).fill(this.color).center(this.tx, this.ty)
    // this.canvas.circle(5).fill(this.color).center(this.fx, this.fy)


    const calculateDistance = (sx, sy, tx, ty) => {
      const dx = tx - sx
      const dy = ty - sy
      return Math.sqrt(dx * dx + dy * dy)
    }


    this.h = calculateDistance(this.fx, this.fy, this.tx, this.ty)

    const cx = (this.fx + this.tx) / 2
    const cy = (this.fy + this.ty) / 2


    // create new elements
    const lw = this.config.blockarrowLineWidth
    const aw = this.config.blockarrowArrowWidth
    const al = this.config.blockarrowArrowLength

    const dx = this.tx - this.fx
    const dy = this.ty - this.fy
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


    const gradient = this.canvas.gradient("linear", (add) => {
      add.stop(0, this.color1)
      add.stop(1, this.color2)
    })
    path.fill(gradient)
    path.center(cx, cy)
    path.dy(this.offset)
    path.rotate(angle)
    path.scale(0.0001)
    path.attr({ opacity: 0 })

    this.svg = path
  }


  transformToFinalPosition() {
    this
      .svg
      .back()

    this
      .svg
      .animate({ duration: this.config.animationSpeed })
      .dx(this.offset)
      .transform({ scale: 1, rotate: this.angle })
      .attr({ opacity: 1 })
  }


  transformToInitialPosition() {

  }


  removeConnection(X, Y) {
    if (this.svg !== null) {
      this.svg.remove()
      this.svg = null
    }
  }


  isRendered() {
    return this.svg !== null
  }

  getFinalX() {
    return this.fx
  }


  getFinalY() {
    return this.fy
  }
}


export default ContextualContainerConnection
