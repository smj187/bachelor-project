import GraphNode from "./GraphNode"
import GraphEdge from "./GraphEdge"


/**
 * This class provides basic functionality for managing data.
 */
class Graph {
  constructor() {
    this.nodes = []
    this.edges = []
  }


  /**
   * Creates and adds a new node to the current graph.
   * @param {Number} id The node id to include in the current graph.
   */
  includeNode(id) {
    this.nodes.push(new GraphNode(id))
  }


  /**
   * Removes a node and all its occurrences within the current graph.
   * @param {Number} id The node id to exclude from the current graph.
   */
  excludeNode(id) {
    const node = this.nodes.find((n) => n.id === id)
    this.nodes = this.nodes.filter((n) => n !== node)


    // remove edge references
    node.neighbors.forEach((neighbor) => {
      // edge from end node to removed node
      const edge1 = this.edges.find((e) => e.fromNode === id && e.toNode === neighbor.id)
      if (edge1 !== undefined) {
        this.edges = this.edges.filter((e) => e !== edge1)

        // remove start node edge reference
        const toNode = this.nodes.find((n) => n.id === edge1.toNode)
        toNode.edges = toNode.edges.filter((e) => e !== edge1)

        // remove start node neighbor
        toNode.removeNeighbor(node)
      }


      // edge from start node to removed node
      const edge2 = this.edges.find((e) => e.fromNode === neighbor.id && e.toNode === id)
      if (edge2 !== undefined) {
        this.edges = this.edges.filter((e) => e !== edge2)

        // remove start node edge reference
        const fromNode = this.nodes.find((n) => n.id === edge2.fromNode)
        fromNode.edges = fromNode.edges.filter((e) => e !== edge2)

        // remove start node neighbor
        fromNode.removeNeighbor(node)
      }
    })
  }


  /**
   * Creates a new edge and update the current graph.
   * @param {Number} fromNode The start node id.
   * @param {Number} toNode The end node id.
   */
  includeEdge(fromNode, toNode) {
    if (fromNode === toNode) {
      throw new Error("could not create an edge between two identical nodes")
    }
    const fromNodeRef = this.nodes.find((n) => n.id === fromNode)
    if (fromNodeRef === undefined) {
      throw new Error(`could not find start node ${fromNode}`)
    }
    const toNodeRef = this.nodes.find((n) => n.id === toNode)
    if (toNodeRef === undefined) {
      throw new Error(`could not find start node ${toNode}`)
    }

    // add neigbhor
    fromNodeRef.addNeighbor(toNodeRef)
    toNodeRef.addNeighbor(fromNodeRef)

    // create edge
    const edge = new GraphEdge(fromNode, toNode)
    fromNodeRef.addEdge(edge)
    toNodeRef.addEdge(edge)
    this.edges.push(edge)
  }


  /**
   * Removes an edge and all its occurrences within the current graph.
   * @param {Number} fromNode The start node id.
   * @param {Number} toNode The end node id.
   */
  excludeEdge(fromNode, toNode) {
    if (fromNode === toNode) {
      throw new Error("could not remove an edge between two identical nodes")
    }
    const fromNodeRef = this.nodes.find((n) => n.id === fromNode)
    if (fromNodeRef === undefined) {
      throw new Error(`could not find start node ${fromNode}`)
    }
    const toNodeRef = this.nodes.find((n) => n.id === toNode)
    if (toNodeRef === undefined) {
      throw new Error(`could not find start node ${toNode}`)
    }

    // remove edge
    const edge = this.edges.find((e) => e.fromNode === fromNode && e.toNode === toNode)
    this.edges = this.edges.filter((e) => e !== edge)

    // remove edge reference from nodes
    fromNodeRef.edges = fromNodeRef.edges.filter((e) => e !== edge)
    toNodeRef.edges = toNodeRef.edges.filter((e) => e !== edge)

    // remove unused neighbors
    fromNodeRef.removeNeighbor(toNodeRef)
    toNodeRef.removeNeighbor(fromNodeRef)
  }

  hasNode(node) {
    return this.nodes.find((n) => n.id === node.id)
  }


  getNodes() {
    return this.nodes
  }

  getEdges() {
    return this.edges
  }
}

export default Graph
