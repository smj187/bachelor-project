/**
 * @namespace ControlNodeConfiguration
 * @description This object contains default configuration for control node representations.
 *
 * @property {Number} maxWidth=400                  - Sets the detailed node width.
 * @property {Number} maxHeight=190                 - Sets the detailed height.
 * @property {Number} minWidth=150                  - Sets the minimal node width.
 * @property {Number} minHeight=80                  - Sets the minimal node height.
 *
 * @property {String} iconUrl=null                  - Determines the path to the image icon (if this value is null, the default icon is used).
 * @property {Number} minIconOpacity=0.5            - Determines the basic visibility of the icon in minimal representation.
 * @property {Number} minIconSize=70                - Determines the width and height for the image icon in minimal representation.
 * @property {Number} minIconTranslateX=0           - Determines the horizontal adjustment for the icon in minimal representation.
 * @property {Number} minIconTranslateY=0           - Determines the vertical adjustment for the icon in minimal representation.
 * @property {Number} maxIconOpacity=0.75           - Determines the basic visibility of the icon in detailed representation.
 * @property {Number} maxIconSize=180               - Determines the width and height for the image icon in detailed representation.
 * @property {Number} maxIconTranslateX=-100        - Determines the horizontal adjustment for the icon in detailed representation.
 * @property {Number} maxIconTranslateY=0           - Determines the vertical adjustment for the icon in detailed representation.
 *
 * @property {Number} offset=8                      - Determines the spacing used for padding between label and background.
 * @property {Number} animationSpeed=300            - Determines how fast SVG elements animates inside the current layout.
 * @property {Number} borderRadius=5                - Determines the nodes border radius.
 * @property {Number} borderStrokeWidth=1           - Determines the nodes border stroke width.
 * @property {String} borderStrokeColor=#7daed6     - Determines the nodes border color.
 * @property {String} borderStrokeDasharray="0"     - Determines the nodes gaps used inside the border.
 * @property {String} backgroundColor=#ffffff       - Determines the nodes background color.
 *
 * @property {Number} minTextWidth=145              - Determines the text width for the label in minimal representation.
 * @property {Number} minLabelLineClamp=2           - Determines how many lines are visible for the label in minimal representation.
 * @property {Number} minTextTranslateX=0           - Determines the horizontal adjustment for the label in minimal representation.
 * @property {Number} minTextTranslateY=0           - Determines the vertical adjustment for the label in minimal representation.
 * @property {Number} maxTextWidth=395              - Determines the text width for the label in detailed representation.
 * @property {Number} maxTextHeight=185             - Determines the text height for the label in detailed representation.
 * @property {Number} maxLabelLineClamp=4           - Determines how many lines are visible for the label in detailed representation.
 * @property {Number} maxTextTranslateX=100         - Determines the horizontal adjustment for the label in detailed representation.
 * @property {Number} maxTextTranslateY=0           - Determines the vertical adjustment for the label in detailed representation.
 * @property {String} labelColor=#5b91b5            - Determines the color for the label.
 * @property {String} labelFontFamily=Montserrat    - Determines the font family for the label.
 * @property {Number} labelFontSize=16              - Determines the font size for the label.
 * @property {Number} labelFontWeight=600           - Determines the font weight for the label.
 * @property {String} labelFontStyle=normal         - Determines the font style for the label.
 * @property {String} labelBackground=#ffffff       - Determines the background color for the label.
 * @property {String} detailsColor=#5b91b5          - Determines the color for the details description.
 * @property {String} detailsFontFamily=Montserrat  - Determines the font family for the details description.
 * @property {Number} detailsFontSize=12            - Determines the font size for the details description.
 * @property {Number} detailsFontWeight=600         - Determines the font weight for the details description.
 * @property {String} detailsFontStyle=normal       - Determines the font style for the details description.
 * @property {String} detailsBackground=#ffffff     - Determines the background color for the details description.
 */
const ControlNodeConfiguration = {
  // large node
  maxWidth: 400,
  maxHeight: 190,


  // small node
  minWidth: 150,
  minHeight: 80,


  // icon
  iconUrl: null,
  minIconOpacity: 0.5,
  minIconSize: 70,
  minIconTranslateX: 0,
  minIconTranslateY: 0,
  maxIconOpacity: 0.75,
  maxIconSize: 180,
  maxIconTranslateX: -100,
  maxIconTranslateY: 0,


  // node
  offset: 8,
  animationSpeed: 300,
  borderRadius: 5,
  borderStrokeWidth: 1,
  borderStrokeColor: "#7daed6",
  borderStrokeDasharray: "0",
  backgroundColor: "#ffffff",


  // text
  minTextWidth: 145, // recommended: min node width - some padding
  minLabelLineClamp: 2,
  minTextTranslateX: 0,
  minTextTranslateY: 0,
  maxTextWidth: 195,
  maxTextHeight: 185,
  maxLabelLineClamp: 4,
  maxTextTranslateX: 100,
  maxTextTranslateY: 0,
  labelColor: "#5b91b5",
  labelFontFamily: "Montserrat",
  labelFontSize: 16,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#ffffffcc",
  detailsColor: "#5b91b5",
  detailsFontFamily: "Montserrat",
  detailsFontSize: 12,
  detailsFontWeight: 600,
  detailsFontStyle: "normal",
  detailsBackground: "#ffffffcc",
}


export default ControlNodeConfiguration
