import { AnimatedTexture } from './AnimatedTexture'
import { useReveal } from '../hooks/useReveal'

export function Contact() {
  const ref = useReveal()

  return (
    <section style={{
      position: 'relative',
      padding: '6rem 2rem',
      textAlign: 'center',
      background: 'var(--bg-dark)',
      overflow: 'hidden',
    }}>
      <AnimatedTexture type="grass" density={1500} />

      {/* Diamond shape (from drawio: rhombus) */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(45deg)',
        width: 300,
        height: 300,
        background: '#663300',
        opacity: 0.15,
        borderRadius: 15,
        zIndex: 1,
      }} />

      <div ref={ref} style={{
        position: 'relative',
        zIndex: 5,
        opacity: 0,
        transform: 'translateY(30px)',
        transition: 'opacity 1s ease, transform 1s ease',
      }}>
        <h2 style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          color: 'var(--cream)',
          marginBottom: '1rem',
        }}>
          Начнём проект
        </h2>
        <p style={{
          fontSize: '1rem',
          color: 'var(--stone)',
          maxWidth: 500,
          margin: '0 auto 2.5rem',
          lineHeight: 1.6,
        }}>
          Расскажите о вашем участке — мы предложим решение
        </p>

        <a
          href="tel:+79263207755"
          style={{
            display: 'inline-block',
            padding: '1rem 2.5rem',
            background: 'white',
            color: '#333',
            borderRadius: 4,
            textDecoration: 'none',
            fontSize: '1.1rem',
            fontWeight: 500,
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          СВЯЗАТЬСЯ
          <span style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginTop: '0.3rem' }}>
            +7 926 320-77-55
          </span>
        </a>
      </div>

      {/* Footer */}
      <div style={{
        position: 'relative',
        zIndex: 5,
        marginTop: '6rem',
        paddingTop: '2rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <p style={{
          fontSize: '0.75rem',
          color: 'var(--stone)',
          opacity: 0.4,
          letterSpacing: '0.15em',
        }}>
          TERRA VIVA · Живая Земля · Ландшафтная архитектура
        </p>
      </div>
    </section>
  )
}
