import { Hero } from './components/Hero'
import { About } from './components/About'
import { Services } from './components/Services'
import { Criteria } from './components/Criteria'
import { Philosophy } from './components/Philosophy'
import { Contact } from './components/Contact'
import { RoadSvg } from './components/RoadSvg'
import './App.css'

function App() {
  return (
    <div className="terra-viva">
      <RoadSvg />
      <Hero />
      <About />
      <Services />
      <Criteria />
      <Philosophy />
      <Contact />
    </div>
  )
}

export default App
