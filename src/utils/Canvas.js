import { SVG } from "@svgdotjs/svg.js"


const createTestCanvas = () => {
    const doc = window.document
    const body = doc.body

    const div = doc.createElement("div")
    div.setAttribute("id", "canvas")

    body.appendChild(div)

    return SVG()
        .addTo(element)
        .size(window.innerWidth - 10, window.innerHeight - 10)
        .viewbox(0, 0, window.innerWidth - 10, window.innerHeight - 10)
}



export default createTestCanvas