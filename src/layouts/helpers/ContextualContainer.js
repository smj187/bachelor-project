
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

  render({ isParentOperation = false }) {

    const svg = this.canvas.group()
    svg.id(`contextualContainer#${this.layoutId}`)

    const { type, minHeight, width, mincx, mincy } = this.containerInfo

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



    svg
      .get(0)
      .center(this.focusNode.getFinalX(), this.focusNode.getFinalY())
      .animate({ duration: this.config.animationSpeed })
      .center(mincx, mincy)
      .width(width)
      .height(minHeight)

    this.svg = svg
  }

  update({ areChildrenExpended = false, areParentsExpended = false, areRisksExpended = false }) {
    const { type, minHeight, maxHeight, width, mincx, mincy, maxcx, maxcy } = this.containerInfo

    // cancel an ongoing animation
    if (this.animation !== null) {
      this.animation.unschedule()
    }

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


  transformToFinalPosition(X = this.finalX, Y = this.finalY) {
    this
      .svg
      .back()

    this
      .svg
      .animate({ duration: this.config.animationSpeed })
      .size(this.w, this.h)
      .center(X, Y)
  }


  removeContainer(X, Y) {
    if (this.svg !== null) {
      this
        .svg
        .attr({ opacity: 1 })
        .animate({ duration: this.config.animationSpeed })
        .transform({ position: [X, Y] })
        .attr({ opacity: 0 })
        .after(() => {
          this.svg.remove()
          this.svg = null
        })
    }
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

  isRendered() {
    return this.svg !== null
  }

  getFinalX() {
    return this.finalX
  }


  getFinalY() {
    return this.finalY
  }
}

export default ContextualConainer
