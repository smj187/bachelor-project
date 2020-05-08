/* eslint-disable */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable import/extensions */
/* eslint-disable max-classes-per-file */


import {
  Visualization, TreeLayout, ContextualLayout, GridLayout, RadialLayout
} from "./visualization.js"


const visualization = new Visualization({
  databaseUrl: "http://localhost:3001",
  nodeEndpoint: "node-data",
  edgeEndpoint: "edge-data",
  contextualRelationshipEndpoint: "contextual-relationships",
  zoomLevel: 0.85
})







const gridLayout = async () => {
  // create the underlying graph structure that holds references to our data
  const graph = visualization.createInitialGraph()

  // add nodes
  for (let i = 0; i <= 12; i += 1) {
    graph.includeNode(i)
  }



  // create a grid layout with additional layout configuration
  const customEventlisteners = [
    { event: "click", modifier: "shiftKey", func: "expandOrCollapseEvent" },
    { event: "dblclick", modifier: "ctrlKey", func: "expandOrCollapseEvent" },
    { event: "dblclick", modifier: undefined, func: "expandOrCollapseEvent" },
  ]
  const grid1 = new GridLayout()
  const grid2 = new GridLayout({ limitColumns: 3, limitNodes: 4 })
  const grid3 = new GridLayout({ limitColumns: 3, limitNodes: 2 })
  const grid4 = new GridLayout({ limitColumns: 1, limitNodes: 2 })
  const grid5 = new GridLayout({ limitColumns: 1, limitNodes: 4 })

  // visualization.addCustomNodeRepresentation(grid1, { custom: { borderStrokeColor: "#f0f" }, requirement: { labelColor: "#f0f" } })
  // visualization.addCustomNodeRepresentation(grid1, { control: { borderStrokeColor: "#f0f" } })

  // render the layout
  // await visualization.render(graph, grid1)
  await visualization.render(graph, grid2)
  // await visualization.render(graph, grid3)
  // await visualization.render(graph, grid4)
  // await visualization.render(graph, grid5)

  // setTimeout(() => {
  //   // console.log("update now")
  //   // graph.excludeNode(160)

  //   visualization.update(grid1, graph, { limitColumns: 1 })
  // }, 1000)

  // setTimeout(() => {
  //   visualization.update(grid2, { limitColumns: 3, vSpacing: 100 })
  // }, 2000)
}

const side_by_side_example = async () => {
  // create the underlying graph structure that holds references to our data
  const graph1 = visualization.createInitialGraph()

  // add nodes
  for (let i = 0; i <= 20; i += 1) {
    graph1.includeNode(i)
  }

  const graph2 = visualization.createInitialGraph()

  // add nodes
  for (let i = 20; i <= 20; i += 1) {
    graph2.includeNode(i)
  }

  const graph3 = visualization.createInitialGraph()

  // add nodes
  for (let i = 0; i <= 163; i += 1) {
    graph3.includeNode(i)
  }

  // add edges
  graph3.includeEdge(111, 110)
  graph3.includeEdge(112, 110)
  graph3.includeEdge(113, 110)
  graph3.includeEdge(119, 110)
  graph3.includeEdge(163, 161)

  // add edges
  // graph.includeEdge(111, 110)
  // graph.includeEdge(112, 110)
  // graph.includeEdge(113, 110)
  // graph.includeEdge(119, 110)
  // graph.includeEdge(163, 161)


  const grid1 = new GridLayout({ limitColumns: 2, limitNodes: 5 })
  const tree3 = new TreeLayout({ rootId: 110, renderDepth: 1, animationSpeed: 300, orientation: "vertical" })
  const radial4 = new RadialLayout({ rootId: 137, renderDepth: 1 })
  const render = async () => {
    await visualization.render(graph3, radial4)
    await visualization.render(graph3, tree3)
    await visualization.render(graph1, grid1)
  }

  await render()
  // await visualization.render(graph2, grid2)
}

const transform_layout = async () => {
  const graph = visualization.createInitialGraph()

  // add nodes
  for (let i = 0; i <= 163; i += 1) {
    graph.includeNode(i)
  }

  // add edges
  graph.includeEdge(111, 110)
  graph.includeEdge(112, 110)
  graph.includeEdge(113, 110)
  graph.includeEdge(119, 110)
  graph.includeEdge(163, 161)


  const radial1 = new RadialLayout({ rootId: 110, renderDepth: 0 })
  const radial4 = new RadialLayout({ rootId: 137, renderDepth: 0 })
  const tree2 = new TreeLayout({ rootId: 153, renderDepth: 0, animationSpeed: 300, orientation: "vertical" })
  const grid1 = new GridLayout({ limitColumns: 2, limitNodes: 5 })
  await visualization.render(graph, radial1)
  await visualization.render(graph, radial4)
  await visualization.render(graph, tree2)
  // await visualization.render(graph, grid1)


  setTimeout(() => {
    visualization.transform(radial1, graph, new GridLayout({ limitColumns: 2, limitNodes: 5 }))
  }, 1000)

  setTimeout(() => {
    visualization.transform(radial4, graph, new RadialLayout({ rootId: 110, renderDepth: 0 }))
  }, 3000)

}


