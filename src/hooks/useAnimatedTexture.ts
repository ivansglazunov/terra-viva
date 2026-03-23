import { useEffect, useRef, useCallback } from 'react'

export type TextureType = 'grass' | 'tree' | 'water'

interface Particle {
  x: number
  y: number
  phase: number
  speed: number
  size: number
}

function createParticles(w: number, h: number, density: number): Particle[] {
  const particles: Particle[] = []
  const count = Math.floor((w * h) / density)
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.7,
      size: 1 + Math.random() * 2,
    })
  }
  return particles
}

function drawGrass(ctx: CanvasRenderingContext2D, w: number, h: number, particles: Particle[], time: number) {
  ctx.clearRect(0, 0, w, h)
  for (const p of particles) {
    const wave = Math.sin(time * 0.001 * p.speed + p.phase) * 3
    const waveY = Math.cos(time * 0.0008 * p.speed + p.phase * 1.3) * 1.5
    const alpha = 0.15 + 0.1 * Math.sin(time * 0.0005 + p.phase)
    ctx.beginPath()
    ctx.arc(p.x + wave, p.y + waveY, p.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(100, 180, 60, ${alpha})`
    ctx.fill()
  }
}

function drawTree(ctx: CanvasRenderingContext2D, w: number, h: number, particles: Particle[], time: number) {
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2
  const cy = h / 2
  const maxR = Math.min(w, h) / 2
  for (const p of particles) {
    const dx = p.x - cx
    const dy = p.y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > maxR) continue
    const angle = Math.atan2(dy, dx)
    const breathe = Math.sin(time * 0.0006 * p.speed + p.phase) * 4
    const nx = p.x + Math.cos(angle) * breathe
    const ny = p.y + Math.sin(angle) * breathe
    const edgeFade = 1 - (dist / maxR)
    const alpha = (0.12 + 0.08 * Math.sin(time * 0.0004 + p.phase)) * edgeFade
    ctx.beginPath()
    ctx.arc(nx, ny, p.size * 1.2, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(60, 140, 30, ${alpha})`
    ctx.fill()
  }
}

function drawWater(ctx: CanvasRenderingContext2D, w: number, h: number, particles: Particle[], time: number) {
  ctx.clearRect(0, 0, w, h)
  for (const p of particles) {
    const ripple = Math.sin(time * 0.002 * p.speed + p.phase + p.x * 0.01) * 2
    const rippleY = Math.cos(time * 0.0015 * p.speed + p.phase + p.y * 0.008) * 3
    const shimmer = 0.15 + 0.12 * Math.sin(time * 0.001 + p.phase * 2 + p.x * 0.005)
    ctx.beginPath()
    ctx.arc(p.x + ripple, p.y + rippleY, p.size * 0.8, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(169, 196, 235, ${shimmer})`
    ctx.fill()
  }
}

export function useAnimatedTexture(type: TextureType, density = 800) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)

  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    const particles = particlesRef.current

    switch (type) {
      case 'grass': drawGrass(ctx, w, h, particles, time); break
      case 'tree': drawTree(ctx, w, h, particles, time); break
      case 'water': drawWater(ctx, w, h, particles, time); break
    }

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
      particlesRef.current = createParticles(rect.width, rect.height, density)
    }

    resize()
    rafRef.current = requestAnimationFrame(animate)
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [animate, density])

  return canvasRef
}
