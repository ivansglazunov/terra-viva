import { useEffect, useRef, useState, createContext, useContext, useCallback } from 'react'
import { AnimatedTexture } from './components/AnimatedTexture'
import { LIGHT_THEME, DARK_THEME, setTextureTheme, setMousePosition, clearMousePosition } from './hooks/useAnimatedTexture'
import './App.css'

const ThemeCtx = createContext<{ dark: boolean; toggle: () => void }>({ dark: true, toggle: () => {} })

const W = 840, H = 2390

const palette = {
  light: {
    bg: 'linear-gradient(180deg, #4a7a2e 0%, #2d5a1a 40%, #1a3d0f 70%, #0e2208 100%)',
    road: '#5a3a1a',
    roadOp: 0.85,
    water: 'rgba(25, 60, 90, 0.55)',
    water2: 'rgba(20, 50, 80, 0.45)',
    cream: '#f5f0e6',
    gold: '#c9a84c',
    stone: '#b8a88a',
    stoneLight: '#d4c8b0',
    verandaBg: 'radial-gradient(circle, #e8e0d0 0%, #d4cbb8 50%, #b8a890 100%)',
    verandaBorder: '#a89878',
    verandaText: '#3a3020',
    diamond: 'linear-gradient(135deg, #5a3a1a 0%, #8b6340 50%, #5a3a1a 100%)',
    cardBg: 'rgba(255, 255, 255, 0.15)',
    cardBorder: 'rgba(255, 255, 255, 0.2)',
    quote: '#c9a84c',
    overlay: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 30%, rgba(0,15,0,0.1) 55%, rgba(0,10,0,0.25) 75%, rgba(0,5,0,0.45) 100%)',
    stream: 'rgba(180, 200, 220, 0.3)',
    marbleBg: 'linear-gradient(180deg, #f0ece4 0%, #e0d8cc 30%, #d4ccc0 60%, #c8bfb0 100%)',
    marbleSide: 'linear-gradient(180deg, #b0a590 0%, #8a7d68 50%, #6a5f4c 100%)',
    marbleText: '#2a2018',
  },
  dark: {
    bg: 'linear-gradient(180deg, #1a2e10 0%, #0f1f08 35%, #080f04 65%, #030802 100%)',
    road: '#3d2810',
    roadOp: 0.7,
    water: 'rgba(10, 35, 60, 0.65)',
    water2: 'rgba(8, 30, 50, 0.55)',
    cream: '#e8dcc8',
    gold: '#a8883c',
    stone: '#8a7a60',
    stoneLight: '#b0a088',
    verandaBg: 'radial-gradient(circle, #d4cbb8 0%, #b8a890 30%, #a09078 60%, #887860 100%)',
    verandaBorder: '#8a7a60',
    verandaText: '#2a2018',
    diamond: 'linear-gradient(135deg, #2a1a08 0%, #4a3018 50%, #2a1a08 100%)',
    cardBg: 'rgba(0, 0, 0, 0.25)',
    cardBorder: 'rgba(0, 0, 0, 0.3)',
    quote: '#a8883c',
    overlay: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 25%, rgba(0,8,0,0.15) 50%, rgba(0,5,0,0.35) 75%, rgba(0,3,0,0.55) 100%)',
    stream: 'rgba(120, 140, 160, 0.15)',
    marbleBg: 'linear-gradient(180deg, #d4ccc0 0%, #c0b8a8 30%, #a89888 60%, #908070 100%)',
    marbleSide: 'linear-gradient(180deg, #706050 0%, #504030 50%, #3a2e20 100%)',
    marbleText: '#f0ece4',
  },
}

