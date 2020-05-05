import BaseLayout from "./BaseLayout"
import GridExpander from "./helpers/GridExpander"
import GridLayoutConfiguration from "../configuration/GridLayoutConfiguration"
import { calculateDistance } from "../utils/Calculations"


/**
 * This class calculates and renders the grid layout and tries to arrange its nodes in a column-row-based format.
 *
 * @param {Object} [customConfig={ }] Overrides default layout configuration properties.
 *                                    Available options: {@link GridLayoutConfiguration}
 * @param {Object} [customEvents={ }] Overrides event listener configuration properties.
 * @param {Object} [customNodes={ }] Overrides default node representation properties.
 *
 */
class GridLayout extends BaseLayout {
  constructor(customConfig = {}, customEventlisteners = [], customNodes = {}) {
    super(customNodes)

    this.config = { ...GridLayoutConfiguration, ...customConfig }

    // layout specific
    this.gridExpander = null
    this.isLayoutExpended = false


    // events
    this.events = [
      {
        event: "click",
        modifier: undefined,
        func: "expandOrCollapseEvent",
        defaultEvent: true,
      },
    ]
    customEventlisteners.forEach((event) => {
      this.registerEventListener(event.event, event.modifier, event.func)
    })
  }



  /**
   * Event method which either loads more data or removes existing data.
   * @async
   */
  async expandGridLayoutEvent() {
    if (this.isLayoutExpended === true) {
      // update the configuration to render all nodes provided by the initial graph
      this.config = { ...this.config, cachedLimit: this.config.limitNodes, limitNodes: this.nodeData.length }
    } else {
      // update the configuration to only render a limited amount of nodes
      this.config = { ...this.config, limitNodes: this.config.cachedLimit }
      delete this.config.cachedLimit


      // remove existing nodes
      const removedNodes = []
      this.nodes.forEach((node, i) => {
        if (i >= this.config.limitNodes && node.isRendered() === true) {
          node.removeSVG()
          removedNodes.push(node.getId())
        }
      })
      this.nodes = this.nodes.filter(node => !removedNodes.includes(node.getId()))
    }

    await this.updateGridDataAsync()
  }





  /**
   * Calculates the tree layout based on an underlying algorithm.
   *
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Number} [opts.offset=0] Determines the space the layout has to shift in order to avoid overlapping layouts.
   */
  calculateLayout({ offset = 0 }) {
    this.currentOffset = offset


    // slice not required nodes (this is only necessary for re-renderings)
    const limit = this.config.limitNodes ? this.config.limitNodes : this.nodeData.length
    this.nodes = this.nodes.slice(0, limit)


    // calculate the X and Y position for the grid layout
    const calculateFinalPosition = () => {





      // calculate columns and rows
      const cols = this.config.limitColumns
      let nodeIndex = 0
      const nodeCols = []
      const nodeRows = []

      // divide nodes into sets of rows
      for (let i = 0; i < this.nodes.length; i += 1) {
        const row = []
        for (let j = 0; j < cols; j += 1) {
          const node = this.nodes[nodeIndex]
          if (node !== undefined) {
            row.push(node)
            nodeIndex += 1
          }
        }
        if (row.length) {
          nodeRows.push(row)
        }
      }

      // divide nodes into sets of columns
      nodeIndex = 0
      for (let i = 0; i < cols; i += 1) {
        nodeCols.push([])
      }
      this.nodes.forEach((node, i) => {
        const col = nodeCols[i % cols]
        col.push(node)
      })

      // set initial position
      this.nodes.forEach((node) => {
        const w = this.config.renderingSize === "max" ? node.getMaxWidth() : node.getMinWidth()
        const h = this.config.renderingSize === "max" ? node.getMaxHeight() : node.getMinHeight()
        const x = this.config.hSpacing + w / 2
        const y = this.config.vSpacing + h / 2
        node.setFinalX(x)
        node.setFinalY(y)
      })

      // find row spacing
      let rowSpacing = 0
      nodeRows.forEach((row) => {
        const h = row.map((n) => (this.config.renderingSize === "max" ? n.getMaxHeight() : n.getMinHeight()))
        const max = Math.max(...h)
        rowSpacing = Math.max(rowSpacing, max)
      })

      // calculate y positions
      nodeRows.forEach((row, i) => {
        if (i >= 1) {
          row.forEach((n) => {
            const h = (rowSpacing + this.config.vSpacing) * i
            n.setFinalY(n.getFinalY() + h)
          })
        }
      })

      // find col spacing
      let columnSpacing = 0
      nodeRows.forEach((row) => {
        const w = row.map((n) => (this.config.renderingSize === "max" ? n.getMaxWidth() : n.getMinWidth()))
        const max = Math.max(...w)
        columnSpacing = Math.max(columnSpacing, max)
      })

      // calculate x positions
      nodeCols.forEach((column, i) => {
        if (i >= 1) {
          column.forEach((n) => {
            const w = (columnSpacing + this.config.hSpacing) * i
            n.setFinalX(n.getFinalX() + w)
          })
        }
      })
    }


    // calculate an expander button
    const calculateExpander = () => {
      // dont create an expander if no limit is set
      if (this.config.limitNodes === null) {
        return
      }

      // dont create an expander if there are less nodes than the defined limit
      if ((this.config.limitNodes > this.nodes.length) && this.expander === null) {
        return
      }

      // add an expander or update the existing one
      const expander = this.gridExpander === null ? new GridExpander(this.canvas, this.config) : this.gridExpander

      expander.setLayoutId(this.layoutIdentifier)
      expander.setIsLayoutExpended(this.isLayoutExpended)
      // console.
      // get left-most X coordinate
      const minX = Math.min(...this.nodes.map((n) => n.getFinalX()))
      const minNode = this.nodes.find((n) => n.getFinalX() === minX)
      const w = this.config.renderingSize === "max" ? minNode.getMaxWidth() : minNode.getMinWidth()
      const x = minX - w / 2



      // get deepest Y coordinate
      const maxY = Math.max(...this.nodes.map((n) => n.getFinalY()))
      const maxNode = this.nodes.find((n) => n.getFinalY() === maxY)
      const h = this.config.renderingSize === "max" ? maxNode.getMaxHeight() : maxNode.getMinHeight()
      const y = maxY + h + this.config.vSpacing


      expander.setFinalX(x)
      expander.setFinalY(y)

      this.gridExpander = expander



    }


    // calculate the layout dimensions
    const calculateLayoutInfo = () => {


      // calculate the vertical adjustment
      const hAdjustment = Math.min(...this.nodes.map((node) => {
        const w = this.config.renderingSize === "max" ? node.getMaxWidth() : node.getMinWidth()
        return node.getFinalX() - w
      }))

      // calculate the horizontal adjustment
      const vAdjustment = Math.min(...this.nodes.map((node) => {
        const h = this.config.renderingSize === "max" ? node.getMaxHeight() : node.getMinHeight()
        return node.getFinalY() - h
      }))


      // update nodes
      this.nodes.forEach((node) => {
        const x = ((node.getFinalX() - hAdjustment) + offset) + this.config.translateX
        const y = (node.getFinalY() - vAdjustment) + this.config.translateY
        node.setFinalX(x)
        node.setFinalY(y)
      })

      // update expander
      if (this.gridExpander) {
        this.gridExpander.setFinalX(((this.gridExpander.getFinalX() - hAdjustment) + offset) + this.config.translateX)

      }

      // calculate the layout info by gathering information about three points
      const x0 = Math.min(...this.nodes.map((n) => {
        const w = this.config.renderingSize === "max" ? n.getMaxWidth() : n.getMinWidth()
        return n.getFinalX() - w
      }))
      const y0 = 0

      const x1 = Math.max(...this.nodes.map((n) => {
        const w = this.config.renderingSize === "max" ? n.getMaxWidth() : n.getMinWidth()
        return n.getFinalX() + w
      }))
      const y1 = 0

      const x2 = x1
      const y2 = Math.max(...this.nodes.map((n) => {
        const h = this.config.renderingSize === "max" ? n.getMaxHeight() : n.getMinHeight()
        return n.getFinalY() + h
      }))


      // create the layout info object
      this.layoutInfo = {
        x: x0,
        y: y0,
        cx: (x0 + x2) / 2,
        cy: (y0 + y2) / 2,
        w: calculateDistance(x0, y0, x1, y1),
        h: calculateDistance(x1, y1, x2, y2),
      }


    }


    // layout calculations
    calculateFinalPosition()

    // expander
    calculateExpander()

    // layout info
    calculateLayoutInfo()

    return this.layoutInfo
  }



