
/**
 * @namespace ContextualLayoutConfiguration
 * @description This object contains default configuration for contextual layout representations.
 *
 * @property {Number} layoutWidth=1200             - The width used by the layout representation.
 * @property {Number} layoutHeight=800             - The height used by the layout representation.
 */
const ContextualLayoutConfiguration = {
  // limit width and size
  maxLayoutWidth: 800,
  maxLayoutHeight: 800,

  // where to translate a given layout
  translateX: -50,
  translateY: 0,

  // layout animation speed for all nodes and edges
  animationSpeed: 300,

  // hide all other layouts and center selected one
  hideOtherLayouts: false, // TODO:

  // spacing between nodes
  spacing: 16,


  assignedFocusDistance: 800,

  // how to render all nodes
  renderingSize: "min", // min max

  // risk container
  riskFocusDistance: 500,

  riskContainerNodeLimit: 4,
  riskContainerColumns: 2,
  riskContainderBorderRadius: 0,
  riskContainerBorderStrokeColor: "#ff8e9e10",
  riskContainerBorderStrokeWidth: 1.85,
  riskContainerBackgroundColor: "#ff8e9e05",


  // children container
  childrenFocusDistance: 80,

  childContainerNodeLimit: 6,
  childContainerColumns: 3,
  childContainderBorderRadius: 5,
  childContainerBorderStrokeColor: "#888888",
  childContainerBorderStrokeWidth: 1.85,
  childContainerBackgroundColor: "#fff",

  // parent container
  parentFocusDistance: 80,

  parentContainerNodeLimit: 6,
  parentContainerColumns: 3,
  parentContainderBorderRadius: 5,
  parentContainerBorderStrokeColor: "#888888",
  parentContainerBorderStrokeWidth: 1.85,
  parentContainerBackgroundColor: "#fff",


}


export default ContextualLayoutConfiguration
