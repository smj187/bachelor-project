import { SVG, Rect, Image, ForeignObject } from "../svgdotjs"
import { Asset } from "../../../public/graphVisualization"


let canvas
let data
let minNode
let maxNode

before(() => {
    cy.visit("http://127.0.0.1:5501/public/index.html")

    cy.document().then((doc) => {
        const element = doc.createElement("div")
        element.setAttribute("id", "canvas2")
        element.style.position = "relative"
        doc.body.appendChild(element)

        const w = 1000
        const h = 1000
        canvas = SVG()
            .addTo(element)
            .size(w, h)
            .viewbox(0, 0, w, h)
    })

    cy.fixture("asset").then(d => {
        data = d
        minNode = new Asset(data, canvas)
        maxNode = new Asset(data, canvas)
    })
})


describe("asset node test", () => {


    it("renderAsMin()", () => {


        minNode.renderAsMin(300, 50, 200, 400)

        expect(minNode.id).to.equal(data.id)
        expect(minNode.label).to.equal(data.label)
        expect(minNode.type).to.equal(data.type)
        expect(minNode.description).to.equal(data.description)

        // representation
        expect(minNode.getNodeSize()).to.equal("min")
        expect(minNode.getCurrentWidth()).to.equal(150)
        expect(minNode.getCurrentHeight()).to.equal(80)
        expect(minNode.getConfig().labelColor).to.equal("#222")

        // svg
        expect(minNode.getSVG().children().length).to.equal(3)
        expect(minNode.getSVG().children()[0] instanceof Rect).to.equal(true)
        expect(minNode.getSVG().children()[1] instanceof Image).to.equal(true)
        expect(minNode.getSVG().children()[2] instanceof ForeignObject).to.equal(true)

    }),
        it("renderAsMax()", () => {
            maxNode.renderAsMax(200, 400, 300, 150)
        }),
        it("transformToMin()", () => {
            const wait = (time) => {
                return new Cypress.Promise((resolve) => setTimeout(resolve, time));
            }

            cy.wrap(null).then(() => {
                return wait(data.config.animationSpeed + 200).then(() => {
                    maxNode.transformToMin(400, 50)
                })
            })

        }),
        it("transformToMax()", () => {
            const wait = (time) => {
                return new Cypress.Promise((resolve) => setTimeout(resolve, time));
            }

            cy.wrap(null).then(() => {
                return wait(data.config.animationSpeed + 200).then(() => {
                    minNode.transformToMax(300, 400)
                })
            })

        })

})

