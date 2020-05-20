import Filter from "@svgdotjs/svg.filter.js"

import FallbackControlIcon from "../../resources/fallbackControlIcon.svg"
import FallbackAssetIcon from "../../resources/fallbackAssetIcon.svg"
import FallbackRiskIcon from "../../resources/fallbackRiskIcon.svg"
import FallbackCustomIcon from "../../resources/fallbackCustomIcon.svg"


const createSVGElement = (canvas, config, id, nodeSize, tooltipText) => {
  // create the SVG object on the canvas.
  const svg = canvas.group()

  // attach some CSS and an ID
  svg.css("cursor", "pointer")
  svg.id(`node#${id}`)


  svg.on("mouseover", () => {
    svg.front()

    const currentZoomLevel = canvas.parent().attr().zoomCurrent
    const currenZoomThreshold = canvas.parent().attr().zoomThreshold

    // show tooltip only if text is set, the node is in minimal representation and the
    // current zoom level is smaller then the threshold
    if (tooltipText !== null && nodeSize === "min" && currentZoomLevel <= currenZoomThreshold) {
      // add a show tooltip event
      svg.on("mousemove", (ev) => {
        const tooltip = document.getElementById("tooltip")
        tooltip.innerHTML = tooltipText
        tooltip.style.display = "block"

        tooltip.style.fontFamily = config.labelFontFamily
        tooltip.style.left = `${ev.clientX - tooltip.clientWidth / 2}px`
        tooltip.style.top = `${ev.clientY - tooltip.clientHeight - 15}px`
      })
    }

    // remove border dasharray (this improves the visual appearance of a node has a dashed border)
    const node = svg.get(0)
    node.stroke({
      width: config.borderStrokeWidth,
      color: config.borderStrokeColor,
      dasharray: 0,
    })


    // find a color add a highlight based on that color
    const toDark = config.borderStrokeColor.substr(1)
    // if (this.type === "requirement") {
    //   toDark = this.config.backgroundColor.substr(1)
    // }


    // attach the drop shadow
    node.filterWith((add) => {
      const blur = add.offset(0, 0).in(add.$source).gaussianBlur(3)
      const color = add.composite(add.flood(`#${toDark}`), blur, "in")
      add.merge(color, add.$source)
    })
  })


  // register an event that listens of the cursor leaves the nodes SVG object
  svg.on("mouseout", () => {
    // reset border stroke to its original value
    const node = svg.get(0)
    node.stroke({
      width: config.borderStrokeWidth,
      color: config.borderStrokeColor,
      dasharray: config.borderStrokeDasharray,
    })

    // remove the tooltip listener event
    svg.off("mousemove", null)

    // remove the tooltip
    const tooltip = document.getElementById("tooltip")
    tooltip.style.display = "none"

    // remove hover highlight
    node.filterer().remove()
  })

  return svg
}

const createSVGNode = (canvas, config) => {
  const {
    shape, polyline, path, backgroundColor, borderStrokeWidth, borderStrokeColor, borderStrokeDasharray, borderRadius,
  } = config

  let node = null

  // create the SVG shape
  if (shape === "rect") {
    node = canvas.rect(1, 1)
  }
  if (shape === "circle") {
    node = canvas.circle(1)
  }
  if (shape === "ellipse") {
    node = canvas.ellipse(1, 1)
  }
  if (shape === "polyline") {
    node = canvas.polyline(polyline)
  }
  if (shape === "path") {
    node = canvas.path(path)
  }


  // the the background
  node.fill(backgroundColor)


  // add some border stroke
  node.stroke({ width: borderStrokeWidth, color: borderStrokeColor, dasharray: borderStrokeDasharray })

  // add a radius
  if (shape !== "polyline" && shape !== "path") {
    node.radius(borderRadius)
  }

  // create a re-usable drop shadow
  const defId = "defaultNodeBorderFilter"
  const i = [...canvas.defs().node.childNodes].findIndex((d) => d.id === defId) || -1
  if (i === -1) {
    const filter = new Filter()
    filter.id(defId)
    const blur = filter.offset(0, 0).in(filter.$source).gaussianBlur(2)
    const color = filter.composite(filter.flood("#fff"), blur, "in")
    filter.merge(color, filter.$source)
  }


  return node
}

const createSVGIcon = (canvas, config, type) => {
  let icon = null


  // use a default icon
  if (config.iconUrl === null) {
    if (type === "control") {
      icon = canvas.image(FallbackControlIcon)
    }
    if (type === "risk") {
      icon = canvas.image(FallbackRiskIcon)
    }
    if (type === "asset") {
      icon = canvas.image(FallbackAssetIcon)
    }
    if (type === "custom") {
      icon = canvas.image(FallbackCustomIcon)
    }
  } else { // or a provided one
    icon = canvas.image(config.iconUrl)
  }


  // set the starting size (Note: 0 is not accepted by the library)
  icon.size(1, 1)
  return icon
}

export { createSVGElement, createSVGNode, createSVGIcon }
