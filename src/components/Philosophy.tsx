import { AnimatedTexture } from './AnimatedTexture'
import { useReveal } from '../hooks/useReveal'

export function Philosophy() {
  const ref = useReveal()

  return (
    <section style={{
      position: 'relative',
      padding: '8rem 2rem',
      textAlign: 'center',
      background: 'var(--bg-green)',
      overflow: 'hidden',
    }}>
      <AnimatedTexture type="grass" density={1200} />

      <div ref={ref} style={{
        position: 'relative',
        zIndex: 5,
        opacity: 0,
        transform: 'translateY(30px)',
        transition: 'opacity 1s ease, transform 1s ease',
      }}>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(1.6rem, 3.5vw, 2.8rem)',
          fontWeight: 300,
          fontStyle: 'italic',
          color: 'var(--stone-light)',
          maxWidth: 700,
          margin: '0 auto',
          lineHeight: 1.5,
        }}>
          «Ландшафт — это не декорация. Это живая система, которая дышит, растёт и меняется вместе с вами.»
        </p>
        <p style={{
          marginTop: '2rem',
          fontSize: '0.8rem',
          color: 'var(--moss)',
          letterSpacing: '0.2em',
        }}>
          — ФИЛОСОФИЯ TERRA VIVA
        </p>
      </div>
    </section>
  )
}
