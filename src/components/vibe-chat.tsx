'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const VIBE_SUGGESTIONS = [
  'How do I generate a site with AI?',
  'How do custom subdomains and domains work?',
  'What is included in the Pro & Business plans?',
  'Can I edit and restyle the generated site?',
]

export function VibeChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Yo! 🚀 I'm VibeBot, your AI website building assistant. Ask me anything about prompt engineering, themes, custom domains, or our plans!",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      textareaRef.current?.focus()
    }
  }, [isOpen, messages, isLoading])

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim()
    if (!text || isLoading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()
      const reply =
        data.response ||
        'VibeBot is ready! Prompt your website in the generator box or ask me anything about your project.'

      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Connection glitch. Please refresh or try again in a second!',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
      }}
    >
      {/* VibeChat Window */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '70px',
            right: '0',
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            height: '520px',
            maxHeight: 'calc(100vh - 120px)',
            background: 'linear-gradient(180deg, #090e1c 0%, #060913 100%)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: '16px',
            boxShadow:
              '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              background: 'rgba(99, 102, 241, 0.12)',
              borderBottom: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)',
                }}
              >
                ⚡
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#f8fafc',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Vibe<span style={{ color: '#06b6d4' }}>Bot</span> AI
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    color: '#34d399',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#34d399',
                      boxShadow: '0 0 8px #34d399',
                    }}
                  />
                  Live · Site Builder Engine
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '4px',
                lineHeight: 1,
              }}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: '#070a14',
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background:
                    m.role === 'user'
                      ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                      : 'rgba(255, 255, 255, 0.05)',
                  color: '#f8fafc',
                  padding: '10px 14px',
                  borderRadius:
                    m.role === 'user'
                      ? '14px 14px 2px 14px'
                      : '14px 14px 14px 2px',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  border:
                    m.role === 'assistant'
                      ? '1px solid rgba(255, 255, 255, 0.08)'
                      : 'none',
                  wordBreak: 'break-word',
                  boxShadow:
                    m.role === 'user'
                      ? '0 4px 14px rgba(99, 102, 241, 0.3)'
                      : 'none',
                }}
              >
                {m.content}
              </div>
            ))}

            {isLoading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#06b6d4',
                  padding: '8px 14px',
                  borderRadius: '14px 14px 14px 2px',
                  fontSize: '13px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>Synthesizing vibe</span>
                <span>...</span>
              </div>
            )}

            {/* Quick Suggestions */}
            {messages.length === 1 && !isLoading && (
              <div
                style={{
                  marginTop: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: 600,
                  }}
                >
                  Quick Prompts
                </div>
                {VIBE_SUGGESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    style={{
                      textAlign: 'left',
                      background: 'rgba(99, 102, 241, 0.08)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#cbd5e1',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background =
                        'rgba(99, 102, 241, 0.18)'
                      e.currentTarget.style.borderColor = '#06b6d4'
                      e.currentTarget.style.color = '#f8fafc'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background =
                        'rgba(99, 102, 241, 0.08)'
                      e.currentTarget.style.borderColor =
                        'rgba(99, 102, 241, 0.25)'
                      e.currentTarget.style.color = '#cbd5e1'
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Row */}
          <div
            style={{
              padding: '12px',
              borderTop: '1px solid rgba(99, 102, 241, 0.2)',
              background: 'rgba(5, 8, 18, 0.8)',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end',
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask VibeBot anything..."
              rows={1}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#f8fafc',
                fontSize: '13px',
                outline: 'none',
                resize: 'none',
                maxHeight: '80px',
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                border: 'none',
                borderRadius: '8px',
                width: '36px',
                height: '36px',
                cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
                opacity: !input.trim() || isLoading ? 0.4 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0,
                boxShadow: '0 0 14px rgba(99, 102, 241, 0.4)',
              }}
              aria-label="Send message"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating Launcher Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow:
            '0 8px 24px rgba(99, 102, 241, 0.4), 0 0 16px rgba(6, 182, 212, 0.3)',
          color: '#fff',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.06)'
          e.currentTarget.style.boxShadow =
            '0 12px 32px rgba(99, 102, 241, 0.6), 0 0 24px rgba(6, 182, 212, 0.5)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow =
            '0 8px 24px rgba(99, 102, 241, 0.4), 0 0 16px rgba(6, 182, 212, 0.3)'
        }}
        aria-label="Toggle VibeBot Chat"
      >
        {isOpen ? (
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>✕</span>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0-2-.9-2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
          </svg>
        )}
      </button>
    </div>
  )
}
