import BaseLayout from "./BaseLayout"
import ContextualContainer from "./helpers/ContextualContainer"
import GridExpander from "./helpers/GridExpander"

const ContextualConfig = {
  // limit width and size
  maxLayoutWidth: 1200,
  maxLayoutHeight: 800,

  // where to translate a given layout
  translateX: 0,
  translateY: 0,

  // layout animation speed for all nodes and edges
  animationSpeed: 300,

  // hide all other layouts and center selected one
  hideOtherLayouts: false, // TODO:

  // spacing between nodes
  spacing: 16,
  parentFocusDistance: 250, // TODO: fix naming convention
  childFocusDistance: 250,
  translateRiskX: 450,
  translateRiskY: -100,
  focusRiskDistance: 400,

  // how to render all nodes
  renderingSize: "min", // min max

  // risk container
  riskLimitContainer: 1,
  riskContainderBorderRadius: 5,
  riskContainerBorderStrokeColor: "#ff8e9e",
  riskContainerBorderStrokeWidth: 1,
  riskContainerBackgroundColor: "#fff",

  // children container
  childrenLimitContainer: 3,
  childrenContainderBorderRadius: 5,
  childrenContainerBorderStrokeColor: "#555555cc",
  childrenContainerBorderStrokeWidth: 1,
  childrenContainerBackgroundColor: "#fff",

  // container config
  parentLimitContainer: 3,
  parentContainderBorderRadius: 5,
  parentContainerBorderStrokeColor: "#555555cc",
  parentContainerBorderStrokeWidth: 1,
  parentContainerBackgroundColor: "#fff",
}

class ContextualLayout extends BaseLayout {
  constructor(overrideConfig = {}) {
    super()

    this.config = { ...ContextualConfig, ...overrideConfig }

    if (overrideConfig.startNodeId === undefined) {
      throw new Error("No Focus element reference id provided")
    }

    this.startNodeId = overrideConfig.startNodeId

    this.focus = null
    this.parents = []
    this.children = []
    this.assginedNode = null
    this.assignedRisks = []
    this.containers = []
  }

