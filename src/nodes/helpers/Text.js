import clamp from "clamp-js"

const createCustomNodeDetails = (canvas, config, label, description) => {
  // create the foreign object which holds
  const fobj = canvas.foreignObject(1, 1)


  // create the text background
  const background = document.createElement("div")
  background.style.padding = `${config.maxLabelPadding}px`
  background.style.display = "flex"
  background.style.flexDirection = "column"
  background.style.justifyContent = "center"
  background.style.alignItems = config.maxLabelAlignment
  background.style.width = `${config.maxWidth - config.borderStrokeWidth / 2 - config.maxLabelPadding}px`
  background.style.height = `${config.maxHeight - config.borderStrokeWidth / 2 - config.maxLabelPadding}px`


  // create the label background
  const labelBackground = document.createElement("div")
  labelBackground.style.background = config.labelBackground
  labelBackground.style.padding = `${config.maxLabelPadding}px`
  labelBackground.style.textAlign = config.maxLabelAlignment
  labelBackground.style.width = "max-content"
  labelBackground.setAttribute("id", "label")

  // create the actual label text
  const textLabel = document.createElement("div")
  textLabel.innerText = label
  textLabel.style.color = config.labelColor
  textLabel.style.fontSize = `${config.labelFontSize}px`
  textLabel.style.fontFamily = config.labelFontFamily
  textLabel.style.fontWeight = config.labelFontWeight
  textLabel.style.fontStyle = config.labelFontStyle


  // adjust the the line size
  clamp(textLabel, { clamp: config.maxLabelLineClamp })

  // add the label to its background
  labelBackground.appendChild(textLabel)
  background.appendChild(labelBackground)


  // create the description background
  const descriptionBackground = document.createElement("div")
  descriptionBackground.style.background = config.detailsBackground
  descriptionBackground.style.padding = `${config.detailsPadding}px`
  descriptionBackground.style.textAlign = config.detailsAlignment
  descriptionBackground.style.width = `${config.maxWidth - config.borderStrokeWidth / 2 - config.maxLabelPadding}px`
  descriptionBackground.style.overflow = "hidden"
  descriptionBackground.setAttribute("id", "label")

  // create the description text
  const descriptionText = document.createElement("div")
  descriptionText.innerText = description
  descriptionText.style.color = config.detailsColor
  descriptionText.style.fontSize = `${config.detailsFontSize}px`
  descriptionText.style.fontFamily = config.detailsFontFamily
  descriptionText.style.fontWeight = config.detailsFontWeight
  descriptionText.style.fontStyle = config.detailsFontStyle


  // add the description to its background
  descriptionBackground.appendChild(descriptionText)
  background.appendChild(descriptionBackground)


  // add the HTML to the SVG
  fobj.add(background)


  // adjust the the line size
  clamp(descriptionText, { clamp: `${descriptionBackground.clientHeight - config.detailsPadding}px` })


  // set the height
  fobj.height(background.clientHeight)
  fobj.width(background.clientWidth)


  // disable the user-select css property
  fobj.css("user-select", "none")


  return fobj
}

const createMinHTMLLabel = (canvas, config, label) => {
  // create the foreign object which holds the HTML
  const fobj = canvas.foreignObject(1, 1)


  // simply return, if there is no label provided
  if (label === "" || label === null) return fobj


  // create the label background
  const background = document.createElement("div")
  background.style.background = config.labelBackground
  background.style.padding = `${config.minLabelPadding}px`
  background.style.textAlign = "center"
  background.style.width = "max-content"
  background.setAttribute("id", "label")


  // create the actual label text
  const textLabel = document.createElement("div")
  textLabel.innerText = label
  textLabel.style.color = config.labelColor
  textLabel.style.fontSize = `${config.labelFontSize}px`
  textLabel.style.fontFamily = config.labelFontFamily
  textLabel.style.fontWeight = config.labelFontWeight
  textLabel.style.fontStyle = config.labelFontStyle


  // adjust the the line size
  clamp(textLabel, { clamp: config.minLabelLineClamp })


  // add the label to the background element
  background.appendChild(textLabel)


  // add the HTML to the SVG
  fobj.add(background)


  // update the label so that it will fit inside the node
  if (textLabel.clientWidth > config.minWidth) {
    background.style.width = `${config.minWidth - config.borderStrokeWidth / 2 - config.minLabelPadding}px`
  }


  // set the height
  fobj.height(background.clientHeight)
  fobj.width(background.clientWidth)


  // disable the user-select css property
  fobj.css("user-select", "none")


  return fobj
}

export { createCustomNodeDetails, createMinHTMLLabel }
