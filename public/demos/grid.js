import { Visualization, GridLayout } from "../dist/visualization.esm.min.js"

const visualization = new Visualization({
  databaseUrl: "http://localhost:3001",
  nodeEndpoint: "node-data",
  edgeEndpoint: "edge-data",
  contextualRelationshipEndpoint: "contextual-relationships",
  canvasWidth: window.innerWidth - 50,
  canvasHeight: window.innerHeight - 100,
})


const graph = visualization.createInitialGraph()

for (let i = 0; i <= 12; i += 1) {
  graph.includeNode(i)
}

visualization.render(graph, new GridLayout({ limitNodes: 6 }))
