class Edge {
  constructor(startNodeId, endNodeId, id) {
    // this.id = id || undefined

    // this.id = `edge#${node1.id}_${node2.id}`

    this.startNodeId = startNodeId
    this.endNodeId = endNodeId
  }

  getKey() {
    return `${this.startNodeId}_${this.endNodeId}`
  }
}

export default Edge
