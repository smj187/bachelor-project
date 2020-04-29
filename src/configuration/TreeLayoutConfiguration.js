/**
 * @namespace TreeLayoutConfiguration
 * @description This object contains default configuration for tree layout representations.
 *
 * @property {Number} translateX=0                      - Adds additional X translation for all SVG elements before rendering.
 * @property {Number} translateY=0                      - Adds additional Y translation for all SVG elements before rendering.
 * @property {Number} animationSpeed=300                - Determins how fast SVG elements animates inside the current layout.
 * @property {Number} orientation=vertical              - Determins how tree orientation. Available: "vertical" or "horizontal"
 * @property {Number} vSpacing=100                      - Determins the vertical spacing between nodes.
 * @property {Number} hSpacing=25                       - Determins the horizontal spacing between nodes.
 * @property {String} renderingSize=min                 - Determins the node render representation. Available: "min" or "max".
 * @property {Boolean} showAdditionEdges=true           - Renders additional edges to indicate loadable nodes.
 */
const TreeLayoutConfiguration = {
  translateX: 0,
  translateY: 0,
  animationSpeed: 300,
  orientation: "vertical",
  vSpacing: 100,
  hSpacing: 25,
  rootId: null,
  renderDepth: 0,
  renderingSize: "min", // min, max


  // renders additional edges to indicate possible nodes
  showLeafIndications: true,
  visibleNodeLimit: 5,
  leafIndicationLimit: 5,
  leafStrokeWidth: 2,
  leafStrokeColor: "#aaa",
  leafMarker: "M 0 0 L 6 3 L 0 6 z",
}

export default TreeLayoutConfiguration
