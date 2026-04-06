import { useState } from 'react'
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, RotateCcw, Volume2, BarChart3 } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import './SettingsForm.css'

export default function SettingsForm() {
  const store = useAppStore()

  const [localAgentId,   setLocalAgentId]   = useState(store.agentId)
  const [localAgentName, setLocalAgentName] = useState(store.agentName)
  const [localApiKey,    setLocalApiKey]     = useState(store.apiKey)
  const [localBackendUrl, setLocalBackendUrl] = useState(store.backendUrl)
  const [localGeminiKey,  setLocalGeminiKey]  = useState(store.geminiApiKey)
  const [localUseGemini,  setLocalUseGemini]  = useState(store.useGeminiTts)
  const [localShowTokens, setLocalShowTokens] = useState(store.showTokenUsage)

  const [showKey, setShowKey] = useState(false)
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [healthStatus, setHealthStatus] = useState(null) // null | 'ok' | 'fail'
  const [testingHealth, setTestingHealth] = useState(false)
  const [ttsTestStatus, setTtsTestStatus] = useState(null) // null | 'playing' | 'ok' | 'fail'

  const handleSave = () => {
    store.setAgentId(localAgentId)
    store.setAgentName(localAgentName)
    store.setApiKey(localApiKey)
    store.setBackendUrl(localBackendUrl)
    store.setGeminiApiKey(localGeminiKey)
    store.setUseGeminiTts(localUseGemini)
    store.setShowTokenUsage(localShowTokens)
    store.addToast({ type: 'success', message: 'Settings saved.' })
  }

  const handleTestTts = async () => {
    if (!localGeminiKey.trim()) {
      store.addToast({ type: 'error', message: 'Gemini API key is empty.' })
      return
    }
    const base = (localBackendUrl || 'http://localhost:3001').replace(/\/$/, '')
    setTtsTestStatus('playing')
    try {
      const res = await fetch(`${base}/api/tts/gemini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': localGeminiKey,
        },
        body: JSON.stringify({ text: 'Namaste, main Priya hun. DishTV mein aapka swagat hai.' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => { URL.revokeObjectURL(url); setTtsTestStatus('ok') }
      audio.onerror = () => { URL.revokeObjectURL(url); setTtsTestStatus('fail') }
      audio.play()
    } catch (err) {
      setTtsTestStatus('fail')
      store.addToast({ type: 'error', message: `TTS test failed: ${err.message}` })
    }
  }

  const handleTestConnection = async () => {
    if (!localBackendUrl.trim()) {
      store.addToast({ type: 'error', message: 'Backend URL is empty.' })
      return
    }
    setTestingHealth(true)
    setHealthStatus(null)
    try {
      const res = await fetch(`${localBackendUrl.replace(/\/$/, '')}/health`, {
        signal: AbortSignal.timeout(5000),
      })
      setHealthStatus(res.ok ? 'ok' : 'fail')
    } catch {
      setHealthStatus('fail')
    } finally {
      setTestingHealth(false)
    }
  }

  const handleResetSession = () => {
    store.resetSession()
    store.addToast({ type: 'info', message: 'Session reset.' })
  }

  return (
    <div className="settings-form">

      {/* Agent Configuration */}
      <section className="settings-section">
        <div className="settings-section-header">
          <h3 className="settings-section-title">Agent Configuration</h3>
          <p className="settings-section-desc">Your agent identity shown across the app.</p>
        </div>
        <div className="settings-fields">
          <div className="settings-field">
            <label className="label">Agent ID</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. AGT-1042"
              value={localAgentId}
              onChange={(e) => setLocalAgentId(e.target.value)}
            />
          </div>
          <div className="settings-field">
            <label className="label">Agent Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Rahul Sharma"
              value={localAgentName}
              onChange={(e) => setLocalAgentName(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* AI Configuration */}
      <section className="settings-section">
        <div className="settings-section-header">
          <h3 className="settings-section-title">AI Configuration</h3>
          <p className="settings-section-desc">Anthropic API credentials for intent classification.</p>
        </div>
        <div className="settings-fields">
          <div className="settings-field">
            <label className="label">Anthropic API Key</label>
            <div className="input-with-toggle">
              <input
                type={showKey ? 'text' : 'password'}
                className="input"
                placeholder="sk-ant-..."
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
              />
              <button
                type="button"
                className="key-toggle-btn"
                onClick={() => setShowKey((v) => !v)}
                tabIndex={-1}
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="settings-hint">
              ⚠ Direct browser access. Route through backend in production.
            </p>
          </div>
          <div className="settings-field">
            <label className="label">Model</label>
            <div className="model-display mono">claude-sonnet-4-5</div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Voice / TTS Configuration */}
      <section className="settings-section">
        <div className="settings-section-header">
          <h3 className="settings-section-title">Voice / TTS</h3>
          <p className="settings-section-desc">Switch between browser speech and Gemini AI voice for natural-sounding Hinglish.</p>
        </div>
        <div className="settings-fields">

          {/* Toggle */}
          <div className="settings-field">
            <label className="tts-toggle-row">
              <span className="tts-toggle-label">
                <Volume2 size={14} />
                Use Gemini TTS
              </span>
              <span className={`tts-toggle ${localUseGemini ? 'tts-toggle--on' : ''}`}
                    onClick={() => setLocalUseGemini(v => !v)}
                    role="switch"
                    aria-checked={localUseGemini}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setLocalUseGemini(v => !v) }}
              >
                <span className="tts-toggle-knob" />
              </span>
            </label>
            <p className="settings-hint" style={{ color: 'var(--text-muted)' }}>
              {localUseGemini
                ? 'Gemini 2.5 Flash TTS — natural multilingual voice via backend proxy.'
                : 'Browser SpeechSynthesis — works offline, robotic quality.'}
            </p>
          </div>

          {/* Gemini API Key (shown only when toggle is on) */}
          {localUseGemini && (
            <>
              <div className="settings-field">
                <label className="label">Gemini API Key</label>
                <div className="input-with-toggle">
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    className="input"
                    placeholder="AIza..."
                    value={localGeminiKey}
                    onChange={(e) => setLocalGeminiKey(e.target.value)}
                  />
                  <button
                    type="button"
                    className="key-toggle-btn"
                    onClick={() => setShowGeminiKey((v) => !v)}
                    tabIndex={-1}
                  >
                    {showGeminiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="settings-hint">
                  Key is sent to your backend proxy — never exposed in the browser.
                </p>
              </div>

              <div className="settings-field">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={handleTestTts}
                  disabled={ttsTestStatus === 'playing'}
                >
                  {ttsTestStatus === 'playing' ? (
                    <><Loader2 size={13} className="spin" /> Playing test&hellip;</>
                  ) : (
                    <><Volume2 size={13} /> Test Gemini Voice</>
                  )}
                </button>
                {ttsTestStatus === 'ok' && (
                  <div className="health-result health-ok">
                    <CheckCircle size={13} /> Voice played successfully
                  </div>
                )}
                {ttsTestStatus === 'fail' && (
                  <div className="health-result health-fail">
                    <XCircle size={13} /> TTS failed — check API key &amp; backend
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <div className="divider" />

      {/* CRM Agent */}
      <section className="settings-section">
        <div className="settings-section-header">
          <h3 className="settings-section-title">CRM Agent</h3>
          <p className="settings-section-desc">Configure the AI copilot agent behaviour and diagnostics.</p>
        </div>
        <div className="settings-fields">
          <div className="settings-field">
            <label className="tts-toggle-row">
              <span className="tts-toggle-label">
                <BarChart3 size={14} />
                Show Token Consumption
              </span>
              <span className={`tts-toggle ${localShowTokens ? 'tts-toggle--on' : ''}`}
                    onClick={() => setLocalShowTokens(v => !v)}
                    role="switch"
                    aria-checked={localShowTokens}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setLocalShowTokens(v => !v) }}
              >
                <span className="tts-toggle-knob" />
              </span>
            </label>
            <p className="settings-hint" style={{ color: 'var(--text-muted)' }}>
              {localShowTokens
                ? 'Token usage and estimated cost will appear below each agent response.'
                : 'Token consumption details are hidden.'}
            </p>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Backend Configuration */}
      <section className="settings-section">
        <div className="settings-section-header">
          <h3 className="settings-section-title">Backend Configuration</h3>
          <p className="settings-section-desc">Node.js backend for subscriber data and production API routing.</p>
        </div>
        <div className="settings-fields">
          <div className="settings-field">
            <label className="label">Backend URL</label>
            <div className="backend-row">
              <input
                type="text"
                className="input"
                placeholder="http://localhost:3001"
                value={localBackendUrl}
                onChange={(e) => setLocalBackendUrl(e.target.value)}
              />
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleTestConnection}
                disabled={testingHealth}
              >
                {testingHealth ? (
                  <><Loader2 size={13} className="spin" /> Testing...</>
                ) : (
                  'Test Connection'
                )}
              </button>
            </div>
            {healthStatus === 'ok' && (
              <div className="health-result health-ok">
                <CheckCircle size={13} /> Backend reachable
              </div>
            )}
            {healthStatus === 'fail' && (
              <div className="health-result health-fail">
                <XCircle size={13} /> Connection failed — backend not reachable
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Session */}
      <section className="settings-section">
        <div className="settings-section-header">
          <h3 className="settings-section-title">Session</h3>
          <p className="settings-section-desc">Clear in-progress call data without losing settings.</p>
        </div>
        <button className="btn btn-danger" onClick={handleResetSession}>
          <RotateCcw size={14} />
          Reset Session
        </button>
      </section>

      <div className="divider" />

      <div className="settings-save-row">
        <button className="btn btn-primary" onClick={handleSave}>
          Save Settings
        </button>
      </div>
    </div>
  )
}
