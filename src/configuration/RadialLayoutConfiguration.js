/**
 * @namespace RadialLayoutConfiguration
 * @description This object contains default configuration for radial layout representations.
 *
 * @property {Number} translateX=0                      - Adds additional X translation for all SVG elements before rendering.
 * @property {Number} translateY=0                      - Adds additional Y translation for all SVG elements before rendering.
 * @property {Number} animationSpeed=300                - Determines how fast SVG elements animates inside the current layout.
 * @property {Number} initialRadius=200                 - Determines the initial radial radius (limited to the first circle).
 * @property {Number} radiusDelta=350                   - Determines the remaining radial radius (starting on the second+ circle).
 * @property {Number} hAspect=4/3                       - Determines the horizontal aspect ratio.
 * @property {Number} wAspect=4/4                       - Determines the verrtical aspect ratio.
 * @property {String} renderingSize=min                 - Determines the node render representation. Available: "min" or "max".
 */
const RadialLayoutConfiguration = {
  translateX: 0,
  translateY: 0,
  animationSpeed: 300,
  initialRadius: 200,
  radiusDelta: 150,
  hAspect: 4 / 3,
  wAspect: 4 / 4,
  rootId: null,
  renderDepth: 0,
  renderingSize: "min",

  // renders additional edges to indicate possible nodes
  showLeafIndications: true,
  visibleNodeLimit: 555,
  leafIndicationLimit: 5,
  leafStrokeWidth: 2,
  leafStrokeColor: "#aaa",
  leafMarker: "M 0 0 L 6 3 L 0 6 z",
}

export default RadialLayoutConfiguration
