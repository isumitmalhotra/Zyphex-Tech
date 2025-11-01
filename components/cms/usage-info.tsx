"use client"

import { Info, X } from "lucide-react"
import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface UsageInfoProps {
  title: string
  description: string
  features?: string[]
  tips?: string[]
}

export function UsageInfo({ title, description, features, tips }: UsageInfoProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
        title="Show usage guide"
      >
        <Info className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Alert className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 relative">
      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
        title="Hide usage guide"
      >
        <X className="h-4 w-4" />
      </Button>
      <AlertTitle className="text-blue-900 dark:text-blue-100 font-semibold mb-2 pr-8">
        {title}
      </AlertTitle>
      <AlertDescription className="text-blue-800 dark:text-blue-200 space-y-3">
        <p className="text-sm">{description}</p>
        
        {features && features.length > 0 && (
          <div>
            <p className="font-medium text-sm mb-1">Key Features:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
        )}
        
        {tips && tips.length > 0 && (
          <div>
            <p className="font-medium text-sm mb-1">💡 Quick Tips:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
