import { calculateDistance } from "../../utils/Calculations"

/**
 * This class calculates and renders a connection between a container and the focus node.
 *
 * @category Layouts
 * @subcategory Helpers
 * @property {Canvas} canvas The current canvas to render the element on.
 * @property {BaseNode} connectedNode The currently active focus node.
 * @property {ContextualContainer} container The container which to connect to.
 * @property {Array.<BaseNode>} containerNodes An array of nodes within the container.
 * @property {ContextualLayoutConfiguration} config An object containing visual restrictions.
 */
class ContextualContainerConnection {
  constructor(canvas, connectedNode, container, containerNodes, config) {
    this.svg = null
    this.canvas = canvas
    this.connectedNode = connectedNode
    this.container = container
    this.containerNodes = containerNodes
    this.config = config

    this.type = "parent"

    // layout info
    this.layoutId = 0
    this.finalX = 0
    this.finalY = 0
  }


  /**
   * Calculats and renders the container connection.
   */
  render() {
    const svg = this.canvas.group()
    svg.id(`contextualContainerConnection#${this.layoutId}`)

    const { containerInfo } = this.container


    // line between container and focus node
    let x0
    let y0
    let x1
    let y1

    if (this.type === "parent") {
      x0 = this.connectedNode.getFinalX()
      y0 = this.connectedNode.getFinalY() - this.connectedNode.getMaxHeight() / 2 - this.connectedNode.config.offset / 2

      x1 = containerInfo.maxcx
      y1 = containerInfo.maxcy + containerInfo.maxHeight / 2 + this.connectedNode.config.offset / 2
    }

    if (this.type === "child") {
      x0 = containerInfo.maxcx
      y0 = containerInfo.maxcy - containerInfo.maxHeight / 2 - this.connectedNode.config.offset / 2

      x1 = this.connectedNode.getFinalX()
      y1 = this.connectedNode.getFinalY() + this.connectedNode.getMaxHeight() / 2 + this.connectedNode.config.offset / 2
    }

    if (this.type === "assignedChild") {
      x0 = containerInfo.maxcx
      y0 = containerInfo.maxcy - containerInfo.maxHeight / 2 - this.connectedNode.config.offset / 2

      x1 = this.connectedNode.getFinalX()
      y1 = this.connectedNode.getFinalY() + this.connectedNode.getMinHeight() / 2 + this.connectedNode.config.offset / 2
    }

    if (this.type === "assignedParent") {
      x0 = this.connectedNode.getFinalX()
      y0 = this.connectedNode.getFinalY() - this.connectedNode.getMinHeight() / 2 - this.connectedNode.config.offset / 2

      x1 = containerInfo.maxcx
      y1 = containerInfo.maxcy + containerInfo.maxHeight / 2 + this.connectedNode.config.offset / 2
    }


    const dist1 = calculateDistance(x1, y1, x0, y0)


    // calculate points forming the connection
    const a0 = (x0 + x1) / 2
    const b0 = (y0 + y1) / 2

    const a1 = a0 + dist1
    const b1 = b0

    const a2 = a0
    const b2 = b0 + this.config.containerConnectionLineWidth / 2

    const a3 = a2 + (dist1 - this.config.containerConnectionarrowHeight)
    const b3 = b2

    const a4 = a3
    const b4 = b2 + (this.config.containerConnectionArrowWidth - (this.config.containerConnectionLineWidth / 2))

    const a5 = a1
    const b5 = b1

    const a6 = a3
    const b6 = b2 - (this.config.containerConnectionArrowWidth + (this.config.containerConnectionLineWidth / 2))

    const a7 = a3
    const b7 = b0 - this.config.containerConnectionLineWidth / 2

    const a8 = a0
    const b8 = b0 - this.config.containerConnectionLineWidth / 2


    // the actual connection as path argument
    const plot = `
      M ${a2},${b2}
      L ${a3},${b3}
      L ${a4},${b4}
      L ${a5},${b5}
      L ${a6},${b6}
      L ${a7},${b7}
      L ${a8},${b8}
      L ${a2},${b2}
    `


    // create the SVG connection
    const strokeColor = this.config.containerConnectionStrokeColor === "inherit"
      ? "#ffffff"
      : this.config.containerConnectionStrokeColor
    const strokeWidth = this.config.containerConnectionStrokeColor === "inherit"
      ? 0
      : this.config.containerConnectionStrokeWidth

    const path = this.canvas.path(plot).stroke({
      color: strokeColor,
      width: strokeWidth,
      dasharray: this.config.containerConnectionStrokeDasharray,
    })


    // color the connection
    if (this.config.containerConnectionColor === "inherit") {
      if (this.type === "parent") {
        const toColor = this.config.parentContainerBorderStrokeColor
        const fromColor = this.connectedNode.config.borderStrokeColor

        const gradient = this.canvas.gradient("linear", (add) => {
          add.stop(0, fromColor)
          add.stop(1, toColor)
        })
        path.fill(gradient)
      }

      if (this.type === "assignedParent") {
        const toColor = this.config.assignedParentContainerBorderStrokeColor
        const fromColor = this.connectedNode.config.borderStrokeColor

        const gradient = this.canvas.gradient("linear", (add) => {
          add.stop(0, fromColor)
          add.stop(1, toColor)
        })
        path.fill(gradient)
      }

      if (this.type === "child") {
        const toColor = this.connectedNode.config.borderStrokeColor
        const fromColor = this.config.childContainerBorderStrokeColor

        const gradient = this.canvas.gradient("linear", (add) => {
          add.stop(0, fromColor)
          add.stop(1, toColor)
        })
        path.fill(gradient)
      }

      if (this.type === "assignedChild") {
        const toColor = this.connectedNode.config.borderStrokeColor
        const fromColor = this.config.assignedChildContainerBorderStrokeColor

        const gradient = this.canvas.gradient("linear", (add) => {
          add.stop(0, fromColor)
          add.stop(1, toColor)
        })
        path.fill(gradient)
      }
    } else {
      path.fill(this.config.containerConnectionColor)
    }


    // moves the connection into position
    path.center((x0 + x1) / 2, (y0 + y1) / 2)
    path.rotate(-90)
    svg.add(path)
    svg.back()


    // calculate the final position
    const finalX = svg.bbox().cx
    const finalY = svg.bbox().cy
    this.finalX = finalX
    this.finalY = finalY


    // animate into final position
    svg
      .attr({ opacity: 0 })
      .center(this.connectedNode.getFinalX(), this.connectedNode.getFinalY())
      .animate({ duration: this.config.animationSpeed })
      .center(finalX, finalY)
      .attr({ opacity: 1 })

    this.svg = svg
  }


