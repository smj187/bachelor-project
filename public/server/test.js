/* eslint-disable max-len */
/* eslint-disable import/extensions */
/* eslint-disable max-classes-per-file */

import { Visualization } from "../graphVisualization.js"

const nodes = [
  {
    id: 0,
    label: "Risk 1",
    description: "torquent leo quisque nec sem dictum eu habitasse metus molestie etiam nulla lacus eros consequat cras posuere aliquam massa posuere enim praesent ut nisl bibendum nulla in litora vel tempor et maecenas",
    type: "risk",
    state: "medium",
    tooltipText: "Risk's tooltip",
    parent: null,
    children: [],
    config: null,
  },
  {
    id: 1,
    label: "Risk 2",
    description: "eu ut tortor feugiat purus egestas tortor etiam",
    type: "risk",
    state: "critical",
    tooltipText: "Risk's tooltip",
    parent: null,
    children: [],
    config: null,
  },
  {
    id: 2,
    label: "Risk 3",
    description: "neque purus luctus netus tempor bibendum vivamus venenatis sollicitudin fringilla litora litora fringilla vel laoreet odio enim quisque justo dui leo ut pellentesque luctus velit scelerisque vel fringilla a est id nisi torquent ornare nostra dictum cursus phasellus scelerisque lorem",
    type: "risk",
    state: "low",
    tooltipText: null,
    parent: null,
    children: [],
    config: null,
  },
  {
    id: 3,
    label: "Risk 4",
    description: "proin vestibulum magna metus sem tincidunt ultrices maecenas convallis neque sed iaculis lacus quisque imperdiet placerat purus nibh magna justo nam sodales tortor mauris cras diam lorem potenti sem cras magna ultrices fames",
    type: "risk",
    state: null,
    tooltipText: "Risk's tooltip",
    parent: null,
    children: [],
    config: null,
  },
  {
    id: 4,
    label: "Risk 5",
    description: "purus tortor congue suscipit luctus tempus senectus etiam leo porttitor elit ut sodales bibendum nam auctor porta hac dolor vel",
    type: "risk",
    state: null,
    tooltipText: "Risk's tooltip",
    parent: null,
    children: [],
    config: null,
  },
  {
    id: 5,
    label: "Risk 6",
    description: "purus tortor congue suscipit luctus tempus senectus etiam leo porttitor elit ut sodales bibendum nam auctor porta hac dolor vel",
    type: "risk",
    state: null,
    tooltipText: "Risk's tooltip",
    parent: null,
    children: [],
    config: null,
  },
  {
    id: 10,
    label: "Requirement 0",
    description: "leo rhoncus cursus etiam habitasse molestie velit blandit phasellus cursus lacinia ut est nulla lectus tristique rhoncus sollicitudin consectetur ligula proin nam eget duis ut imperdiet metus",
    type: "requirement",
    state: "FULFILLED",
    tooltipText: null,
    parent: null,
    children: [11, 12, 13],
    config: null,
  },
  {
    id: 11,
    label: "Requirement 1",
    description: "diam facilisis sodales est aliquet aliquet urna habitasse",
    type: "requirement",
    state: "NOT-FULFILLED",
    tooltipText: "Requirement's tooltip",
    parent: 10,
    children: [],
    config: null,
  },
  {
    id: 12,
    label: "Requirement 2",
    description: "adipiscing eros tellus feugiat cursus porttitor dolor faucibus bibendum lobortis amet mi quam habitasse leo per aliquet vestibulum erat vehicula blandit",
    type: "requirement",
    state: "PARTIALLY-FULFILLED",
    tooltipText: "Requirement's tooltip",
    parent: 10,
    children: [],
    config: null,
  },
  {
    id: 13,
    label: "Requirement 3",
    description: "tellus litora molestie fusce litora auctor cubilia nulla accumsan donec amet aliquam aliquam amet dictum metus hac tempor ultrices maecenas",
    type: "requirement",
    state: "PARTIALLY-FULFILLED",
    tooltipText: null,
    parent: 10,
    // children: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    children: [],
    config: null,
  },
  // {
  //   id: 14,
  //   label: "Requirement 4",
  //   description: "ante enim nibh tincidunt taciti justo ad",
  //   type: "requirement",
  //   state: "FULFILLED",
  //   tooltipText: null,
  //   parent: 13,
  //   children: [],
  //   config: null,
  // },
  // {
  //   id: 15,
  //   label: "Requirement 5",
  //   description: "nulla accumsan donec amet aliquam aliquam amet dictum metus hac ",
  //   type: "requirement",
  //   state: "NOT-FULFILLED",
  //   tooltipText: null,
  //   parent: 13,
  //   children: [],
  //   config: null,
  // },
  // {
  //   id: 16,
  //   label: "Requirement 6",
  //   description: "nulla accumsan donec amet aliquam aliquam amet dictum metus hac ",
  //   type: "requirement",
  //   state: "NOT-FULFILLED",
  //   tooltipText: null,
  //   parent: 13,
  //   children: [],
  //   config: null,
  // },
  // {
  //   id: 17,
  //   label: "Requirement 7",
  //   description: "nulla accumsan donec amet aliquam aliquam amet dictum metus hac ",
  //   type: "requirement",
  //   state: "NOT-FULFILLED",
  //   tooltipText: null,
  //   parent: 13,
  //   children: [],
  //   config: null,
  // },
  // {
  //   id: 18,
  //   label: "Requirement 8",
  //   description: "nulla accumsan donec amet aliquam aliquam amet dictum metus hac ",
  //   type: "requirement",
  //   state: "NOT-FULFILLED",
  //   tooltipText: null,
  //   parent: 13,
  //   children: [],
  //   config: null,
  // },
  // {
  //   id: 19,
  //   label: "Requirement 9",
  //   description: "nulla accumsan donec amet aliquam aliquam amet dictum metus hac ",
  //   type: "requirement",
  //   state: "NOT-FULFILLED",
  //   tooltipText: null,
  //   parent: 13,
  //   children: [],
  //   config: null,
  // },
  // {
  //   id: 20,
  //   label: "Requirement 10",
  //   description: "nulla accumsan donec amet aliquam aliquam amet dictum metus hac ",
  //   type: "requirement",
  //   state: "NOT-FULFILLED",
  //   tooltipText: null,
  //   parent: 13,
  //   children: [],
  //   config: null,
  // },
  // {
  //   id: 21,
  //   label: "Requirement 11",
  //   description: "nulla accumsan donec amet aliquam aliquam amet dictum metus hac ",
  //   type: "requirement",
  //   state: "NOT-FULFILLED",
  //   tooltipText: null,
  //   parent: 13,
  //   children: [],
  //   config: null,
  // },
  // {
  //   id: 22,
  //   label: "Requirement 12",
  //   description: "nulla accumsan donec amet aliquam aliquam amet dictum metus hac ",
  //   type: "requirement",
  //   state: "NOT-FULFILLED",
  //   tooltipText: null,
  //   parent: 13,
  //   children: [],
  //   config: null,
  // },
  // {
  //   id: 23,
  //   label: "Requirement 13",
  //   description: "nulla accumsan donec amet aliquam aliquam amet dictum metus hac ",
  //   type: "requirement",
  //   state: "NOT-FULFILLED",
  //   tooltipText: null,
  //   parent: 13,
  //   children: [],
  //   config: null,
  // },
]

