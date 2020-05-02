import { shape, intersect } from "svg-intersections"

class RadialLeaf {
    constructor(canvas, node, root, layoutConfig) {
        this.svg = null
        this.canvas = canvas
        this.config = {
            animationSpeed: layoutConfig.animationSpeed,
            strokeWidth: layoutConfig.leafStrokeWidth,
            strokeColor: layoutConfig.leafStrokeColor,
            marker: layoutConfig.leafMarker,
            hAspect: layoutConfig.hAspect,
            wAspect: layoutConfig.wAspect,
            leafIndicationLimit: layoutConfig.leafIndicationLimit,
            radiusDelta: layoutConfig.radiusDelta,
            initialRadius: layoutConfig.initialRadius
        }

        // node
        this.id = node.id
        this.node = node
        this.nodeSize = node.childrenIds.length
        this.parentChildren = 0


        // position
        this.root = root
        this.initialX = 0
        this.initialY = 0
        this.finalX = 0
        this.finalY = 0
        this.currentX = 0
        this.currentY = 0

        const w = this.node.nodeSize === "min" ? this.node.config.minWidth : this.node.config.maxWidth
        const h = this.node.nodeSize === "min" ? this.node.config.minHeight : this.node.config.maxHeight
        this.radius = Math.max(w, h) * 1.35

        // calculate outer radius
    }

