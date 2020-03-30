/* eslint-disable max-len */
const fs = require("fs")


const numberOfRequiredNodes = 50

const data = []
const labels = ["Risk", "Asset", "Requirement", "Control"]
const lorem = ["a", "ac", "accumsan", "ad", "adipiscing", "aenean", "aenean", "aliquam", "aliquam", "aliquet", "amet", "ante", "aptent", "arcu", "at", "auctor", "augue", "bibendum", "blandit", "class", "commodo", "condimentum", "congue", "consectetur", "consequat", "conubia", "convallis", "cras", "cubilia", "curabitur", "curabitur", "curae", "cursus", "dapibus", "diam", "dictum", "dictumst", "dolor", "donec", "donec", "dui", "duis", "egestas", "eget", "eleifend", "elementum", "elit", "enim", "erat", "eros", "est", "et", "etiam", "etiam", "eu", "euismod", "facilisis", "fames", "faucibus", "felis", "fermentum", "feugiat", "fringilla", "fusce", "gravida", "habitant", "habitasse", "hac", "hendrerit", "himenaeos", "iaculis", "id", "imperdiet", "in", "inceptos", "integer", "interdum", "ipsum", "justo", "lacinia", "lacus", "laoreet", "lectus", "leo", "libero", "ligula", "litora", "lobortis", "lorem", "luctus", "maecenas", "magna", "malesuada", "massa", "mattis", "mauris", "metus", "mi", "molestie", "mollis", "morbi", "nam", "nec", "neque", "netus", "nibh", "nisi", "nisl", "non", "nostra", "nulla", "nullam", "nunc", "odio", "orci", "ornare", "pellentesque", "per", "pharetra", "phasellus", "placerat", "platea", "porta", "porttitor", "posuere", "potenti", "praesent", "pretium", "primis", "proin", "pulvinar", "purus", "quam", "quis", "quisque", "quisque", "rhoncus", "risus", "rutrum", "sagittis", "sapien", "scelerisque", "sed", "sem", "semper", "senectus", "sit", "sociosqu", "sodales", "sollicitudin", "suscipit", "suspendisse", "taciti", "tellus", "tempor", "tempus", "tincidunt", "torquent", "tortor", "tristique", "turpis", "ullamcorper", "ultrices", "ultricies", "urna", "ut", "ut", "varius", "vehicula", "vel", "velit", "venenatis", "vestibulum", "vitae", "vivamus", "viverra", "volutpat", "vulputate"]
const reqStates = ["FULFILLED", "PARTIALLY-FULFILLED", "NOT-FULFILLED", "UNKNOWN STATE", null]
const riskStates = ["low", "medium", "critical", "unknwon", null]
const assetAttrs = [{ key: "location", value: "Serverroom 3" }, { key: "location", value: "Main Room 22" }, { key: "last crash", value: "06.01.2018" }, { key: "url", value: "unknown" }, { key: "url", value: "http://127.0.0.1:5500/" }, { key: "last maintenance", value: "02.04.2017" }]


const createRandomText = () => {
  let n = Math.floor(Math.random() * Math.floor(50))
  let text = ""
  while (n > 0) {
    text += `${lorem[Math.floor(Math.random() * lorem.length)]} `
    n -= 1
  }
  return text.slice(0, -1)
}

const createState = (label) => {
  let state = null
  if (label === "Requirement") {
    state = reqStates[Math.floor(Math.random() * reqStates.length)]
  } else if (label === "Risk") {
    state = riskStates[Math.floor(Math.random() * riskStates.length)]
  }
  return state
}

const createAsset = () => {
  const id = Math.floor(Math.random() * (assetAttrs.length - 0 + 1) + 0)
  return assetAttrs[id] || null
}

const getRandomParent = (min, max) => {
  const hasParent = Math.random() < 0.5
  if (hasParent) {
    const parentId = Math.floor(Math.random() * (max - min) + min)
    if (parentId !== max) {
      return parentId
    }
    return null
  }
  return null
}

for (let id = 0; id < numberOfRequiredNodes; id += 1) {
  const label = labels[Math.floor(Math.random() * labels.length)]
  const description = createRandomText()
  const state = createState(label)
  const attributes = createAsset()
  const type = label.toLowerCase()
  const parent = getRandomParent(0, id)
  const attr = null
  const json = {
    id,
    label,
    description,
    state,
    attributes,
    type,
    parent,
    children: [],
    attr,
  }
  data.push(json)
}


fs.writeFile("db.json", JSON.stringify({ data }), "utf8", (err) => { if (err) throw err })
