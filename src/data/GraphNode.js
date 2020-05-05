
/**
 * This class represents a graph node.
 * 
 * @category Graph
 * @param {Number} id The given id for this node.
 */
class GraphNode {
  constructor(id) {
    this.id = id
    this.neighbors = []
    this.edges = []
  }


  /**
   * Adds a node as neighbor to the current nodes neighbors.
   * @param {GraphNode} node The neighbor node to add to the node.
   */
  addNeighbor(node) {
    this.neighbors.push(node)
  }


  /**
   * Removes a neighbor from the current nodes neighbors.
   * @param {GraphNode} node The neighbor node to remove from the node.
   */
  removeNeighbor(node) {
    this.neighbors = this.neighbors.filter((neighbor) => neighbor !== node)
  }


  /**
   * Adds a new edge to the current nodes edges.
   * @param {GraphEdge} edge The edge to add to the node.
   */
  addEdge(edge) {
    this.edges.push(edge)
  }


  /**
   * Returns all neighbors for this node.
   */
  getNeighbors() {
    return this.neighbors
  }
}


export default GraphNode
