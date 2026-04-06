import { useEffect, useRef, useState } from 'react'
import { Play, RotateCcw, Loader2, PhoneCall, PhoneOff, Zap } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import demoTranscripts from '../../data/demoTranscripts'
import LiveAudioPanel from './LiveAudioPanel'
import './TranscriptFeed.css'

const SYSTEM_PROMPT = `You are an AI assistant for DishTV customer service. Analyze the call transcript and return ONLY a JSON object with these exact fields:
{
  "intent": "one of: recharge_issue, pack_rollback, technical_issue, upgrade_inquiry, watcho_inquiry, general_inquiry",
  "classification": "one of: billing, pack_management, technical, sales, general",
  "sentiment": "one of: positive, neutral, frustrated, angry",
  "churnRisk": "one of: low, medium, high",
  "extractedDetails": {
    "vcNo": "string or null",
    "issueDescription": "string (1 sentence)",
    "suggestedAction": "string (what agent should do next)"
  }
}
Return ONLY valid JSON, no markdown, no explanation.`

function parseTranscript(text) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) => {
      if (line.startsWith('Agent:'))
        return { id: i, speaker: 'agent', text: line.slice(6).trim() }
      if (line.startsWith('Customer:'))
        return { id: i, speaker: 'customer', text: line.slice(9).trim() }
      return { id: i, speaker: 'system', text: line }
    })
}

function extractVc(text) {
  const m = text.match(/\b(\d{11})\b/)
  return m ? m[1] : null
}

function highlightVc(text) {
  return text.replace(/\b(\d{11})\b/g, '<span class="feed-vc-highlight">$1</span>')
}

// Delay between lines (ms) — customer slightly slower than agent
const LINE_DELAY = { agent: 700, customer: 900, system: 500 }

