/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable import/extensions */
/* eslint-disable max-classes-per-file */

import {
  Visualization, RadialLayout, GridLayout, TreeLayout, ContextualLayout,
} from "./graphVisualization.js"


// TODO: pass default override config for layouts, nodes and edges here
// TODO: ask: more details about the process of loading data from the database -> i can delegate
const vis = new Visualization({ databaseUrl: "http://localhost:3001" }) // this is the visualization


// create an initial subgraph by passing node and edge ids as paramaters
// const graph1 = vis.createInitialGraph([10, 11, 12], [[10, 12], [10, 11], [11, 12]])

// or by manually adding them
const graph1 = vis.createInitialGraph()
for (let i = 0; i < 15; i += 1) {
  graph1.includeNode(i)
}

// remove and add nodes
graph1.excludeNode(0)
graph1.excludeNode(1)
graph1.excludeNode(2)
graph1.excludeNode(3)
graph1.excludeNode(4)
graph1.excludeNode(5)

graph1.includeNode(4)
graph1.includeNode(5)

/** Grid 1 */
const grid1 = new GridLayout({ limitNodes: null, limitColumns: 3 })
// vis.render(graph1, grid1)


// // add or remove nodes to the graph and update the visualization
// setTimeout(() => {
//   graph1.excludeNode(4)
//   graph1.excludeNode(5)

//   graph1.includeNode(0)
//   graph1.includeNode(1)
//   graph1.includeNode(2)
//   graph1.includeNode(3)

//   vis.update(grid1, graph1)
// }, 2000)

// // and re-ranage the layout into 4 columns
// setTimeout(() => {
//   vis.update(grid1, { limitColumns: 4 })
// }, 1000)

// // remove two nodes and re-ranage the layout into 4 columns without any limitations
// setTimeout(() => {
//   graph1.excludeNode(4)
//   graph1.excludeNode(5)

//   vis.update(grid1, graph1, { limitNodes: null, limitColumns: 4 })
// }, 1000)


/** Multiple Layouts 2 */
const graph2 = vis.createInitialGraph([0, 1, 2, 3])
const graph3 = vis.createInitialGraph([13, 14, 15])
const graph4 = vis.createInitialGraph([4, 5])
const graph5 = vis.createInitialGraph([0, 1, 4, 8, 10, 14])
const grid2 = new GridLayout({ limitNodes: 4, limitColumns: 2, translateX: 0 })
const grid3 = new GridLayout({ limitNodes: 1, limitColumns: 1, translateY: 0 })
const grid4 = new GridLayout({ limitNodes: null, limitColumns: 1, translateY: 0 })
const grid5 = new GridLayout({ limitNodes: null, limitColumns: 1, translateX: 0 })

// vis.render(graph2, grid2)
// vis.render(graph3, grid3)
// vis.render(graph4, grid4)
// vis.render(graph5, grid5)

// // remove node 0 from all layouts
// setTimeout(() => {
//   graph2.excludeNode(0)
//   graph5.excludeNode(0)

//   vis.update(grid2, graph2)
//   vis.update(grid5, graph5)
// }, 3000)

// // and re-ranage the first layout from one into a two column grid
// setTimeout(() => {
//   vis.update(grid2, { limitColumns: 1 })
// }, 1000)


/** Contextual 1 */
const graph6 = vis.createInitialGraph()
for (let i = 16; i <= 39; i += 1) {
  graph6.includeNode(i)
}

const contextual1 = new ContextualLayout({ focus: 36 })
vis.render(graph6, contextual1)

// const grid2 = vis.render(graph, new GridLayout({
//   limitNodes: 3, limitColumns: 3, translateX: 0, translateY: 200,
// }))

/*
// TODO: showNode() // redundant?
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
