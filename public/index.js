/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable import/extensions */
/* eslint-disable max-classes-per-file */

import {
  Graph, Visualization, RadialLayout, GridLayout, TreeLayout, ContextualLayout,
} from "./graphVisualization.js"


// TODO: pass default override config for layouts, nodes and edges here
// TODO: ask: more details about the process of loading data from the database -> i can delegate
const vis = new Visualization({ databaseUrl: "http://localhost:3001" }) // this is the visualization


// neighbors store node refs -> to call from database: neighbor nodes + node.parent or node.children
const graph = new Graph() // this the initial graph/sub graph structure
graph.addNode(0) // ersten 4 gleich -> cols nicht korrekt
graph.addNode(1)
graph.addNode(2)
graph.addNode(3)
graph.addNode(4)
graph.addNode(12) // TODO: was tun bei duplicaten?
graph.addNode(5)
graph.addNode(6)
graph.addNode(7)
graph.addNode(8)
graph.addNode(9)
graph.addNode(10)
graph.addNode(11)
graph.addNode(12)
graph.addNode(13)
graph.addNode(14)
graph.addNode(15)

// graph.addEdge(1, 0) // TODO: ask: is there always every edge provided (speaking: for each connection, there exists an edge) -> NO
// graph.addEdge(2, 0)
// graph.addEdge(3, 0)

const grid1 = vis.render(graph, new GridLayout({ limit: 8, maxColumns: 4 }))

// setTimeout(() => {  vis.updateLayoutConfiguration(grid1, { maxColumns: 4, limit: 12 })}, 2000)
// setTimeout(() => { vis.updateLayoutConfiguration(grid1, { limit: 12 }) }, 2000)

/*
// TODO: showNode()
*/

// const vis = new Visualization({ databaseUrl: "http://localhost:3000" })

// // setTimeout(() => {
// //   vis.updateConfiguration(grid1, { maxColumns: 3, maxRows: 15 })
// // }, 1000)

// // TODO: setLayout // updates the layout configuration: example: change gridl cols from 4 to 3


// const contextualGraph = new Graph() // das ist subgraph; was ist wenn nodes nicht existieren?; es braucht ref zum übergeordneten; daten können auch kopiert werden
// contextualGraph.addNode(100) // TODO: includeNode(); includier node zu graphen ; // addNode(); erstell neue node
// contextualGraph.addNode(101) // TODO: exclude() zum entfernen
// contextualGraph.addNode(102)
// contextualGraph.addNode(103)
// contextualGraph.addNode(104)
// contextualGraph.addNode(105)
// contextualGraph.addNode(106)

// // FIXME: here (contextual layout), edges are created automatically, addEdge only adds a label or overrides the default configuration
// contextualGraph.addEdge(102, 100)
// contextualGraph.addEdge(102, 101)
// contextualGraph.addEdge(103, 102)
// contextualGraph.addEdge(104, 102)
// contextualGraph.addEdge(105, 104)
// contextualGraph.addEdge(106, 104)

// // const contextual1 = vis.render(contextualGraph, new ContextualLayout({ startNodeId: 106 }))
