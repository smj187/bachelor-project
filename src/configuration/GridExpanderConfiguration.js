/**
 * This object contains default configuration for the grid expander.
 * @typedef {GridExpanderConfig} GridExpanderConfig
 *
 * @param {Number} [width=130] Defines how long the expander text will occur
 * @param {Number} [height=40] Defines how heigh the expander text will occur
 * @param {Number} [offset=8] Limits the spacing used by padding
 * @param {Number} [animationSpeed=300] Determins how fast the expander animates inside the grid layout
 * @param {String} [labelColor="#222"] Sets the label text color
 * @param {String} [labelFontFamily="Montserrat"] Sets the label font family
 * @param {Number} [labelFontSize=12] Sets the label font size
 * @param {Number} [labelFontWeight=700] Sets the label font weight
 * @param {String} [labelFontStyle="normal"] Sets the label font style
 * @param {String} [labelBackground="#fff"] Sets the label background color
 * @param {String} [expandText="Show More"] Represents the expand text
 * @param {String} [collapseText="Hide"] Represents the collapse text
 */

const GridExpanderConfig = {

  //  text size
  width: 80,
  height: 40,

  // node
  offset: 8,
  animationSpeed: 300,

  // text
  labelColor: "#222",
  labelFontFamily: "Montserrat",
  labelFontSize: 12,
  labelFontWeight: 700,
  labelFontStyle: "normal",
  labelBackground: "#aaa",

  expandText: "Show More",
  collapseText: "Show Less",
}

export default GridExpanderConfig