  /**
   * Transforms the container connection into its final position.
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.isParentOperation=false] An indication whether a parent or child node was elected new focus.
   * @param {Number} [opts.X=this.finalX] The calculated final X position.
   * @param {Number} [opts.X=this.finalY] The calculated final X position.
   */
  transformToFinalPosition({ isParentOperation = false, X = this.node.finalX, Y = this.node.finalY }) {
    if (isParentOperation) {
      this.svg
        .animate({ duration: this.config.animationSpeed })
        .center(X, Y - 50)
    } else {
      this.svg
        .animate({ duration: this.config.animationSpeed })
        .center(X, Y + 50)
    }
  }


  /**
   * Removes the container connection.
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.withAnimation=false] An indication whether to use an animation to remove the SVG object.
   * @param {Number} [opts.X=this.finalX] The calculated final X position.
   * @param {Number} [opts.X=this.finalY] The calculated final X position.
   */
  removeSVG({ withAnimation = false, X = this.finalX, Y = this.finalY }) {
    if (withAnimation === true) {
      if (this.isRendered()) {
        this
          .svg
          .animate({ duration: this.config.animationSpeed })
          .center(X, Y)
          .attr({ opacity: 0 })
          .after(() => {
            this.svg.remove()
            this.svg = null
          })
      }
    } else if (this.isRendered()) {
      this.svg.remove()
      this.svg = null
    }
  }


  /**
   * Determins if the SVG object is rendered.
   * @returns True, if the SVG is rendered, else false.
   */
  isRendered() {
    return this.svg !== null
  }

  setType(type) {
    this.type = type
  }

  getType() {
    return this.type
  }

  setLayoutId(layoutId) {
    this.layoutId = layoutId
  }

  getFinalX() {
    return this.finalX
  }

  getFinalY() {
    return this.finalY
  }
}


export default ContextualContainerConnection
