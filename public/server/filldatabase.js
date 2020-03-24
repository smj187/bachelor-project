/* eslint-disable no-plusplus */
/* eslint-disable max-len */
const fs = require("fs")

const labels = ["Risk", "Asset", "Requirement", "Control"]
const lorem = ["a", "ac", "accumsan", "ad", "adipiscing", "aenean", "aenean", "aliquam", "aliquam", "aliquet", "amet", "ante", "aptent", "arcu", "at", "auctor", "augue", "bibendum", "blandit", "class", "commodo", "condimentum", "congue", "consectetur", "consequat", "conubia", "convallis", "cras", "cubilia", "curabitur", "curabitur", "curae", "cursus", "dapibus", "diam", "dictum", "dictumst", "dolor", "donec", "donec", "dui", "duis", "egestas", "eget", "eleifend", "elementum", "elit", "enim", "erat", "eros", "est", "et", "etiam", "etiam", "eu", "euismod", "facilisis", "fames", "faucibus", "felis", "fermentum", "feugiat", "fringilla", "fusce", "gravida", "habitant", "habitasse", "hac", "hendrerit", "himenaeos", "iaculis", "id", "imperdiet", "in", "inceptos", "integer", "interdum", "ipsum", "justo", "lacinia", "lacus", "laoreet", "lectus", "leo", "libero", "ligula", "litora", "lobortis", "lorem", "luctus", "maecenas", "magna", "malesuada", "massa", "mattis", "mauris", "metus", "mi", "molestie", "mollis", "morbi", "nam", "nec", "neque", "netus", "nibh", "nisi", "nisl", "non", "nostra", "nulla", "nullam", "nunc", "odio", "orci", "ornare", "pellentesque", "per", "pharetra", "phasellus", "placerat", "platea", "porta", "porttitor", "posuere", "potenti", "praesent", "pretium", "primis", "proin", "pulvinar", "purus", "quam", "quis", "quisque", "quisque", "rhoncus", "risus", "rutrum", "sagittis", "sapien", "scelerisque", "sed", "sem", "semper", "senectus", "sit", "sociosqu", "sodales", "sollicitudin", "suscipit", "suspendisse", "taciti", "tellus", "tempor", "tempus", "tincidunt", "torquent", "tortor", "tristique", "turpis", "ullamcorper", "ultrices", "ultricies", "urna", "ut", "ut", "varius", "vehicula", "vel", "velit", "venenatis", "vestibulum", "vitae", "vivamus", "viverra", "volutpat", "vulputate"]
const requirementStats = ["FULFILLED", "PARTIALLY-FULFILLED", "NOT-FULFILLED", null]
const riskStates = ["low", "medium", "critical", "unknwon", null]


const fillDatabase = (n) => {
  function createRandomDescription() {
    const text = []
    let x = Math.floor(Math.random() * (50 - 5) + 5)
    while (--x) text.push(lorem[Math.floor(Math.random() * lorem.length)])
    return text.join(" ")
  }

  function createRandomState(label) {
    let state = null
    if (label === "Requirement") {
      state = requirementStats[Math.floor(Math.random() * requirementStats.length)]
    } else if (label === "Risk") {
      state = riskStates[Math.floor(Math.random() * riskStates.length)]
    }
    return state
  }

  function createRandomTooltipText(label) {
    if (Math.random() > 0.5) {
      return null
    }
    return `${label}'s tooltip`
  }

  function createRandomParent(max) {
    const hasParent = Math.random() < 0.5
    if (hasParent) {
      const id = Math.floor(Math.random() * (max - 0) + 1)
      if (id !== max) {
        return [id]
      }
      return []
    }
    return []
  }

  let data = []
  for (let i = 0; i < labels.length; i += 1) {
    const label = labels[i]
    const temp = []
    for (let j = 0; j < n; j += 1) {
      temp.push({
        id: j,
        label,
        description: createRandomDescription(),
        type: label.toLowerCase(),
        state: createRandomState(label),
        tooltipText: createRandomTooltipText(label),
        parentIds: createRandomParent(j), // one parent or n parents ?
        childrenIds: [],
        config: null,
      })
    }

    temp.forEach((dataEntry) => {
      const id = dataEntry.parentIds[0] || null
      if (id) {
        const parent = temp.find((d) => d.id === id)
        parent.childrenIds = [...parent.childrenIds, dataEntry.id]
      }
    })

    data = [...data, temp]
  }


  fs.writeFile("database.json", JSON.stringify({ data }, null, 2), "utf8", (err) => { if (err) throw err })
}


fillDatabase(100)
