import { AnimatedTexture } from './AnimatedTexture'

interface Props {
  size: number
  label?: string
  top?: string
  left?: string
  right?: string
  className?: string
}

export function TreeCircle({ size, label, top, left, right, className = '' }: Props) {
  return (
    <div
      className={`tree-circle ${className}`}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#428200',
        overflow: 'hidden',
        top,
        left,
        right,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
      }}
    >
      <AnimatedTexture type="tree" density={400} />
      {label && (
        <span style={{
          position: 'relative',
          zIndex: 3,
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: size > 100 ? '1rem' : '0.75rem',
          color: 'rgba(255,255,255,0.6)',
          textAlign: 'center',
        }}>
          {label}
        </span>
      )}
    </div>
  )
}
