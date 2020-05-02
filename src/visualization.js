/* eslint-disable class-methods-use-this */
import { SVG } from "@svgdotjs/svg.js"
import "@svgdotjs/svg.draggable.js"
import "./extensions/panzoom"

import GridLayout from "./layouts/GridLayout"
import RadialLayout from "./layouts/RadialLayout"
import TreeLayout from "./layouts/TreeLayout"
import ContextualLayout from "./layouts/ContextualLayout"

import { createTooltip } from "./utils/Tooltip"

import Graph from "./data/Graph"
import VisualizationConfiguration from "./configuration/VisualizationConfiguration"



/**
 * @description The canvas element where all svgs are held.
 * @typedef {Canvas} Canvas
 *
 * @see https://svgjs.com/docs/3.0/container-elements/#svg-svg
 */

/**
 * @description A foreign object which holds custom HTML.
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
 * KNOWN ISSUES:
 *    - svgdotjs library while animating sometimes 0.5 1 xy value (.svg.bbox().cx, .svg.bbox().cy) off calculated position
 */




/**
 * The class is responsible for creating and updating layouts and serves as main entry point.
 *
 * @property {VisualizationConfiguration} config An object containing required and additional configurations.
 */
class Visualization {
  constructor(config = {}) {
    this.config = { ...VisualizationConfiguration, ...config }

    if (this.config.databaseUrl === null
      || this.config.nodeEndpoint === null
      || this.config.edgeEndpoint === null
      || this.config.contextualRelationshipEndpoint === null) {
      throw new Error(
        `The following parameters are required:
          - 'databaseUrl' 
          - 'nodeEndpoint' 
          - 'edgeEndpoint 
          - 'contextualRelationshipEndpoint'
        `,
      )
    }


    // create the background element to hold the main canvas
    const element = document.createElement("div")
    element.setAttribute("id", this.config.canvasId)
    element.style.position = "relative"
    document.body.appendChild(element)


    // add tooltip support
    createTooltip(element)


    // set up canvas and zooming
    this.canvas = SVG()
      .addTo(element)
      .size(this.config.canvasWidth, this.config.canvasHeight)
      .viewbox(0, 0, this.config.canvasWidth, this.config.canvasHeight)
      .panZoom({ zoomMin: 0.25, zoomMax: 10, zoomFactor: 0.25 })
      .zoom(this.config.zoomLevel, { x: this.config.zoomX, y: this.config.zoomY })

    this.canvas.attr("zoomCurrent", this.config.zoomLevel)
    this.canvas.attr("zoomThreshold", this.config.zoomLabelThreshold)


    // register mouse wheel zooming
    let textState = null
    this.canvas.on("zoom", (ev) => {
      const currentLevel = ev.detail.level

      // hide labels by changing their opacity value
      if (currentLevel <= this.config.zoomLabelThreshold && textState !== "hidden") {
        document.querySelectorAll("#label").forEach((label) => {
          label.style.opacity = "0"
        })
        textState = "hidden"
      }

      // show hidden labels
      if (currentLevel > this.config.zoomLabelThreshold && textState === "hidden") {
        document.querySelectorAll("#label").forEach((label) => {
          label.style.opacity = "1"
        })
        textState = null
      }

      this.canvas.attr("zoomCurrent", currentLevel)
    })


    // store all currently known layouts
    this.layouts = []
  }


  /**
   * Creates the underlying graph data strcuture later required to load data from the database.
   * @param {Array.<Number>} [nodeIds=[ ]] An optional array of node ids.
   * @param {Array.<Number>} [edgeIds=[ ]] An optional array containing subarrays for edges.
   *                         Each subarray consits of an entry for a starting node id and an ending node id.
   */
  createInitialGraph(nodeIds = [], edgeIds = []) {
    const graph = new Graph()

    // add nodes
    nodeIds.forEach((id) => {
      graph.includeNode(id)
    })

    // add edges
    edgeIds.forEach((ids) => {
      graph.includeEdge(ids[0], ids[1])
    })

    return graph
  }


  /**
   * This is the main method to gernate layouts. It calls the required methods for each layout type and
   * passes further information about the new layout.
   *
   * @async
   * @param {Graph} initialGraphData The initial graph data structure containing nodes and edges.
   * @param {BaseLayout} layout The requested layout type.
   * @return {Promise<BaseLayout>} A promise with the calculated and rendered layout.
   *
   * @see TreeLayout
   * @see RadialLayout
   * @see ContextualLayout
   * @see GridLayout
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
    layout.setLayoutIdentifier(this.layouts.length - 1)




    if (layout instanceof GridLayout) {
      const createdLayout = await layout.loadInitialGridDataAsync()
      const index = this.layouts.indexOf(layout)
      const layouts = this.layouts.slice(0, index)
      const offset = layouts.map((l) => l.layoutInfo.w).reduce((a, b) => a + b, 0)
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
      await layout.loadInitialRadialDataAsync()

    }

    if (layout instanceof TreeLayout) {
      await layout.loadInitialTreeDataAsync()
    }

    const layouts = this.layouts.slice(0, this.layouts.indexOf(layout))
    const offset = layouts.map((l) => l.layoutInfo.w).reduce((a, b) => a + b, 0)
    layout.calculateLayout(offset, {})
    layout.renderLayout({})


    return layout
  }

  /*
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
  */

