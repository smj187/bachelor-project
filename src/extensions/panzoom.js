import { Svg,  extend } from '@svgdotjs/svg.js'


/**
 * Minified extension. The orginal library had a lot of unwanted functionality
 * 
 * @see https://github.com/svgdotjs/svg.panzoom.js
 * @private
 */
extend(Svg, {
  panZoom (options) {
    this.off('.panZoom')

    // when called with false, disable panZoom
    if (options === false) return this

    options = options ?? {}
    const zoomFactor = options.zoomFactor ?? 2
    const zoomMin = options.zoomMin ?? Number.MIN_VALUE
    const zoomMax = options.zoomMax ?? Number.MAX_VALUE
    const doWheelZoom = options.wheelZoom ?? true
    const margins = options.margins ?? false

    const restrictToMargins = box => {
      if (!margins) return
      const { top, left, bottom, right } = margins
      const zoom = this.width() / box.width

      const { width, height } = this.attr(['width', 'height'])

      const leftLimit = width - left / zoom
      const rightLimit = (right - width) / zoom
      const topLimit = height - top / zoom
      const bottomLimit = (bottom - height) / zoom

      box.x = Math.min(leftLimit, Math.max(rightLimit, box.x))
      box.y = Math.min(topLimit, Math.max(bottomLimit, box.y))
      return box
    }

    const wheelZoom = function (ev) {
      ev.preventDefault()

      // touchpads can give ev.deltaY == 0, which skrews the lvl calculation
      if (ev.deltaY === 0) return

      let lvl = Math.pow(1 + zoomFactor, (-1 * ev.deltaY) / 100) * this.zoom()
      const p = this.point(ev.clientX, ev.clientY)

      if (lvl > zoomMax) {
        lvl = zoomMax
      }

      if (lvl < zoomMin) {
        lvl = zoomMin
      }

      if (this.dispatch('zoom', { level: lvl, focus: p }).defaultPrevented) {
        return this
      }

      this.zoom(lvl, p)

      if (margins) {
        const box = restrictToMargins(this.viewbox())
        this.viewbox(box)
      }
    }

    if (doWheelZoom) {
      this.on('wheel.panZoom', wheelZoom, this, { passive: false })
    }

    return this
  }
})