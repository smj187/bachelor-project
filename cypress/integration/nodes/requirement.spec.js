import { SVG, Rect, ForeignObject, Image } from "@svgdotjs/svg.js/dist/svg.esm"
import { Requirement } from "../../../src/index"

let canvas
let data
let min
let max
const simulateDelay = (time) => new Cypress.Promise((resolve) => setTimeout(resolve, time))



before(() => {
    cy.visit("http://127.0.0.1:9987/cypress/external/index.html")

    cy.document().then((document) => {
        const element = document.createElement("div")
        element.setAttribute("id", "canvas")
        element.style.position = "relative"
        document.body.appendChild(element)
        canvas = SVG().addTo(element).size(800, 500).viewbox(0, 0, 800, 500)
    })

    cy.fixture("requirement").then((databaseEntry) => {
        data = databaseEntry
        min = new Requirement(databaseEntry, canvas)
        max = new Requirement(databaseEntry, canvas)
    })
})


describe("requirement node test", () => {
    it("renderAsMin()", () => {
        min.renderAsMin({ IX: 400, IY: 50, FX: 200, FY: 200 })

        // // data
        expect(min.id).to.equal(data.id)
        expect(min.label).to.equal(data.label)
        expect(min.type).to.equal(data.type)
        expect(min.description).to.equal(data.description)

        // default representation
        expect(min.getNodeSize()).to.equal("min")
        expect(min.getCurrentWidth()).to.equal(155)
        expect(min.getCurrentHeight()).to.equal(80)
        expect(min.getCurrentX()).to.equal(200)
        expect(min.getCurrentY()).to.equal(200)


        // svg
        expect(min.getSVG().children().length).to.equal(3)
        expect(min.getSVG().children()[0] instanceof Rect).to.equal(true)
        expect(min.getSVG().children()[1] instanceof Image).to.equal(true)
        expect(min.getSVG().children()[2] instanceof ForeignObject).to.equal(true)
    }),
        it("renderAsMax()", () => {
            max.renderAsMax({ IX: 400, IY: 50, FX: 600, FY: 250 })

            // data
            expect(max.id).to.equal(data.id)
            expect(max.label).to.equal(data.label)
            expect(max.type).to.equal(data.type)
            expect(max.description).to.equal(data.description)

            // default representation
            expect(max.getNodeSize()).to.equal("max")
            expect(max.getCurrentWidth()).to.equal(3570)
            expect(max.getCurrentHeight()).to.equal(225)
            expect(max.getCurrentX()).to.equal(600)
            expect(max.getCurrentY()).to.equal(250)

            // svg
            expect(max.getSVG().children().length).to.equal(2)
            expect(max.getSVG().children()[0] instanceof Rect).to.equal(true)
            expect(max.getSVG().children()[1] instanceof ForeignObject).to.equal(true)
        }),
        it("transformToFinalPosition", () => {
            min.transformToFinalPosition({ X: 400, Y: 50 })
            max.transformToFinalPosition({ X: 400, Y: 50 })

            expect(min.getCurrentX()).to.equal(400)
            expect(min.getCurrentY()).to.equal(50)

            expect(max.getCurrentX()).to.equal(400)
            expect(max.getCurrentY()).to.equal(50)
        }),
        it("transformToMin()", () => {
            cy.wrap(null).then(() => {
                return simulateDelay(1500).then(() => {
                    max.transformToMin({ X: 200, Y: 200 })

                    // representation
                    expect(max.getNodeSize()).to.equal("min")
                    expect(max.getCurrentX()).to.equal(200)
                    expect(max.getCurrentY()).to.equal(200)

                    // svg
                    expect(max.getSVG().children().length).to.equal(2)
                    expect(max.getSVG().children()[0] instanceof Rect).to.equal(true)
                    expect(max.getSVG().children()[1] instanceof ForeignObject).to.equal(true)
                })
            })
        }),
        it("transformToMax()", () => {
            cy.wrap(null).then(() => {
                return simulateDelay(1500).then(() => {
                    min.transformToMax({ X: 600, Y: 250 })

                    // representation
                    expect(min.getNodeSize()).to.equal("max")
                    expect(min.getCurrentX()).to.equal(600)
                    expect(min.getCurrentY()).to.equal(250)

                    // svg
                    expect(min.getSVG().children().length).to.equal(3)
                    expect(min.getSVG().children()[0] instanceof Rect).to.equal(true)
                    expect(min.getSVG().children()[1] instanceof Image).to.equal(true)
                    expect(min.getSVG().children()[2] instanceof ForeignObject).to.equal(true)
                })
            })
        })
})