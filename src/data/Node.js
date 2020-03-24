class Node {
  constructor(id) {
    this.id = id
    this.neighbors = []
    this.edges = []
  }

  addNeighbor(node) {
    this.neighbors.push(node)
  }

  addEdge(edge) {
    this.edges.push(edge)
  }

  getNeighbors() {
    return this.neighbors
  }
}


export default Node
