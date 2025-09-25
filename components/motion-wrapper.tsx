"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface MotionWrapperProps {
  children: React.ReactNode
  className?: string
  animation?: "fadeInUp" | "fadeInLeft" | "fadeInRight" | "scaleIn" | "slideInUp" | "rotateIn" | "bounceIn"
  delay?: number
  duration?: number
  threshold?: number
  once?: boolean
}

export default function MotionWrapper({
  children,
  className,
  animation = "fadeInUp",
  delay = 0,
  duration = 0.8,
  threshold = 0.1,
  once = true,
}: MotionWrapperProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && (!once || !hasAnimated)) {
          setTimeout(() => {
            setIsVisible(true)
            if (once) setHasAnimated(true)
          }, delay)
        } else if (!once && !entry.isIntersecting) {
          setIsVisible(false)
        }
      },
      { threshold }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [delay, threshold, once, hasAnimated])

  const animationClasses = {
    fadeInUp: isVisible ? "animate-fade-in-up-motion" : "opacity-0 translate-y-8",
    fadeInLeft: isVisible ? "animate-fade-in-left-motion" : "opacity-0 -translate-x-8",
    fadeInRight: isVisible ? "animate-fade-in-right-motion" : "opacity-0 translate-x-8",
    scaleIn: isVisible ? "animate-scale-in-motion" : "opacity-0 scale-95",
    slideInUp: isVisible ? "animate-slide-in-up-motion" : "opacity-0 translate-y-12",
    rotateIn: isVisible ? "animate-rotate-in-motion" : "opacity-0 rotate-12 scale-95",
    bounceIn: isVisible ? "animate-bounce-in-motion" : "opacity-0 scale-50",
  }

  return (
    <div
      ref={elementRef}
      className={cn(
        "transition-all duration-700 ease-out",
        animationClasses[animation],
        className
      )}
      style={{ transitionDuration: `${duration}s` }}
    >
      {children}
    </div>
  )
}
