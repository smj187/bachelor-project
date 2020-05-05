### The basic example

This example illustrates how to visualize data with the grid layout. This layout does not require any predefined limitations but can easily be customized using [Grid Layout Configuration](./GridLayoutConfiguration.html)
This is an example in which we can see how data with a grid layout can be visualized.

```javascript
import { Visualization, GridLayout } from "./path/to/visualization.min.js"

// initialize the visualization
const visualization = new Visualization({
  databaseUrl: "http://localhost:3001",
  nodeEndpoint: "node-data",
  edgeEndpoint: "edge-data",
})

// create the underlying graph structure which holds references to our data
const graph = visualization.createInitialGraph()

// add nodes
for (let i = 0; i <= 12; i += 1) {
  graph.includeNode(i)
}

// render the layout without any customizations
visualization.render(graph, new GridLayout())

```

### Updating the underlying data

The underlying data can be updated by adding or removing nodes from the initial graph. The layout updates when calling the "update" method. <em>Note: the following method calls are warped inside a setTimeout to simulate a database operation.</em>

```javascript
// calling the update method to only update the underlying graph data structure
setTimeout(() => {

  // add nodes
  graph.includeNode(4)
  graph.includeNode(5)

  // remove nodes
  graph.excludeNode(10)
  graph.excludeNode(11)

  // update the layout
  visualization.update(grid, graph)

}, 2000)

// or, update the underlying graph and also the some layout configuration
setTimeout(() => {
  graph.excludeNode(160)
  graph.includeNode(220)

  visualization.update(grid, graph, { limitColumns: null, vSpacing: 100 })
}, 2000)
```

### Updating the layout configuration

Updating the layout configuration can be achieved using the "update" method. Available configuration: [Grid Layout Configuration](./GridLayoutConfiguration.html)

```javascript
setTimeout(() => {

  visualization.update(grid, { limitColumns: null, vSpacing: 100 })
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
const grid = new GridLayout({ limitColumns: 4, limitNodes: 10 }, customEventlisteners)
visualization.render(graph, grid)


// or add each event individually
const grid = new GridLayout({ limitColumns: 4, limitNodes: 10 })
visualization.addEventListener(grid, "click", "shiftKey", "expandOrCollapseEvent")
visualization.addEventListener(grid, "dblclick", "ctrlKey", "expandOrCollapseEvent")
visualization.addEventListener(grid, "dblclick", undefined, "expandOrCollapseEvent")
visualization.render(graph, grid)

```

### Override default node representations

Changing the appearance of nodes can be achieved in three different ways. First by individually filling the nodes or edges "config" attribute in the database entry. Second, by passing an object to the constructure and lastly, by utilizing the addCustomNodeRepresentation method. The following representation changes are available:

* "asset" - an object that contains configuration that overrides values from the [Asset Node Configuration](./AssetNodeConfiguration.html) object
* "control" - an object that contains configuration that overrides values from the [Control Node Configuration](./ControlNodeConfiguration.html) object
* "custom" - an object that contains configuration that overrides values from the [Custom Node Configuration](./CustomNodeConfiguration.html) object
* "requirement" - an object that contains configuration that overrides values from the [Requirement Node Configuration](./RequirementNodeConfiguration.html) object
* "risk" - an object that contains configuration that overrides values from the [Risk Node Configuration](./RiskNodeConfiguration.html) object


```javascript
// constructor arguments that now requires an event argument or undefined
const grid = new GridLayout(
  { limitColumns: 4, limitNodes: 10, animationSpeed: 300 }, 
  undefined, 
  { control: { borderStrokeColor: "#f0f" } }, 
)
visualization.render(graph, grid)


// or by using methods
const grid = new GridLayout({ limitColumns: 4, limitNodes: 10, animationSpeed: 300 })
visualization.addCustomNodeRepresentation(grid, { control: { borderStrokeColor: "#f0f" } })
visualization.render(graph, grid)
```