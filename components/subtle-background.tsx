"use client"

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
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-blue-400/20 rounded-full animate-float-gentle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${15 + Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  )
}
