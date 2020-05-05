
/**
 * @namespace CustomEdgeConfiguration
 * @description This object contains default configuration for custom edge representations.
 *
 * @category SVG Representations
 * @subcategory Customizations
 * @property {Number} offset=8                                  - Sets the spacing used for padding between label and background.
 * @property {Number} animationSpeed=300                        - Determines how fast SVG elements animates inside the current layout.
 *
 * @property {Number} strokeWidth=2                             - Determines the edges thickness.
 * @property {String} strokeColor=#222222                       - Determines the edges color.
 * @property {String} strokeDasharray="0"                       - Determines the graps in the edge line (dashed edge specific).
 * @property {marker} strokeDasharray="M 0 0 L 6 3 L 0 6 z"     - Determines the shape of the arrow head.
 * @property {marker} markerWidth=12                            - Determines the arrows heads width.
 * @property {marker} markerHeight=6                            - Determines the arrows heads height.
 *
 * @property {String} labelWidth=125                            - Determines the text width for the label.
 * @property {String} labelLineClamp=1                          - Determines how many lines are visible for the label.
 * @property {String} labelTranslateX=0                         - Determines the horizontal adjustment for the label.
 * @property {String} labelTranslateY=0                         - Determines the vertical adjustment for the label.
 * @property {String} labelColor=#ffffff                        - Determines the color for the label.
 * @property {String} labelFontFamily=Montserrat                - Determines the font family for the label.
 * @property {Number} labelFontSize=16                          - Determines the font size for the label.
 * @property {Number} labelFontWeight=600                       - Determines the font weight for the label.
 * @property {String} labelFontStyle=normal                     - Determines the font style for the label.
 * @property {String} labelBackground=#cccccc                   - Determines the background color for the label.
 */
const CustomEdgeConfiguration = {
  offset: 8,
  animationSpeed: 300,

  // arrow
  strokeWidth: 2,
  strokeColor: "#222222",
  strokeDasharray: "0",
  marker: "M 0 0 L 6 3 L 0 6 z",
  markerWidth: 12,
  markerHeight: 6,


  // text
  labelWidth: 125,
  labelLineClamp: 1,
  labelTranslateX: 0,
  labelTranslateY: 0,

  labelColor: "#ffffff",
  labelFontFamily: "Montserrat",
  labelFontSize: 16,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#cccccc",
}

export default CustomEdgeConfiguration
