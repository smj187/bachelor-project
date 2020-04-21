### Side-by-side rendering

This example illustrates how to render multiple layouts simultaneously.

```javascript
import { Visualization, RadialLayout, GridLayout  } from "./graphVisualization.js"

// initialize the library
const visualization = new Visualization({ databaseUrl: "http://localhost:3001", nodeEndpoint: "node-data", edgeEndpoint: "edge-data" })

// create the underlying graph structure which holds references to our data
const graph = visualization.createInitialGraph()

// add nodes
for (let i = 110; i <= 149; i += 1) {
  graph.includeNode(i)
}

// add edges
graph.includeEdge(111, 110)
graph.includeEdge(112, 110)
graph.includeEdge(113, 110)


const radial = new RadialLayout({ root: 110, renderDepth: 3 })
const grid = new GridLayout({ limitNodes: 1, limitColumns: 3 })


const render = async () => {
  await visualization.render(graph, radial)
  await visualization.render(graph1, grid)
}

render()
```

### Transforming a layout



```javascript

```

### Initial zoom level a layout

The visualization class can receive as an initial zoom level for its canvas.

```javascript
const config = { databaseUrl: "http://localhost:3001", nodeEndpoint: "node-data", edgeEndpoint: "edge-data", zoom: { lvl: 0.5, x: 100, y: 100 } }
const visualization = new Visualization(config)
```