    render() {
        const svg = this.canvas.group().draggable()
        const w = this.node.nodeSize === "min" ? this.node.config.minWidth : this.node.config.maxWidth
        const h = this.node.nodeSize === "min" ? this.node.config.minHeight : this.node.config.maxHeight
        const spacing = this.node.config.offset
        const spreadBreath = Math.max(w * 1.15, h * 1.15)
        const nodeSize = this.nodeSize < this.config.leafIndicationLimit ? this.nodeSize : this.config.leafIndicationLimit
        // console.log("render", this.node)

        // create outer circle
        const dynamicRadius1 = this.node.depth === 0
            ? Math.max(w, h) * 1.35
            : (Math.max(w, h) * 1.35) + (Math.max(w, h) * this.node.depth)
        const myRadius = dynamicRadius1 + (Math.max(w, h) * (this.node.depth)) + Math.min(w, h)

        const a = myRadius * this.config.hAspect + h / 4
        const b = myRadius * this.config.wAspect + w / 4
        const myArc = `
            M ${this.root.getFinalX() - a / 2},${this.root.getFinalY()}
            A ${a / 2},${b / 2} 0 0,0 ${this.root.getFinalX() + a / 2},${this.root.getFinalY()}
            A ${a / 2},${b / 2} 0 0,0 ${this.root.getFinalX() - a / 2},${this.root.getFinalY()}
            `

        // create helper circle that holds from positions for possible leafs
        const outerCircleRef = this.canvas.path(myArc).stroke({ width: 0.5, color: "#ccc" }).fill("none")

        // to position
        const tx = this.node.getFinalX()
        const ty = this.node.getFinalY()
        // this.canvas.circle(5).center(tx, ty).fill("#222")

        const findArcIntersection = (x0, y0, x1, y1, path) => {
            const arc = shape("path", { d: path })
            const line = shape("line", {
                x1: x0,
                y1: y0,
                x2: x1,
                y2: y1
            })
            const { points } = intersect(arc, line)
            return { x: points[0].x, y: points[0].y }
        }

        const findIntersection = (x0, y0, x1, y1) => {
            const rect1 = shape("rect", {
                x: x0 - w / 2 - spacing / 2,
                y: y0 - h / 2 - spacing / 2,
                width: w + spacing,
                height: h + spacing,
                rx: 0,
                ry: 0,
            })

            const line1 = shape("line", {
                x1: x0,
                y1: y0,
                x2: x1,
                y2: y1,
            })
            const { points } = intersect(rect1, line1)
            return { x: points[0].x, y: points[0].y }

        }


        if (this.node.childrenIds.length > 0 && this.node.children.length === 0 && this.node.depth === 0) {
            console.log("only ONE")



            const interval = p.length() / nodeSize
            let intervalSpaceUsed = 0
            // console.log(this.nodeSize, this.config.leafIndicationLimit)
            for (let i = 0; i < nodeSize; i += 1) {
                intervalSpaceUsed += interval / 2
                const intervalPosition = p.pointAt(intervalSpaceUsed)
                intervalSpaceUsed += interval / 2


                // this.canvas.circle(5).fill("#222").center(intervalPosition.x, intervalPosition.y)

                const toArc2 = findIntersection(tx, ty, intervalPosition.x, intervalPosition.y)
                // this.canvas.circle(5).center(toArc2.x, toArc2.y).fill("#f75")

                const outerCirclePoint = findArcIntersection(tx, ty, intervalPosition.x, intervalPosition.y, myArc)
                // this.canvas.circle(5).center(outerCirclePoint.x, outerCirclePoint.y).fill("#75f")

                const angle = Math.atan2(outerCirclePoint.y - toArc2.y, outerCirclePoint.x - toArc2.x)

                const test1 = toArc2.x + (Math.min(w / 2, h / 2)) * Math.cos(angle)
                const test2 = toArc2.y + (Math.min(w / 2, h / 2)) * Math.sin(angle)
                // this.canvas.circle(5).center(test1, test2).fill("#00f")

                const fromX = test1
                const fromY = test2
                const toX = toArc2.x
                const toY = toArc2.y


                // create simple SVG representation
                // const simplePath = this.canvas.path(`M${outerCirclePoint.x},${outerCirclePoint.y} L${toArc2.x},${toArc2.y}`).stroke({
                const simplePath = this.canvas.path(`M${fromX},${fromY} L${toX},${toY}`).stroke({
                    width: this.config.strokeWidth,
                    color: this.config.strokeColor,
                })
                // create a re-useable marker
                const index = [...this.canvas.defs().node.childNodes].findIndex((d) => d.id === "defaultRadialLeafMarker")
                if (index === -1) {
                    const marker = this.canvas.marker(12, 6, (add) => {
                        add.path(this.config.marker).fill(this.config.strokeColor).dx(1)
                    })
                    marker.id("defaultRadialLeafMarker")
                    this.canvas.defs().add(marker)
                    simplePath.marker("end", marker)
                } else {
                    const marker = this.canvas.defs().get(index)
                    simplePath.marker("end", marker)
                }

                // add simple path to the leaf's SVG object
                svg.add(simplePath)

            }

            svg.back()

            // remove helper line
            // outerCircleRef.remove()

            // put it into position
            const coords = this.node.coords[this.node.coords.length - 2] || this.node.coords[0]
            const startX = this.root.getFinalX()
            const startY = this.root.getFinalY()

            const finalX = svg.bbox().cx
            const finalY = svg.bbox().cy

            svg
                .attr({ opacity: 0 })
                .scale(0.001)
                .center(tx, ty)
                .animate({ duration: this.config.animationSpeed })
                .transform({ scale: 1, position: [finalX, finalY] })
                .attr({ opacity: 1 })
            this.finalX = svg.cx()
            this.finalY = svg.cy()



            svg.id(`radialLeaf#${this.node.id}`)
            this.svg = svg
            return
        }





        // find the line which intersects the current node and the outer circle based on the current angle
        const ax = this.root.getFinalX()
        const ay = this.root.getFinalY()
        const bx = this.node.getFinalX()
        const by = this.node.getFinalY()

        this.canvas.circle(5).center(bx, by).fill("#222")
        const angle = Math.atan2(by - ay, bx - ax)


        const dynamicRadius = this.node.depth === 0
            ? Math.max(w, h) * 1.35
            : (Math.max(w, h) * 1.35)

        const circleRadius = dynamicRadius
        // const circleRadius = this.config.initialRadius
        // console.log("circleRadius", circleRadius, dynamicRadius, this.node.depth)
        const cx = bx + (circleRadius) * Math.cos(angle)
        const cy = by + (circleRadius) * Math.sin(angle)
        this.canvas.circle(5).center(cx, cy).fill("#2ccc22")

        this.canvas.line(bx, by, cx, cy).stroke({ width: 0.5, color: "red" })


        // find the point where the line and outer circle intersect
        // console.log("render", this.id, this.node)
        const inter1 = findArcIntersection(bx, by, cx, cy, myArc)
        this.canvas.circle(5).center(inter1.x, inter1.y).fill("#000")


        // indicate how much space is used to show leaf indications
        const theta = angle
        const delta = (Math.PI / 180) * 90

        const x0 = cx + (spreadBreath / 2) * Math.cos(theta + delta)
        const y0 = cy + (spreadBreath / 2) * Math.sin(theta + delta)
        const x1 = cx - (spreadBreath / 2) * Math.cos(theta + delta)
        const y1 = cy - (spreadBreath / 2) * Math.sin(theta + delta)
        this.canvas.circle(5).center(x0, y0).fill("#00f")
        this.canvas.circle(5).center(x1, y1).fill("#00f")

        // create a helper line on which al leafs start from
        const helperLine = this
            .canvas
            .path(`M ${x0} ${y0} L ${x1} ${y1}`)
            .stroke({ width: 1, color: "red" })





        // calc edges
        const interval = helperLine.length() / nodeSize
        let intervalSpaceUsed = 0
        for (let i = 0; i < nodeSize; i += 1) {


            intervalSpaceUsed += interval / 2
            const p = helperLine.pointAt(intervalSpaceUsed)
            intervalSpaceUsed += interval / 2

            // edge starting point
            // this.canvas.circle(8).center(p.x, p.y).fill("#222")
            // this.canvas.circle(8).center(tx, ty).fill("#222")

            // calculate line

            // edge ending point
            const toArc2 = findIntersection(tx, ty, p.x, p.y)
            this.canvas.circle(5).center(toArc2.x, toArc2.y).fill("#222")

            // edge starting point
            const outerCirclePoint = findArcIntersection(tx, ty, p.x, p.y, myArc)
            this.canvas.circle(5).center(outerCirclePoint.x, outerCirclePoint.y).fill("#75f")

            // find angle between both points

            // calculate line with absolute given length

            const angle = Math.atan2(outerCirclePoint.y - toArc2.y, outerCirclePoint.x - toArc2.x)

            const test1 = toArc2.x + (Math.min(w / 2, h / 2)) * Math.cos(angle)
            const test2 = toArc2.y + (Math.min(w / 2, h / 2)) * Math.sin(angle)
            this.canvas.circle(5).center(test1, test2).fill("#00f")

            const fromX = test1
            const fromY = test2
            const toX = toArc2.x
            const toY = toArc2.y


            // create simple SVG representation
            // const simplePath = this.canvas.path(`M${outerCirclePoint.x},${outerCirclePoint.y} L${toArc2.x},${toArc2.y}`).stroke({
            const simplePath = this.canvas.path(`M${fromX},${fromY} L${toX},${toY}`).stroke({
                width: this.config.strokeWidth,
                color: this.config.strokeColor,
            })
            // create a re-useable marker
            const index = [...this.canvas.defs().node.childNodes].findIndex((d) => d.id === "defaultRadialLeafMarker")
            if (index === -1) {
                const marker = this.canvas.marker(12, 6, (add) => {
                    add.path(this.config.marker).fill(this.config.strokeColor).dx(1)
                })
                marker.id("defaultRadialLeafMarker")
                this.canvas.defs().add(marker)
                simplePath.marker("end", marker)
            } else {
                const marker = this.canvas.defs().get(index)
                simplePath.marker("end", marker)
            }

            // add simple path to the leaf's SVG object
            svg.add(simplePath)
        }

        svg.back()

        // remove helper line
        // helperLine.remove()
        // outerCircleRef.remove()

        // put it into position
        const coords = this.node.coords[this.node.coords.length - 2] || this.node.coords[0]
        const startX = this.isReRender ? coords[0] : this.node.currentX
        const startY = this.isReRender ? coords[1] : this.node.currentY

        const finalX = svg.bbox().cx
        const finalY = svg.bbox().cy

        svg
            .attr({ opacity: 0 })
            .center(startX, startY)
            .animate({ duration: this.config.animationSpeed })
            .transform({ position: [finalX, finalY] })
            .attr({ opacity: 1 })
        this.finalX = svg.cx()
        this.finalY = svg.cy()



        svg.id(`radialLeaf#${this.node.id}`)
        this.svg = svg

    }



    transformToFinalPosition(X = this.node.finalX, Y = this.node.finalY) {
        // console.log("rm", this.id)
        this.removeSVG()

        this.render()
        // this
        //     .svg
        //     .animate({ duration: this.config.animationSpeed })
        //     .transform({ position: [X, Y] })
    }

    removeSVG() {
        if (this.isRendered()) {
            this.svg.remove()
            this.svg = null
        }
    }


    /**
     * Determins where the leaf is rendered or not.
     * @returns True, if the SVG is rendered, else false.
     */
    isRendered() {
        return this.svg !== null
    }

    getId() {
        return this.id
    }
}

export default RadialLeaf