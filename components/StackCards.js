import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion"
import { ArrowUpRight, Bed, Users, DollarSign, Palette, Image as ImageIcon, Sun, MousePointerClick, Hand } from "lucide-react"
import { useRouter } from "next/router"
import React from "react"

const initialCards = [
  {
    id: 1,
    title: "LIGHTING STUDIO",
    subtitle: "Professional Lighting",
    description:
      "Transform your scenes with dynamic sunlight control. Make better design decisions by visualizing lighting at any time of day.",
    imageUrl:
      "https://static.wixstatic.com/media/c6bfe7_6f84317aff6844ca994cacbd34139777~mv2.jpg",
    icon: "arrowUpRight",
    colors: {
      primary: "#1a1a1a",
      secondary: "#333333",
      text: "#ffffff",
      shadow: "rgba(0, 0, 0, 0.5)",
    },
  },
  {
    id: 2,
    title: "IMAGE EDITOR",
    subtitle: "Creative Freedom",
    description: "Professional-grade editing tools with intuitive controls. Perfect your photos with precision and ease.",
    imageUrl:
      "https://static.wixstatic.com/media/c6bfe7_d1c131cf53864d99ab2a55050b3eb034~mv2.jpg",
    icon: "image",
    colors: {
      primary: "#0f2b46",
      secondary: "#1e4976",
      text: "#ffffff",
      shadow: "rgba(15, 43, 70, 0.6)",
    },
  },
  {
    id: 3,
    title: "BUILD CUSTOM TOOL",
    subtitle: "Custom Development",
    description:
      "Need a specialized solution? Let's build it together. From concept to deployment, we create custom tools tailored to your unique requirements.",
    imageUrl:
      "https://static.wixstatic.com/media/c6bfe7_a744cf87fdce4963aef92a13b6730093~mv2.png",
    icon: "arrowUpRight",
    colors: {
      primary: "#2d4a22",
      secondary: "#4a7a38",
      text: "#ffffff",
      shadow: "rgba(45, 74, 34, 0.6)",
    },
  },
]

