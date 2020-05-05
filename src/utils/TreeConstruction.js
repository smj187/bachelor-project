
/**
 * Creates a tree node tree based on parent and children references. The required data does not have to be sorted.
 *
 * @private
 * @param {Array.<Object>} array The array where to construct the tree from.
 * @param {Array.<Obejct>} [parentRef=undefined] Required by the recursive call to pass the new parent ref.
 * @param {Array.<Object>} [rootRef=undefined] Required by the recursive call to pass current children ref.
 *
 * @see https://stackoverflow.com/a/22072374
 */
const buildTreeFromIds = (array, parentRef = undefined, rootRef = undefined) => {
  let root = rootRef !== undefined ? rootRef : []
  const parent = parentRef !== undefined ? parentRef : { id: null }
  const children = array.filter((child) => child.parent === parent.id)
  if (children.length > 0) {
    if (parent.id === null) {
      root = children
    } else {
      parent.children = children
    }

    children.forEach((child) => {
      buildTreeFromIds(array, child)
    })
  }
  return root
}

/**
 * Creates a node tree based on parent and children ID references. The required data does not have to be sorted.
 *
 * @private
 * @param {Array.<Object>} array The array where to construct the tree from.
 * @param {Array.<Obejct>} [parentRef=undefined] Required by the recursive call to pass the new parent ref.
 * @param {Array.<Object>} [rootRef=undefined] Required by the recursive call to pass current children ref.
 *
 * @see https://stackoverflow.com/a/22072374
 */
const buildTreeFromNodes = (array, parentRef, rootRef) => {
  let root = rootRef !== undefined ? rootRef : []
  const parent = parentRef !== undefined ? parentRef : { id: null }
  const children = array.filter((child) => child.parentId === parent.id)
  if (children.length > 0) {
    if (parent.id === null) {
      root = children
    } else {
      parent.children = children
    }

    children.forEach((child) => {
      buildTreeFromNodes(array, child)
    })
  }
  return root
}


export { buildTreeFromIds, buildTreeFromNodes }
