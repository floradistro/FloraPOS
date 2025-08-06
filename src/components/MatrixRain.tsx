'use client'

import { useEffect, useRef } from 'react'

interface MatrixRainProps {
  width?: number
  height?: number
  className?: string
}

export function MatrixRain({ width = 320, height = 400, className = '' }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    // Get actual canvas size from CSS
    const rect = canvas.getBoundingClientRect()
    const canvasWidth = rect.width
    const canvasHeight = rect.height

    // Set canvas resolution for crisp rendering
    const pixelRatio = window.devicePixelRatio || 1
    canvas.width = canvasWidth * pixelRatio
    canvas.height = canvasHeight * pixelRatio
    ctx.scale(pixelRatio, pixelRatio)

    // Matrix characters
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const fontSize = 14
    const columnWidth = 16
    const columns = Math.floor(canvasWidth / columnWidth)

    // Initialize drops with trail data
    const drops: Array<{ y: number; trail: Array<{ char: string; opacity: number; y: number }> }> = new Array(columns).fill(0).map(() => ({
      y: Math.random() * -50,
      trail: []
    }))

    // Animation variables for slower, smoother animation
    let animationId: number
    let lastTime = 0
    const targetFPS = 20
    const frameInterval = 1000 / targetFPS

    function animate(currentTime: number) {
      if (currentTime - lastTime >= frameInterval) {
        draw()
        lastTime = currentTime
      }
      animationId = requestAnimationFrame(animate)
    }

    function draw() {
      if (!ctx) return

      // Clear canvas completely - no ghosting
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)

      // Set font properties for crisp rendering
      ctx.font = `bold ${fontSize}px 'Courier New', 'Lucida Console', monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Draw matrix rain
      for (let i = 0; i < columns; i++) {
        const drop = drops[i]
        const x = i * columnWidth + columnWidth / 2
        const y = drop.y * fontSize

        // Pick random character
        const char = chars[Math.floor(Math.random() * chars.length)]

        // Bright white leading character
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(char, x, y)

        // Bright green trail characters
        for (let j = 1; j < 16; j++) {
          const trailY = y - (j * 18)
          
          if (trailY > 0) {
            // First 12 characters: solid green, last 4: fade out
            let trailOpacity
            if (j <= 12) {
              trailOpacity = Math.max(0.3, 0.9 - (j * 0.05)) // Solid fade from 0.9 to 0.3
            } else {
              trailOpacity = Math.max(0.05, 0.3 - ((j - 12) * 0.08)) // Blur fade for last 4
            }
            
            ctx.fillStyle = `rgba(0, 255, 65, ${trailOpacity})`
            const trailChar = chars[Math.floor(Math.random() * chars.length)]
            ctx.fillText(trailChar, x, trailY)
          }
        }

        // Move drop down slowly and smoothly
        drop.y += 0.15

        // Reset drop when it goes off screen - immediate reset for continuous flow
        if (y > canvasHeight + fontSize) {
          drops[i] = { y: -Math.random() * 20, trail: [] }
        }
      }
    }

    // Start animation
    animationId = requestAnimationFrame(animate)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`${className}`}
      style={{ 
        width: '100%',
        height: '100%'
      }}
    />
  )
}

export default MatrixRain 