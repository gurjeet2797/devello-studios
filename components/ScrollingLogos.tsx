"use client"

import type React from "react"
import { cn } from "../lib/utils"

interface Logo {
  id: string
  name: string
  svg?: string
  image?: string
  height: string
}

interface ScrollingLogosProps {
  logos: Logo[]
  speed?: "slow" | "normal" | "fast"
  direction?: "left" | "right"
  className?: string
  isDark?: boolean
}

const ScrollingLogos: React.FC<ScrollingLogosProps> = ({ logos, speed = "normal", direction = "left", className, isDark = false }) => {
  const speedMap = {
    slow: "30s",
    normal: "20s",
    fast: "10s",
  }

  const animationDirection = direction === "left" ? "reverse" : "normal"

  return (
    <div className="relative w-full overflow-hidden">
      <div
        className={cn("group flex overflow-hidden w-full", className)}
        style={
          {
            "--duration": speedMap[speed],
          } as React.CSSProperties
        }
      >
        {/* Animated container with three sets of logos */}
        <div
          className="flex shrink-0 animate-marquee"
          style={{
            animationDirection: animationDirection,
            animationDuration: "var(--duration)",
          }}
        >
          {/* Generate three identical sets for seamless loop */}
          {[...Array(3)].map((_, setIndex) => (
            <div key={`set-${setIndex}`} className="flex shrink-0">
              {logos.map((logo) => (
                <div key={`${setIndex}-${logo.id}`} className="mx-2 sm:mx-4 md:mx-6 lg:mx-8 flex items-center whitespace-nowrap">
                  {logo.svg ? (
                    <div className={cn("fill-current w-auto max-w-[120px] sm:max-w-[140px] md:max-w-[160px] lg:max-w-[180px]", logo.height)} dangerouslySetInnerHTML={{ __html: logo.svg }} />
                  ) : logo.image ? (
                    <img src={logo.image || "/placeholder.svg"} alt={logo.name} className={cn("w-auto max-w-[120px] sm:max-w-[140px] md:max-w-[160px] lg:max-w-[180px]", logo.height)} />
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Gradient fade overlays */}
      <div 
        className="pointer-events-none absolute inset-y-0 left-0 w-1/4 z-10" 
        style={{
          background: isDark 
            ? 'linear-gradient(to right, #000000, transparent)'
            : 'linear-gradient(to right, #ffffff, transparent)'
        }}
      />
      <div 
        className="pointer-events-none absolute inset-y-0 right-0 w-1/4 z-10"
        style={{
          background: isDark 
            ? 'linear-gradient(to left, #000000, transparent)'
            : 'linear-gradient(to left, #ffffff, transparent)'
        }}
      />
    </div>
  )
}

export default ScrollingLogos
