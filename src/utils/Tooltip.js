
// /**
//  * Creates a CSS based tooltip.
//  * 
//  * @param {DOM} element The DOM element to which the tooltip is attached to.
//  */

/**
 * Class description
 * @category Helpers
 */
const createTooltip = (element) => {
  const tooltip = document.createElement("div")
  tooltip.setAttribute("id", "tooltip")
  tooltip.style.display = "none"
  tooltip.style.position = "absolute"
  tooltip.style.background = "#333"
  tooltip.style.border = "0px"
  tooltip.style.boxShadow = "0 5px 15px -5px rgba(0, 0, 0, .65)"
  tooltip.style.color = "#eee"
  tooltip.style.padding = "0.4rem 0.6rem"
  tooltip.style.fontSize = "0.85rem"
  tooltip.style.fontWeight = "400"
  tooltip.style.fontStyle = "normal"
  element.appendChild(tooltip)
}

export { createTooltip }
