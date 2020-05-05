import RiskNode from "./RiskNode"
import AssetNode from "./AssetNode"
import RequirementNode from "./RequirementNode"
import CustomNode from "./CustomNode"
import ControlNode from "./ControlNode"

/**
 * This class makes use of the factory pattern and creates nodes based on a given type.
 * 
 * @category SVG Representations
 * @subcategory Nodes
 */
class NodeFactory {
  /**
   * Creates a new node class.
   * @param {Data} data The loaded data element from a database.
   * @param {Canvas} canvas The canvas to draw the node on.
   * @param {Object} additionalNodeRepresentations Some additional configuration to override default behaviour.
   *
   * @return {BaseNode} The base class representing the node.
   */
  static create(data, canvas, {
    risk, asset, custom, requirement, control,
  }) {
    let node
    if (data.type === "risk") node = new RiskNode(data, canvas, risk)
    if (data.type === "asset") node = new AssetNode(data, canvas, asset)
    if (data.type === "custom") node = new CustomNode(data, canvas, custom)
    if (data.type === "requirement") node = new RequirementNode(data, canvas, requirement)
    if (data.type === "control") node = new ControlNode(data, canvas, control)


    return node
  }
}

export default NodeFactory
