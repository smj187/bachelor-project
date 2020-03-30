import Node from "./Node"
import Edge from "./Edge"

class Graph {
  constructor() {
    this.nodes = []
    this.edges = []
  }

  addNode(id) {
    this.nodes.push(new Node(id))
  }

  addEdge(startNode, endNode) {
    const fromNodeRef = this.nodes.find((n) => n.id === startNode)
    const toNodeRef = this.nodes.find((n) => n.id === endNode)


    fromNodeRef.addNeighbor(toNodeRef)
    toNodeRef.addNeighbor(fromNodeRef)


    const edge = new Edge(startNode, endNode)
    fromNodeRef.addEdge(edge)
    toNodeRef.addEdge(edge)

    this.edges.push(edge)
  }

  getNodes() {
    return this.nodes
  }

  getEdges() {
    return this.edges
  }
}

export default Graph
