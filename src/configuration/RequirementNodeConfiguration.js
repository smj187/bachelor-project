
/**
 * @namespace RequirementNodeConfiguration
 * @description This object contains default configuration for requirement node representations.
 *
 * @property {Number} maxWidth=350                  - Sets the detailed node width.
 * @property {Number} maxHeight=225                 - Sets the detailed height.
 * @property {Number} minWidth=150                  - Sets the minimal node width.
 * @property {Number} minHeight=80                  - Sets the minimal node height.
 *
 * @property {Array.<DefaultStates>} states=Array   - Determines an array of aviable requirement states.
 * @property {String} states.state=provided         - Determines an array of aviable requirement states.
 * @property {String} states.name=provided          - Determines an array of aviable requirement states.
 * @property {String} states.color=provided         - Determines an array of aviable requirement states.
 *
 * @property {String} iconUrl=null                  - Determines the path to the image icon (if this value is null, the default icon is used).
 * @property {Number} minIconOpacity=0.5            - Determines the basic visibility of the icon in minimal representation.
 * @property {Number} minIconSize=70                - Determines the width and height for the image icon in minimal representation.
 * @property {Number} minIconTranslateX=0           - Determines the horizontal adjustment for the icon in minimal representation.
 * @property {Number} minIconTranslateY=0           - Determines the vertical adjustment for the icon in minimal representation.
 * @property {Number} maxIconOpacity=0.75           - Determines the basic visibility of the icon in detailed representation.
 * @property {Number} maxIconSize=30                - Determines the width and height for the image icon in detailed representation.
 * @property {Number} maxIconTranslateX=-140        - Determines the horizontal adjustment for the icon in detailed representation.
 * @property {Number} maxIconTranslateY=-85         - Determines the vertical adjustment for the icon in detailed representation.
 *
 * @property {Number} offset=8                      - Determines the spacing used for padding between label and background.
 * @property {Number} animationSpeed=300            - Determines how fast SVG elements animates inside the current layout.
 * @property {Number} borderRadius=5                - Determines the nodes border radius.
 * @property {Number} borderStrokeWidth=0           - Determines the nodes border stroke width.
 * @property {String} borderStrokeDasharray="0"     - Determines the nodes gaps used inside the border.
 *
 * @property {Number} minTextWidth=145              - Determines the text width for the label in minimal representation.
 * @property {Number} minLabelLineClamp=2           - Determines how many lines are visible for the label in minimal representation.
 * @property {Number} minTextTranslateX=0           - Determines the horizontal adjustment for the label in minimal representation.
 * @property {Number} minTextTranslateY=0           - Determines the vertical adjustment for the label in minimal representation.
 * @property {Number} maxTextWidth=345              - Determines the text width for the label in detailed representation.
 * @property {Number} maxTextHeight=220             - Determines the text height for the label in detailed representation.
 * @property {Number} maxLabelLineClamp=4           - Determines how many lines are visible for the label in detailed representation.
 * @property {Number} maxTextTranslateX=0           - Determines the horizontal adjustment for the label in detailed representation.
 * @property {Number} maxTextTranslateY=0           - Determines the vertical adjustment for the label in detailed representation.
 * @property {String} labelColor=#7fa5f5            - Determines the color for the label.
 * @property {String} labelFontFamily=Montserrat    - Determines the font family for the label.
 * @property {Number} labelFontSize=16              - Determines the font size for the label.
 * @property {Number} labelFontWeight=600           - Determines the font weight for the label.
 * @property {String} labelFontStyle=normal         - Determines the font style for the label.
 * @property {String} labelBackground=#ffffff       - Determines the background color for the label.
 * @property {String} detailsColor=#7fa5f5          - Determines the color for the details description.
 * @property {String} detailsFontFamily=Montserrat  - Determines the font family for the details description.
 * @property {Number} detailsFontSize=12            - Determines the font size for the details description.
 * @property {Number} detailsFontWeight=600         - Determines the font weight for the details description.
 * @property {String} detailsFontStyle=normal       - Determines the font style for the details description.
 * @property {String} detailsBackground=#ffffff     - Determines the background color for the details description.
 */

const RequirementNodeConfiguration = {
  // large node
  maxWidth: 370,
  maxHeight: 200,


  // small node
  minWidth: 155,
  minHeight: 50,


  // predefined node states
  states: [
    { state: "fulfilled", name: "Fulfilled", color: "#7ed167" },
    { state: "partially-fulfilled", name: "Partially Fulfilled", color: "#ffc453" },
    { state: "not-fulfilled", name: "Not Fulfilled", color: "#ff6655" },
    { state: "Unknown State", name: "Unknown State", color: "#84a8f2" },
  ],


  // node
  offset: 8,
  animationSpeed: 300,
  borderRadius: 8,
  borderStrokeWidth: 0,
  borderStrokeDasharray: "0",


  // text
  minTextWidth: 150, // recommended: min node width - some padding
  minLabelLineClamp: 2,
  minTextTranslateX: 0,
  minTextTranslateY: 0,
  maxTextWidth: 365,
  maxTextHeight: 195,
  maxLabelLineClamp: 4,
  maxTextTranslateX: 0,
  maxTextTranslateY: 0,
  maxLabelColor: "#ffffff",
  labelColor: "#ffffff",
  labelFontFamily: "Montserrat",
  labelFontSize: 14,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "none",
  detailsColor: "#ffffff",
  detailsFontFamily: "Montserrat",
  detailsFontSize: 12,
  detailsFontWeight: 600,
  detailsFontStyle: "normal",
  detailsBackground: "none",
}

export default RequirementNodeConfiguration
