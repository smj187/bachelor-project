import RiskNode from "./RiskNode"
import AssetNode from "./AssetNode"
import RequirementNode from "./RequirementNode"
import CustomNode from "./CustomNode"
import ControlNode from "./ControlNode"

// https://anasshekhamis.com/2017/08/10/the-factory-design-pattern-in-javascript/
// https://enmascript.com/articles/2018/10/05/javascript-factory-pattern


/**
 * Optional configuration to override default values
 *  @typedef {Config} Config
 *
 * @param {Number} [maxWidth] node size in maximal representation
 * @param {Number} [maxHeight] node size in maximal representation
 * @param {Number} [minWidth] node size in minimal representation
 * @param {Number} [minHeight] node size in minimal representation
 * @param {String} [iconUrl] path to an image icon
 * @param {Object} [iconOpacity]
 * @param {Number} [iconOpacity.minOpacity] opacity value for minimal representation
 * @param {Number} [iconOpacity.maxOpacity] opacity value for maximal representation
 * @param {Number} [offset] spacing for all elements inside the node
 * @param {Number} [animationSpeed] how long a node animations takes
 * @param {Number} [borderRadius] the border radius
 * @param {Object} [borderStroke]
 * @param {Number} [borderStroke.width] border width
 * @param {String} [borderStroke.color] border color as hex values
 * @param {Object} [backgroundColor]
 * @param {String} [backgroundColor.color] the nodes background color
 * @param {Object} [labelColor]
 * @param {String} [labelColor.color] the color for the label as hex value
 * @param {Object} [labelFont]
 * @param {String} [labelFont.family] the font family
 * @param {Number} [labelFont.size] the font size
 * @param {Number} [labelFont.weight] the font weight
 * @param {String} [labelFont.style] the font style
 * @param {Object} [labelBackground]
 * @param {String} [labelBackground.color] the label's background color as hex value
 * @param {Number} [labelBackground.opacity] the opacity of the label background
 * @param {Object} [detailsColor]
 * @param {String} [detailsColor.color] the color for the details as hex value
 * @param {Object} [detailsFont]
 * @param {Number} [detailsFont.family] the font family
 * @param {Number} [detailsFont.size] the font size
 * @param {Number} [detailsFont.weight] the font weight
 * @param {String} [detailsFont.style] the font style
 * @param {Object} [detailsBackground]
 * @param {String} [detailsBackground.color] the details background color as hex value
 * @param {Number} [detailsBackground.opacity] the details background opacity
 */


/**
 * Factory to create node objects
 * @param {Data} data the raw node data
 * @param {Canvas} canvas the canvas to render the node on
 * @param {Config} [config] custom config to override the default values
 *
 */
class NodeFactory {
  static create(rawNode, canvas) {
    let node
    if (rawNode.type === "risk") node = new RiskNode(rawNode, canvas)
    if (rawNode.type === "asset") node = new AssetNode(rawNode, canvas)
    if (rawNode.type === "custom") node = new CustomNode(rawNode, canvas)
    if (rawNode.type === "requirement") node = new RequirementNode(rawNode, canvas)
    if (rawNode.type === "control") node = new ControlNode(rawNode, canvas)


    return node
  }
}

export default NodeFactory
