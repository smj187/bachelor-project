import { SVG } from "@svgdotjs/svg.js"
import "@svgdotjs/svg.draggable.js"
import "./extensions/panzoom"

import GridLayout from "./layouts/GridLayout"
import RadialLayout from "./layouts/RadialLayout"
import TreeLayout from "./layouts/TreeLayout"
import ContextualLayout from "./layouts/ContextualLayout"

import Graph from "./data/Graph"

/**
 * The canvas element where all svgs are held
 * @typedef {Canvas} Canvas
 *
 * @see https://svgjs.com/docs/3.0/container-elements/#svg-svg
 */


/**
 * The raw data object to create a node
 * @typedef {Data} Data
 *
 * @property {Number} id the node id
 * @property {String} label the node label
 * @property {String} type the node type (asset, control, risk requirement, custom)
 * @property {String} tooltipText the tooltip text that is shown while hovering a specific node
 */


/**
 * Creates and handles all vizualization operations
 *
 */
class Visualization {
  constructor(config) { // TODO: this constructor should receive custom overrides for all nodes, edges and layouts
    if (config.databaseUrl === undefined || config.databaseUrl === null) {
      throw new Error("missing database URL")
    }

    // create the main canvas element dom element
    const element = document.createElement("div")
    element.setAttribute("id", "canvas")
    element.style.position = "relative"
    document.body.appendChild(element)

    // create the tooltip dom element
    const tooltip = document.createElement("div")
    tooltip.setAttribute("id", "tooltip")
    tooltip.style.display = "none"
    tooltip.style.position = "absolute"
    tooltip.style.background = "#333"
    tooltip.style.border = "0px"
    tooltip.style.boxShadow = "0 5px 15px -5px rgba(0, 0, 0, .65)"
    tooltip.style.color = "#eee"
    tooltip.style.padding = "0.4rem 0.6rem"
    tooltip.style.fontSize = "0.85rem"
    tooltip.style.fontWeight = "400"
    tooltip.style.fontStyle = "normal"
    element.appendChild(tooltip)

    // canvas set up
    this.zoomLevel = 1
    this.canvas = SVG()
      .addTo(element)
      .size(window.innerWidth - 10, window.innerHeight - 10)
      .viewbox(0, 0, window.innerWidth - 10, window.innerHeight - 10)
      .panZoom({ zoomMin: 0.25, zoomMax: 10, zoomFactor: 0.25 })


    this.layouts = []
    this.lastLayoutWidth = 0


    this.config = {
      ...config,
      nodeEndpoint: "node-data",
      edgeEndpoint: "edge-data",
      contextualRelationshipEndpoint: "contextual-relationships",
      layoutSpacing: 200,
    }


    // stores all loaded nodes
    this.loadedNodes = []


    this.knownGraph = new Graph()

    this.fetchedNodes = []
    this.fetchedEdges = []
  }

  createInitialGraph(nodeIds = [], edgeIds = []) {
    const graph = new Graph()

    // add nodes
    nodeIds.forEach((id) => {
      graph.includeNode(id)
      this.knownGraph.includeNode(id)
    })

    // add edges
    edgeIds.forEach((ids) => {
      graph.includeEdge(ids[0], ids[1])
      this.knownGraph.includeEdge(ids[0], ids[1])
    })


    return graph
  }


  /**
   * Renders a layout
   * @param {Graph} initialGraphData the initial graph that should be displayed
   * @param {Layout} layout the layout type
   */
  async render(initialGraphData, layout) {
    layout.setCanvas(this.canvas)
    layout.setConfig({
      databaseUrl: this.config.databaseUrl,
      nodeEndpoint: this.config.nodeEndpoint,
      edgeEndpoint: this.config.edgeEndpoint,
      contextualRelationshipEndpoint: this.config.contextualRelationshipEndpoint,
    })
    layout.setNodeData(initialGraphData.getNodes())
    layout.setEdgeData(initialGraphData.getEdges())


    this.layouts.push(layout)
    layout.setLayoutReferences(this.layouts)

    if (layout instanceof GridLayout) {
      const createdLayout = await layout.loadInitialGridDataAsync()
      const layouts = this.layouts.slice(0, this.layouts.indexOf(layout))
      const offset = layouts.map((l) => l.layoutInfo.w).reduce((a, b) => a + b, 0)
      createdLayout.calculateLayout(offset)
      createdLayout.renderLayout()
    }

    if (layout instanceof ContextualLayout) {
      const createdLayout = await layout.loadInitialContextualDataAsync()
    }


    return layout
  }

  async update(layout, graphOrConfig, config = {}) {
    if (graphOrConfig instanceof Graph) {
      await layout.updateGraphStructure(graphOrConfig, config)
      const updatedLayout = await layout.loadAdditionalGridDataAsync()
      const prevW = updatedLayout.layoutInfo.w
      updatedLayout.calculateLayout()
      const newW = updatedLayout.layoutInfo.w

      // update all layouts right side
      this.layouts.forEach((llayout, i) => {
        if (i > this.layouts.indexOf(layout)) {
          llayout.calculateLayout(newW - prevW)
          llayout.renderLayout()
        }
      })

      updatedLayout.renderLayout()
    } else {
      const updatedLayout = await layout.updateLayoutConfiguration(graphOrConfig)
      await updatedLayout.loadAdditionalGridDataAsync()

      const prevW = updatedLayout.layoutInfo.w
      updatedLayout.calculateLayout()
      const newW = updatedLayout.layoutInfo.w

      // update all layouts right side
      this.layouts.forEach((llayout, i) => {
        if (i > this.layouts.indexOf(layout)) {
          llayout.calculateLayout(newW - prevW)
          llayout.renderLayout()
        }
      })

      updatedLayout.renderLayout()
    }
  }


  /**
   * Transforms a layout from one type into another type
   * @param {Layout} currentLayout
   * @param {Layout} newLayout
   */
  async transform(currentLayout, newLayout) {
    newLayout.setCanvas(this.canvas)
    newLayout.setConfig({ databaseUrl: this.config.databaseUrl })

    if (newLayout instanceof RadialLayout) {
      newLayout.createRadialDataAsync(currentLayout.getNodeData(), currentLayout.getEdgeData())
    }

    if (newLayout instanceof GridLayout) {
      newLayout.createGridDataAsync(currentLayout.getNodeData(), currentLayout.getEdgeData())
    }

    if (newLayout instanceof TreeLayout) {
      newLayout.createRadialDataAsync(currentLayout.getNodeData(), currentLayout.getEdgeData())
    }

    if (newLayout instanceof ContextualLayout) {
      newLayout.createContextualDataAsync(currentLayout.getNodeData(), currentLayout.getEdgeData())
    }


    currentLayout.removeLayout()
  }


  /**
   * Change the current zoom level
   * @param {Number} zoom zoom level between 0.25 and 10
   * @param {Object} [zoomOptions]
   * @param {Number} [zoomOptions.x] zoom into specified point
   * @param {Number} [zoomOptions.y] zoom into specified point
   *
   */
  setZoom(zoom, opts) {
    this.canvas.zoom(zoom, opts)
  }

  /**
   * Returns the current canvas element
   */
  getCanvas() {
    return this.canvas
  }
}


export default Visualization
