/**
 * @namespace CustomNodeConfiguration
 * @description This object contains default configuration for custom node representations.
 *
 * @category SVG Representations
 * @subcategory Customizations
 * @property {String} nodeType=rect                 - Determines the form the node is rendered. Available: "path", "rect" or "ellipse".
 * @property {String} svg=null                      - Determines the custom SVG path that is rendered as node but only if nodeType is set to "path".
 *
 * @property {Number} maxWidth=275                  - Sets the detailed node width.
 * @property {Number} maxHeight=175                 - Sets the detailed height.
 * @property {Number} minWidth=200                  - Sets the minimal node width.
 * @property {Number} minHeight=100                 - Sets the minimal node height.
 *
 * @property {String} iconUrl=null                  - Determines the path to the image icon (if this value is null, the default icon is used).
 * @property {Number} minIconOpacity=0.3            - Determines the basic visibility of the icon in minimal representation.
 * @property {Number} minIconSize=70                - Determines the width and height for the image icon in minimal representation.
 * @property {Number} minIconTranslateX=0           - Determines the horizontal adjustment for the icon in minimal representation.
 * @property {Number} minIconTranslateY=0           - Determines the vertical adjustment for the icon in minimal representation.
 * @property {Number} maxIconOpacity=0.4            - Determines the basic visibility of the icon in detailed representation.
 * @property {Number} maxIconSize=160               - Determines the width and height for the image icon in detailed representation.
 * @property {Number} maxIconTranslateX=0           - Determines the horizontal adjustment for the icon in detailed representation.
 * @property {Number} maxIconTranslateY=0           - Determines the vertical adjustment for the icon in detailed representation.
 *
 * @property {Number} offset=8                      - Determines the spacing used for padding between label and background.
 * @property {Number} animationSpeed=300            - Determines how fast SVG elements animates inside the current layout.
 * @property {Number} borderRadius=5                - Determines the nodes border radius.
 * @property {Number} borderStrokeWidth=1           - Determines the nodes border stroke width.
 * @property {String} borderStrokeColor=#222222     - Determines the nodes border color.
 * @property {String} borderStrokeDasharray="0"     - Determines the nodes gaps used inside the border.
 * @property {String} backgroundColor=#ffffff       - Determines the nodes background color.
 *
 * @property {Number} minLabelLineClamp=2           - Determines how many lines are visible for the label in minimal representation.
 * @property {Number} minTextTranslateX=0           - Determines the horizontal adjustment for the label in minimal representation.
 * @property {Number} minTextTranslateY=0           - Determines the vertical adjustment for the label in minimal representation.
 * @property {Number} maxTextWidth=260              - Determines the text width for the label in detailed representation.
 * @property {Number} maxTextHeight=220             - Determines the text height for the label in detailed representation.
 * @property {Number} maxLabelLineClamp=4           - Determines how many lines are visible for the label in detailed representation.
 * @property {Number} maxTextTranslateX=0           - Determines the horizontal adjustment for the label in detailed representation.
 * @property {Number} maxTextTranslateY=0           - Determines the vertical adjustment for the label in detailed representation.
 * @property {String} labelColor=#444444            - Determines the color for the label.
 * @property {String} labelFontFamily=Montserrat    - Determines the font family for the label.
 * @property {Number} labelFontSize=16              - Determines the font size for the label.
 * @property {Number} labelFontWeight=600           - Determines the font weight for the label.
 * @property {String} labelFontStyle=normal         - Determines the font style for the label.
 * @property {String} labelBackground=#ffffffcc     - Determines the background color for the label.
 * @property {String} detailsColor=#444444          - Determines the color for the details description.
 * @property {String} detailsFontFamily=Montserrat  - Determines the font family for the details description.
 * @property {Number} detailsFontSize=12            - Determines the font size for the details description.
 * @property {Number} detailsFontWeight=600         - Determines the font weight for the details description.
 * @property {String} detailsFontStyle=normal       - Determines the font style for the details description.
 * @property {String} detailsBackground=#ffffffcc   - Determines the background color for the details description.
 */

const CustomNodeConfiguration = {

  // node
  shape: "rect", // rect (default), circle, ellipse, polyline or path
  polyline: null, // only needed if shape is set to polyline
  path: null, // only needed if shape is set to path
  animationSpeed: 1300,
  borderRadius: 5,
  borderStrokeWidth: 1,
  borderStrokeColor: "#222222",
  borderStrokeDasharray: "0",
  backgroundColor: "#ffffff",
  iconUrl: null,


  // minimal (small) node
  minWidth: 200,
  minHeight: 100,
  minIconOpacity: 0.3,
  minIconSize: 70,
  minIconTranslateX: 0,
  minIconTranslateY: 0,
  minLabelLineClamp: 2,
  minLabelTranslateX: 0,
  minLabelTranslateY: 0,
  minLabelPadding: 6,

  labelColor: "#222222",
  labelFontFamily: "Montserrat",
  labelFontSize: 16,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#ffffff33",


  // detailed (large) node
  maxWidth: 275,
  maxHeight: 175,
  maxIconOpacity: 0.4,
  maxIconSize: 160,
  maxIconTranslateX: 0,
  maxIconTranslateY: 0,
  maxLabelLineClamp: 4,
  maxTextTranslateX: 0,
  maxTextTranslateY: 0,
  maxLabelPadding: 6,
  maxLabelAlignment: "left",

  detailsAlignment: "left",
  detailsPadding: 6,
  detailsColor: "#444444",
  detailsFontFamily: "Montserrat",
  detailsFontSize: 12,
  detailsFontWeight: 600,
  detailsFontStyle: "normal",
  detailsBackground: "#ffffffcc",
}

export default CustomNodeConfiguration
