
/**
 * @namespace ContextualLayoutConfiguration
 * @description This object contains default configuration for contextual layout representations.
 *
 * @property {Number} layoutWidth=1200             - The width used by the layout representation.
 * @property {Number} layoutHeight=800             - The height used by the layout representation.
 */
const GridLayoutConfiguration = {
  layoutWidth: 1200,
  layoutHeight: 800,
  // limit width and size
  maxLayoutWidth: 1200,
  maxLayoutHeight: 800,

  // where to translate a given layout
  translateX: 0,
  translateY: 0,

  // layout animation speed for all nodes and edges
  animationSpeed: 300,

  // hide all other layouts and center selected one
  hideOtherLayouts: false, // TODO:

  // spacing between nodes
  spacing: 16,
  parentFocusDistance: 250, // TODO: fix naming convention
  childFocusDistance: 250,
  translateRiskX: 450,
  translateRiskY: -100,
  focusRiskDistance: 400,


  // risk container
  riskLimitContainer: 1,
  riskContainderBorderRadius: 5,
  riskContainerBorderStrokeColor: "#ff8e9e",
  riskContainerBorderStrokeWidth: 1,
  riskContainerBackgroundColor: "#fff",

  // children container
  childrenLimitContainer: 3,
  childrenContainderBorderRadius: 5,
  childrenContainerBorderStrokeColor: "#555555cc",
  childrenContainerBorderStrokeWidth: 1,
  childrenContainerBackgroundColor: "#fff",

  // container config
  parentLimitContainer: 3,
  parentContainderBorderRadius: 5,
  parentContainerBorderStrokeColor: "#555555cc",
  parentContainerBorderStrokeWidth: 1,
  parentContainerBackgroundColor: "#fff",
}


export default GridLayoutConfiguration
