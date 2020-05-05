
import { calculateNodeLineIntersection } from "../../utils/Calculations"


/**
 * This class calculates and renders an indication if more child nodes may be available within a radial layout.
 * 
 * @category Layouts
 * @subcategory Helpers
 * @property {Canvas} canvas The current canvas to render the element on.
 * @property {BaseNode} node The currently active and real leaf node representaion.
 * @property {BaseNode} root The root node in the layout.
 * @property {RadialLayoutConfiguration} config An object containing visual restrictions.
 */
class RadialLeaf {
  constructor(canvas, node, root, layoutConfig) {
    this.svg = null
    this.canvas = canvas
    this.config = layoutConfig
    this.layoutId = null

    // node
    this.id = node.id
    this.node = node
    this.nodeSize = node.childrenIds.length
    this.parentChildren = 0
    this.root = root


    // radius
    const w = this.node.nodeSize === "min" ? this.node.config.minWidth : this.node.config.maxWidth
    const h = this.node.nodeSize === "min" ? this.node.config.minHeight : this.node.config.maxHeight
    const nodeSize = Math.max(w, h)

    // calculate node radius
    this.nodeRadius = nodeSize * 1.35

    // calculate new leaf startpoint radius position
    const initialRadius = node.getDepth() === 0
      ? nodeSize * 1.35
      : (nodeSize * 1.35) + (nodeSize * node.getDepth())
    this.leafRadius = initialRadius + (nodeSize * node.getDepth()) + nodeSize
  }


