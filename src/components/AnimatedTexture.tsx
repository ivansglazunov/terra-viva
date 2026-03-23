import { useCallback } from 'react'
import { useAnimatedTexture, setWaterMouse, clearWaterMouse, type TextureType } from '../hooks/useAnimatedTexture'

interface Props {
  type: TextureType
  className?: string
  density?: number
}

export function AnimatedTexture({ type, className = '', density }: Props) {
  const canvasRef = useAnimatedTexture(type, density)

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
