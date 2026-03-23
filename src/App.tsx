import { useEffect, useRef, useState } from 'react'
import { AnimatedTexture } from './components/AnimatedTexture'
import './App.css'

// Drawio coordinate system: page ~840 wide, content 2390 tall
// All positions taken directly from the .drawio file
const CANVAS_W = 840
const CANVAS_H = 2390

// Smooth curve through points (catmull-rom to bezier)
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

// Main road points from drawio (source → waypoints → target)
const mainRoadPoints: [number, number][] = [
  [467, 1913],
  [340, 1410],
  [780, 1250],
  [840, 870],
  [420, 950],
  [40, 850],
  [20, 560],
  [300, 430],
  [560, 480],
  [630, 620],
  [640, 460],
  [420, 380],
  [424, 317],
]

// Stream path (light gray E6E6E6, strokeWidth=14)
const streamPoints: [number, number][] = [
  [580, 858],
  [500, 880],
  [360, 890],
  [240, 870],
  [130, 810],
  [80, 730],
  [80, 660],
  [110, 580],
  [180, 530],
  [260, 510],
  [340, 490],
  [440, 500],
  [528, 526],
]

// Branch left: (-540,775) → (-260,655) → (32,665)
const branchLeftPoints: [number, number][] = [[-540, 775], [-260, 655], [32, 665]]
// Branch right: (790,930) → (1070,810) → (1362,820)
const branchRightPoints: [number, number][] = [[790, 930], [1070, 810], [1362, 820]]

// Tree positions from drawio (ели)
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

// Oak trees
const oaks = [
  { x: 565, y: 925, size: 210, label: 'дуб' },
  { x: 715, y: 953, size: 126, label: '' },
]

// Service cards (01-07)
const services = [
  { num: '01', x: -50, y: 1060, name: 'Проектирование' },
  { num: '02', x: 150, y: 1060, name: 'Благоустройство' },
  { num: '03', x: 350, y: 1060, name: 'Озеленение' },
  { num: '04', x: -50, y: 1260, name: 'Водные объекты' },
  { num: '05', x: 150, y: 1260, name: 'Освещение' },
  { num: '06', x: -50, y: 1460, name: 'Уход' },
  { num: '07', x: 150, y: 1460, name: 'Консультации' },
]

// Criteria circles (6 circles in 3x2 grid)
const criteriaCircles = [
  { x: 600, y: 1480 },
  { x: 695, y: 1480 },
  { x: 790, y: 1480 },
  { x: 600, y: 1590 },
  { x: 695, y: 1590 },
  { x: 790, y: 1590 },
]

