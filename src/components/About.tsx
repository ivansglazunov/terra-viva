import { AnimatedTexture } from './AnimatedTexture'
import { useReveal } from '../hooks/useReveal'

export function About() {
  const ref = useReveal()

  return (
    <section style={{
      position: 'relative',
      width: '100%',
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      background: 'var(--bg-green)',
    }}>
      {/* Water pond (from drawio: blue ellipses) */}
      <div style={{
        position: 'absolute',
        left: '10%',
        top: '15%',
        width: '55%',
        height: '60%',
        borderRadius: '50%',
        background: 'rgba(169, 196, 235, 0.15)',
        overflow: 'hidden',
      }}>
        <AnimatedTexture type="water" density={500} />
      </div>

      {/* Second pond overlap */}
      <div style={{
        position: 'absolute',
        right: '5%',
        top: '12%',
        width: '35%',
        height: '55%',
        borderRadius: '50%',
        background: 'rgba(169, 196, 235, 0.12)',
        overflow: 'hidden',
      }}>
        <AnimatedTexture type="water" density={600} />
      </div>

      {/* "О нас" circle (from drawio: white circle) */}
      <div ref={ref} style={{
        position: 'relative',
        zIndex: 5,
        marginLeft: 'auto',
        marginRight: '5%',
        maxWidth: 500,
        padding: '3rem',
        opacity: 0,
        transform: 'translateY(30px)',
        transition: 'opacity 1s ease, transform 1s ease',
      }}>
        {/* Decorative white circle behind text */}
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '50%',
          transform: 'translate(50%, -50%)',
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          zIndex: -1,
        }} />

        {/* Compass dots (from drawio: 4 gray dots in cross pattern) */}
        {[0, 90, 180, 270, 40, 130, 220, 310].map((angle, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: 'rgba(230,230,230,0.2)',
            transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-140px)`,
          }} />
        ))}

        <p style={{
          fontSize: '0.7rem',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'var(--moss)',
          marginBottom: '1rem',
        }}>
          О нас
        </p>
        <h2 style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          color: 'var(--cream)',
          lineHeight: 1.2,
          marginBottom: '1.5rem',
        }}>
          Каждый ландшафт — живой организм
        </h2>
        <p style={{
          fontSize: '0.95rem',
          lineHeight: 1.8,
          color: 'var(--stone)',
        }}>
          Мы создаём живые пространства, где природа и архитектура становятся единым целым.
          Каждый проект — диалог с землёй: мы слушаем рельеф, читаем свет и воплощаем
          пространства, которые живут собственной жизнью.
        </p>
      </div>
    </section>
  )
}
