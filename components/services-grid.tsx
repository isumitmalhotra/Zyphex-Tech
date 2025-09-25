"use client"
import { useScrollAnimation } from "@/components/scroll-animations"
import { ReactNode } from "react"

interface ServicesGridProps {
  children: ReactNode
}

export function ServicesGrid({ children }: ServicesGridProps) {
  useScrollAnimation()
  
  return <>{children}</>
}