const edges = [
  {
    id: 0,
    label: "0 <- req -> 1",
    type: "dashed",
    node1: 10,
    node2: 11,
  },
  // {
  //   id: 1,
  //   label: "3 <- req -> 13",
  //   type: "bold",
  //   node1: 23,
  //   node2: 13,
  // },
  // {
  //   id: 2,
  //   label: "normal",
  //   // type: "bold",
  //   node1: 13,
  //   node2: 16,
  // },
]

class Edge {
  constructor(data, node1, node2) {
    this.id = data.id || 0
    this.label = data.label || null
    this.type = data.type || null
    this.node1 = node1[0].id || null
    this.node2 = node2[0].id || null
  }
}
class Node {
  constructor(data) {
    this.id = data.id
    this.label = data.label
    this.description = data.description
    this.type = data.type
    this.state = data.state
    this.tooltipText = data.tooltipText
    this.parent = data.parent
    this.children = data.children
    this.config = data.config
  }
}

class Graph {
  constructor() { this.nodes = new Map(); this.edges = [] }

  getNodes() { return this.nodes }

  getEdges() { return this.edges }

  addNode(data) { this.nodes.set(new Node(data), []) }

  addEdge(data) {
    const keys = Array.from(this.nodes.entries())// .map((k) => k[0])
    const node1 = keys.find((k) => k[0].id === data.node1)
    const node2 = keys.find((k) => k[0].id === data.node2)

    const edge = new Edge(data, node1, node2)

    const adj = this.nodes.get(node1[0])
    adj.push(edge)
    this.edges.push(edge)
  }

