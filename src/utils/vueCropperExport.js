/**
 * vue-cropper 的 getCropBlob 在内部异步 Image.onload 里读 this.cropW，
 * 某些情况下会变成 0 从而导出整张缩放图。这里在触发导出前快照状态并按库内公式（rotate=0）绘制。
 */

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('裁剪用图片加载失败'))
    if (typeof src === 'string' && /^https?:\/\//i.test(src)) {
      el.crossOrigin = 'anonymous'
    }
    el.src = src
  })
}

/** @param {any} cropper VueCropper 组件实例 */
function readCropperState(cropper) {
  if (cropper?.$data != null) return cropper.$data
  return cropper
}

/**
 * @param {any} cropper
 * @param {{ framePx: number; exportPx: number; nextTick: () => Promise<void> }} opts
 */
export async function exportVueCropperSquarePng(cropper, opts) {
  const { framePx, exportPx, nextTick } = opts
  if (!cropper || typeof cropper.goAutoCrop !== 'function') {
    throw new Error('裁剪组件无效')
  }

  let d = readCropperState(cropper)
  if (!d?.cropW || !d?.cropH) {
    cropper.goAutoCrop(framePx, framePx)
    await nextTick()
    await nextTick()
    d = readCropperState(cropper)
  }

  if (!d?.cropW || !d?.cropH) {
    throw new Error('裁剪区域无效，请重新选择图片')
  }

  const rotateN = Number(d.rotate) || 0
  if (rotateN !== 0) {
    throw new Error('暂不支持旋转后导出，请将图片旋转回正后再上传')
  }

  const src = d.imgs || cropper.img
  if (!src || typeof src !== 'string') {
    throw new Error('图片源无效')
  }

  const {
    cropW,
    cropH,
    cropOffsertX,
    cropOffsertY,
    x,
    y,
    scale,
    trueWidth,
    trueHeight,
  } = d

  const imgEl = await loadImageElement(src)

  const dpr = 1
  const width = cropW * dpr
  const height = cropH * dpr
  const imgW = trueWidth * scale * dpr
  const imgH = trueHeight * scale * dpr
  const dx = (x - cropOffsertX + (trueWidth * (1 - scale)) / 2) * dpr
  const dy = (y - cropOffsertY + (trueHeight * (1 - scale)) / 2) * dpr

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width)
  canvas.height = Math.round(height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')
  ctx.drawImage(imgEl, dx, dy, imgW, imgH)

  const out = document.createElement('canvas')
  out.width = exportPx
  out.height = exportPx
  const octx = out.getContext('2d')
  if (!octx) throw new Error('无法创建画布')
  octx.imageSmoothingEnabled = true
  octx.imageSmoothingQuality = 'high'
  octx.drawImage(canvas, 0, 0, exportPx, exportPx)

  return new Promise((resolve, reject) => {
    out.toBlob((b) => (b ? resolve(b) : reject(new Error('导出失败'))), 'image/png', 0.92)
  })
}
