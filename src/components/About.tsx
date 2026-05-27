import { motion } from "framer-motion"
import { Card, CardContent } from "./ui/card"

const techStack = [
  { name: "Python", color: "text-blue-500", icon: "🐍" },
  { name: "React", color: "text-blue-400", icon: "⚛️" },
  { name: "Java & C++", color: "text-orange-500", icon: "☕" },
  { name: "HTML & CSS", color: "text-orange-400", icon: "🌐" },
  { name: "Machine Learning", color: "text-green-500", icon: "🤖" },
  { name: "Git & Actions", color: "text-red-500", icon: "🛠️" },
]

export function About() {
  return (
    <section className="py-24 px-6 relative" id="about">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold mb-4">About My Journey</h2>
          <div className="w-20 h-1 bg-primary mb-8 rounded-full"></div>
          <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
            My programming journey is driven by a deep curiosity for Artificial Intelligence and web development. 
            I specialize in building intelligent applications using Python, creating dynamic user interfaces with React, 
            and ensuring smooth development workflows with Git and GitHub Actions. I love translating complex problems 
            into efficient, scalable code and delivering seamless digital experiences.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {techStack.map((tech, index) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 100, damping: 15, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, transition: { type: "spring", stiffness: 300, damping: 15 } }}
            >
              <Card className="h-full border-border bg-card shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full gap-4">
                  <div className="text-4xl">{tech.icon}</div>
                  <h3 className="font-semibold">{tech.name}</h3>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
