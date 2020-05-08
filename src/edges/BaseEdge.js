
import clamp from "clamp-js"
import {
  calculateNodeLineIntersection, calculatContextualIntersection,


} from "../utils/Calculations"

/**
 * This is the base class for edges.
 *
 * @category SVG Representations
 * @subcategory Edges
 * @property {Data} data The loaded data element from a database.
 * @property {Canvas} canvas The nested canvas to render the edge on.
 * @property {BaseNode} fromNode The starting node reference.
 * @property {BaseNode} toNode The ending node reference.
 */
class BaseEdge {
  constructor(data, canvas, fromNode, toNode) {
    this.svg = null
    this.data = data
    this.canvas = canvas
    this.fromNode = fromNode
    this.toNode = toNode
    this.label = data.label || null
    this.config = { ...data.config }


    // node position
    this.initialX = 0
    this.initialY = 0
    this.finalToX = 0
    this.finalToY = 0
    this.finalFromX = 0
    this.finalFromY = 0


    this.opacity = 1
    this.isHidden = false
    this.layoutId = null
  }


  /**
   * Calculates the two points indicating the starting and end point for edges.
   *
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.isContextualParent=false] Determines if the current edge is a contextual parent edge.
   * @param {Number} [opts.isContextualChild=false] Determines if the current edge is a contextual child edge
   */
  calculateEdge({ isContextualParent = false, isContextualChild = false, isReRender = false }) {
    // the coordinates for the from node
    let fx = this.fromNode.getFinalX()
    const fy = this.fromNode.getFinalY()

    // the coordinates for the to node
    let tx = this.toNode.getFinalX()
    const ty = this.toNode.getFinalY()

    if (isContextualParent) {
      fx = tx
    }

    if (isContextualChild) {
      tx = fx
    }

    // calculate intersections
    let toIntersection
    let fromIntersection

    if (isContextualParent === false && isContextualChild === false) {
      fromIntersection = calculateNodeLineIntersection(fx, fy, tx, ty, this.fromNode)
      toIntersection = calculateNodeLineIntersection(tx, ty, fx, fy, this.toNode)
    }


    if (isContextualParent) {
      fromIntersection = calculatContextualIntersection(fx, fy, tx, ty, this.fromNode, this.canvas)
      toIntersection = calculatContextualIntersection(tx, ty, fx, fy, this.toNode, this.canvas)
      if (toIntersection.x === 0 && toIntersection.y === 0) {
        this.isHidden = true
      }
    }


    if (isContextualChild) {
      fromIntersection = calculatContextualIntersection(fx, fy, tx, ty, this.fromNode, this.canvas)
      toIntersection = calculatContextualIntersection(tx, ty, fx, fy, this.toNode, this.canvas)
      if (toIntersection.x === 0 && toIntersection.y === 0) {
        this.isHidden = true
      }
    }


    this.finalFromX = fromIntersection.x
    this.finalFromY = fromIntersection.y

    this.finalToX = toIntersection.x
    this.finalToY = toIntersection.y
  }


  /**
   * Creates the initial SVG object reference.
   * @return {SVG} A bare bone SVG object.
   */
  createSVGElement(id) {
    // create the SVG object on the canvas.
    const svg = this.canvas.group()


    // attach some CSS and an ID
    svg.css("cursor", "default")
    svg.id(id)


    // move to the back
    svg.back()
    return svg
  }


  /**
   * Removes the rendered SVG object from the canvas.
   */
  removeSVG({ isContextualEdge = false, isContextualParentOperation = false }) {
    if (isContextualEdge === true) {
      const offset = isContextualParentOperation ? 50 : -50

      if (this.isRendered() === false) return


      const x = (this.finalFromX + this.finalToX) / 2
      const y = ((this.finalFromY + this.finalToY) / 2) + 100
      this.svg.back()
      this.svg
        .animate({ duration: this.config.animationSpeed })
        .transform({ scale: 0.001, position: [x, y + offset] })
        .after(() => {
          try { this.svg.remove() } catch (error) { }
          this.svg = null
        })
    } else {
      if (this.isRendered() === false) return

      const x = (this.finalFromX + this.finalToX) / 2
      const y = ((this.finalFromY + this.finalToY) / 2) + 100
      this.svg.back()
      this.svg
        .animate({ duration: this.config.animationSpeed })
        .transform({ scale: 0.001, position: [x, y] })
        .after(() => {
          try { this.svg.remove() } catch (error) { }
          this.svg = null
        })
    }
  }


  /**
   * Determins if the SVG object is rendered.
   * @returns True, if the SVG is rendered, else false.
   */
  isRendered() {
    return this.svg !== null
  }


  /**
   * Creates the edges label using HTML.
   * @return {SVG} The label in HTML format.
   *
   * @see https://svgjs.com/docs/3.0/shape-elements/#svg-foreignobject
   * @see https://github.com/xavi160/Clamp.js
   */
  createLabel() {
    // create the foreign object which holds
    const fobj = this.canvas.foreignObject(0, 0)

    // simply return if there is no label provided
    if (this.label === "") return fobj


    // create the label background
    const background = document.createElement("div")
    background.style.background = this.config.labelBackground
    background.style.padding = `${this.config.offset / 2}px`
    background.style.textAlign = "center"
    background.style.width = `${this.config.labelWidth}px`
    background.style.wordWrap = "break-word"
    background.setAttribute("id", "label")


    // create the actual label text
    const label = document.createElement("p")
    label.innerText = this.label
    label.style.color = this.config.labelColor
    label.style.fontSize = `${this.config.labelFontSize}px`
    label.style.fontFamily = this.config.labelFontFamily
    label.style.fontWeight = this.config.labelFontWeight
    label.style.fontStyle = this.config.labelFontStyle


    // adjust the the line size
    clamp(label, { clamp: this.config.labelLineClamp })


    // add the label to the background element
    background.appendChild(label)


    // add the HTML to the SVG
    fobj.add(background)


    // disable the user-select css property
    fobj.css("user-select", "none")


    // adjust size and position of the creted svg object
    fobj.width(background.clientWidth)
    fobj.height(background.clientHeight)
    fobj.center(this.finalFromX, this.finalFromY)

    return fobj
  }


  /**
   * Updates the new label.
   * @param {String} label The new label.
   */
  setLabel(label) {
    this.label = label || null
  }


  setFinalToX(finalToX) {
    this.finalToX = finalToX
  }

  setFinalToY(finalToY) {
    this.finalToY = finalToY
  }

  getFinalToX() {
    return this.finalToX
  }

  getFinalToY() {
    return this.finalToY
  }

  setFinalFromX(finalFromX) {
    this.finalFromX = finalFromX
  }

  setFinalFromY(finalFromY) {
    this.finalFromY = finalFromY
  }

  getFinalFromX() {
    return this.finalFromX
  }

  getFinalFromY() {
    return this.finalFromY
  }

  setLayoutId(layoutId) {
    this.layoutId = layoutId
  }

  getLayoutId() {
    return this.layoutId
  }

  getToNode() {
    return this.toNode
  }

  getFromNode() {
    return this.fromNode
  }
}

export default BaseEdge
