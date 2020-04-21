/**
 * @namespace GridLayoutConfiguration
 * @description This object contains default configuration for grid layout representations.
 *
 * @property {Number} limitColumns=3             - Limits how many columns the layout has.
 * @property {Number} limitNodes=null            - Limits how many nodes are rendered.
 * @property {Number} translateX=0               - Adds additional X translation for all SVG elements before rendering.
 * @property {Number} translateY=0               - Adds additional Y translation for all SVG elements before rendering.
 * @property {Number} animationSpeed=300         - Determins how fast SVG elements animates inside the current layout. 
 *                                                Note: this configuration can only be changed within the constructor.
 * @property {Number} spacing=32                 - Determins the minimal spacing between nodes.
 * @property {String} renderingSize=min          - Determins the node render representation. Available: "min" or "max".
 */
const GridLayoutConfiguration = {
  limitColumns: 4,
  limitNodes: null,
  translateX: 0,
  translateY: 0,
  animationSpeed: 300,
  spacing: 32,
  renderingSize: "min",
}


export default GridLayoutConfiguration