function pts2path(pts: [number, number][]): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)]
    d += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6}, ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6}, ${p2[0]} ${p2[1]}`
  }
  return d
}

// Road: starts from hero, goes right around Направления, left through center,
// left around Критерии, then center down to diamond top
const mainRoad: [number, number][] = [
  [424, 317],
  [420, 380], [640, 460], [630, 620],
  [560, 480], [300, 430], [20, 560],
  [40, 850],
  // Goes RIGHT around Направления (center ~420, y~1100)
  [420, 950],
  [750, 1000], [780, 1150], [700, 1250],
  // Crosses center to left
  [420, 1300], [150, 1350],
  // Goes LEFT around Критерии (center ~420, y~1450)
  [80, 1400], [60, 1500], [150, 1580],
  // Back to center, down to diamond
  [300, 1560], [420, 1560],
]

const stream: [number, number][] = [
  [580, 858], [500, 880], [360, 890], [240, 870], [130, 810],
  [80, 730], [80, 660], [110, 580], [180, 530], [260, 510],
  [340, 490], [440, 500], [528, 526],
]
const branchL: [number, number][] = [[-540, 775], [-260, 655], [32, 665]]
const branchR: [number, number][] = [[790, 930], [1070, 810], [1362, 820]]

const leftTrees = [
  { x: 100, y: 20, s: 80 }, { x: 10, y: 40, s: 120 },
  { x: -30, y: 130, s: 150 }, { x: 0, y: 260, s: 210 },
]
const rightTrees = [
  { x: 660, y: 20, s: 80 }, { x: 707, y: 40, s: 120 },
  { x: 720, y: 130, s: 150 }, { x: 630, y: 260, s: 210 },
]

// Services centered
const services = [
  { num: '01', col: 0, row: 0, name: 'Проектирование', desc: 'Концепция, планировка, 3D-визуализация' },
  { num: '02', col: 1, row: 0, name: 'Благоустройство', desc: 'Мощение, подпорные стенки, натуральный камень' },
  { num: '03', col: 2, row: 0, name: 'Озеленение', desc: 'Посадка деревьев, формовка ниваки' },
  { num: '04', col: 0, row: 1, name: 'Дренажные системы', desc: 'Защита от подтопления и застоя воды' },
  { num: '05', col: 1, row: 1, name: 'Системы автополива', desc: 'Интеллектуальный полив с датчиками' },
  { num: '06', col: 0, row: 2, name: 'Электрика и освещение', desc: 'Архитектурная подсветка ландшафта' },
  { num: '07', col: 1, row: 2, name: 'Геопластика', desc: 'Моделирование рельефа: холмы, террасы' },
]

const critItems = [
  { col: 0, row: 0, label: 'Полив', sub: 'irrigation', hue: 120, val: 0.95 },
  { col: 1, row: 0, label: 'Удобрения', sub: 'nutrition', hue: 80, val: 0.88 },
  { col: 2, row: 0, label: 'Здоровье', sub: 'vitality', hue: 160, val: 0.92 },
  { col: 0, row: 1, label: 'Дренаж', sub: 'drainage', hue: 200, val: 0.90 },
  { col: 1, row: 1, label: 'Дизайн', sub: 'design fit', hue: 35, val: 0.85 },
  { col: 2, row: 1, label: 'Освещение', sub: 'lighting', hue: 280, val: 0.87 },
]

const compassDots: [number, number][] = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 - Math.PI / 2
  return [667.5 + Math.cos(a) * 118, 667.5 + Math.sin(a) * 118] as [number, number]
})

function CritRing({ hue, val, size = 80 }: { hue: number; val: number; size?: number }) {
  const { dark } = useContext(ThemeCtx)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = 2
    canvas.width = size * dpr; canvas.height = size * dpr
    ctx.scale(dpr, dpr)
    const cx = size / 2, cy = size / 2, r = size / 2 - 6
    const n = 32, filled = Math.round(n * val)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2
      const f = i < filled
      ctx.beginPath()
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, f ? 2.5 : 1.2, 0, Math.PI * 2)
      ctx.fillStyle = f ? `hsl(${hue}, 55%, ${dark ? 50 : 45}%)` : `hsl(${hue}, 15%, ${dark ? 20 : 30}%)`
      ctx.globalAlpha = f ? 0.9 : 0.25
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.fillStyle = `hsl(${hue}, 45%, ${dark ? 55 : 50}%)`
    ctx.font = `300 ${size * 0.18}px "Cormorant Garamond", serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(Math.round(val * 100) + '%', cx, cy)
  }, [hue, val, size, dark])
  return <canvas ref={canvasRef} style={{ width: size, height: size }} />
}

function ThemeToggle() {
  const { dark, toggle } = useContext(ThemeCtx)
  return (
    <button onClick={toggle} style={{
      position: 'fixed', top: 16, right: 16, zIndex: 100,
      width: 44, height: 44, borderRadius: '50%',
      border: `1px solid ${dark ? 'rgba(200,180,140,0.3)' : 'rgba(60,40,20,0.3)'}`,
      background: dark ? 'rgba(20,15,8,0.7)' : 'rgba(255,250,240,0.7)',
      backdropFilter: 'blur(8px)',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 20, transition: 'all 0.5s ease',
      color: dark ? '#c9a84c' : '#5a4020',
    }}>
      {dark ? '☀' : '☾'}
    </button>
  )
}

