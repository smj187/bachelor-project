/**
 * @namespace BoldEdgeConfiguration
 * @description This object contains default configuration for bold edge representations.
 * 
 * @property {Number} offset=8                      - Sets the spacing used for padding between label and background.
 * @property {Number} animationSpeed=300            - Determins how fast SVG elements animates inside the current layout.
 * @property {String} color1=null                   - Sets the linear gradient starting color.
 * @property {String} color2=null                   - Sets the linear gradient finishing color.
 * 
 * @property {String} blockarrowLineWidth=25        - Determins the thickness of the SVG element.
 * @property {String} blockarrowArrowWidth=40       - Determins how long the arrow head appears.
 * @property {String} blockarrowArrowLength=20      - Determins the thickness of the arrow head.
 * 
 * @property {String} labelColor=#222222            - Determins the color for the label.
 * @property {String} labelFontFamily=Montserrat    - Determins the font family for the label.
 * @property {Number} labelFontSize=16              - Determins the font size for the label.
 * @property {Number} labelFontWeight=600           - Determins the font weight for the label.
 * @property {String} labelFontStyle=normal         - Determins the font style for the label.
 * @property {String} labelBackground=#ffffffcc     - Determins the background color for the label.
 * @property {Number} labelTranslateX=0             - Determins the horizontal adjustment for the label.
 * @property {Number} labelTranslateY=0             - Determins the vertical adjustment for the label.
 */
const BoldEdgeConfiguration = {
    offset: 8,
    animationSpeed: 300,

    color1: null,
    color2: null,

    blockarrowLineWidth: 25,
    blockarrowArrowWidth: 40,
    blockarrowArrowLength: 20,


    labelColor: "#222222",
    labelFontFamily: "Montserrat",
    labelFontSize: 16,
    labelFontWeight: 600,
    labelFontStyle: "normal",
    labelBackground: "#ffffffcc",
    labelTranslateX: 0,
    labelTranslateY: 0,
}

export default BoldEdgeConfiguration