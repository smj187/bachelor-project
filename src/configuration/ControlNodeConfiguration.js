/**
 * @namespace ControlNodeConfiguration
 * @description This object contains default configuration for control node representations.
 *
 * @property {Number} maxWidth=400                  - Sets the detailed node width.
 * @property {Number} maxHeight=190                 - Sets the detailed height.
 * @property {Number} minWidth=150                  - Sets the minimal node width.
 * @property {Number} minHeight=80                  - Sets the minimal node height.
 *
 * @property {String} iconUrl=null                  - Determins the path to the image icon (if this value is null, the default icon is used).
 * @property {Number} minIconOpacity=0.5            - Determins the basic visibility of the icon in minimal representation.
 * @property {Number} minIconSize=64                - Determins the width and height for the image icon in minimal representation.
 * @property {Number} minIconTranslateX=0           - Determins the horizontal adjustment for the icon in minimal representation.
 * @property {Number} minIconTranslateY=0           - Determins the vertical adjustment for the icon in minimal representation.
 * @property {Number} maxIconOpacity=0.75           - Determins the basic visibility of the icon in detailed representation.
 * @property {Number} maxIconSize=180               - Determins the width and height for the image icon in detailed representation.
 * @property {Number} maxIconTranslateX=-100        - Determins the horizontal adjustment for the icon in detailed representation.
 * @property {Number} maxIconTranslateY=0           - Determins the vertical adjustment for the icon in detailed representation.
 *
 * @property {Number} offset=8                      - Determins the spacing used for padding between label and background.
 * @property {Number} animationSpeed=300            - Determins how fast SVG elements animates inside the current layout.
 * @property {Number} borderRadius=5                - Determins the nodes border radius.
 * @property {Number} borderStrokeWidth=1           - Determins the nodes border stroke width.
 * @property {String} borderStrokeColor=#7daed6     - Determins the nodes border color.
 * @property {String} borderStrokeDasharray="0"     - Determins the nodes gaps used inside the border.
 * @property {String} backgroundColor=#ffffff       - Determins the nodes background color.
 *
 * @property {Number} minTextWidth=145              - Determins the text width for the label in minimal representation.
 * @property {Number} minTextHeight=75              - Determins the text height for the label in minimal representation.
 * @property {Number} minTextTranslateX=0           - Determins the horizontal adjustment for the label in minimal representation.
 * @property {Number} minTextTranslateY=0           - Determins the vertical adjustment for the label in minimal representation.
 * @property {Number} maxTextWidth=395              - Determins the text width for the label in detailed representation.
 * @property {Number} maxTextHeight=185             - Determins the text height for the label in detailed representation.
 * @property {Number} maxTextTranslateX=100         - Determins the horizontal adjustment for the label in detailed representation.
 * @property {Number} maxTextTranslateY=0           - Determins the vertical adjustment for the label in detailed representation.
 * @property {String} labelColor=#5b91b5            - Determins the color for the label.
 * @property {String} labelFontFamily=Montserrat    - Determins the font family for the label.
 * @property {Number} labelFontSize=16              - Determins the font size for the label.
 * @property {Number} labelFontWeight=600           - Determins the font weight for the label.
 * @property {String} labelFontStyle=normal         - Determins the font style for the label.
 * @property {String} labelBackground=#ffffff       - Determins the background color for the label.
 * @property {String} detailsColor=#5b91b5          - Determins the color for the details description.
 * @property {String} detailsFontFamily=Montserrat  - Determins the font family for the details description.
 * @property {Number} detailsFontSize=12            - Determins the font size for the details description.
 * @property {Number} detailsFontWeight=600         - Determins the font weight for the details description.
 * @property {String} detailsFontStyle=normal       - Determins the font style for the details description.
 * @property {String} detailsBackground=#ffffff     - Determins the background color for the details description.
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
    minIconSize: 64,
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
    minTextWidth: 145,
    minTextHeight: 75,
    minTextTranslateX: 0,
    minTextTranslateY: 0,
    maxTextWidth: 395,
    maxTextHeight: 185,
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
    detailsBackground: "#ffffff",
}


export default ControlNodeConfiguration