import { motion } from "framer-motion"
import { Button } from "./ui/button"

export function Hero() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } },
  }

  const photoAnim = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 80, damping: 20, delay: 0.2 } },
  }

  return (
    <section className="min-h-screen flex items-center justify-center px-6 py-20 lg:py-0 relative overflow-hidden">
      {/* Vibrant Background glows */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
        <motion.div 
          className="flex flex-col items-start space-y-6 order-2 lg:order-1"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item} className="space-y-2">
            <h2 className="text-muted-foreground font-medium tracking-widest uppercase text-sm mb-4">Welcome to my universe</h2>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Vaibhav.
            </h1>
            <h3 className="text-2xl md:text-3xl text-muted-foreground font-medium">
              Software Developer & AI/ML Student
            </h3>
          </motion.div>
          
          <motion.p variants={item} className="text-lg text-muted-foreground leading-relaxed max-w-lg">
            I'm a B.Tech CSE (AI & ML) student at Babu Banarasi Das Institute of Technology & Management, Lucknow. I am passionate about Artificial Intelligence, building scalable web applications, and crafting seamless user experiences.
          </motion.p>
          
          <motion.div variants={item} className="flex flex-wrap gap-4 pt-4">
            <a href="#projects" className="inline-block">
              <Button size="lg" className="rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all font-semibold px-8 bg-gradient-to-r from-primary to-accent border-0">
                View Projects
              </Button>
            </a>
            <a href="/Vaibhav_Srivastava_Resume.html" target="_blank" className="inline-block">
              <Button variant="outline" size="lg" className="rounded-full font-semibold px-8 border-border hover:bg-secondary/80">
                Download Resume
              </Button>
            </a>
          </motion.div>
        </motion.div>

        <motion.div 
          className="flex justify-center lg:justify-end order-1 lg:order-2"
          variants={photoAnim}
          initial="hidden"
          animate="show"
        >
          <div className="relative group">
            {/* Outer glow ring */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary/30 to-accent/30 opacity-70 blur-md transition duration-500 group-hover:opacity-100"></div>
            {/* Image container */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full border-2 border-white shadow-xl overflow-hidden bg-secondary">
              <img 
                src="/IMG_20240430_224119_235.jpg" 
                alt="Vaibhav Srivastava - Developer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
