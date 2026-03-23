import { useEffect, useRef, useState, createContext, useContext, useCallback } from 'react'
import { AnimatedTexture } from './components/AnimatedTexture'
import { LIGHT_THEME, DARK_THEME, setTextureTheme, setMousePosition, clearMousePosition } from './hooks/useAnimatedTexture'
import './App.css'

const ThemeCtx = createContext<{ dark: boolean; toggle: () => void }>({ dark: true, toggle: () => {} })

const W = 840, H = 2650

const palette = {
  light: {
    bg: 'linear-gradient(180deg, #4a7a2e 0%, #2d5a1a 40%, #1a3d0f 70%, #0e2208 100%)',
    roadStone: '#b0a590',
    roadStoneLight: '#c4b8a0',
    roadStoneDark: '#9a8e78',
    water: 'rgba(25, 60, 90, 0.55)',
    water2: 'rgba(20, 50, 80, 0.45)',
    cream: '#f5f0e6',
    gold: '#c9a84c',
    stone: '#b8a88a',
    stoneLight: '#d4c8b0',
    verandaBg: 'radial-gradient(circle, #e8e0d0 0%, #d4cbb8 50%, #b8a890 100%)',
    verandaBorder: '#a89878',
    verandaText: '#3a3020',
    diamondGrad: 'linear-gradient(135deg, #c4b8a0 0%, #d8ccb4 30%, #c0b498 50%, #b0a488 70%, #a89880 100%)',
    cardBg: 'rgba(255, 255, 255, 0.15)',
    cardBorder: 'rgba(255, 255, 255, 0.2)',
    quote: '#c9a84c',
    overlay: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 30%, rgba(0,15,0,0.1) 55%, rgba(0,10,0,0.25) 75%, rgba(0,5,0,0.45) 100%)',
    stream: 'rgba(180, 200, 220, 0.3)',
    marbleBg: 'linear-gradient(180deg, #f0ece4 0%, #e0d8cc 30%, #d4ccc0 60%, #c8bfb0 100%)',
    marbleSide: 'linear-gradient(180deg, #b0a590 0%, #8a7d68 50%, #6a5f4c 100%)',
    marbleText: '#2a2018',
    lanternIron: '#4a4540',
    lanternGlow: 'rgba(255,200,80,0.9)',
    lanternRay: 'rgba(255,200,80,0.15)',
  },
  dark: {
    bg: 'linear-gradient(180deg, #1a2e10 0%, #0f1f08 35%, #080f04 65%, #030802 100%)',
    roadStone: '#5a5048',
    roadStoneLight: '#6a6058',
    roadStoneDark: '#4a4238',
    water: 'rgba(10, 35, 60, 0.65)',
    water2: 'rgba(8, 30, 50, 0.55)',
    cream: '#e8dcc8',
    gold: '#a8883c',
    stone: '#8a7a60',
    stoneLight: '#b0a088',
    verandaBg: 'radial-gradient(circle, #d4cbb8 0%, #b8a890 30%, #a09078 60%, #887860 100%)',
    verandaBorder: '#8a7a60',
    verandaText: '#2a2018',
    diamondGrad: 'linear-gradient(135deg, #4a4238 0%, #5a5048 30%, #504840 50%, #3a3228 70%, #2e2820 100%)',
    cardBg: 'rgba(0, 0, 0, 0.25)',
    cardBorder: 'rgba(0, 0, 0, 0.3)',
    quote: '#a8883c',
    overlay: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 25%, rgba(0,8,0,0.15) 50%, rgba(0,5,0,0.35) 75%, rgba(0,3,0,0.55) 100%)',
    stream: 'rgba(120, 140, 160, 0.15)',
    marbleBg: 'linear-gradient(180deg, #d4ccc0 0%, #c0b8a8 30%, #a89888 60%, #908070 100%)',
    marbleSide: 'linear-gradient(180deg, #706050 0%, #504030 50%, #3a2e20 100%)',
    marbleText: '#f0ece4',
    lanternIron: '#2a2520',
    lanternGlow: 'rgba(255,180,60,0.85)',
    lanternRay: 'rgba(255,180,60,0.12)',
  },
}

