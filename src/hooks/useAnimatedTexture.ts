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

function createDots(w: number, h: number, type: TextureType, spacing: number): Dot[] {
  const dots: Dot[] = []
  const cols = Math.floor(w / spacing)
  const rows = Math.floor(h / spacing)

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
          hue = 90 + Math.random() * 40
          sat = 50 + Math.random() * 30
          light = 30 + Math.random() * 25
          break
        case 'tree':
          baseSize = spacing * 0.35 + Math.random() * spacing * 0.25
          hue = 100 + Math.random() * 30
          sat = 55 + Math.random() * 25
          light = 25 + Math.random() * 20
          break
        case 'oak':
          baseSize = spacing * 0.3 + Math.random() * spacing * 0.35
          hue = 60 + Math.random() * 80
          sat = 40 + Math.random() * 40
          light = 25 + Math.random() * 35
          break
        case 'water':
          baseSize = spacing * 0.15
          hue = 200 + Math.random() * 30
          sat = 40 + Math.random() * 30
          light = 55 + Math.random() * 25
          break
        case 'roof':
        default:
          baseSize = spacing * 0.4
          hue = 15 + Math.random() * 15
          sat = 30 + Math.random() * 20
          light = 12 + Math.random() * 10
          break
      }

      dots.push({ x, y, phase, speed, baseSize, hue, sat, light })
    }
  }
  return dots
}

// Grass: wave-animated circles with size oscillation
function drawGrass(ctx: CanvasRenderingContext2D, w: number, h: number, dots: Dot[], time: number) {
  ctx.clearRect(0, 0, w, h)
  const waveAngle = time * 0.00005
  const waveDirX = Math.cos(waveAngle)
  const waveDirY = Math.sin(waveAngle)

  for (const d of dots) {
    const proj = d.x * waveDirX + d.y * waveDirY + time * 0.03
    const wave = (Math.sin(proj * 0.015 + d.phase) + 1) / 2
    const sizeScale = 0.4 + wave * 1.2
    const r = d.baseSize * sizeScale

    const wobbleX = Math.sin(time * 0.0005 * d.speed + d.phase) * 0.5
    const wobbleY = Math.cos(time * 0.0004 * d.speed + d.phase * 1.3) * 0.4
    const alpha = 0.25 + 0.2 * wave

    ctx.beginPath()
    ctx.arc(d.x + wobbleX, d.y + wobbleY, Math.max(0.5, r), 0, Math.PI * 2)
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
    const edgeFade = dist < maxR * 0.7 ? 1 : Math.max(0, 1 - (dist - maxR * 0.7) / (maxR * 0.35))

    const breathe = Math.sin(time * 0.001 + dist * 0.02 + d.phase) * 0.3
    const r = d.baseSize * (0.8 + breathe)

    const wobbleX = Math.sin(time * 0.0008 * d.speed + d.phase) * 1.2
    const wobbleY = Math.cos(time * 0.0007 * d.speed + d.phase * 1.5) * 1.0
    const alpha = (0.35 + 0.15 * Math.sin(time * 0.0005 + d.phase)) * edgeFade

    ctx.beginPath()
    ctx.arc(d.x + wobbleX, d.y + wobbleY, Math.max(0.5, r), 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${d.hue}, ${d.sat}%, ${d.light}%, ${alpha})`
    ctx.fill()
  }
}

// Oak: wider color range, particles bleed beyond circle boundary
function drawOak(ctx: CanvasRenderingContext2D, w: number, h: number, dots: Dot[], time: number) {
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2, cy = h / 2
  const maxR = Math.min(w, h) / 2

  for (const d of dots) {
    const dx = d.x - cx, dy = d.y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    // Gradual fade beyond the circle — no hard edge
    const edgeFade = dist < maxR * 0.6 ? 1 : Math.max(0, 1 - (dist - maxR * 0.6) / (maxR * 0.9))

    const breathe = Math.sin(time * 0.0008 + dist * 0.015 + d.phase) * 0.4
    const r = d.baseSize * (0.7 + breathe)

    const wobbleX = Math.sin(time * 0.0006 * d.speed + d.phase) * 2.0
    const wobbleY = Math.cos(time * 0.0005 * d.speed + d.phase * 1.4) * 1.8
    const alpha = (0.4 + 0.2 * Math.sin(time * 0.0004 + d.phase)) * edgeFade

    if (alpha < 0.02) continue

    ctx.beginPath()
    ctx.arc(d.x + wobbleX, d.y + wobbleY, Math.max(0.5, r), 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${d.hue}, ${d.sat}%, ${d.light}%, ${alpha})`
    ctx.fill()
  }
}

// Water: ripple rings + shimmer highlights (no circles, efficient)
function drawWater(ctx: CanvasRenderingContext2D, w: number, h: number, _dots: Dot[], time: number) {
  ctx.clearRect(0, 0, w, h)

  // Concentric ripples from multiple centers
  const centers = 4
  for (let i = 0; i < centers; i++) {
    const cx = w * (0.15 + 0.7 * ((i * 0.618) % 1))
    const cy = h * (0.2 + 0.6 * ((i * 0.382) % 1))
    const rippleTime = time * 0.0008 + i * 1.5
    const maxRadius = Math.min(w, h) * 0.7

    for (let ring = 0; ring < 10; ring++) {
      const radius = ((rippleTime + ring * 0.7) % 7) / 7 * maxRadius
      const fadeIn = Math.min(1, radius / (maxRadius * 0.08))
      const fadeOut = Math.max(0, 1 - radius / maxRadius)
      const alpha = fadeIn * fadeOut * 0.1

      if (alpha < 0.005) continue

      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.strokeStyle = `hsla(210, 50%, 75%, ${alpha})`
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }

  // Shimmer highlights
  const shimmerCount = Math.floor(w * h / 1500)
  for (let i = 0; i < shimmerCount; i++) {
    const sx = ((i * 127.1 + time * 0.008) % w)
    const sy = ((i * 311.7 + Math.sin(time * 0.0003 + i) * 15) % h)
    const flicker = Math.sin(time * 0.002 + i * 2.3) * 0.5 + 0.5
    const alpha = flicker * 0.18

    ctx.beginPath()
    ctx.arc(sx, sy, 0.8 + flicker, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(200, 60%, 82%, ${alpha})`
    ctx.fill()
  }
}

// Roof: dark tile pattern
function drawRoof(ctx: CanvasRenderingContext2D, w: number, h: number, _dots: Dot[], time: number) {
  ctx.clearRect(0, 0, w, h)
  const tileW = 22, tileH = 11
  const cols = Math.ceil(w / tileW) + 1
  const rows = Math.ceil(h / tileH) + 1

  for (let row = 0; row < rows; row++) {
    const offset = (row % 2) * tileW * 0.5
    for (let col = 0; col < cols; col++) {
      const x = col * tileW + offset
      const y = row * tileH
      const hueShift = Math.sin(x * 0.04 + y * 0.03 + time * 0.0001) * 4
      const lightShift = Math.sin(time * 0.0002 + x * 0.015 + y * 0.03) * 2

      ctx.fillStyle = `hsl(${18 + hueShift}, 28%, ${11 + lightShift}%)`
      ctx.fillRect(x + 0.5, y + 0.5, tileW - 1, tileH - 1)
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
    const w = rect.width
    const h = rect.height

    drawFns[type](ctx, w, h, dotsRef.current, time)
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
