const express = require("express")
const bodyParser = require("body-parser")
const fs = require("fs")
const cors = require("cors")


const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())


const DATABASE_URL = `${__dirname}\\database.json`

app.post("/contextual-relationships", (req, res) => {
  fs.readFile(DATABASE_URL, "utf8", (err, data) => {
    if (err) {
      throw err
    }
    const parsed = JSON.parse(data)["contextual-relationships"]

    res.send(parsed.find((p) => p.focus === req.body[0]) || [])
  })
})


// get nodedata entpoint
app.post("/node-data", (req, res) => {
  fs.readFile(DATABASE_URL, "utf8", (err, data) => {
    if (err) {
      throw err
    }
    const parsed = JSON.parse(data)


    // return in requested order
    const requested = []
    req.body.forEach((id) => {
      const node = parsed["node-data"].find((n) => n.id === id)
      if (node !== undefined) {
        requested.push(node)
      }
    })
    console.log("req @:", new Date().toLocaleTimeString(), "<->", req.body)
    res.send(requested)


    // // return ordered by ids ascending
    // res.send(parsed["node-data"].filter((n) => body.includes(n.id)))
  })
})

// edge entpoint
app.post("/edge-data", ({ body }, res) => {
  fs.readFile(DATABASE_URL, "utf8", (err, data) => {
    if (err) {
      throw err
    }
    const allEdges = JSON.parse(data)["edge-data"]

    const include = ({ fromNode, toNode }) => body.some((e) => e.fromNode === fromNode && e.toNode === toNode)
    const matchingEdges = allEdges.filter(include)


    res.send(matchingEdges)
  })
})


// create and remove endpoints
const createEntry = (req, res, name) => {
  fs.readFile(DATABASE_URL, "utf8", (readErr, data) => {
    if (readErr) {
      throw readErr
    }
    const all = JSON.parse(data)
    const parsed = all[name]

    req.body.forEach((newData) => { parsed[newData.id] = newData })

    all[name] = parsed.filter((n) => n !== null)
    fs.writeFile(DATABASE_URL, JSON.stringify(all, null, 4), "utf8", (writeErr) => {
      if (writeErr) { throw writeErr }
    })
    res.send(all)
  })
}

const deleteEntry = (req, res, name) => {
  fs.readFile(DATABASE_URL, "utf8", (err, data) => {
    if (err) {
      throw err
    }

    const all = JSON.parse(data)
    const parsed = all[name]

    const toDelete = req.body || []
    const deleted = parsed.filter((n) => !toDelete.includes(n.id))

    all[name] = deleted
    fs.writeFile(DATABASE_URL, JSON.stringify(all, null, 4), "utf8", (writeErr) => {
      if (writeErr) { throw writeErr }
    })
  })

  res.send(req.body)
}
app.post("/node-data-add", (req, res) => { createEntry(req, res, "node-data") })
app.post("/node-data-remove", (req, res) => { deleteEntry(req, res, "node-data") })
app.post("/edge-data-add", (req, res) => { createEntry(req, res, "edge-data") })
app.post("/edge-data-remove", (req, res) => { deleteEntry(req, res, "edge-data") })


// eslint-disable-next-line no-console
app.listen(3001, () => console.log("Server started on http://localhost:3001"))
