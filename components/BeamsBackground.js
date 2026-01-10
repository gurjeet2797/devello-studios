"use client"

import React, { useEffect, useRef } from "react"
import { motion } from "framer-motion"

const BeamsBackground = ({
  className = "",
  children,
  intensity = "strong",
  isDark = true
}) => {
  const canvasRef = useRef(null)
  const beamsRef = useRef([])
  const animationFrameRef = useRef(0)
  const lastTimeRef = useRef(0)
  const isResizingRef = useRef(false)
  const MINIMUM_BEAMS = 20

  const opacityMap = {
    subtle: 0.7,
    medium: 0.85,
    strong: 1,
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const updateCanvasSize = () => {
      isResizingRef.current = true
      const dpr = window.devicePixelRatio || 1
      const oldBeams = beamsRef.current
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.scale(dpr, dpr)

      // Don't recreate beams on resize - just update canvas size
      // The beams will continue with their existing properties
      if (!oldBeams || oldBeams.length === 0) {
        const totalBeams = MINIMUM_BEAMS * 1.5
        beamsRef.current = Array.from({ length: totalBeams }, () => createBeam(canvas.width, canvas.height))
      } else {
        // Update existing beams with current isDark value
        beamsRef.current.forEach(beam => {
          beam.hue = isDark ? 0 : (Math.random() < 0.7 ? 0 : 45 + Math.random() * 15)
          beam.opacity = isDark ? 0.05 + Math.random() * 0.08 : 0.03 + Math.random() * 0.05
        })
      }
      // If beams exist, keep them as they are - they'll adapt to new canvas size naturally
      
      // Reset resize flag after a short delay
      setTimeout(() => {
        isResizingRef.current = false
      }, 100)
    }

    updateCanvasSize()
    window.addEventListener("resize", updateCanvasSize)

    function createBeam(width, height) {
      const angle = -35 + Math.random() * 10
      return {
        x: Math.random() * width * 1.5 - width * 0.25,
        y: Math.random() * height * 1.5 - height * 0.25,
        width: 30 + Math.random() * 60,
        length: height * 2.5,
        angle: angle,
        speed: 0.6 + Math.random() * 1.2,
        opacity: isDark ? 0.05 + Math.random() * 0.08 : 0.03 + Math.random() * 0.05,
        hue: isDark ? 0 : (Math.random() < 0.7 ? 0 : 45 + Math.random() * 15), // More white beams in light mode, some amber
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
      }
    }

    function resetBeam(beam, index, totalBeams) {
      if (!canvas) return beam

      const column = index % 3
      const spacing = canvas.width / 3

      beam.y = canvas.height + 100
      beam.x = column * spacing + spacing / 2 + (Math.random() - 0.5) * spacing * 0.5
      beam.width = 100 + Math.random() * 100
      beam.speed = 0.5 + Math.random() * 0.4
      beam.hue = isDark ? 0 : (Math.random() < 0.7 ? 0 : 45 + Math.random() * 15)
      beam.opacity = isDark ? 0.08 + Math.random() * 0.05 : 0.03 + Math.random() * 0.05
      return beam
    }

    function drawBeam(ctx, beam) {
      ctx.save()
      ctx.translate(beam.x, beam.y)
      ctx.rotate((beam.angle * Math.PI) / 180)

      // Calculate pulsing opacity
      const pulsingOpacity = beam.opacity * (0.8 + Math.sin(beam.pulse) * 0.2) * opacityMap[intensity]

      const gradient = ctx.createLinearGradient(0, 0, 0, beam.length)

      // Enhanced gradient with multiple color stops - use current isDark value
      const saturation = beam.hue === 0 ? 0 : (isDark ? 85 : 60) // White has 0 saturation, amber has different saturation for dark/light
      const lightness = beam.hue === 0 ? (isDark ? 15 : 85) : (isDark ? 65 : 45) // Much darker white in dark mode, subtle white in light mode
      
      gradient.addColorStop(0, `hsla(${beam.hue}, ${saturation}%, ${lightness}%, 0)`)
      gradient.addColorStop(0.1, `hsla(${beam.hue}, ${saturation}%, ${lightness}%, ${pulsingOpacity * 0.5})`)
      gradient.addColorStop(0.4, `hsla(${beam.hue}, ${saturation}%, ${lightness}%, ${pulsingOpacity})`)
      gradient.addColorStop(0.6, `hsla(${beam.hue}, ${saturation}%, ${lightness}%, ${pulsingOpacity})`)
      gradient.addColorStop(0.9, `hsla(${beam.hue}, ${saturation}%, ${lightness}%, ${pulsingOpacity * 0.5})`)
      gradient.addColorStop(1, `hsla(${beam.hue}, ${saturation}%, ${lightness}%, 0)`)

      ctx.fillStyle = gradient
      ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length)
      ctx.restore()
    }

    function animate(currentTime) {
      if (!canvas || !ctx) return

      // Skip animation updates during resize to prevent speed changes
      if (isResizingRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate)
        return
      }

      // Calculate delta time for consistent animation speed
      const deltaTime = lastTimeRef.current ? currentTime - lastTimeRef.current : 16.67 // Default to 60fps if first frame
      lastTimeRef.current = currentTime

      // Cap delta time to prevent large jumps during tab switching or long pauses
      const cappedDeltaTime = Math.min(deltaTime, 33.33) // Cap at 30fps minimum
      const timeFactor = cappedDeltaTime / 16.67 // Normalize to 60fps

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.filter = "blur(35px)"

      const totalBeams = beamsRef.current.length
      beamsRef.current.forEach((beam, index) => {
        beam.y -= beam.speed * timeFactor
        beam.pulse += beam.pulseSpeed * timeFactor

        // Reset beam when it goes off screen
        if (beam.y + beam.length < -100) {
          resetBeam(beam, index, totalBeams)
        }

        drawBeam(ctx, beam)
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate(performance.now())

    return () => {
      window.removeEventListener("resize", updateCanvasSize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [intensity]) // Remove isDark from dependencies to prevent recreation

  return (
    <motion.div 
      className={`fixed inset-0 w-full h-full overflow-hidden ${isDark ? 'bg-black' : 'bg-[var(--light-bg)]'} ${className}`}
      style={{ zIndex: 0 }} // Background layer
      data-beams-background="true" // Allow Layout.js to detect this component
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <motion.canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full" 
        style={{ filter: "blur(35px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
      />

      <motion.div 
        className="relative z-10 flex w-full h-full items-start justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut", delay: 0.3 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

export default BeamsBackground
