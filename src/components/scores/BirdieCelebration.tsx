'use client'

import { useEffect } from 'react'

const FONT_ANTON = 'var(--font-anton), Anton, sans-serif'
const FONT_BARLOW = 'var(--font-barlow), system-ui'
const FONT_MONO = 'var(--font-jb-mono), "JetBrains Mono", monospace'

interface BirdieCelebrationProps {
  playerName: string
  hole: number
  onDismiss: () => void
}

export function BirdieCelebration({ playerName, hole, onDismiss }: BirdieCelebrationProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3500)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <>
      <style>{`
        @keyframes diceBounce {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          20%       { transform: translateY(-22px) rotate(-18deg) scale(1.12); }
          50%       { transform: translateY(-10px) rotate(12deg) scale(1.06); }
          75%       { transform: translateY(-16px) rotate(-8deg) scale(1.09); }
        }
        @keyframes celebFadeIn {
          from { opacity: 0; transform: scale(0.8) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes backdropFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onDismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'backdropFadeIn 0.2s ease forwards',
        }}
      >
        {/* Card */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'linear-gradient(150deg, #1c1a0e 0%, #0d1a0d 60%, #1a1505 100%)',
            border: '2px solid #d97706',
            borderRadius: 24,
            padding: '36px 44px',
            textAlign: 'center',
            maxWidth: 300,
            width: '82%',
            animation: 'celebFadeIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
            boxShadow: '0 0 60px rgba(217,119,6,0.25), 0 20px 60px rgba(0,0,0,0.6)',
          }}
        >
          {/* Bouncing dice */}
          <div style={{
            fontSize: 76,
            lineHeight: 1,
            display: 'inline-block',
            animation: 'diceBounce 0.9s ease-in-out infinite',
          }}>
            🎲
          </div>

          {/* BIRDIE heading */}
          <div style={{
            fontFamily: FONT_ANTON,
            fontSize: 32,
            color: '#d97706',
            letterSpacing: 2,
            marginTop: 18,
            lineHeight: 1,
            animation: 'shimmer 1.6s ease-in-out infinite',
          }}>
            BIRDIE!
          </div>

          {/* Par-3 sub-label */}
          <div style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            color: 'rgba(217,119,6,0.7)',
            letterSpacing: 2,
            marginTop: 4,
            textTransform: 'uppercase',
          }}>
            Par 3 · Hole {hole}
          </div>

          {/* Player name */}
          <div style={{
            fontFamily: FONT_BARLOW,
            fontSize: 17,
            fontWeight: 700,
            color: '#fff',
            marginTop: 14,
          }}>
            {playerName}
          </div>

          {/* Flavour text */}
          <div style={{
            fontFamily: FONT_BARLOW,
            fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
            marginTop: 8,
            lineHeight: 1.5,
          }}>
            Dice roll earned at the<br />end of the round!
          </div>

          {/* Dismiss hint */}
          <div style={{
            marginTop: 22,
            fontFamily: FONT_MONO,
            fontSize: 10,
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}>
            Tap anywhere to dismiss
          </div>
        </div>
      </div>
    </>
  )
}