export default function TranscriptFeed() {
  const [mode, setMode]                     = useState('demo') // 'demo' | 'live'
  const [selectedId, setSelectedId]         = useState('')
  const [parsedLines, setParsedLines]       = useState([])
  const [displayedLines, setDisplayedLines] = useState([])
  const [playbackIdx, setPlaybackIdx]       = useState(0)
  const [isPlaying, setIsPlaying]           = useState(false)
  const [playbackDone, setPlaybackDone]     = useState(false)
  const feedRef        = useRef(null)
  const vcAutoFetched  = useRef(false)
  // Snapshot of lines + vcNo captured at playback end, used by auto-classify
  const classifyRef    = useRef({ lines: [], vcNo: '' })

  const vcNo               = useAppStore((s) => s.vcNo)
  const setVcNo            = useAppStore((s) => s.setVcNo)
  const fetchSubscriber    = useAppStore((s) => s.fetchSubscriber)
  const isLoadingSubs      = useAppStore((s) => s.isLoadingSubscriber)
  const apiKey             = useAppStore((s) => s.apiKey)
  const isClassifying      = useAppStore((s) => s.isClassifying)
  const setIsClassifying   = useAppStore((s) => s.setIsClassifying)
  const setIntentResult    = useAppStore((s) => s.setIntentResult)
  const setTranscript      = useAppStore((s) => s.setTranscript)
  const addToast           = useAppStore((s) => s.addToast)
  const setSubscriber      = useAppStore((s) => s.setSubscriber)
  const setSubscriberError = useAppStore((s) => s.setSubscriberError)

  // ── Playback engine ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) return
    if (playbackIdx >= parsedLines.length) {
      setIsPlaying(false)
      setPlaybackDone(true)
      return
    }

    const line  = parsedLines[playbackIdx]
    const delay = LINE_DELAY[line.speaker] || 700

    const timer = setTimeout(() => {
      setDisplayedLines((prev) => {
        const next = [...prev, line]
        // Keep classifyRef in sync so auto-classify sees the full transcript
        classifyRef.current.lines = next
        return next
      })

      // Auto-detect VC and fetch subscriber immediately on detection
      if (!vcAutoFetched.current) {
        const vc = extractVc(line.text)
        if (vc) {
          vcAutoFetched.current   = true
          classifyRef.current.vcNo = vc
          setVcNo(vc)
          fetchSubscriber(vc)
        }
      }

      setPlaybackIdx((prev) => prev + 1)
    }, delay)

    return () => clearTimeout(timer)
  }, [isPlaying, playbackIdx, parsedLines])

  // ── Auto-classify when playback finishes ────────────────────────────────────
  useEffect(() => {
    if (!playbackDone) return
    runClassify()
  }, [playbackDone]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll feed to bottom
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [displayedLines])

  // ── Core classify logic (uses ref snapshot — no stale-closure risk) ──────────
  const runClassify = async () => {
    if (!apiKey) {
      addToast({ type: 'error', message: 'Anthropic API key not set — go to Settings.' })
      return
    }

    const lines = classifyRef.current.lines
    const vc    = classifyRef.current.vcNo

    if (!lines.length || isClassifying) return

    console.warn('[NERVE] Direct browser API call. Route through backend in production.')

    const fullText = lines
      .map((l) => `${l.speaker === 'agent' ? 'Agent' : 'Customer'}: ${l.text}`)
      .join('\n')

    setIsClassifying(true)
    setIntentResult(null)

    const classifyTask = fetch('https://api.anthropic.com/v1/messages', {
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
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: fullText }],
      }),
    }).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message || `API ${res.status}`)
      const raw = (data.content?.[0]?.text || '')
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
      return JSON.parse(raw)
    })

    // Subscriber fetch runs in parallel if VC was already detected during playback
    const subscriberTask = vc && !isLoadingSubs
      ? fetchSubscriber(vc)
      : Promise.resolve()

    try {
      const [intent] = await Promise.all([classifyTask, subscriberTask])
      setIntentResult(intent)

      // Fallback: if VC wasn't in transcript, use what Claude extracted
      if (!vc && intent?.extractedDetails?.vcNo) {
        setVcNo(intent.extractedDetails.vcNo)
        await fetchSubscriber(intent.extractedDetails.vcNo)
      }

      addToast({ type: 'success', message: 'Intent classified.' })
    } catch (err) {
      addToast({ type: 'error', message: `Classification failed: ${err.message}` })
    } finally {
      setIsClassifying(false)
    }
  }

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleSelect = (e) => {
    const id   = e.target.value
    setSelectedId(id)
    const demo = demoTranscripts.find((d) => d.id === id)
    if (!demo) return

    const lines = parseTranscript(demo.transcript)
    setParsedLines(lines)
    setDisplayedLines([])
    setPlaybackIdx(0)
    setIsPlaying(false)
    setPlaybackDone(false)
    vcAutoFetched.current         = false
    classifyRef.current           = { lines: [], vcNo: '' }
    setTranscript(demo.transcript)
    setIntentResult(null)
    setSubscriber(null)
    setSubscriberError('')
    setVcNo('')
  }

  const handleStart = () => {
    if (!parsedLines.length) return
    setDisplayedLines([])
    setPlaybackIdx(0)
    setPlaybackDone(false)
    vcAutoFetched.current         = false
    classifyRef.current           = { lines: [], vcNo: '' }
    setVcNo('')
    setSubscriber(null)
    setIntentResult(null)
    setIsPlaying(true)
  }

  const selectedDemo = demoTranscripts.find((d) => d.id === selectedId)

  return (
    <div className="transcript-feed-panel">
      {/* ── Header: LIVE TRANSCRIPT + mode toggle ───────────────────────────── */}
      <div className="feed-header">
        <div className="feed-header-left">
          <span className="feed-header-title">LIVE TRANSCRIPT</span>
        </div>
        <div className="feed-header-right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {mode === 'demo' && isPlaying && (
            <span className="feed-rec-indicator">
              <span className="feed-rec-dot" />
              REC
            </span>
          )}
          <div className="feed-mode-toggle">
            <button
              className={`feed-mode-btn${mode === 'demo' ? ' active' : ''}`}
              onClick={() => setMode('demo')}
            >
              Demo
            </button>
            <button
              className={`feed-mode-btn${mode === 'live' ? ' active' : ''}`}
              onClick={() => setMode('live')}
            >
              Live Audio
            </button>
          </div>
        </div>
      </div>

      {/* ── DEMO MODE ────────────────────────────────────────────────────────── */}
      {mode === 'demo' && (
        <>
          {/* Compact control bar */}
          <div className="feed-controls">
            <select
              className="feed-select"
              value={selectedId}
              onChange={handleSelect}
            >
              <option value="">Select scenario...</option>
              {demoTranscripts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>

            <div className="feed-controls-right">
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleStart}
                disabled={!parsedLines.length || isPlaying || isClassifying}
                title={playbackDone ? 'Replay call' : 'Start call playback'}
              >
                {isPlaying ? (
                  <><PhoneCall size={12} className="pulse-icon" /> Live</>
                ) : playbackDone ? (
                  <><RotateCcw size={12} /> Replay</>
                ) : (
                  <><Play size={12} /> Start</>
                )}
              </button>
            </div>
          </div>

          {/* Transcript feed */}
          <div className="feed-body" ref={feedRef}>
            {displayedLines.length === 0 && !isPlaying && (
              <div className="feed-empty">
                <PhoneOff size={24} color="var(--text-muted)" />
                <span>Select a scenario and click <strong>Start</strong></span>
              </div>
            )}

            {displayedLines.map((line) => (
              <div
                key={line.id}
                className={`feed-line feed-line--${line.speaker} animate-in`}
              >
                <div className="feed-speaker-label">
                  <span className={`feed-speaker feed-speaker--${line.speaker}`}>
                    {line.speaker === 'agent' ? 'AGENT' : line.speaker === 'customer' ? 'CUSTOMER' : ''}
                  </span>
                </div>
                <div className="feed-bubble">
                  <span
                    className="feed-text"
                    dangerouslySetInnerHTML={{ __html: highlightVc(line.text) }}
                  />
                </div>
              </div>
            ))}

            {isPlaying && (
              <div className="feed-typing">
                <span /><span /><span />
              </div>
            )}
          </div>

          {/* Status bar */}
          {(isPlaying || playbackDone || vcNo || isClassifying) && (
            <div className="feed-status-bar">
              {isPlaying && (
                <span className="feed-status-item feed-status-live">
                  <span className="live-dot" /> Recording
                </span>
              )}
              {playbackDone && !isPlaying && (
                <span className="feed-status-item">
                  {displayedLines.length} lines transcribed
                </span>
              )}
              {isClassifying && (
                <span className="feed-status-item feed-status-classifying">
                  <Zap size={11} className="spin" /> Analyzing intent...
                </span>
              )}
              {vcNo && (
                <span className="feed-status-item feed-status-vc">
                  VC detected: <span className="mono">{vcNo}</span>
                  {isLoadingSubs && <Loader2 size={11} className="spin" style={{ marginLeft: 4 }} />}
                </span>
              )}
            </div>
          )}
        </>
      )}

      {/* ── LIVE AUDIO MODE ──────────────────────────────────────────────────── */}
      {mode === 'live' && <LiveAudioPanel />}
    </div>
  )
}
