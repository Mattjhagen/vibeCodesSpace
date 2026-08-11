'use client'

import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  r: number
  alpha: number
  targetAlpha: number
  speed: number
  twinkleSpeed: number
  col: string
}

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0, H = 0
    let stars: Star[] = []
    let rafId: number

    const COLORS = [
      '244,244,255', // white
      '160,102,255', // violet-glow
      '0,212,255',   // cyan
      '244,244,255', // white (weighted more)
      '244,244,255',
    ]

    function resize() {
      if (!canvas) return
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
      initStars()
    }

    function initStars() {
      const count = Math.floor((W * H) / 6000)
      stars = Array.from({ length: count }, () => makeStar())
    }

    function makeStar(): Star {
      const alpha = 0.1 + Math.random() * 0.7
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.3 + Math.random() * 1.4,
        alpha,
        targetAlpha: 0.1 + Math.random() * 0.8,
        speed: 0.003 + Math.random() * 0.008,
        twinkleSpeed: 0.004 + Math.random() * 0.012,
        col: COLORS[Math.floor(Math.random() * COLORS.length)],
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)

      stars.forEach(s => {
        // Twinkle — ease alpha toward target
        if (Math.abs(s.alpha - s.targetAlpha) < 0.01) {
          s.targetAlpha = 0.08 + Math.random() * 0.85
        }
        s.alpha += (s.targetAlpha - s.alpha) * s.twinkleSpeed

        // Draw star
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${s.col},${s.alpha.toFixed(3)})`
        ctx.fill()

        // Occasional subtle glow on brighter stars
        if (s.r > 1 && s.alpha > 0.5) {
          const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5)
          glow.addColorStop(0, `rgba(${s.col},${(s.alpha * 0.3).toFixed(3)})`)
          glow.addColorStop(1, 'transparent')
          ctx.beginPath()
          ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2)
          ctx.fillStyle = glow
          ctx.fill()
        }
      })

      rafId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    draw()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  )
}
