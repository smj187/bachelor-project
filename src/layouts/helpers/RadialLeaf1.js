class RadialLeaf {
    constructor(canvas, node, root, layoutConfig, line, circle) {
        this.svg = null
        this.canvas = canvas
        this.config = {
            animationSpeed: layoutConfig.animationSpeed,
            strokeWidth: layoutConfig.leafStrokeWidth,
            strokeColor: layoutConfig.leafStrokeColor,
            marker: layoutConfig.leafMarker,
            hAspect: layoutConfig.hAspect,
            wAspect: layoutConfig.wAspect
        }

        // node
        this.id = node.id
        this.node = node
        this.line = line
        this.circle = circle


        // position
        this.root = root
        this.initialX = 0
        this.initialY = 0
        this.finalX = 0
        this.finalY = 0
        this.currentX = 0
        this.currentY = 0

        // fake node
        this.children = []
        this.parentId = null

    }

    render() {
        console.log("render")
    }

    getDepth() {
        return this.depth
    }


    getFinalY() {
        return this.finalY
    }

    setFinalX(finalX) {
        this.finalX = finalX
    }

    setFinalY(finalY) {
        this.finalY = finalY
    }

    setFinalXY(finalX, finalY) {
        this.finalX = finalX
        this.finalY = finalY
    }

    getMinWidth() {
        return this.config.minWidth
    }

    getMaxWidth() {
        return this.config.maxWidth
    }

    getMinHeight() {
        return this.config.minHeight
    }

    getMaxHeight() {
        return this.config.maxHeight
    }

    hasNoChildren() {
        return this.children.length === 0
    }

    hasChildren() {
        return this.children.length > 0
    }

    hasNoChildrenIds() {
        return this.childrenIds.length === 0
    }

    getChildrenIds() {
        return this.childrenIds
    }

    hasChildrenIds() {
        return this.childrenIds.length > 0
    }

    setChildrenIds(childrenIds) {
        this.childrenIds = childrenIds
    }

    getInvisibleChildren() {
        return this.invisibleChildren
    }


    addIncomingEdge(incomingEdge) {
    }

    addOutgoingEdge(outgoingEdge) {
    }


}

export default RadialLeaf