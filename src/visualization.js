/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
import GridLayout from "./layouts/GridLayout"
import RadialLayout from "./layouts/RadialLayout"
import TreeLayout from "./layouts/TreeLayout"
import ContextualLayout from "./layouts/ContextualLayout"

import { createTooltip } from "./utils/Tooltip"
import { createRenderCanvas } from "./utils/Canvas"

import Graph from "./data/Graph"
import VisualizationConfiguration from "./configuration/VisualizationConfiguration"


/**
 * Canvas
 * @description The canvas element where all svgs are held.
 * @typedef {Canvas} Canvas
 * @category Type Definitions
 *
 * @see https://svgjs.com/docs/3.0/container-elements/#svg-svg
 */

/**
 * SVG
 * @description A SVG object provided by svgdotjs
 * @typedef {SVG} SVG
 * @category Type Definitions
 *
 * @see https://svgjs.com/docs/3.0/container-elements/
 */

/**
 * ForeignObject
 * @description A foreign object which holds custom HTML.
 *
 * @typedef {ForeignObject} ForeignObject
 * @category Type Definitions
 *
 * @see https://svgjs.com/docs/3.0/shape-elements/#svg-foreignobject
 */

/**
 * Data
 * @description This object contains data that was loaded from the backend.
 * @typedef {Data} Data
 * @category Type Definitions
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
 * - svgdotjs library while animating sometimes 0.5 1 xy value (.svg.bbox().cx, .svg.bbox().cy) off calculated position
 * - svgdotjs does not provide an option to draw vertical gradients: implemented workaround: rotate -> draw linear gradient
 *            -> rotate back to original position
 */


/**
 * The class is responsible for creating and updating layouts and serves as main entry point.
 *
 * @category Main Visualization
 * @property {VisualizationConfiguration} config An object containing required and additional configurations.
 */
class Visualization {
  constructor(config = {}) {
    this.config = { ...VisualizationConfiguration, ...config }

    if (this.config.databaseUrl === null
      || this.config.nodeEndpoint === null
      || this.config.edgeEndpoint === null
      || this.config.contextualRelationshipEndpoint === null
    ) {
      throw new Error(
        `The following parameters are required:
          - 'databaseUrl' 
          - 'nodeEndpoint' 
          - 'edgeEndpoint 
          - 'contextualRelationshipEndpoint'
        `,
      )
    }


    // // create the background element to hold the main canvas
    this.canvas = createRenderCanvas(this.config)
    this.canvas.attr("zoomCurrent", this.config.zoomLevel)
    this.canvas.attr("zoomThreshold", this.config.zoomLabelThreshold)


    // add tooltip support
    createTooltip(document.getElementById(this.config.canvasId))


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
    layout.setLayoutReferences(this.layouts)
    layout.setGlobalLayoutSpacing(this.config.layoutSpacing)


    this.layouts.push(layout)

    if (layout instanceof GridLayout) {
      layout.setLayoutIdentifier(`grid_${this.generateRandomLayoutId()}`)
      await layout.loadInitialGridDataAsync()
    }

    if (layout instanceof ContextualLayout) {
      layout.setLayoutIdentifier(`contextual_${this.generateRandomLayoutId()}`)
      await layout.loadInitialContextualDataAsync()
    }

    if (layout instanceof RadialLayout) {
      layout.setLayoutIdentifier(`radial_${this.generateRandomLayoutId()}`)
      await layout.loadInitialRadialDataAsync()
    }

    if (layout instanceof TreeLayout) {
      layout.setLayoutIdentifier(`tree_${this.generateRandomLayoutId()}`)
      await layout.loadInitialTreeDataAsync()
    }


    // calculate the amount of which the layout needs to shift right to avoid overlapping conflicts
    const layouts = this.layouts.slice(0, this.layouts.indexOf(layout))
    const prevOffset = layouts.map((l) => l.layoutInfo.w).reduce((a, b) => a + b, 0)
    const offset = prevOffset + (this.config.layoutSpacing * (this.layouts.length - 1))

    layout.calculateLayout({ offset })

    layout.renderLayout({})


    return layout
  }


