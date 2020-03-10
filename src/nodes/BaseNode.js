/* eslint-disable no-bitwise */
import Filter from "@svgdotjs/svg.filter.js"
import clamp from "clamp-js"
import FallbackControlIcon from "../resources/fallbackControlIcon.svg"
import FallbackAssetIcon from "../resources/fallbackAssetIcon.svg"
import FallbackRiskIcon from "../resources/fallbackRiskIcon.svg"
import FallbackCustomIcon from "../resources/fallbackCustomIcon.svg"

// https://medium.com/@yuribett/javascript-abstract-method-with-es6-5dbea4b00027


const LightenDarkenColor = (col, amt) => {
  const num = parseInt(col, 16)
  const r = (num >> 16) + amt
  const b = ((num >> 8) & 0x00FF) + amt
  const g = (num & 0x0000FF) + amt
  const newColor = g | (b << 8) | (r << 16)
  return newColor.toString(16)
}

/**
 * Base class for all node representations
 * @param {Data} data the raw data object to represent
 * @param {Canvas} canvas the svg canvas element to render the node on
 */
class BaseNode {
  constructor(data, canvas) {
    this.svg = null
    this.canvas = canvas
    this.config = {} // set by class

    // node data
    this.id = data.id || -1
    this.label = data.label || ""
    this.type = data.type || "unkown"
    this.tooltipText = data.tooltipText || null
    this.description = data.description || null
    this.keyValuePairs = data.keyValuePairs || []
    this.state = data.state || null


    // node position
    this.initialX = 0
    this.initialY = 0
    this.finalX = 0
    this.finalY = 0
    this.currentX = 0
    this.currentY = 0

    // node info
    this.nodeSize = "min" // minimal or maximal representation
    this.opacity = 1
    this.isHidden = false
    this.currentWidth = 0
    this.currentHeight = 0
  }


  /**
   * Creates the initial SVG element and adds hover effect
   */
  createSVGElement() {
    const svg = this.canvas.group() // .draggable()
    svg.css("cursor", "pointer")
    svg.id(`node#${this.id}`)

    svg.on("mouseover", () => {
      svg.front()

      if (this.tooltipText !== null) {
        svg.on("mousemove", (ev) => {
        // show tooltip
          const tooltip = document.getElementById("tooltip")
          tooltip.innerHTML = this.tooltipText
          tooltip.style.display = "block"

          tooltip.style.left = `${ev.clientX - tooltip.clientWidth / 2}px`
          tooltip.style.top = `${ev.clientY - tooltip.clientHeight - 15}px`
        })
      }


      // remove border dasharray
      const node = this.svg.get(0)
      node.stroke({
        width: this.config.borderStrokeWidth,
        color: this.config.borderStrokeColor,
        dasharray: 0,
      })

      // add hover highlight
      let toDark = this.config.borderStrokeColor.substr(1)
      if (this.type === "requirement") {
        toDark = this.config.backgroundColor.substr(1)
      }

      node.filterWith((add) => {
        const blur = add.offset(0, 0).in(add.$source).gaussianBlur(3)
        const color = add.composite(add.flood(`#${LightenDarkenColor(toDark, -10)}`), blur, "in")
        add.merge(color, add.$source)
      })
    })

    svg.on("mouseout", () => {
      // reset border stroke
      const node = this.svg.get(0)
      node.stroke({
        width: this.config.borderStrokeWidth,
        color: this.config.borderStrokeColor,
        dasharray: this.config.borderStrokeDasharray,
      })

      svg.off("mousemove", null)

      // remove the tooltip
      const tooltip = document.getElementById("tooltip")
      tooltip.style.display = "none"

      // remove hover highlight
      node.filterer().remove()
      const i = [...this.canvas.defs().node.childNodes].findIndex((d) => d.id === "defaultNodeBorderFilter")
      const filter = this.canvas.defs().get(i)
      node.filterWith(filter)
    })
    return svg
  }


