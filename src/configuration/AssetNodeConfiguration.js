/**
 * @namespace AssetNodeConfiguration
 * @description This object contains default configuration for asset node representations.
 *
 * @property {Number} maxWidth=350                  - Sets the detailed node width.
 * @property {Number} maxHeight=225                 - Sets the detailed height.
 * @property {Number} minWidth=150                  - Sets the minimal node width.
 * @property {Number} minHeight=80                  - Sets the minimal node height.
 *
 * @property {String} iconUrl=null                  - Determins the path to the image icon (if this value is null, the default icon is used).
 * @property {Number} minIconOpacity=0.5            - Determins the basic visibility of the icon in minimal representation.
 * @property {Number} minIconSize=70                - Determins the width and height for the image icon in minimal representation.
 * @property {Number} minIconTranslateX=0           - Determins the horizontal adjustment for the icon in minimal representation.
 * @property {Number} minIconTranslateY=0           - Determins the vertical adjustment for the icon in minimal representation.
 * @property {Number} maxIconOpacity=0.75           - Determins the basic visibility of the icon in detailed representation.
 * @property {Number} maxIconSize=30                - Determins the width and height for the image icon in detailed representation.
 * @property {Number} maxIconTranslateX=-140        - Determins the horizontal adjustment for the icon in detailed representation.
 * @property {Number} maxIconTranslateY=-85         - Determins the vertical adjustment for the icon in detailed representation.
 *
 * @property {Number} offset=8                      - Determins the spacing used for padding between label and background.
 * @property {Number} animationSpeed=300            - Determins how fast SVG elements animates inside the current layout.
 * @property {Number} borderRadius=5                - Determins the nodes border radius.
 * @property {Number} borderStrokeWidth=1           - Determins the nodes border stroke width.
 * @property {String} borderStrokeColor=#84a8f2     - Determins the nodes border color.
 * @property {String} borderStrokeDasharray="5"     - Determins the nodes gaps used inside the border.
 * @property {String} backgroundColor=#ffffff       - Determins the nodes background color.
 *
 * @property {Number} minTextWidth=145              - Determins the text width for the label in minimal representation.
 * @property {Number} minTextHeight=75              - Determins the text height for the label in minimal representation.
 * @property {Number} minTextTranslateX=0           - Determins the horizontal adjustment for the label in minimal representation.
 * @property {Number} minTextTranslateY=0           - Determins the vertical adjustment for the label in minimal representation.
 * @property {Number} maxTextWidth=345              - Determins the text width for the label in detailed representation.
 * @property {Number} maxTextHeight=220             - Determins the text height for the label in detailed representation.
 * @property {Number} maxTextTranslateX=0           - Determins the horizontal adjustment for the label in detailed representation.
 * @property {Number} maxTextTranslateY=0           - Determins the vertical adjustment for the label in detailed representation.
 * @property {String} labelColor=#7fa5f5            - Determins the color for the label.
 * @property {String} labelFontFamily=Montserrat    - Determins the font family for the label.
 * @property {Number} labelFontSize=16              - Determins the font size for the label.
 * @property {Number} labelFontWeight=600           - Determins the font weight for the label.
 * @property {String} labelFontStyle=normal         - Determins the font style for the label.
 * @property {String} labelBackground=#ffffff       - Determins the background color for the label.
 * @property {String} detailsColor=#7fa5f5          - Determins the color for the details description.
 * @property {String} detailsFontFamily=Montserrat  - Determins the font family for the details description.
 * @property {Number} detailsFontSize=12            - Determins the font size for the details description.
 * @property {Number} detailsFontWeight=600         - Determins the font weight for the details description.
 * @property {String} detailsFontStyle=normal       - Determins the font style for the details description.
 * @property {String} detailsBackground=#ffffff     - Determins the background color for the details description.
 */
const AssetNodeConfiguration = {
    // large node
    maxWidth: 350,
    maxHeight: 225,


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
    maxIconSize: 30,
    maxIconTranslateX: -140,
    maxIconTranslateY: -85,


    // node
    offset: 8,
    animationSpeed: 800,
    borderRadius: 5,
    borderStrokeWidth: 1,
    borderStrokeColor: "#84a8f2",
    borderStrokeDasharray: "5",
    backgroundColor: "#ffffff",


    // text
    minTextWidth: 145,
    minTextHeight: 75,
    minTextTranslateX: 0,
    minTextTranslateY: 0,
    maxTextWidth: 345,
    maxTextHeight: 220,
    maxTextTranslateX: 0,
    maxTextTranslateY: 0,
    labelColor: "#7fa5f5",
    labelFontFamily: "Montserrat",
    labelFontSize: 16,
    labelFontWeight: 600,
    labelFontStyle: "normal",
    labelBackground: "#ffffff",
    detailsColor: "#7fa5f5",
    detailsFontFamily: "Montserrat",
    detailsFontSize: 12,
    detailsFontWeight: 600,
    detailsFontStyle: "normal",
    detailsBackground: "#ffffff",
}


export default AssetNodeConfiguration