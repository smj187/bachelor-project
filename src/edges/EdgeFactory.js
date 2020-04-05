import BoldEdge from "./BoldEdge"
import ThinEdge from "./ThinEdge"


/**
 * Optional configuration to override default values
 *  @typedef {EdgeConfig} EdgeConfig
 *
 * TODO:

 */


/**
 * Factory to create edge objects
 * @param {Canvas} canvas the canvas to render the node on
 * @param {BaseNode} fromNode The from node
 * @param {BaseNode} fromNode The to node
 * @param {EdgeConfig} [edgeConfig] custom config to override the default values
 */
class EdgeFactory {
  static create(rawEdge, canvas, fromNode, toNode) {
    let edge
    if (rawEdge.type === "dashed") edge = new ThinEdge(rawEdge, canvas, fromNode, toNode, { type: "dashed" })
    else if (rawEdge.type === "solid") edge = new ThinEdge(rawEdge, canvas, fromNode, toNode, { type: "solid" })
    else if (rawEdge.type === "bold") edge = new BoldEdge(rawEdge, canvas, fromNode, toNode)
    else edge = new ThinEdge(rawEdge, canvas, fromNode, toNode, { type: "solid" })

    return edge
  }
}

export default EdgeFactory
