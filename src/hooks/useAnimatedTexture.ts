import { useEffect, useRef, useCallback } from 'react'

export type TextureType = 'grass' | 'tree' | 'water' | 'oak' | 'roof'

interface Dot {
  x: number
  y: number
  phase: number
  speed: number
  baseSize: number
  r: number
  g: number
  b: number
  // For transitions
  tr?: number
  tg?: number
  tb?: number
  tSize?: number
}

export interface ThemeColors {
  grassHue: [number, number]
  grassLight: [number, number]
  waterHue: number
  waterLight: [number, number]
  treeLight: [number, number]
  oakLight: [number, number]
  roofHue: number
  roofLight: [number, number]
}

export const LIGHT_THEME: ThemeColors = {
  grassHue: [100, 35],
  grassLight: [42, 20],
  waterHue: 205,
  waterLight: [35, 20],
  treeLight: [30, 22],
  oakLight: [32, 28],
  roofHue: 20,
  roofLight: [18, 8],
}

export const DARK_THEME: ThemeColors = {
  grassHue: [110, 30],
  grassLight: [18, 15],
  waterHue: 215,
  waterLight: [15, 12],
  treeLight: [14, 12],
  oakLight: [16, 16],
  roofHue: 25,
  roofLight: [8, 5],
}

let currentTheme: ThemeColors = DARK_THEME
export function setTextureTheme(t: ThemeColors) { currentTheme = t }

// --- Image color map system ---
const PHOTO_PATHS = [
  'photos/landscape-1.jpg',
  'photos/landscape-2.jpg',
  'photos/landscape-3.jpg',
  'photos/landscape-4.jpg',
  'photos/landscape-5.jpg',
  'photos/landscape-6.jpg',
  'photos/landscape-7.jpg',
  'photos/landscape-8.jpg',
]

interface ImageColorMap {
  data: Uint8ClampedArray
  width: number
  height: number
}

const loadedImages: HTMLImageElement[] = []
let imagesLoaded = false
let imageLoadPromise: Promise<void> | null = null

// Boost saturation and ensure visibility on dark/light bg
function boostColor(r: number, g: number, b: number, isDark: boolean): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s: number, l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  } else {
    s = 0
  }

  // Boost saturation
  s = Math.min(1, s * 1.5)
  if (isDark) {
    // For dark theme: force minimum lightness so dots are visible
    l = Math.max(0.35, Math.min(0.75, l * 1.4))
  } else {
    // For light theme: slightly brighter
    l = Math.max(0.3, Math.min(0.65, l * 1.2))
  }

  // HSL to RGB
  let r2: number, g2: number, b2: number
  if (s === 0) {
    r2 = g2 = b2 = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p2 = 2 * l - q
    r2 = hue2rgb(p2, q, h + 1 / 3)
    g2 = hue2rgb(p2, q, h)
    b2 = hue2rgb(p2, q, h - 1 / 3)
  }

  return [Math.round(r2 * 255), Math.round(g2 * 255), Math.round(b2 * 255)]
}

function sampleImageToColorMap(img: HTMLImageElement, w: number, h: number, cellSize: number): ImageColorMap {
  const oc = document.createElement('canvas')
  const octx = oc.getContext('2d')!
  const cols = Math.floor(w / cellSize)
  const rows = Math.floor(h / cellSize)

  // Cover-fit image
  const aspect = img.naturalWidth / img.naturalHeight
  const canvasAspect = w / h
  let sw: number, sh: number, sx: number, sy: number
  if (aspect > canvasAspect) {
    sh = img.naturalHeight
    sw = img.naturalHeight * canvasAspect
    sx = (img.naturalWidth - sw) / 2
    sy = 0
  } else {
    sw = img.naturalWidth
    sh = img.naturalWidth / canvasAspect
    sx = 0
    sy = (img.naturalHeight - sh) / 2
  }

  oc.width = cols
  oc.height = rows
  octx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows)
  const data = octx.getImageData(0, 0, cols, rows).data

  return { data, width: cols, height: rows }
}

