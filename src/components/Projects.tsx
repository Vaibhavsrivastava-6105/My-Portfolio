import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card"
import { Badge } from "./ui/badge"
import { ExternalLink } from "lucide-react"
import { GithubIcon } from "./Icons"

const projects = [
  {
    title: "Herbalia",
    description: "An AI-powered botanical assistant and plant doctor. Features a universal plant identifier, an automated disease & health scanner, and a generative AI chat assistant.",
    tech: ["JavaScript", "HTML/CSS", "TensorFlow.js", "Gemini API"],
    github: "https://github.com/Vaibhavsrivastava-6105/herbalia",
    demo: "https://herbaliaweb.vercel.app/"
  },
  {
    title: "AI Product Recommendation System",
    description: "An intelligent recommendation engine utilizing AI and ML algorithms to suggest relevant products to users based on preferences and behavior.",
    tech: ["Python", "Machine Learning", "React", "API Integration"],
    github: "https://github.com/Vaibhavsrivastava-6105/Product-Recommendation-System-",
    demo: "https://project-recommendation-system.vercel.app/"
  },
  {
    title: "Responsive E-commerce Website",
    description: "A fully responsive e-commerce platform featuring product listings, search functionality, and a shopping cart with dynamic state management.",
    tech: ["React", "HTML", "CSS", "JavaScript"],
    github: "https://github.com/Vaibhavsrivastava-6105",
    demo: "#"
  },
  {
    title: "Price Tracking App",
    description: "An application to monitor product prices and display trends over time, featuring automated price updates and responsive dashboards.",
    tech: ["React", "HTML", "CSS", "JavaScript"],
    github: "https://github.com/Vaibhavsrivastava-6105",
    demo: "#"
  }
]

export function Projects() {
  return (
    <section className="py-24 px-6 bg-secondary/20" id="projects">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold mb-4">Featured Projects</h2>
          <div className="w-20 h-1 bg-primary mb-8 rounded-full"></div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 80, damping: 20, delay: index * 0.1 }}
              whileHover={{ y: -8, transition: { type: "spring", stiffness: 300, damping: 20 } }}
              className="h-full"
            >
              <Card className="h-full flex flex-col border-border bg-card shadow-sm hover:shadow-lg overflow-hidden group hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{project.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription className="text-base mb-6">
                    {project.description}
                  </CardDescription>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map(tech => (
                      <Badge key={tech} variant="secondary" className="bg-secondary/50">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="pt-0 gap-4">
                  <a href={project.github} target="_blank" rel="noopener noreferrer" aria-label={`GitHub repo for ${project.title}`} className="text-muted-foreground hover:text-primary transition-colors p-2">
                    <GithubIcon className="w-5 h-5" />
                  </a>
                  <a href={project.demo} target="_blank" rel="noopener noreferrer" aria-label={`Live demo for ${project.title}`} className="text-muted-foreground hover:text-primary transition-colors p-2">
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
