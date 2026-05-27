import { motion } from "framer-motion"
import { Home, User, Briefcase, Mail } from "lucide-react"
import { cn } from "../lib/utils"
import { useState, useEffect, useRef } from "react"

export function Navbar() {
  const [activeSection, setActiveSection] = useState("home")
  const [isVisible, setIsVisible] = useState(true)
  const isHovering = useRef(false)

  const navItems = [
    { name: "Home", href: "#", icon: <Home className="w-5 h-5" /> },
    { name: "About", href: "#about", icon: <User className="w-5 h-5" /> },
    { name: "Projects", href: "#projects", icon: <Briefcase className="w-5 h-5" /> },
    { name: "Contact", href: "#contact", icon: <Mail className="w-5 h-5" /> },
  ]

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    const handleActivity = () => {
      setIsVisible(true)
      clearTimeout(timeoutId)
      
      // Hide navbar after 2 seconds of inactivity
      timeoutId = setTimeout(() => {
        // Don't hide if we're at the very top or if hovering over the navbar
        if (window.scrollY > 50 && !isHovering.current) {
          setIsVisible(false)
        }
      }, 2000)
    }

    const handleScroll = () => {
      handleActivity()
      
      const sections = ["contact", "projects", "about"]
      const scrollPosition = window.scrollY + 200

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(section)
          return
        }
      }
      setActiveSection("home")
    }

    // Initial timer start
    handleActivity()

    window.addEventListener("scroll", handleScroll)
    window.addEventListener("mousemove", handleActivity)
    
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("mousemove", handleActivity)
      clearTimeout(timeoutId)
    }
  }, [])

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: isVisible ? 0 : -100, opacity: isVisible ? 1 : 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50"
      onMouseEnter={() => {
        isHovering.current = true
        setIsVisible(true)
      }}
      onMouseLeave={() => {
        isHovering.current = false
      }}
    >
      <div className="flex items-center gap-2 bg-card/80 backdrop-blur-xl border border-border p-2 rounded-full shadow-lg">
        {navItems.map((item) => {
          const isActive = activeSection === item.href.replace("#", "") || (activeSection === "home" && item.href === "#")
          
          return (
            <a
              key={item.name}
              href={item.href}
              className={cn(
                "relative flex items-center justify-center w-12 h-12 rounded-full text-muted-foreground transition-all duration-300 hover:text-foreground",
                isActive && "text-primary"
              )}
              aria-label={item.name}
              title={item.name}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-primary/10 rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">{item.icon}</span>
            </a>
          )
        })}
      </div>
    </motion.nav>
  )
}
