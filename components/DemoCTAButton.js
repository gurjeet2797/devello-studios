"use client"

import { useState, useEffect } from "react"
import { X, Laptop, Settings, Home, Briefcase, Package, ArrowLeft, MessageCircle, Globe, Building2, MousePointerClick } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { MeshGradient } from "@paper-design/shaders-react"
import { getCalApi } from '@calcom/embed-react'
import { useAuth } from './auth/AuthProvider'
import { useModal } from './ModalProvider'
import PartnerMessageModal from './PartnerMessageModal'
import { useRouter } from 'next/router'
import { Pacifico } from "next/font/google"

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
})

export default function BuildButton() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedService, setSelectedService] = useState(null)
  const [partners, setPartners] = useState([])
  const [loadingPartners, setLoadingPartners] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const { user } = useAuth()
  const { openAuthModal } = useModal()
  const router = useRouter()

  const dynamicWords = [
    "an app",
    "a business",
    "a house",
    "systems",
    "a pantry"
  ]

  const services = [
    {
      id: 'software',
      title: 'Build Your Software',
      description: 'Software development services',
      icon: Laptop,
      iconSecondary: Settings,
      color: 'blue',
      serviceType: 'software'
    },
    {
      id: 'company',
      title: 'Build Your Company',
      description: 'Consulting services',
      icon: Briefcase,
      iconSecondary: null,
      color: 'yellow',
      serviceType: 'consulting'
    },
    {
      id: 'things',
      title: 'Build Your Things',
      description: 'Manufacturing services',
      icon: Package,
      iconSecondary: null,
      color: 'green',
      serviceType: 'manufacturing'
    }
  ]

  const handleExpand = () => {
    setIsExpanded(true)
    setCurrentStep(1)
    setSelectedService(null)
  }

  const handleClose = () => {
    setIsExpanded(false)
    setCurrentStep(1)
    setSelectedService(null)
    setPartners([])
  }

  const handleServiceSelect = async (service) => {
    setSelectedService(service)
    setCurrentStep(2)
    
    // Only fetch partners if user is signed in
    if (!user) {
      setPartners([])
      setLoadingPartners(false)
      return
    }
    
    setLoadingPartners(true)
    
    try {
      // Map service types to database values
      const serviceTypeMap = {
        'software': 'software_development',
        'consulting': 'consulting',
        'manufacturing': 'manufacturing'
      }
      
      const serviceType = serviceTypeMap[service.serviceType]
      
      if (serviceType) {
        const response = await fetch(`/api/partners/public?service_type=${serviceType}`)
        if (response.ok) {
          const data = await response.json()
          setPartners(data.partners || [])
        } else {
          console.error('Failed to fetch partners:', response.status)
          setPartners([])
        }
      } else {
        setPartners([])
      }
    } catch (error) {
      console.error('Error fetching partners:', error)
      setPartners([])
    } finally {
      setLoadingPartners(false)
    }
  }

  const handleContactPartner = (partner) => {
    setSelectedPartner(partner)
    setShowMessageModal(true)
  }

  const handleMessageSent = () => {
    setShowMessageModal(false)
    setSelectedPartner(null)
  }

  // Initialize Cal.com
  useEffect(() => {
    if (isExpanded && currentStep === 2) {
      (async function () {
        try {
          const cal = await getCalApi({"namespace":"intro-call"})
          cal("ui", {"hideEventTypeDetails":false,"layout":"month_view"})
        } catch (error) {
          console.error("Error initializing Cal.com:", error)
        }
      })()
    }
  }, [isExpanded, currentStep])

  const handleScheduleCall = async (e) => {
    e.preventDefault()
    try {
      const cal = await getCalApi({"namespace":"intro-call"})
      cal("inline", {
        elementOrSelector: e.currentTarget,
        calLink: "gurjeetsingh/intro-call",
        layout: "month_view",
        config: {
          layout: "month_view"
        }
      })
    } catch (error) {
      console.error("Error opening Cal.com:", error)
    }
  }

  // Cycle through dynamic words
  useEffect(() => {
    if (!isExpanded) {
      const interval = setInterval(() => {
        setCurrentWordIndex((prev) => (prev + 1) % dynamicWords.length)
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [isExpanded, dynamicWords.length])

  useEffect(() => {
    if (isExpanded) {
      const originalBodyOverflow = document.body.style.overflow
      const originalHtmlOverflow = document.documentElement.style.overflow
      const originalBodyPosition = document.body.style.position
      const scrollY = window.scrollY
      
      document.body.style.overflow = "hidden"
      document.documentElement.style.overflow = "hidden"
      document.body.style.position = "fixed"
      document.body.style.width = "100%"
      document.body.style.top = `-${scrollY}px`
      
      return () => {
        document.body.style.overflow = originalBodyOverflow
        document.documentElement.style.overflow = originalHtmlOverflow
        document.body.style.position = originalBodyPosition
        document.body.style.width = ""
        document.body.style.top = ""
        window.scrollTo(0, scrollY)
      }
    }
  }, [isExpanded])

  const getServiceColors = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-500/20',
        text: 'text-blue-300',
        border: 'border-blue-400/30',
        hover: 'hover:bg-blue-500/30',
        textDark: 'text-blue-700'
      },
      orange: {
        bg: 'bg-orange-500/20',
        text: 'text-orange-300',
        border: 'border-orange-400/30',
        hover: 'hover:bg-orange-500/30',
        textDark: 'text-orange-700'
      },
      yellow: {
        bg: 'bg-yellow-400/20',
        text: 'text-yellow-200',
        border: 'border-yellow-300/30',
        hover: 'hover:bg-yellow-400/30',
        textDark: 'text-yellow-600'
      },
      green: {
        bg: 'bg-green-500/20',
        text: 'text-green-300',
        border: 'border-green-400/30',
        hover: 'hover:bg-green-500/30',
        textDark: 'text-green-700'
      }
    }
    return colors[color] || colors.blue
  }

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        {!isExpanded && (
          <motion.div className="inline-block relative">
            <motion.div
              style={{
                borderRadius: "100px",
              }}
              layout
              layoutId="cta-card"
              className="absolute inset-0 items-center justify-center transform-gpu will-change-transform overflow-hidden"
            >
              <MeshGradient
                speed={1}
                colors={["#000000", "#1a1a1a", "#6b6b6b", "#0f0f0f", "#8a8a8a"]}
                distortion={0.8}
                swirl={0.1}
                grainMixer={0}
                grainOverlay={0}
                className="inset-0"
                style={{ height: "100%", width: "100%", borderRadius: "100px" }}
              />
            </motion.div>
            <motion.button
              exit={{ opacity: 0 }}
              layout={false}
              onClick={handleExpand}
              className="h-12 px-6 sm:px-8 py-3 text-lg sm:text-xl font-regular text-[#E3E3E3] tracking-[0.02em] relative flex items-center justify-center gap-1 z-10 min-w-[220px] sm:min-w-[240px]"
            >
              <span className="whitespace-nowrap font-bold">build</span>
              <span className="relative inline-block text-center min-w-[120px] sm:min-w-[130px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={currentWordIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="inline-block whitespace-nowrap"
                  >
                    {dynamicWords[currentWordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <>
            {/* Blurred Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={handleClose}
              className="fixed inset-0 top-16 z-40 bg-black/20 backdrop-blur-md"
            />
            
            <div className="fixed inset-x-0 top-16 bottom-0 z-50 flex items-center justify-center pt-4 pb-8 px-8">
              <motion.div
                layoutId="cta-card"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{
                  borderRadius: "24px",
                  transform: "translate(2rem, -2rem)",
                }}
                layout
                className="relative flex flex-col max-w-6xl w-full max-h-[90vh] overflow-y-auto transform-gpu will-change-transform scrollbar-hide"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 2 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  layout={false}
                  transition={{ duration: 0.15, delay: 0.05 }}
                  className="absolute h-full inset-0 overflow-hidden pointer-events-none"
                  style={{
                    borderRadius: "24px",
                  }}
                >
                  <MeshGradient
                    speed={1}
                    colors={["#000000", "#0a0a0a", "#1a1a1a", "#0f0f0f", "#2a2a2a"]}
                    distortion={0.8}
                    swirl={0.1}
                    grainMixer={0}
                    grainOverlay={0}
                    className="inset-0 sticky top-0"
                    style={{ height: "100%", width: "100%" }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="relative z-10 flex flex-col h-full w-full p-6 sm:p-10"
                >
                  {/* Step 1: Service Selection */}
                  {currentStep === 1 && (
                    <div className="flex flex-col h-full">
                      <div className="text-center mb-12 pt-8">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-white leading-none tracking-[-0.03em] mb-4">
                          Your next project starts here.
                        </h2>
                        <p className="text-base sm:text-lg text-white/80">
                          We aim to offer multi-industry solutions — choose how you want to build.
                        </p>
                      </div>

                      <div className="flex-1 flex items-center justify-center pb-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                          {services.map((service) => {
                            const Icon = service.icon
                            const IconSecondary = service.iconSecondary
                            const colors = getServiceColors(service.color)
                            
                            return (
                              <motion.button
                                key={service.id}
                                onClick={() => handleServiceSelect(service)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`group w-full p-5 rounded-xl transition-all duration-300 backdrop-blur-sm border-2 flex flex-col items-center justify-center gap-3 ${colors.bg} ${colors.text} ${colors.border} ${colors.hover} shadow-lg`}
                              >
                                <div className="flex-shrink-0 relative w-8 h-8 flex items-center justify-center">
                                  {IconSecondary ? (
                                    <>
                                      <div className="absolute opacity-100 group-hover:opacity-0 transition-opacity duration-200">
                                        <Icon className="w-8 h-8 relative" />
                                        <IconSecondary className="w-4 h-4 absolute -bottom-0.5 -right-0.5" />
                                      </div>
                                      <MousePointerClick className="w-8 h-8 absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                    </>
                                  ) : (
                                    <>
                                      <Icon className="w-8 h-8 absolute opacity-100 group-hover:opacity-0 transition-opacity duration-200" />
                                      <MousePointerClick className="w-8 h-8 absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                    </>
                                  )}
                                </div>
                                <div className="text-center">
                                  <h3 className="text-lg sm:text-xl font-semibold mb-1">
                                    {service.title}
                                  </h3>
                                  <p className="text-xs sm:text-sm leading-tight opacity-80">
                                    {service.description}
                                  </p>
                                </div>
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Partners & Cal.com */}
                  {currentStep === 2 && (
                    <div className="flex flex-col h-full">
                      <motion.button
                        onClick={() => {
                          setCurrentStep(1)
                          setSelectedService(null)
                          setPartners([])
                        }}
                        className="self-start mb-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                      </motion.button>

                      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto scrollbar-hide">
                        {/* Left Column: Partners */}
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
                              {selectedService?.title} Partners
                            </h3>
                            <p className="text-white/70 text-sm sm:text-base">
                              Connect with our approved partners
                            </p>
                          </div>

                          {!user ? (
                            <div className="text-center py-12 space-y-6">
                              <div className="space-y-3">
                                <p className="text-white/90 text-lg font-medium">
                                  Sign in to view partners
                                </p>
                                <p className="text-white/70 text-sm sm:text-base max-w-md mx-auto">
                                  Please sign in to view and connect with our approved partners for this service.
                                </p>
                              </div>
                              <button
                                onClick={() => openAuthModal('signin')}
                                className="px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 bg-white/20 text-white border border-white/30 hover:bg-white/30 hover:scale-105 active:scale-95 mx-auto"
                              >
                                Sign In
                              </button>
                            </div>
                          ) : loadingPartners ? (
                            <div className="text-center py-12">
                              <p className="text-white/70">Loading partners...</p>
                            </div>
                          ) : partners.length > 0 ? (
                            <div className="space-y-4">
                              {partners.map((partner, index) => (
                                <motion.div
                                  key={partner.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="p-6 rounded-xl about-devello-glass transition-all duration-300"
                                >
                                  <div className="flex items-start justify-between mb-4">
                                    <div>
                                      <h4 className="text-xl font-semibold text-white mb-1">
                                        {partner.companyName}
                                      </h4>
                                      {partner.experienceYears && (
                                        <p className="text-sm text-white/50">
                                          {partner.experienceYears} years experience
                                        </p>
                                      )}
                                    </div>
                                    <Building2 className="w-8 h-8 text-white/60" />
                                  </div>
                                  
                                  {partner.description && (
                                    <p className="text-sm text-white/70 mb-4 line-clamp-2">
                                      {partner.description}
                                    </p>
                                  )}

                                  <div className="flex flex-wrap gap-2 mb-4">
                                    {partner.portfolioUrl && (
                                      <a
                                        href={partner.portfolioUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-white/80 hover:text-white border border-white/20 hover:border-white/40 transition-colors"
                                      >
                                        <Globe className="w-3 h-3" />
                                        Portfolio
                                      </a>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => handleContactPartner(partner)}
                                    className="w-full px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 bg-white/20 text-white border border-white/30 hover:bg-white/30"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                    Send Message
                                  </button>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12 space-y-4">
                              <p className="text-white/70">
                                We are still vetting potential partners, please submit an Online request through Devello's portal and we will get back to you!
                              </p>
                              <button
                                onClick={() => {
                                  const serviceRouteMap = {
                                    'software': '/software',
                                    'consulting': '/consulting',
                                    'manufacturing': '/custom'
                                  }
                                  const route = serviceRouteMap[selectedService?.serviceType] || '/software'
                                  router.push(`${route}#open-form`)
                                  handleClose()
                                }}
                                className={`inline-flex px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-sm sm:text-base font-medium transition-all duration-300 hover:scale-105 active:scale-95 text-white ${(() => {
                                  const serviceColorMap = {
                                    'software': 'bg-blue-600/40 border border-blue-500/50 hover:bg-blue-600/50 hover:border-blue-500/70',
                                    'consulting': 'bg-yellow-600/40 border border-yellow-500/50 hover:bg-yellow-600/50 hover:border-yellow-500/70',
                                    'manufacturing': 'bg-green-600/40 border border-green-500/50 hover:bg-green-600/50 hover:border-green-500/70'
                                  }
                                  return serviceColorMap[selectedService?.serviceType] || 'bg-blue-600/40 border border-blue-500/50 hover:bg-blue-600/50 hover:border-blue-500/70'
                                })()}`}
                              >
                                <span className={pacifico.className}>
                                  {(() => {
                                    const serviceButtonTextMap = {
                                      'software': 'Open Build Request',
                                      'consulting': 'get meaningful advice',
                                      'manufacturing': 'create product'
                                    }
                                    return serviceButtonTextMap[selectedService?.serviceType] || 'online request'
                                  })()}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Right Column: Devello Cal.com */}
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
                              Work with Devello
                            </h3>
                            <p className="text-white/70 text-sm sm:text-base">
                              Set up a quick call to discuss your custom requirements with Devello. For clients seeking professional software development and digital solutions.
                            </p>
                          </div>

                          <div className={`bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 ${partners.length > 0 ? 'space-y-4' : ''}`}>
                            <button
                              onClick={handleScheduleCall}
                              data-cal-namespace="intro-call"
                              data-cal-link="gurjeetsingh/intro-call"
                              data-cal-config='{"layout":"month_view"}'
                              className="w-full px-6 py-4 rounded-lg font-semibold text-base sm:text-lg transition-all duration-300 bg-white/20 text-white border border-white/30 hover:bg-white/30 hover:scale-105 active:scale-95"
                            >
                              Schedule a 15 min call to discuss your project
                            </button>
                            {partners.length > 0 && (
                              <button
                                onClick={() => {
                                  const serviceRouteMap = {
                                    'software': '/software',
                                    'consulting': '/consulting',
                                    'manufacturing': '/custom'
                                  }
                                  const route = serviceRouteMap[selectedService?.serviceType] || '/software'
                                  router.push(`${route}#open-form`)
                                  handleClose()
                                }}
                                className={`w-full px-6 py-4 rounded-lg font-semibold text-base sm:text-lg transition-all duration-300 text-white hover:scale-105 active:scale-95 ${(() => {
                                  const serviceColorMap = {
                                    'software': 'bg-blue-600/40 border border-blue-500/50 hover:bg-blue-600/50 hover:border-blue-500/70',
                                    'consulting': 'bg-yellow-600/40 border border-yellow-500/50 hover:bg-yellow-600/50 hover:border-yellow-500/70',
                                    'manufacturing': 'bg-green-600/40 border border-green-500/50 hover:bg-green-600/50 hover:border-green-500/70'
                                  }
                                  return serviceColorMap[selectedService?.serviceType] || 'bg-blue-600/40 border border-blue-500/50 hover:bg-blue-600/50 hover:border-blue-500/70'
                                })()}`}
                              >
                                <span className={pacifico.className}>
                                  {(() => {
                                    const serviceButtonTextMap = {
                                      'software': 'Open Build Request',
                                      'consulting': 'get meaningful advice',
                                      'manufacturing': 'create product'
                                    }
                                    return serviceButtonTextMap[selectedService?.serviceType] || 'online request'
                                  })()}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Close Button */}
                  <motion.button
                    onClick={handleClose}
                    className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center text-white bg-transparent transition-colors hover:bg-white/10 rounded-full"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </motion.div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Message Modal */}
      {showMessageModal && selectedPartner && (
        <PartnerMessageModal
          partner={selectedPartner}
          isDark={true}
          onClose={() => {
            setShowMessageModal(false)
            setSelectedPartner(null)
          }}
          onMessageSent={handleMessageSent}
        />
      )}
    </>
  )
}