  getNeighbors(id) {
    const to = this.edges.filter((e) => e.node1[0].id === id).map((n) => n.node2[0])
    const from = this.edges.filter((e) => e.node2[0].id === id).map((n) => n.node1[0])
    return [from, to]
  }
}


const G = new Graph()
nodes.forEach((node) => G.addNode(node))
edges.forEach((node) => G.addEdge(node))

// const neighbors = G.getNeighbors(4)
// console.log(neighbors)


const vis = new Visualization()

// /* Grid 1 */
// const grid1 = vis.createGridLayout(G.getNodes(), {
//   translateY: 0, maxLayoutWidth: 100, renderingSize: "min", limitedTo: 1,
// })
// grid1.calculate()
// grid1.render()

// /* Grid 2 */
// const grid2 = vis.createGridLayout(G.getNodes(), {
//   translateX: 0, translateY: 0, maxLayoutWidth: 300, renderingSize: "min", limitedTo: 1,
// })
// grid2.calculate()
// grid2.render()

const radialNodes = G.getNodes()
// eslint-disable-next-line no-restricted-syntax
for (const [key] of radialNodes) {
  if (key.type !== "requirement") {
    radialNodes.delete(key)
  }
}

const radialEdges = G.getEdges()
const radial1 = vis.createRadialLayout(radialNodes, radialEdges, { translateY: 150, translateX: 200 })
// radial1.calculate()
radial1.render()

console.log(radial1.getRootNode())


// <!-- <script type="module">
// 		import { Visualization, NodeFactory, EdgeFactory } from "./graphVisualization.js"


// 		const data = [
// 			{
// 				id: 0,
// 				label: "Asset 1",
// 				type: "asset",
// 				// tooltipText: "Asset with <br> tooltip",
// 				description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam maxime cupiditate fugiat deserunt libero, ab temporibus delectus sunt et doloribus. Voluptate expedita dicta neque harum debitis laudantium molestias velit aut, quos impedit consequatur est libero aliquam enim quibusdam optio nisi aspernatur. Voluptates iure reiciendis, eos illo explicabo sequi architecto! Iure numquam officia temporibus et, mollitia, dolore quas eos non quibusdam quia hic dolores impedit debitis eligendi? Sequi a maxime provident tenetur eveniet modi animi consectetur vitae, nostrum amet ad iusto accusamus placeat, beatae saepe voluptatum! Veritatis architecto error cum eaque. Ipsam blanditiis ab, tenetur eveniet modi doloribus aspernatur aliquid dicta.",
// 				keyValuePairs: [
// 					{ key: "key 1", value: "key value pair: value 1" },
// 					{ key: "key 2", value: "key value pair: value 2" },
// 					{ key: "key 3", value: "key value pair: value 3" },
// 					{ key: "key 4", value: "key value pair: value 4" },
// 					{ key: "key 5", value: "key value pair: value 5" },
// 					{ key: "key 6", value: "key value pair: value 6" },
// 				],
// 			},
// 			{
// 				id: 1,
// 				label: "Control 1",
// 				type: "control",
// 				description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam maxime cupiditate fugiat deserunt libero, ab temporibus delectus sunt et doloribus. Voluptate expedita dicta neque harum debitis laudantium molestias velit aut, quos impedit consequatur est libero aliquam enim quibusdam optio nisi aspernatur. Voluptates iure reiciendis, eos illo explicabo sequi architecto! Iure numquam officia temporibus et, mollitia, dolore quas eos non quibusdam quia hic dolores impedit debitis eligendi? Sequi a maxime provident tenetur eveniet modi animi consectetur vitae, nostrum amet ad iusto accusamus placeat, beatae saepe voluptatum! Veritatis architecto error cum eaque. Ipsam blanditiis ab, tenetur eveniet modi doloribus aspernatur aliquid dicta.",
// 			},
// 			{
// 				id: 2,
// 				label: "Risk 1",
// 				type: "risk",
// 				description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam maxime cupiditate fugiat deserunt libero, ab temporibus delectus sunt et doloribus. Voluptate expedita dicta neque harum debitis laudantium molestias velit aut, quos impedit consequatur est libero aliquam enim quibusdam optio nisi aspernatur. Voluptates iure reiciendis, eos illo explicabo sequi architecto! Iure numquam officia temporibus et, mollitia, dolore quas eos non quibusdam quia hic dolores impedit debitis eligendi? Sequi a maxime provident tenetur eveniet modi animi consectetur vitae, nostrum amet ad iusto accusamus placeat, beatae saepe voluptatum! Veritatis architecto error cum eaque. Ipsam blanditiis ab, tenetur eveniet modi doloribus aspernatur aliquid dicta.",
// 				state: "critical",
// 			},
// 			{
// 				id: 3,
// 				label: "Requirement 1",
// 				description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam maxime cupiditate fugiat deserunt libero, ab temporibus delectus sunt et doloribus. Voluptate expedita dicta neque harum debitis laudantium molestias velit aut, quos impedit consequatur est libero aliquam enim quibusdam optio nisi aspernatur. Voluptates iure reiciendis, eos illo explicabo sequi architecto! Iure numquam officia temporibus et, mollitia, dolore quas eos non quibusdam quia hic dolores impedit debitis eligendi? Sequi a maxime provident tenetur eveniet modi animi consectetur vitae, nostrum amet ad iusto accusamus placeat, beatae saepe voluptatum! Veritatis architecto error cum eaque. Ipsam blanditiis ab, tenetur eveniet modi doloribus aspernatur aliquid dicta.",
// 				type: "requirement",
// 				state: "not-fulfilled",
// 			},
// 			{
// 				id: 4,
// 				label: "Custom 1",
// 				type: "custom",
// 				description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam maxime cupiditate fugiat deserunt libero, ab temporibus delectus sunt et doloribus. Voluptate expedita dicta neque harum debitis laudantium molestias velit aut, quos impedit consequatur est libero aliquam enim quibusdam optio nisi aspernatur. Voluptates iure reiciendis, eos illo explicabo sequi architecto! Iure numquam officia temporibus et, mollitia, dolore quas eos non quibusdam quia hic dolores impedit debitis eligendi? Sequi a maxime provident tenetur eveniet modi animi consectetur vitae, nostrum amet ad iusto accusamus placeat, beatae saepe voluptatum! Veritatis architecto error cum eaque. Ipsam blanditiis ab, tenetur eveniet modi doloribus aspernatur aliquid dicta.",
// 				state: "some state i'm in",
// 			}
// 		]

