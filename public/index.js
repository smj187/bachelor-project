/* eslint-disable max-len */
/* eslint-disable import/extensions */
/* eslint-disable max-classes-per-file */

import {
  Graph, Visualization, RadialLayout, GridLayout, TreeLayout, ContextualLayout,
} from "./graphVisualization.js"


const graph = new Graph() // FIXME: is this suppost to be a part the library or is it externally provided
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


graph.addEdge(10, 11) // FIXME: is there always every edge provided (speaking: for each relation, there exists an edge)
graph.addEdge(10, 12)
graph.addEdge(10, 13)

const contextualGraph = new Graph()
contextualGraph.addNode(100)
contextualGraph.addNode(101)
contextualGraph.addNode(102)
contextualGraph.addNode(103)
contextualGraph.addNode(104)
contextualGraph.addNode(105)
contextualGraph.addNode(106)
contextualGraph.addNode(200)
contextualGraph.addNode(201)
contextualGraph.addNode(202)
contextualGraph.addNode(203)
contextualGraph.addNode(204)
contextualGraph.addNode(205)
contextualGraph.addNode(300)
contextualGraph.addNode(301)
contextualGraph.addNode(302)
contextualGraph.addNode(303)
contextualGraph.addNode(304)
contextualGraph.addNode(305)
contextualGraph.addNode(306)
contextualGraph.addNode(307)
contextualGraph.addNode(308)
contextualGraph.addNode(309)
contextualGraph.addNode(310)

// FIXME: edges are created automatically, addEdge only adds a label or overrides the default configuration


// TODO: pass default override config for layouts, nodes and edges here
const vis = new Visualization({ databaseUrl: "http://localhost:3000" })

// const grid1 = vis.render(graph, new GridLayout())
// const radial1 = vis.render(graph, new RadialLayout({ translateY: 150, translateX: 200 }))
// const tree1 = vis.render(graph, new TreeLayout({ translateX: 100, translateY: 100 }))
const contextual1 = vis.render(contextualGraph, new ContextualLayout())


// setTimeout(() => { vis.transform(tree1, new TreeLayout({ translateY: 400, translateX: 300, maxLayoutWidth: 400 })) }, 2000)
// setTimeout(() => { vis.transform(radial1, new GridLayout({ translateY: 400, translateX: 300, maxLayoutWidth: 400 })) }, 4000)
