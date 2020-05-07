
/**
 * This class calculates and renders a background container that collects multiple nodes.
 *
 * @category Layouts
 * @subcategory Helpers
 * @property {Canvas} canvas The current canvas to render the element on.
 * @property {BaseNode} focusNode The currently active focus node.
 * @property {Object} containerInfo An object containing information about where to render the container.
 * @property {ContextualLayoutConfiguration} config An object containing visual restrictions.
 */
class ContextualConainer {
  constructor(canvas, focusNode, containerInfo, config) {
    this.canvas = canvas
    this.svg = null
    this.focusNode = focusNode
    this.containerInfo = containerInfo
    this.config = config


    // layout
    this.layoutId = 0
    this.animation = null
  }


  /**
   * Calculates and renders the container.
   */
  render() {
    const svg = this.canvas.group()
    svg.id(`contextualContainer#${this.layoutId}`)

    const {
      type, minHeight, width, mincx, mincy,
    } = this.containerInfo


    // create the SVG container
    const container = this.canvas.rect(0, 0).center(mincx, mincy)

    if (type === "child") {
      container.radius(this.config.childContainerBorderRadius)
      container.fill(this.config.childContainerBackgroundColor)
      container.stroke({ width: this.config.childContainerBorderStrokeWidth })
      container.stroke({ color: this.config.childContainerBorderStrokeColor })
    }

    if (type === "parent") {
      container.radius(this.config.parentContainerBorderRadius)
      container.fill(this.config.parentContainerBackgroundColor)
      container.stroke({ width: this.config.parentContainerBorderStrokeWidth })
      container.stroke({ color: this.config.parentContainerBorderStrokeColor })
    }

    if (type === "risk") {
      container.radius(this.config.riskContainerBorderRadius)
      container.fill(this.config.riskContainerBackgroundColor)
      container.stroke({ width: this.config.riskContainerBorderStrokeWidth })
      container.stroke({ color: this.config.riskContainerBorderStrokeColor })
    }

    svg.add(container)


    // moves the container into position
    svg
      .get(0)
      .center(this.focusNode.getFinalX(), this.focusNode.getFinalY())
      .animate({ duration: this.config.animationSpeed })
      .center(mincx, mincy)
      .width(width)
      .height(minHeight)

    this.svg = svg
  }


  /**
   * Updates a currently rendered container.
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.areChildrenExpended=false] Determines if the child container is expended.
   * @param {Number} [opts.areParentsExpended=false] Determines if the parent container is expended.
   * @param {Number} [opts.areRisksExpended=false] Determines if the risk container is expended.
   */
  update({ areChildrenExpended = false, areParentsExpended = false, areRisksExpended = false }) {
    const {
      minHeight, maxHeight, mincx, mincy, maxcx, maxcy,
    } = this.containerInfo

    // cancel an ongoing animation
    if (this.animation !== null) {
      this.animation.unschedule()
    }

    // updates the child container
    if (this.type === "child") {
      if (areChildrenExpended === true) {
        this.animation = this
          .svg
          .get(0)
          .animate({ duration: this.config.animationSpeed })
          .height(maxHeight)
          .after(() => { this.animation = null })
      } else {
        this.animation = this
          .svg
          .get(0)
          .animate({ duration: this.config.animationSpeed })
          .height(minHeight)
          .after(() => { this.animation = null })
      }
    }


    // updates the risk container
    if (this.type === "risk") {
      if (areRisksExpended === true) {
        this.animation = this
          .svg
          .get(0)
          .animate({ duration: this.config.animationSpeed })
          .height(maxHeight)
          .after(() => { this.animation = null })
      } else {
        this.animation = this
          .svg
          .get(0)
          .animate({ duration: this.config.animationSpeed })
          .height(minHeight)
          .after(() => { this.animation = null })
      }
    }


    // updates the parent container
    if (this.type === "parent") {
      if (areParentsExpended === true) {
        this.animation = this
          .svg
          .get(0)
          .animate({ duration: this.config.animationSpeed })
          .height(maxHeight)
          .dy((mincy - maxcx) / 2)
          .center(maxcx, maxcy)
          .after(() => { this.animation = null })
      } else {
        this.animation = this
          .svg
          .get(0)
          .animate({ duration: this.config.animationSpeed })
          .height(minHeight)
          .dy((maxcx - mincy) / 2)
          .center(mincx, mincy)
          .after(() => { this.animation = null })
      }
    }
  }


  /**
   * Transforms the container into its final position.
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.isParentOperation=false] An indication whether a parent or child node was elected new focus.
   * @param {Number} [opts.X=this.finalX] The calculated final X position.
   * @param {Number} [opts.X=this.finalY] The calculated final X position.
   */
  transformToFinalPosition({ X = this.finalX, Y = this.finalY }) {
    this
      .svg
      .back()

    this
      .svg
      .animate({ duration: this.config.animationSpeed })
      .size(this.w, this.h)
      .center(X, Y)
  }


  /**
   * Removes the container.
   */
  removeSVG() {
    if (this.isRendered()) {
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

export default ContextualConainer
