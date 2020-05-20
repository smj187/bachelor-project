import BaseNode from "./BaseNode"
import CustomNodeConfiguration from "../configuration/CustomNodeConfiguration"
import { createMinHTMLLabel, createCustomNodeDetails } from "./helpers/Text"
import { createSVGElement, createSVGNode, createSVGIcon } from "./helpers/Svg"

class CustomNode extends BaseNode {
  constructor(data, canvas, customRepresentation = {}) {
    super(data, canvas)
    this.config = { ...CustomNodeConfiguration, ...data.config, ...customRepresentation }
  }


  transformToPosition() {
    const { nextX, nextY } = this
    const { animationSpeed } = this.config


    // update local references
    this.currentX = nextX
    this.currentY = nextY
    this.coords.push([nextX, nextY])


    // transform into the next position
    this.svg.animate({ duration: animationSpeed }).transform({ position: [nextX, nextY] })
  }


  renderAsMax() {
    const {
      initialX, initialY, nextX, nextY,
    } = this


    const {
      shape,
      maxWidth,
      maxHeight,
      animationSpeed,
      maxIconSize,
      maxIconOpacity,
      maxIconTranslateX,
      maxIconTranslateY,
      maxTextTranslateX,
      maxTextTranslateY,
    } = this.config


    // create svg elements
    const svg = createSVGElement(this.canvas, this.config, this.id, this.nodeSize, this.tooltipText)
    const node = createSVGNode(this.canvas, this.config)
    const icon = createSVGIcon(this.canvas, this.config, this.type)
    const text = createCustomNodeDetails(this.canvas, this.config, this.label, this.description)

    svg.add(node)
    svg.add(icon)
    svg.add(text)


    // transform into position
    node
      .size(maxWidth, maxHeight)

    icon
      .size(maxIconSize, maxIconSize)
      .attr({ opacity: maxIconOpacity })
      .center(node.bbox().cx, node.bbox().cy)
      .dmove(maxIconTranslateX, maxIconTranslateY)

    text
      .center(node.bbox().cx, node.bbox().cy)
      .dmove(maxTextTranslateX, maxTextTranslateY)

    svg
      .center(initialX, initialY)
      .scale(0.001)
      .animate({ duration: animationSpeed })
      .transform({ position: [nextX, nextY], scale: 1 })


    // update local references
    this.shape = shape
    this.currentWidth = maxWidth
    this.currentHeight = maxHeight
    this.nodeSize = "max"
    this.currentX = nextX
    this.currentY = nextY
    this.coords.push([nextX, nextY])
    this.svg = svg
  }


  renderAsMin() {
    const {
      initialX, initialY, nextX, nextY,
    } = this

    const {
      shape,
      minWidth,
      minHeight,
      animationSpeed,
      minIconSize,
      minIconOpacity,
      minIconTranslateX,
      minIconTranslateY,
      minLabelTranslateX,
      minLabelTranslateY,
    } = this.config


    // create svg elements
    const svg = createSVGElement(this.canvas, this.config, this.id, this.nodeSize, this.tooltipText)
    const node = createSVGNode(this.canvas, this.config)
    const icon = createSVGIcon(this.canvas, this.config, this.type)
    const text = createMinHTMLLabel(this.canvas, this.config, this.label)

    svg.add(node)
    svg.add(icon)
    svg.add(text)


    // transform into position
    node
      .size(minWidth, minHeight)

    icon
      .size(minIconSize, minIconSize)
      .attr({ opacity: minIconOpacity })
      .center(node.bbox().cx, node.bbox().cy)
      .dmove(minIconTranslateX, minIconTranslateY)

    text
      .center(node.bbox().cx, node.bbox().cy)
      .dmove(minLabelTranslateX, minLabelTranslateY)

    svg
      .center(initialX, initialY)
      .scale(0.001)
      .animate({ duration: animationSpeed })
      .transform({ position: [nextX, nextY], scale: 1 })


    // update local references
    this.shape = shape
    this.currentWidth = minWidth
    this.currentHeight = minHeight
    this.nodeSize = "min"
    this.currentX = nextX
    this.currentY = nextY
    this.coords.push([nextX, nextY])
    this.svg = svg
  }


