import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Phone, PhoneOff, Loader2, Volume2, Zap } from 'lucide-react'
import useAppStore from '../../store/useAppStore'

// ── DishTV bot persona ────────────────────────────────────────────────────────
const AGENT_SYSTEM_PROMPT = `You are Priya, a friendly and professional DishTV customer support AI agent. You speak in Hinglish — a natural mix of Hindi and English the way Indians talk on the phone.

Rules (IMPORTANT):
- Keep every response SHORT — 2 to 3 sentences maximum. This is a live voice call.
- Plain text only. No markdown, no asterisks, no bullet points. Your text will be spoken aloud.
- If the customer describes a problem but has not given a VC number yet, ask for it politely.
- When the customer gives their VC number (alphanumeric like MAKDKH29393 or 11-digit numeric), acknowledge it and say you are checking their account.
- After checking, guide them with a solution based on their issue.
- Common issues you handle: signal problem, channels not coming, E302 error, recharge not reflecting, pack upgrade, Watcho OTT plans.
- Be warm, calm, and solution-focused. Never say you cannot help.`

// ── Watcho intent detection ───────────────────────────────────────────────────
const WATCHO_KEYWORDS = [
  // Brand name variants (speech recognition may split or mispronounce)
  'watcho', 'watch o', 'wotcho', 'watchho',
  // OTT / streaming
  'ott', 'streaming', 'web series', 'webseries', 'movie', 'movies',
  // Plan / pricing (English)
  'plan', 'plans', 'price', 'pricing', 'rate', 'rates', 'cost',
  'subscription', 'monthly', 'annual', 'yearly', 'charges', 'fees', 'offer',
  // Hindi / Hinglish
  'kitne', 'kitna', 'kya rate', 'kya price', 'kya hai', 'bata', 'batao',
  'mehnga', 'sasta', 'discount', 'offer',
]

function isWatchoQuery(text) {
  const lower = text.toLowerCase()
  return WATCHO_KEYWORDS.some(k => lower.includes(k))
}

async function fetchWatchoPlans(backendUrl) {
  const base = (backendUrl || 'http://localhost:3001').replace(/\/$/, '')
  const res  = await fetch(`${base}/api/watcho-plans`)
  const data = await res.json()
  return data.plans || []
}

function formatPlansForBot(plans) {
  return plans
    .map(p => `${p.name}: Monthly Rs.${p.monthlyPrice}, Annual Rs.${p.annualPrice}`)
    .join('; ')
}

// ── VC extraction from spoken text ───────────────────────────────────────────
function extractVcFromText(text) {
  // 11-digit numeric VC (may have spaces from speech recognition)
  const digitsOnly = text.replace(/\s+/g, '')
  const numMatch = digitsOnly.match(/\b(\d{11})\b/)
  if (numMatch) return numMatch[1]

  // Alphanumeric VC like MAKDKH29393
  // Speech may insert spaces: "M A K D K H 2 9 3 9 3" → strip spaces first
  const alphaMatch = digitsOnly.match(/([A-Za-z]{2,8}\d{4,10})/i)
  if (alphaMatch) return alphaMatch[1].toUpperCase()

  // Fallback: look in original text too (in case spaces aren't the issue)
  const fallback = text.match(/([A-Za-z]{2,8}[\s]*\d{4,10})/i)
  if (fallback) return fallback[1].replace(/\s+/g, '').toUpperCase()

  return null
}

// ── Single listen session — resolves with transcript or null (no-speech) ─────
function listenOnce(recognitionRef) {
  return new Promise((resolve, reject) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { reject(new Error('not_supported')); return }

    const recognition = new SpeechRecognition()
    recognition.lang = 'hi-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    let settled = false
    const settle = (fn, val) => {
      if (settled) return
      settled = true
      recognitionRef.current = null
      fn(val)
    }

    recognition.onresult  = (e) => settle(resolve, e.results[0][0].transcript)
    recognition.onerror   = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') settle(resolve, null)
      else settle(reject, new Error(e.error))
    }
    recognition.onend     = () => settle(resolve, null)

    try { recognition.start() } catch { settle(resolve, null) }
  })
}

// ── TTS helper (Browser) — resolves when utterance finishes ──────────────────
function speakTextBrowser(text) {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis
    if (!synth) { resolve(); return }
    synth.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang  = 'hi-IN'
    utterance.rate  = 0.88
    utterance.pitch = 1.1

    const pickVoice = () => {
      const voices = synth.getVoices()
      return (
        voices.find(v => v.lang === 'hi-IN' && /female|woman/i.test(v.name)) ||
        voices.find(v => v.lang === 'hi-IN') ||
        voices.find(v => v.lang === 'en-IN') ||
        voices.find(v => v.lang.startsWith('en')) ||
        null
      )
    }

    const voice = pickVoice()
    if (voice) utterance.voice = voice

    utterance.onend   = resolve
    utterance.onerror = resolve
    synth.speak(utterance)
  })
}

