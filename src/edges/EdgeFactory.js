import BoldEdge from "./BoldEdge"
import ThinEdge from "./ThinEdge"


/**
 * This class makes use of the factory pattern and creates edges based on a given type.
 */
class EdgeFactory {

  /**
   * Creates a new edge class.
   * @param {Data} data The loaded data element from a database.
   * @param {Canvas} canvas The canvas to draw the node on.
   * @param {BaseNode} fromNode The starting node reference.
   * @param {BaseNode} toNode The ending node reference.
   * 
   * @return {BaseEdge} The base class representing the edge.
   */
  static create(data, canvas, fromNode, toNode) {
    let edge
    if (data.type === "dashed") edge = new ThinEdge(data, canvas, fromNode, toNode, { type: "dashed" })
    if (data.type === "solid") edge = new ThinEdge(data, canvas, fromNode, toNode, { type: "solid" })
    if (data.type === "bold") edge = new BoldEdge(data, canvas, fromNode, toNode, { type: "bold" })

    return edge
  }
}

export default EdgeFactory
