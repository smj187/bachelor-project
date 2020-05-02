/**
 * @namespace ThinEdgeConfiguration
 * @description This object contains default configuration for thin edge representations.
 *
 * @property {Number} offset=8                                  - Sets the spacing used for padding between label and background.
 * @property {Number} animationSpeed=300                        - Determines how fast SVG elements animates inside the current layout.
 * @property {String} type=solid                                - Determines the edge type. Available: "solid" or "dashed".
 *
 * @property {Number} strokeWidth=2                             - Determines the edges thickness.
 * @property {String} strokeColor=#aaaaaa                       - Determines the edges color.
 * @property {String} strokeDasharray="13 5"                    - Determines the graps in the edge line (dashed edge specific).
 * @property {marker} strokeDasharray="M 0 0 L 6 3 L 0 6 z"     - Determines the shape of the arrow head.
 *
 * @property {String} labelWidth=125                            - Determines the text width for the label.
 * @property {String} labelLineClamp=1                          - Determines how many lines are visible for the label.
 * @property {String} labelTranslateX=0                         - Determines the horizontal adjustment for the label.
 * @property {String} labelTranslateY=0                         - Determines the vertical adjustment for the label.
 * @property {String} labelColor=#777777                        - Determines the color for the label.
 * @property {String} labelFontFamily=Montserrat                - Determines the font family for the label.
 * @property {Number} labelFontSize=16                          - Determines the font size for the label.
 * @property {Number} labelFontWeight=600                       - Determines the font weight for the label.
 * @property {String} labelFontStyle=normal                     - Determines the font style for the label.
 * @property {String} labelBackground=#ffffffcc                 - Determines the background color for the label.
 */
const ThinEdgeConfiguration = {
  offset: 8,
  animationSpeed: 300,
  type: "solid",

  // arrow
  strokeWidth: 2,
  strokeColor: "#aaaaaa",
  strokeDasharray: "13 5", // (dashed edge specific)
  marker: "M 0 0 L 6 3 L 0 6 z",


  // text
  labelWidth: 125, // recommended: min node width - some padding
  labelLineClamp: 1,
  labelTranslateX: 0,
  labelTranslateY: 0,

  labelColor: "#777777",
  labelFontFamily: "Montserrat",
  labelFontSize: 16,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#ffffffcc",
}

export default ThinEdgeConfiguration
