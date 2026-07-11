import { useState, useEffect } from "react"
import { GithubIcon, LinkedinIcon } from "./Icons"
import { Mail, Eye } from "lucide-react"

export function Footer() {
  const [views, setViews] = useState<number | null>(null)

  useEffect(() => {
    // Silently fetch and increment the visitor counter on mount
    fetch('/api/visitor')
      .then(res => res.json())
      .then(data => {
        if (data.views) setViews(data.views)
      })
      .catch(err => console.error("Failed to fetch views", err))
  }, [])

  return (
    <footer className="w-full bg-secondary/50 py-12 px-6 border-t border-border mt-12">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* Left Side: Brand & Message */}
        <div className="text-center md:text-left flex flex-col gap-2">
          <h3 className="text-xl font-bold tracking-tight text-foreground">Vaibhav Srivastava</h3>
          <p className="text-sm text-muted-foreground">
            Building intelligent applications and seamless experiences.
          </p>
          
          {/* Live Visitor Counter Badge */}
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-background border border-border rounded-full shadow-sm text-xs font-medium text-muted-foreground w-fit mx-auto md:mx-0 transition-all hover:border-primary/50">
            <Eye className="w-4 h-4 text-primary" />
            {views ? (
               <span><b className="text-foreground">{views.toLocaleString()}</b> Total Views</span>
            ) : (
               <span className="animate-pulse">Loading...</span>
            )}
          </div>
        </div>

        {/* Center: Social Links */}
        <div className="flex gap-4">
          <a href="https://github.com/Vaibhavsrivastava-6105" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" aria-label="GitHub">
            <GithubIcon className="w-5 h-5" />
          </a>
          <a href="https://www.linkedin.com/in/vaibhavsrivastava5021/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" aria-label="LinkedIn">
            <LinkedinIcon className="w-5 h-5" />
          </a>
          <a href="mailto:vaibhavsrivastava5021@gmail.com" className="p-2 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" aria-label="Email">
            <Mail className="w-5 h-5" />
          </a>
        </div>
        
      </div>
      
      {/* Bottom: Copyright */}
      <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Vaibhav Srivastava. All rights reserved.</p>
        <p>Built with React, Tailwind CSS, & Framer Motion.</p>
      </div>
    </footer>
  )
}
