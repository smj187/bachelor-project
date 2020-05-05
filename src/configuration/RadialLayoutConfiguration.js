/**
 * @namespace RadialLayoutConfiguration
 * @description This object contains default configuration for radial layout representations.
 *
 * @property {Number} translateX=0                      - Adds additional X translation for all SVG elements before rendering.
 * @property {Number} translateY=0                      - Adds additional Y translation for all SVG elements before rendering.
 * @property {Number} animationSpeed=300                - Determines how fast SVG elements animates inside the current layout.
 * @property {Number} hAspect=4/3                       - Determines the horizontal aspect ratio.
 * @property {Number} wAspect=4/4                       - Determines the verrtical aspect ratio.
 * @property {Number} rootId=null                       - Determines the selected root id.
 * @property {Number} renderDepth=0                     - Determines the current render depth.
 * @property {String} renderingSize=min                 - Determines the node render representation. Available: "min" or "max".
 *
 * @property {Boolean} showLeafIndications=true         - Determines whether additional indications for possible children are visible.
 * @property {Boolean} leafIndicationLimit=5            - Determines the maximal amount of indications per node.
 * @property {Boolean} leafStrokeWidth=2                - Determines a leafs thickness.
 * @property {Boolean} leafStrokeColor="#aaa"           - Determines a leafs color.
 * @property {Boolean} leafMarker="M 0 0 L 6 3 L 0 6 z" - Determines a leafs arrow head shape.
 */
const RadialLayoutConfiguration = {
  translateX: 0,
  translateY: 0,
  animationSpeed: 300,
  hAspect: 4 / 3,
  wAspect: 4 / 4,
  rootId: null,
  renderDepth: 0,
  renderingSize: "min", // min, max

  // renders additional edges to indicate possible nodes
  showLeafIndications: true,
  leafIndicationLimit: 5,
  leafStrokeWidth: 2,
  leafStrokeColor: "#aaa",
  leafMarker: "M 0 0 L 6 3 L 0 6 z",
}

export default RadialLayoutConfiguration
