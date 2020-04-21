const TreeChildLimiterConfiguration = {
    animationSpeed: 300,
    childLimiterWidth: 105,
    childLimiterHeight: 40,
    childLimiterTextColor: "#222",
    childLimiterPadding: 8,
    childLimiterFontFamily: "Montserrat",
    childLimiterFontSize: 12,
    childLimiterFontWeight: 700,
    childLimiterFontStyle: "normal",
    childLimiterBackground: "#fff",
}

class TreeChildLimiter {
    constructor(canvas, type) {
        this.svg = null
        this.type = type
        this.canvas = canvas
        this.config = { ...TreeChildLimiterConfiguration }

        this.finalX = 0
        this.finalY = 0

        this.func = null
    }

    render(X = this.finalX, Y = this.finalY) {

        const svg = this.canvas.group()
        svg.css("cursor", "pointer")
        svg.id("gridchildLimiter")


        const w = this.config.childLimiterWidth
        const h = this.config.childLimiterHeight

        const fobj = this.canvas.foreignObject(w, h)

        const background = document.createElement("div")
        background.style.background = this.config.childLimiterBackground
        background.style.padding = `${this.config.childLimiterPadding / 2}px`
        background.style.textAlign = "left"

        const label = document.createElement("div")
        label.innerText = "show all children"
        label.style.color = this.config.childLimiterTextColor
        label.style.fontSize = `${this.config.childLimiterFontSize}px`
        label.style.fontFamily = this.config.childLimiterFontFamily
        label.style.fontWeight = this.config.childLimiterFontWeight
        label.style.fontStyle = this.config.childLimiterFontStyle

        background.appendChild(label)
        fobj.add(background)
        fobj.css("user-select", "none")
        fobj.height(background.clientHeight)

        svg.add(fobj)

        svg
            .center(X, Y)

        fobj
            .scale(0.001)
            .center(X, Y)
            .animate({ duration: this.config.animationSpeed })
            .transform({ scale: 1, position: [X, Y] })


        svg.on("mouseover", () => {
            fobj.transform({ scale: 1.05, position: [X, Y] })
        })


        svg.on("mouseout", () => {

            fobj.transform({ scale: 0.95, position: [X, Y] })
        })

        this.isVisible = false
        this.svg = svg

    }


    transformToFinalPosition(X = this.finalX, Y = this.finalY) {
        this
            .svg
            .animate({ duration: this.config.animationSpeed })
            .transform({ position: [X, Y] })
    }

    isRendered() {
        return this.svg !== null
    }

    removeNode() {
        if (this.svg !== null) {
            this.svg.remove()
            this.svg = null
        }
    }

    setReRenderFunc(reRenderFunc) {
        this.reRenderFunc = reRenderFunc
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig }
    }

    getIsExpanded() {
        return this.isExpanded
    }

    getFinalX() {
        return this.finalX
    }

    setFinalX(finalX) {
        this.finalX = finalX
    }

    getFinalY() {
        return this.finalY
    }

    setFinalY(finalY) {
        this.finalY = finalY
    }


}

export default TreeChildLimiter