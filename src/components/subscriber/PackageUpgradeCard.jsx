import { useEffect, useState } from 'react'
import { Sparkles, ChevronRight } from 'lucide-react'
import useAppStore from '../../store/useAppStore'

const DEFAULT_BACKEND = 'http://localhost:3001'

const MOCK_UPGRADE_OPTIONS = [
  { upgradePkgId: 31975, upgradePlanName: 'Classic Telugu SD',    price: 399, channels: 142, tier: 'BASE PACK',        highlight: false },
  { upgradePkgId: 32057, upgradePlanName: 'Swagat Marathi',       price: 449, channels: 158, tier: 'REGIONAL SPECIAL',  highlight: false },
  { upgradePkgId: 32222, upgradePlanName: 'Premiere Malayalam SD', price: 499, channels: 175, tier: 'PREMIUM',          highlight: false },
  { upgradePkgId: 31974, upgradePlanName: 'Classic Tamil SD',      price: 399, channels: 140, tier: 'BASE PACK',        highlight: false },
  { upgradePkgId: 32054, upgradePlanName: 'Bharat Combo',          price: 599, channels: 210, tier: 'HD + SPORTS INCLUDED', highlight: true, bestValue: true },
]

export default function PackageUpgradeCard() {
  const intentResult = useAppStore((s) => s.intentResult)
  const subscriber   = useAppStore((s) => s.subscriber)
  const backendUrl   = useAppStore((s) => s.backendUrl)

  const [options,   setOptions]   = useState([])
  const [selected,  setSelected]  = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const isUpgrade = intentResult?.intent === 'upgrade_inquiry'

  useEffect(() => {
    if (!isUpgrade) return

    const fetchUpgradeOptions = async () => {
      setLoading(true)
      try {
        const vcNo = subscriber?.vcNo   // camelCase from mapSubscriber
        if (!vcNo) { setOptions(MOCK_UPGRADE_OPTIONS); return }

        const base = (backendUrl || DEFAULT_BACKEND).replace(/\/$/, '')
        const res  = await fetch(`${base}/api/subscriber/${encodeURIComponent(vcNo)}/upgrade-options`)
        if (!res.ok) throw new Error(`API ${res.status}`)
        const data = await res.json()
        setOptions(Array.isArray(data) && data.length ? data : MOCK_UPGRADE_OPTIONS)
      } catch {
        setOptions(MOCK_UPGRADE_OPTIONS)
      } finally {
        setLoading(false)
      }
    }

    fetchUpgradeOptions()
  }, [subscriber?.vcNo, isUpgrade, backendUrl])

  // Gate — after all hooks
  if (!isUpgrade) return null

  const handleConfirm = () => {
    if (!selected) return
    setConfirmed(true)
  }

  const totalSteps = 4
  const currentStep = 2
  const progressPercent = (currentStep / totalSteps) * 100

  return (
    <div className="ai-assist-panel animate-in">
      {/* Header */}
      <div className="ai-assist-header">
        <div className="ai-assist-title">
          <Sparkles size={16} />
          <span>AI Assist</span>
        </div>
        <div className="ai-assist-progress">
          <span className="ai-assist-step mono">
            STEP {currentStep} OF {totalSteps}: PACK SELECTION
          </span>
          <div className="ai-assist-bar">
            <div className="ai-assist-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Guidance text */}
      <div className="ai-assist-guidance">
        Guided Workflow: The customer requested more HD content. Based on their usage patterns and Marathi region preference, these high-value packs are recommended.
      </div>

      {/* Body */}
      <div className="ai-assist-body">
        {confirmed ? (
          <div className="upgrade-confirmed">
            <div className="confirmed-icon">✓</div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{selected.upgradePlanName}</div>
            <div className="confirmed-sub">
              Ticket TKT-{Math.floor(Math.random() * 900000) + 100000} raised
            </div>
          </div>
        ) : loading ? (
          <div className="upgrade-loading">Fetching available plans…</div>
        ) : (
          <>
            <div className="plan-options-list">
              {options.map((opt) => (
                <div
                  key={opt.upgradePkgId}
                  className={[
                    'plan-option-row',
                    selected?.upgradePkgId === opt.upgradePkgId ? 'plan-option-row--selected' : '',
                  ].join(' ').trim()}
                  onClick={() => setSelected(opt)}
                >
                  <div className="plan-option-left">
                    <div className="plan-option-radio">
                      {selected?.upgradePkgId === opt.upgradePkgId ? '◉' : '○'}
                    </div>
                    <div className="plan-option-details">
                      <div className="plan-option-name">
                        {opt.upgradePlanName}
                        {opt.bestValue && (
                          <span className="plan-best-value-tag">BEST VALUE</span>
                        )}
                      </div>
                      <div className="plan-option-meta">
                        {opt.channels} CHANNELS | {opt.tier || 'STANDARD'}
                      </div>
                    </div>
                  </div>
                  <div className="plan-option-right">
                    <span className="plan-option-price mono">₹{opt.price}<span className="plan-option-period">/mo</span></span>
                    <span className="plan-option-tax">EXCL. TAX</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              className={`plan-confirm-btn${!selected ? ' disabled' : ''}`}
              onClick={handleConfirm}
              disabled={!selected}
            >
              {selected ? (
                <>CONFIRM — {selected.upgradePlanName.toUpperCase()} <ChevronRight size={16} /></>
              ) : (
                'Select a plan to continue'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
