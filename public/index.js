/* eslint-disable */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable import/extensions */
/* eslint-disable max-classes-per-file */


import {
  Visualization, TreeLayout, ContextualLayout, GridLayout, RadialLayout, Asset,
} from "./graphVisualization.js"


const visualization = new Visualization({
  databaseUrl: "http://localhost:3001",
  nodeEndpoint: "node-data",
  edgeEndpoint: "edge-data",
  contextualRelationshipEndpoint: "contextual-relationships",
  zoomLevel: 0.85
})

// const data = { "id": 74, "label": "TEST ASSET 1", "description": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam maxime cupiditate fugiat deserunt libero, ab temporibus delectus sunt et doloribus. Voluptate expedita dicta neque harum debitis laudantium molestias velit aut, quos impedit consequatur est libero aliquam enim quibusdam optio nisi aspernatur. Voluptates iure reiciendis, eos illo explicabo sequi architecto! Iure numquam officia temporibus et, mollitia, dolore quas eos non quibusdam quia hic dolores impedit debitis eligendi? Sequi a maxime provident tenetur eveniet modi animi consectetur vitae, nostrum amet ad iusto accusamus placeat, beatae saepe voluptatum! Veritatis architecto error cum eaque. Ipsam blanditiis ab, tenetur eveniet modi doloribus aspernatur aliquid dicta.", "type": "asset", "keyValuePairs": [{ "key": "key 1", "value": "key value pair: value 1" }, { "key": "key 2", "value": "key value pair: value 2" }, { "key": "key 3", "value": "key value pair: value 3" }, { "key": "key 4", "value": "key value pair: value 4" }, { "key": "key 5", "value": "key value pair: value 5" }, { "key": "key 6", "value": "key value pair: value 6" }], "tooltip": "Asset with <br> tooltip", "parent": null, "children": [], "config": null }
// const asset = new Asset(data, visualization.canvas)
// // asset.renderAsMax(300, 400, 400, 300)
// asset.renderAsMin(100, 50, 150, 100)


// // setTimeout(() => asset.transformToMin(100, 50), 1000)
// setTimeout(() => asset.transformToMax(500, 500), 1000)


// const asset = new Asset(data, visualization.canvas)
// asset.setFinalXY(300, 300)
// asset.renderAsMin(250, 250, 300, 300)


const basicGridLayout = () => {
  // create the underlying graph structure which holds references to our data
  const graph = visualization.createInitialGraph()

  // add nodes
  // for (let i = 0; i < 30; i += 1) {
  // }

  graph.includeNode(75)
  graph.includeNode(74)
  // remove nodes
  // graph.excludeNode(4)
  // graph.excludeNode(5)

  // create a grid layout with additional layout configuration
  const grid = new GridLayout({ limitNodes: 10, limitColumns: 5 })

  // render the layout
  visualization.render(graph, grid)
}


const updateGridLayout = () => {
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


  // or update both, the underlying data and the layout configuration
  setTimeout(() => {
    // add nodes
    graph.includeNode(4)
    graph.includeNode(5)

    // update the graph and the layout
    visualization.update(grid, graph, { limitColumns: 8, limitNodes: null })
  }, 1000)


  setTimeout(() => {
    // update the layout
    visualization.update(grid, { limitNodes: 8, limitColumns: 4 })
  }, 3000)
}

const changeGridMouseEvent = () => {
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
  const events = [{ name: "expandGridLayoutEvent", mouse: "dblclick", modifier: "shiftKey" }]
  const grid = new GridLayout({ limitNodes: 10, limitColumns: 5 }, event)

  // render the layout
  visualization.render(graph, grid)
}
const evaltest = async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))


  for (let i = 0; i < 100; i += 1) {
    const visualization = new Visualization({
      databaseUrl: "http://localhost:3001",
      nodeEndpoint: "node-data",
      edgeEndpoint: "edge-data",
    })
    const graph1 = visualization.createInitialGraph()

    for (let i = 0; i < 75; i += 1) { graph1.includeNode(i) }
    for (let i = 142; i <= 160; i += 1) { graph1.includeNode(i) }
    for (let i = 6; i <= 11; i += 1) { graph1.includeNode(i) }


    const grid1 = new GridLayout({ limitNodes: null, animationSpeed: 300, limitColumns: 20 })
    visualization.render(graph1, grid1)

    await sleep(400)
    const elem = document.getElementById("canvas")
    elem.remove()
    // await sleep(100);
  }

  console.log("done")
}

