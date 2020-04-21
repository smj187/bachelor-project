import RiskNode from "./RiskNode"
import AssetNode from "./AssetNode"
import RequirementNode from "./RequirementNode"
import CustomNode from "./CustomNode"
import ControlNode from "./ControlNode"

/**
 * This class makes use of the factory pattern and creates nodes based on a given type.
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
  static create(data, canvas, additionalNodeRepresentations) {
    let node
    if (data.type === "risk") node = new RiskNode(data, canvas, additionalNodeRepresentations.risk)
    if (data.type === "asset") node = new AssetNode(data, canvas, additionalNodeRepresentations.asset)
    if (data.type === "custom") node = new CustomNode(data, canvas, additionalNodeRepresentations.custom)
    if (data.type === "requirement") node = new RequirementNode(data, canvas, additionalNodeRepresentations.requirement)
    if (data.type === "control") node = new ControlNode(data, canvas, additionalNodeRepresentations.control)


    return node
  }
}

export default NodeFactory
