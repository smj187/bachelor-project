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

  addEdge(startNodeId, endNodeId) {
    const startNode = this.nodes.find((n) => n.id === startNodeId)
    const endNode = this.nodes.find((n) => n.id === endNodeId)


    startNode.addNeighbor(endNode)
    endNode.addNeighbor(startNode)


    const edge = new Edge(startNodeId, endNodeId)
    startNode.addEdge(edge)
    endNode.addEdge(edge)

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
