/* eslint-disable no-bitwise */

/**
 * Programmatically lightns or darkens a hex color.
 *
 * @param {String} col The color to change.
 * @param {String} amt The amout to change it.
 *
 * @see https://www.mmbyte.com/article/9269.html
 */
const colorshift = (col, amt) => {
  const num = parseInt(col, 16)
  const r = (num >> 16) + amt
  const b = ((num >> 8) & 0x00FF) + amt
  const g = (num & 0x0000FF) + amt
  const newColor = g | (b << 8) | (r << 16)
  return newColor.toString(16)
}

export default colorshift
