"use client"

import React, { useState, useEffect } from "react"
import { Button } from "../ui/Button"
import { Plus, ArrowUp, Settings2, Mic, X, Check } from "lucide-react"

export default function ChatInput({ 
  input, 
  setInput, 
  onSendMessage, 
  isLoading, 
  disabled = false 
}) {
  const [isRecording, setIsRecording] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim() && !disabled) {
      onSendMessage()
    }
  }

  const handleMicClick = () => {
    setIsRecording(true)
    setTimeout(() => {
      setIsRecording(false)
      setInput("When speech to text feature ?")
    }, 5000)
  }

  const handleCancelRecording = () => {
    setIsRecording(false)
  }

  const handleConfirmRecording = () => {
    setIsRecording(false)
    setInput("When speech to text feature ?")
  }

  const WaveAnimation = () => {
    const [animationKey, setAnimationKey] = useState(0)

    useEffect(() => {
      const interval = setInterval(() => {
        setAnimationKey((prev) => prev + 1)
      }, 100)
      return () => clearInterval(interval)
    }, [])

    const bars = Array.from({ length: 50 }, (_, i) => {
      const height = Math.random() * 20 + 4
      const delay = Math.random() * 2
      return (
        <div
          key={`${i}-${animationKey}`}
          className="bg-gray-400 rounded-sm animate-pulse"
          style={{
            width: "2px",
            height: `${height}px`,
            animationDelay: `${delay}s`,
            animationDuration: "1s",
          }}
        />
      )
    })

    return (
      <div className="flex items-center w-full gap-2">
        <div className="flex-1 border-t-2 border-dotted border-gray-400"></div>
        <div className="flex items-center gap-1 justify-center px-6">{bars}</div>
        <div className="flex-1 border-t-2 border-dotted border-gray-400"></div>
      </div>
    )
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className="border border-zinc-700 rounded-2xl p-3 relative transition-all duration-500 ease-in-out overflow-hidden"
          style={{ backgroundColor: "#141415" }}
        >
          {isRecording ? (
            <div className="flex items-center justify-between h-12 animate-in fade-in-0 slide-in-from-top-2 duration-500 w-full">
              <WaveAnimation />
              <div className="flex items-center gap-2 ml-4">
                <button
                  type="button"
                  onClick={handleCancelRecording}
                  className="h-10 w-10 p-0 text-white hover:bg-zinc-700 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X size={20} />
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRecording}
                  className="h-10 w-10 p-0 rounded-lg flex items-center justify-center transition-colors"
                  style={{ backgroundColor: "#2DD4BF", color: "#032827" }}
                >
                  <Check size={20} />
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a follow-up..."
                className="w-full bg-transparent text-gray-300 placeholder-gray-500 resize-none border-none outline-none text-base min-h-[28px] max-h-28 pl-2"
                rows={1}
                onInput={(e) => {
                  // Removed auto-resize to prevent layout shifts
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (input.trim()) {
                      onSendMessage()
                    }
                  }
                }}
              />

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-10 w-10 p-0 text-white hover:bg-zinc-700 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Plus size={20} />
                  </button>

                  <button
                    type="button"
                    className="h-10 w-10 p-0 text-white hover:bg-zinc-700 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Settings2 size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={handleMicClick}
                    className="h-10 w-10 p-0 text-white hover:bg-zinc-700 rounded-lg flex items-center justify-center transition-colors active:bg-red-600/20"
                  >
                    <Mic size={20} />
                  </button>

                  <button
                    type="button"
                    className="h-10 px-3 rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
                    style={{ backgroundColor: "#032827", color: "#2DD4BF" }}
                  >
                    Agent
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="h-10 w-10 p-0 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-lg flex items-center justify-center transition-colors"
                >
                  <ArrowUp size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