  transformToMax() {
    const {
      currentX, currentY, nextX, nextY,
    } = this


    const {
      maxWidth,
      maxHeight,
      animationSpeed,
      maxIconSize,
      maxIconOpacity,
      maxIconTranslateX,
      maxIconTranslateY,
      maxTextTranslateX,
      maxTextTranslateY,
    } = this.config


    // transform the current node into a detailed version
    this
      .svg
      .get(0)
      .animate({ duration: animationSpeed })
      .width(maxWidth)
      .height(maxHeight)
      .center(currentX, currentY)


    // remove old svg elements
    this
      .svg
      .get(2)
      .remove()

    this
      .svg
      .get(1)
      .remove()


    // create the new svg elements
    const icon = createSVGIcon(this.canvas, this.config, this.type)
    const text = createCustomNodeDetails(this.canvas, this.config, this.label, this.description)

    this.svg.add(icon)
    this.svg.add(text)


    // move new svg elements into position
    icon
      .attr({ opacity: 0 })
      .size(maxIconSize, maxIconSize)
      .filterWith((add) => { add.gaussianBlur(25, 25); add.id(`transformBlurIcon${this.id}`) })
      .center(this.svg.get(0).bbox().cx, this.svg.get(0).bbox().cy)
      .dmove(maxIconTranslateX, maxIconTranslateY)
      .animate({ duration: animationSpeed })
      .attr({ opacity: maxIconOpacity })
      .during((time = this) => {
        if (time > 0.85 && icon.filterer() !== null) {
          icon.unfilter()

          const filters = [...this.canvas.defs().node.childNodes].find((d) => d.id === `transformBlurIcon${this.id}`)
          filters.remove()
        }
      })

    text
      .attr({ opacity: 0 })
      .center(this.svg.get(0).bbox().cx, this.svg.get(0).bbox().cy)
      .dmove(maxTextTranslateX, maxTextTranslateY)
      .filterWith((add) => { add.gaussianBlur(11, 11); add.id(`transformBlurText${this.id}`) })
      .animate({ duration: animationSpeed })
      .attr({ opacity: 1 })
      .during((time = this) => {
        if (time > 0.85 && text.filterer() !== null) {
          text.unfilter()

          const filters = [...this.canvas.defs().node.childNodes].find((d) => d.id === `transformBlurText${this.id}`)
          filters.remove()
        }
      })


    // move the node into the next position
    this
      .svg
      .animate({ duration: animationSpeed })
      .transform({ position: [nextX, nextY] })


    // update local references
    this.currentWidth = maxWidth
    this.currentHeight = maxHeight
    this.nodeSize = "max"
    if (this.currentX !== nextX && this.currentY !== nextY) {
      this.currentX = nextX
      this.currentY = nextY
      this.coords.push([nextX, nextY])
    }
  }


  transformToMin() {
    const {
      currentX, currentY, nextX, nextY,
    } = this

    const {
      animationSpeed,
      minWidth,
      minHeight,
      minIconSize,
      minIconOpacity,
      minIconTranslateX,
      minIconTranslateY,
      minLabelTranslateX,
      minLabelTranslateY,
    } = this.config


    // transform the current node into a minimal version
    this
      .svg
      .get(0)
      .animate({ duration: animationSpeed })
      .width(minWidth)
      .height(minHeight)
      .center(currentX, currentY)


    // remove old svg elements
    this
      .svg
      .get(2)
      .remove()

    this
      .svg
      .get(1)
      .remove()


    // create the new svg elements
    const icon = createSVGIcon(this.canvas, this.config, this.type)
    const text = createMinHTMLLabel(this.canvas, this.config, this.label)

    this.svg.add(icon)
    this.svg.add(text)


    // move new svg elements into position
    icon
      .attr({ opacity: 0 })
      .size(minIconSize, minIconSize)
      .filterWith((add) => { add.gaussianBlur(25, 25); add.id(`transformBlurIcon${this.id}`) })
      .center(this.svg.get(0).bbox().cx, this.svg.get(0).bbox().cy)
      .dmove(minIconTranslateX, minIconTranslateY)
      .animate({ duration: animationSpeed })
      .attr({ opacity: minIconOpacity })
      .during((time = this) => {
        if (time > 0.85 && icon.filterer() !== null) {
          icon.unfilter()

          const filters = [...this.canvas.defs().node.childNodes].find((d) => d.id === `transformBlurIcon${this.id}`)
          filters.remove()
        }
      })

    text
      .attr({ opacity: 0 })
      .center(this.svg.get(0).bbox().cx, this.svg.get(0).bbox().cy)
      .dmove(minLabelTranslateX, minLabelTranslateY)
      .filterWith((add) => { add.gaussianBlur(11, 11); add.id(`transformBlurText${this.id}`) })
      .animate({ duration: animationSpeed })
      .attr({ opacity: 1 })
      .during((time = this) => {
        if (time > 0.85 && text.filterer() !== null) {
          text.unfilter()

          const filters = [...this.canvas.defs().node.childNodes].find((d) => d.id === `transformBlurText${this.id}`)
          filters.remove()
        }
      })


    // move the node into the next position
    this
      .svg
      .animate({ duration: animationSpeed })
      .transform({ position: [nextX, nextY] })


    // update local references
    this.currentWidth = minWidth
    this.currentHeight = minHeight
    this.nodeSize = "min"
    if (this.currentX !== nextX && this.currentY !== nextY) {
      this.currentX = nextX
      this.currentY = nextY
      this.coords.push([nextX, nextY])
    }
  }
}

export default CustomNode
