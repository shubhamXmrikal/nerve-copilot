import { AlertCircle } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import './SubscriberCard.css'

function StatusBadge({ status }) {
  const map = {
    Active:    { cls: 'badge-green', dot: 'dot-green', label: 'ACTIVE' },
    Deactive:  { cls: 'badge-red',   dot: 'dot-red',   label: 'DEACTIVE' },
    SwitchOff: { cls: 'badge-amber', dot: 'dot-amber', label: 'SWITCH OFF' },
  }
  const cfg = map[status] || { cls: 'badge-gray', dot: 'dot-gray', label: status || 'Unknown' }
  return (
    <span className={`badge ${cfg.cls}`}>
      <span className={`status-dot ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function SkeletonStrip() {
  return (
    <div className="subscriber-strip subscriber-strip--loading">
      <div className="skeleton" style={{ width: 120, height: 22 }} />
      <div className="skeleton" style={{ width: 140, height: 14 }} />
      <div className="skeleton" style={{ width: 60, height: 20, borderRadius: 100 }} />
    </div>
  )
}

function formatDate(val) {
  if (!val) return null
  try {
    return new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return String(val) }
}

export default function SubscriberCard() {
  const subscriber = useAppStore((s) => s.subscriber)
  const isLoading  = useAppStore((s) => s.isLoadingSubscriber)
  const error      = useAppStore((s) => s.subscriberError)

  if (isLoading) return <SkeletonStrip />

  if (error) {
    return (
      <div className="subscriber-strip subscriber-strip--error animate-in">
        <AlertCircle size={14} color="var(--accent-danger)" />
        <span style={{ color: 'var(--accent-danger)', fontSize: 12 }}>{error}</span>
      </div>
    )
  }

  if (!subscriber) return null

  const s = subscriber
  const rechargeAmt = s.lastRechargeAmt ?? null

  return (
    <div className="subscriber-strip animate-in">
      {/* Left group: Name + VC + Status */}
      <div className="strip-identity">
        <div className="strip-name-line">
          <span className="strip-name">{s.name}</span>
          <StatusBadge status={s.status} />
        </div>
        <div className="strip-vc-line">
          <span className="strip-vc-label">VC NO:</span>
          <span className="strip-vc-value mono">{s.vcNo}</span>
          {s.stbModel && (
            <span className="strip-device">{s.stbModel}{s.stbBrand ? ` READY FOR ${s.stbBrand}` : ''}</span>
          )}
          {!s.stbModel && s.stbBrand && (
            <span className="strip-device">CAM MODULE READY FOR {s.stbBrand}</span>
          )}
        </div>
      </div>

      {/* Right group: Scheme + Recharge */}
      <div className="strip-meta">
        {s.schemeId && (
          <div className="strip-meta-item">
            <span className="strip-meta-label">SCHEME ID</span>
            <span className="strip-meta-value mono">{s.schemeId}</span>
          </div>
        )}
        {rechargeAmt && (
          <div className="strip-meta-item">
            <span className="strip-meta-label">LAST RECHARGE</span>
            <span className="strip-meta-value">
              <span className="strip-recharge-amt">₹{rechargeAmt}</span>
              {s.lastRechargeDate && (
                <span className="strip-recharge-date"> on {formatDate(s.lastRechargeDate)}</span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
