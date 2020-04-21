### The basic example

This example illustrates how to visualize data with the radial layout. This layout requires a root references, indicating the root of the underlying tree.

```javascript
import { Visualization, RadialLayout } from from "./graphVisualization.js"

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

// create a radial layout with a root and a rendering depth
const radial = new RadialLayout({ root: 110, renderDepth: 3 })

// render the layout 
visualization.render(graph, radial)

```

### Updating the underlying data

The underlying data can be updated by adding or removing nodes and edges from or to the initial graph. The layout updates when calling the "update" method. <em>Note: the following method calls are warped inside a setTimeout to simulate a database operation. Also, before calling update, the changes in the database must already exist.</em>

```javascript
setTimeout(() => {

  // remove nodes
  graph.excludeNode(113)
  graph.excludeNode(115)

  // update the layout
  visualization.update(radial, graph)

}, 1000)
```

### Updating the layout configuration

Updating the layout configuration can be achieved using the "update" method. Available configuration: [Radial Layout Configuration](./RadialLayoutConfiguration.html)

```javascript
setTimeout(() => {

    // update the layout
  visualization.update(radial, { translateX: 100, translateY: 200, radialRadius: 300, radiusDelta: 250, renderingSize: "max" })

}, 1000)
```

### Change default mouse events

The default mouse events can be overridden by passing an array as the second argument to the constructor. Note: the radial layout only has one event.

```javascript
const events = [{ name: "nodeEvent", mouse: "click", modifier: "ctrlKey" }]
const radial = new RadialLayout({ root: 110, renderDepth: 1 }, events)

visualization.render(graph, radial)
```

### Override default node and edge representations

Changing the appearance of nodes can be achieved in two ways. The first option is individually for each node by filling the nodes "config" attribute. The second option requires to pass an object to the layout constructor.

```javascript
const nodeConfig = { requirement: { minWidth: 300, minHeight: 120 } }
const radial = new RadialLayout({ root: 110, renderDepth: 1, radialRadius: 300 }, undefined, nodeConfig)

// render the layout 
visualization.render(graph, radial)
```