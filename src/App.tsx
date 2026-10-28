import { About } from './components/About'
import { Footer } from './components/Footer'
import { Landing } from './components/Landing'
import { QuestionScreen } from './components/QuestionScreen'
import { RevealScreen } from './components/Reveal'
import { ResultScreen, ReviewScreen } from './components/Result'
import { useGame } from './store/game'

export function App() {
  const screen = useGame((s) => s.screen)
  return (
    <div className="flex min-h-screen flex-col">
      {screen === 'landing' && <Landing />}
      {screen === 'about' && <About />}
      {screen === 'question' && <QuestionScreen />}
      {screen === 'reveal' && <RevealScreen />}
      {screen === 'result' && <ResultScreen />}
      {screen === 'review' && <ReviewScreen />}
      <Footer />
    </div>
  )
}
