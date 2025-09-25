"use client"

import type React from "react"

import { 
  Code, Cloud, Database, Smartphone, Shield, Zap, BarChart3, Cog, Globe, Cpu,
  Users, ArrowRight, CheckCircle, Star, Quote, Target, Award, Heart
} from "lucide-react"

// Icon mapping for string-based icon names
const IconMap = {
  Code,
  Cloud, 
  Database,
  Smartphone,
  Shield,
  Zap,
  BarChart3,
  Cog,
  Globe,
  Cpu,
  Users,
  ArrowRight,
  CheckCircle,
  Star,
  Quote,
  Target,
  Award,
  Heart
} as const

interface Icon3DProps {
  icon: keyof typeof IconMap | string
  className?: string
  size?: number
  color?: string
}

export function Icon3D({ icon, className = "", size = 24, color = "currentColor" }: Icon3DProps) {
  // Default to Code icon if not found
  const IconComponent = typeof icon === 'string' ? (IconMap[icon as keyof typeof IconMap] || Code) : Code
  
  return (
    <div className={`zyphex-3d-icon ${className}`}>
      <IconComponent size={size} color={color} />
    </div>
  )
}

export function FloatingTechIcons() {
  const icons = [
    { iconName: "Code" as const, color: "#00bfff", delay: 0 },
    { iconName: "Cloud" as const, color: "#e2e8f0", delay: 1 },
    { iconName: "Database" as const, color: "#00bfff", delay: 2 },
    { iconName: "Smartphone" as const, color: "#e2e8f0", delay: 3 },
    { iconName: "Shield" as const, color: "#00bfff", delay: 4 },
    { iconName: "Zap" as const, color: "#e2e8f0", delay: 5 },
    { iconName: "BarChart3" as const, color: "#00bfff", delay: 6 },
    { iconName: "Cog" as const, color: "#e2e8f0", delay: 7 },
    { iconName: "Globe" as const, color: "#00bfff", delay: 8 },
    { iconName: "Cpu" as const, color: "#e2e8f0", delay: 9 },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map(({ iconName, color, delay }, index) => (
        <div
          key={index}
          className="absolute animate-float-3d"
          style={{
            left: `${10 + (index % 3) * 30}%`,
            top: `${20 + Math.floor(index / 3) * 25}%`,
            animationDelay: `${delay * 0.5}s`,
            animationDuration: `${6 + (index % 3)}s`,
          }}
        >
          <Icon3D icon={iconName} size={32} color={color} className="animate-pulse-3d hover-zyphex-glow" />
        </div>
      ))}
    </div>
  )
}

export function Hero3DElements() {
  return (
    <div className="relative">
      {/* Main 3D Container */}
      <div className="zyphex-3d-card zyphex-card p-8 hover-zyphex-lift">
        <div className="relative z-10">
          <div className="w-full h-64 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden relative">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 left-4 w-16 h-16 border-2 border-blue-400 rounded-lg animate-pulse-3d"></div>
              <div className="absolute top-8 right-8 w-12 h-12 border-2 border-gray-300 rounded-full animate-float-3d"></div>
              <div className="absolute bottom-8 left-8 w-8 h-8 border-2 border-blue-400 rounded animate-rotate-3d"></div>
              <div className="absolute bottom-4 right-4 w-20 h-20 border-2 border-gray-300 rounded-xl animate-pulse-3d"></div>
            </div>

            {/* Central Logo Area */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto zyphex-gradient-primary rounded-2xl flex items-center justify-center animate-zyphex-glow">
                  <Code className="h-12 w-12 text-white animate-pulse-3d" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gradient-to-r from-gray-300 to-gray-400 rounded animate-metallic-shine"></div>
                  <div className="h-3 w-24 bg-gradient-to-r from-blue-400 to-blue-500 rounded mx-auto animate-zyphex-glow"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Info Cards */}
      <div className="absolute -top-4 -left-4 zyphex-card p-4 animate-float-3d hover-zyphex-glow">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-200">24/7 Support</span>
        </div>
      </div>

      <div
        className="absolute -top-4 -right-4 zyphex-card p-4 animate-float-3d hover-zyphex-glow"
        style={{ animationDelay: "1s" }}
      >
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-gray-200">Secure & Reliable</span>
        </div>
      </div>

      <div
        className="absolute -bottom-4 -left-4 zyphex-card p-4 animate-float-3d hover-zyphex-glow"
        style={{ animationDelay: "2s" }}
      >
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-gray-300" />
          <span className="text-sm font-medium text-gray-200">AI Powered</span>
        </div>
      </div>
    </div>
  )
}
