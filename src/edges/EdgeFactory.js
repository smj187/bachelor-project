import BoldEdge from "./BoldEge"
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
  static create(canvas, fromNode, toNode, edgeConfig = {}) {
    let edge
    if (edgeConfig.type === "dashed") {
      edge = new ThinEdge(canvas, fromNode, toNode, { ...edgeConfig, type: "dashed" })
    } else if (edgeConfig.type === "bold") {
      edge = new BoldEdge(canvas, fromNode, toNode, edgeConfig)
    } else {
      edge = new ThinEdge(canvas, fromNode, toNode, { ...edgeConfig, type: "solid" })
    }

    return edge
  }
}

export default EdgeFactory
