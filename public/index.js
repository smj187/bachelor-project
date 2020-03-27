/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable import/extensions */
/* eslint-disable max-classes-per-file */

import {
  Graph, Visualization, RadialLayout, GridLayout, TreeLayout, ContextualLayout,
} from "./graphVisualization.js"


const graph = new Graph() // TODO: ask: is this suppost to be a part the library or is it externally provided
graph.addNode(10)
graph.addNode(11)
graph.addNode(12)
graph.addNode(13)

// graph.addNode(14)
// graph.addNode(15)
// graph.addNode(16)
// graph.addNode(17)
// graph.addNode(18)
// graph.addNode(19)
// graph.addNode(20)
// graph.addNode(21)
// graph.addNode(22)
// graph.addNode(23)

// graph.addNode(24)
// graph.addNode(25)
// graph.addNode(26)

// graph.addNode(27)
// graph.addNode(28)
// graph.addNode(29)
// graph.addNode(30)


graph.addEdge(10, 11) // TODO: ask: is there always every edge provided (speaking: for each connection, there exists an edge)
graph.addEdge(10, 12)
graph.addEdge(10, 13)


// TODO: pass default override config for layouts, nodes and edges here
// TODO: ask: more details about the process of loading data from the database
const vis = new Visualization({ databaseUrl: "http://localhost:3000" })


// const grid1 = vis.render(graph, new GridLayout())
// setTimeout(() => { vis.transform(grid1, new TreeLayout({ translateY: 400, translateX: 300 })) }, 3000)
// setTimeout(() => { vis.transform(grid1, new RadialLayout({ translateY: 100, translateX: 300 })) }, 3000)


// const radial1 = vis.render(graph, new RadialLayout({ translateY: 150, translateX: 200 }))
// setTimeout(() => { vis.transform(radial1, new TreeLayout({ translateY: 400, translateX: 300 })) }, 2000)
// setTimeout(() => { vis.transform(radial1, new GridLayout()) }, 2000)


const tree1 = vis.render(graph, new TreeLayout({ translateX: 100, translateY: 100 }))
setTimeout(() => { vis.transform(tree1, new RadialLayout({ translateY: 100, translateX: 300 })) }, 4000)
// setTimeout(() => { vis.transform(tree1, new GridLayout()) }, 2000)


const contextualGraph = new Graph()
contextualGraph.addNode(100)
contextualGraph.addNode(101)
contextualGraph.addNode(102)
contextualGraph.addNode(103)
contextualGraph.addNode(104)
contextualGraph.addNode(105)
contextualGraph.addNode(106)

// FIXME: here (contextual layout), edges are created automatically, addEdge only adds a label or overrides the default configuration
contextualGraph.addEdge(102, 100)
contextualGraph.addEdge(102, 101)
contextualGraph.addEdge(103, 102)
contextualGraph.addEdge(104, 102)
contextualGraph.addEdge(105, 104)
contextualGraph.addEdge(106, 104)

// const contextual1 = vis.render(contextualGraph, new ContextualLayout({ startNodeId: 106 }))
