import { useCallback } from 'react'
import { useAnimatedTexture, useStaticTexture, setWaterMouse, clearWaterMouse, type TextureType } from '../hooks/useAnimatedTexture'

interface Props {
  type: TextureType
  className?: string
  density?: number
}

// Types that are animated per-frame
const ANIMATED_TYPES: TextureType[] = ['grass', 'water']

export function AnimatedTexture({ type, className = '', density }: Props) {
  const isAnimated = ANIMATED_TYPES.includes(type)
  const animatedRef = useAnimatedTexture(isAnimated ? type : null, density)
  const staticRef = useStaticTexture(!isAnimated ? type : null, density)
  const canvasRef = isAnimated ? animatedRef : staticRef

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (type !== 'water') return
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const x = (e.clientX - rect.left) * (canvas.width / rect.width / dpr)
    const y = (e.clientY - rect.top) * (canvas.height / rect.height / dpr)
    setWaterMouse(x, y)
  }, [type])

  const handleMouseLeave = useCallback(() => {
    if (type === 'water') clearWaterMouse()
  }, [type])

  return (
    <canvas
      ref={canvasRef}
      className={`animated-texture ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: type === 'water' ? 'auto' : 'none',
      }}
    />
  )
}