  /**
   * Calculates and renders the leaf representation.
   * @param {Boolean} isReRender Determines if the render process is triggered by a re-render operation.
   */
  render({ isReRender = false }) {
    const svg = this.canvas.group()
    svg.id(`radialLeaf#${this.node.id}`)

    const w = this.node.nodeSize === "min" ? this.node.config.minWidth : this.node.config.maxWidth
    const h = this.node.nodeSize === "min" ? this.node.config.minHeight : this.node.config.maxHeight


    // the distance in which all leafs are placed
    const spreadBreath = Math.max(w * 1.15, h * 1.15)

    // set the limit on how many leafs are visible
    const nodeSize = this.nodeSize < this.config.leafIndicationLimit ? this.nodeSize : this.config.leafIndicationLimit

    // determins if the current leaf a leaf for the root node
    const isRootLeaf = this.node.childrenIds.length > 0 && this.node.children.length === 0 && this.node.depth === 0


    // calculate the outer circle where all leafs have their start position
    const a = this.leafRadius * this.config.hAspect + h / 4
    const b = this.leafRadius * this.config.wAspect + w / 4
    const myArc = `
            M ${this.root.getFinalX() - a / 2},${this.root.getFinalY()}
            A ${a / 2},${b / 2} 0 0,0 ${this.root.getFinalX() + a / 2},${this.root.getFinalY()}
            A ${a / 2},${b / 2} 0 0,0 ${this.root.getFinalX() - a / 2},${this.root.getFinalY()}
        `

    // create helper circle that holds from positions for possible leafs
    const helperCircle = this.canvas.path(myArc).fill("none")

    // to position
    const tx = this.node.getFinalX()
    const ty = this.node.getFinalY()


    // find the line which intersects the current node and the outer circle based on the current angle
    const ax = this.root.getFinalX()
    const ay = this.root.getFinalY()
    const bx = this.node.getFinalX()
    const by = this.node.getFinalY()
    const theta = Math.atan2(by - ay, bx - ax)
    const delta = (Math.PI / 180) * 90

    const cx = bx + (this.nodeRadius) * Math.cos(theta)
    const cy = by + (this.nodeRadius) * Math.sin(theta)


    // create two more points to create a vertical helper line that indicates the space available for leafs
    const x0 = cx + (spreadBreath / 2) * Math.cos(theta + delta)
    const y0 = cy + (spreadBreath / 2) * Math.sin(theta + delta)
    const x1 = cx - (spreadBreath / 2) * Math.cos(theta + delta)
    const y1 = cy - (spreadBreath / 2) * Math.sin(theta + delta)


    // create an actual SVG path on which the leafs start point lies
    const helperLine = this.canvas.path(`M ${x0} ${y0} L ${x1} ${y1}`)


    // calculate the starting positions based on a given interval step
    const interval = isRootLeaf === true ? helperCircle.length() / nodeSize : helperLine.length() / nodeSize
    let intervalSpaceUsed = 0
    for (let i = 0; i < nodeSize; i += 1) {
      // calculate the starting point ("from point")
      intervalSpaceUsed += interval / 2
      const startingPoint = isRootLeaf === true
        ? helperCircle.pointAt(intervalSpaceUsed)
        : helperLine.pointAt(intervalSpaceUsed)
      intervalSpaceUsed += interval / 2

      // calculate the intersection between leaf and node
      const nodeLeafIntersection = calculateNodeLineIntersection(tx, ty, startingPoint.x, startingPoint.y, this.node)

      // calculate the current angle between the starting point and leaf intersection point
      const angle = Math.atan2(startingPoint.y - nodeLeafIntersection.y, startingPoint.x - nodeLeafIntersection.x)


      // calculate the actual position where to start the leaf from
      const fromX = nodeLeafIntersection.x + (Math.min(w / 2, h / 2)) * Math.cos(angle)
      const fromY = nodeLeafIntersection.y + (Math.min(w / 2, h / 2)) * Math.sin(angle)

      const toX = nodeLeafIntersection.x
      const toY = nodeLeafIntersection.y


      // create simple SVG representation
      const simplePath = this.canvas.path(`M${fromX},${fromY} L${toX},${toY}`).stroke({
        width: this.config.leafStrokeWidth,
        color: this.config.leafStrokeColor,
      })


      // create a re-useable marker
      const defId = `defaultRadialLeafMarker#${this.layoutId}`
      const index = [...this.canvas.defs().node.childNodes].findIndex((d) => d.id === defId)
      if (index === -1) {
        const marker = this.canvas.marker(12, 6, (add) => {
          add.path(this.config.leafMarker).fill(this.config.leafStrokeColor).dx(1)
        })
        marker.id(defId)
        this.canvas.defs().add(marker)
        simplePath.marker("end", marker)
      } else {
        const marker = this.canvas.defs().get(index)
        simplePath.marker("end", marker)
      }

      // add simple path to the leaf's SVG object
      svg.add(simplePath)
    }

    // move to the background
    svg.back()

    // remove the previously created SVG helper objects
    helperCircle.remove()
    if (isRootLeaf === true) {
      helperLine.remove()
    }


    // put it into position
    const finalX = svg.bbox().cx
    const finalY = svg.bbox().cy
    if (isRootLeaf === false) {
      const coords = this.node.coords[this.node.coords.length - 2] || this.node.coords[0]
      const startX = isReRender ? coords[0] : this.node.getCurrentX()
      const startY = isReRender ? coords[1] : this.node.getCurrentY()


      svg
        .center(startX, startY)
        .animate({ duration: this.config.animationSpeed })
        .transform({ position: [finalX, finalY] })

    } else {
      svg
        .scale(isReRender ? 1 : 0.001)
        .center(tx, ty)
        .animate({ duration: this.config.animationSpeed })
        .transform({ scale: 1, position: [finalX, finalY] })

    }


    this.svg = svg
  }


  /**
   * Transforms the leaf into the final position.
   * @param {Boolean} isReRender Determines if the render process is triggered by a re-render operation.
   */
  transformToFinalPosition({ isReRender = false }) {
    this.removeSVG()
    this.render({ isReRender })
  }


  /**
   * Removes the leaf node from the canvas and resets clears its SVG representation.
   */
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

  setLayoutId(layoutId) {
    this.layoutId = layoutId
  }

  setParentChildren(parentChildren) {
    this.parentChildren = parentChildren
  }
}

export default RadialLeaf
