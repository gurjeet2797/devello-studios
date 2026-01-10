"use client"

import { motion } from "framer-motion"
import { useEffect, useId, useState } from "react"
import { cn } from "../lib/utils"

export const AnimatedBeam = ({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = Math.random() * 3 + 4,
  delay = 0,
  pathColor = "gray",
  pathWidth = 2,
  pathOpacity = 0.2,
  gradientStartColor = "#ffaa40",
  gradientStopColor = "#9c40ff",
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
}) => {
  const id = useId()
  const [pathD, setPathD] = useState("")
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 })

  const gradientCoordinates = reverse
    ? {
        x1: ["90%", "-10%"],
        x2: ["100%", "0%"],
        y1: ["0%", "0%"],
        y2: ["0%", "0%"],
      }
    : {
        x1: ["10%", "110%"],
        x2: ["0%", "100%"],
        y1: ["0%", "0%"],
        y2: ["0%", "0%"],
      }

  useEffect(() => {
    const updatePath = () => {
      if (containerRef.current && fromRef.current && toRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const rectA = fromRef.current.getBoundingClientRect()
        const rectB = toRef.current.getBoundingClientRect()

        const svgWidth = containerRect.width
        const svgHeight = containerRect.height

        setSvgDimensions({ width: svgWidth, height: svgHeight })

        // Calculate center points
        const startX = rectA.left - containerRect.left + rectA.width / 2
        const startY = rectA.top - containerRect.top + rectA.height / 2

        const endX = rectB.left - containerRect.left + rectB.width / 2
        const endY = rectB.top - containerRect.top + rectB.height / 2

        // Calculate element dimensions
        const sourceHalfWidth = rectA.width / 2
        const targetHalfWidth = rectB.width / 2
        
        // Calculate adaptive buffer based on element size and stroke width
        // Larger elements need proportionally larger buffers
        const sourceSizeFactor = Math.min(rectA.width / 64, 1.5) // Normalize to ~64px base
        const targetSizeFactor = Math.min(rectB.width / 64, 1.5)
        const baseBuffer = pathWidth / 2 + 1.5
        const sourceBuffer = baseBuffer * (1 + sourceSizeFactor * 0.3)
        const targetBuffer = baseBuffer * (1 + targetSizeFactor * 0.3)

        // Determine connection direction
        // For start: if going right (positive offset), connect to right edge
        // For end: if going right (positive offset), connect to right edge
        // Special case: if offset is exactly 0, connect at center (don't add half-width and buffer)
        const startDirection = startXOffset >= 0 ? 1 : -1
        const endDirection = endXOffset >= 0 ? 1 : -1
        
        // Calculate connection points
        // If offset is 0, connect at center; otherwise connect at edge with offset
        const adjustedStartX = startXOffset === 0 
          ? startX 
          : startX + (startDirection * sourceHalfWidth) + (startDirection * sourceBuffer) + startXOffset
        const adjustedEndX = endXOffset === 0 
          ? endX 
          : endX + (endDirection * targetHalfWidth) + (endDirection * targetBuffer) + endXOffset
        
        const adjustedStartY = startY + startYOffset
        const adjustedEndY = endY + endYOffset

        // Calculate midpoint for straight line, then apply curvature offset
        const midY = (adjustedStartY + adjustedEndY) / 2
        const controlY = midY - curvature

        const d = `M ${adjustedStartX},${adjustedStartY} Q ${(adjustedStartX + adjustedEndX) / 2},${controlY} ${adjustedEndX},${adjustedEndY}`

        setPathD(d)
      }
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        updatePath()
      }
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    updatePath()

    return () => {
      resizeObserver.disconnect()
    }
  }, [containerRef, fromRef, toRef, curvature, startXOffset, startYOffset, endXOffset, endYOffset, pathWidth])

  return (
    <svg
      fill="none"
      width={svgDimensions.width}
      height={svgDimensions.height}
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none absolute left-0 top-0 transform-gpu stroke-2 z-0", className)}
      viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
    >
      <path d={pathD} stroke={pathColor} strokeWidth={pathWidth} strokeOpacity={pathOpacity} strokeLinecap="round" />
      <path d={pathD} strokeWidth={pathWidth} stroke={`url(#${id})`} strokeOpacity="1" strokeLinecap="round" />
      <defs>
        <motion.linearGradient
          className="transform-gpu"
          id={id}
          gradientUnits={"userSpaceOnUse"}
          initial={{
            x1: "0%",
            x2: "0%",
            y1: "0%",
            y2: "0%",
          }}
          animate={{
            x1: gradientCoordinates.x1,
            x2: gradientCoordinates.x2,
            y1: gradientCoordinates.y1,
            y2: gradientCoordinates.y2,
          }}
          transition={{
            delay,
            duration,
            ease: [0.25, 0.1, 0.25, 1], // Ease-out curve that slows down as it approaches the center
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: 0,
          }}
        >
          <stop stopColor={gradientStartColor} stopOpacity="0"></stop>
          <stop stopColor={gradientStartColor}></stop>
          <stop offset="50%" stopColor={gradientStopColor}></stop>
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0"></stop>
        </motion.linearGradient>
      </defs>
    </svg>
  )
}

