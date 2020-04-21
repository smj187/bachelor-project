### The basic example

This is an example in which we can see how data with a grid layout can be visualized.

```javascript
import { Visualization, GridLayout } from "./graphVisualization.js"

// initialize the library
const visualization = new Visualization({ databaseUrl: "http://localhost:3001", nodeEndpoint: "node-data" })

// create the underlying graph structure which holds references to our data
const graph = visualization.createInitialGraph()

// add nodes
for (let i = 0; i < 30; i += 1) {
  graph.includeNode(i)
}

// remove nodes
graph.excludeNode(4)
graph.excludeNode(5)

// create a grid layout with additional layout configuration
const grid = new GridLayout({ limitNodes: 10, limitColumns: 5 })

// render the layout 
visualization.render(graph, grid)
```

### Updating the underlying data

The underlying data can be updated by adding or removing nodes from the initial graph. The layout updates when calling the "update" method. <em>Note: the following method calls are warped inside a setTimeout to simulate a database operation.</em>

```javascript
setTimeout(() => {

  // add nodes
  graph.includeNode(4)
  graph.includeNode(5)

  // remove nodes
  graph.excludeNode(10)
  graph.excludeNode(11)

  // update the layout
  visualization.update(grid, graph)

}, 1000)
```

### Updating the layout configuration

Updating the layout configuration can be achieved using the "update" method. Available configuration: [Grid Layout Configuration](./GridLayoutConfiguration.html)

```javascript
setTimeout(() => { 

  // update the layout
  visualization.update(grid, { limitNodes: null, limitColumns: 4 }) 

}, 1000)


// or update both, the underlying data and the layout configuration
setTimeout(() => {

  // add nodes
  graph.includeNode(4)
  graph.includeNode(5)

  // update the graph and the layout
  visualization.update(grid, graph, { limitColumns: 6 })
}, 1000)

```

### Change default mouse events

The default mouse events can be overridden by passing an array as the second argument to the constructor. <em>Note: the grid layout only has one event.</em>

```javascript
const events = [{ name: "expandGridLayoutEvent", mouse: "dblclick", modifier: "shiftKey" }]
const grid = new GridLayout({}, events)

visualization.render(graph, grid)
```

### Override default node representations

Changing the appearance of nodes can be achieved in two ways. The first option is individually for each node by filling the nodes "config" attribute. The second option requires to pass an object to the layout constructor.


```javascript
const nodeConfig = { asset: { borderStrokeColor: "#fff", borderStrokeDasharray: "0" } }
const grid = new GridLayout({}, undefined, nodeConfig)

visualization.render(graph, grid)
```