// evaltest()

const multipleLayoutsSideBySide = () => {
  const graph2 = visualization.createInitialGraph([0, 1, 2, 3])
  const graph3 = visualization.createInitialGraph([13, 14, 15])
  const graph4 = visualization.createInitialGraph([4, 5])
  const graph5 = visualization.createInitialGraph([0, 1, 4, 8, 10, 14])
  const grid2 = new GridLayout({ limitNodes: 4, limitColumns: 1, translateX: 0 })
  const grid3 = new GridLayout(
    { limitNodes: 1, limitColumns: 3, translateY: 0 },
    [{ name: "expandGridLayoutEvent", mouse: "dblclick", modifier: "shiftKey" }],
    { asset: { borderStrokeColor: "#fff", borderStrokeDasharray: "0" } },
  )
  const grid4 = new GridLayout({ limitNodes: null, limitColumns: 1, translateY: 0 })
  const grid5 = new GridLayout({ limitNodes: null, limitColumns: 1, translateX: 0 })

  visualization.render(graph3, grid3)
  visualization.render(graph2, grid2)
  visualization.render(graph4, grid4)
  visualization.render(graph5, grid5)
}



const updateRadialLayout = () => {
  const graph = visualization.createInitialGraph()

  // add nodes
  for (let i = 110; i <= 149; i += 1) {
    graph.includeNode(i)
  }

  // add edges
  graph.includeEdge(111, 110)
  graph.includeEdge(112, 110)
  graph.includeEdge(113, 110)

  // create a radial layout with a root and a rendering depth
  const radial = new RadialLayout({ root: 110, renderDepth: 3 })

  // render the layout
  visualization.render(graph, radial)

  setTimeout(() => {
    // update the layout
    visualization.update(radial, {
      translateX: 100, translateY: 0, radialRadius: 200, radiusDelta: 150, hAspect: 4 / 2,
    })
  }, 1000)
}


const contextualLayout = () => {
  const graph6 = visualization.createInitialGraph()
  for (let i = 16; i <= 39; i += 1) {
    graph6.includeNode(i)
  }

  graph6.includeEdge(36, 34)
  graph6.includeEdge(37, 36)


  const contextual1 = new ContextualLayout({ focus: 36, animationSpeed: 1 })
  visualization.render(graph6, contextual1)
}

const radialLayout = () => {
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

  // create a radial layout with a root and a rendering depth
  const radial = new RadialLayout({ rootId: 110, renderDepth: 1 })
  // const radial = new RadialLayout({ rootId: 16, renderDepth: 1 })
  // const radial = new RadialLayout({ rootId: 161, renderDepth: 1 })
  // const radial = new RadialLayout({ rootId: 137, renderDepth: 2 })

  // render the layout
  visualization.render(graph, radial)
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

  const tree3 = new TreeLayout({ rootId: 137, renderDepth: 1, animationSpeed: 300 })
  // visualization.render(graph, tree3)

  const tree2 = new TreeLayout({ rootId: 153, renderDepth: 3, animationSpeed: 300 })
  await visualization.render(graph, tree2)



  const tree5 = new TreeLayout({ rootId: 161, renderDepth: 1, animationSpeed: 300 })
  // visualization.addCustomNodeRepresentation(tree5, { control: { borderStrokeColor: "#f0f" } })
  // visualization.addCustomEdgeRepresentation(tree5, { customEdge: { labelColor: "#f0f" } })
  // await visualization.render(graph, tree5)

  setTimeout(() => {
    // visualization.update(tree3, { orientation: "horizontal", translateX: 0, translateY: 100, renderDepth: 1 })
    console.log("update now")
    graph.excludeNode(160)

    visualization.update(tree2, graph, { orientation: "horizontal" })
  }, 1000)
}


radialLayout()
// treeLayout()


// basicGridLayout()
// changeGridMouseEvent()
// updateGridLayout()

// manyElementsRendered()

// updateRadialLayout()


// treeLayout()

// multipleLayoutsSideBySide()
// contextualLayout()
