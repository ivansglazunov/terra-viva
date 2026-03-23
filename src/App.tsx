import { useEffect, useRef, useState } from 'react'
import { AnimatedTexture } from './components/AnimatedTexture'
import './App.css'

// Drawio coordinate system
const CANVAS_W = 840
const CANVAS_H = 2390

// Smooth catmull-rom curve through points
function pointsToPath(pts: [number, number][]): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(i + 2, pts.length - 1)]
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`
  }
  return d
}

// Road points from drawio
const mainRoadPoints: [number, number][] = [
  [467, 1913], [340, 1410], [780, 1250], [840, 870], [420, 950],
  [40, 850], [20, 560], [300, 430], [560, 480], [630, 620],
  [640, 460], [420, 380], [424, 317],
]
const streamPoints: [number, number][] = [
  [580, 858], [500, 880], [360, 890], [240, 870], [130, 810],
  [80, 730], [80, 660], [110, 580], [180, 530], [260, 510],
  [340, 490], [440, 500], [528, 526],
]
const branchLeftPoints: [number, number][] = [[-540, 775], [-260, 655], [32, 665]]
const branchRightPoints: [number, number][] = [[790, 930], [1070, 810], [1362, 820]]

// Trees from drawio
const leftTrees = [
  { x: 100, y: 20, size: 80 },
  { x: 10, y: 40, size: 120 },
  { x: -30, y: 130, size: 150 },
  { x: 0, y: 260, size: 210 },
]
const rightTrees = [
  { x: 660, y: 20, size: 80 },
  { x: 707, y: 40, size: 120 },
  { x: 720, y: 130, size: 150 },
  { x: 630, y: 260, size: 210 },
]

// Services from v3
const services = [
  { num: '01', x: -50, y: 1060, name: 'Проектирование', desc: 'Концепция, планировка, 3D-визуализация' },
  { num: '02', x: 150, y: 1060, name: 'Благоустройство', desc: 'Мощение, подпорные стенки, натуральный камень' },
  { num: '03', x: 350, y: 1060, name: 'Озеленение', desc: 'Посадка деревьев, формовка ниваки' },
  { num: '04', x: -50, y: 1260, name: 'Дренажные системы', desc: 'Защита от подтопления и застоя воды' },
  { num: '05', x: 150, y: 1260, name: 'Системы автополива', desc: 'Интеллектуальный полив с датчиками' },
  { num: '06', x: -50, y: 1460, name: 'Электрика и освещение', desc: 'Архитектурная подсветка ландшафта' },
  { num: '07', x: 150, y: 1460, name: 'Геопластика', desc: 'Моделирование рельефа: холмы, террасы' },
]

// Criteria from v3
const criteria = [
  { x: 600, y: 1480, label: 'Полив', sub: 'irrigation', hue: 120, val: 0.95 },
  { x: 695, y: 1480, label: 'Удобрения', sub: 'nutrition', hue: 80, val: 0.88 },
  { x: 790, y: 1480, label: 'Здоровье', sub: 'vitality', hue: 160, val: 0.92 },
  { x: 600, y: 1590, label: 'Дренаж', sub: 'drainage', hue: 200, val: 0.90 },
  { x: 695, y: 1590, label: 'Дизайн', sub: 'design fit', hue: 35, val: 0.85 },
  { x: 790, y: 1590, label: 'Освещение', sub: 'lighting', hue: 280, val: 0.87 },
]

// Compass dots around "О нас" circle (center ~667, 667)
const compassDots: [number, number][] = []
for (let i = 0; i < 8; i++) {
  const angle = (i / 8) * Math.PI * 2 - Math.PI / 2
  compassDots.push([667.5 + Math.cos(angle) * 115, 667.5 + Math.sin(angle) * 115])
}

// Criteria ring canvas component
function CritRing({ hue, val, size = 80 }: { hue: number; val: number; size?: number }) {
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
    const cx = size / 2, cy = size / 2, maxR = size / 2 - 6
    const totalDots = 32
    const filledCount = Math.round(totalDots * val)
    for (let i = 0; i < totalDots; i++) {
      const angle = (i / totalDots) * Math.PI * 2 - Math.PI / 2
      const x = cx + Math.cos(angle) * maxR
      const y = cy + Math.sin(angle) * maxR
      const filled = i < filledCount
      ctx.beginPath()
      ctx.arc(x, y, filled ? 2.5 : 1.2, 0, Math.PI * 2)
      ctx.fillStyle = filled ? `hsl(${hue}, 60%, 55%)` : `hsl(${hue}, 20%, 25%)`
      ctx.globalAlpha = filled ? 0.9 : 0.3
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.fillStyle = `hsl(${hue}, 50%, 60%)`
    ctx.font = `300 ${size * 0.18}px "Cormorant Garamond", serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(Math.round(val * 100) + '%', cx, cy)
  }, [hue, val, size])
  return <canvas ref={canvasRef} style={{ width: size, height: size }} />
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const resize = () => setScale(window.innerWidth / CANVAS_W)
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Foliage darkening gradient via CSS — applied as a gradient overlay
  const foliageDarken = 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 40%, rgba(0,10,0,0.15) 60%, rgba(0,8,0,0.35) 80%, rgba(0,5,0,0.5) 100%)'

  return (
    <div ref={containerRef} style={{ width: '100vw', overflowX: 'hidden' }}>
      <div style={{
        width: CANVAS_W,
        height: CANVAS_H,
        position: 'relative',
        transformOrigin: 'top left',
        transform: `scale(${scale})`,
        background: 'linear-gradient(180deg, #336600 0%, #1A3300 50%, #0d1a00 100%)',
        overflow: 'visible',
      }}>
        {/* Grass texture — wave-animated circles over entire canvas */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <AnimatedTexture type="grass" density={10} />
        </div>

        {/* Foliage darkening overlay toward bottom */}
        <div style={{
          position: 'absolute', inset: 0,
          background: foliageDarken,
          pointerEvents: 'none',
          zIndex: 2,
        }} />

        {/* === WATER ELLIPSES with ripple animation === */}
        <div style={{
          position: 'absolute', left: 100, top: 510,
          width: 535.5, height: 357,
          borderRadius: '50%',
          background: 'rgba(100, 160, 210, 0.15)',
          overflow: 'hidden', zIndex: 3,
        }}>
          <AnimatedTexture type="water" density={8} />
        </div>
        <div style={{
          position: 'absolute', left: 490, top: 494,
          width: 347, height: 347,
          borderRadius: '50%',
          background: 'rgba(100, 160, 210, 0.12)',
          overflow: 'hidden', zIndex: 3,
        }}>
          <AnimatedTexture type="water" density={8} />
        </div>

        {/* === SVG OVERLAY: roads + stream === */}
        <svg style={{
          position: 'absolute', top: 0, left: -150,
          width: 1140, height: CANVAS_H,
          pointerEvents: 'none', zIndex: 4,
        }} viewBox="-150 0 1140 2390">
          <path d={pointsToPath(mainRoadPoints)} stroke="#663300" strokeWidth={34} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={pointsToPath(branchLeftPoints)} stroke="#663300" strokeWidth={34} fill="none" strokeLinecap="round" opacity={0.7} />
          <path d={pointsToPath(branchRightPoints)} stroke="#663300" strokeWidth={34} fill="none" strokeLinecap="round" opacity={0.7} />
          <path d={pointsToPath(streamPoints)} stroke="#E6E6E6" strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.25} />
        </svg>

        {/* === HERO: Dark roof texture + TERRA VIVA === */}
        <div style={{
          position: 'absolute', left: 379.75, top: 0,
          width: 68.5, height: 68.5,
          background: '#2a1800',
          zIndex: 5,
        }} />
        <div style={{
          position: 'absolute', left: 160, top: 68.5,
          width: 520, height: 280,
          borderRadius: 15, overflow: 'hidden',
          zIndex: 5,
        }}>
          {/* Dark tile roof texture */}
          <AnimatedTexture type="roof" density={20} />
          {/* White text overlay centered */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            zIndex: 6,
          }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 54, fontWeight: 300,
              color: 'white', letterSpacing: '0.12em',
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            }}>TERRA VIVA</div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 13, fontWeight: 300,
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '0.25em', marginTop: 6,
              textTransform: 'uppercase',
            }}>живая земля · ландшафтная архитектура</div>
          </div>
        </div>

        {/* === TREES (ели) — left === */}
        {leftTrees.map((t, i) => (
          <div key={`lt${i}`} style={{
            position: 'absolute', left: t.x, top: t.y,
            width: t.size, height: t.size,
            borderRadius: '50%', overflow: 'hidden',
            zIndex: 5,
          }}>
            <AnimatedTexture type="tree" density={7} />
          </div>
        ))}

        {/* === TREES (ели) — right === */}
        {rightTrees.map((t, i) => (
          <div key={`rt${i}`} style={{
            position: 'absolute', left: t.x, top: t.y,
            width: t.size, height: t.size,
            borderRadius: '50%', overflow: 'hidden',
            zIndex: 5,
          }}>
            <AnimatedTexture type="tree" density={7} />
          </div>
        ))}

        {/* === "О нас" white circle: (560, 560) 215×215 === */}
        <div style={{
          position: 'absolute', left: 560, top: 560,
          width: 215, height: 215,
          borderRadius: '50%', background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 6,
        }}>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 42, fontWeight: 300, color: '#333',
          }}>О нас</span>
        </div>

        {/* Compass dots */}
        {compassDots.map(([cx, cy], i) => (
          <div key={`cd${i}`} style={{
            position: 'absolute', left: cx - 17, top: cy - 17,
            width: 34, height: 34,
            borderRadius: '50%', background: '#E6E6E6',
            opacity: 0.2, zIndex: 6,
          }} />
        ))}

        {/* === About text: elegant thin font over water zone === */}
        <div style={{
          position: 'absolute', left: 130, top: 590,
          width: 402, height: 200,
          zIndex: 6,
          display: 'flex', alignItems: 'center',
        }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 18, fontWeight: 300,
            lineHeight: 1.8,
            color: 'rgba(255, 255, 255, 0.85)',
            fontStyle: 'italic',
          }}>
            Мы создаём живые пространства, где природа и архитектура становятся единым целым.
            Каждый проект — диалог с землёй: мы слушаем рельеф, читаем свет и воплощаем
            пространства, которые живут собственной жизнью.
          </p>
        </div>

        {/* === "Направления" title: (120, 970) === */}
        <div style={{
          position: 'absolute', left: 120, top: 970,
          width: 402, height: 80, zIndex: 6,
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 32, fontWeight: 300, color: 'var(--cream)',
          display: 'flex', alignItems: 'center',
        }}>Направления</div>

        {/* === OAK trees — larger crown, particles bleed beyond === */}
        <div style={{
          position: 'absolute', left: 525, top: 885,
          width: 290, height: 290,
          overflow: 'visible', zIndex: 5,
        }}>
          <div style={{
            position: 'absolute', inset: -40,
            overflow: 'hidden',
          }}>
            <AnimatedTexture type="oak" density={8} />
          </div>
        </div>
        {/* Oak branch (smaller) */}
        <div style={{
          position: 'absolute', left: 700, top: 933,
          width: 166, height: 166,
          overflow: 'visible', zIndex: 5,
        }}>
          <div style={{
            position: 'absolute', inset: -25,
            overflow: 'hidden',
          }}>
            <AnimatedTexture type="oak" density={8} />
          </div>
        </div>

        {/* === SERVICE CARDS 01-07 with content === */}
        {services.map((s) => (
          <div key={s.num} style={{
            position: 'absolute', left: s.x, top: s.y,
            width: 180, height: 180,
            borderRadius: 15, overflow: 'hidden',
            zIndex: 6,
          }}>
            <AnimatedTexture type="grass" density={12} />
            <div style={{
              position: 'relative', zIndex: 3,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              height: '100%', padding: '16px 12px',
              textAlign: 'center',
            }}>
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 28, color: 'rgba(255,255,255,0.4)',
              }}>{s.num}</span>
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 15, color: 'rgba(255,255,255,0.9)',
                marginTop: 4, fontWeight: 400,
              }}>{s.name}</span>
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 9, color: 'rgba(255,255,255,0.5)',
                marginTop: 6, lineHeight: 1.4,
              }}>{s.desc}</span>
            </div>
          </div>
        ))}

        {/* === "Критерии качества" title: (534, 1380) === */}
        <div style={{
          position: 'absolute', left: 534, top: 1380,
          width: 402, height: 80, zIndex: 6,
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 32, fontWeight: 300, color: 'var(--cream)',
          display: 'flex', alignItems: 'center',
        }}>Критерии качества</div>

        {/* === Criteria circles with ring canvases + labels === */}
        {criteria.map((c, i) => (
          <div key={`crit${i}`} style={{
            position: 'absolute', left: c.x, top: c.y,
            width: 80, height: 105,
            zIndex: 6, textAlign: 'center',
          }}>
            <CritRing hue={c.hue} val={c.val} size={80} />
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 11, color: 'var(--cream)',
              marginTop: 2,
            }}>{c.label}</div>
            <div style={{
              fontSize: 8, color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>{c.sub}</div>
          </div>
        ))}

        {/* === Diamond / rhombus: (200, 1560) 440×440 === */}
        <div style={{
          position: 'absolute', left: 200, top: 1560,
          width: 440, height: 440,
          background: '#663300', transform: 'rotate(45deg)',
          zIndex: 5,
        }} />

        {/* === Contact: (219, 1701.5) === */}
        <div style={{
          position: 'absolute', left: 219, top: 1701.5,
          width: 402, height: 157, zIndex: 6,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 32, fontWeight: 300, color: 'var(--cream)',
          }}>Начнём проект</div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 15, fontWeight: 300,
            color: 'rgba(255,255,255,0.6)', marginTop: 8, lineHeight: 1.5,
          }}>Расскажите о вашем участке — мы предложим решение</div>
        </div>

        {/* === СВЯЗАТЬСЯ button: (340, 1830) 160×60 === */}
        <a href="tel:+79263207755" style={{
          position: 'absolute', left: 340, top: 1830,
          width: 160, height: 60,
          background: 'white', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none', zIndex: 6,
        }}>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#333' }}>СВЯЗАТЬСЯ</span>
          <span style={{ fontSize: 10, color: '#666', marginTop: 2 }}>+79263207755</span>
        </a>

        {/* === Philosophy quote: (161.56, 2070) === */}
        <div style={{
          position: 'absolute', left: 161.56, top: 2070,
          width: 516.87, height: 260, zIndex: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 32, fontWeight: 300, fontStyle: 'italic',
            color: '#FFFF00', lineHeight: 1.5,
          }}>
            «Ландшафт — это не декорация. Это живая система, которая дышит, растёт и меняется вместе с вами.»
          </p>
        </div>
      </div>

      {/* Spacer for scaled height */}
      <div style={{ height: CANVAS_H * scale - CANVAS_H, pointerEvents: 'none' }} />
    </div>
  )
}

export default App
