import { useEffect, useRef, useCallback } from 'react'

export type TextureType = 'grass' | 'tree' | 'water' | 'oak' | 'roof'

interface Dot {
  x: number
  y: number
  phase: number
  speed: number
  baseSize: number
  hue: number
  sat: number
  light: number
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

// --- Global mouse tracking for interactive effects ---
interface MouseTrail {
  x: number
  y: number
  t: number // timestamp
}

const mouseState = {
  x: -9999,
  y: -9999,
  active: false,
  trail: [] as MouseTrail[],
  trailMaxAge: 4800, // 4x longer trail
}

export function setMousePosition(x: number, y: number) {
  mouseState.x = x
  mouseState.y = y
  mouseState.active = true
  const now = performance.now()
  mouseState.trail.push({ x, y, t: now })
  // Keep only recent trail points
  while (mouseState.trail.length > 0 && now - mouseState.trail[0].t > mouseState.trailMaxAge) {
    mouseState.trail.shift()
  }
}

export function clearMousePosition() {
  mouseState.active = false
}

// Per-canvas mouse tracking for water
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

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = (col + 0.5) * spacing + (Math.random() - 0.5) * spacing * 0.3
      const y = (row + 0.5) * spacing + (Math.random() - 0.5) * spacing * 0.3
      const phase = Math.random() * Math.PI * 2
      const speed = 0.3 + Math.random() * 0.7
      let baseSize: number, hue: number, sat: number, light: number

      switch (type) {
        case 'grass': {
          baseSize = spacing * 0.3 + Math.random() * spacing * 0.2
          // Multi-color palette like terra-viva-v3 halftone
          const r = Math.random()
          if (r < 0.45) {
            hue = 80 + Math.random() * 80      // greens (dominant)
          } else if (r < 0.62) {
            hue = 50 + Math.random() * 30       // yellow-green
          } else if (r < 0.78) {
            hue = 160 + Math.random() * 50      // teal-cyan
          } else if (r < 0.90) {
            hue = 210 + Math.random() * 40      // blue
          } else {
            hue = 270 + Math.random() * 40      // purple
          }
          // Spatial clustering via noise
          const spatialNoise = Math.sin(x * 0.02 + y * 0.015) * 25
            + Math.cos(x * 0.008 - y * 0.025) * 15
          hue = ((hue + spatialNoise) % 360 + 360) % 360
          sat = 40 + Math.random() * 45
          light = t.grassLight[0] + Math.random() * t.grassLight[1]
          break
        }
        case 'tree':
          baseSize = spacing * 0.35 + Math.random() * spacing * 0.25
          hue = 105 + Math.random() * 25
          sat = 50 + Math.random() * 30
          light = t.treeLight[0] + Math.random() * t.treeLight[1]
          break
        case 'oak':
          baseSize = spacing * 0.3 + Math.random() * spacing * 0.35
          hue = 55 + Math.random() * 85
          sat = 35 + Math.random() * 45
          light = t.oakLight[0] + Math.random() * t.oakLight[1]
          break
        case 'water':
          baseSize = spacing * 0.15
          hue = t.waterHue + Math.random() * 25
          sat = 35 + Math.random() * 35
          light = t.waterLight[0] + Math.random() * t.waterLight[1]
          break
        case 'roof':
        default:
          baseSize = spacing * 0.4
          hue = t.roofHue + Math.random() * 12
          sat = 25 + Math.random() * 20
          light = t.roofLight[0] + Math.random() * t.roofLight[1]
          break
      }
      dots.push({ x, y, phase, speed, baseSize, hue, sat, light })
    }
  }
  return dots
}

// Grass: wave reversed direction, half speed, mouse crush effect
function drawGrass(ctx: CanvasRenderingContext2D, w: number, h: number, dots: Dot[], time: number) {
  ctx.clearRect(0, 0, w, h)
  const angle = 0.5 + Math.sin(time * 0.00003) * 0.15
  const dirX = Math.cos(angle)
  const dirY = Math.sin(angle)
  const wavelength = 150
  // Reversed direction (negative), half speed (0.02 instead of 0.04)
  const waveSpeed = -time * 0.02

  const now = performance.now()

  for (const d of dots) {
    const proj = d.x * dirX + d.y * dirY + waveSpeed
    const wave = (Math.sin((proj / wavelength) * Math.PI * 2 + d.phase * 0.3) + 1) / 2
    // Min 0.2, max 1.8
    let sizeScale = 0.2 + wave * 1.6
    let windInfluence = 1.0

    // Mouse crush effect: check distance to current mouse and trail
    if (mouseState.active || mouseState.trail.length > 0) {
      let crushFactor = 0
      // Current mouse position
      if (mouseState.active) {
        const mdx = d.x - mouseState.x
        const mdy = d.y - mouseState.y
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy)
        if (mDist < 100) {
          const intensity = 1 - mDist / 100
          crushFactor = Math.max(crushFactor, intensity * intensity)
        }
      }
      // Trail positions (decaying over time)
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
        // Crush: shrink to 0.15 and lose wind
        sizeScale = sizeScale * (1 - crushFactor) + 0.15 * crushFactor
        windInfluence = 1 - crushFactor
      }
    }

    const r = d.baseSize * sizeScale

    const wobbleX = Math.sin(time * 0.0004 * d.speed + d.phase) * 0.6 * windInfluence
    const wobbleY = Math.cos(time * 0.0003 * d.speed + d.phase * 1.3) * 0.5 * windInfluence
    const alpha = 0.2 + 0.35 * wave

    ctx.beginPath()
    ctx.arc(d.x + wobbleX, d.y + wobbleY, Math.max(0.3, r), 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${d.hue}, ${d.sat}%, ${d.light}%, ${alpha})`
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
    ctx.fillStyle = `hsla(${d.hue}, ${d.sat}%, ${d.light}%, ${alpha})`
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
    ctx.fillStyle = `hsla(${d.hue}, ${d.sat}%, ${d.light}%, ${alpha})`
    ctx.fill()
  }
}

// Water: ripples + mouse-following waves
function drawWater(ctx: CanvasRenderingContext2D, w: number, h: number, _dots: Dot[], time: number) {
  ctx.clearRect(0, 0, w, h)
  const t = currentTheme

  ctx.fillStyle = `hsla(${t.waterHue}, 30%, ${t.waterLight[0]}%, 0.4)`
  ctx.fillRect(0, 0, w, h)

  // Ambient concentric ripples
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

  // Mouse-following ripples
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

  // Subtle glints
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

// Roof: scalloped tiles
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

export function useAnimatedTexture(type: TextureType, density = 10) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dotsRef = useRef<Dot[]>([])
  const rafRef = useRef<number>(0)

  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.parentElement?.getBoundingClientRect()
    if (!rect) return

    drawFns[type](ctx, rect.width, rect.height, dotsRef.current, time)
    rafRef.current = requestAnimationFrame(animate)
  }, [type])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

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
