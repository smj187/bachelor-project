### The basic example

This example illustrates how to visualize data with the radial layout. This layout requires a root references, indicating the root of the underlying tree.

```javascript
import { Visualization, RadialLayout } from "./path/to/visualization.min.js"

// initialize the visualization
const visualization = new Visualization({
  databaseUrl: "http://localhost:3001",
  nodeEndpoint: "node-data",
  edgeEndpoint: "edge-data",
})

// create the underlying graph structure which holds references to our data
const graph = visualization.createInitialGraph()

// add nodes
for (let i = 0; i <= 163; i += 1) {
  graph.includeNode(i)
}

// add edges
graph.includeEdge(111, 110)
graph.includeEdge(112, 110)
graph.includeEdge(113, 110)
graph.includeEdge(163, 161)

// render the layout with node 137 as root and a rendering depth and an optional animation speed change
visualization.render(graph, new RadialLayout({ rootId: 110, renderDepth: 1 }))
```

### Updating the underlying data

The underlying data can be updated by adding or removing nodes and edges from or to the initial graph. The layout updates when calling the "update" method. Note: the following method calls are warped inside a setTimeout to simulate a database operation. Also, before calling update, the changes in the database must already exist.

```javascript
// calling the update method to only update the underlying graph data structure
setTimeout(() => {
  graph.excludeNode(160)

  visualization.update(radial, graph)
}, 2000)

// or, update the underlying graph and also the some layout configuration
setTimeout(() => {
  graph.excludeNode(160)
  graph.includeNode(220)

  visualization.update(radial, graph, { rootId: 220, renderDepth: 3 })
}, 2000)
```

### Updating the layout configuration

Updating the layout configuration can be achieved using the "update" method. Available configuration: [Radial Layout Configuration](./RadialLayoutConfiguration.html)

```javascript
setTimeout(() => {

  visualization.update(radial, { leafStrokeColor: "#222", renderDepth: 5 })
}, 2000)
```

### Change mouse events

There are two ways to override the default mouse event behaviour. First, by passing an array as constructor argument and second, by utilizing the addEventListener method. A method can be triggered by multiple different events. The following events are available:

* "expandOrCollapseEvent" - loads or removes already loaded data from the layout and updates its. <em>More information for [addEventListener](./Visualization.html#addEventListener)</em>.   

```javascript
// constructor argument
const customEventlisteners = [
  { event: "click", modifier: "shiftKey", func: "expandOrCollapseEvent" },
  { event: "dblclick", modifier: "ctrlKey", func: "expandOrCollapseEvent" },
  { event: "dblclick", modifier: undefined, func: "expandOrCollapseEvent" },
]
const radial = new RadialLayout({ rootId: 110, renderDepth: 1}, customEventlisteners)
visualization.render(graph, radial)


// or add each event individually
const radial = new RadialLayout({ rootId: 110, renderDepth: 1 })
visualization.addEventListener(radial, "click", "shiftKey", "expandOrCollapseEvent")
visualization.addEventListener(radial, "dblclick", "ctrlKey", "expandOrCollapseEvent")
visualization.addEventListener(radial, "dblclick", undefined, "expandOrCollapseEvent")
visualization.render(graph, radial)

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
// constructor arguments that now requires an event argument or undefined
const radial = new RadialLayout(
  { rootId: 137, renderDepth: 1, animationSpeed: 300 }, 
  undefined, 
  { control: { borderStrokeColor: "#f0f" } }, 
  { thinEdge: { strokeColor: "#f0f" } }
)
visualization.render(graph, radial)


// or by using methods
const radial = new RadialLayout({ rootId: 137, renderDepth: 1 })
visualization.addCustomNodeRepresentation(radial, { control: { borderStrokeColor: "#f0f" } })
visualization.addCustomEdgeRepresentation(radial, { thinEdge: { strokeColor: "#f0f" } })
visualization.render(graph, radial)
```