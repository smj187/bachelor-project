/**
 * @namespace ThinEdgeConfiguration
 * @description This object contains default configuration for thin edge representations.
 * 
 * @property {Number} offset=8                                  - Sets the spacing used for padding between label and background.
 * @property {Number} animationSpeed=300                        - Determins how fast SVG elements animates inside the current layout.
 * @property {String} type=solid                                - Determins the edge type. Available: "solid" or "dashed".
 * 
 * @property {Number} strokeWidth=2                             - Determins the edges thickness.
 * @property {String} strokeColor=#aaaaaa                       - Determins the edges color.
 * @property {String} strokeDasharray="7 5"                     - Determins the graps in the edge line.
 * @property {marker} strokeDasharray="M 0 0 L 6 3 L 0 6 z"     - Determins the shape of the arrow head.
 * 
 * @property {String} labelColor=#777777                        - Determins the color for the label.
 * @property {String} labelFontFamily=Montserrat                - Determins the font family for the label.
 * @property {Number} labelFontSize=16                          - Determins the font size for the label.
 * @property {Number} labelFontWeight=600                       - Determins the font weight for the label.
 * @property {String} labelFontStyle=normal                     - Determins the font style for the label.
 * @property {String} labelBackground=#ffffffcc                 - Determins the background color for the label.
 */
const ThinEdgeConfiguration = {
    offset: 8,
    animationSpeed: 300,
    type: "solid",

    // arrow
    strokeWidth: 2,
    strokeColor: "#aaaaaa",
    strokeDasharray: "7 5",
    marker: "M 0 0 L 6 3 L 0 6 z",


    // text
    labelColor: "#777777",
    labelFontFamily: "Montserrat",
    labelFontSize: 16,
    labelFontWeight: 600,
    labelFontStyle: "normal",
    labelBackground: "#ffffffcc",
}

export default ThinEdgeConfiguration