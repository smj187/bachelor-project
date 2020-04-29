import { shape, intersect } from "svg-intersections"

/**
 * @typedef {Object} TreeLeafConfiguration
 * @property {Number} animationSpeed The animationSpeed inherited from the tree layout configuration.
 * @property {String} strokeWidth The edge stroke width inherited from the tree layout configuration.
 * @property {String} strokeColor The edge color inherited from the tree layout configuration.
 * @property {String} marker The edge arrow head inherited from the tree layout configuration.
 */


/**
 * This class calculates and renders an indication if more child nodes may be available.
 * @property {Canvas} canvas The current canvas to render the element on.
 * @property {BaseNode} node The currently active and real leaf node representaion.
 * @property {Number} renderLimit Limits how many edges are visible.
 * @property {TreeLeafConfiguration} config An object containing visual restrictions.
 * @property {Boolean} [isHorizontal=false] Determins if the current tree is vertical or horizontal.
 */
class TreeLeaf {
  constructor(canvas, node, renderLimit, config, isHorizontal = false) {
    this.svg = null
    this.canvas = canvas

    // node
    this.id = node.id
    this.node = node
    this.nodeSize = node.childrenIds.length
    this.leafIndicationLimit = renderLimit
    this.config = config

    // position
    this.initialX = 0
    this.initialY = 0
    this.finalX = 0
    this.finalY = 0
    this.currentX = 0
    this.currentY = 0

    // determins the space between the node and the edge position
    const w = this.node.nodeSize === "min" ? this.node.config.minWidth : this.node.config.maxWidth
    const h = this.node.nodeSize === "min" ? this.node.config.minHeight : this.node.config.maxHeight
    this.translateX = this.node.nodeSize === "min" ? w / 4 : w / 4
    this.translateY = this.node.nodeSize === "min" ? h / 4 : h / 4

    this.isHorizontal = isHorizontal
    this.isReRender = false
  }


  /**
   * Calculates and renders the leaf representation.
   */
  render() {
    const svg = this.canvas.group().draggable()

    const nodeSize = this.nodeSize < this.leafIndicationLimit ? this.nodeSize : this.leafIndicationLimit
    const w = this.node.nodeSize === "min" ? this.node.config.minWidth : this.node.config.maxWidth
    const h = this.node.nodeSize === "min" ? this.node.config.minHeight : this.node.config.maxHeight
    const spacing = this.node.config.offset
    const tx = this.node.getFinalX()
    const ty = this.node.getFinalY()

    // this.canvas.circle(5).fill("#75f").center(tx, ty)


    // create helper line, indicating possible children
    let edgesStartingLine
    if (this.isHorizontal === true) {
      const x0 = tx + w / 2 + this.translateX + spacing
      const y0 = ty + this.node.currentHeight * 0.6
      edgesStartingLine = this
        .canvas
        .path(`M ${x0} ${y0} v${this.node.currentHeight * 1.15}`)
        .stroke({ width: 0, color: "blue" })
        .center(tx + w / 2 + this.translateX + spacing, ty)
    } else {
      edgesStartingLine = this
        .canvas
        .path(`M 0 0 h${this.node.currentWidth * 1.35}`)
        .stroke({ width: 0, color: "red" })
        .center(tx, ty + h / 2 + spacing + this.translateY)
    }

    // calculates unique positions across the helper line
    const interval = edgesStartingLine.length() / nodeSize
    let intervalSpaceUsed = 0
    for (let i = 0; i < nodeSize; i += 1) {
      const p = edgesStartingLine.pointAt(intervalSpaceUsed)
      intervalSpaceUsed += interval

      // either horizontal or vertical offset
      const fx = this.isHorizontal ? p.x : p.x + interval / 2
      const fy = this.isHorizontal ? p.y + interval / 2 : p.y

      const { points } = intersect(shape("rect", {
        x: tx - w / 2 - spacing / 2,
        y: ty - h / 2 - spacing / 2,
        width: w + spacing,
        height: h + spacing,
        rx: 0,
        ry: 0,
      }), shape("line", {
        x1: fx,
        y1: fy,
        x2: tx,
        y2: ty,
      }))

      // create simple SVG representation
      const simplePath = this.canvas.path(`M${fx},${fy} L${points[0].x},${points[0].y}`).stroke({
        width: this.config.strokeWidth,
        color: this.config.strokeColor,
      })

      // create a re-useable marker
      const index = [...this.canvas.defs().node.childNodes].findIndex((d) => d.id === "defaultLeafMarker")
      if (index === -1) {
        const marker = this.canvas.marker(12, 6, (add) => {
          add.path(this.config.marker).fill(this.config.strokeColor).dx(1)
        })
        marker.id("defaultLeafMarker")
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

    // put it into position
    const x = this.isHorizontal
      ? this.node.getFinalX() + w / 2 + this.translateX / 2 + spacing
      : this.node.getFinalX()
    const y = this.isHorizontal
      ? this.node.getFinalY()
      : this.node.getFinalY() + h / 2 + this.translateY / 2 + spacing


    const coords = this.node.coords[this.node.coords.length - 2] || this.node.coords[0]
    const cx = this.isReRender ? coords[0] : this.node.currentX
    const cy = this.isReRender ? coords[1] : this.node.currentY


    svg
      .attr({ opacity: 0 })
      .center(cx, cy)
      .animate({ duration: this.config.animationSpeed })
      .transform({ position: [x, y] })
      .attr({ opacity: 1 })
    this.finalX = svg.cx()
    this.finalY = svg.cy()

    // remove helper line
    edgesStartingLine.remove()

    this.svg = svg
  }


  /**
   * Transforms the leaf into the final position.
   * @param {Number} [X=this.node.finalX] The parent's final X render position.
   * @param {Number} [Y=this.node.finalY] The parent's final Y render position.
   */
  transformToFinalPosition(X = this.node.finalX, Y = this.node.finalY) {
    const w = this.node.nodeSize === "min" ? this.node.config.minWidth : this.node.config.maxWidth
    const h = this.node.nodeSize === "min" ? this.node.config.minHeight : this.node.config.maxHeight

    const x = this.isHorizontal ? X + w / 2 + this.translateX / 2 + this.node.config.offset : X
    const y = this.isHorizontal ? Y : Y + this.translateY / 2 + this.node.config.offset + h / 2

    this
      .svg
      .animate({ duration: this.config.animationSpeed })
      .transform({ position: [x, y] })
  }

  /**
   * Removes the leaf node from the canvas and resets clears its SVG representation.
   */
  removeLeaf() {
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

  setIsReRender(isReRender) {
    this.isReRender = isReRender
  }

  setFinalX(finalX) {
    this.finalX = finalX
  }

  setFinalY(finalY) {
    this.finalY = finalY
  }

  setInitialX(initialX) {
    this.initialX = initialX
  }

  setInitialY(initialY) {
    this.initialY = initialY
  }
}


export default TreeLeaf