  /**
   * Renders the grid layout by creating SVG objects representing nodes and an additional expander.
   * @param {Object} [opts={ }] An object containing additional information.
   * @param {Boolean} [opts.isReRender=false] Determines if the layout is rerenderd.
   */
  renderLayout({ isReRender = false }) {

    // get the position where to start rendering the nodes from
    const limit = this.config.limitNodes ? this.config.limitNodes : this.nodes.length
    const X = this.layoutInfo.cx
    const Y = this.layoutInfo.cy

    // renders the grid expander
    const renderExpander = () => {
      // skip this method if no expander is defined
      if (this.gridExpander === null) {
        return
      }

      const expander = this.gridExpander

      // only move the expander into position for re-renderings
      if (expander.isRendered() === true) {
        expander.transformToFinalPosition({ isReRender })
        return
      }

      // create a new SVG representation
      expander.render({ cx: this.layoutInfo.cx, cy: this.layoutInfo.cy, layoutInfo: this.layoutInfo })

      // find provided events
      const eventStr = [...new Set(this.events.map((e) => e.event))].toString().split(",")

      // attach events to SVG object
      expander.svg.on(eventStr, (e) => {
        const { type } = e
        let modifier
        if (e.altKey === true) {
          modifier = "altKey"
        } else if (e.ctrlKey === true) {
          modifier = "ctrlKey"
        } else if (e.shiftKey === true) {
          modifier = "shiftKey"
        }
        // add provided events
        this.events.forEach((myevent) => {
          if (myevent.event === type && myevent.modifier === modifier) {
            // change the current expand state
            this.isLayoutExpended = !this.isLayoutExpended

            // update the expanders text
            if (this.isLayoutExpended === true) {
              expander.changeToShowMoreText()
            } else {
              expander.changeToHideMoreText()
            }
            this.expandGridLayoutEvent(this.isLayoutExpended)
          }
        })
      })
    }

    // renders visual node representations
    const renderNodes = () => {
      this.nodes.forEach((node, i) => {
        // create non-existing nodes only until the maximal node limit is reached
        if (i <= limit && node.isRendered() === false) {
          if (this.config.renderingSize === "max") node.renderAsMax({ IX: X, IY: Y })
          if (this.config.renderingSize === "min") node.renderAsMin({ IX: X, IY: Y })

          // move newly created nodes in a re-render operation behind others for visual improvements
          if (isReRender) node.moveToBack()

          // or transform the existing node into position
        } else if (node.isRendered() === true) {
          // console.log("trf", node)
          node.transformToFinalPosition({})
        }
      })
    }

    renderExpander()
    renderNodes()


  }
}


export default GridLayout
