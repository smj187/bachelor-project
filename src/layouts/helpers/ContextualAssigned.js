const Config = {
    offset: 8,
    animationSpeed: 300,

    color: "#F26A7C",
    strokeWidth: 20,

    blockarrowLineWidth: 20,
    blockarrowArrowWidth: 35,
    blockarrowArrowLength: 15,


    labelColor: "#222",
    labelFontFamily: "Montserrat",
    labelFontSize: 16,
    labelFontWeight: 600,
    labelFontStyle: "normal",
    labelBackground: "#ffffffcc",
    labelTranslateX: 0,
    labelTranslateY: 0,
}

class ContextualAssigned {
    constructor(canvas, ix, iy, fx, fy, tx, ty, dx, dy, rx, ry) {
        this.canvas = canvas
        this.svg = null

        this.config = { ...Config }


        this.initialX = ix
        this.initialY = iy
        this.fx = fx
        this.fy = fy
        this.tx = tx
        this.ty = ty
        this.dx = dx
        this.dy = dy
        this.rx = rx
        this.ry = ry
        this.color = this.config.color
    }


    render() {
        const svg = this.canvas.group()

        const calculateDistance = (sx, sy, tx, ty) => {
            const dx = tx - sx
            const dy = ty - sy
            return Math.sqrt(dx * dx + dy * dy)
        }


        this.h = calculateDistance(this.fx, this.fy, this.tx, this.ty)

        let cx = (this.fx + this.tx) / 2
        let cy = (this.fy + this.ty) / 2




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


        path.fill(this.config.color)
        path.center(cx, cy)
        path.dy(this.offset)
        path.rotate(angle)
        path.scale(0.0001)
        path.attr({ opacity: 0 })

        svg.add(path)


        const line = `M${this.dx},${this.dy} L${this.rx},${this.ry}`

        const path2 = this.canvas.path(line).stroke({
            width: this.config.strokeWidth,
            color: this.config.color,
            dasharray: "0",
        })

        path2.scale(0.0001)
        path2.attr({ opacity: 0 })

        svg.add(path2)




        this.svg = svg

    }

    transformToFinalPosition() {
        this
            .svg
            .get(0)
            .back()
        this
            .svg
            .get(1)
            .back()

        this
            .svg
            .get(0)
            .animate({ duration: this.config.animationSpeed })
            .dx(this.offset)
            .transform({ scale: 1, rotate: this.angle })
            .attr({ opacity: 1 })

        this
            .svg
            .get(1)
            .animate({ duration: this.config.animationSpeed })

            .transform({ scale: 1, })
            .attr({ opacity: 1 })

    }


    transformToInitialPosition() {


    }


    removeConnection(X, Y) {
        if (this.svg !== null) {
            this.svg.attr({ opacity: 0 })
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


export default ContextualAssigned