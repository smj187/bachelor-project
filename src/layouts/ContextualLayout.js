import BaseLayout from "./BaseLayout"
import ContextualContainer from "./helpers/ContextualContainer"
import GridExpander from "./helpers/GridExpander"
import ContextualAssigned from "./helpers/ContextualAssigned"
import ContextualContainerConnection from "./helpers/ContextualContainerConnection"
import ContextualLayoutConfiguration from "../configuration/ContextualLayoutConfiguration"
import Colorshift from "../utils/Colorshift"


/**
 * This class calculates and renders the contextual layout.
 */
class ContextualLayout extends BaseLayout {
  constructor(customConfig = {}) {
    super()

    if (customConfig.focus === undefined) {
      throw new Error("No Focus element reference id provided")
    }

    this.config = { ...ContextualLayoutConfiguration, ...customConfig }
    this.focusId = customConfig.focus

    // layout specific
    this.focus = null
    this.parents = []
    this.children = []
    this.assgined = null
    this.risks = []

    this.containers = []
    this.expanders = []
    this.connections = []
  }

  calculateLayout(offset = 0) {
    // calculate focus position
    const calculateFocusPosition = () => {
      const w = this.focus.getMaxWidth()

      this.focus.setFinalX(w + offset + this.config.translateX)
      this.focus.setFinalY(this.config.maxLayoutHeight / 2)
    }

    // caculate assgined node position
    const calculateAssignedPosition = () => {
      if (this.assgined === null) {
        return
      }

      this.assgined.setFinalX(this.focus.getFinalX() + this.config.assignedFocusDistance)
      this.assgined.setFinalY(this.config.maxLayoutHeight / 2)
    }

    const calculateChildPositions = () => {
      if (this.children.length === 0) {
        return
      }

      const children = this.children.slice(0, this.config.childContainerNodeLimit)


      const cols = this.config.childContainerColumns
      let nodeIndex = 0
      const nodeCols = []
      const nodeRows = []

      // divide children into sets of rows
      for (let i = 0; i < children.length; i += 1) {
        const row = []
        for (let j = 0; j < cols; j += 1) {
          const node = children[nodeIndex]
          if (node !== undefined) {
            row.push(node)
            nodeIndex += 1
          }
        }
        if (row.length) {
          nodeRows.push(row)
        }
      }

      // divide children into sets of columns
      nodeIndex = 0
      for (let i = 0; i < cols; i += 1) {
        nodeCols.push([])
      }
      children.forEach((node, i) => {
        const col = nodeCols[i % cols]
        col.push(node)
      })


      const X = 0
      const Y = this.focus.getFinalY()
        + this.focus.getMaxHeight() / 2
        + this.config.childrenFocusDistance
        + this.config.spacing * 2


      // calculate initial position
      children.forEach((node) => {
        const w = node.getMinWidth()
        const h = node.getMinHeight()
        const x = this.config.spacing + X + w / 2
        const y = this.config.spacing + Y + h / 2
        node.setFinalX(x)
        node.setFinalY(y)
      })


      // find row spacing
      let rowSpacing = 0
      nodeRows.forEach((row) => {
        const h = row.map((n) => n.getMinHeight())
        const max = Math.max(...h)
        rowSpacing = Math.max(rowSpacing, max)
      })

      // calculate y positions
      nodeRows.forEach((row, i) => {
        if (i >= 1) {
          row.forEach((n) => {
            const h = (rowSpacing + this.config.spacing) * i
            n.setFinalY(n.getFinalY() + h)
          })
        }
      })


      // find col spacing
      let columnSpacing = 0
      nodeRows.forEach((row) => {
        const w = row.map((n) => n.getMinWidth())
        const max = Math.max(...w)
        columnSpacing = Math.max(columnSpacing, max)
      })

      // calculate x positions
      nodeCols.forEach((column, i) => {
        if (i >= 1) {
          column.forEach((n) => {
            const w = (columnSpacing + this.config.spacing) * i
            n.setFinalX(n.getFinalX() + w)
          })
        }
      })


      // calculate container


      // top left
      let x0 = Math.min(...children.map((n) => {
        const w = n.getMinWidth()
        return n.getFinalX() - w / 2 - this.config.spacing / 1
      }))

      let y0 = Math.min(...children.map((n) => {
        const h = n.getMinHeight()
        return n.getFinalY() - h / 2 - this.config.spacing / 1
      }))


      // top right
      let x1 = Math.max(...children.map((n) => {
        const w = n.getMinWidth()
        return n.getFinalX() + w / 2 + this.config.spacing / 1
      }))

      const y1 = y0


      // store layout width and height info
      const calculateDistance = (sx, sy, tx, ty) => {
        const dx = tx - sx
        const dy = ty - sy
        return Math.sqrt(dx * dx + dy * dy)
      }


      // adjust X position
      const adjustment = this.focus.getFinalX() - (x0 + x1) / 2
      children.forEach((node) => {
        node.setFinalX(node.getFinalX() + adjustment)
      })


      // bottom right
      let x2 = x1
      const y2 = Math.max(...children.map((n) => {
        const h = n.getMinHeight()
        return n.getFinalY() + h / 2 + this.config.spacing / 1
      }))


      // bottom left
      let x3 = x0
      const y3 = y2

      let cx = (x0 + x2) / 2
      const cy = (y0 + y2) / 2


      x0 += adjustment
      x1 += adjustment
      x2 += adjustment
      x3 += adjustment
      cx += adjustment


      // this.canvas.circle(5).fill("#000").center(x0, y0)
      // this.canvas.circle(5).fill("#75f").center(x1, y1)
      // this.canvas.circle(5).fill("#f75").center(x2, y2)
      // this.canvas.circle(5).fill("#00f").center(x3, y3)
      // this.canvas.circle(5).fill("#1f1").center(cx, cy)


      if (children.length <= this.config.childContainerColumns) {
        return
      }

      const w = calculateDistance(x0, y0, x1, y1)
      const h = calculateDistance(x1, y1, x2, y2)

      const ix = this.focus.getFinalX()
      const iy = this.focus.getFinalY()
      const existingContainer = this.containers.find((c) => c.type === "child") || null

      const container = existingContainer === null
        ? new ContextualContainer(this.canvas, "child", this.config, ix, iy, cx, cy, w, h)
        : existingContainer

      if (existingContainer === null) {
        this.containers.push(container)
      } else {
        container.h = h
        container.w = w
        container.cx = cx
        container.cy = cy
      }

      // calculate expander
      if (this.children.length > this.config.childContainerNodeLimit) {
        const expander = this.expanders.find((e) => e.type === "childExpander") || null

        if (expander === null) {
          const newExpander = new GridExpander(this.canvas, "childExpander")
          this.expanders.push(newExpander)
          x0 += this.config.spacing
          y0 -= this.config.spacing * 1.5
          const expanderTextColor = `#${Colorshift(this.config.childContainerBorderStrokeColor.substr(1), -50)}`
          newExpander.updateConfig({ expanderTextColor })

          newExpander.setFinalX(x0)
          newExpander.setFinalY(y0)
        } else {
          x0 += this.config.spacing
          y0 -= this.config.spacing * 1.5
          expander.setFinalY(y0)
        }
      } else {
        const expander = this.expanders.find((e) => e.type === "childExpander") || null
        if (expander !== null) {
          x0 += this.config.spacing
          y0 -= this.config.spacing * 1.5
          expander.setFinalY(y0)
        }
      }
    }

    const calculateParentPositions = () => {
      if (this.parents.length === 0) {
        return
      }


      const parents = this.parents.slice(0, this.config.parentContainerNodeLimit)


      const cols = this.config.childContainerColumns
      let nodeIndex = 0
      const nodeCols = []
      const nodeRows = []

      // divide parents into sets of rows
      for (let i = 0; i < parents.length; i += 1) {
        const row = []
        for (let j = 0; j < cols; j += 1) {
          const node = parents[nodeIndex]
          if (node !== undefined) {
            row.push(node)
            nodeIndex += 1
          }
        }
        if (row.length) {
          nodeRows.push(row)
        }
      }

      // divide parents into sets of columns
      nodeIndex = 0
      for (let i = 0; i < cols; i += 1) {
        nodeCols.push([])
      }
      parents.forEach((node, i) => {
        const col = nodeCols[i % cols]
        col.push(node)
      })


      const X = 0


      // calculate initial position
      parents.forEach((node) => {
        const x = this.config.spacing + X + node.getMinWidth() / 2
        const y = this.focus.getFinalY()
          - this.focus.getMaxHeight() / 2
          - this.config.parentFocusDistance
          - this.config.spacing * 3
          - node.getMinHeight() / 2

        node.setFinalX(x)
        node.setFinalY(y)
      })


      // find row spacing
      let rowSpacing = 0
      nodeRows.forEach((row) => {
        const h = row.map((n) => n.getMinHeight())
        const max = Math.max(...h)
        rowSpacing = Math.max(rowSpacing, max)
      })

      // calculate y positions
      nodeRows.forEach((row, i) => {
        if (i >= 1) {
          row.forEach((n) => {
            const h = (rowSpacing + this.config.spacing) * i
            n.setFinalY(n.getFinalY() - h) // TODO: diff
          })
        }
      })


      // find col spacing
      let columnSpacing = 0
      nodeRows.forEach((row) => {
        const w = row.map((n) => n.getMinWidth())
        const max = Math.max(...w)
        columnSpacing = Math.max(columnSpacing, max)
      })

      // calculate x positions
      nodeCols.forEach((column, i) => {
        if (i >= 1) {
          column.forEach((n) => {
            const w = (columnSpacing + this.config.spacing) * i
            n.setFinalX(n.getFinalX() + w)
          })
        }
      })


      // calculate container


      // top left
      let x0 = Math.min(...parents.map((n) => {
        const w = n.getMinWidth()
        return n.getFinalX() - w / 2 - this.config.spacing / 1
      }))

      const y0 = Math.min(...parents.map((n) => {
        const h = n.getMinHeight()
        return n.getFinalY() - h / 2 - this.config.spacing / 1
      }))


      // top right
      let x1 = Math.max(...parents.map((n) => {
        const w = n.getMinWidth()
        return n.getFinalX() + w / 2 + this.config.spacing / 1
      }))

      const y1 = y0


      // store layout width and height info
      const calculateDistance = (sx, sy, tx, ty) => {
        const dx = tx - sx
        const dy = ty - sy
        return Math.sqrt(dx * dx + dy * dy)
      }


      // adjust X position
      const adjustment = this.focus.getFinalX() - (x0 + x1) / 2
      parents.forEach((node) => {
        node.setFinalX(node.getFinalX() + adjustment)
      })


      // bottom right
      let x2 = x1
      const y2 = Math.max(...parents.map((n) => {
        const h = n.getMinHeight()
        return n.getFinalY() + h / 2 + this.config.spacing / 1
      }))


      // bottom left
      let x3 = x0
      let y3 = y2

      let cx = (x0 + x2) / 2
      const cy = (y0 + y2) / 2


      x0 += adjustment
      x1 += adjustment
      x2 += adjustment
      x3 += adjustment
      cx += adjustment


      // this.canvas.circle(5).fill("#000").center(x0, y0)
      // this.canvas.circle(5).fill("#75f").center(x1, y1)
      // this.canvas.circle(5).fill("#f75").center(x2, y2)
      // this.canvas.circle(5).fill("#00f").center(x3, y3)
      // this.canvas.circle(5).fill("#1f1").center(cx, cy)

      if (parents.length <= this.config.parentContainerColumns) {
        return
      }

      const w = calculateDistance(x0, y0, x1, y1)
      const h = calculateDistance(x1, y1, x2, y2)

      const ix = this.focus.getFinalX()
      const iy = this.focus.getFinalY()
      const existingContainer = this.containers.find((c) => c.type === "parent") || null

      const container = existingContainer === null
        ? new ContextualContainer(this.canvas, "parent", this.config, ix, iy, cx, cy, w, h)
        : existingContainer


      if (existingContainer === null) {
        this.containers.push(container)
      } else {
        const dy = container.h - h < 0 ? container.h - h : (h - container.h) * -1

        container.dy = dy
        container.h = h
        container.w = w
        container.cx = cx
        container.cy = cy
      }


      // calculate expander
      if (this.parents.length > this.config.parentContainerNodeLimit) {
        const expander = this.expanders.find((e) => e.type === "parentExpander") || null

        if (expander === null) {
          const newExpander = new GridExpander(this.canvas, "parentExpander")
          this.expanders.push(newExpander)
          x3 += this.config.spacing
          y3 += this.config.spacing * 1.5
          const expanderTextColor = `#${Colorshift(this.config.parentContainerBorderStrokeColor.substr(1), -50)}`
          newExpander.updateConfig({ expanderTextColor })

          newExpander.setFinalX(x3)
          newExpander.setFinalY(y3)
        } else {
          x3 += this.config.spacing
          y3 += this.config.spacing * 1.5
          expander.setFinalY(y3)
        }
      } else {
        const expander = this.expanders.find((e) => e.type === "parentExpander") || null
        if (expander !== null) {
          x3 += this.config.spacing
          y3 += this.config.spacing * 1.5
          expander.setFinalY(y3)
        }
      }
    }

    const calculateRiskPositions = () => {
      if (this.risks.length === 0) {
        return
      }

      const risks = this.risks.slice(0, this.config.riskContainerNodeLimit)


      const cols = this.config.riskContainerColumns

      let nodeIndex = 0
      const nodeCols = []
      const nodeRows = []

      // divide risks into sets of rows
      for (let i = 0; i < risks.length; i += 1) {
        const row = []
        for (let j = 0; j < cols; j += 1) {
          const node = risks[nodeIndex]
          if (node !== undefined) {
            row.push(node)
            nodeIndex += 1
          }
        }
        if (row.length) {
          nodeRows.push(row)
        }
      }


      // divide risks into sets of columns
      nodeIndex = 0
      for (let i = 0; i < cols; i += 1) {
        nodeCols.push([])
      }
      risks.forEach((node, i) => {
        const col = nodeCols[i % cols]
        col.push(node)
      })


      const X = 0
      const Y = this.focus.getFinalY()
        // + this.focus.getMaxHeight() / 2
        // + this.config.riskFocusDistance
        + 50
        + this.config.spacing


      // calculate initial position
      risks.forEach((node) => {
        const w = node.getMinWidth()
        const h = node.getMinHeight()
        const x = this.config.spacing + X + w / 2
        const y = this.config.spacing + Y + h / 2
        node.setFinalX(x)
        node.setFinalY(y)
      })


      // find row spacing
      let rowSpacing = 0
      nodeRows.forEach((row) => {
        const h = row.map((n) => n.getMinHeight())
        const max = Math.max(...h)
        rowSpacing = Math.max(rowSpacing, max)
      })

      // calculate y positions
      nodeRows.forEach((row, i) => {
        if (i >= 1) {
          row.forEach((n) => {
            const h = (rowSpacing + this.config.spacing) * i
            n.setFinalY(n.getFinalY() + h)
          })
        }
      })


      // find col spacing
      let columnSpacing = 0
      nodeRows.forEach((row) => {
        const w = row.map((n) => n.getMinWidth())
        const max = Math.max(...w)
        columnSpacing = Math.max(columnSpacing, max)
      })

      // calculate x positions
      nodeCols.forEach((column, i) => {
        if (i >= 1) {
          column.forEach((n) => {
            const w = (columnSpacing + this.config.spacing) * i
            n.setFinalX(n.getFinalX() + w)
          })
        }
      })


      // calculate container


      // top left
      let x0 = Math.min(...risks.map((n) => {
        const w = n.getMinWidth()
        return n.getFinalX() - w / 2 - this.config.spacing / 1
      }))

      let y0 = Math.min(...risks.map((n) => {
        const h = n.getMinHeight()
        return n.getFinalY() - h / 2 - this.config.spacing / 1
      }))


      // top right
      let x1 = Math.max(...risks.map((n) => {
        const w = n.getMinWidth()
        return n.getFinalX() + w / 2 + this.config.spacing / 1
      }))

      const y1 = y0


      // store layout width and height info
      const calculateDistance = (sx, sy, tx, ty) => {
        const dx = tx - sx
        const dy = ty - sy
        return Math.sqrt(dx * dx + dy * dy)
      }


      // adjust X position
      const adjustment = this.focus.getFinalX() - (x0 + x1) / 2 + this.config.riskFocusDistance
      risks.forEach((node) => {
        node.setFinalX(node.getFinalX() + adjustment)
      })


      // bottom right
      let x2 = x1
      const y2 = Math.max(...risks.map((n) => {
        const h = n.getMinHeight()
        return n.getFinalY() + h / 2 + this.config.spacing / 1
      }))


      // bottom left
      let x3 = x0
      const y3 = y2

      let cx = (x0 + x2) / 2
      const cy = (y0 + y2) / 2


      x0 += adjustment
      x1 += adjustment
      x2 += adjustment
      x3 += adjustment
      cx += adjustment


      // this.canvas.circle(5).fill("#000").center(x0, y0)
      // this.canvas.circle(5).fill("#75f").center(x1, y1)
      // this.canvas.circle(5).fill("#f75").center(x2, y2)
      // this.canvas.circle(5).fill("#00f").center(x3, y3)
      // this.canvas.circle(5).fill("#1f1").center(cx, cy)


      if (risks.length <= this.config.riskContainerColumns) {
        return
      }

      const w = calculateDistance(x0, y0, x1, y1)
      const h = calculateDistance(x1, y1, x2, y2)

      const ix = this.focus.getFinalX()
      const iy = this.focus.getFinalY()
      const existingContainer = this.containers.find((c) => c.type === "risk") || null

      const container = existingContainer === null
        ? new ContextualContainer(this.canvas, "risk", this.config, ix, iy, cx, cy, w, h)
        : existingContainer

      if (existingContainer === null) {
        this.containers.push(container)
      } else {
        container.h = h
        container.w = w
        container.cx = cx
        container.cy = cy
      }


      // calculate expander
      if (this.risks.length > this.config.riskContainerNodeLimit) {
        const expander = this.expanders.find((e) => e.type === "riskExpander") || null

        if (expander === null) {
          const newExpander = new GridExpander(this.canvas, "riskExpander")
          this.expanders.push(newExpander)
          x0 += this.config.spacing
          y0 -= this.config.spacing * 1
          const expanderTextColor = `#${Colorshift(this.config.riskContainerBorderStrokeColor.substr(1), -50)}`
          newExpander.updateConfig({ expanderTextColor })

          newExpander.setFinalX(x0)
          newExpander.setFinalY(y0)
        } else {
          x0 += this.config.spacing
          y0 -= this.config.spacing * 1
          expander.setFinalY(y0)
        }
      } else {
        const expander = this.expanders.find((e) => e.type === "riskExpander") || null
        if (expander !== null) {
          x0 += this.config.spacing
          y0 -= this.config.spacing * 1
          expander.setFinalY(y0)
        }
      }
    }


    const calculateParentEdges = () => {
      if (this.parents.length > this.config.parentContainerColumns) {
        this.parentEdges = []
        const con = this.containers.find((c) => c.type === "parent")
        const tx = con.finalX
        const ty = con.finalY + con.h / 2 + 4
        const fx = this.focus.getFinalX()
        const fy = this.focus.getFinalY() - this.focus.getMaxHeight() / 2 - 4

        const ix = this.focus.getFinalX()
        const iy = this.focus.getFinalY()

        const color2 = this.parents.map((p) => p.config.borderStrokeColor)

        const mostCommon = (array) => {
          if (array.length == 0) return null
          const modeMap = {}
          let maxEl = array[0]; let
            maxCount = 1
          for (let i = 0; i < array.length; i++) {
            const el = array[i]
            if (modeMap[el] == null) modeMap[el] = 1
            else { modeMap[el]++ }
            if (modeMap[el] > maxCount) {
              maxEl = el
              maxCount = modeMap[el]
            }
          }
          return maxEl
        }
        const color1 = this.focus.config.borderStrokeColor
        this.connections.push(new ContextualContainerConnection(this.canvas, ix, iy, fx, fy, tx, ty, color1, mostCommon(color2), 100))
      }

      this.parentEdges.forEach((edge) => {
        edge.calculateEdge({ isContextualParent: true })
      })
    }

    const calculateChildEdges = () => {
      if (this.children.length > this.config.childContainerColumns) {
        this.childEdges = []
        const con = this.containers.find((c) => c.type === "child")
        const fx = con.finalX
        const fy = con.finalY - con.h / 2 - 4
        const tx = this.focus.getFinalX()
        const ty = this.focus.getFinalY() + this.focus.getMaxHeight() / 2 + 4

        const ix = this.focus.getFinalX()
        const iy = this.focus.getFinalY()


        const color2 = this.children.map((p) => p.config.borderStrokeColor)

        const mostCommon = (array) => {
          if (array.length == 0) return null
          const modeMap = {}
          let maxEl = array[0]; let
            maxCount = 1
          for (let i = 0; i < array.length; i++) {
            const el = array[i]
            if (modeMap[el] == null) modeMap[el] = 1
            else { modeMap[el]++ }
            if (modeMap[el] > maxCount) {
              maxEl = el
              maxCount = modeMap[el]
            }
          }
          return maxEl
        }
        const color1 = this.focus.config.borderStrokeColor
        this.connections.push(new ContextualContainerConnection(this.canvas, ix, iy, fx, fy, tx, ty, color1, mostCommon(color2), -100))
      }

      this.childEdges.forEach((edge) => {
        edge.calculateEdge({ isContextualChild: true })
      })
    }

    const calculateFocusAssginedEdge = () => {
      if (this.assgined === null) {
        return
      }

      const fx = this.focus.getFinalX() + this.focus.getMaxWidth() / 2 + 4
      const fy = this.focus.getFinalY()
      const tx = this.assgined.getFinalX() - this.focus.getMinWidth() / 2 - 4
      const ty = this.assgined.getFinalY()

      const ix = this.focus.getFinalX()
      const iy = this.focus.getFinalY()

      const dx = this.focus.getFinalX() + this.config.riskFocusDistance
      const dy = (fy + ty) / 2


      const rx = this.focus.getFinalX() + this.config.riskFocusDistance
      let ry = this.focus.getFinalY() + 50 + this.config.spacing - 4

      if (this.containers.find((c) => c.type === "risk") === undefined) {
        ry += this.config.spacing / 2
      }

      this.connections.push(new ContextualAssigned(this.canvas, ix, iy, fx, fy, tx, ty, dx, dy, rx, ry))
    }

    const calculateLayoutInfo = () => {
      const nodes = [
        ...this.parents.slice(0, this.config.parentContainerNodeLimit),
        ...this.children.slice(0, this.config.childContainerNodeLimit),
        ...this.risks.slice(0, this.config.riskContainerNodeLimit),
        this.assgined,
      ]


      let x0 = Math.min(...nodes.map((n) => {
        const w = n.getMinWidth()
        return n.getFinalX() - w / 2 - this.config.spacing * 2
      }))

      if (this.parents.length === 0 && this.children.length === 0) {
        x0 = this.focus.getFinalX() - this.focus.getMaxWidth() / 2 - this.config.spacing * 2
      }

      const y0 = 0
      // this.canvas.circle(5).fill("#f75").center(x0, y0)


      // top right
      let x1 = Math.max(...nodes.map((n) => {
        const w = n.getMinWidth()
        return n.getFinalX() + w / 2 + this.config.spacing / 2
      }))

      if (this.parents.length === 0 && this.children.length === 0) {
        x1 = this.focus.getFinalX() + this.focus.getMaxWidth() / 2 + this.config.spacing * 2
      }

      const y1 = y0
      // this.canvas.circle(5).fill("#75f").center(x1, y1)


      // bottom right
      const x2 = x1
      const y2 = Math.max(...this.nodes.map((n) => {
        const h = n.getMinHeight()
        return n.getFinalY() + h / 2 + this.config.spacing / 2
      }))

      if (this.risks.length === 0 && this.children.length === 0) {
        y2 = this.focus.getFinalY() + this.focus.getMaxHeight() / 2 + this.config.spacing * 2
      }
      // this.canvas.circle(5).fill("#f75").center(x2, y2)


      // bottom left
      const x3 = x0
      const y3 = y2
      // this.canvas.circle(5).fill("#000").center(x3, y3)


      const cx = (x0 + x2) / 2
      const cy = (y0 + y2) / 2
      // this.canvas.circle(5).fill("#1f1").center(cx, cy)

      // store layout width and height info
      const calculateDistance = (sx, sy, tx, ty) => {
        const dx = tx - sx
        const dy = ty - sy
        return Math.sqrt(dx * dx + dy * dy)
      }


      this.layoutInfo = {
        x: x0,
        y: y0,
        cx: (x0 + x2) / 2,
        cy: (y0 + y2) / 2,
        w: calculateDistance(x0, y0, x1, y1),
        h: calculateDistance(x1, y1, x2, y2),
      }
    }


    calculateFocusPosition()
    calculateAssignedPosition()

    calculateChildPositions()
    calculateParentPositions()
    calculateRiskPositions()

    calculateParentEdges()
    calculateChildEdges()
    calculateFocusAssginedEdge()

    calculateLayoutInfo()


    return this.layoutInfo
  }


