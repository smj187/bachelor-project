import BoldEdge from "./BoldEdge"
import ThinEdge from "./ThinEdge"
import CustomEdge from "./CustomEdge"


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
  static create(data, canvas, fromNode, toNode, { thinEdge, customEdge, boldEdge }) {

    const validTypes = ["dashed", "solid", "bold", "custom"]
    const type = validTypes.includes(data.type) ? data.type : "solid"


    let edge
    if (type === "dashed") {
      const config = { type: "dashed", ...data.config, ...thinEdge }
      edge = new ThinEdge(data, canvas, fromNode, toNode, config)
    }

    if (type === "custom") {
      const config = { ...data.config, ...customEdge }
      edge = new CustomEdge(data, canvas, fromNode, toNode, config)
    }

    if (type === "solid") {
      const config = { type: "solid", ...data.config, ...thinEdge }
      edge = new ThinEdge(data, canvas, fromNode, toNode, config)
    }

    if (type === "bold") {
      const config = { type: "bold", ...data.config, ...boldEdge }
      edge = new BoldEdge(data, canvas, fromNode, toNode, config)
    }


    return edge
  }
}

export default EdgeFactory
