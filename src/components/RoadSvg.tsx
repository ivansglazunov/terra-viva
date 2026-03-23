import { useEffect, useRef } from 'react'

// Main road path extracted from drawio concept — a curved brown path connecting all sections
// The drawio shows a winding road from bottom to top through the page
const MAIN_ROAD = `
  M 420 4800
  C 420 4500, 700 4200, 500 3800
  C 300 3400, 780 3100, 840 2700
  C 900 2300, 420 2400, 200 2200
  C -40 2000, 20 1600, 300 1300
  C 560 1050, 630 1200, 640 1050
  C 650 900, 420 850, 420 700
`

// Side branch roads
const BRANCH_LEFT = `M -200 1900 C -100 1800, 32 1750, 120 1700`
const BRANCH_RIGHT = `M 900 2200 C 850 2100, 790 2000, 750 1950`

export function RoadSvg() {
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    const length = path.getTotalLength()
    path.style.strokeDasharray = `${length}`
    path.style.strokeDashoffset = `${length}`

    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = Math.min(scrollTop / docHeight, 1)
      path.style.strokeDashoffset = `${length * (1 - progress)}`
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <svg
      className="road-svg"
      viewBox="-200 0 1100 5000"
      preserveAspectRatio="none"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.35,
      }}
    >
      {/* Main road */}
      <path
        ref={pathRef}
        d={MAIN_ROAD}
        stroke="#663300"
        strokeWidth="34"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: 'stroke-dashoffset 0.1s linear' }}
      />
      {/* Branch roads — always visible */}
      <path
        d={BRANCH_LEFT}
        stroke="#663300"
        strokeWidth="34"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d={BRANCH_RIGHT}
        stroke="#663300"
        strokeWidth="34"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Decorative stream (light path from drawio) */}
      <path
        d="M 580 1500 C 500 1450, 360 1450, 240 1420 C 130 1390, 80 1350, 80 1280 C 80 1200, 180 1140, 260 1120 C 340 1100, 440 1110, 528 1130"
        stroke="#A9C4EB"
        strokeWidth="14"
        fill="none"
        strokeLinecap="round"
        opacity="0.25"
      />
    </svg>
  )
}
