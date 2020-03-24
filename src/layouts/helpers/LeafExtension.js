import { shape, intersect } from "svg-intersections"


const LeafConfig = {
  // large representation
  maxWidth: 370,
  maxHeight: 200,

  // small representation
  minWidth: 150,
  minHeight: 40,


  // icon
  iconUrl: null,
  minIconOpacity: 1,
  minIconSize: 32,
  minIconTranslateX: -45,
  minIconTranslateY: 0,

  // node
  offset: 8,
  animationSpeed: 300,
  borderRadius: 5,
  borderStrokeWidth: 0,
  borderStrokeColor: "#aaa",
  borderStrokeDasharray: "0",
  backgroundColor: "#ffffff",


  // text
  minTextWidth: 87,
  minTextHeight: 24,
  minTextTranslateX: 15,
  minTextTranslateY: 0,
  labelColor: "#84a8f2",
  labelFontFamily: "Montserrat",
  labelFontSize: 12,
  labelFontWeight: 600,
  labelFontStyle: "normal",
  labelBackground: "#fff",


  // arrow
  strokeWidth: 2,
  strokeColor: "#aaa",
  strokeDasharray: "7 5",
  marker: "M 0 0 L 6 3 L 0 6 z",


  color1: "#aaa",
  color2: "#222",

}

class LeafExtenstion {
  constructor(canvas, node) {
    this.svg = null
    this.canvas = canvas

    this.node = node
    this.nodeSize = node.childrenIds.length

    this.config = { ...LeafConfig }


    // position
    this.initialX = 0
    this.initialY = 0
    this.finalX = 0
    this.finalY = 0
    this.currentX = 0
    this.currentY = 0

    this.events = []
  }


  addEvent(event, func) {
    // this.svg.on(event, func)
    // console.log(this.svg)
    this.events = [...this.events, { event, func }]
    // console.log(this.getNodeSize())
  }


  render(X = this.node.finalX, Y = this.node.finalY) {
    const svg = this.canvas.group().draggable()
    svg.css("cursor", "pointer")
    svg.id("leafExtenstion")


    const w = this.node.nodeSize === "min" ? this.config.minWidth : this.config.maxWidth
    const h = this.node.nodeSize === "min" ? this.config.minHeight + 10 : this.config.maxHeight


    const text = this.canvas.foreignObject(w, h)
    const background = document.createElement("div")
    const label = document.createElement("p")
    label.innerText = `Show ${this.nodeSize} more children`
    label.style.color = this.config.labelColor
    label.style.textAlign = "center"
    label.style.padding = `${this.config.offset / 2}px`
    label.style.background = this.config.labelBackground
    label.style.fontSize = `${this.config.labelFontSize}px`
    label.style.fontFamily = this.config.labelFontFamily
    label.style.fontWeight = this.config.labelFontWeight
    label.style.fontStyle = this.config.labelFontStyle
    background.appendChild(label)
    text.add(background)
    text.height(background.clientHeight)


    svg.add(text)

    const translateY = this.node.nodeSize === "min" ? 75 : 195
    svg
      .center(X, Y + translateY)


    const tx = this.node.getFinalX()
    const ty = this.node.getFinalY()

    const edgesStartingLine = this
      .canvas
      .path(`M 0 0 h${this.node.currentWidth * 1.35}`)
      .stroke({ width: 0, color: "red" })
      .center(tx, ty + h / 2 + this.config.offset + translateY / 3)

    const interval = edgesStartingLine.length() / this.nodeSize
    let intervalSpaceUsed = 0
    for (let i = 0; i < this.nodeSize; i += 1) {
      const p = edgesStartingLine.pointAt(intervalSpaceUsed)
      intervalSpaceUsed += interval

      const fx = p.x + interval / 2
      const fy = p.y

      // this.canvas.circle(5).fill("#75f").center(fx, fy)
      // this.canvas.circle(5).fill("#000").center(tx, ty)


      const { points } = intersect(shape("rect", {
        x: tx - w / 2 - this.node.config.borderStrokeWidth / 2 - this.config.offset / 2,
        y: ty - h / 2 - this.node.config.borderStrokeWidth / 2 - this.config.offset / 2,
        width: w + this.node.config.borderStrokeWidth + this.config.offset,
        height: h + this.node.config.borderStrokeWidth + this.config.offset,
        rx: this.node.config.borderRadius,
        ry: this.node.config.borderRadius,
      }), shape("line", {
        x1: fx,
        y1: fy,
        x2: tx,
        y2: ty,
      }))


      // this.canvas.circle(5).fill("#000").center(points[0].x, points[0].y)

      const path = this.canvas.path(`M${fx},${fy} L${points[0].x},${points[0].y}`).stroke({
        width: this.config.strokeWidth,
        color: this.config.strokeColor,
      })


      // create a re-useable marker
      const index = [...this.canvas.defs().node.childNodes].findIndex((d) => d.id === "defaultThinMarker")
      if (index === -1) {
        const marker = this.canvas.marker(12, 6, (add) => {
          add.path(this.config.marker).fill(this.config.strokeColor).dx(1)
        })
        marker.id("defaultThinMarker")
        this.canvas.defs().add(marker)
        path.marker("end", marker)
      } else {
        const marker = this.canvas.defs().get(index)
        path.marker("end", marker)
      }

      svg.add(path)
    }
    svg
      .transform({ position: [this.initialX, this.initialY] })
    this.finalX = svg.cx()
    this.finalY = svg.cy()

    this.events.forEach(({ event, func }) => {
      svg.on(event, func)
    })


    this.svg = svg
  }

  transformToFinalPosition() {
    this
      .svg

      .attr({ opacity: 1 })
      .animate({ duration: this.config.animationSpeed })
      .transform({ position: [this.finalX, this.finalY] })
      .attr({ opacity: 1 })
  }


  removeLeaf() {
    this.svg.remove()
    this.svg = null
  }
}


export default LeafExtenstion
