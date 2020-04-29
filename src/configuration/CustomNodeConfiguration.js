/**
 * @namespace CustomNodeConfiguration
 * @description This object contains default configuration for custom node representations.
 *
 * @property {String} nodeType=rect                 - Determins the form the node is rendered. Available: "path", "rect" or "ellipse".
 * @property {String} svg=null                      - Determines the custom SVG path that is rendered as node but only if nodeType is set to "path".
 *
 * @property {Number} maxWidth=275                  - Sets the detailed node width.
 * @property {Number} maxHeight=175                 - Sets the detailed height.
 * @property {Number} minWidth=200                  - Sets the minimal node width.
 * @property {Number} minHeight=100                 - Sets the minimal node height.
 *
 * @property {String} iconUrl=null                  - Determins the path to the image icon (if this value is null, the default icon is used).
 * @property {Number} minIconOpacity=0.3            - Determins the basic visibility of the icon in minimal representation.
 * @property {Number} minIconSize=70                - Determins the width and height for the image icon in minimal representation.
 * @property {Number} minIconTranslateX=0           - Determins the horizontal adjustment for the icon in minimal representation.
 * @property {Number} minIconTranslateY=0           - Determins the vertical adjustment for the icon in minimal representation.
 * @property {Number} maxIconOpacity=0.4            - Determins the basic visibility of the icon in detailed representation.
 * @property {Number} maxIconSize=200               - Determins the width and height for the image icon in detailed representation.
 * @property {Number} maxIconTranslateX=0           - Determins the horizontal adjustment for the icon in detailed representation.
 * @property {Number} maxIconTranslateY=0           - Determins the vertical adjustment for the icon in detailed representation.
 *
 * @property {Number} offset=8                      - Determins the spacing used for padding between label and background.
 * @property {Number} animationSpeed=300            - Determins how fast SVG elements animates inside the current layout.
 * @property {Number} borderRadius=5                - Determins the nodes border radius.
 * @property {Number} borderStrokeWidth=1           - Determins the nodes border stroke width.
 * @property {String} borderStrokeColor=#222222     - Determins the nodes border color.
 * @property {String} borderStrokeDasharray="0"     - Determins the nodes gaps used inside the border.
 * @property {String} backgroundColor=#ffffff       - Determins the nodes background color.
 *
 * @property {Number} minTextWidth=145              - Determins the text width for the label in minimal representation.
 * @property {Number} minTextHeight=75              - Determins the text height for the label in minimal representation.
 * @property {Number} minTextTranslateX=0           - Determins the horizontal adjustment for the label in minimal representation.
 * @property {Number} minTextTranslateY=0           - Determins the vertical adjustment for the label in minimal representation.
 * @property {Number} maxTextWidth=260              - Determins the text width for the label in detailed representation.
 * @property {Number} maxTextHeight=220             - Determins the text height for the label in detailed representation.
 * @property {Number} maxTextTranslateX=0           - Determins the horizontal adjustment for the label in detailed representation.
 * @property {Number} maxTextTranslateY=0           - Determins the vertical adjustment for the label in detailed representation.
 * @property {String} labelColor=#444444            - Determins the color for the label.
 * @property {String} labelFontFamily=Montserrat    - Determins the font family for the label.
 * @property {Number} labelFontSize=16              - Determins the font size for the label.
 * @property {Number} labelFontWeight=600           - Determins the font weight for the label.
 * @property {String} labelFontStyle=normal         - Determins the font style for the label.
 * @property {String} labelBackground=#ffffffcc     - Determins the background color for the label.
 * @property {String} detailsColor=#444444          - Determins the color for the details description.
 * @property {String} detailsFontFamily=Montserrat  - Determins the font family for the details description.
 * @property {Number} detailsFontSize=12            - Determins the font size for the details description.
 * @property {Number} detailsFontWeight=600         - Determins the font weight for the details description.
 * @property {String} detailsFontStyle=normal       - Determins the font style for the details description.
 * @property {String} detailsBackground=#ffffffcc   - Determins the background color for the details description.
 */

const CustomNodeConfiguration = {

  nodeType: "rect", // rect, ellipse or path
  svgPathElement: null,

  // large node
  maxWidth: 275,
  maxHeight: 175,


  // small node
  minWidth: 200,
  minHeight: 100,


  // icon
  iconUrl: null,
  minIconOpacity: 0.3,
  minIconSize: 70,
  minIconTranslateX: 0,
  minIconTranslateY: 0,
  maxIconOpacity: 0.4,
  maxIconSize: 200,
  maxIconTranslateX: 0,
  maxIconTranslateY: 0,


  // node
  offset: 8,
  animationSpeed: 300,
  borderRadius: 5,
  borderStrokeWidth: 1,
  borderStrokeColor: "#222222",
  borderStrokeDasharray: "0",
  backgroundColor: "#ffffff",


  // text
  minTextWidth: 145,
  minTextHeight: 75,
  minTextTranslateX: 0,
  minTextTranslateY: 0,
  maxTextWidth: 260,
  maxTextHeight: 220,
  maxTextTranslateX: 0,
  maxTextTranslateY: 0,
  labelColor: "#444444",
  labelFontFamily: "Montserrat",
  labelFontSize: 16,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#ffffffcc",
  detailsColor: "#444444",
  detailsFontFamily: "Montserrat",
  detailsFontSize: 12,
  detailsFontWeight: 600,
  detailsFontStyle: "normal",
  detailsBackground: "#ffffffcc",
}

export default CustomNodeConfiguration
