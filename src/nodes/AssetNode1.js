import BaseNode from "./BaseNode"
import AssetNodeConfiguration from "../configuration/AssetNodeConfiguration"

class AssetNode extends BaseNode {
  constructor(data, canvas, customRepresentation = {}) {
    super(data, canvas)

    this.config = { ...AssetNodeConfiguration, ...data.config, ...customRepresentation }
  }


  renderAsMin() {
    const {
      initialX, initialY, finalX, finalY,
    } = this

    console.log("renderAsMin")
  }
}


export default AssetNode
