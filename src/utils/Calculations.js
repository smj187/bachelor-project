import { shape, intersect } from "svg-intersections"


/**
 * Calculates an intersection between an arc and a line.
 *
 * @private
 * @param {Number} x0 The starting X coordinate.
 * @param {Number} y0 The starting Y coordinate.
 * @param {Number} x1 The ending X coordinate.
 * @param {Number} y1 The ending Y coordinate.
 * @param {String} path Path coorinates.
 */
const calculateArcLineIntersection = (x0, y0, x1, y1, path) => {
  const arc = shape("path", { d: path })
  const line = shape("line", {
    x1: x0,
    y1: y0,
    x2: x1,
    y2: y1,
  })
  const { points } = intersect(arc, line)
  return { x: points[0].x, y: points[0].y }
}


/**
 * Calculates an intersection between a node and line for the contextual layout.
 *
 * @private
 * @param {Number} x0 The starting X coordinate.
 * @param {Number} y0 The starting Y coordinate.
 * @param {Number} x1 The ending X coordinate.
 * @param {Number} y1 The ending Y coordinate.
 * @param {BaseNode} node The intersected node.
 */
const calculatContextualIntersection = (x0, y0, x1, y1, node) => {
  const w = node.getNodeSize() === "min" ? node.config.minWidth : node.config.maxWidth
  const h = node.getNodeSize() === "min" ? node.config.minHeight : node.config.maxHeight

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

  if (points[0]) {
    return { x: points[0].x, y: points[0].y }
  }

  return { x: 0, y: 0 }
}


/**
 * Calculates an intersection between an arc and a node.
 *
 * @private
 * @param {Number} x0 The starting X coordinate.
 * @param {Number} y0 The starting Y coordinate.
 * @param {Number} x1 The ending X coordinate.
 * @param {Number} y1 The ending Y coordinate.
 * @param {BaseNode} node The intersected node.
 */
const calculateNodeLineIntersection = (x0, y0, x1, y1, node) => {
  const w = node.getNodeSize() === "min" ? node.config.minWidth : node.config.maxWidth
  const h = node.getNodeSize() === "min" ? node.config.minHeight : node.config.maxHeight

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


/**
 * Calculates the distance between two points.
 *
 * @private
 * @param {Number} sx The starting x coordinate.
 * @param {Number} sy The starting y coordinate.
 * @param {Number} tx The ending x coordinate.
 * @param {Number} ty The ending y coordinate.
 */
const calculateDistance = (sx, sy, tx, ty) => {
  const dx = tx - sx
  const dy = ty - sy
  return Math.sqrt(dx * dx + dy * dy)
}

export {
  calculateArcLineIntersection,
  calculateNodeLineIntersection,
  calculatContextualIntersection,
  calculateDistance,
}