export default function StackCards({ onCustomToolClick }) {
  const router = useRouter()
  const [cards, setCards] = useState(initialCards)
  const [loading, setLoading] = useState(false)
  const [extractedColors, setExtractedColors] = useState(false)
  const [hasBeenDragged, setHasBeenDragged] = useState(false)
  const [hasEverDragged, setHasEverDragged] = useState(false) // Track if user has ever dragged a card
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Extract colors from images when component mounts
  useEffect(() => {
    const extractColors = async () => {
      if (extractedColors || typeof window === 'undefined') return

      let ColorThiefClass = null;
      try {
        const colorThiefModule = await import('colorthief');
        ColorThiefClass = colorThiefModule.default;
      } catch (error) {
        console.error("Failed to load ColorThief:", error);
        setLoading(false);
        return;
      }

      const updatedCards = [...cards]
      const colorThief = new ColorThiefClass()

      for (let i = 0; i < updatedCards.length; i++) {
        const card = updatedCards[i]
        try {
          const img = new Image()
          img.crossOrigin = "Anonymous"
          img.src = card.imageUrl

          await new Promise((resolve) => {
            img.onload = () => {
              try {
                const palette = colorThief.getPalette(img, 3)
                const primaryColor = `rgb(${palette[0][0]}, ${palette[0][1]}, ${palette[0][2]})`
                const secondaryColor = `rgb(${palette[1][0]}, ${palette[1][1]}, ${palette[1][2]})`
                const shadowColor = `rgba(${palette[0][0]}, ${palette[0][1]}, ${palette[0][2]}, 0.6)`
                const brightness = (palette[0][0] * 299 + palette[0][1] * 587 + palette[0][2] * 114) / 1000
                const textColor = brightness < 128 ? "#ffffff" : "#000000"

                updatedCards[i].colors = {
                  primary: primaryColor,
                  secondary: secondaryColor,
                  text: textColor,
                  shadow: shadowColor,
                }
              } catch (error) {
                console.error("Error extracting colors:", error)
              }
              resolve(null)
            }
            img.onerror = () => {
              resolve(null)
            }
          })
        } catch (error) {
          console.error("Error loading image:", error)
        }
      }

      setCards(updatedCards)
      setExtractedColors(true)
      setLoading(false)
    }

    extractColors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const removeCard = (id) => {
    setCards((prevCards) => {
      const removedCard = prevCards.find(card => card.id === id)
      const remainingCards = prevCards.filter((card) => card.id !== id)
      
      if (remainingCards.length > 0 && removedCard) {
        return [...remainingCards, removedCard]
      }
      
      return remainingCards
    })
    
    // Mark that user has ever dragged a card (permanent)
    setHasEverDragged(true)
    // Reset hasBeenDragged immediately for continuous interaction
    setHasBeenDragged(false)
  }

  const getIconComponent = (iconName) => {
    switch (iconName) {
      case "bed":
        return <Bed className="h-5 w-5" />
      case "users":
        return <Users className="h-5 w-5" />
      case "dollar":
        return <DollarSign className="h-5 w-5" />
      case "sun":
        return <Sun className="h-5 w-5" />
      case "image":
        return <ImageIcon className="h-5 w-5" />
      case "palette":
        return <Palette className="h-5 w-5" />
      case "arrowUpRight":
      default:
        return <ArrowUpRight className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="flex h-[600px] w-full items-center justify-center">
        <div className="text-white/60">Loading cards...</div>
      </div>
    )
  }

  return (
    <div className="relative h-[400px] sm:h-[550px] md:h-[450px] lg:h-[450px] w-full max-w-[240px] sm:max-w-sm md:max-w-[280px] lg:max-w-[280px] mx-auto overflow-visible">
      <AnimatePresence initial={false}>
        {cards.slice(0, 3).map((card, index) => {
          const isFirstCard = index === 0
          return (
            <Card
              key={card.id}
              card={card}
              index={index}
              removeCard={removeCard}
              getIconComponent={getIconComponent}
              totalCards={Math.min(cards.length, 3)}
              shouldAnimate={isFirstCard && !hasEverDragged}
              onDragStart={() => setHasBeenDragged(true)}
              router={router}
              onCustomToolClick={onCustomToolClick}
              isMobile={isMobile}
            />
          )
        })}
      </AnimatePresence>
      
      {/* Tap/Mouse click icon - only show before first drag */}
      {cards.length > 0 && !hasEverDragged && (
        <>
          <motion.div
            className="absolute top-1/2 right-2 sm:right-4 flex items-center justify-center z-50 pointer-events-none md:hidden"
            style={{
              transform: 'translate(0, -50%)',
              color: cards[0].colors.text,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: [0, 25, 0],
              y: [0, -8, 0],
              rotateZ: [0, 5, 0],
            }}
            transition={{
              opacity: {
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                times: [0, 0.1, 0.9, 1],
              },
              x: {
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.5, 1],
              },
              y: {
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.5, 1],
              },
              rotateZ: {
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.5, 1],
              },
            }}
          >
            <Hand className="h-8 w-8 drop-shadow-lg" />
          </motion.div>
          <motion.div
            className="absolute top-1/2 right-4 hidden md:flex items-center justify-center z-50 pointer-events-none"
            style={{
              transform: 'translate(0, -50%)',
              color: cards[0].colors.text,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: [0, 25, 0],
              y: [0, -8, 0],
              rotateZ: [0, 5, 0],
            }}
            transition={{
              opacity: {
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                times: [0, 0.1, 0.9, 1],
              },
              x: {
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.5, 1],
              },
              y: {
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.5, 1],
              },
              rotateZ: {
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.5, 1],
              },
            }}
          >
            <MousePointerClick className="h-8 w-8 drop-shadow-lg" />
          </motion.div>
        </>
      )}
    </div>
  )
}

