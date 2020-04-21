/* eslint-disable no-bitwise */

const Colorshift = (col, amt) => {
    const num = parseInt(col, 16)
    const r = (num >> 16) + amt
    const b = ((num >> 8) & 0x00FF) + amt
    const g = (num & 0x0000FF) + amt
    const newColor = g | (b << 8) | (r << 16)
    return newColor.toString(16)
}

export default Colorshift