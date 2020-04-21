import { SVG } from "@svgdotjs/svg.js"
import "@svgdotjs/svg.draggable.js"
import "./extensions/panzoom"

import GridLayout from "./layouts/GridLayout"
import RadialLayout from "./layouts/RadialLayout"
import TreeLayout from "./layouts/TreeLayout"
import ContextualLayout from "./layouts/ContextualLayout"

import Graph from "./data/Graph"

/**
 * @description The canvas element where all svgs are held.
 * @typedef {Canvas} Canvas
 *
 * @see https://svgjs.com/docs/3.0/container-elements/#svg-svg
 */

/**
 * @description A foreign object.
 * 
 * @typedef {ForeignObject} ForeignObject
 * 
 * @see https://svgjs.com/docs/3.0/shape-elements/#svg-foreignobject
 */

/**
 * @description This object contains data that was loaded from the backend.
 * @typedef {Data} Data
 *
 * @property {Number} id The id of the node.
 * @property {String} label The label of the node. Available: string, null or empty string.
 * @property {String} description The description of the node. Available: string, null or empty string.
 * @property {String} type The type of the node. Available asset, control, risk requirement or custom.
 * @property {Object} attributes An object containing a key-value-pair list.
 * @property {String} tooltipText Some tooltip text that is shown while hovering a specific node.
 * @property {Number|Number[]} parent One parent id reference or multiple parent ids references.
 * @property {Number[]} children An array containing child node id references.
 * @property {Object} config An object, which is contains key-value entries to override default node representations.
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
    const w = window.innerWidth - 10
    const h = window.innerHeight - 10
    this.canvas = SVG()
      .addTo(element)
      .size(w, h)
      .viewbox(0, 0, w, h)
      .panZoom({ zoomMin: 0.25, zoomMax: 10, zoomFactor: 0.25 })
      .zoom(config.zoom.lvl, { x: config.zoom.x, y: config.zoom.y })


    // const event = {
    //   event: "grid.expander",
    //   mouse: "click",
    //   modifier: "shiftKey"
    // }


    // const test = this.canvas.rect(100, 100).dmove(200, 300)
    // const func = () => test.fill("#f75")

    // test.on(event.mouse, (e) => {
    //   if (event.modifier !== null) {
    //     if (event.modifier, e[event.modifier]) {
    //       func()
    //     }
    //   }
    // })



    // // .on("grid.expander", () => {
    // //   test.fill("#f75")
    // // })


    // remove text labels when zoomed-in
    let textState = null
    this.canvas.on("zoom", (ev) => {
      const currentLevel = ev.detail.level
      if (currentLevel <= 0.75 && textState !== "hidden") {
        const labels = document.querySelectorAll("#min-label")
        labels.forEach(doc => {
          doc.style.opacity = "0"
        })
        textState = "hidden"
      }
      if (currentLevel > 0.75 && textState === "hidden") {
        const labels = document.querySelectorAll("#min-label")
        labels.forEach(doc => {
          doc.style.opacity = "1"
        })
        textState = null
      }
      this.zoomLevel = currentLevel
    })


    this.layouts = []
    this.lastLayoutWidth = 0


    // TODO: talk about this in the thesis ( its required)
    this.config = {
      ...config,
      nodeEndpoint: "node-data",
      edgeEndpoint: "edge-data",
      contextualRelationshipEndpoint: "contextual-relationships",
      layoutSpacing: 50,
    }


    // stores all loaded nodes
    this.loadedNodes = []


    this.knownGraph = new Graph()

    this.fetchedNodes = []
    this.fetchedEdges = []

    // TODO: further work: implement a store (like in react useState that holds references to all currently knwon nodes in a database
    //       and to reduce calling a database -> performance improvement)
  }

  test() {
    this.canvas.rect(100, 100)
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
      const index = this.layouts.indexOf(layout)
      const layouts = this.layouts.slice(0, index)
      let offset = layouts.map((l) => l.layoutInfo.w).reduce((a, b) => a + b, 0)
      createdLayout.calculateLayout(offset)
      createdLayout.renderLayout()
    }

    if (layout instanceof ContextualLayout) {
      const createdLayout = await layout.loadInitialContextualDataAsync()
      const layouts = this.layouts.slice(0, this.layouts.indexOf(layout))
      const offset = layouts.map((l) => l.layoutInfo.w).reduce((a, b) => a + b, 0)
      createdLayout.calculateLayout(offset)
      createdLayout.renderLayout()

    }

    if (layout instanceof RadialLayout) {
      const createdLayout = await layout.loadInitialRadialDataAsync()
      const layouts = this.layouts.slice(0, this.layouts.indexOf(layout))
      const offset = layouts.map((l) => l.layoutInfo.w).reduce((a, b) => a + b, 0)
      createdLayout.calculateLayout(offset)
      createdLayout.renderLayout()
    }

    if (layout instanceof TreeLayout) {
      const createdLayout = await layout.loadInitialTreeDataAsync()
      const layouts = this.layouts.slice(0, this.layouts.indexOf(layout))
      const offset = layouts.map((l) => l.layoutInfo.w).reduce((a, b) => a + b, 0)
      createdLayout.calculateLayout(offset)
      createdLayout.renderLayout()
    }



    return layout
  }

  async update(layout, graphOrConfig, config = {}) {

    if (layout instanceof RadialLayout) {
      if (graphOrConfig instanceof Graph) {
        console.log("update radial graph")

        await layout.updateRadialDataWithConfigAsync(graphOrConfig, config)
      } else {
        layout.setConfig(graphOrConfig)
        await layout.removeLayoutAsync()

        const layouts = this.layouts.slice(0, this.layouts.indexOf(layout))
        const offset = layouts.map((l) => l.layoutInfo.w).reduce((a, b) => a + b, 0)
        const prevW = layout.layoutInfo.w
        layout.calculateLayout(offset)

        const newW = layout.layoutInfo.w

        // update all layouts right side
        this.layouts.forEach((llayout, i) => {
          if (i > this.layouts.indexOf(layout)) {
            llayout.calculateLayout(newW - prevW)
            llayout.renderLayout()
          }
        })

        layout.renderLayout()
      }
    }

    if (layout instanceof GridLayout) {

      // update the underlying graph structure and configuration
      if (graphOrConfig instanceof Graph) {
        await layout.updateGridDataWithConfigAsync(graphOrConfig, config)
        await layout.loadAdditionalGridDataAsync()

        const prevW = layout.layoutInfo.w
        layout.calculateLayout()
        const newW = layout.layoutInfo.w

        // update all layouts right side
        this.layouts.forEach((llayout, i) => {
          if (i > this.layouts.indexOf(layout)) {
            llayout.calculateLayout(newW - prevW)
            llayout.renderLayout()
          }
        })

        layout.renderLayout()
      } else { // update only configuration
        layout.setConfig(graphOrConfig)
        await layout.removeLayoutAsync()
        await layout.loadAdditionalGridDataAsync()

        const prevW = layout.layoutInfo.w
        layout.calculateLayout()
        const newW = layout.layoutInfo.w

        // update all layouts right side
        this.layouts.forEach((llayout, i) => {
          if (i > this.layouts.indexOf(layout)) {
            llayout.calculateLayout(newW - prevW)
            llayout.renderLayout()
          }
        })

        layout.renderLayout()
      }
    }




    // if (graphOrConfig instanceof Graph) {
    //   await layout.updateGraphStructure(graphOrConfig, config)
    //   const updatedLayout = await layout.loadAdditionalGridDataAsync()
    //   const prevW = updatedLayout.layoutInfo.w
    //   updatedLayout.calculateLayout()
    //   const newW = updatedLayout.layoutInfo.w

    //   // update all layouts right side
    //   this.layouts.forEach((llayout, i) => {
    //     if (i > this.layouts.indexOf(layout)) {
    //       llayout.calculateLayout(newW - prevW)
    //       llayout.renderLayout()
    //     }
    //   })

    //   updatedLayout.renderLayout()
    // } else {

    //   console.log(layout, graphOrConfig, this)
    //   const updatedLayout = await layout.updateLayoutConfiguration(graphOrConfig)
    //   await updatedLayout.loadAdditionalGridDataAsync()

    //   const prevW = updatedLayout.layoutInfo.w
    //   updatedLayout.calculateLayout()
    //   const newW = updatedLayout.layoutInfo.w

    //   // update all layouts right side
    //   this.layouts.forEach((llayout, i) => {
    //     if (i > this.layouts.indexOf(layout)) {
    //       llayout.calculateLayout(newW - prevW)
    //       llayout.renderLayout()
    //     }
    //   })

    //   updatedLayout.renderLayout()
    // }
  }

  updateMouseEvents(event, func) {

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