function loadAllImages(basePath: string): Promise<void> {
  if (imageLoadPromise) return imageLoadPromise
  imageLoadPromise = Promise.all(
    PHOTO_PATHS.map(path => new Promise<HTMLImageElement>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => resolve(img) // still resolve, will skip bad images
      img.src = `${basePath}${path}`
    }))
  ).then(imgs => {
    loadedImages.push(...imgs.filter(img => img.naturalWidth > 0))
    imagesLoaded = true
  })
  return imageLoadPromise
}

// Global grass color state for image-based coloring
let grassColorMap: ImageColorMap | null = null
let grassCurrentImageIdx = 0
let grassTransitionProgress = 0
let grassTargetColorMap: ImageColorMap | null = null
let grassTransitionStart = 0
const GRASS_TRANSITION_DURATION = 2500
const GRASS_SLIDE_INTERVAL = 8000
let grassLastSlideTime = 0

function updateGrassColorMaps(w: number, h: number, cellSize: number, time: number) {
  if (!imagesLoaded || loadedImages.length === 0) return

  if (!grassColorMap) {
    grassColorMap = sampleImageToColorMap(loadedImages[0], w, h, cellSize)
    grassLastSlideTime = time
    return
  }

  // Slideshow: transition to next image periodically
  if (time - grassLastSlideTime > GRASS_SLIDE_INTERVAL && !grassTargetColorMap) {
    grassCurrentImageIdx = (grassCurrentImageIdx + 1) % loadedImages.length
    grassTargetColorMap = sampleImageToColorMap(loadedImages[grassCurrentImageIdx], w, h, cellSize)
    grassTransitionStart = time
  }

  // Handle transition
  if (grassTargetColorMap) {
    grassTransitionProgress = Math.min(1, (time - grassTransitionStart) / GRASS_TRANSITION_DURATION)
    if (grassTransitionProgress >= 1) {
      grassColorMap = grassTargetColorMap
      grassTargetColorMap = null
      grassTransitionProgress = 0
      grassLastSlideTime = time
    }
  }
}

// --- Global mouse tracking for interactive effects ---
interface MouseTrail {
  x: number
  y: number
  t: number
}

const mouseState = {
  x: -9999,
  y: -9999,
  active: false,
  trail: [] as MouseTrail[],
  trailMaxAge: 4800,
}

export function setMousePosition(x: number, y: number) {
  mouseState.x = x
  mouseState.y = y
  mouseState.active = true
  const now = performance.now()
  mouseState.trail.push({ x, y, t: now })
  while (mouseState.trail.length > 0 && now - mouseState.trail[0].t > mouseState.trailMaxAge) {
    mouseState.trail.shift()
  }
}

export function clearMousePosition() {
  mouseState.active = false
}

const waterMouseState = {
  x: -9999,
  y: -9999,
  active: false,
  trail: [] as MouseTrail[],
}

export function setWaterMouse(x: number, y: number) {
  waterMouseState.x = x
  waterMouseState.y = y
  waterMouseState.active = true
  const now = performance.now()
  waterMouseState.trail.push({ x, y, t: now })
  while (waterMouseState.trail.length > 0 && now - waterMouseState.trail[0].t > 2000) {
    waterMouseState.trail.shift()
  }
}

export function clearWaterMouse() {
  waterMouseState.active = false
}

