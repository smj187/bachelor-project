import { calculateNodeLineIntersection, calculateDistance } from "../../utils/Calculations"


/**
 * This class calculates and renders an indication if more child nodes may be available within a tree layout.
 *
 * @category Layouts
 * @subcategory Helpers
 * @property {Canvas} canvas The current canvas to render the element on.
 * @property {BaseNode} node The currently active and real leaf node representaion.
 * @property {TreeLayoutConfiguration} config An object containing visual restrictions.
 */
class TreeLeaf {
  constructor(canvas, node, layoutConfig) {
    this.svg = null
    this.canvas = canvas

    // node
    this.id = node.id
    this.node = node
    this.nodeSize = node.childrenIds.length
    this.config = layoutConfig

    // position
    this.finalX = 0
    this.finalY = 0
    this.distanceToNode = 0

    // this.isHorizontal = layoutConfig.orientation === "horizontal"
    this.isReRender = false
  }


  /**
   * Calculates and renders the leaf representation.
   */
  render() {
    const svg = this.canvas.group()
    svg.id(`treeLeaf#${this.node.id}`)

    const w = this.node.nodeSize === "min" ? this.node.config.minWidth : this.node.config.maxWidth
    const h = this.node.nodeSize === "min" ? this.node.config.minHeight : this.node.config.maxHeight


    // determins the type of the currently rendered tree
    const isHorizontal = this.config.orientation === "horizontal"

    // the distance in which all leafs are placed
    const spreadBreath = isHorizontal ? Math.min(w * 1.15, h * 1.15) : Math.max(w * 1.075, h * 1.075)

    // set the limit on how many leafs are visible
    const nodeSize = this.nodeSize < this.config.leafIndicationLimit ? this.nodeSize : this.config.leafIndicationLimit


    // to position
    const tx = this.node.getFinalX()
    const ty = this.node.getFinalY()


    // calculate the distance on which leafs will have their start positions for vertical and horizontal
    const vax = this.node.getFinalX() - spreadBreath / 2
    const vay = this.node.getFinalY() + Math.min(w, h)
    const vbx = this.node.getFinalX() + spreadBreath / 2
    const vby = this.node.getFinalY() + Math.min(w, h)

    const hax = this.node.getFinalX() + Math.max(w / 1.25, h / 1.25)
    const hay = this.node.getFinalY() - spreadBreath / 2
    const hbx = this.node.getFinalX() + Math.max(w / 1.25, h / 1.25)
    const hby = this.node.getFinalY() + spreadBreath / 2


    // create an actual SVG path on which the leafs start point lies
    const vHelperLine = this.canvas.path(`M ${vax} ${vay} L ${vbx} ${vby}`).stroke({ width: 0.5, color: "blue" })
    const hHelperLine = this.canvas.path(`M ${hax} ${hay} L ${hbx} ${hby}`).stroke({ width: 0.5, color: "blue" })


    // calculate the starting positions based on a given interval step
    const interval = isHorizontal ? hHelperLine.length() / nodeSize : vHelperLine.length() / nodeSize
    let intervalSpaceUsed = 0
    for (let i = 0; i < nodeSize; i += 1) {
      // calculate the starting point ("from point")
      intervalSpaceUsed += interval / 2
      const startingPoint = isHorizontal
        ? hHelperLine.pointAt(intervalSpaceUsed)
        : vHelperLine.pointAt(intervalSpaceUsed)
      intervalSpaceUsed += interval / 2

      // calculate the intersection between leaf and node
      const nodeLeafIntersection = calculateNodeLineIntersection(tx, ty, startingPoint.x, startingPoint.y, this.node)

      // calculate the actual position where to start the leaf from
      const fromX = startingPoint.x
      const fromY = startingPoint.y

      const toX = nodeLeafIntersection.x
      const toY = nodeLeafIntersection.y


      // create simple SVG representation
      const simplePath = this.canvas.path(`M${fromX},${fromY} L${toX},${toY}`).stroke({
        width: this.config.leafStrokeWidth,
        color: this.config.leafStrokeColor,
      })


      // create a re-useable marker
      const defId = `defaultTreeLeafMarker#${this.layoutId}`
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
    vHelperLine.remove()
    hHelperLine.remove()


    // collect position
    const finalX = svg.bbox().cx
    const finalY = svg.bbox().cy
    const coords = this.node.coords[this.node.coords.length - 2] || this.node.coords[0]
    const startX = this.isReRender ? coords[0] : this.node.getCurrentX()
    const startY = this.isReRender ? coords[1] : this.node.getCurrentY()

    // animate into position
    svg
      .attr({ opacity: 0 })
      .center(startX, startY)
      .animate({ duration: this.config.animationSpeed })
      .transform({ position: [finalX, finalY] })
      .attr({ opacity: 1 })

    // save values for transformation later
    this.finalX = finalX
    this.finalY = finalY

    // calculate absolute leaf position
    this.distanceToNode = calculateDistance(finalX, finalY, tx, ty)

    this.svg = svg
  }


  /**
   * Transforms the leaf into the final position.
   * @param {Number} [X=this.node.finalX] The parent's final X render position.
   * @param {Number} [Y=this.node.finalY] The parent's final Y render position.
   */
  transformToFinalPosition({ X = this.node.finalX, Y = this.node.finalY }) {
    // determins the type of the currently rendered tree
    const isHorizontal = this.config.orientation === "horizontal"

    this
      .svg
      .animate({ duration: this.config.animationSpeed })
      .transform({ position: [isHorizontal ? X + this.distanceToNode : X, isHorizontal ? Y : this.finalY] })
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

  setLayoutId(layoutId) {
    this.layoutId = layoutId
  }

  getId() {
    return this.id
  }
}


export default TreeLeaf
