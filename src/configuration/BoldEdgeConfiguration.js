/**
 * @namespace BoldEdgeConfiguration
 * @description This object contains default configuration for bold edge representations.
 *
 * @category SVG Representations
 * @subcategory Customizations
 * @property {Number} offset=8                      - Sets the spacing used for padding between label and background.
 * @property {Number} animationSpeed=300            - Determines how fast SVG elements animates inside the current layout.
 * @property {String} color=null                    - Sets the default edge color. If set to null, it inherent its color.
 *
 * @property {String} lineWidth=25                  - Determines the thickness of the SVG element.
 * @property {String} arrowWidth=40                 - Determines how long the arrow head appears.
 * @property {String} arrowHeight=20                - Determines the thickness of the arrow head.
 *
 * @property {Number} strokeWidth=0                 - Determines the edges thickness.
 * @property {String} strokeColor=#ffffff           - Determines the edges color.
 * @property {String} strokeDasharray="0"           - Determines the graps in the edge line (dashed edge specific).
 *
 * @property {String} labelWidth=150                - Determines the text width for the label.
 * @property {String} labelLineClamp=1              - Determines how many lines are visible for the label.
 * @property {String} labelTranslateX=0             - Determines the horizontal adjustment for the label.
 * @property {String} labelTranslateY=0             - Determines the vertical adjustment for the label.
 * @property {String} labelColor=#222222            - Determines the color for the label.
 * @property {String} labelFontFamily=Montserrat    - Determines the font family for the label.
 * @property {Number} labelFontSize=16              - Determines the font size for the label.
 * @property {Number} labelFontWeight=600           - Determines the font weight for the label.
 * @property {String} labelFontStyle=normal         - Determines the font style for the label.
 * @property {String} labelBackground=#ffffffcc     - Determines the background color for the label.
 */
const BoldEdgeConfiguration = {
  offset: 16,
  animationSpeed: 300,

  color: "inherit", // #cccccc, inherit

  lineWidth: 25,
  arrowWidth: 40,
  arrowHeight: 20,

  strokeWidth: 0,
  strokeColor: "#fff", // #cccccc, inherit
  strokeDasharray: "0",

  // text
  labelWidth: 150, // recommended: min node width - some padding
  labelLineClamp: 1,
  labelTranslateX: 0,
  labelTranslateY: 5,

  labelColor: "#222222",
  labelFontFamily: "Montserrat",
  labelFontSize: 16,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#ffffffcc",

}

export default BoldEdgeConfiguration