function App() {
  const [dark, setDark] = useState(true)
  const [scale, setScale] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggle = () => setDark(d => !d)
  const p = dark ? palette.dark : palette.light

  useEffect(() => {
    setTextureTheme(dark ? DARK_THEME : LIGHT_THEME)
  }, [dark])

  useEffect(() => {
    const resize = () => setScale(window.innerWidth / W)
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Mouse tracking for grass crush effect — convert to drawio coordinates
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale
    setMousePosition(x, y)
  }, [scale])

  const handleMouseLeave = useCallback(() => {
    clearMousePosition()
  }, [])

  // Направления: centered at x=220..620 (3 cols of 190 wide, gap 15)
  const svcGridLeft = 220
  const svcColW = 190
  const svcGap = 15
  const svcStartY = 1070

  // Критерии: centered at x=240..600 (3 cols of 95 wide, gap 15)
  const critGridLeft = 262
  const critColW = 95
  const critGap = 15
  const critStartY = 1450

  return (
    <ThemeCtx.Provider value={{ dark, toggle }}>
      <ThemeToggle />
      <div style={{
        width: '100vw', overflowX: 'hidden',
        transition: 'background 1s ease',
        background: dark ? '#030802' : '#0e2208',
      }}>
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            width: W, height: H,
            position: 'relative',
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
            background: p.bg,
            overflow: 'visible',
            transition: 'background 1s ease',
          }}
        >
          {/* Grass texture */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <AnimatedTexture type="grass" density={10} />
          </div>

          {/* Foliage darkening toward bottom */}
          <div style={{
            position: 'absolute', inset: 0,
            background: p.overlay,
            pointerEvents: 'none', zIndex: 2,
            transition: 'background 1s ease',
          }} />

          {/* === WATER — deep noble dark tones === */}
          <div style={{
            position: 'absolute', left: 100, top: 510,
            width: 535.5, height: 357,
            borderRadius: '50%',
            background: p.water,
            overflow: 'hidden', zIndex: 3,
            transition: 'background 1s ease',
            boxShadow: `inset 0 0 60px rgba(0,0,0,0.4), inset 0 0 120px rgba(0,20,40,0.3)`,
          }}>
            <AnimatedTexture type="water" density={8} />
          </div>
          <div style={{
            position: 'absolute', left: 490, top: 494,
            width: 347, height: 347,
            borderRadius: '50%',
            background: p.water2,
            overflow: 'hidden', zIndex: 3,
            transition: 'background 1s ease',
            boxShadow: `inset 0 0 50px rgba(0,0,0,0.35), inset 0 0 100px rgba(0,20,40,0.25)`,
          }}>
            <AnimatedTexture type="water" density={8} />
          </div>

          {/* === SVG: roads + stream === */}
          <svg style={{
            position: 'absolute', top: 0, left: -150,
            width: 1140, height: H,
            pointerEvents: 'none', zIndex: 4,
          }} viewBox="-150 0 1140 2390">
            <path d={pts2path(mainRoad)} stroke={p.road} strokeWidth={34} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={p.roadOp} />
            <path d={pts2path(branchL)} stroke={p.road} strokeWidth={34} fill="none" strokeLinecap="round" opacity={p.roadOp * 0.7} />
            <path d={pts2path(branchR)} stroke={p.road} strokeWidth={34} fill="none" strokeLinecap="round" opacity={p.roadOp * 0.7} />
            <path d={pts2path(stream)} stroke={dark ? '#8a9aaa' : '#a0b4c8'} strokeWidth={14} fill="none" strokeLinecap="round" opacity={dark ? 0.12 : 0.25} />
          </svg>

          {/* === HERO: Roof tiles + TERRA VIVA === */}
          <div style={{
            position: 'absolute', left: 379.75, top: 0,
            width: 68.5, height: 68.5,
            background: dark ? '#1a1008' : '#3a2818',
            zIndex: 5,
          }} />
          <div style={{
            position: 'absolute', left: 160, top: 68.5,
            width: 520, height: 280,
            borderRadius: 15, overflow: 'hidden', zIndex: 5,
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}>
            <AnimatedTexture type="roof" density={16} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', zIndex: 6,
            }}>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 56, fontWeight: 300,
                color: 'white', letterSpacing: '0.15em',
                textShadow: '0 2px 30px rgba(0,0,0,0.7), 0 0 60px rgba(0,0,0,0.4)',
              }}>TERRA VIVA</div>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 12, fontWeight: 300,
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.35em', marginTop: 8,
                textTransform: 'uppercase',
              }}>живая земля · ландшафтная архитектура</div>
            </div>
          </div>

          {/* === TREES (ели) === */}
          {[...leftTrees, ...rightTrees].map((t, i) => (
            <div key={`tree${i}`} style={{
              position: 'absolute', left: t.x, top: t.y,
              width: t.s, height: t.s,
              borderRadius: '50%', overflow: 'hidden', zIndex: 5,
            }}>
              <AnimatedTexture type="tree" density={7} />
            </div>
          ))}

          {/* === "О нас" — marble stone veranda with columns === */}
          <div style={{
            position: 'absolute', left: 560, top: 560,
            width: 215, height: 215,
            borderRadius: '50%',
            background: p.verandaBg,
            border: `3px solid ${p.verandaBorder}`,
            boxShadow: `
              0 0 0 8px ${dark ? 'rgba(160,140,110,0.15)' : 'rgba(180,165,140,0.4)'},
              0 0 0 12px ${dark ? 'rgba(140,120,90,0.1)' : 'rgba(160,145,120,0.3)'},
              inset 0 0 30px ${dark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'},
              0 8px 30px rgba(0,0,0,0.3)
            `,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 6, transition: 'all 0.8s ease',
          }}>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 38, fontWeight: 400,
              color: p.verandaText,
              letterSpacing: '0.05em',
              textShadow: dark ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
            }}>О нас</span>
          </div>

          {/* Column dots — marble columns */}
          {compassDots.map(([cx, cy], i) => (
            <div key={`col${i}`} style={{
              position: 'absolute', left: cx - 10, top: cy - 10,
              width: 20, height: 20,
              borderRadius: '50%',
              background: dark
                ? 'radial-gradient(circle, #c0b098 0%, #a09078 60%, #887860 100%)'
                : 'radial-gradient(circle, #e8e0d0 0%, #d4cbb8 60%, #b8a890 100%)',
              border: `1px solid ${dark ? 'rgba(160,140,110,0.4)' : 'rgba(160,145,120,0.5)'}`,
              boxShadow: dark
                ? '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.1)'
                : '0 2px 6px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.3)',
              zIndex: 6, transition: 'all 0.8s ease',
            }} />
          ))}

          {/* === About text over water — CENTERED === */}
          <div style={{
            position: 'absolute', left: 130, top: 590,
            width: 402, height: 200, zIndex: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center',
          }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 18, fontWeight: 300, fontStyle: 'italic',
              lineHeight: 1.85,
              color: dark ? 'rgba(220,210,190,0.9)' : 'rgba(245,240,230,0.95)',
              textShadow: '0 1px 8px rgba(0,0,0,0.3)',
            }}>
              Мы создаём живые пространства, где природа и архитектура становятся единым целым.
              Каждый проект — диалог с землёй: мы слушаем рельеф, читаем свет и воплощаем
              пространства, которые живут собственной жизнью.
            </p>
          </div>

          {/* === OAK trees === */}
          {[{ x: 525, y: 885, s: 290, pad: 45 }, { x: 700, y: 933, s: 166, pad: 30 }].map((o, i) => (
            <div key={`oak${i}`} style={{
              position: 'absolute', left: o.x, top: o.y,
              width: o.s, height: o.s,
              overflow: 'visible', zIndex: 5,
            }}>
              <div style={{ position: 'absolute', inset: -o.pad, overflow: 'hidden' }}>
                <AnimatedTexture type="oak" density={8} />
              </div>
            </div>
          ))}

          {/* === Направления — CENTERED === */}
          <div style={{
            position: 'absolute', left: 0, top: 975,
            width: W, zIndex: 6,
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 32, fontWeight: 300, color: p.cream,
            display: 'flex', justifyContent: 'center',
            letterSpacing: '0.05em',
          }}>Направления</div>

          {/* === SERVICE CARDS — centered grid, semi-transparent === */}
          {services.map((s) => {
            const x = svcGridLeft + s.col * (svcColW + svcGap)
            const y = svcStartY + s.row * (svcColW + svcGap)
            return (
              <div key={s.num} style={{
                position: 'absolute', left: x, top: y,
                width: svcColW, height: svcColW,
                borderRadius: 15, overflow: 'hidden', zIndex: 6,
                background: p.cardBg,
                backdropFilter: 'blur(4px)',
                border: `1px solid ${p.cardBorder}`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                transition: 'all 0.8s ease',
              }}>
                <div style={{
                  position: 'relative', zIndex: 3,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  height: '100%', padding: '16px 12px', textAlign: 'center',
                }}>
                  <span style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 26, color: p.gold, opacity: 0.6,
                  }}>{s.num}</span>
                  <span style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 15, color: p.cream,
                    marginTop: 4, fontWeight: 400,
                  }}>{s.name}</span>
                  <span style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 9, color: p.stone, opacity: 0.7,
                    marginTop: 6, lineHeight: 1.4,
                  }}>{s.desc}</span>
                </div>
              </div>
            )
          })}

          {/* === Критерии качества — CENTERED === */}
          <div style={{
            position: 'absolute', left: 0, top: 1370,
            width: W, zIndex: 6,
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 32, fontWeight: 300, color: p.cream,
            display: 'flex', justifyContent: 'center',
            letterSpacing: '0.05em',
          }}>Критерии качества</div>

          {critItems.map((c, i) => {
            const x = critGridLeft + c.col * (critColW + critGap)
            const y = critStartY + c.row * 110
            return (
              <div key={`crit${i}`} style={{
                position: 'absolute', left: x, top: y,
                width: critColW, height: 108, zIndex: 6, textAlign: 'center',
              }}>
                <CritRing hue={c.hue} val={c.val} size={80} />
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 11, color: p.cream, marginTop: 2,
                }}>{c.label}</div>
                <div style={{
                  fontSize: 8, color: p.stone, opacity: 0.5,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>{c.sub}</div>
              </div>
            )
          })}

          {/* === Diamond === */}
          <div style={{
            position: 'absolute', left: 200, top: 1560,
            width: 440, height: 440,
            background: p.diamond,
            transform: 'rotate(45deg)',
            zIndex: 5,
            boxShadow: '0 10px 50px rgba(0,0,0,0.4)',
            transition: 'background 0.8s ease',
          }} />

          {/* === Contact text === */}
          <div style={{
            position: 'absolute', left: 219, top: 1695,
            width: 402, height: 130, zIndex: 6,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 32, fontWeight: 300, color: p.cream,
            }}>Начнём проект</div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 15, fontWeight: 300,
              color: p.stone, marginTop: 8, lineHeight: 1.5,
            }}>Расскажите о вашем участке — мы предложим решение</div>
          </div>

          {/* === СВЯЗАТЬСЯ — marble monolith, NO border-radius === */}
          <div style={{
            position: 'absolute', left: 300, top: 1830,
            width: 240, zIndex: 6,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center',
          }}>
            {/* Main stone face — large, illuminated */}
            <a href="tel:+79263207755" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 240, height: 70,
              background: p.marbleBg,
              borderRadius: 0,
              textDecoration: 'none',
              boxShadow: `
                0 2px 15px rgba(0,0,0,0.25),
                inset 0 1px 0 rgba(255,255,255,0.3),
                inset 0 -1px 0 rgba(0,0,0,0.1)
              `,
              transition: 'all 0.8s ease',
              // Marble veining via repeating gradients
              backgroundImage: `
                ${p.marbleBg},
                repeating-linear-gradient(
                  120deg,
                  transparent 0px,
                  transparent 20px,
                  rgba(180,170,150,0.08) 20px,
                  rgba(180,170,150,0.08) 21px
                )
              `,
            }}>
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 600, fontSize: 18,
                letterSpacing: '0.3em',
                color: p.marbleText,
              }}>СВЯЗАТЬСЯ</span>
            </a>
            {/* Shadow side — darker marble, phone number */}
            <div style={{
              width: 240, height: 24,
              background: p.marbleSide,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundImage: `
                ${p.marbleSide},
                repeating-linear-gradient(
                  120deg,
                  transparent 0px,
                  transparent 15px,
                  rgba(0,0,0,0.05) 15px,
                  rgba(0,0,0,0.05) 16px
                )
              `,
              transition: 'all 0.8s ease',
            }}>
              <span style={{
                fontSize: 10, letterSpacing: '0.15em',
                color: dark ? 'rgba(200,190,170,0.7)' : 'rgba(255,250,240,0.8)',
                fontFamily: "'Cormorant Garamond', serif",
              }}>+7 926 320-77-55</span>
            </div>
          </div>

          {/* === Philosophy quote === */}
          <div style={{
            position: 'absolute', left: 161.56, top: 2070,
            width: 516.87, height: 260, zIndex: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 30, fontWeight: 300, fontStyle: 'italic',
              color: p.quote, lineHeight: 1.6,
              textShadow: '0 1px 10px rgba(0,0,0,0.3)',
            }}>
              «Ландшафт — это не декорация. Это живая система, которая дышит, растёт и меняется вместе с вами.»
            </p>
          </div>
        </div>

        <div style={{ height: H * scale - H, pointerEvents: 'none' }} />
      </div>
    </ThemeCtx.Provider>
  )
}

export default App
