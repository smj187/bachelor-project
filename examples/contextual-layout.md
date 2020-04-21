### The basic example

This example illustrates how to visualize data with the contextual layout. This layout requires a root references, indicating the root of the underlying tree.

```javascript
import { Visualization, ContextualLayout } from "./graphVisualization.js"

const graph = visualization.createInitialGraph()
for (let i = 16; i <= 39; i += 1) {
  graph.includeNode(i)
}

graph.includeEdge(36, 34)
graph.includeEdge(37, 36)


const contextual = new ContextualLayout({ focus: 36, animationSpeed: 1 })
visualization.render(graph, contextual)
```

### Updating the underlying data

The underlying data can be updated by adding or removing nodes and edges from or to the initial graph. The layout updates when calling the "update" method. <em>Note: the following method calls are warped inside a setTimeout to simulate a database operation. Also, before calling update, the changes in the database must already exist.</em>

```javascript

```

### Updating the layout configuration

Updating the layout configuration can be achieved using the "update" method. Available configuration: [Contextual Layout Configuration](./ContextualLayoutConfiguration.html)

```javascript

```

### Change default mouse events

The default mouse events can be overridden by passing an array as the second argument to the constructor. Note: the contextual layout only has two events.

```javascript
```

### Override default node and edge representations

Changing the appearance of nodes can be achieved in two ways. The first option is individually for each node by filling the nodes "config" attribute. The second option requires to pass an object to the layout constructor.

```javascript
```