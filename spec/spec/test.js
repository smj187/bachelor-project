// import { Asset } from "../../public/graphVisualization"

window.draw = SVG().addTo('#canvas')

describe("craete rect", () => {

    var circle

    beforeEach(function () {
        circle = draw.circle(240)
    })

    it("creat", () => {
        expect(true).toBe(true)
        console.log(circle.bbox())
    })
})