  /**
   * Creates the actual SVG node
   * @param {Number} width the node width
   * @param {Number} height the node height
   */
  createNode(width = 0, height = 0) {
    let node = null
    if (this.type === "custom") {
      if (this.config.nodeType === "rect") {
        node = this.canvas.rect(width, height)
      } else if (this.config.nodeType === "ellipse") {
        node = this.canvas.ellipse(width, height)
      } else if (this.config.nodeType === "path") {
        node = this.canvas.path(this.config.svg)
      }
    } else {
      node = this.canvas.rect(width, height)
    }

    node.fill(this.config.backgroundColor)
    node.stroke({
      width: this.config.borderStrokeWidth,
      color: this.config.borderStrokeColor,
      dasharray: this.config.borderStrokeDasharray,
    })
    if (this.config.nodeType !== "path") {
      node.radius(this.config.borderRadius)
    }

    // add light color highlight
    const i = [...this.canvas.defs().node.childNodes].findIndex((d) => d.id === "defaultNodeBorderFilter")
    if (i === -1) {
      const filter = new Filter()
      filter.id("defaultNodeBorderFilter")
      const blur = filter.offset(0, 0).in(filter.$source).gaussianBlur(2)
      const color = filter.composite(filter.flood("#fff"), blur, "in")
      filter.merge(color, filter.$source)
      this.canvas.defs().add(filter)
      node.filterWith(filter)
    } else {
      const filter = this.canvas.defs().get(i)
      node.filterWith(filter)
    }


    return node
  }


  /**
   * Creates an icon with a given icon url or uses the default icon
   * @param {Number} size the width and height for the icon
   */
  createIcon(size = 0) {
    let icon = null
    if (this.config.iconUrl === null) {
      if (this.type === "control") {
        icon = this.canvas.image(FallbackControlIcon)
      }
      if (this.type === "risk") {
        icon = this.canvas.image(FallbackRiskIcon)
      }
      if (this.type === "asset") {
        icon = this.canvas.image(FallbackAssetIcon)
      }
      if (this.type === "custom") {
        icon = this.canvas.image(FallbackCustomIcon)
      }
    } else {
      icon = this.canvas.image(this.config.iconUrl)
    }

    icon.size(size, size)
    return icon
  }


  /**
   * Creates the node label text limited to 2 lines
   * @param {Number} width the label width
   * @param {Number} height the label height
   * @param {String} textAlign how to align the label, default is center
   */
  createLabel(textAlign = "center") {
    const fobj = this.canvas.foreignObject(this.config.minTextWidth, 0)

    const background = document.createElement("div")
    background.style.background = this.config.labelBackground
    background.style.padding = `${this.config.offset / 2}px`
    background.style.textAlign = textAlign
    background.style.width = `${this.config.minTextWidth}px`

    const label = document.createElement("p")
    label.innerText = this.label
    label.style.color = this.config.labelColor
    label.style.fontSize = `${this.config.labelFontSize}px`
    label.style.fontFamily = this.config.labelFontFamily
    label.style.fontWeight = this.config.labelFontWeight
    label.style.fontStyle = this.config.labelFontStyle
    clamp(label, { clamp: 2 })

    background.appendChild(label)
    fobj.add(background)

    // fobj.height(label.clientHeight + this.config.offset) // TODO: remove this

    fobj.dmove(this.config.borderStrokeWidth, this.config.borderStrokeWidth)

    return fobj
  }


  /**
   *
   * @param {Object} config adds or overrides existing config data
   */
  setConfig(config) {
    this.config = { ...this.config, ...config }
  }


  /**
   * Returns the current config for a node
   */
  getConfig() {
    return this.config
  }


  /**
   * Sets the final X position
   * @param {Number} finalX the final X position
   */
  setFinalX(finalX) {
    this.finalX = finalX
  }


  /**
   * Sets the final Y position
   * @param {Number} finalY the final Y position
   */
  setFinalY(finalY) {
    this.finalY = finalY
  }


  /**
   * Sets the final rendering position
   * @param {Number} finalX the final X position
   * @param {Number} finalY the final Y position
   */
  setFinalXY(finalX, finalY) {
    this.finalX = finalX
    this.finalY = finalY
  }


  /**
   * Sets the initial X position
   * @param {Number} initialX the initial X position
   */
  setInitialX(initialX) {
    this.initialX = initialX
  }


  /**
   * Sets the initial Y position
   * @param {Number} initialY the initial Y position
   */
  setInitialY(initialY) {
    this.initialY = initialY
  }


  /**
  * Sets the initial rendering position
  * @param {Number} initialX the initial X position
  * @param {Number} initialY The initial Y position
  */
  setInitialXY(initialX, initialY) {
    this.initialX = initialX
    this.initialY = initialY
  }
}


export default BaseNode