// Compass dots around "О нас" circle (center ~667, 667, radius ~107)
const compassDots: [number, number][] = []
for (let i = 0; i < 8; i++) {
  const angle = (i / 8) * Math.PI * 2 - Math.PI / 2
  compassDots.push([
    667.5 + Math.cos(angle) * 115,
    667.5 + Math.sin(angle) * 115,
  ])
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        setScale(window.innerWidth / CANVAS_W)
      }
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  return (
    <div ref={containerRef} style={{ width: '100vw', overflowX: 'hidden' }}>
      <div style={{
        width: CANVAS_W,
        height: CANVAS_H,
        position: 'relative',
        transformOrigin: 'top left',
        transform: `scale(${scale})`,
        background: 'linear-gradient(180deg, #336600 0%, #1A3300 100%)',
        overflow: 'visible',
      }}>
        {/* Grass texture over entire background */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <AnimatedTexture type="grass" density={800} />
        </div>

        {/* === WATER ELLIPSES === */}
        {/* Ellipse 1: (100, 510) 535.5×357 */}
        <div style={{
          position: 'absolute',
          left: 100, top: 510,
          width: 535.5, height: 357,
          borderRadius: '50%',
          background: '#A9C4EB',
          opacity: 0.35,
          overflow: 'hidden',
        }}>
          <AnimatedTexture type="water" density={400} />
        </div>
        {/* Ellipse 2: (490, 494) 347×347 */}
        <div style={{
          position: 'absolute',
          left: 490, top: 494,
          width: 347, height: 347,
          borderRadius: '50%',
          background: '#A9C4EB',
          opacity: 0.35,
          overflow: 'hidden',
        }}>
          <AnimatedTexture type="water" density={400} />
        </div>

        {/* === SVG OVERLAY for roads, stream, criteria circles === */}
        <svg
          style={{
            position: 'absolute',
            top: 0, left: -150,
            width: 1140, height: CANVAS_H,
            pointerEvents: 'none',
            zIndex: 3,
          }}
          viewBox="-150 0 1140 2390"
        >
          {/* Main road */}
          <path
            d={pointsToPath(mainRoadPoints)}
            stroke="#663300"
            strokeWidth={34}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Branch left */}
          <path
            d={pointsToPath(branchLeftPoints)}
            stroke="#663300"
            strokeWidth={34}
            fill="none"
            strokeLinecap="round"
            opacity={0.7}
          />
          {/* Branch right */}
          <path
            d={pointsToPath(branchRightPoints)}
            stroke="#663300"
            strokeWidth={34}
            fill="none"
            strokeLinecap="round"
            opacity={0.7}
          />
          {/* Stream (light gray path through water area) */}
          <path
            d={pointsToPath(streamPoints)}
            stroke="#E6E6E6"
            strokeWidth={14}
            fill="none"
            strokeLinecap="round"
            opacity={0.3}
          />
        </svg>

        {/* === HERO SECTION === */}
        {/* Small brown square: (379.75, 0) 68.5×68.5 */}
        <div style={{
          position: 'absolute',
          left: 379.75, top: 0,
          width: 68.5, height: 68.5,
          background: '#663300',
          zIndex: 4,
        }} />
        {/* Brown plate: (160, 68.5) 520×280 */}
        <div style={{
          position: 'absolute',
          left: 160, top: 68.5,
          width: 520, height: 280,
          background: '#663300',
          borderRadius: 15,
          zIndex: 4,
        }} />
        {/* White text box: (213, 130) 402×157 */}
        <div style={{
          position: 'absolute',
          left: 213, top: 130,
          width: 402, height: 157,
          background: 'white',
          borderRadius: 15,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
        }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 47,
            fontWeight: 300,
            color: '#1a1a1a',
            letterSpacing: '0.08em',
          }}>
            TERRA VIVA
          </div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 14,
            color: '#666',
            marginTop: 4,
          }}>
            живая земля · ландшафтная архитектура
          </div>
        </div>

        {/* === TREES (ели) left === */}
        {leftTrees.map((t, i) => (
          <div key={`lt${i}`} style={{
            position: 'absolute',
            left: t.x, top: t.y,
            width: t.size, height: t.size,
            borderRadius: '50%',
            background: '#428200',
            overflow: 'hidden',
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <AnimatedTexture type="tree" density={400} />
            <span style={{
              position: 'relative', zIndex: 3,
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: t.size > 100 ? 14 : 11,
              color: 'rgba(255,255,255,0.5)',
            }}>ель</span>
          </div>
        ))}

        {/* === TREES (ели) right === */}
        {rightTrees.map((t, i) => (
          <div key={`rt${i}`} style={{
            position: 'absolute',
            left: t.x, top: t.y,
            width: t.size, height: t.size,
            borderRadius: '50%',
            background: '#428200',
            overflow: 'hidden',
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <AnimatedTexture type="tree" density={400} />
            <span style={{
              position: 'relative', zIndex: 3,
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: t.size > 100 ? 14 : 11,
              color: 'rgba(255,255,255,0.5)',
            }}>ель</span>
          </div>
        ))}

        {/* === "О нас" white circle: (560, 560) 215×215 === */}
        <div style={{
          position: 'absolute',
          left: 560, top: 560,
          width: 215, height: 215,
          borderRadius: '50%',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
        }}>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 42,
            fontWeight: 300,
            color: '#333',
          }}>О нас</span>
        </div>

        {/* Compass dots around "О нас" */}
        {compassDots.map(([cx, cy], i) => (
          <div key={`cd${i}`} style={{
            position: 'absolute',
            left: cx - 17, top: cy - 17,
            width: 34, height: 34,
            borderRadius: '50%',
            background: '#E6E6E6',
            opacity: 0.25,
            zIndex: 5,
          }} />
        ))}

        {/* === About text: (130, 610) 402×157 === */}
        <div style={{
          position: 'absolute',
          left: 130, top: 610,
          width: 402, height: 157,
          zIndex: 5,
          fontFamily: 'Inter, sans-serif',
          fontSize: 15.2,
          lineHeight: 1.6,
          color: '#c9b896',
        }}>
          Мы создаём живые пространства, где природа и архитектура становятся единым целым.
          Каждый проект — диалог с землёй: мы слушаем рельеф, читаем свет и воплощаем
          пространства, которые живут собственной жизнью.
        </div>

        {/* === "Направления" title: (120, 970) 402×80 === */}
        <div style={{
          position: 'absolute',
          left: 120, top: 970,
          width: 402, height: 80,
          zIndex: 5,
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 32,
          fontWeight: 300,
          color: 'var(--cream)',
          display: 'flex',
          alignItems: 'center',
        }}>
          Направления
        </div>

        {/* === Oak trees === */}
        {oaks.map((t, i) => (
          <div key={`oak${i}`} style={{
            position: 'absolute',
            left: t.x, top: t.y,
            width: t.size, height: t.size,
            borderRadius: '50%',
            background: '#428200',
            overflow: 'hidden',
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <AnimatedTexture type="tree" density={400} />
            {t.label && (
              <span style={{
                position: 'relative', zIndex: 3,
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 14,
                color: 'rgba(255,255,255,0.5)',
              }}>{t.label}</span>
            )}
          </div>
        ))}

        {/* === SERVICE CARDS 01-07: 180×180 rounded green boxes === */}
        {services.map((s) => (
          <div key={s.num} style={{
            position: 'absolute',
            left: s.x, top: s.y,
            width: 180, height: 180,
            background: '#428200',
            borderRadius: 15,
            overflow: 'hidden',
            zIndex: 5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <AnimatedTexture type="grass" density={1200} />
            <span style={{
              position: 'relative', zIndex: 3,
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 32,
              color: 'rgba(255,255,255,0.6)',
            }}>{s.num}</span>
            <span style={{
              position: 'relative', zIndex: 3,
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 13,
              color: 'rgba(255,255,255,0.8)',
              marginTop: 6,
              textAlign: 'center',
              padding: '0 12px',
            }}>{s.name}</span>
          </div>
        ))}

        {/* === "Критерии качества" title: (534, 1380) 402×80 === */}
        <div style={{
          position: 'absolute',
          left: 534, top: 1380,
          width: 402, height: 80,
          zIndex: 5,
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 32,
          fontWeight: 300,
          color: 'var(--cream)',
          display: 'flex',
          alignItems: 'center',
        }}>
          Критерии качества
        </div>

        {/* === Criteria circles: 80×80 outline circles === */}
        {criteriaCircles.map((c, i) => (
          <div key={`crit${i}`} style={{
            position: 'absolute',
            left: c.x, top: c.y,
            width: 80, height: 80,
            borderRadius: '50%',
            border: '1px solid currentColor',
            color: 'var(--cream)',
            opacity: 0.5,
            zIndex: 5,
          }} />
        ))}

        {/* === Diamond / rhombus: (200, 1560) 440×440 === */}
        <div style={{
          position: 'absolute',
          left: 200, top: 1560,
          width: 440, height: 440,
          background: '#663300',
          transform: 'rotate(45deg)',
          zIndex: 4,
        }} />

        {/* === Contact text: (219, 1701.5) 402×157 === */}
        <div style={{
          position: 'absolute',
          left: 219, top: 1701.5,
          width: 402, height: 157,
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 32,
            fontWeight: 300,
            color: 'var(--cream)',
          }}>
            Начнём проект
          </div>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 14,
            color: 'var(--stone)',
            marginTop: 8,
            lineHeight: 1.5,
          }}>
            Расскажите о вашем участке — мы предложим решение
          </div>
        </div>

        {/* === СВЯЗАТЬСЯ button: (340, 1830) 160×60 === */}
        <a href="tel:+79263207755" style={{
          position: 'absolute',
          left: 340, top: 1830,
          width: 160, height: 60,
          background: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          zIndex: 5,
        }}>
          <span style={{
            fontWeight: 700,
            fontSize: 18,
            color: '#333',
          }}>СВЯЗАТЬСЯ</span>
          <span style={{
            fontSize: 10,
            color: '#666',
            marginTop: 2,
          }}>+79263207755</span>
        </a>

        {/* === Philosophy quote: (161.56, 2070) 516.87×260 === */}
        <div style={{
          position: 'absolute',
          left: 161.56, top: 2070,
          width: 516.87, height: 260,
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 34,
            fontWeight: 300,
            fontStyle: 'italic',
            color: '#FFFF00',
            lineHeight: 1.5,
          }}>
            «Ландшафт — это не декорация. Это живая система, которая дышит, растёт и меняется вместе с вами.»
          </p>
        </div>
      </div>

      {/* Spacer to make page scrollable to the scaled height */}
      <div style={{ height: CANVAS_H * scale - CANVAS_H, pointerEvents: 'none' }} />
    </div>
  )
}

export default App