const radialLayout = async () => {
  // create the underlying graph structure which holds references to our data
  const graph = visualization.createInitialGraph()

  // add nodes
  for (let i = 0; i <= 168; i += 1) {
    graph.includeNode(i)
  }

  // add edges
  graph.includeEdge(111, 110)
  graph.includeEdge(112, 110)
  graph.includeEdge(113, 110)
  graph.includeEdge(163, 161)
  graph.includeEdge(123, 113)

  // create a radial layout with a root and a rendering depth
  const radial1 = new RadialLayout({ rootId: 110, renderDepth: 1, animationSpeed: 300 })
  // const radial2 = new RadialLayout({ rootId: 16, renderDepth: 1 })
  // const radial3 = new RadialLayout({ rootId: 161, renderDepth: 1 })
  const radial4 = new RadialLayout({ rootId: 137, renderDepth: 1, animationSpeed: 300 })

  // visualization.addEventListener(radial1, "dblclick", "shiftKey", "expandOrCollapseEvent")
  // visualization.addCustomNodeRepresentation(radial1, { control: { borderStrokeColor: "#f0f" } })
  // visualization.addCustomEdgeRepresentation(radial1, { thinEdge: { strokeColor: "#f0f" } })
  // render the layout
  await visualization.render(graph, radial1)
  // visualization.render(graph, radial2)
  // visualization.render(graph, radial3)
  await visualization.render(graph, radial4)


  // const tree3 = new TreeLayout({ rootId: 110, renderDepth: 1, orientation: "horizontal" })
  // await visualization.render(graph, tree3)

  setTimeout(() => {
    visualization.update(radial1, graph, { renderDepth: 2 })
  }, 1000)
}

const treeLayout = async () => {
  // create the underlying graph structure that holds references to our data
  const graph = visualization.createInitialGraph()

  // add nodes
  for (let i = 0; i <= 163; i += 1) {
    graph.includeNode(i)
  }

  // add edges
  graph.includeEdge(111, 110)
  graph.includeEdge(112, 110)
  graph.includeEdge(113, 110)
  graph.includeEdge(119, 110)
  graph.includeEdge(163, 161)

  // create a radial layout with a root and a rendering depth
  // const event = { eventlistener: "expandCollapseEvent", mouse: "dblclick", modifier: "shiftKey" }

  const customConfig = {
    rootId: 110,
    renderDepth: 2,
  }
  const customEventlisteners = [
    { event: "click", modifier: "shiftKey", func: "expandOrCollapseEvent" },
    { event: "dblclick", modifier: "ctrlKey", func: "expandOrCollapseEvent" },
    { event: "dblclick", modifier: undefined, func: "expandOrCollapseEvent" },
  ]
  // const tree = new TreeLayout(customConfig, customEventlisteners)

  // add each event individually
  // visualization.addEventListener(tree, "click", "shiftKey", "expandOrCollapseEvent")
  // visualization.addEventListener(tree, "dblclick", "ctrlKey", "expandOrCollapseEvent")
  // visualization.addEventListener(tree, "dblclick", undefined, "expandOrCollapseEvent")

  // visualization.render(graph, tree)

  const cc = { control: {}, customEdge: { labelColor: "#f00" } }
  const ec = { thinEdge: { type: "solid" } }
  const tree4 = new TreeLayout({ rootId: 16, renderDepth: 2, animationSpeed: 900 })
  // visualization.render(graph, tree4)
  const tree2 = new TreeLayout({ rootId: 153, renderDepth: 0, animationSpeed: 300, orientation: "vertical" })
  // await visualization.render(graph, tree2)

  // const tree3 = new TreeLayout({ rootId: 137, renderDepth: 1, animationSpeed: 300 })
  const tree3 = new TreeLayout({ rootId: 110, renderDepth: 1, animationSpeed: 300, orientation: "vertical" })
  await visualization.render(graph, tree3)




  const tree5 = new TreeLayout({ rootId: 161, renderDepth: 1, animationSpeed: 300 })
  visualization.addCustomNodeRepresentation(tree5, { control: { borderStrokeColor: "#f0f" } })
  visualization.addCustomEdgeRepresentation(tree5, { thinEdge: { strokeColor: "#f0f" } })
  // await visualization.render(graph, tree5)

  // setTimeout(() => {
  //   // visualization.update(tree2, { rootId: 111, renderDepth: 1, visibleNodeLimit: 3 })
  //   console.log("update now")
  //   graph.excludeNode(160)

  //   visualization.update(tree3, graph, { orientation: "horizontal", renderDepth: 2 })
  // }, 1000)
}

const contextualLayout = async () => {
  // create the underlying graph structure that holds references to our data
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

  // containerConnectionColor: "#f0f"
  const contextual1 = new ContextualLayout({ focusId: 19, animationSpeed: 300 })
  const contextual2 = new ContextualLayout({ focusId: 36, animationSpeed: 300 })
  const contextual3 = new ContextualLayout({ focusId: 36, animationSpeed: 300, showAssignedConnection: false })

  // visualization.addEventListener(contextual1, "dblclick", "shiftKey", "traverseInLayoutEvent")
  // visualization.addCustomNodeRepresentation(contextual1, { control: { borderStrokeColor: "#f0f" } })
  // visualization.addCustomEdgeRepresentation(contextual1, { boldEdge: { color: "#f0f" } })

  // await visualization.render(graph, contextual1)
  await visualization.render(graph, contextual2)
  // await visualization.render(graph, contextual3)


  setTimeout(() => {
    // visualization.transform(contextual2, graph, new GridLayout({ limitColumns: 4, limitNodes: 12 }))
    // visualization.update(contextual1, graph, { focusId: 36 })
  }, 3000)
}




// gridLayout()
// radialLayout()
// treeLayout()
contextualLayout()

// side_by_side_example()
// transform_layout()


