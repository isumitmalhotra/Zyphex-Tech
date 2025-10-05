"use client"

import { useEffect, useRef, useState } from "react"

export function useScrollAnimation() {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -30px 0px",
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed")
        }
      })
    }, observerOptions)

    // Observe all scroll reveal elements
    const scrollElements = document.querySelectorAll(
      ".scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale, .scroll-reveal-rotate",
    )

    // Add a small delay to ensure elements are properly initialized
    const timer = setTimeout(() => {
      scrollElements.forEach((el) => {
        observer.observe(el)
        // For elements already in viewport, immediately reveal them
        const rect = el.getBoundingClientRect()
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0
        if (isInViewport) {
          el.classList.add("revealed")
        }
      })
    }, 100)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])
}

export function ScrollProgressBar() {
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateScrollProgress = () => {
      if (!progressRef.current) return

      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = (scrollTop / docHeight) * 100

      progressRef.current.style.width = `${scrollPercent}%`
    }

    window.addEventListener("scroll", updateScrollProgress)
    return () => window.removeEventListener("scroll", updateScrollProgress)
  }, [])

  return (
    <div className="scroll-progress">
      <div ref={progressRef} className="scroll-progress-bar" />
    </div>
  )
}

export function ZyphexParticles() {
  const [particles, setParticles] = useState<Array<{
    left: string;
    top: string;
    animationDelay: string;
    animationDuration: string;
  }>>([]);

  useEffect(() => {
    // Generate particles only on client to avoid hydration mismatch
    const generatedParticles = Array.from({ length: 20 }).map((_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 10}s`,
      animationDuration: `${8 + Math.random() * 4}s`,
    }));
    setParticles(generatedParticles);
  }, []);

  return (
    <div className="zyphex-particles">
      {particles.map((particle, i: number) => (
        <div
          key={i}
          className="zyphex-particle"
          style={{
            left: particle.left,
            top: particle.top,
            animationDelay: particle.animationDelay,
            animationDuration: particle.animationDuration,
          }}
        />
      ))}
    </div>
  )
}
