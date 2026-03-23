import { useState } from 'react'
import { Sparkles, FileText, Loader2 } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import DemoTranscripts from './DemoTranscripts'
import './TranscriptPanel.css'

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

export default function TranscriptPanel() {
  const [activeTab, setActiveTab] = useState('demo')

  const transcript = useAppStore((s) => s.transcript)
  const vcNo = useAppStore((s) => s.vcNo)
  const apiKey = useAppStore((s) => s.apiKey)
  const isClassifying = useAppStore((s) => s.isClassifying)

  const setTranscript = useAppStore((s) => s.setTranscript)
  const setVcNo = useAppStore((s) => s.setVcNo)
  const setIntentResult = useAppStore((s) => s.setIntentResult)
  const setIsClassifying = useAppStore((s) => s.setIsClassifying)
  const addToast = useAppStore((s) => s.addToast)

  const handleClassify = async () => {
    if (!transcript.trim()) return

    if (!apiKey) {
      addToast({ type: 'error', message: 'Anthropic API key not set. Go to Settings.' })
      return
    }

    console.warn('[NERVE] In production, route API calls through your backend, not directly from the browser.')

    setIsClassifying(true)
    setIntentResult(null)

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
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: transcript }],
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message || `API error ${res.status}`)
      }

      const data = await res.json()
      const raw = data.content?.[0]?.text?.trim() || ''

      // Strip possible markdown code fences
      const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
      const parsed = JSON.parse(jsonStr)

      setIntentResult(parsed)

      if (parsed?.extractedDetails?.vcNo) {
        setVcNo(parsed.extractedDetails.vcNo)
      }

      addToast({ type: 'success', message: 'Intent classified successfully.' })
    } catch (err) {
      addToast({ type: 'error', message: `Classification failed: ${err.message}` })
    } finally {
      setIsClassifying(false)
    }
  }

  return (
    <div className="card transcript-panel">
      <div className="card-header">
        <div className="card-title">
          <FileText size={14} />
          Transcript Input
        </div>
        <span className="badge badge-blue">AI</span>
      </div>

      <div className="transcript-tabs">
        <button
          className={`transcript-tab ${activeTab === 'demo' ? 'transcript-tab--active' : ''}`}
          onClick={() => setActiveTab('demo')}
        >
          Demo Transcripts
        </button>
        <button
          className={`transcript-tab ${activeTab === 'manual' ? 'transcript-tab--active' : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          Manual Input
        </button>
      </div>

      <div className="transcript-body">
        {activeTab === 'demo' ? (
          <DemoTranscripts />
        ) : (
          <div className="manual-input-area">
            <textarea
              className="transcript-textarea"
              placeholder="Paste call transcript here..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />
            <div className="manual-vc-row">
              <label className="label">VC Number (auto-extracted or manual)</label>
              <input
                type="text"
                className="input input-sm mono"
                placeholder="e.g. 02563029393"
                value={vcNo}
                onChange={(e) => setVcNo(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="transcript-footer">
        <button
          className="btn btn-primary btn-full classify-btn"
          onClick={handleClassify}
          disabled={!transcript.trim() || isClassifying}
        >
          {isClassifying ? (
            <>
              <Loader2 size={15} className="spin" />
              Classifying...
            </>
          ) : (
            <>
              <Sparkles size={15} />
              Classify Intent →
            </>
          )}
        </button>
      </div>
    </div>
  )
}