  calculateLayout() {
    const centerX = this.config.maxLayoutWidth / 2
    const centerY = this.config.maxLayoutHeight / 2


    // calculate risk container
    const calculateContainers = (risks, children, parents) => {
      const createContainer = (nodes, type) => {
        const xValues = nodes.map((r) => r.finalX)
        const yValues = nodes.map((r) => r.finalY)

        const p0x = Math.min(...xValues) - nodes[0].config.minWidth / 2 - this.config.spacing
        const p0y = Math.min(...yValues) - nodes[0].config.minHeight / 2 - this.config.spacing
        const p1x = Math.max(...xValues) + nodes[0].config.minWidth / 2 + this.config.spacing
        const p1y = Math.min(...yValues) - nodes[0].config.minHeight / 2 - this.config.spacing
        const p2x = Math.max(...xValues) + nodes[0].config.minWidth / 2 + this.config.spacing
        const p2y = Math.max(...yValues) + nodes[0].config.minHeight / 2 + this.config.spacing
        // this.canvas.circle(5).center(p0x, p0y)
        // this.canvas.circle(5).center(p1x, p1y).fill("#f75")
        // this.canvas.circle(5).center(p2x, p2y).fill("#6f7")

        const w = Math.hypot(p0x - p1x, p0y - p1y)
        const h = Math.sqrt((p2x - p1x) ** 2 + (p2y - p1y) ** 2)

        const cx = (p0x + p2x) / 2
        const cy = (p0y + p2y) / 2


        const container = new ContextualContainer(this.canvas, this.config, type)
        container.w = w
        container.h = h
        container.cx = cx
        container.cy = cy
        this.containers = [...this.containers, container]
      }


      if (risks.length > this.config.riskLimitContainer) { // FIXME: it does not render a container for one risk
        createContainer(risks, "riskContainer")
      }


      if (children.length > this.config.childrenLimitContainer) {
        createContainer(children, "childrenContainer")
      }

      if (parents.length > this.config.parentLimitContainer) {
        createContainer(parents, "parentContainer")
      }
    }

    // calculate focus position
    const calculateFocusPosition = () => {
      this.focus.setFinalX(centerX - centerX / 2.5)
      this.focus.setFinalY(centerY)
    }

    // caculate assgined node position
    const calculateAssignedPosition = () => {
      if (this.assginedNode) {
        this.assginedNode.setFinalX(centerX + centerX / 1.25)
        this.assginedNode.setFinalY(centerY)
      }
    }

    // position parents as grid
    const calculateParentChildRiskPositions = (nodes, location) => {
      if (nodes.length === 0) {
        return
      }

      let limitation
      if (location === "risk") {
        limitation = this.config.riskLimitContainer
      } else if (location === "parent") {
        limitation = this.config.parentLimitContainer
      } else {
        limitation = this.config.childrenLimitContainer
      }

      const fx = this.focus.getFinalX()
      const fy = this.focus.getFinalY()
      const rx = this.focus.getFinalY() + this.config.translateRiskX
      const ry = this.focus.getFinalY() + this.config.translateRiskY

      // arranges nodes next to each other growing to the left
      const calculateLeftNodes = (nodeList, row, isEven = false) => {
        let w = 0
        nodeList.forEach((node, i) => {
          if (isEven === false) {
            w += node.config.minWidth + this.config.spacing
          } else {
            w += (node.config.minWidth / 2) + this.config.spacing
            if (i > 0) {
              w += (node.config.minWidth / 2)
            } else {
              w -= this.config.spacing / 2
            }
          }
          if (location === "risk") {
            node.setFinalX(rx - w)
          } else {
            node.setFinalX(fx - w)
          }

          const rowMultiplier = row * node.config.minHeight + row * this.config.spacing
          if (location === "parent") {
            node.setFinalY(fy - this.config.parentFocusDistance - rowMultiplier)
          } else if (location === "child") {
            node.setFinalY(fy + this.config.childFocusDistance + rowMultiplier)
          } else {
            node.setFinalY(ry + this.config.childFocusDistance + rowMultiplier)
          }
        })
      }

      // arranges nodes next to each other growing to the right
      const calculateRightNodes = (nodeList, row, isEven = false) => {
        let w = 0
        nodeList.forEach((node, i) => {
          if (isEven === false) {
            w += node.config.minWidth + this.config.spacing
          } else {
            w += (node.config.minWidth / 2) + this.config.spacing
            if (i > 0) {
              w += (node.config.minWidth / 2)
            } else {
              w -= this.config.spacing / 2
            }
          }

          if (location === "risk") {
            node.setFinalX(rx + w)
          } else {
            node.setFinalX(fx + w)
          }

          const rowMultiplier = row * node.config.minHeight + row * this.config.spacing
          if (location === "parent") {
            node.setFinalY(fy - this.config.parentFocusDistance - rowMultiplier)
          } else if (location === "child") {
            node.setFinalY(fy + this.config.childFocusDistance + rowMultiplier)
          } else {
            node.setFinalY(ry + this.config.childFocusDistance + rowMultiplier)
          }
        })
      }

      const calculateCenterNode = (node, row) => {
        if (location === "risk") {
          node.setFinalX(rx)
        } else {
          node.setFinalX(fx)
        }

        const rowMultiplier = row * node.config.minHeight + row * this.config.spacing
        if (location === "parent") {
          node.setFinalY(fy - this.config.parentFocusDistance - rowMultiplier)
        } else if (location === "child") {
          node.setFinalY(fy + this.config.parentFocusDistance + rowMultiplier)
        } else {
          node.setFinalY(ry + this.config.childFocusDistance + rowMultiplier)
        }
      }

      // arragen nodes without a container
      if (limitation >= nodes.length) {
        // dont create a container

        if (nodes.length % 2 === 1) {
          const mid = nodes.indexOf(nodes[Math.floor(nodes.length / 2)])
          const leftNodes = nodes.slice(0, mid)
          const rightNodes = nodes.slice(mid + 1)
          const center = nodes[mid]
          calculateCenterNode(center, 0)
          calculateLeftNodes(leftNodes, 0)
          calculateRightNodes(rightNodes, 0)
        } else {
          const mid = nodes.indexOf(nodes[Math.floor(nodes.length / 2)])
          const leftNodes = nodes.slice(0, mid)
          const rightNodes = nodes.slice(mid)
          calculateLeftNodes(leftNodes, 0, true)
          calculateRightNodes(rightNodes, 0, true)
        }
      }

      // create nodes inside a container
      if (limitation < nodes.length) {
        // calculate node positions if there are more nodes than the set container limit
        if (limitation % 2 === 0) {
          const cols = limitation
          const rows = Math.ceil(nodes.length / cols)
          let nodeIndex = 0

          for (let row = 0; row < rows; row += 1) {
            const rowNodes = []
            for (let col = 0; col < cols; col += 1) {
              const node = nodes[nodeIndex]
              if (node !== undefined) {
                rowNodes.push(node)
                nodeIndex += 1
              }
            }

            if (rowNodes.length % 2 === 0) {
              const mid = rowNodes.indexOf(rowNodes[Math.floor(rowNodes.length / 2)])
              const leftNodes = rowNodes.slice(0, mid)
              const rightNodes = rowNodes.slice(mid)

              calculateLeftNodes(leftNodes, row, true)
              calculateRightNodes(rightNodes, row, true)
            } else {
              const mid = rowNodes.indexOf(rowNodes[Math.floor(rowNodes.length / 2)])
              const leftNodes = rowNodes.slice(0, mid)
              const rightNodes = rowNodes.slice(mid + 1)
              const center = rowNodes[mid]


              calculateCenterNode(center, row)
              calculateLeftNodes(leftNodes, row)
              calculateRightNodes(rightNodes, row)
            }
          }
        } else {
          const cols = limitation
          const rows = Math.ceil(nodes.length / cols)
          let nodeIndex = 0

          for (let row = 0; row < rows; row += 1) {
            const rowNodes = []
            for (let col = 0; col < cols; col += 1) {
              const node = nodes[nodeIndex]
              if (node !== undefined) {
                rowNodes.push(node)
                nodeIndex += 1
              }
            }

            if (rowNodes.length % 2 === 1) {
              const mid = rowNodes.indexOf(rowNodes[Math.floor(rowNodes.length / 2)])
              const leftNodes = rowNodes.slice(0, mid)
              const rightNodes = rowNodes.slice(mid + 1)
              const center = rowNodes[mid]

              calculateCenterNode(center, row)
              calculateLeftNodes(leftNodes, row)
              calculateRightNodes(rightNodes, row)
            } else {
              const mid = rowNodes.indexOf(rowNodes[Math.floor(rowNodes.length / 2)])
              const leftNodes = rowNodes.slice(0, mid)
              const rightNodes = rowNodes.slice(mid)

              calculateLeftNodes(leftNodes, row, true)
              calculateRightNodes(rightNodes, row, true)
            }
          }
        }
      }
    }

    // calculate parent and child edges
    const calculateParentChildEdges = (edges) => {
      edges.forEach((edge) => {
        edge.calculateEdge()
      })
    }

    // calculate risk and assigned edge // TODO:
    const calculateContainerEdges = (risks, container) => {
      // risk
      const riskContainer = container.find((c) => c.type === "riskContainer")
      const childrenContainer = container.find((c) => c.type === "childrenContainer")
      const parentContainer = container.find((c) => c.type === "parentContainer")
      if (riskContainer) {
        const p0x = this.focus.getFinalX() + this.focus.config.maxWidth / 2
        const p0y = this.focus.getFinalY()
        // this.canvas.circle(5).center(p0x, p0y).fill("#f75")

        const p1x = this.assginedNode.getFinalX() - this.focus.config.minWidth / 2
        const p1y = this.assginedNode.getFinalY()
        // this.canvas.circle(5).center(p1x, p1y).fill("#76f")

        // has container
        if (risks.length > this.config.riskLimitContainer) {
          const p2x = riskContainer.cx
          const p2y = riskContainer.cy - riskContainer.h / 2
          // this.canvas.circle(5).center(p2x, p2y).fill("#18f")

          const p3x = p2x
          const p3y = p1y
          // this.canvas.circle(5).center(p3x, p3y).fill("#8ff")

          riskContainer.fromPoint = { x: p2x, y: p2y }
          riskContainer.toPoint = { x: p3x, y: p3y }
        }
      }

      if (childrenContainer) {
        // remove edges
        console.log()
        this.edges = this.edges.filter((e) => e.toNode.getId() !== this.focus.getId())


        const p0x = this.focus.getFinalX()
        const p0y = this.focus.getFinalY() + this.focus.config.maxHeight / 2
        // this.canvas.circle(5).center(p0x, p0y).fill("#f75")


        const containerSpacing = 8 * 2 // TODO:
        const p1x = this.focus.getFinalX()
        const p1y = this.children[0].getFinalY() - this.children[0].config.minHeight / 2 - containerSpacing
        // this.canvas.circle(5).center(p1x, p1y).fill("#76f")

        childrenContainer.setColor("#aaa")
        childrenContainer.fromPoint = { x: p1x, y: p1y }
        childrenContainer.toPoint = { x: p0x, y: p0y }
      }

      if (parentContainer) {
        console.log("parentContainer")
        this.edges = this.edges.filter((e) => e.fromNode.getId() !== this.focus.getId())

        const p0x = this.focus.getFinalX()
        const p0y = this.focus.getFinalY() - this.focus.config.maxHeight / 2

        const containerSpacing = 8 * 2 // TODO:
        const p1x = this.focus.getFinalX()
        const maxY = Math.max(...this.parents.map((p) => p.getFinalY()))
        const p1y = maxY + this.parents[0].config.minHeight / 2 + containerSpacing

        parentContainer.setColor("#aaa")
        parentContainer.fromPoint = { x: p0x, y: p0y }
        parentContainer.toPoint = { x: p1x, y: p1y }
      }


      // has no container
    }


    calculateFocusPosition()
    calculateAssignedPosition()
    calculateParentChildRiskPositions(this.parents, "parent")
    calculateParentChildRiskPositions(this.children, "child")
    calculateParentChildRiskPositions(this.risks, "risk")
    calculateParentChildEdges(this.edges)
    calculateContainers(this.risks, this.children, this.parents)
    calculateContainerEdges(this.risks, this.containers)
  }


  renderLayout() {
    this.centerX = this.config.maxLayoutWidth / 2
    this.centerY = this.config.maxLayoutHeight / 2

    const X = this.focus.getFinalX()
    const Y = this.focus.getFinalY()

    // render nodes
    this.nodes.forEach((node) => {
      if (node.nodeSize === "max") {
        if (node.svg === null) node.renderAsMax(X, Y)
      } else if (node.nodeSize === "min") {
        if (node.svg === null) node.renderAsMin(X, Y)
      }

      node.transformToFinalPosition()
    })

    // render containers
    this.containers.forEach((container) => {
      container.render(X, Y)
      container.transform()
    })


    this.edges.forEach((edge) => {
      if (edge.svg === null) {
        edge.render(X, Y)
      }
      edge.transformToFinalPosition()
    })
  }
}


export default ContextualLayout
