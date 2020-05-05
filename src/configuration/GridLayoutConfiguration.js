/**
 * @namespace GridLayoutConfiguration
 * @description This object contains default configuration for grid layout representations.
 *
 * @category Layouts
 * @subcategory Customizations
 * @property {Number} limitColumns=3                  - Limits how many columns the layout has.
 * @property {Number} limitNodes=null                 - Limits how many nodes are rendered.
 * @property {Number} translateX=0                    - Adds additional X translation for all SVG elements before rendering.
 * @property {Number} translateY=0                    - Adds additional Y translation for all SVG elements before rendering.
 * @property {Number} animationSpeed=300              - Determines how fast SVG elements animates inside the current layout.
 * @property {Number} vSpacing=100                    - Determines the vertical spacing between nodes.
 * @property {Number} hSpacing=25                     - Determines the horizontal spacing between nodes.
 * @property {String} renderingSize=min               - Determines the node render representation. Available: "min" or "max".
 * 
 * @property {String} expanderTextColor=#222          - Determines the color for the text.
 * @property {String} expanderFontFamily=Montserrat   - Determines the font family for the text.
 * @property {String} expanderFontSize=14             - Determines the font size for the text.
 * @property {String} expanderFontWeight=600          - Determines the font weight for the text.
 * @property {String} expanderFontStyle=normal        - Determines the font style for the text.
 * @property {String} expanderTextBackground=#ccc     - Determines the background color for the text.
 */
const GridLayoutConfiguration = {
  limitColumns: 4,
  limitNodes: null,
  translateX: 0,
  translateY: 0,
  animationSpeed: 300,
  vSpacing: 25,
  hSpacing: 50,
  renderingSize: "min",

  // expander
  expanderTextColor: "#222",
  expanderFontFamily: "Montserrat",
  expanderFontSize: 14,
  expanderFontWeight: 600,
  expanderFontStyle: "normal",
  expanderTextBackground: "#ccc"
}


export default GridLayoutConfiguration
