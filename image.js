const sharp = require('sharp')

const IMAGE_WIDTH = 760

// TODO: transform perspective?
//   https://stackoverflow.com/questions/14244032/redraw-image-from-3d-perspective-to-2d/14244616#14244616

function getDomain (mask, fn) {
  const nums = mask.map(fn)
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  return [min, max]
}

function getDomainX (mask) {
  return getDomain(mask, (coordinate) => coordinate.x)
}

function getDomainY (mask) {
  return getDomain(mask, (coordinate) => coordinate.y)
}

function getLength (domain) {
  return domain[1] - domain[0]
}

function createSvg (width, height, contents) {
  return `<svg width="${width}" height="${height}">
    ${contents}
  </svg>`
}

function createMaskSvg (width, height, mask) {
  const polygon = `<polygon
    points="${mask.map((coordinate) => `${coordinate.x},${coordinate.y}`).join(' ')}"
  />`

  return createSvg(width, height, polygon)
}

function createSquareSvg (width, height, mask) {
  const domainX = getDomainX(mask)
  const domainY = getDomainY(mask)

  const maskWidth = getLength(domainX)
  const maskHeight = getLength(domainY)

  const squareLength = Math.min(width, Math.min(height, Math.max(maskWidth, maskHeight)))

  let rect
  if (maskWidth > maskHeight) {
    const x = Math.min(width - squareLength, Math.max(0, domainX[0]))
    const y = Math.min(height - squareLength, Math.max(0, domainY[0] + maskHeight / 2 - squareLength / 2))

    rect = `<rect
      x="${x}" y="${y}"
      width="${squareLength}" height="${squareLength}"
    />`
  } else {
    const x = Math.min(width - squareLength, Math.max(0, domainX[0] + maskWidth / 2 - squareLength / 2))
    const y = Math.min(height - squareLength, Math.max(0, domainY[0]))

    rect = `<rect
      x="${x}" y="${y}"
      width="${squareLength}" height="${squareLength}"
    />`
  }

  return createSvg(width, height, rect)
}

function createContainSvg (width, height, mask) {
  const domainX = getDomainX(mask)
  const domainY = getDomainY(mask)

  const maskWidth = getLength(domainX)
  const maskHeight = getLength(domainY)

  const rect = `<rect
    x="${domainX[0]}" y="${domainY[0]}"
    width="${maskWidth}" height="${maskHeight}"
  />`

  return createSvg(width, height, rect)
}

async function maskAndTrim (imageBuffer, maskSvg) {
  const maskBuffer = await sharp(Buffer.from(maskSvg)).toBuffer()

  const composite = await sharp(maskBuffer)
    .composite([{ input: imageBuffer, blend: 'in' }])
    .toBuffer()

  return sharp(composite)
    .trim()
    .toBuffer()
}

function toPng (buffer, width = IMAGE_WIDTH) {
  return sharp(buffer)
    .resize({width})
    .toBuffer()
}

function toJpg (buffer, width = IMAGE_WIDTH) {
  return sharp(buffer)
    .resize({width})
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .jpeg()
    .toBuffer()
}

async function save (imageBuffer, mask) {
  const image = sharp(imageBuffer)
  const {width, height} = await image.metadata()

  const maskSvg = createMaskSvg(width, height, mask)
  const squareSvg = createSquareSvg(width, height, mask)
  const containSvg = createContainSvg(width, height, mask)

  const maskImageBuffer = await maskAndTrim(imageBuffer, maskSvg)
  const squareImageBuffer = await maskAndTrim(imageBuffer, squareSvg)
  const containImageBuffer = await maskAndTrim(imageBuffer, containSvg)

  return {
    'mask.png': await toPng(maskImageBuffer),
    'mask.jpg': await toJpg(maskImageBuffer),
    'square.png': await toPng(squareImageBuffer),
    'square.jpg': await toJpg(squareImageBuffer),
    'contain.png': await toPng(containImageBuffer),
    'contain.jpg': await toJpg(containImageBuffer)
  }
}

module.exports = {
  save
}
