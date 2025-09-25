"use client"

import { Code, Shield, Cpu } from "lucide-react"

export function Hero3DClean() {
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

      {/* Properly Positioned Floating Info Cards - Desktop */}
      <div className="hidden lg:block">
        {/* Top Left Card */}
        <div className="absolute -top-4 -left-8 zyphex-card p-3 animate-float-3d hover-zyphex-glow">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-gray-200 whitespace-nowrap">24/7 Support</span>
          </div>
        </div>

        {/* Top Right Card */}
        <div
          className="absolute -top-4 -right-8 zyphex-card p-3 animate-float-3d hover-zyphex-glow"
          style={{ animationDelay: "1s" }}
        >
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3 text-blue-400" />
            <span className="text-xs font-medium text-gray-200 whitespace-nowrap">Secure & Reliable</span>
          </div>
        </div>

        {/* Bottom Center Card */}
        <div
          className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 zyphex-card p-3 animate-float-3d hover-zyphex-glow"
          style={{ animationDelay: "2s" }}
        >
          <div className="flex items-center gap-2">
            <Cpu className="h-3 w-3 text-gray-300" />
            <span className="text-xs font-medium text-gray-200 whitespace-nowrap">AI Powered</span>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Layout - Cards Below Main Container */}
      <div className="lg:hidden mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="zyphex-card p-3 animate-float-3d hover-zyphex-glow text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-gray-200">24/7 Support</span>
          </div>
        </div>

        <div
          className="zyphex-card p-3 animate-float-3d hover-zyphex-glow text-center"
          style={{ animationDelay: "1s" }}
        >
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-3 w-3 text-blue-400" />
            <span className="text-xs font-medium text-gray-200">Secure & Reliable</span>
          </div>
        </div>

        <div
          className="zyphex-card p-3 animate-float-3d hover-zyphex-glow text-center"
          style={{ animationDelay: "2s" }}
        >
          <div className="flex items-center justify-center gap-2">
            <Cpu className="h-3 w-3 text-gray-300" />
            <span className="text-xs font-medium text-gray-200">AI Powered</span>
          </div>
        </div>
      </div>
    </div>
  )
}
