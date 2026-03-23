import { useEffect, useRef } from 'react'
import { useReveal } from '../hooks/useReveal'

const CRITERIA = [
  { label: 'Экология', sub: 'Натуральные материалы', hue: 120, val: 0.95 },
  { label: 'Эстетика', sub: 'Гармония форм', hue: 45, val: 0.92 },
  { label: 'Функция', sub: 'Удобство жизни', hue: 200, val: 0.88 },
  { label: 'Надёжность', sub: 'Долговечные решения', hue: 30, val: 0.94 },
  { label: 'Уход', sub: 'Минимум забот', hue: 80, val: 0.85 },
  { label: 'Сроки', sub: 'Точно в план', hue: 160, val: 0.9 },
]

function CritRing({ hue, val, size = 90 }: { hue: number; val: number; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = 2
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const maxR = size / 2 - 7
    const totalDots = 36
    const filledCount = Math.round(totalDots * val)

    for (let i = 0; i < totalDots; i++) {
      const angle = (i / totalDots) * Math.PI * 2 - Math.PI / 2
      const x = cx + Math.cos(angle) * maxR
      const y = cy + Math.sin(angle) * maxR
      const filled = i < filledCount

      ctx.beginPath()
      ctx.arc(x, y, filled ? 3 : 1.5, 0, Math.PI * 2)
      ctx.fillStyle = filled ? `hsl(${hue}, 65%, 50%)` : `hsl(${hue}, 20%, 25%)`
      ctx.globalAlpha = filled ? 0.95 : 0.3
      ctx.fill()
    }

    ctx.globalAlpha = 1
    ctx.fillStyle = `hsl(${hue}, 55%, 60%)`
    ctx.font = `300 ${size * 0.17}px "Cormorant Garamond", serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(Math.round(val * 100) + '%', cx, cy)
  }, [hue, val, size])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
    />
  )
}

export function Criteria() {
  const ref = useReveal()

  return (
    <section style={{
      position: 'relative',
      padding: '6rem 2rem',
      background: 'var(--bg-dark)',
      zIndex: 5,
    }}>
      <div ref={ref} style={{
        maxWidth: 1000,
        margin: '0 auto',
        opacity: 0,
        transform: 'translateY(30px)',
        transition: 'opacity 1s ease, transform 1s ease',
      }}>
        <h2 style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          color: 'var(--cream)',
          textAlign: 'center',
          marginBottom: '3rem',
        }}>
          Критерии качества
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '2rem',
        }}>
          {CRITERIA.map((c) => (
            <div key={c.label} style={{ textAlign: 'center' }}>
              <CritRing hue={c.hue} val={c.val} />
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '1rem',
                color: 'var(--cream)',
                marginTop: '0.5rem',
              }}>{c.label}</div>
              <div style={{
                fontSize: '0.7rem',
                color: 'var(--stone)',
                opacity: 0.5,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginTop: '0.3rem',
              }}>{c.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
