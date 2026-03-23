import { useEffect, useState } from 'react'
import { Sparkles, ChevronRight } from 'lucide-react'
import useAppStore from '../../store/useAppStore'

const DEFAULT_BACKEND = 'http://localhost:3001'

export default function WatchoPlansCard() {
  const intentResult = useAppStore((s) => s.intentResult)
  const backendUrl   = useAppStore((s) => s.backendUrl)

  const [plans,     setPlans]     = useState([])
  const [tab,       setTab]       = useState('monthly')   // 'monthly' | 'annual'
  const [selected,  setSelected]  = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const isWatcho = intentResult?.intent === 'watcho_inquiry'

  useEffect(() => {
    if (!isWatcho) return

    const fetchPlans = async () => {
      setLoading(true)
      try {
        const base = (backendUrl || DEFAULT_BACKEND).replace(/\/$/, '')
        const res  = await fetch(`${base}/api/watcho-plans`)
        if (!res.ok) throw new Error(`API ${res.status}`)
        const data = await res.json()
        setPlans(Array.isArray(data) ? data : [])
      } catch {
        setPlans([])
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [isWatcho, backendUrl])

  // Gate — after all hooks
  if (!isWatcho) return null

  const filtered = plans.filter((p) =>
    tab === 'monthly' ? p.packdurationflag === 1 : p.packdurationflag === 2
  )

  const handleConfirm = () => {
    if (!selected) return
    setConfirmed(true)
  }

  return (
    <div className="ai-assist-panel animate-in">
      {/* Header */}
      <div className="ai-assist-header">
        <div className="ai-assist-title">
          <Sparkles size={16} />
          <span>AI Assist</span>
        </div>
        <div className="ai-assist-progress">
          <span className="ai-assist-step mono">WATCHO OTT PLANS</span>
          <div className="ai-assist-bar">
            <div className="ai-assist-bar-fill" style={{ width: '50%' }} />
          </div>
        </div>
      </div>

      {/* Guidance text */}
      <div className="ai-assist-guidance">
        Customer is asking about Watcho OTT plans. Select a plan to present and confirm with the customer.
      </div>

      {/* Body */}
      <div className="ai-assist-body">
        {confirmed ? (
          <div className="upgrade-confirmed">
            <div className="confirmed-icon">✓</div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{selected.PackName}</div>
            <div className="confirmed-sub">
              Plan details shared with customer
            </div>
          </div>
        ) : loading ? (
          <div className="upgrade-loading">Fetching Watcho plans…</div>
        ) : (
          <>
            {/* Monthly / Annual toggle */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 10 }}>
              {['monthly', 'annual'].map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setSelected(null) }}
                  style={{
                    flex: 1,
                    padding: '5px 0',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    border: '1px solid var(--border)',
                    background: tab === t ? 'var(--accent)' : 'var(--surface)',
                    color: tab === t ? '#fff' : 'var(--text-muted)',
                    borderRadius: t === 'monthly' ? '4px 0 0 4px' : '0 4px 4px 0',
                  }}
                >
                  {t === 'monthly' ? 'Monthly' : 'Annual'}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="upgrade-loading">No plans available.</div>
            ) : (
              <div className="plan-options-list">
                {filtered.map((plan) => {
                  const isSelected = selected?.PackId === plan.PackId
                  return (
                    <div
                      key={plan.PackId}
                      className={[
                        'plan-option-row',
                        isSelected ? 'plan-option-row--selected' : '',
                      ].join(' ').trim()}
                      onClick={() => setSelected(plan)}
                    >
                      <div className="plan-option-left">
                        <div className="plan-option-radio">
                          {isSelected ? '◉' : '○'}
                        </div>
                        <div className="plan-option-details">
                          <div className="plan-option-name">{plan.PackName}</div>
                          <div className="plan-option-meta">
                            {plan.NumOfApps} APPS
                          </div>
                          {plan.AppDetails && (
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                              {plan.AppDetails}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="plan-option-right">
                        <span className="plan-option-price mono">
                          ₹{plan.Price}
                          <span className="plan-option-period">
                            {plan.packdurationflag === 2 ? '/yr' : '/mo'}
                          </span>
                        </span>
                        <span className="plan-option-tax">EXCL. TAX</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <button
              className={`plan-confirm-btn${!selected ? ' disabled' : ''}`}
              onClick={handleConfirm}
              disabled={!selected}
            >
              {selected ? (
                <>CONFIRM — {selected.PackName.toUpperCase()} <ChevronRight size={16} /></>
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
