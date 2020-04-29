### The basic example

This example illustrates how to visualize data with the tree layout. This layout requires a root references, indicating the root of the underlying tree.

```javascript
import { Visualization, TreeLayout } from "./graphVisualization.js"

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

// create a tree layout with a root and a rendering depth
const tree = new TreeLayout({ root: 110, renderDepth: 1 })

// render the layout 
visualization.render(graph, tree)

```

### Updating the underlying data

The underlying data can be updated by adding or removing nodes and edges from or to the initial graph. The layout updates when calling the "update" method. <em>Note: the following method calls are warped inside a setTimeout to simulate a database operation. Also, before calling update, the changes in the database must already exist.</em>

```javascript

```

### Updating the layout configuration

Updating the layout configuration can be achieved using the "update" method. Available configuration: [Tree Layout Configuration](./TreeLayoutConfiguration.html)

```javascript

```

### Change default mouse events

The default mouse events can be overridden by passing an array as the second argument to the constructor. Note: the tree layout only has two events.

```javascript
const customConfig = {
  root: 110,
  renderDepth: 2,
}
const customEventlisteners = [
  { event: "click", modifier: "shiftKey", func: "expandOrCollapseEvent" },
  { event: "dblclick", modifier: "ctrlKey", func: "expandOrCollapseEvent" },
  { event: "dblclick", modifier: undefined, func: "expandOrCollapseEvent" },
]
const tree = new TreeLayout(customConfig, customEventlisteners)

// or add each event individually
visualization.addEventListener(tree, "click", "shiftKey", "expandOrCollapseEvent")
visualization.addEventListener(tree, "dblclick", "ctrlKey", "expandOrCollapseEvent")
visualization.addEventListener(tree, "dblclick", undefined, "expandOrCollapseEvent")

visualization.render(graph, tree)
```

### Override default node and edge representations

Changing the appearance of nodes can be achieved in two ways. The first option is individually for each node by filling the nodes "config" attribute. The second option requires to pass an object to the layout constructor.

```javascript
const nodeConfig = { requirement: { minWidth: 300, minHeight: 120 } }
const tree = new TreeLayout({ root: 110, renderDepth: 1 }, undefined, nodeConfig)

// render the layout 
visualization.render(graph, tree)
```