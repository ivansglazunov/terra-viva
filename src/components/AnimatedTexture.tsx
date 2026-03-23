import { useAnimatedTexture, type TextureType } from '../hooks/useAnimatedTexture'

interface Props {
  type: TextureType
  className?: string
  density?: number
}

export function AnimatedTexture({ type, className = '', density }: Props) {
  const canvasRef = useAnimatedTexture(type, density)

  return (
    <canvas
      ref={canvasRef}
      className={`animated-texture ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  )
}
