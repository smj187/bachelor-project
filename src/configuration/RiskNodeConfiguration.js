
/**
 * @namespace RiskNodeConfiguration
 * @description This object contains default configuration for risk node representations.
 *
 * @category SVG Representations
 * @subcategory Customizations
 * @property {Number} maxWidth=300                  - Sets the detailed node width.
 * @property {Number} maxHeight=150                 - Sets the detailed height.
 * @property {Number} minWidth=150                  - Sets the minimal node width.
 * @property {Number} minHeight=50                  - Sets the minimal node height.
 *
 * @property {String} iconUrl=null                  - Determines the path to the image icon (if this value is null, the default icon is used).
 * @property {Number} minIconOpacity=0.5            - Determines the basic visibility of the icon in minimal representation.
 * @property {Number} minIconSize=35                - Determines the width and height for the image icon in minimal representation.
 * @property {Number} minIconTranslateX=-45         - Determines the horizontal adjustment for the icon in minimal representation.
 * @property {Number} minIconTranslateY=0           - Determines the vertical adjustment for the icon in minimal representation.
 * @property {Number} maxIconOpacity=0.75           - Determines the basic visibility of the icon in detailed representation.
 * @property {Number} maxIconSize=30                - Determines the width and height for the image icon in detailed representation.
 * @property {Number} maxIconTranslateX=-120        - Determines the horizontal adjustment for the icon in detailed representation.
 * @property {Number} maxIconTranslateY=-55         - Determines the vertical adjustment for the icon in detailed representation.
 *
 * @property {Number} offset=8                      - Determines the spacing used for padding between label and background.
 * @property {Number} animationSpeed=300            - Determines how fast SVG elements animates inside the current layout.
 * @property {Number} borderRadius=4                - Determines the nodes border radius.
 * @property {Number} borderStrokeWidth=1           - Determines the nodes border stroke width.
 * @property {String} borderStrokeColor=#F26A7C     - Determines the nodes border color.
 * @property {String} borderStrokeDasharray="5 10"  - Determines the nodes gaps used inside the border.
 * @property {String} backgroundColor=#ffffff       - Determines the nodes background color.
 *
 * @property {Number} minTextWidth=90               - Determines the text width for the label in minimal representation.
 * @property {Number} minLabelLineClamp=1           - Determines how many lines are visible for the label in minimal representation.
 * @property {Number} minTextTranslateX=22.5        - Determines the horizontal adjustment for the label in minimal representation.
 * @property {Number} minTextTranslateY=0           - Determines the vertical adjustment for the label in minimal representation.
 * @property {Number} maxTextWidth=295              - Determines the text width for the label in detailed representation.
 * @property {Number} maxTextHeight=145             - Determines the text height for the label in detailed representation.
 * @property {Number} maxLabelLineClamp=2           - Determines how many lines are visible for the label in detailed representation.
 * @property {Number} maxTextTranslateX=0           - Determines the horizontal adjustment for the label in detailed representation.
 * @property {Number} maxTextTranslateY=0           - Determines the vertical adjustment for the label in detailed representation.
 * @property {String} labelColor=#ff8e9e            - Determines the color for the label.
 * @property {String} labelFontFamily=Montserrat    - Determines the font family for the label.
 * @property {Number} labelFontSize=14              - Determines the font size for the label.
 * @property {Number} labelFontWeight=600           - Determines the font weight for the label.
 * @property {String} labelFontStyle=normal         - Determines the font style for the label.
 * @property {String} labelBackground=#ffffff       - Determines the background color for the label.
 * @property {String} detailsColor=#ff8e9e          - Determines the color for the details description.
 * @property {String} detailsFontFamily=Montserrat  - Determines the font family for the details description.
 * @property {Number} detailsFontSize=12            - Determines the font size for the details description.
 * @property {Number} detailsFontWeight=600         - Determines the font weight for the details description.
 * @property {String} detailsFontStyle=normal       - Determines the font style for the details description.
 * @property {String} detailsBackground=#ffffff     - Determines the background color for the details description.
 */
const RiskNodeConfiguration = {
  // large node
  maxWidth: 300,
  maxHeight: 150,


  // small node
  minWidth: 150,
  minHeight: 50,


  // icon
  iconUrl: null,
  minIconOpacity: 0.5,
  minIconSize: 35,
  minIconTranslateX: -45,
  minIconTranslateY: 0,
  maxIconOpacity: 0.75,
  maxIconSize: 30,
  maxIconTranslateX: -120,
  maxIconTranslateY: -55,


  // node
  offset: 8,
  animationSpeed: 300,
  borderRadius: 4,
  borderStrokeWidth: 1,
  borderStrokeColor: "#F26A7C",
  borderStrokeDasharray: "5 10",
  backgroundColor: "#ffffff",


  // text
  minTextWidth: 90, // recommended: min node width - some padding
  minLabelLineClamp: 1,
  minTextTranslateX: 22.5,
  minTextTranslateY: 0,
  maxTextWidth: 295,
  maxTextHeight: 145,
  maxLabelLineClamp: 2,
  maxTextTranslateX: 0,
  maxTextTranslateY: 0,
  labelColor: "#ff8e9e",
  labelFontFamily: "Montserrat",
  labelFontSize: 14,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#ffffff",
  detailsColor: "#ff8e9e",
  detailsFontFamily: "Montserrat",
  detailsFontSize: 12,
  detailsFontWeight: 600,
  detailsFontStyle: "normal",
  detailsBackground: "transparent",
}

export default RiskNodeConfiguration
