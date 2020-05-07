import { SVG } from "@svgdotjs/svg.js"
import "@svgdotjs/svg.draggable.js"
import "../extensions/panzoom"


const createRenderCanvas = (config) => {
  const { document } = window

  // create the background element to hold the main canvas
  const element = document.createElement("div")
  element.setAttribute("id", config.canvasId)
  element.style.position = "relative"
  document.body.appendChild(element)

  return SVG()
    .addTo(element)
    .size(config.canvasWidth, config.canvasHeight)
    .viewbox(0, 0, config.canvasWidth, config.canvasHeight)
    .panZoom({ zoomMin: 0.25, zoomMax: 10, zoomFactor: 0.25 })
    .zoom(config.zoomLevel, { x: config.zoomX, y: config.zoomY })
}


export { createRenderCanvas }