  /**
   * Updates an existing layout.
   *
   * @async
   * @param {BaseLayout} layout The layout which is about to be updated.
   * @param {Graph|Object} graphOrConfigData Either an updated graph instance or new layout configuration that
   *                       alternates the existing one.
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

        if (layout instanceof RadialLayout) {
          layout.setRenderDepth(config.renderDepth || layout.getRenderDepth())
          layout.setRootId(config.rootId || layout.getRootId())
        }

        if (layout instanceof GridLayout) {
          // we dont need to to anything here..
        }

        if (layout instanceof ContextualLayout) {
          layout.setFocusId(config.focusId || layout.getFocusId())
        }
      }

      await layout.removeLayoutAsync({ removeOldData: true })
      layout.setNodeData(graphOrConfigData.getNodes())
      layout.setEdgeData(graphOrConfigData.getEdges())

      if (layout instanceof TreeLayout) {
        await layout.loadInitialTreeDataAsync()
      }

      if (layout instanceof RadialLayout) {
        await layout.loadInitialRadialDataAsync()
      }

      if (layout instanceof GridLayout) {
        await layout.loadInitialGridDataAsync()
      }

      if (layout instanceof ContextualLayout) {
        await layout.rebuildContextualLayoutAsync({ removeOldData: false })
        await layout.loadInitialContextualDataAsync()
      }


      layout.updateLayoutsToTheRight({ isReRender: true })
    } else {
      const conf = graphOrConfigData instanceof Graph ? config : graphOrConfigData


      const reRenderOperations = [
        // tree
        "animationSpeed",
        "orientation",
        "renderingSize",
        "showLeafIndications",
        "visibleNodeLimit",
        "leafIndicationLimit",
        "leafStrokeWidth",
        "leafStrokeColor",
        "leafMarker",

        // radial
        "hAspect",
        "wAspect",
        "rootId",
        "renderDepth",

        // grid
        "vSpacing",
        "hSpacing",
        "expanderTextColor",
        "expanderFontFamily",
        "expanderFontSize",
        "expanderFontWeight",
        "expanderFontStyle",
        "expanderTextBackground",

        // contextual
        "focusId",

      ]

      const requireRebuild = reRenderOperations.filter((r) => Object.keys(conf).includes(r)).length > 0

      if (layout instanceof TreeLayout) {
        layout.setConfig({ ...layout.getConfig(), ...conf })
        layout.setRenderDepth(conf.renderDepth || layout.getRenderDepth())
        layout.setRootId(conf.rootId || layout.getRootId())

        if (requireRebuild === true) {
          await layout.rebuildTreeLayoutAsync({ removeOldData: true })
        }
      }

      if (layout instanceof RadialLayout) {
        layout.setConfig({ ...layout.getConfig(), ...conf })
        layout.setRenderDepth(conf.renderDepth || layout.getRenderDepth())
        layout.setRootId(conf.rootId || layout.getRootId())

        if (requireRebuild === true) {
          await layout.rebuildRadialLayoutAsync({ removeOldData: true })
        }
      }

      if (layout instanceof GridLayout) {
        layout.setConfig({ ...layout.getConfig(), ...conf })

        if (requireRebuild === true) {
          await layout.rebuildGridLayoutAsync({ removeOldData: false })
        }
      }

      if (layout instanceof ContextualLayout) {
        layout.setConfig({ ...layout.getConfig(), ...conf })
        layout.setFocusId(conf.focusId || layout.getFocusId())
        // if (requireRebuild === true) { // TODO:
        await layout.rebuildContextualLayoutAsync({ removeOldData: false })
        // }
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
    layout.registerEventListener({ event, modifier, func })
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
   * @param {Graph} existingGraphData The existing graph data structure containing nodes and edges.
   * @param {BaseLayout} newLayout The requested new layout type.
   * @return {Promise<BaseLayout>} A promise with the newly created and rendered layout.
   *
   * @see TreeLayout
   * @see RadialLayout
   * @see ContextualLayout
   * @see GridLayout
   */
  async transform(currentLayout, existingGraphData, newLayout) {
    // remove the existing layout
    await currentLayout.removeLayoutAsync({ removeOldData: true })


    // update existing layout references
    this.layouts = this.layouts.filter((layout) => layout !== currentLayout)

    // the amount of which to shift a layout to the left
    const shiftToLeft = currentLayout.layoutInfo.w

    this.layouts.forEach((layout) => {
      layout.calculateLayout({ offset: layout.getCurrentOffset() - shiftToLeft - this.config.layoutSpacing })
      layout.setLayoutReferences(layout.getLayoutReferences().filter((l) => l !== currentLayout))
      layout.renderLayout({ isReRender: true })
    })


    // simply call the render method again
    return this.render(existingGraphData, newLayout)
  }


  /**
   * Helper method that generates a unique layout identifier.
   * @returns {String} A 5 character unique string.
   */
  generateRandomLayoutId() {
    const letters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const len = 5
    let rtn = ""
    for (let i = 0; i < len; i += 1) {
      rtn += letters.charAt(Math.floor(Math.random() * letters.length))
    }
    return rtn
  }
}


export default Visualization
