/**
 * @namespace VisualizationConfiguration
 * @description This object contains default configuration the main visualization class.
 *
 * @property {String} canvasId=visualization-canvas             - Determins id for the background canvas DOM attribute.
 * @property {Number} canvasWidth=window.innerWidth-10          - Sets the background canvas width.
 * @property {Number} canvasHeight=window.innerHeight-10        - Sets the background canvas height.
 * @property {Number} zoomLevel=0.85                            - Determins the canvas zoom level.
 * @property {Number} zoomX=0                                   - Determins the specified X point for zoom.
 * @property {Number} zoomY=0                                   - Determins the specified Y point for zoom.
 * @property {Number} zoomMin=0.25                              - Determins the minimal zoom level.
 * @property {Number} zoomMax=10                                - Determins the maximal zoom level.
 * @property {Number} zoomStep=0.25                             - Determins the zoom step in which to increase or decrease the current zoom level.
 * @property {Number} zoomLabelThreshold=0.65                   - Determins at which zoom level all labels go invisible.
 * @property {String} databaseUrl=null                          - Determins the required database URL.
 * @property {String} nodeEndpoint=null                         - Determins the required node endpoint name.
 * @property {String} edgeEndpoint=null                         - Determins the required node endpoint name.
 * @property {String} contextualRelationshipEndpoint=null       - Determins the required contextual relationship endpoint name.
 * @property {Number} layoutSpacing=150                         - Determins the spacing between multiple layouts.
 *
 *
 * @see https://github.com/svgdotjs/svg.panzoom.js
 */
const VisualizationConfiguration = {
  // drawing canvas
  canvasId: "visualization-canvas",
  canvasWidth: window.innerWidth - 10,
  canvasHeight: window.innerHeight - 10,

  // zoom
  zoomLevel: 0.85,
  zoomX: 0,
  zoomY: 0,
  zoomMin: 0.25,
  zoomMax: 10,
  zoomStep: 0.25,
  zoomLabelThreshold: 0.65,

  // endpoints
  databaseUrl: null,
  nodeEndpoint: null,
  edgeEndpoint: null,
  contextualRelationshipEndpoint: null,

  // global layout settings
  layoutSpacing: 100
}

export default VisualizationConfiguration
