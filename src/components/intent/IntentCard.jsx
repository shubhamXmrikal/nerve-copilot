import { Sparkles, Loader2 } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import './IntentCard.css'

const INTENT_CONFIG = {
  recharge_issue:   { label: 'Recharge Issue',   cls: 'badge-amber' },
  pack_rollback:    { label: 'Pack Rollback',     cls: 'badge-purple' },
  technical_issue:  { label: 'Technical Issue',   cls: 'badge-red' },
  upgrade_inquiry:  { label: 'Upgrade Inquiry',   cls: 'badge-green' },
  general_inquiry:  { label: 'General Inquiry',   cls: 'badge-blue' },
}

const CLASS_CONFIG = {
  billing:        { label: 'Billing',         cls: 'badge-amber' },
  pack_management:{ label: 'Pack Management', cls: 'badge-purple' },
  technical:      { label: 'Technical',       cls: 'badge-red' },
  sales:          { label: 'Sales',           cls: 'badge-green' },
  general:        { label: 'General',         cls: 'badge-blue' },
}

const SENTIMENT_CONFIG = {
  positive:   { label: 'Positive',   cls: 'badge-green' },
  neutral:    { label: 'Neutral',    cls: 'badge-gray' },
  frustrated: { label: 'Frustrated', cls: 'badge-amber' },
  angry:      { label: 'Angry',      cls: 'badge-red' },
}

const CHURN_CONFIG = {
  low:    { label: 'Low Churn Risk',    cls: 'badge-green' },
  medium: { label: 'Medium Churn Risk', cls: 'badge-amber' },
  high:   { label: 'High Churn Risk',   cls: 'badge-red' },
}

export default function IntentCard() {
  const intentResult       = useAppStore((s) => s.intentResult)
  const vcNo               = useAppStore((s) => s.vcNo)
  const isLoadingSubscriber = useAppStore((s) => s.isLoadingSubscriber)
  const fetchSubscriber    = useAppStore((s) => s.fetchSubscriber)
  const setVcNo            = useAppStore((s) => s.setVcNo)

  if (!intentResult) return null

  const intent    = INTENT_CONFIG[intentResult.intent]         || { label: intentResult.intent,          cls: 'badge-gray' }
  const cls       = CLASS_CONFIG[intentResult.classification]  || { label: intentResult.classification,  cls: 'badge-gray' }
  const sentiment = SENTIMENT_CONFIG[intentResult.sentiment]   || { label: intentResult.sentiment, cls: 'badge-gray' }
  const churn     = CHURN_CONFIG[intentResult.churnRisk]       || { label: intentResult.churnRisk,       cls: 'badge-gray' }
  const details   = intentResult.extractedDetails || {}

  const effectiveVc = details.vcNo || vcNo

  const handleFetchSubscriber = () => {
    if (!effectiveVc || isLoadingSubscriber) return
    if (details.vcNo && details.vcNo !== vcNo) setVcNo(details.vcNo)
    fetchSubscriber(effectiveVc)
  }

  return (
    <div className="card intent-card animate-in">
      {/* Header */}
      <div className="insights-header">
        <span className="insights-title">AI INSIGHTS</span>
        <Sparkles size={14} className="insights-icon" />
      </div>

      <div className="insights-body">
        {/* Horizontal intent pills */}
        <div className="insights-pills">
          <span className={`badge ${intent.cls}`}>{intent.label}</span>
          <span className={`badge ${cls.cls}`}>{cls.label}</span>
          <span className={`badge ${sentiment.cls}`}>{sentiment.label}</span>
          <span className={`badge ${churn.cls}`}>{churn.label}</span>
        </div>

        {/* Issue */}
        {details.issueDescription && (
          <div className="insights-detail-row">
            <span className="insights-detail-label">ISSUE:</span>
            <span className="insights-detail-text">{details.issueDescription}</span>
          </div>
        )}

        {/* Suggested action */}
        {details.suggestedAction && (
          <div className="insights-detail-row">
            <span className="insights-detail-label">ACTION:</span>
            <span className="insights-detail-text insights-detail-action">{details.suggestedAction}</span>
          </div>
        )}
      </div>
    </div>
  )
}
