import { motion } from "framer-motion"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import portfolioData from "../data/portfolio.json"

export function Achievements() {
  const achievements = portfolioData.achievements || [];

  if (achievements.length === 0) return null;

  return (
    <section className="py-24 px-6 relative bg-secondary/30" id="achievements">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold mb-4">Achievements & Certifications</h2>
          <div className="w-20 h-1 bg-primary mb-8 rounded-full"></div>
          <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
            A showcase of my continuous learning, certifications, and milestones in the tech industry.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {achievements.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 100, damping: 15, delay: index * 0.1 }}
            >
              <Card className="h-full border-border bg-card shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-300">
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h3 className="text-xl font-bold text-foreground leading-tight">{item.title}</h3>
                    {item.badgeUrl && item.badgeUrl !== "#" && (
                      <img src={item.badgeUrl} alt="Badge" className="h-8 object-contain shrink-0" />
                    )}
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed mb-8 flex-grow">
                    {item.description}
                  </p>
                  
                  {item.certificateUrl && item.certificateUrl !== "#" && (
                    <div className="mt-auto">
                      <a href={item.certificateUrl} target="_blank" rel="noreferrer">
                        <Button variant="outline" className="w-full sm:w-auto font-medium hover:bg-primary hover:text-primary-foreground border-primary/50 transition-colors">
                          View Certificate
                        </Button>
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
