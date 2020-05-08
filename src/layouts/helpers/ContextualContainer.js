
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
    this.finalX = 0
    this.finalY = 0
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

    if (type === "assignedParent") {
      container.radius(this.config.assignedParentContainerBorderRadius)
      container.fill(this.config.assignedParentContainerBackgroundColor)
      container.stroke({ width: this.config.assignedParentContainerBorderStrokeWidth })
      container.stroke({ color: this.config.assignedParentContainerBorderStrokeColor })
    }

    if (type === "assignedChild") {
      container.radius(this.config.assignedChildContainerBorderRadius)
      container.fill(this.config.assignedChildContainerBackgroundColor)
      container.stroke({ width: this.config.assignedChildContainerBorderStrokeWidth })
      container.stroke({ color: this.config.assignedChildContainerBorderStrokeColor })
    }


    svg.add(container)
    svg.back()


    // moves the container into position
    svg
      .get(0)
      .center(this.focusNode.getFinalX(), this.focusNode.getFinalY())
      .animate({ duration: this.config.animationSpeed })
      .center(mincx, mincy)
      .width(width)
      .height(minHeight)

    this.finalX = mincx
    this.finalY = mincy
    this.svg = svg
  }


  /**
   * Updates a currently rendered container.
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.areChildrenExpanded=false] Determines if the child container is Expanded.
   * @param {Number} [opts.areParentsExpanded=false] Determines if the parent container is Expanded.
   * @param {Number} [opts.areRisksExpanded=false] Determines if the risk container is Expanded.
   * @param {Number} [opts.areAssignedParentExpanded=false] Determines if the assigned parent nodes container is Expanded.
   * @param {Number} [opts.areAssignedChildrenExpanded=false] Determines if the assigned child nodes container is Expanded.
   */
  update({
    areChildrenExpanded = false,
    areParentsExpanded = false,
    areRisksExpanded = false,
    areAssignedParentExpanded = false,
    areAssignedChildrenExpanded = false,
  }) {
    const {
      minHeight, maxHeight, mincx, mincy, maxcx, maxcy,
    } = this.containerInfo


    // cancel an ongoing animation
    if (this.animation !== null) {
      this.animation.unschedule()
    }

    // updates the child container
    if (this.type === "child") {
      if (areChildrenExpanded === true) {
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
      if (areRisksExpanded === true) {
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
      if (areParentsExpanded === true) {
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

    if (this.type === "assignedParent") {
      if (areAssignedParentExpanded === true) {
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

    if (this.type === "assignedChild") {
      if (areAssignedChildrenExpanded === true) {
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

  setFinalX(finalX) {
    this.finalX = finalX
  }

  setFinalY(finalY) {
    this.finalY = finalY
  }
}

export default ContextualConainer
