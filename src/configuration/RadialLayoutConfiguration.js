/**
 * @namespace RadialLayoutConfiguration
 * @description This object contains default configuration for radial layout representations.
 *
 * @property {Number} translateX=0                      - Adds additional X translation for all SVG elements before rendering.
 * @property {Number} translateY=0                      - Adds additional Y translation for all SVG elements before rendering.
 * @property {Number} animationSpeed=300                - Determins how fast SVG elements animates inside the current layout.
 * @property {Number} radialRadius=200                  - Determins the initial radial radius (limited to the first circle).
 * @property {Number} radiusDelta=350                   - Determins the remaining radial radius (starting on the second+ circle).
 * @property {Number} hAspect=4/3                       - Determins the horizontal aspect ratio.
 * @property {Number} wAspect=4/4                       - Determins the verrtical aspect ratio.
 * @property {String} renderingSize=min                 - Determins the node render representation. Available: "min" or "max".
 */
const RadialLayoutConfiguration = {
  translateX: 0,
  translateY: 0,
  animationSpeed: 300,
  radialRadius: 200,
  radiusDelta: 150,
  hAspect: 4 / 3,
  wAspect: 4 / 4,
  renderingSize: "min",
}

export default RadialLayoutConfiguration