// 		const visualization = new Visualization()
// 		const { canvas } = visualization


// 		const nodes = [
// 			{
// 				id: 0,
// 				label: "A",
// 			},
// 			{
// 				id: 1,
// 				label: "B",
// 			},
// 			{
// 				id: 2,
// 				label: "C",
// 			},
// 			{
// 				id: 3,
// 				label: "D",
// 			},
// 			{
// 				id: 4,
// 				label: "E",
// 			},
// 			{
// 				id: 5,
// 				label: "F",
// 			},
// 		]

// 		const edges = [
// 			{
// 				id: 0,
// 				label: "A <-> B",
// 				node1: 0,
// 				node2: 1
// 			}
// 		]


// 		// visualization.createGridLayout(nodes)

// 		// edges example
// 		/*
// 				const risk1 = NodeFactory.create(data.find(d => d.type === "risk"), canvas)
// 				risk1.setInitialXY(200, 100)
// 				risk1.renderAsMin()


// 				const control1 = NodeFactory.create(data.find(d => d.type === "control"), canvas)
// 				control1.setInitialXY(700, 450)
// 				control1.renderAsMin()

// 				const edge1 = EdgeFactory.create(canvas, risk1, control1)
// 				edge1.setLabel("sometext")
// 				edge1.createSVGElement()
// 				edge1.transformToFinal()

// 				setTimeout(() => edge1.transformToInitial(), 1000)
// 				setTimeout(() => edge1.transformToFinal(), 2000)


// 				const requirement1 = NodeFactory.create(data.find(d => d.type === "requirement"), canvas)
// 				requirement1.setInitialXY(200, 500)
// 				requirement1.renderAsMax()

// 				const edge2 = EdgeFactory.create(canvas, requirement1, risk1, { type: "bold" })
// 				edge2.setLabel("boldtext")
// 				edge2.createSVGElement()
// 				edge2.transformToFinal()

// 				setTimeout(() => edge2.transformToInitial(), 1000)
// 				setTimeout(() => edge2.transformToFinal(), 2000)


// 				const requirement2 = NodeFactory.create(data.find(d => d.type === "requirement"), canvas)
// 				requirement2.setInitialXY(600, 100)
// 				requirement2.renderAsMin()

// 				const edge3 = EdgeFactory.create(canvas, requirement2, control1, { strokeColor: "orange", type: "dashed", strokeDasharray: "5 4 5" })
// 				edge3.setLabel("loremasjfaoi")
// 				edge3.createSVGElement()
// 				edge3.transformToFinal()

// 				setTimeout(() => edge3.transformToInitial(), 1000)
// 				setTimeout(() => edge3.transformToFinal(), 2000)
// 			*/

// 				// end

// 	</script> -->