function createDots(w: number, h: number, type: TextureType, spacing: number): Dot[] {
  const dots: Dot[] = []
  const cols = Math.floor(w / spacing)
  const rows = Math.floor(h / spacing)
  const t = currentTheme
  const isDark = t === DARK_THEME

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = (col + 0.5) * spacing + (Math.random() - 0.5) * spacing * 0.3
      const y = (row + 0.5) * spacing + (Math.random() - 0.5) * spacing * 0.3
      const phase = Math.random() * Math.PI * 2
      const speed = 0.3 + Math.random() * 0.7
      let baseSize: number, cr: number, cg: number, cb: number

      switch (type) {
        case 'grass': {
          baseSize = spacing * 0.3 + Math.random() * spacing * 0.2

          // Try to get color from image color map
          if (grassColorMap && col < grassColorMap.width && row < grassColorMap.height) {
            const idx = (row * grassColorMap.width + col) * 4
            const ir = grassColorMap.data[idx]
            const ig = grassColorMap.data[idx + 1]
            const ib = grassColorMap.data[idx + 2]
            const brightness = (ir * 0.299 + ig * 0.587 + ib * 0.114) / 255
            // Size varies with brightness like classic halftone
            baseSize = spacing * (0.15 + (1 - brightness) * 0.4)
            const [br, bg, bb] = boostColor(ir, ig, ib, isDark)
            cr = br; cg = bg; cb = bb
          } else {
            // Fallback: green hues
            const hue = 80 + Math.random() * 80
            const sat = 40 + Math.random() * 30
            const light = t.grassLight[0] + Math.random() * t.grassLight[1]
            // HSL to rough RGB
            const c = document.createElement('canvas')
            const ctx2 = c.getContext('2d')!
            ctx2.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`
            ctx2.fillRect(0, 0, 1, 1)
            const pd = ctx2.getImageData(0, 0, 1, 1).data
            cr = pd[0]; cg = pd[1]; cb = pd[2]
          }
          break
        }
        case 'tree': {
          baseSize = spacing * 0.35 + Math.random() * spacing * 0.25
          const hue = 105 + Math.random() * 25
          const sat = 50 + Math.random() * 30
          const light = t.treeLight[0] + Math.random() * t.treeLight[1]
          cr = 0; cg = 0; cb = 0
          const tmp = hslToRgb(hue, sat, light)
          cr = tmp[0]; cg = tmp[1]; cb = tmp[2]
          break
        }
        case 'oak': {
          baseSize = spacing * 0.3 + Math.random() * spacing * 0.35
          const hue = 55 + Math.random() * 85
          const sat = 35 + Math.random() * 45
          const light = t.oakLight[0] + Math.random() * t.oakLight[1]
          const tmp = hslToRgb(hue, sat, light)
          cr = tmp[0]; cg = tmp[1]; cb = tmp[2]
          break
        }
        case 'water': {
          baseSize = spacing * 0.15
          const hue = t.waterHue + Math.random() * 25
          const sat = 35 + Math.random() * 35
          const light = t.waterLight[0] + Math.random() * t.waterLight[1]
          const tmp = hslToRgb(hue, sat, light)
          cr = tmp[0]; cg = tmp[1]; cb = tmp[2]
          break
        }
        case 'roof':
        default: {
          baseSize = spacing * 0.4
          const hue = t.roofHue + Math.random() * 12
          const sat = 25 + Math.random() * 20
          const light = t.roofLight[0] + Math.random() * t.roofLight[1]
          const tmp = hslToRgb(hue, sat, light)
          cr = tmp[0]; cg = tmp[1]; cb = tmp[2]
          break
        }
      }
      dots.push({ x, y, phase, speed, baseSize, r: cr, g: cg, b: cb })
    }
  }
  return dots
}

// Simple HSL to RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100
  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

// Update grass dot colors from current image color map (with transition)
function updateGrassDotColors(dots: Dot[], w: number, h: number, spacing: number, time: number) {
  if (!imagesLoaded || loadedImages.length === 0) return

  updateGrassColorMaps(w, h, spacing, time)

  if (!grassColorMap) return
  const isDark = currentTheme === DARK_THEME
  const cols = grassColorMap.width

  for (let i = 0; i < dots.length; i++) {
    const d = dots[i]
    const col = Math.floor(d.x / spacing)
    const row = Math.floor(d.y / spacing)
    if (col >= grassColorMap.width || row >= grassColorMap.height || col < 0 || row < 0) continue

    const idx = (row * cols + col) * 4

    let fr = grassColorMap.data[idx]
    let fg = grassColorMap.data[idx + 1]
    let fb = grassColorMap.data[idx + 2]

    // If transitioning, blend with target
    if (grassTargetColorMap && grassTransitionProgress > 0) {
      const tIdx = (row * grassTargetColorMap.width + col) * 4
      if (tIdx + 2 < grassTargetColorMap.data.length) {
        const t = grassTransitionProgress
        // Smooth cubic easing
        const et = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        fr = Math.round(fr + (grassTargetColorMap.data[tIdx] - fr) * et)
        fg = Math.round(fg + (grassTargetColorMap.data[tIdx + 1] - fg) * et)
        fb = Math.round(fb + (grassTargetColorMap.data[tIdx + 2] - fb) * et)
      }
    }

    const brightness = (fr * 0.299 + fg * 0.587 + fb * 0.114) / 255
    d.baseSize = spacing * (0.15 + (1 - brightness) * 0.4)
    const [br, bg, bb] = boostColor(fr, fg, fb, isDark)
    d.r = br; d.g = bg; d.b = bb
  }
}

// Grass: wave reversed direction, half speed, mouse crush effect
function drawGrass(ctx: CanvasRenderingContext2D, w: number, h: number, dots: Dot[], time: number) {
  ctx.clearRect(0, 0, w, h)
  const angle = 0.5 + Math.sin(time * 0.00003) * 0.15
  const dirX = Math.cos(angle)
  const dirY = Math.sin(angle)
  const wavelength = 150
  const waveSpeed = -time * 0.02

  const now = performance.now()

  for (const d of dots) {
    const proj = d.x * dirX + d.y * dirY + waveSpeed
    const wave = (Math.sin((proj / wavelength) * Math.PI * 2 + d.phase * 0.3) + 1) / 2
    let sizeScale = 0.2 + wave * 1.6
    let windInfluence = 1.0

    // Mouse crush effect
    if (mouseState.active || mouseState.trail.length > 0) {
      let crushFactor = 0
      if (mouseState.active) {
        const mdx = d.x - mouseState.x
        const mdy = d.y - mouseState.y
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy)
        if (mDist < 100) {
          const intensity = 1 - mDist / 100
          crushFactor = Math.max(crushFactor, intensity * intensity)
        }
      }
      for (const tp of mouseState.trail) {
        const age = now - tp.t
        const ageFade = 1 - age / mouseState.trailMaxAge
        if (ageFade <= 0) continue
        const tdx = d.x - tp.x
        const tdy = d.y - tp.y
        const tDist = Math.sqrt(tdx * tdx + tdy * tdy)
        if (tDist < 100) {
          const intensity = (1 - tDist / 100) * ageFade
          crushFactor = Math.max(crushFactor, intensity * intensity)
        }
      }
      if (crushFactor > 0) {
        sizeScale = sizeScale * (1 - crushFactor) + 0.15 * crushFactor
        windInfluence = 1 - crushFactor
      }
    }

    const r = d.baseSize * sizeScale

    const wobbleX = Math.sin(time * 0.0004 * d.speed + d.phase) * 0.6 * windInfluence
    const wobbleY = Math.cos(time * 0.0003 * d.speed + d.phase * 1.3) * 0.5 * windInfluence
    const alpha = 0.55 + 0.35 * wave

    ctx.beginPath()
    ctx.arc(d.x + wobbleX, d.y + wobbleY, Math.max(0.3, r), 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${d.r}, ${d.g}, ${d.b}, ${alpha})`
    ctx.fill()
  }
}

function drawTree(ctx: CanvasRenderingContext2D, w: number, h: number, dots: Dot[], time: number) {
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2, cy = h / 2
  const maxR = Math.min(w, h) / 2

  for (const d of dots) {
    const dx = d.x - cx, dy = d.y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > maxR * 1.05) continue
    const edgeFade = dist < maxR * 0.65 ? 1 : Math.max(0, 1 - (dist - maxR * 0.65) / (maxR * 0.4))

    const breathe = Math.sin(time * 0.001 + dist * 0.02 + d.phase) * 0.3
    const r = d.baseSize * (0.8 + breathe)
    const wobbleX = Math.sin(time * 0.0008 * d.speed + d.phase) * 1.2
    const wobbleY = Math.cos(time * 0.0007 * d.speed + d.phase * 1.5) * 1.0
    const alpha = (0.4 + 0.2 * Math.sin(time * 0.0005 + d.phase)) * edgeFade

    ctx.beginPath()
    ctx.arc(d.x + wobbleX, d.y + wobbleY, Math.max(0.5, r), 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${d.r}, ${d.g}, ${d.b}, ${alpha})`
    ctx.fill()
  }
}

function drawOak(ctx: CanvasRenderingContext2D, w: number, h: number, dots: Dot[], time: number) {
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2, cy = h / 2
  const maxR = Math.min(w, h) / 2

  for (const d of dots) {
    const dx = d.x - cx, dy = d.y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    const edgeFade = dist < maxR * 0.5 ? 1 : Math.max(0, 1 - (dist - maxR * 0.5) / (maxR * 1.0))
    const breathe = Math.sin(time * 0.0008 + dist * 0.015 + d.phase) * 0.4
    const r = d.baseSize * (0.7 + breathe)
    const wobbleX = Math.sin(time * 0.0006 * d.speed + d.phase) * 2.0
    const wobbleY = Math.cos(time * 0.0005 * d.speed + d.phase * 1.4) * 1.8
    const alpha = (0.45 + 0.2 * Math.sin(time * 0.0004 + d.phase)) * edgeFade
    if (alpha < 0.02) continue

    ctx.beginPath()
    ctx.arc(d.x + wobbleX, d.y + wobbleY, Math.max(0.5, r), 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${d.r}, ${d.g}, ${d.b}, ${alpha})`
    ctx.fill()
  }
}

function drawWater(ctx: CanvasRenderingContext2D, w: number, h: number, _dots: Dot[], time: number) {
  ctx.clearRect(0, 0, w, h)
  const t = currentTheme

  ctx.fillStyle = `hsla(${t.waterHue}, 30%, ${t.waterLight[0]}%, 0.4)`
  ctx.fillRect(0, 0, w, h)

  const centers = 5
  for (let i = 0; i < centers; i++) {
    const cx = w * (0.1 + 0.8 * ((i * 0.618) % 1))
    const cy = h * (0.15 + 0.7 * ((i * 0.382) % 1))
    const rippleTime = time * 0.0006 + i * 1.8
    const maxRadius = Math.min(w, h) * 0.6

    for (let ring = 0; ring < 12; ring++) {
      const radius = ((rippleTime + ring * 0.6) % 8) / 8 * maxRadius
      const fadeIn = Math.min(1, radius / (maxRadius * 0.06))
      const fadeOut = Math.max(0, 1 - radius / maxRadius)
      const alpha = fadeIn * fadeOut * 0.12
      if (alpha < 0.003) continue
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.strokeStyle = `hsla(${t.waterHue + 10}, 35%, ${t.waterLight[0] + 25}%, ${alpha})`
      ctx.lineWidth = 1.2
      ctx.stroke()
    }
  }

  const now = performance.now()
  for (const tp of waterMouseState.trail) {
    const age = now - tp.t
    if (age > 2000) continue
    const progress = age / 2000
    const maxR = 80
    for (let ring = 0; ring < 5; ring++) {
      const radius = (progress + ring * 0.15) * maxR
      if (radius > maxR) continue
      const fadeOut = 1 - radius / maxR
      const alpha = fadeOut * (1 - progress) * 0.25
      if (alpha < 0.005) continue
      ctx.beginPath()
      ctx.arc(tp.x, tp.y, radius, 0, Math.PI * 2)
      ctx.strokeStyle = `hsla(${t.waterHue + 15}, 40%, ${t.waterLight[0] + 30}%, ${alpha})`
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }

  const glints = Math.floor(w * h / 2000)
  for (let i = 0; i < glints; i++) {
    const sx = ((i * 127.1 + time * 0.006) % w)
    const sy = ((i * 311.7 + Math.sin(time * 0.0002 + i) * 12) % h)
    const flicker = Math.sin(time * 0.0015 + i * 2.3) * 0.5 + 0.5
    const alpha = flicker * 0.12
    ctx.beginPath()
    ctx.arc(sx, sy, 0.6 + flicker * 0.8, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${t.waterHue - 5}, 40%, ${t.waterLight[0] + 35}%, ${alpha})`
    ctx.fill()
  }
}

function drawRoof(ctx: CanvasRenderingContext2D, w: number, h: number, _dots: Dot[], time: number) {
  ctx.clearRect(0, 0, w, h)
  const t = currentTheme
  const tileW = 18, tileH = 14
  const cols = Math.ceil(w / tileW) + 2
  const rows = Math.ceil(h / tileH) + 2

  ctx.fillStyle = `hsl(${t.roofHue}, 20%, ${t.roofLight[0]}%)`
  ctx.fillRect(0, 0, w, h)

  for (let row = 0; row < rows; row++) {
    const offset = (row % 2) * tileW * 0.5
    for (let col = 0; col < cols; col++) {
      const x = col * tileW + offset - tileW
      const y = row * tileH - tileH * 0.3
      const hShift = Math.sin(x * 0.03 + y * 0.02 + time * 0.00008) * 3
      const lShift = Math.sin(time * 0.00015 + x * 0.01 + y * 0.025 + row * 0.5) * 2

      ctx.beginPath()
      ctx.arc(x + tileW / 2, y, tileW * 0.55, 0, Math.PI, false)
      ctx.fillStyle = `hsl(${t.roofHue + hShift}, ${22 + Math.abs(lShift) * 3}%, ${t.roofLight[0] + 3 + lShift}%)`
      ctx.fill()

      ctx.beginPath()
      ctx.arc(x + tileW / 2, y, tileW * 0.55, Math.PI * 0.9, Math.PI * 0.1, true)
      ctx.strokeStyle = `hsla(${t.roofHue + 5}, 15%, ${t.roofLight[0] + 10}%, 0.15)`
      ctx.lineWidth = 0.5
      ctx.stroke()
    }
  }
}

const drawFns: Record<TextureType, typeof drawGrass> = {
  grass: drawGrass,
  tree: drawTree,
  oak: drawOak,
  water: drawWater,
  roof: drawRoof,
}

// Track last color update time per-canvas to throttle
let lastGrassColorUpdate = 0
const GRASS_COLOR_UPDATE_INTERVAL = 100 // ms between color map checks

export function useAnimatedTexture(type: TextureType, density = 10) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dotsRef = useRef<Dot[]>([])
  const rafRef = useRef<number>(0)
  const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 })

  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.parentElement?.getBoundingClientRect()
    if (!rect) return

    // Periodically update grass colors from image slideshow
    if (type === 'grass' && imagesLoaded && time - lastGrassColorUpdate > GRASS_COLOR_UPDATE_INTERVAL) {
      updateGrassDotColors(dotsRef.current, sizeRef.current.w, sizeRef.current.h, density, time)
      lastGrassColorUpdate = time
    }

    drawFns[type](ctx, rect.width, rect.height, dotsRef.current, time)
    rafRef.current = requestAnimationFrame(animate)
  }, [type, density])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Load images for grass color sampling
    if (type === 'grass') {
      const base = import.meta.env.BASE_URL || '/'
      loadAllImages(base)
    }

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (!rect) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.scale(dpr, dpr)
      sizeRef.current = { w: rect.width, h: rect.height }

      // Reset color maps on resize so they re-sample at new resolution
      if (type === 'grass') {
        grassColorMap = null
        grassTargetColorMap = null
      }

      dotsRef.current = createDots(rect.width, rect.height, type, density)
    }

    resize()
    rafRef.current = requestAnimationFrame(animate)
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [animate, density, type])

  return canvasRef
}
