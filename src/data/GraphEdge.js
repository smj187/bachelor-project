
/**
 * This class represents a graph node.
 * 
 * @category Underlying Data
 * @param {Number} fromNode The start node id.
 * @param {Number} toNode The end node id.
 */
class GraphEdge {
  constructor(fromNode, toNode) {
    this.fromNode = fromNode
    this.toNode = toNode
  }
}

export default GraphEdge
