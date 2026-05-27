import { motion } from "framer-motion"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Button } from "./ui/button"
import { Mail } from "lucide-react"
import { GithubIcon, LinkedinIcon } from "./Icons"
import { useState } from "react"

export function Contact() {
  const [result, setResult] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setResult("Sending...")

    const formData = new FormData(event.currentTarget)
    formData.append("access_key", "891298d7-4fe8-4d73-a511-9f3a656f9960")

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setResult("Message sent successfully! I'll get back to you soon.")
        event.currentTarget.reset()
      } else {
        console.error("Error", data)
        setResult(data.message)
      }
    } catch (error) {
      setResult("An error occurred. Please try again later.")
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setResult(""), 5000)
    }
  }

  return (
    <section className="py-24 px-6 relative" id="contact">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold mb-4">Get In Touch</h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-8 rounded-full"></div>
          <p className="text-lg text-muted-foreground">
            Whether you have a question, a project opportunity, or just want to say hi, I'll try my best to get back to you!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
          >
            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium leading-none">Name</label>
                <Input id="name" name="name" required placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none">Email</label>
                <Input id="email" name="email" type="email" required placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium leading-none">Message</label>
                <Textarea id="message" name="message" required placeholder="Your message..." className="min-h-[150px]" />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
              {result && (
                <p className={`text-sm font-medium text-center transition-all ${result.includes("successfully") ? "text-green-500" : "text-primary"}`}>
                  {result}
                </p>
              )}
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            className="flex flex-col justify-center items-center md:items-start space-y-8"
          >
            <div className="text-center md:text-left">
              <h3 className="text-xl font-semibold mb-2">Connect with me</h3>
              <p className="text-muted-foreground">Feel free to reach out across any of these platforms.</p>
            </div>
            
            <div className="flex gap-6">
              <a href="https://github.com/Vaibhavsrivastava-6105" target="_blank" rel="noopener noreferrer" className="p-4 rounded-full bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110" aria-label="GitHub">
                <GithubIcon className="w-6 h-6" />
              </a>
              <a href="https://www.linkedin.com/in/vaibhavsrivastava5021/" target="_blank" rel="noopener noreferrer" className="p-4 rounded-full bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110" aria-label="LinkedIn">
                <LinkedinIcon className="w-6 h-6" />
              </a>
              <a href="mailto:vaibhavsrivastava5021@gmail.com" className="p-4 rounded-full bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110" aria-label="Email">
                <Mail className="w-6 h-6" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
