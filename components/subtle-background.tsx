"use client"

import { useEffect, useState } from "react"

export function SubtleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      {/* Gradient Orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-blue-600/20 to-transparent rounded-full blur-3xl animate-pulse-gentle"></div>
      <div
        className="absolute top-40 right-32 w-48 h-48 bg-gradient-to-br from-slate-400/10 to-transparent rounded-full blur-3xl animate-pulse-gentle"
        style={{ animationDelay: "2s" }}
      ></div>
      <div
        className="absolute bottom-32 left-32 w-56 h-56 bg-gradient-to-br from-blue-500/15 to-transparent rounded-full blur-3xl animate-pulse-gentle"
        style={{ animationDelay: "4s" }}
      ></div>
      <div
        className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-slate-300/10 to-transparent rounded-full blur-3xl animate-pulse-gentle"
        style={{ animationDelay: "6s" }}
      ></div>

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0, 191, 255, 0.3) 1px, transparent 0)`,
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>

      {/* Subtle Lines */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-400/20 to-transparent"></div>
        <div className="absolute left-1/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent"></div>
        <div className="absolute right-1/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-slate-400/15 to-transparent"></div>
      </div>
    </div>
  )
}

export function MinimalParticles() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Pre-defined positions to avoid server/client mismatch
  const particles = [
    { left: 10, top: 20, delay: 0, duration: 18 },
    { left: 30, top: 60, delay: 2, duration: 20 },
    { left: 60, top: 15, delay: 4, duration: 22 },
    { left: 80, top: 70, delay: 1, duration: 19 },
    { left: 25, top: 85, delay: 3, duration: 21 },
    { left: 75, top: 40, delay: 5, duration: 17 },
    { left: 45, top: 90, delay: 2.5, duration: 23 },
    { left: 90, top: 30, delay: 4.5, duration: 16 },
  ]

  if (!isMounted) {
    return null
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-blue-400/20 rounded-full animate-float-gentle"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
