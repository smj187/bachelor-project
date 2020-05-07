import { calculateArcLineIntersection } from "../../utils/Calculations"


class ContextualRiskConnection {
  constructor(canvas, riskNodes, riskContainer, focusNode, assginedNode, assignedNodeConnection, config) {
    this.canvas = canvas
    this.riskNodes = riskNodes || []
    this.riskContainer = riskContainer || null
    this.focusNode = focusNode
    this.assginedNode = assginedNode
    this.assignedNodeConnection = assignedNodeConnection || null
    this.config = config

    // layout info
    this.layoutId = 0
    this.finalX = 0
    this.finalY = 0
  }


  render({ isParentOperation = false }) {
    const svg = this.canvas.group()
    svg.id(`contextualRiskConnection#${this.layoutId}`)

    const nodes = this.riskNodes

    // calculate connections between start point and connection center

    // connection center
    const x0 = this.assignedNodeConnection.finalX
    const y0 = this.assignedNodeConnection.finalY - 50 / 2


    const x1 = this.focusNode.getFinalX()
    const y1 = this.focusNode.getFinalY() + this.config.riskConnectionLineWidth / 2

    const x2 = this.assginedNode.getFinalX()
    const y2 = this.assginedNode.getFinalY() + this.config.riskConnectionLineWidth / 2

    const initialConnections = []
    const finalConnections = []

    // we only want the top elements to have a connection
    const topElements = nodes.slice(0, this.config.riskContainerNodeLimit)

    // if risks are not within a container, create connections for each node in the grid layout
    if (this.riskContainer === null) {
      // calculate the initial starting connection
      topElements.forEach((node) => {
        const x3 = node.getInitialX()
        const y3 = node.getInitialY()

        if (isParentOperation) {
          initialConnections.push(`M${x0},${y0 - 50} L${x3},${y3}`)
        } else {
          initialConnections.push(`M${x0},${y0 + 50} L${x3},${y3}`)
        }
      })

      // calculate the final visible connection
      topElements.forEach((node) => {
        const { offset } = node.config
        const x3 = node.getFinalX()
        const y3 = node.getFinalY() - node.getMinHeight() / 2 - offset

        const lineIntersection = calculateArcLineIntersection(x0, y0, x3, y3, `M${x1},${y1} L${x2},${y2}`)
        finalConnections.push(`M ${lineIntersection.x} ${lineIntersection.y} L ${x3} ${y3}`)
      })
    } else {
      // or simply one big connection

      const x3 = this.riskContainer.containerInfo.mincx
      const y3 = this.riskContainer.containerInfo.mincy - this.riskContainer.containerInfo.minHeight / 2

      // just take the first offset
      const { offset } = nodes[0].config


      const lineIntersection = calculateArcLineIntersection(x0, y0, x3, y3, `M${x1},${y1} L${x2},${y2}`)


      if (isParentOperation) {
        initialConnections.push(`M${this.focusNode.getFinalX()},${this.focusNode.getFinalY()} L${lineIntersection.x},${lineIntersection.y - 50}`)
      } else {
        initialConnections.push(`M${this.focusNode.getFinalX()},${this.focusNode.getFinalY()} L${lineIntersection.x},${lineIntersection.y + 50}`)
      }
      finalConnections.push(`M${x3},${y3 - offset} L${lineIntersection.x},${lineIntersection.y}`)
    }


    // create SVG elements and animate into position
    const width = this.config.riskNodeConnectionStrokeWidth
    const color = this.config.riskNodeConnectionStrokeColor
    const dasharray = this.config.riskNodeConnectionStrokeDasharray

    for (let i = 0; i < initialConnections.length; i += 1) {
      const line = this.canvas.path(initialConnections[i]).stroke({ width, color, dasharray }).back().attr({ opacity: 0 })
      line.animate({ duration: this.config.animationSpeed }).plot(finalConnections[i]).attr({ opacity: 1 })
      svg.add(line)
    }


    this.svg = svg
  }


  transformToFinalPosition({ isParentOperation = false, X = this.node.finalX, Y = this.node.finalY }) {
    if (isParentOperation) {
      this.svg
        .animate({ duration: this.config.animationSpeed })
        .center(X, Y - 50)
    } else {
      this.svg
        .animate({ duration: this.config.animationSpeed })
        .center(X, Y + 50)
    }
  }

  /**
   * Removes the leaf node from the canvas and resets clears its SVG representation.
   */
  removeSVG() {
    if (this.isRendered()) {
      this.svg.remove()
      this.svg = null
    }
  }


  /**
   * Determins where the leaf is rendered or not.
   * @returns True, if the SVG is rendered, else false.
   */
  isRendered() {
    return this.svg !== null
  }

  setLayoutId(layoutId) {
    this.layoutId = layoutId
  }
}

export default ContextualRiskConnection
