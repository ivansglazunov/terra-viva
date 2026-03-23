import { AnimatedTexture } from './AnimatedTexture'
import { TreeCircle } from './TreeCircle'

export function Hero() {
  return (
    <section className="hero-section" style={{
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #1a3300 0%, #336600 100%)',
    }}>
      <AnimatedTexture type="grass" density={600} />

      {/* Trees — left cluster (from drawio: 4 ели слева) */}
      <TreeCircle size={80} label="ель" top="20px" left="100px" />
      <TreeCircle size={120} label="ель" top="40px" left="10px" />
      <TreeCircle size={150} label="ель" top="130px" left="-30px" />
      <TreeCircle size={210} label="ель" top="260px" left="0px" />

      {/* Trees — right cluster */}
      <TreeCircle size={80} label="ель" top="20px" right="100px" />
      <TreeCircle size={120} label="ель" top="40px" right="10px" />
      <TreeCircle size={150} label="ель" top="130px" right="-30px" />
      <TreeCircle size={210} label="ель" top="260px" right="0px" />

      {/* Brown header plate (from drawio) */}
      <div style={{
        position: 'relative',
        zIndex: 5,
        background: '#663300',
        borderRadius: 15,
        padding: '3rem 4rem',
        textAlign: 'center',
        maxWidth: 520,
        width: '90%',
      }}>
        {/* Small brown square accent */}
        <div style={{
          position: 'absolute',
          top: -34,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 68,
          height: 68,
          background: '#663300',
        }} />

        <div style={{
          position: 'relative',
          background: 'white',
          borderRadius: 15,
          padding: '2rem 2.5rem',
          color: '#333',
        }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
            fontWeight: 300,
            letterSpacing: '0.1em',
            color: '#1a1a1a',
            margin: 0,
          }}>
            TERRA VIVA
          </h1>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(0.85rem, 2vw, 1.1rem)',
            fontWeight: 300,
            color: '#666',
            marginTop: '0.5rem',
          }}>
            живая земля · ландшафтная архитектура
          </p>
        </div>
      </div>

      {/* Scroll hint */}
      <div style={{
        position: 'absolute',
        bottom: '3rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        color: 'var(--stone)',
        opacity: 0,
        animation: 'fadeIn 2s ease 2s forwards',
      }}>
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5"
          style={{ animation: 'bounce 2s ease infinite' }}>
          <path d="M7 10l5 5 5-5" />
        </svg>
      </div>
    </section>
  )
}
