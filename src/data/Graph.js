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
      const edge1 = this.edges.find((e) => e.startNode === id && e.endNode === neighbor.id)
      if (edge1 !== undefined) {
        this.edges = this.edges.filter((e) => e !== edge1)

        // remove start node edge reference
        const endNode = this.nodes.find((n) => n.id === edge1.endNode)
        endNode.edges = endNode.edges.filter((e) => e !== edge1)

        // remove start node neighbor
        endNode.removeNeighbor(node)
      }


      // edge from start node to removed node
      const edge2 = this.edges.find((e) => e.startNode === neighbor.id && e.endNode === id)
      if (edge2 !== undefined) {
        this.edges = this.edges.filter((e) => e !== edge2)

        // remove start node edge reference
        const startNode = this.nodes.find((n) => n.id === edge2.startNode)
        startNode.edges = startNode.edges.filter((e) => e !== edge2)

        // remove start node neighbor
        startNode.removeNeighbor(node)
      }
    })
  }


  /**
   * Creates a new edge and update the current graph.
   * @param {Number} startNode The start node id.
   * @param {Number} endNode The end node id.
   */
  includeEdge(startNode, endNode) {
    if (startNode === endNode) {
      throw new Error("could not create an edge between two identical nodes")
    }
    const fromNodeRef = this.nodes.find((n) => n.id === startNode)
    if (fromNodeRef === undefined) {
      throw new Error(`could not find start node ${startNode}`)
    }
    const toNodeRef = this.nodes.find((n) => n.id === endNode)
    if (toNodeRef === undefined) {
      throw new Error(`could not find start node ${endNode}`)
    }

    // add neigbhor
    fromNodeRef.addNeighbor(toNodeRef)
    toNodeRef.addNeighbor(fromNodeRef)

    // create edge
    const edge = new GraphEdge(startNode, endNode)
    fromNodeRef.addEdge(edge)
    toNodeRef.addEdge(edge)
    this.edges.push(edge)
  }


  /**
   * Removes an edge and all its occurrences within the current graph.
   * @param {Number} startNode The start node id.
   * @param {Number} endNode The end node id.
   */
  excludeEdge(startNode, endNode) {
    if (startNode === endNode) {
      throw new Error("could not remove an edge between two identical nodes")
    }
    const fromNodeRef = this.nodes.find((n) => n.id === startNode)
    if (fromNodeRef === undefined) {
      throw new Error(`could not find start node ${startNode}`)
    }
    const toNodeRef = this.nodes.find((n) => n.id === endNode)
    if (toNodeRef === undefined) {
      throw new Error(`could not find start node ${endNode}`)
    }

    // remove edge
    const edge = this.edges.find((e) => e.startNode === startNode && e.endNode === endNode)
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
