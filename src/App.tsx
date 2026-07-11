import { Hero } from "./components/Hero"
import { About } from "./components/About"
import { Achievements } from "./components/Achievements"
import { Projects } from "./components/Projects"
import { Contact } from "./components/Contact"
import { Navbar } from "./components/Navbar"
import { Footer } from "./components/Footer"

function App() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/30 selection:text-primary">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Achievements />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

export default App