  renderLayout() {
    this.centerX = this.config.maxLayoutWidth / 2
    this.centerY = this.config.maxLayoutHeight / 2

    const X = this.focus.getFinalX()
    const Y = this.focus.getFinalY()

    const renderContainers = () => {
      this.containers.forEach((container) => {
        if (container.isRendered() === false) {
          container.render()
        }

        if (container.isRendered() === true) {
          container.transformToFinalPosition()
        }
      })
    }

    const renderExpanders = () => {
      this.expanders.forEach((expander) => {
        if (expander.type === "childExpander" && expander.isRendered() === false) {
          const reRenderFunc = () => {
            if (this.config.cachedChildNodeLimit === undefined) {
              this.config = {
                ...this.config,
                cachedChildNodeLimit: this.config.childContainerNodeLimit,
                childContainerNodeLimit: this.children.length,
              }

              this.calculateLayout()
              const childExpander = this.expanders.find((e) => e.type === "childExpander")
              childExpander.transformToFinalPosition()
              this.containers.find((c) => c.type === "child").update()

              const notRenderedNodes = this.children.filter((n) => n.isRendered() === false)
              notRenderedNodes.forEach((child) => {
                child.renderAsMin(child.getFinalX(), child.getFinalY())
              })

              expander.changeToShowMoreText()
            } else {
              this.config = {
                ...this.config,
                cachedChildNodeLimit: this.config.childContainerNodeLimit,
                childContainerNodeLimit: this.config.cachedChildNodeLimit,
              }
              delete this.config.cachedChildNodeLimit

              this.calculateLayout()
              const childExpander = this.expanders.find((e) => e.type === "childExpander")
              childExpander.transformToFinalPosition()
              this.containers.find((c) => c.type === "child").update()

              const nodesToHide = this.children.filter((c, i) => i >= this.config.childContainerNodeLimit)
              nodesToHide.forEach((node) => {
                node.removeNode(null, null, { animation: false })
              })


              expander.changeToHideMoreText()
            }
          }
          expander.setReRenderFunc(reRenderFunc)
          expander.render(X, Y)
          expander.transformToFinalPosition()
        }

        if (expander.type === "parentExpander" && expander.isRendered() === false) {
          const reRenderFunc = () => {
            if (this.config.cachedParentContainerNodeLimit === undefined) {
              this.config = {
                ...this.config,
                cachedParentContainerNodeLimit: this.config.parentContainerNodeLimit,
                parentContainerNodeLimit: this.parents.length,
              }

              this.calculateLayout()
              const childExpander = this.expanders.find((e) => e.type === "parentExpander")
              childExpander.transformToFinalPosition()
              this.containers.find((c) => c.type === "parent").update()

              const notRenderedNodes = this.parents.filter((n) => n.isRendered() === false)
              notRenderedNodes.forEach((child) => {
                child.renderAsMin(child.getFinalX(), child.getFinalY())
              })

              expander.changeToShowMoreText()
            } else {
              this.config = {
                ...this.config,
                cachedParentContainerNodeLimit: this.config.parentContainerNodeLimit,
                parentContainerNodeLimit: this.config.cachedParentContainerNodeLimit,
              }
              delete this.config.cachedParentContainerNodeLimit

              this.calculateLayout()
              const childExpander = this.expanders.find((e) => e.type === "parentExpander")
              childExpander.transformToFinalPosition()
              this.containers.find((c) => c.type === "parent").update()

              const nodesToHide = this.parents.filter((c, i) => i >= this.config.parentContainerNodeLimit)
              nodesToHide.forEach((node) => {
                node.removeNode(null, null, { animation: false })
              })


              expander.changeToHideMoreText()
            }
          }
          expander.setReRenderFunc(reRenderFunc)
          expander.render(X, Y)
          expander.transformToFinalPosition()
        }

        if (expander.type === "riskExpander" && expander.isRendered() === false) {
          const reRenderFunc = () => {
            if (this.config.cachedRiskContainerNodeLimit === undefined) {
              this.config = {
                ...this.config,
                cachedRiskContainerNodeLimit: this.config.riskContainerNodeLimit,
                riskContainerNodeLimit: this.risks.length,
              }

              this.calculateLayout()
              const childExpander = this.expanders.find((e) => e.type === "riskExpander")
              childExpander.transformToFinalPosition()
              this.containers.find((c) => c.type === "risk").update()

              const notRenderedNodes = this.risks.filter((n) => n.isRendered() === false)
              notRenderedNodes.forEach((child) => {
                // console.log(child.getFinalX(), child.getFinalY())
                child.renderAsMin(child.getFinalX(), child.getFinalY())
              })

              expander.changeToShowMoreText()
            } else {
              this.config = {
                ...this.config,
                cachedRiskContainerNodeLimit: this.config.riskContainerNodeLimit,
                riskContainerNodeLimit: this.config.cachedRiskContainerNodeLimit,
              }
              delete this.config.cachedRiskContainerNodeLimit

              this.calculateLayout()
              const childExpander = this.expanders.find((e) => e.type === "riskExpander")
              childExpander.transformToFinalPosition()
              this.containers.find((c) => c.type === "risk").update()

              const nodesToHide = this.risks.filter((c, i) => i >= this.config.riskContainerNodeLimit)
              nodesToHide.forEach((node) => {
                node.removeNode(null, null, { animation: false })
              })


              expander.changeToHideMoreText()
            }
          }
          expander.setReRenderFunc(reRenderFunc)
          expander.render(X, Y)
          expander.transformToFinalPosition()
        }
      })
    }

    const renderConnections = () => {
      this.connections.forEach((connection) => {
        if (connection.isRendered() === false) {
          connection.render()
        }
        if (connection.isRendered() === true) {
          connection.transformToFinalPosition()
        }
      })
    }

    const makeFocus = async (node) => {
      // remove event

      node.svg.off("click")

      // close expander (if open)
      if (this.config.cachedChildNodeLimit !== undefined) {
        this.config = {
          ...this.config,
          cachedChildNodeLimit: this.config.childContainerNodeLimit,
          childContainerNodeLimit: this.config.cachedChildNodeLimit,
        }
        delete this.config.cachedChildNodeLimit
      }
      if (this.config.cachedParentContainerNodeLimit !== undefined) {
        this.config = {
          ...this.config,
          cachedParentContainerNodeLimit: this.config.parentContainerNodeLimit,
          parentContainerNodeLimit: this.config.cachedParentContainerNodeLimit,
        }
        delete this.config.cachedParentContainerNodeLimit
      }

      if (this.config.cachedRiskContainerNodeLimit !== undefined) {
        this.config = {
          ...this.config,
          cachedRiskContainerNodeLimit: this.config.riskContainerNodeLimit,
          riskContainerNodeLimit: this.config.cachedRiskContainerNodeLimit,
        }
        delete this.config.cachedRiskContainerNodeLimit
      }


      // remove nodes
      const nodesToRemove = this.nodes.filter((n) => {
        if (n.id === node.id) {
          return false
        }
        // if (n.id === this.focus.id) {
        //   return false
        // }
        return true
      })

      nodesToRemove.forEach((nodeToRemove) => {
        nodeToRemove.removeNode(nodeToRemove.getFinalX(), nodeToRemove.getFinalY() + 100, { opacity: 0 })
      })
      this.assgined = null
      this.risks = []
      this.parents = []
      this.children = []

      // remove other stuff
      this.containers.forEach((container) => {
        container.removeContainer(container.getFinalX(), container.getFinalY() + 100)
      })
      this.containers = []

      this.expanders.forEach((expander) => {
        expander.removeNode()
      })
      this.expanders = []

      this.connections.forEach((connection) => {
        connection.removeConnection()
      })
      this.connections = []

      // remove edges
      this.parentEdges.forEach((edge) => {
        edge.removeEdge()
      })
      this.parentEdges = []
      this.childEdges.forEach((edge) => {
        edge.removeEdge()
      })
      this.childEdges = []

      // console.log(this.focus)
      this.nodes = this.nodes.filter((n) => n.id === node.id)
      this.edges = []


      const fx = this.focus.getFinalX()
      const fy = this.focus.getFinalY()
      node.transformToMax(fx, fy)
      node.transformToFinalPosition(fx, fy)
      this.focus.transformToMin()

      this.focus = node
      await this.loadAdditionalContextualDataAsync()
    }


    const renderNodes = () => {
      if (this.assgined !== null) {
        if (this.assgined.isRendered() === false) {
          this.assgined.renderAsMin(X, Y)
        } else if (this.assgined.isRendered() === true) {
          this.assgined.transformToFinalPosition()
        }
      }


      if (this.focus.isRendered() === false) {
        this.focus.renderAsMax(X, Y)
      } else if (this.focus.isRendered() === true) {
        this.focus.transformToFinalPosition()
      }

      this.parents.forEach((parent, i) => {
        if (i < this.config.parentContainerNodeLimit) {
          if (parent.isRendered() === false) {
            parent.addEvent("click", () => makeFocus(parent))
            parent.renderAsMin(X, Y)
          } else if (parent.isRendered() === true) {
            parent.transformToFinalPosition()
          }
        }
      })

      this.children.forEach((child, i) => {
        if (i < this.config.childContainerNodeLimit) {
          if (child.isRendered() === false) {
            child.addEvent("click", () => makeFocus(child))
            child.renderAsMin(X, Y)
          } else if (child.isRendered() === true) {
            child.transformToFinalPosition()
          }
        }
      })

      this.risks.forEach((risk, i) => {
        if (i < this.config.riskContainerNodeLimit) {
          if (risk.isRendered() === false) {
            risk.renderAsMin(X, Y)
          } else if (risk.isRendered() === true) {
            risk.transformToFinalPosition()
          }
        }
      })
    }

    const renderEdges = () => {
      this.parentEdges.forEach((edge) => {
        if (edge.isRendered() === false) {
          edge.render(X, Y)
        } else if (edge.isRendered() === true) {
          edge.transformToFinalPosition()
        }
      })

      this.childEdges.forEach((edge) => {
        if (edge.isRendered() === false) {
          edge.render(X, Y)
        } else if (edge.isRendered() === true) {
          edge.transformToFinalPosition()
        }
      })
    }


    // rendering
    renderContainers()
    renderExpanders()
    renderConnections()
    renderNodes()
    renderEdges()


    // // render containers
    // this.containers.forEach((container) => {
    //   container.render(X, Y)
    //   container.transform()
    // })


    // this.edges.forEach((edge) => {
    //   if (edge.svg === null) {
    //     edge.render(X, Y)
    //   }
    //   edge.transformToFinalPosition()
    // })
  }
}


export default ContextualLayout