const Card = React.forwardRef(function Card({ 
  card, 
  index, 
  removeCard, 
  getIconComponent, 
  totalCards, 
  shouldAnimate, 
  onDragStart, 
  router, 
  onCustomToolClick,
  isMobile 
}, ref) {
  const zIndex = totalCards - index
  const yOffset = index * 30
  const xOffset = index * 5
  const isTopCard = index === 0
  const hasDragged = useRef(false)
  const cardRef = useRef(null)
  const panStarted = useRef(false)
  const panMoved = useRef(false)
  const [isPanning, setIsPanning] = useState(false)
  const panStartedValue = useMotionValue(false) // Motion value for reactive opacity
  const isNavigating = useRef(false) // Prevent multiple navigation calls
  
  // Motion values for pan gesture (mobile) - relative to card position
  const panX = useMotionValue(0)
  const panY = useMotionValue(0)
  const panRotate = useMotionValue(0)
  
  // Base position motion values for animation
  const baseX = useMotionValue(xOffset)
  const baseY = useMotionValue(yOffset)
  const baseRotate = useMotionValue(index * -3)
  
  // Track if this is top card as motion value for reactive transforms
  const isTopCardValue = useMotionValue(isTopCard)
  
  useEffect(() => {
    isTopCardValue.set(isTopCard)
  }, [isTopCard, isTopCardValue])
  
  // Transform for opacity - top card should always be opaque unless actively dragging
  const opacity = useTransform(() => {
    // Always return 1 for non-top cards
    if (!isTopCardValue.get()) return 1
    
    // For top card: check if actively panning
    const panDistance = Math.sqrt(panX.get() ** 2 + panY.get() ** 2)
    const isPanningActive = panStartedValue.get()
    
    // Top card should be fully opaque when not dragging
    // Only reduce opacity when actively dragging (significant movement > 20px)
    if (panDistance < 20 || !isPanningActive) {
      return 1 // Fully opaque when not dragging
    }
    
    // Only reduce opacity during active drag
    // Use a gentler fade that doesn't go below 0.6
    return Math.max(0.6, 1 - (panDistance - 20) / 500)
  })

  // Transform values for mobile pan - combine base position + pan offset
  const mobileX = useTransform(() => baseX.get() + panX.get())
  const mobileY = useTransform(() => baseY.get() + panY.get())
  const mobileRotate = useTransform(() => baseRotate.get() + panRotate.get())
  
  // Animate base position when shouldAnimate is true and not panning
  useEffect(() => {
    if (shouldAnimate && isTopCard && !isPanning) {
      // Animate base position for the arc animation using framer-motion animate
      const controls = [
        animate(baseX, [xOffset, xOffset + 25, xOffset], {
          duration: 2,
          repeat: Infinity,
          ease: [0.4, 0, 0.2, 1],
          times: [0, 0.5, 1],
        }),
        animate(baseY, [yOffset, yOffset - 8, yOffset], {
          duration: 2,
          repeat: Infinity,
          ease: [0.4, 0, 0.2, 1],
          times: [0, 0.5, 1],
        }),
        animate(baseRotate, [index * -3, (index * -3) + 5, index * -3], {
          duration: 2,
          repeat: Infinity,
          ease: [0.4, 0, 0.2, 1],
          times: [0, 0.5, 1],
        }),
      ]
      
      return () => {
        controls.forEach(control => control.stop())
      }
    } else {
      // Set static position when not animating
      baseX.set(xOffset)
      baseY.set(yOffset)
      baseRotate.set(index * -3)
    }
  }, [shouldAnimate, isTopCard, isPanning, baseX, baseY, baseRotate, xOffset, yOffset, index])

  // Reset pan values when card becomes top card
  useEffect(() => {
    if (isTopCard) {
      hasDragged.current = false
      panStarted.current = false
      panStartedValue.set(false) // Reset motion value
      panMoved.current = false
      setIsPanning(false)
      // Explicitly reset pan values to ensure opacity is 1
      panX.set(0)
      panY.set(0)
      panRotate.set(0)
      baseX.set(xOffset)
      baseY.set(yOffset)
      baseRotate.set(index * -3)
      // Force opacity update by ensuring isTopCardValue is set
      isTopCardValue.set(true)
    } else {
      isTopCardValue.set(false)
    }
  }, [isTopCard, panX, panY, panRotate, baseX, baseY, baseRotate, xOffset, yOffset, index, isTopCardValue, panStartedValue])

  const arcAnimation = (isTopCard && shouldAnimate)
    ? {
        x: [xOffset, xOffset + 25, xOffset],
        y: [yOffset, yOffset - 8, yOffset],
        rotateZ: [index * -3, (index * -3) + 5, index * -3],
      }
    : {
        x: xOffset,
        y: yOffset,
        rotateZ: index * -3,
      }

  const handleCardClick = (e) => {
    if (hasDragged.current) {
      e?.preventDefault()
      e?.stopPropagation()
      return
    }

    if (!isTopCard) return

    // Prevent multiple rapid clicks
    if (isNavigating.current) {
      e?.preventDefault()
      e?.stopPropagation()
      return
    }

    // Set flag to prevent multiple navigations
    isNavigating.current = true

    // Reset flag after navigation (with delay to prevent rapid clicks)
    setTimeout(() => {
      isNavigating.current = false
    }, 1000)

    if (card.id === 1 || card.id === 2) {
      window.open('https://devellostudios.com', '_blank', 'noopener,noreferrer')
    } else if (card.id === 3) {
      window.open('https://devellotech.com#open-form', '_blank', 'noopener,noreferrer')
    }
  }

  // Handle pan start for mobile
  const handlePanStart = (event, info) => {
    if (!isTopCard) return
    panStarted.current = true
    panStartedValue.set(true) // Update motion value for reactive opacity
    panMoved.current = false
    hasDragged.current = false
    setIsPanning(true) // Disable animations during pan
    if (onDragStart) {
      onDragStart()
    }
  }

  // Handle pan end for mobile
  const handlePanEnd = (event, info) => {
    if (!isTopCard) return

    const distance = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2)
    const velocity = Math.sqrt(info.velocity.x ** 2 + info.velocity.y ** 2)

    if (distance > 150 || velocity > 500) {
      hasDragged.current = true
      removeCard(card.id)
    } else {
      // Spring back to center
      panX.set(0)
      panY.set(0)
      panRotate.set(0)
      // If there was any movement, keep hasDragged true to prevent tap
      if (panMoved.current) {
        hasDragged.current = true
      }
    }
    
    // Reset pan flags after a delay
    setTimeout(() => {
      panStarted.current = false
      panStartedValue.set(false) // Update motion value for reactive opacity
      panMoved.current = false
      setIsPanning(false) // Re-enable animations after pan
      // Only reset hasDragged if there was truly no movement
      if (distance <= 5 && velocity < 50 && !panMoved.current) {
        hasDragged.current = false
      }
    }, 100)
  }

  // Combine refs
  const combinedRef = (node) => {
    cardRef.current = node
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ref.current = node
    }
  }

  // For mobile: use pan gesture, for desktop: use drag
  if (isMobile && isTopCard) {
    return (
      <motion.div
        ref={combinedRef}
        style={{
          zIndex,
          x: mobileX,
          y: mobileY,
          rotate: mobileRotate,
          opacity: opacity,
          scale: 1 - index * 0.04,
          boxShadow: `0 ${10 + index * 5}px ${30 + index * 10}px ${card.colors.shadow}`,
          backgroundColor: card.colors.primary,
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
        className="absolute left-0 top-0 h-full w-full cursor-grab overflow-visible rounded-2xl active:cursor-grabbing"
        onPanStart={handlePanStart}
        onPan={(event, info) => {
          if (isTopCard) {
            panX.set(info.offset.x)
            panY.set(info.offset.y)
            panRotate.set(info.offset.x * 0.1)
            // Mark as moved if there's any movement
            if (Math.abs(info.offset.x) > 3 || Math.abs(info.offset.y) > 3) {
              panMoved.current = true
              hasDragged.current = true
            }
          }
        }}
        onPanEnd={handlePanEnd}
        onTap={(e) => {
          // Only handle tap if no pan gesture occurred at all
          if (isTopCard && !panStarted.current && !panMoved.current && !hasDragged.current) {
            handleCardClick(e)
          }
        }}
        // Don't use animate prop for mobile - it conflicts with pan transforms
        // Animation is handled via the base motion values
        exit={{
          opacity: 0,
          scale: 0.8,
          transition: { duration: 0.2 },
        }}
      >
        <div
          className="relative flex h-full flex-col overflow-hidden rounded-2xl p-3 sm:p-4 md:p-3 lg:p-3"
          style={{ 
            color: card.colors.text,
            pointerEvents: 'none',
            touchAction: 'none',
          }}
        >
          <div className="flex items-center justify-between pb-2" style={{ pointerEvents: 'none' }}>
            <h2 className="text-base sm:text-lg md:text-base lg:text-base font-bold">{card.title}</h2>
            <div className="p-1.5 sm:p-2 md:p-1.5 lg:p-1.5">
              <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-4 lg:h-4" />
            </div>
          </div>

          <div className="flex-1 overflow-hidden pb-2" style={{ pointerEvents: 'none' }}>
            <div
              className="w-full h-full min-h-[200px] sm:min-h-[350px] md:min-h-[280px] lg:min-h-[280px] overflow-hidden rounded-xl bg-cover bg-center"
              style={{
                backgroundImage: `url(${card.imageUrl})`,
                boxShadow: `0 10px 30px ${card.colors.shadow}`,
                pointerEvents: 'none',
              }}
            />
          </div>

          <div className="pt-2" style={{ pointerEvents: 'none' }}>
            <p className="text-xs sm:text-sm md:text-xs lg:text-xs opacity-80 leading-relaxed">{card.description}</p>
          </div>

          {isTopCard && (
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 flex-col items-center" style={{ pointerEvents: 'none' }}>
              <motion.div
                className="h-1 w-10 rounded-full"
                style={{ backgroundColor: `${card.colors.text}40` }}
                animate={{ y: [0, 5, 0] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
              />
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // Desktop: use drag
  return (
    <motion.div
      ref={combinedRef}
      layout={false}
      animate={{
        opacity: 1,
        ...arcAnimation,
        scale: 1 - index * 0.04,
      }}
      transition={{
        x: (isTopCard && shouldAnimate)
          ? {
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: [0.4, 0, 0.2, 1],
              times: [0, 0.5, 1],
            }
          : {
              type: "spring",
              stiffness: 500,
              damping: 50,
              mass: 1,
            },
        y: (isTopCard && shouldAnimate)
          ? {
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: [0.4, 0, 0.2, 1],
              times: [0, 0.5, 1],
            }
          : {
              type: "spring",
              stiffness: 500,
              damping: 50,
              mass: 1,
            },
        rotateZ: (isTopCard && shouldAnimate)
          ? {
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: [0.4, 0, 0.2, 1],
              times: [0, 0.5, 1],
            }
          : {
              type: "spring",
              stiffness: 500,
              damping: 50,
              mass: 1,
            },
        opacity: { duration: 0.3 },
        scale: {
          type: "spring",
          stiffness: 500,
          damping: 50,
          mass: 1,
        },
      }}
      exit={{
        opacity: 0,
        transition: { duration: 0.2 },
      }}
      style={{
        zIndex,
        opacity: isTopCard ? 1 : 1, // Always fully opaque
        boxShadow: `0 ${10 + index * 5}px ${30 + index * 10}px ${card.colors.shadow}`,
        backgroundColor: card.colors.primary,
      }}
      className="absolute left-0 top-0 h-full w-full cursor-grab overflow-visible rounded-2xl active:cursor-grabbing"
      drag={isTopCard}
      dragConstraints={false}
      dragElastic={0.2}
      dragDirectionLock={false}
      dragPropagation={false}
      onDragStart={(event, info) => {
        if (isTopCard) {
          hasDragged.current = false
          if (onDragStart) {
            onDragStart()
          }
        }
      }}
      onDragEnd={(_, info) => {
        if (isTopCard) {
          const distance = Math.sqrt(Math.pow(info.offset.x, 2) + Math.pow(info.offset.y, 2))
          if (distance > 150) {
            hasDragged.current = true
            removeCard(card.id)
          } else if (distance <= 5) {
            hasDragged.current = false
          } else {
            hasDragged.current = true
            setTimeout(() => {
              hasDragged.current = false
            }, 100)
          }
        }
      }}
      onTap={(e) => {
        if (isTopCard && !hasDragged.current) {
          handleCardClick(e)
        }
      }}
      whileDrag={{
        scale: 1.05,
        boxShadow: `0 ${15 + index * 5}px ${40 + index * 10}px ${card.colors.shadow}`,
      }}
      whileHover={isTopCard ? {
        scale: 1 - index * 0.04 + 0.01,
        transition: { duration: 0.2 },
      } : undefined}
    >
      <div
        className="relative flex h-full flex-col overflow-hidden rounded-2xl"
        style={{ 
          color: card.colors.text,
          pointerEvents: 'none',
        }}
      >
        <div className="flex items-center justify-between p-3 sm:p-4 pb-2" style={{ pointerEvents: 'none' }}>
          <h2 className="text-base sm:text-lg md:text-xl font-bold">{card.title}</h2>
          <div className="p-1.5 sm:p-2">
            <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-4 pb-2" style={{ pointerEvents: 'none' }}>
          <div
            className="w-full h-full min-h-[200px] sm:min-h-[350px] md:min-h-[400px] overflow-hidden rounded-xl bg-cover bg-center"
            style={{
              backgroundImage: `url(${card.imageUrl})`,
              boxShadow: `0 10px 30px ${card.colors.shadow}`,
              pointerEvents: 'none',
            }}
          />
        </div>

        <div className="p-3 sm:p-4 pt-2" style={{ pointerEvents: 'none' }}>
          <p className="text-xs sm:text-sm opacity-80 leading-relaxed">{card.description}</p>
        </div>

        {isTopCard && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 flex-col items-center" style={{ pointerEvents: 'none' }}>
            <motion.div
              className="h-1 w-10 rounded-full"
              style={{ backgroundColor: `${card.colors.text}40` }}
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
})
