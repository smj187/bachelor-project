/**
 * This object contains default configuration for grid layout representations.
 * @typedef {GridConfiguration} GridConfiguration
 *
 * @param {Number} [maxColumns=3] Determins how many columns the current layout contains
 * @param {Number} [maxRows=3] Determins how many rows the current layout contains
 * @param {Number} [nodeLimiter=null] Determins how many nodes are rendered maximal
 * @param {Number} [translateX=0] Adds additional X translation for all SVG elements before rendering
 * @param {Number} [translateY=0] Adds additional Y translation for all SVG elements before rendering
 * @param {Number} [animationSpeed=300] Determins how fast SVG elements animates inside the current layout
 * @param {Boolean} [hideOtherLayouts=false] Hides other layouts, if set to true, else layouts will appear side-by-side
 * @param {Number} [spacing=32] Adds spacing between different SVG representations
 * @param {String} [layoutBackgroundColor=null] Adds a background color to the current layout
 * @param {Number} [layoutBackgroundBorderRadius=32] Adds a border radius to the current layout
 * @param {String} [renderingSize="min"] Determins if all nodes are rendered in minimal or maximal representation
 */

const GridConfiguration = {

  // limits the layout in columns
  maxColumns: 2,


  // // limits the layout in rows
  // maxRows: 10, not used..


  // limits how many nodes are rendered maximal
  limit: null,


  // adds additional X and Y translation for all SVG elements before rendering
  translateX: 0,
  translateY: 0,


  // determins how fast SVG elements animated inside the current layout
  animationSpeed: 300,


  // if set to ture, then other layouts will be hidden as long this variable changes
  hideOtherLayouts: false, // TODO:


  // adds spacing between different SVG representations
  spacing: 32,


  // adds a background color and eventually a border radius to the current layout
  renderLayoutBackground: true, // true, false
  layoutBackgroundColor: "#fff",
  layoutBackgroundBorderRadius: 10,
  layoutBackgroundBorderStrokeWidth: 1.5,
  layoutBackgroundBorderStrokeColor: "#222",
  layoutBackgroundBorderStrokeDasharray: "0",


  // determins if all nodes are rendered in minimal or maximal representation
  renderingSize: "min", //  min max
}


export default GridConfiguration
