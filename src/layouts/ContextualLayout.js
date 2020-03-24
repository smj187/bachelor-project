import BaseLayout from "./BaseLayout"

const ContextualConfig = {
  // limit width and size
  maxLayoutWidth: 1000,
  maxLayoutHeight: window.innerHeight - 10,


  // where to translate a given layout
  translateX: 0,
  translateY: 0,

  // layout animation speed for all nodes and edges
  animationSpeed: 300,

  // hide all other layouts and center selected one
  hideOtherLayouts: false, // TODO:

  // spacing between nodes
  spacing: 32,

  // how to render all nodes
  renderingSize: "min", // min max

  // limit how many nodes are displayed without a container
  containerLimit: 3,

  // container config
  containderBorderRadius: 5,
  containerBorderStrokeColor: "#555555",
  containerBorderStrokeWidth: 2,
  containerBackgroundColor: "#fff",
}

class ContextualLayout extends BaseLayout {
  constructor(customContextualConfig = {}) {
    super()
    this.config = { ...ContextualConfig, ...customContextualConfig }
  }

  calculateLayout() {
    console.log(this.nodes)
  }


  renderLayout() {

  }
}


export default ContextualLayout