// Catmull-rom for organic road
function pts2path(pts: [number, number][]): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)]
    d += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6}, ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6}, ${p2[0]} ${p2[1]}`
  }
  return d
}

// Organic road: hero → lake area → approach Направления from left
const organicRoad: [number, number][] = [
  [424, 317],
  [420, 380], [640, 460], [630, 620],
  [560, 480], [300, 430], [20, 560],
  [40, 850],
  [200, 920], [720, 950],
]

// Geometric road with clean rounded corners (Q = quadratic bezier at corner)
// Right past Направления → across to left → down past Критерии → right to center → fork
const R = 40
const geoRoadD = [
  `Q 760 950 760 ${950 + R}`,      // corner: right → down
  `L 760 1310`,                      // straight down past Направления
  `Q 760 1350 ${760 - R} 1350`,    // corner: down → left
  `L ${60 + R} 1350`,               // straight left across page
  `Q 60 1350 60 ${1350 + R}`,      // corner: left → down
  `L 60 1700`,                       // straight down past Критерии
  `Q 60 1740 ${60 + R} 1740`,      // corner: down → right
  `L 420 1740`,                      // straight right to center (fork point)
].join(' ')

const stream: [number, number][] = [
  [580, 858], [500, 880], [360, 890], [240, 870], [130, 810],
  [80, 730], [80, 660], [110, 580], [180, 530], [260, 510],
  [340, 490], [440, 500], [528, 526],
]
// Branch left starts from main road near lake area (~y=560, organic section)
const branchL: [number, number][] = [[-540, 620], [-260, 580], [20, 560]]
// Branch right starts from main road at the corner before Направления (720, 950)
const branchR: [number, number][] = [[720, 950], [1070, 860], [1362, 870]]

const leftTrees = [
  { x: 100, y: 20, s: 80 }, { x: 10, y: 40, s: 120 },
  { x: -30, y: 130, s: 150 }, { x: 0, y: 260, s: 210 },
]
const rightTrees = [
  { x: 660, y: 20, s: 80 }, { x: 707, y: 40, s: 120 },
  { x: 720, y: 130, s: 150 }, { x: 630, y: 260, s: 210 },
]

const services = [
  { num: '01', name: 'Проектирование', desc: 'Концепция, планировка, 3D-визуализация' },
  { num: '02', name: 'Благоустройство', desc: 'Мощение, подпорные стенки, натуральный камень' },
  { num: '03', name: 'Озеленение', desc: 'Посадка деревьев, формовка ниваки' },
  { num: '04', name: 'Дренажные системы', desc: 'Защита от подтопления и застоя воды' },
  { num: '05', name: 'Системы автополива', desc: 'Интеллектуальный полив с датчиками' },
  { num: '06', name: 'Электрика и освещение', desc: 'Архитектурная подсветка ландшафта' },
  { num: '07', name: 'Геопластика', desc: 'Моделирование рельефа: холмы, террасы' },
]

const SVC_CARD = 140, SVC_GAP = 15, SVC_COLS = 4
const svcGridW = SVC_COLS * SVC_CARD + (SVC_COLS - 1) * SVC_GAP
const svcGridLeft = (W - svcGridW) / 2
const SVC_START_Y = 1000
function svcPos(idx: number): { x: number; y: number } {
  if (idx < SVC_COLS) return { x: svcGridLeft + idx * (SVC_CARD + SVC_GAP), y: SVC_START_Y }
  const row2Count = services.length - SVC_COLS
  const row2W = row2Count * SVC_CARD + (row2Count - 1) * SVC_GAP
  const row2Left = (W - row2W) / 2
  return { x: row2Left + (idx - SVC_COLS) * (SVC_CARD + SVC_GAP), y: SVC_START_Y + SVC_CARD + SVC_GAP }
}

const critItems = [
  { label: 'Полив', sub: 'irrigation', hue: 120, val: 0.95 },
  { label: 'Удобрения', sub: 'nutrition', hue: 80, val: 0.88 },
  { label: 'Здоровье', sub: 'vitality', hue: 160, val: 0.92 },
  { label: 'Дренаж', sub: 'drainage', hue: 200, val: 0.90 },
  { label: 'Дизайн', sub: 'design fit', hue: 35, val: 0.85 },
  { label: 'Освещение', sub: 'lighting', hue: 280, val: 0.87 },
]
const CRIT_COL_W = 95, CRIT_GAP = 20
const critGridW = 3 * CRIT_COL_W + 2 * CRIT_GAP
const critGridLeft = (W - critGridW) / 2
const CRIT_START_Y = 1460
function critPos(idx: number): { x: number; y: number } {
  return {
    x: critGridLeft + (idx % 3) * (CRIT_COL_W + CRIT_GAP),
    y: CRIT_START_Y + Math.floor(idx / 3) * 115,
  }
}

const compassDots: [number, number][] = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 - Math.PI / 2
  return [667.5 + Math.cos(a) * 118, 667.5 + Math.sin(a) * 118] as [number, number]
})

// Diamond geometry
// CSS: left=200, top=1871, 440×440, rotate(45deg)
// Center: (420, 2091), Top visual tip: (420, ~1780)
const DIAMOND_TOP = 1871

// Lantern positions: inside diamond, ~70px inset from edges
// Diamond center (420, 2091), half-diagonal ~311px, inset 70px → ~241px from center
// Corners (top, right, bottom, left) + mid-edges (4 more) = 8 lanterns
const DIA_CX = 420, DIA_CY = 2091, DIA_INS = 190
const lanternPositions = [
  { x: DIA_CX, y: DIA_CY - DIA_INS },              // top
  { x: DIA_CX + DIA_INS, y: DIA_CY },              // right
  { x: DIA_CX, y: DIA_CY + DIA_INS },              // bottom
  { x: DIA_CX - DIA_INS, y: DIA_CY },              // left
  { x: DIA_CX + DIA_INS * 0.55, y: DIA_CY - DIA_INS * 0.55 }, // top-right
  { x: DIA_CX + DIA_INS * 0.55, y: DIA_CY + DIA_INS * 0.55 }, // bottom-right
  { x: DIA_CX - DIA_INS * 0.55, y: DIA_CY + DIA_INS * 0.55 }, // bottom-left
  { x: DIA_CX - DIA_INS * 0.55, y: DIA_CY - DIA_INS * 0.55 }, // top-left
]

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

// Narnia-style lantern
function Lantern({ x, y, lit, dark }: { x: number; y: number; lit: boolean; dark: boolean }) {
  const ironColor = dark ? '#2a2520' : '#4a4540'
  const ironLight = dark ? '#3a3530' : '#5a5550'
  return (
    <div style={{
      position: 'absolute', left: x - 10, top: y - 90,
      width: 20, zIndex: 7,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      pointerEvents: 'none',
    }}>
      {/* Lamp crown (ornate top) */}
      <div style={{
        width: 6, height: 8, background: ironColor,
        borderRadius: '2px 2px 0 0',
      }} />
      {/* Crossbar */}
      <div style={{
        width: 18, height: 2, background: ironColor,
        marginTop: -1,
      }} />
      {/* Glass housing */}
      <div style={{
        width: 14, height: 20,
        border: `1.5px solid ${ironLight}`,
        borderRadius: '2px 2px 4px 4px',
        position: 'relative',
        overflow: 'visible',
        background: lit
          ? `radial-gradient(circle, rgba(255,220,120,0.95) 0%, rgba(255,180,60,0.5) 60%, transparent 100%)`
          : dark ? 'rgba(15,12,8,0.6)' : 'rgba(200,195,185,0.3)',
        transition: 'background 1.2s ease',
        boxShadow: lit
          ? `0 0 12px rgba(255,200,80,0.6), 0 0 30px rgba(255,180,60,0.3), 0 0 60px rgba(255,160,40,0.15)`
          : 'none',
      }}>
        {/* Large glow area */}
        {lit && <div style={{
          position: 'absolute',
          left: -80, top: -80,
          width: 180, height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,200,80,0.2) 0%, rgba(255,180,60,0.08) 40%, transparent 70%)',
          pointerEvents: 'none',
          transition: 'opacity 1.2s ease',
        }} />}
        {/* Light rays */}
        {lit && [0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <div key={angle} style={{
            position: 'absolute',
            left: '50%', top: '50%',
            width: 1.5,
            height: 50 + Math.sin(angle * 0.017) * 20,
            background: `linear-gradient(to bottom, rgba(255,200,80,0.25) 0%, rgba(255,200,80,0.05) 60%, transparent 100%)`,
            transformOrigin: 'top center',
            transform: `translateX(-0.75px) rotate(${angle}deg)`,
            pointerEvents: 'none',
            opacity: 0.4 + Math.cos(angle * 0.035) * 0.2,
          }} />
        ))}
      </div>
      {/* Bottom cap */}
      <div style={{
        width: 16, height: 2, background: ironColor,
      }} />
      {/* Post */}
      <div style={{
        width: 4, height: 55,
        background: `linear-gradient(180deg, ${ironColor} 0%, ${ironLight} 100%)`,
      }} />
      {/* Base */}
      <div style={{
        width: 14, height: 3,
        background: ironColor,
        borderRadius: '0 0 2px 2px',
      }} />
    </div>
  )
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
  const [lanternsLit, setLanternsLit] = useState(false)
  const [lanternsHover, setLanternsHover] = useState(false)
  const [roadProgress, setRoadProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const roadRef = useRef<SVGPathElement>(null)
  const branchLRef = useRef<SVGPathElement>(null)
  const branchRRef = useRef<SVGPathElement>(null)
  const forkRightRef = useRef<SVGPathElement>(null)
  const forkDownRef = useRef<SVGPathElement>(null)

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

  // Scroll-based road reveal + lantern activation
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const progress = maxScroll > 0 ? Math.min(1, scrollY / maxScroll) : 0
      setRoadProgress(progress)

      // Check if СВЯЗАТЬСЯ button is in 30% middle of viewport
      const contactTop = (DIAMOND_TOP + 220) * scale
      const viewH = window.innerHeight
      const mid30Top = viewH * 0.35
      const mid30Bottom = viewH * 0.65
      const contactInView = contactTop - scrollY > mid30Top && contactTop - scrollY < mid30Bottom
      if (contactInView && !lanternsHover) {
        setLanternsLit(true)
      } else if (!lanternsHover && !contactInView) {
        setLanternsLit(false)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [scale, lanternsHover])

  // Apply stroke-dashoffset animation to road paths
  useEffect(() => {
    const applyDash = (ref: React.RefObject<SVGPathElement | null>, delay: number) => {
      const el = ref.current
      if (!el) return
      const len = el.getTotalLength()
      el.style.strokeDasharray = `${len}`
      el.style.strokeDashoffset = `${len * (1 - Math.min(1, Math.max(0, (roadProgress - delay) / (1 - delay))))}`
    }
    applyDash(roadRef, 0)
    applyDash(branchLRef, 0.15)
    applyDash(branchRRef, 0.25)
    applyDash(forkRightRef, 0.75)
    applyDash(forkDownRef, 0.75)
  }, [roadProgress])

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

  // Build full road path: organic (catmull-rom) + geometric (clean corners)
  const fullRoadD = pts2path(organicRoad) + ' ' + geoRoadD

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

          {/* === WATER === */}
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
          }} viewBox={`-150 0 1140 ${H}`}>
            {/* Stone texture pattern for road */}
            <defs>
              <pattern id="stonePat" patternUnits="userSpaceOnUse" width="17" height="17" patternTransform="rotate(8)">
                <rect width="17" height="17" fill={p.roadStone} />
                <rect x="1" y="1" width="7" height="7" rx="1" fill={p.roadStoneLight} opacity="0.35" />
                <rect x="9" y="2" width="7" height="6" rx="1" fill={p.roadStoneDark} opacity="0.3" />
                <rect x="2" y="9" width="6" height="7" rx="1" fill={p.roadStoneLight} opacity="0.25" />
                <rect x="10" y="10" width="6" height="6" rx="1" fill={p.roadStoneDark} opacity="0.2" />
              </pattern>
            </defs>

            {/* Main road — organic + geometric, drawn on scroll */}
            <path ref={roadRef} d={fullRoadD} stroke="url(#stonePat)" strokeWidth={34} fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke-dashoffset 0.1s linear' }} />

            {/* Fork: right branch off-screen */}
            <path ref={forkRightRef} d="M 420 1740 L 1100 1740" stroke="url(#stonePat)" strokeWidth={34} fill="none" strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.1s linear' }} />

            {/* Fork: down to diamond tip */}
            <path ref={forkDownRef} d="M 420 1740 L 420 1800" stroke="url(#stonePat)" strokeWidth={34} fill="none" strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.1s linear' }} />

            {/* Branch roads */}
            <path ref={branchLRef} d={pts2path(branchL)} stroke="url(#stonePat)" strokeWidth={34} fill="none" strokeLinecap="round" opacity={0.7} style={{ transition: 'stroke-dashoffset 0.1s linear' }} />
            <path ref={branchRRef} d={pts2path(branchR)} stroke="url(#stonePat)" strokeWidth={34} fill="none" strokeLinecap="round" opacity={0.7} style={{ transition: 'stroke-dashoffset 0.1s linear' }} />

            {/* Stream */}
            <path d={pts2path(stream)} stroke={dark ? '#8a9aaa' : '#a0b4c8'} strokeWidth={14} fill="none" strokeLinecap="round" opacity={dark ? 0.12 : 0.25} />
          </svg>

          {/* === HERO: Logo + Roof + TERRA VIVA === */}
          {/* Logo sitting on top of the roof */}
          <div style={{
            position: 'absolute',
            left: 160, top: 0,
            width: 520, height: 80,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            zIndex: 7, pointerEvents: 'none',
          }}>
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Terra Viva" style={{
              height: 160, width: 'auto',
              filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.4))',
              marginBottom: -90,
            }} />
          </div>
          {/* Roof with shadow */}
          <div style={{
            position: 'absolute', left: 160, top: 68.5,
            width: 520, height: 280,
            borderRadius: 15, overflow: 'hidden', zIndex: 5,
            boxShadow: '0 18px 50px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.3)',
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
          {/* Roof shadow on grass below */}
          <div style={{
            position: 'absolute', left: 150, top: 348,
            width: 540, height: 30,
            background: 'radial-gradient(ellipse 100% 100%, rgba(0,0,0,0.25) 0%, transparent 70%)',
            zIndex: 4, borderRadius: '50%',
          }} />

          {/* === TREES === */}
          {[...leftTrees, ...rightTrees].map((t, i) => (
            <div key={`tree${i}`} style={{
              position: 'absolute', left: t.x, top: t.y,
              width: t.s, height: t.s,
              borderRadius: '50%', overflow: 'hidden', zIndex: 5,
            }}>
              <AnimatedTexture type="tree" density={7} />
            </div>
          ))}

          {/* === "О нас" — marble veranda === */}
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

          {/* Marble columns */}
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

          {/* === About text over water — pointer-events: none for water interaction === */}
          <div style={{
            position: 'absolute', left: 130, top: 590,
            width: 402, height: 200, zIndex: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center',
            pointerEvents: 'none',
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

          {/* === Направления === */}
          <div style={{
            position: 'absolute', left: 0, top: 960,
            width: W, zIndex: 6,
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 32, fontWeight: 300, color: p.cream,
            display: 'flex', justifyContent: 'center',
            letterSpacing: '0.05em',
          }}>Направления</div>

          {/* === SERVICE CARDS === */}
          {services.map((s, i) => {
            const pos = svcPos(i)
            return (
              <div key={s.num} style={{
                position: 'absolute', left: pos.x, top: pos.y,
                width: SVC_CARD, height: SVC_CARD,
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

          {/* === Критерии качества === */}
          <div style={{
            position: 'absolute', left: 0, top: 1400,
            width: W, zIndex: 6,
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 32, fontWeight: 300, color: p.cream,
            display: 'flex', justifyContent: 'center',
            letterSpacing: '0.05em',
          }}>Критерии качества</div>

          {critItems.map((c, i) => {
            const pos = critPos(i)
            return (
              <div key={`crit${i}`} style={{
                position: 'absolute', left: pos.x, top: pos.y,
                width: CRIT_COL_W, height: 108, zIndex: 6, textAlign: 'center',
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

          {/* === Diamond — stone texture === */}
          <div style={{
            position: 'absolute', left: 200, top: DIAMOND_TOP,
            width: 440, height: 440,
            background: p.diamondGrad,
            transform: 'rotate(45deg)',
            zIndex: 5,
            boxShadow: '0 10px 50px rgba(0,0,0,0.4)',
            transition: 'background 0.8s ease',
            // Subtle stone veining
            backgroundImage: `
              ${p.diamondGrad},
              repeating-linear-gradient(
                135deg,
                transparent 0px,
                transparent 30px,
                rgba(180,170,150,0.06) 30px,
                rgba(180,170,150,0.06) 31px
              ),
              repeating-linear-gradient(
                45deg,
                transparent 0px,
                transparent 25px,
                rgba(120,110,90,0.04) 25px,
                rgba(120,110,90,0.04) 26px
              )
            `,
          }} />

          {/* === Lanterns around diamond === */}
          {lanternPositions.map((lp, i) => (
            <Lantern key={`lantern${i}`} x={lp.x} y={lp.y} lit={lanternsLit} dark={dark} />
          ))}

          {/* === Contact text === */}
          <div style={{
            position: 'absolute', left: 219, top: DIAMOND_TOP + 85,
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

          {/* === СВЯЗАТЬСЯ — marble monolith === */}
          <div
            style={{
              position: 'absolute', left: 300, top: DIAMOND_TOP + 220,
              width: 240, zIndex: 8,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center',
            }}
            onMouseEnter={() => { setLanternsHover(true); setLanternsLit(true) }}
            onMouseLeave={() => { setLanternsHover(false) }}
          >
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
              backgroundImage: `
                ${p.marbleBg},
                repeating-linear-gradient(
                  120deg,
                  transparent 0px, transparent 20px,
                  rgba(180,170,150,0.08) 20px, rgba(180,170,150,0.08) 21px
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
            <div style={{
              width: 240, height: 24,
              background: p.marbleSide,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundImage: `
                ${p.marbleSide},
                repeating-linear-gradient(
                  120deg,
                  transparent 0px, transparent 15px,
                  rgba(0,0,0,0.05) 15px, rgba(0,0,0,0.05) 16px
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
            position: 'absolute', left: 161.56, top: DIAMOND_TOP + 520,
            width: 516.87, height: 200, zIndex: 6,
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
