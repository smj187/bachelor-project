import { shape, intersect } from "svg-intersections"

const calculateArcLineIntersection = (x0, y0, x1, y1, path) => {
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

const calculateNodeLineIntersection = (x0, y0, x1, y1, node) => {
    const w = node.nodeSize === "min" ? node.config.minWidth : node.config.maxWidth
    const h = node.nodeSize === "min" ? node.config.minHeight : node.config.maxHeight

    // spacing between node and leaf
    const spacing = node.config.offset

    const rect1 = shape("rect", {
        x: x0 - w / 2 - spacing / 2,
        y: y0 - h / 2 - spacing / 2,
        width: w + spacing,
        height: h + spacing,
        rx: node.config.borderRadius,
        ry: node.config.borderRadius,
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


const calculateDistance = (sx, sy, tx, ty) => {
    const dx = tx - sx
    const dy = ty - sy
    return Math.sqrt(dx * dx + dy * dy)
}

export { calculateArcLineIntersection, calculateNodeLineIntersection, calculateDistance }