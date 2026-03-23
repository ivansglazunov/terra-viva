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
  grassHue: [number, number]    // [base, range]
  grassLight: [number, number]  // [base, range]
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

// Global theme ref for canvas draw functions
let currentTheme: ThemeColors = DARK_THEME
export function setTextureTheme(t: ThemeColors) { currentTheme = t }

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
        case 'grass':
          baseSize = spacing * 0.3 + Math.random() * spacing * 0.2
          hue = t.grassHue[0] + Math.random() * t.grassHue[1]
          sat = 45 + Math.random() * 35
          light = t.grassLight[0] + Math.random() * t.grassLight[1]
          break
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

// Grass: strong traveling wave at ~30° angle, ~150px wavelength
// Peaks = large circles, troughs = small circles
function drawGrass(ctx: CanvasRenderingContext2D, w: number, h: number, dots: Dot[], time: number) {
  ctx.clearRect(0, 0, w, h)
  // Fixed angle ~30° with slow drift
  const angle = 0.5 + Math.sin(time * 0.00003) * 0.15
  const dirX = Math.cos(angle)
  const dirY = Math.sin(angle)
  const wavelength = 150 // ~150px between wave crests
  const waveSpeed = time * 0.04 // traveling speed

  for (const d of dots) {
    const proj = d.x * dirX + d.y * dirY + waveSpeed
    const wave = (Math.sin((proj / wavelength) * Math.PI * 2 + d.phase * 0.3) + 1) / 2
    // Strong size modulation: 0.2x at trough, 1.8x at peak
    const sizeScale = 0.2 + wave * 1.6
    const r = d.baseSize * sizeScale

    const wobbleX = Math.sin(time * 0.0004 * d.speed + d.phase) * 0.6
    const wobbleY = Math.cos(time * 0.0003 * d.speed + d.phase * 1.3) * 0.5
    const alpha = 0.2 + 0.35 * wave

    ctx.beginPath()
    ctx.arc(d.x + wobbleX, d.y + wobbleY, Math.max(0.3, r), 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${d.hue}, ${d.sat}%, ${d.light}%, ${alpha})`
    ctx.fill()
  }
}

// Tree (ель): breathing oscillation from center
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

// Oak: wider color range, particles bleed beyond boundary
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

// Water: dark noble tones, ripple rings + glints
function drawWater(ctx: CanvasRenderingContext2D, w: number, h: number, _dots: Dot[], time: number) {
  ctx.clearRect(0, 0, w, h)
  const t = currentTheme

  // Deep base fill
  ctx.fillStyle = `hsla(${t.waterHue}, 30%, ${t.waterLight[0]}%, 0.4)`
  ctx.fillRect(0, 0, w, h)

  // Concentric ripples
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

// Roof: scalloped tile pattern (overlapping semicircles like real roof tiles)
function drawRoof(ctx: CanvasRenderingContext2D, w: number, h: number, _dots: Dot[], time: number) {
  ctx.clearRect(0, 0, w, h)
  const t = currentTheme
  const tileW = 18, tileH = 14
  const cols = Math.ceil(w / tileW) + 2
  const rows = Math.ceil(h / tileH) + 2

  // Dark background
  ctx.fillStyle = `hsl(${t.roofHue}, 20%, ${t.roofLight[0]}%)`
  ctx.fillRect(0, 0, w, h)

  for (let row = 0; row < rows; row++) {
    const offset = (row % 2) * tileW * 0.5
    for (let col = 0; col < cols; col++) {
      const x = col * tileW + offset - tileW
      const y = row * tileH - tileH * 0.3
      const hShift = Math.sin(x * 0.03 + y * 0.02 + time * 0.00008) * 3
      const lShift = Math.sin(time * 0.00015 + x * 0.01 + y * 0.025 + row * 0.5) * 2

      // Scallop (overlapping arc) shape
      ctx.beginPath()
      ctx.arc(x + tileW / 2, y, tileW * 0.55, 0, Math.PI, false)
      ctx.fillStyle = `hsl(${t.roofHue + hShift}, ${22 + Math.abs(lShift) * 3}%, ${t.roofLight[0] + 3 + lShift}%)`
      ctx.fill()

      // Subtle highlight on top edge
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