// Keep original name as alias for backward compatibility
const speakText = speakTextBrowser

// ── TTS helper (Gemini) — calls backend proxy, plays returned audio ─────────
let _geminiAudioEl = null   // reuse a single Audio element to avoid overlap

function speakTextGemini(text, backendUrl, geminiApiKey, onFallback) {
  return new Promise(async (resolve) => {
    // Stop any in-progress Gemini playback
    if (_geminiAudioEl) {
      _geminiAudioEl.pause()
      _geminiAudioEl.src = ''
      _geminiAudioEl = null
    }
    // Also cancel any lingering browser speech
    window.speechSynthesis?.cancel()

    const base = (backendUrl || 'http://localhost:3001').replace(/\/$/, '')
    try {
      const res = await fetch(`${base}/api/tts/gemini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': geminiApiKey,
        },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        const errMsg = errBody?.error || `HTTP ${res.status}`
        console.error('[TTS-Gemini] API error:', errMsg)
        onFallback?.(`Gemini TTS failed: ${errMsg}`)
        await speakTextBrowser(text)
        resolve()
        return
      }

      const blob = await res.blob()
      if (blob.size < 100) {
        console.error('[TTS-Gemini] Response too small, likely empty audio')
        onFallback?.('Gemini TTS returned empty audio')
        await speakTextBrowser(text)
        resolve()
        return
      }

      const url  = URL.createObjectURL(blob)
      const audio = new Audio(url)
      _geminiAudioEl = audio

      audio.onended = () => {
        URL.revokeObjectURL(url)
        _geminiAudioEl = null
        resolve()
      }
      audio.onerror = (e) => {
        URL.revokeObjectURL(url)
        _geminiAudioEl = null
        console.error('[TTS-Gemini] Playback error:', e)
        onFallback?.('Gemini audio playback failed — fell back to browser TTS')
        speakTextBrowser(text).then(resolve)
      }
      audio.play().catch((e) => {
        console.error('[TTS-Gemini] Autoplay blocked:', e)
        onFallback?.('Gemini audio autoplay blocked — fell back to browser TTS')
        speakTextBrowser(text).then(resolve)
      })
    } catch (err) {
      console.error('[TTS-Gemini] Network error:', err.message)
      onFallback?.(`Gemini TTS network error: ${err.message}`)
      await speakTextBrowser(text)
      resolve()
    }
  })
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LiveAudioPanel() {
  const [callActive, setCallActive] = useState(false)
  const [messages,   setMessages]   = useState([])
  const [status,     setStatus]     = useState('idle') // idle | listening | thinking | speaking

  const callActiveRef    = useRef(false)
  const conversationRef  = useRef([])   // Claude message history
  const vcFetchedRef     = useRef(false)
  const recognitionRef   = useRef(null) // current SpeechRecognition instance
  const feedRef          = useRef(null)

  // Store selectors
  const apiKey           = useAppStore(s => s.apiKey)
  const backendUrl       = useAppStore(s => s.backendUrl)
  const geminiApiKey     = useAppStore(s => s.geminiApiKey)
  const useGeminiTts     = useAppStore(s => s.useGeminiTts)
  const fetchSubscriber  = useAppStore(s => s.fetchSubscriber)
  const setVcNo          = useAppStore(s => s.setVcNo)
  const setSubscriber    = useAppStore(s => s.setSubscriber)
  const setIntentResult  = useAppStore(s => s.setIntentResult)
  const setIsClassifying = useAppStore(s => s.setIsClassifying)
  const addToast         = useAppStore(s => s.addToast)
  const vcNo             = useAppStore(s => s.vcNo)
  const isLoadingSubs    = useAppStore(s => s.isLoadingSubscriber)
  const isClassifying    = useAppStore(s => s.isClassifying)

  // ── Unified speak function — routes to Gemini or browser based on setting ──
  const speak = useCallback((text) => {
    if (useGeminiTts && geminiApiKey) {
      return speakTextGemini(text, backendUrl, geminiApiKey, (msg) => {
        addToast({ type: 'warning', message: msg })
      })
    }
    return speakTextBrowser(text)
  }, [useGeminiTts, geminiApiKey, backendUrl, addToast])

  // Auto-scroll to bottom
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight
  }, [messages, status])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      callActiveRef.current = false
      recognitionRef.current?.abort()
      window.speechSynthesis?.cancel()
      if (_geminiAudioEl) { _geminiAudioEl.pause(); _geminiAudioEl = null }
    }
  }, [])

  // ── Call Claude for a conversational reply ──────────────────────────────────
  const callClaude = useCallback(async (userText) => {
    conversationRef.current.push({ role: 'user', content: userText })
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 150,
        system: AGENT_SYSTEM_PROMPT,
        messages: conversationRef.current,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`)
    const reply = data.content?.[0]?.text?.trim() || 'Ji, main sun raha hun.'
    conversationRef.current.push({ role: 'assistant', content: reply })
    return reply
  }, [apiKey])

  // ── Classify call intent after end ─────────────────────────────────────────
  const classifyCall = useCallback(async () => {
    const msgs = conversationRef.current
    if (msgs.length < 2 || !apiKey) return

    const fullText = msgs
      .map(m => `${m.role === 'user' ? 'Customer' : 'Agent'}: ${m.content}`)
      .join('\n')

    const SYS = `You are an AI assistant for DishTV. Analyze this call and return ONLY valid JSON:
{"intent":"recharge_issue|pack_rollback|technical_issue|upgrade_inquiry|watcho_inquiry|general_inquiry","classification":"billing|pack_management|technical|sales|general","sentiment":"positive|neutral|frustrated|angry","churnRisk":"low|medium|high","extractedDetails":{"vcNo":"string or null","issueDescription":"1 sentence","suggestedAction":"string"}}
No markdown. JSON only.`

    setIsClassifying(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 512,
          system: SYS,
          messages: [{ role: 'user', content: fullText }],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message)
      const raw = (data.content?.[0]?.text || '')
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
      setIntentResult(JSON.parse(raw))
      addToast({ type: 'success', message: 'Call analyzed.' })
    } catch (err) {
      addToast({ type: 'error', message: `Classification failed: ${err.message}` })
    } finally {
      setIsClassifying(false)
    }
  }, [apiKey, setIntentResult, setIsClassifying, addToast])

  // ── Start call ──────────────────────────────────────────────────────────────
  const startCall = useCallback(async () => {
    if (!apiKey) {
      addToast({ type: 'error', message: 'Set Anthropic API key in Settings first.' })
      return
    }
    if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) {
      addToast({ type: 'error', message: 'Use Chrome — Speech Recognition is not supported here.' })
      return
    }

    // Reset state
    callActiveRef.current = true
    setCallActive(true)
    setMessages([])
    conversationRef.current = []
    vcFetchedRef.current    = false
    setSubscriber(null)
    setIntentResult(null)
    setVcNo('')
    setIsClassifying(false)

    // Bot greeting
    setStatus('thinking')
    let greeting
    try {
      greeting = await callClaude('(call just connected, give a warm brief greeting)')
    } catch (err) {
      addToast({ type: 'error', message: `Could not start: ${err.message}` })
      callActiveRef.current = false
      setCallActive(false)
      setStatus('idle')
      return
    }

    setMessages([{ role: 'agent', text: greeting }])
    setStatus('speaking')
    await speak(greeting)

    // ── Conversation loop ─────────────────────────────────────────────────────
    while (callActiveRef.current) {
      setStatus('listening')

      let spoken = null
      try {
        spoken = await listenOnce(recognitionRef)
      } catch (err) {
        if (err.message === 'not_supported') {
          addToast({ type: 'error', message: 'Speech Recognition not supported.' })
          break
        }
        // Any other mic error — retry once silently
        continue
      }

      if (!callActiveRef.current) break
      if (!spoken || spoken.trim() === '') continue  // silence / no-speech, loop again

      // Show customer bubble
      setStatus('thinking')
      setMessages(prev => [...prev, { role: 'customer', text: spoken }])

      // VC detection
      if (!vcFetchedRef.current) {
        const vc = extractVcFromText(spoken)
        if (vc) {
          vcFetchedRef.current = true
          setVcNo(vc)
          fetchSubscriber(vc)
        }
      }

      // Watcho intent — set intent immediately + inject live pricing into Claude context
      let claudeInput = spoken
      if (isWatchoQuery(spoken)) {
        // Set intent right away so WatchoPlansCard appears on the dashboard instantly
        setIntentResult({
          intent: 'watcho_inquiry',
          classification: 'sales',
          sentiment: 'neutral',
          churnRisk: 'low',
          extractedDetails: {
            vcNo: null,
            issueDescription: 'Customer is asking about Watcho OTT plans and pricing.',
            suggestedAction: 'Share Watcho plan pricing with the customer.',
          },
        })
        try {
          const plans = await fetchWatchoPlans(backendUrl)
          if (plans.length > 0) {
            const planList = formatPlansForBot(plans)
            claudeInput = `${spoken}\n\n[Live pricing data from system: ${planList}. Use this exact pricing when answering.]`
          }
        } catch {
          // non-fatal
        }
      }

      // Classify intent after every message — fire in background, doesn't block the reply
      classifyCall()

      // Get and speak bot reply
      try {
        const reply = await callClaude(claudeInput)
        if (!callActiveRef.current) break
        setMessages(prev => [...prev, { role: 'agent', text: reply }])
        setStatus('speaking')
        await speak(reply)
      } catch (err) {
        addToast({ type: 'error', message: `Agent error: ${err.message}` })
      }
    }

    setStatus('idle')
  }, [apiKey, backendUrl, callClaude, classifyCall, fetchSubscriber, setVcNo, setSubscriber, setIntentResult, setIsClassifying, addToast, speak])

  // ── End call ────────────────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    callActiveRef.current = false
    setCallActive(false)
    setStatus('idle')
    recognitionRef.current?.abort()
    recognitionRef.current = null
    window.speechSynthesis?.cancel()
    // Also stop any Gemini audio playback
    if (_geminiAudioEl) {
      _geminiAudioEl.pause()
      _geminiAudioEl.src = ''
      _geminiAudioEl = null
    }
    classifyCall()
  }, [classifyCall])

  // ── Status indicator ────────────────────────────────────────────────────────
  const statusEl = {
    idle:      null,
    listening: <><span className="live-dot" />&nbsp;Listening&hellip;</>,
    thinking:  <><Loader2 size={11} className="spin" />&nbsp;Processing&hellip;</>,
    speaking:  <><Volume2 size={11} />&nbsp;Speaking&hellip;</>,
  }[status]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

      {/* ── Conversation feed ─────────────────────────────────────────────── */}
      <div className="feed-body" ref={feedRef}>

        {messages.length === 0 && !callActive && (
          <div className="feed-empty">
            <Mic size={24} color="var(--text-muted)" />
            <span>Click <strong>Start Call</strong> to begin live audio</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, textAlign: 'center', lineHeight: 1.5 }}>
              Chrome + microphone access required.<br />
              Speak in Hindi / English / Hinglish.
            </span>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`feed-line feed-line--${msg.role} animate-in`}>
            <div className="feed-speaker-label">
              <span className={`feed-speaker feed-speaker--${msg.role}`}>
                {msg.role === 'agent' ? 'AGENT' : 'CUSTOMER'}
              </span>
            </div>
            <div className="feed-bubble">
              <span className="feed-text">{msg.text}</span>
            </div>
          </div>
        ))}

        {/* Typing indicator while AI is generating */}
        {status === 'thinking' && (
          <div className="feed-typing"><span /><span /><span /></div>
        )}

        {/* Mic pulse while listening */}
        {status === 'listening' && callActive && (
          <div className="live-mic-pulse">
            <span className="live-mic-ring" />
            <span className="live-mic-ring live-mic-ring--2" />
            <Mic size={14} color="var(--accent-danger)" />
          </div>
        )}
      </div>

      {/* ── Controls / status bar ─────────────────────────────────────────── */}
      <div className="live-audio-bar">
        {!callActive ? (
          <button className="live-call-btn live-call-btn--start" onClick={startCall}>
            <Phone size={14} />
            Start Call
            {useGeminiTts && geminiApiKey && (
              <span style={{ fontSize: 9, opacity: 0.7, marginLeft: 6 }}>Gemini TTS</span>
            )}
          </button>
        ) : (
          <>
            <span className="feed-status-item" style={{ flex: 1 }}>
              {statusEl}
            </span>

            {vcNo && (
              <span className="feed-status-item feed-status-vc">
                VC: <span className="mono">{vcNo}</span>
                {isLoadingSubs && (
                  <Loader2 size={10} className="spin" style={{ marginLeft: 3 }} />
                )}
              </span>
            )}

            {isClassifying && (
              <span className="feed-status-item feed-status-classifying">
                <Zap size={10} className="spin" />&nbsp;Analyzing&hellip;
              </span>
            )}

            <button className="live-call-btn live-call-btn--end" onClick={endCall}>
              <PhoneOff size={13} />
              End
            </button>
          </>
        )}
      </div>
    </div>
  )
}
