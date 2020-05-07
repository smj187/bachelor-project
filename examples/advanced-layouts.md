### Side-by-side rendering

This example illustrates how to render multiple layouts simultaneously. <em> Note: Since loading data from the backend is an async process, it is best to wrap all render calls into an async method and wait for them individually to avoid unexpected  behaviour. </em>
```javascript
import { Visualization, GridLayout, RadialLayout, TreeLayout } from "./path/to/visualization.min.js"

// initialize the visualization
const visualization = new Visualization({
  databaseUrl: "http://localhost:3001",
  nodeEndpoint: "node-data",
  edgeEndpoint: "edge-data",
})

// create the underlying graph structure which holds references to our data
const treeData = visualization.createInitialGraph()
const gridData = visualization.createInitialGraph()

// add nodes
for (let i = 0; i <= 163; i += 1) {
  treeData.includeNode(i)
}

for (let i = 0; i <= 20; i += 1) {
  gridData.includeNode(i)
}


// add edges
treeData.includeEdge(111, 110)
treeData.includeEdge(112, 110)
treeData.includeEdge(113, 110)
treeData.includeEdge(119, 110)
treeData.includeEdge(163, 161)

// render
const radial = new RadialLayout({ rootId: 137, renderDepth: 1 })
const tree = new TreeLayout({ rootId: 110, renderDepth: 1, orientation: "vertical" })
const grid = new GridLayout({ limitColumns: 2, limitNodes: 5 })

const render = async () => {
  await visualization.render(treeData, radial)
  await visualization.render(treeData, tree)
  await visualization.render(gridData, grid)
}

await render()

```

### Transforming a layout

This example shows how to transform a layout into from one type to a different type.

```javascript
import { Visualization, GridLayout, RadialLayout, TreeLayout } from "./path/to/visualization.min.js"

// initialize the visualization
const visualization = new Visualization({
  databaseUrl: "http://localhost:3001",
  nodeEndpoint: "node-data",
  edgeEndpoint: "edge-data",
})

// create the underlying graph structure that holds references to our data
const graph = visualization.createInitialGraph()


// add nodes
for (let i = 0; i <= 163; i += 1) {
  graph.includeNode(i)
}

// add edges
graph.includeEdge(111, 110)
graph.includeEdge(112, 110)
graph.includeEdge(113, 110)
graph.includeEdge(119, 110)
graph.includeEdge(163, 161)


// render multiple layouts
const radial1 = new RadialLayout({ rootId: 110, renderDepth: 0 })
const radial2 = new RadialLayout({ rootId: 137, renderDepth: 0 })
const tree = new TreeLayout({ rootId: 153, renderDepth: 0, animationSpeed: 300, orientation: "vertical" })

const render = async () => {
  await visualization.render(graph, radial1)
  await visualization.render(graph, radial2)
  await visualization.render(graph, tree)
}
await render()


// transform a layout into another layout
 setTimeout(() => {
  visualization.transform(radial1, graph, new GridLayout({ limitColumns: 2, limitNodes: 5 }))
}, 1000)

setTimeout(() => {
  visualization.transform(radial2, graph, new RadialLayout({ rootId: 110, renderDepth: 0 }))
}, 3000)
```

