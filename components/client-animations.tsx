"use client"
import { useScrollAnimation } from "@/components/scroll-animations"
import { useEffect } from "react"

export default function ClientAnimations() {
  useScrollAnimation()

  useEffect(() => {
    // Trigger initial animations for hero section after a short delay
    const timer = setTimeout(() => {
      const heroElements = document.querySelectorAll('.scroll-reveal-left, .scroll-reveal-scale, .scroll-reveal')
      heroElements.forEach((el) => {
        const rect = el.getBoundingClientRect()
        // If element is in the top portion of the viewport, animate it immediately
        if (rect.top < window.innerHeight * 0.8) {
          el.classList.add('revealed')
        }
      })
    }, 200)

    return () => clearTimeout(timer)
  }, [])

  return null
}