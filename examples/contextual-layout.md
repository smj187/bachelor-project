### The basic example

This example illustrates how to visualize data with the contextual layout. This layout requires a focus id references, indicating the starting point for all calculations.

```javascript
import { Visualization, ContextualLayout } from "./path/to/visualization.min.js"

const visualization = new Visualization({
  databaseUrl: "http://localhost:3001",
  nodeEndpoint: "node-data",
  edgeEndpoint: "edge-data",
  contextualRelationshipEndpoint: "contextual-relationships",
  zoomLevel: 0.85
})


// create the underlying graph structure which holds references to our data
const graph = visualization.createInitialGraph()

// add nodes
for (let i = 0; i <= 163; i += 1) {
  graph.includeNode(i)
}

// add edges
 graph.includeEdge(36, 34)
graph.includeEdge(36, 35)
graph.includeEdge(37, 36)
graph.includeEdge(72, 36)
graph.includeEdge(36, 34)
graph.includeEdge(111, 110)
graph.includeEdge(112, 110)
graph.includeEdge(113, 110)
graph.includeEdge(119, 110)
graph.includeEdge(163, 161)

visualization.render(graph, new ContextualLayout({ focusId: 36 }))

```

### Updating the underlying data

The underlying data can be updated by adding or removing nodes and edges from or to the initial graph. The layout updates when calling the "update" method. <em>Note: the following method calls are warped inside a setTimeout to simulate a database operation. Also, before calling update, the changes in the database must already exist.</em>

```javascript
// calling the update method to only update the underlying graph data structure
setTimeout(() => {
  graph.excludeNode(160)

  visualization.update(contextual, graph)
}, 2000)


// or, update the underlying graph and also the some layout configuration
setTimeout(() => {
  graph.excludeNode(160)

  visualization.update(contextual, graph, { focusId: 1300 })
}, 2000)
```

### Updating the layout configuration

Updating the layout configuration can be achieved using the "update" method. Available configuration: [Contextual Layout Configuration](./ContextualLayoutConfiguration.html)

```javascript
setTimeout(() => {

    visualization.update(contextual, { animationSpeed: 1300  })
  }, 2000)
```

### Change default mouse events

There are two ways to override the default mouse event behaviour. First, by passing an array as constructor argument and second, by utilizing the addEventListener method. A method can be triggered by multiple different events. The following events are available:

* "expandOrCollapseGridEvent" - changes how many nodes within a container are visible. 
* "traverseInLayoutEvent" - updates the layout based on the clicked node.

```javascript

visualization.addEventListener(contextual, "dblclick", "shiftKey", "traverseInLayoutEvent")
visualization.addEventListener(contextual, "click", undefined, "traverseInLayoutEvent")

```

### Override default node and edge representations

Changing the appearance of nodes can be achieved in three different ways. First by individually filling the nodes or edges "config" attribute in the database entry. Second, by passing an object to the constructure and lastly, by utilizing addCustomNodeRepresentation and addCustomEdgeRepresentation methods. The following representation changes are available:

* "asset" - an object that contains configuration that overrides values from the [Asset Node Configuration](./AssetNodeConfiguration.html) object
* "control" - an object that contains configuration that overrides values from the [Control Node Configuration](./ControlNodeConfiguration.html) object
* "custom" - an object that contains configuration that overrides values from the [Custom Node Configuration](./CustomNodeConfiguration.html) object
* "requirement" - an object that contains configuration that overrides values from the [Requirement Node Configuration](./RequirementNodeConfiguration.html) object
* "risk" - an object that contains configuration that overrides values from the [Risk Node Configuration](./RiskNodeConfiguration.html) object


* "boldEdge" - an object that contains configuration that overrides values from the [Bold Edge Configuration](./BoldEdgeConfiguration.html) object
* "customEdge" - an object that contains configuration that overrides values from the [Custom Edge Configuration](./CustomEdgeConfiguration.html) object
* "thinEdge" - an object that contains configuration that overrides values from the [Thin Edge Configuration](./ThinEdgeConfiguration.html) object

```javascript
 visualization.addCustomNodeRepresentation(contextual, { control: { borderStrokeColor: "#f0f" } })
  visualization.addCustomEdgeRepresentation(contextual, { boldEdge: { color: "#f0f" } })
```