  /**
   * Updates an existing layout.
   *
   * @async
   * @param {BaseLayout} layout The layout which is about to be updated.
   * @param {Graph|Object} graphOrConfigData Either an updated graph instance or new layout configuration that alternates the existing one.
   * @param {Object} config An optional layout configuration object if the previouse parameter is set.
   *
   * @see TreeLayoutConfiguration
   * @see RadialLayoutConfiguration
   * @see ContextualLayoutConfiguration
   * @see GridLayoutConfiguration
   */
  async update(layout, graphOrConfigData, config) {

    if (graphOrConfigData instanceof Graph) {

      if (config) {
        layout.setConfig({ ...layout.getConfig(), ...config })

        if (layout instanceof TreeLayout) {
          layout.setRenderDepth(config.renderDepth || layout.getRenderDepth())
          layout.setRootId(config.rootId || layout.getRootId())
        }

      }

      await layout.removeLayoutAsync()
      layout.setNodeData(graphOrConfigData.getNodes())
      layout.setEdgeData(graphOrConfigData.getEdges())

      if (layout instanceof TreeLayout) {
        await layout.loadInitialTreeDataAsync()
      }

      const layouts = this.layouts.slice(0, this.layouts.indexOf(layout))
      const offset = layouts.map((l) => l.layoutInfo.w).reduce((a, b) => a + b, 0)
      layout.calculateLayout(offset, {})
      layout.renderLayout({})

    } else {
      const conf = graphOrConfigData instanceof Graph ? config : graphOrConfigData


      const reRenderOperations = [
        // tree
        "orientation",
        "renderingSize",
        "showLeafIndications",
        "visibleNodeLimit",
        "leafIndicationLimit",
        "leafStrokeWidth",
        "leafStrokeColor",
        "leafMarker",
      ]
      const requireRebuild = reRenderOperations.filter((r) => Object.keys(conf).includes(r)).length > 0

      if (layout instanceof TreeLayout) {
        layout.setConfig({ ...layout.getConfig(), ...conf })
        layout.setRenderDepth(conf.renderDepth || layout.getRenderDepth())
        layout.setRootId(conf.rootId || layout.getRootId())

        if (requireRebuild === true) {
          await layout.rebuildTreeLayout()
        }
      }

      layout.updateLayoutsToTheRight({ isReRender: true })

    }


  }


  /**
   * Adds an event listener to a given layout.
   * @param {BaseLayout} layout The layout where to add the event listener.
   * @param {String} event The event name.
   * @param {String} modifier The modifier name. Available: "shiftKey", "altKey", "ctrlKey" or undefined.
   * @param {String} func The method name.
   *
   * @see Supported events: {@link https://svgjs.com/docs/3.0/events/#element-click}
   * @see TreeLayout
   * @see RadialLayout
   * @see ContextualLayout
   * @see GridLayout
   */
  addEventListener(layout, event, modifier, func) {
    layout.registerEventListener(event, modifier, func)
  }



  /**
   * Adds a custom node representation for all nodes in the layout.
   * @param {BaseLayout} layout The layout where to add additional custom node representations.
   * @param {Object} representation An object containing the custom representation key-value pairs.
   * 
   * @see AssetNodeConfiguration
   * @see ControlNodeConfiguration
   * @see CustomNodeConfiguration
   * @see RequirementNodeConfiguration
   * @see RiskNodeConfiguration
   */
  addCustomNodeRepresentation(layout, representation) {
    layout.registerAdditionalNodeRepresentation(representation)
  }

  /**
   * Adds a custom edge representation for all nodes in the layout.
   * @param {BaseLayout} layout The layout where to add additional custom edge representations.
   * @param {Object} representation An object containing the custom representation key-value pairs.
   * 
   * @see BoldEdgeConfiguration
   * @see CustomEdgeConfiguration
   * @see ThinEdgeConfiguration
   */
  addCustomEdgeRepresentation(layout, representation) {
    layout.registerAdditionalEdgeRepresentation(representation)
  }


  /**
   * Transforms a layout from one type into another type.
   *
   * @async
   * @param {BaseLayout} currentLayout The currently rendered layout.
   * @param {BaseLayout} newLayout The requested new layout type.
   *
   * @see TreeLayout
   * @see RadialLayout
   * @see ContextualLayout
   * @see GridLayout
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
}


export default Visualization
