import { AnimatedTexture } from './AnimatedTexture'
import { TreeCircle } from './TreeCircle'
import { useReveal } from '../hooks/useReveal'

const SERVICES = [
  { num: '01', name: 'Проектирование', desc: 'Концепция, планировка, 3D-визуализация. Каждый проект начинается с понимания ландшафта.' },
  { num: '02', name: 'Благоустройство', desc: 'Мощение, подпорные стенки, лестницы, мостики. Натуральный камень и инженерные решения.' },
  { num: '03', name: 'Озеленение', desc: 'Посадка деревьев, кустарников, многолетников. Формовка ниваки, топиарное искусство.' },
  { num: '04', name: 'Водные объекты', desc: 'Пруды, ручьи, фонтаны. Создаём водные системы, которые живут в гармонии с ландшафтом.' },
  { num: '05', name: 'Освещение', desc: 'Архитектурная подсветка, функциональное и декоративное освещение ландшафта.' },
  { num: '06', name: 'Уход', desc: 'Сезонное обслуживание, стрижка, обработка, подготовка к зиме.' },
  { num: '07', name: 'Консультации', desc: 'Экспертная оценка участка, рекомендации по развитию существующего ландшафта.' },
]

function ServiceCard({ num, name, desc }: typeof SERVICES[0]) {
  const ref = useReveal(0.15)

  return (
    <div ref={ref} style={{
      position: 'relative',
      background: 'var(--tree)',
      borderRadius: 15,
      padding: '2rem',
      overflow: 'hidden',
      opacity: 0,
      transform: 'translateY(30px)',
      transition: 'opacity 0.8s ease, transform 0.8s ease',
    }}>
      <AnimatedTexture type="grass" density={1200} />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '2rem',
          color: 'rgba(255,255,255,0.3)',
          marginBottom: '0.8rem',
        }}>{num}</div>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '1.3rem',
          color: 'var(--cream)',
          marginBottom: '0.6rem',
        }}>{name}</div>
        <div style={{
          fontSize: '0.85rem',
          lineHeight: 1.6,
          color: 'rgba(255,255,255,0.7)',
        }}>{desc}</div>
      </div>
    </div>
  )
}

export function Services() {
  return (
    <section style={{
      position: 'relative',
      width: '100%',
      padding: '6rem 2rem',
      background: 'var(--bg-green)',
      overflow: 'hidden',
    }}>
      <AnimatedTexture type="grass" density={1000} />

      {/* Tree accent (from drawio: дуб + ветка дуба) */}
      <div style={{ position: 'absolute', right: '-20px', top: '0' }}>
        <TreeCircle size={210} label="дуб" top="0" right="0" />
        <TreeCircle size={126} label="" top="30px" right="-60px" />
      </div>

      <div style={{
        position: 'relative',
        zIndex: 5,
        maxWidth: 900,
        margin: '0 auto',
      }}>
        <h2 style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          color: 'var(--cream)',
          textAlign: 'center',
          marginBottom: '3rem',
        }}>
          Направления
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.2rem',
        }}>
          {SERVICES.map((s) => (
            <ServiceCard key={s.num} {...s} />
          ))}
        </div>
      </div>
    </section>
  )
}
