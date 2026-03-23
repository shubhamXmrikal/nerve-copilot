import { CheckCircle2, Loader2, Clock } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import './WorkflowStatusPanel.css'

function Step({ label, sublabel, status }) {
  return (
    <div className={`wf-step wf-step--${status}`}>
      <div className="wf-step-icon">
        {status === 'done'    && <CheckCircle2 size={16} />}
        {status === 'active'  && <Loader2 size={16} className="wf-spin" />}
        {status === 'pending' && <Clock size={16} />}
      </div>
      <div className="wf-step-body">
        <div className="wf-step-label">{label}</div>
        <div className="wf-step-sublabel">{sublabel}</div>
      </div>
      <div className="wf-step-tag">
        {status === 'done'    && <span className="wf-tag wf-tag--done">DONE</span>}
        {status === 'active'  && <span className="wf-tag wf-tag--active">RUNNING</span>}
        {status === 'pending' && <span className="wf-tag wf-tag--pending">PENDING</span>}
      </div>
    </div>
  )
}

export default function WorkflowStatusPanel() {
  const isClassifying = useAppStore((s) => s.isClassifying)
  const isLoadingSubs = useAppStore((s) => s.isLoadingSubscriber)
  const vcNo          = useAppStore((s) => s.vcNo)
  const subscriber    = useAppStore((s) => s.subscriber)
  const intentResult  = useAppStore((s) => s.intentResult)

  // Hide only once subscriber is fully loaded
  if (subscriber) return null

  // Derive per-step status
  const step1Status = vcNo ? 'done' : 'pending'
  const step2Status = isLoadingSubs ? 'active' : vcNo ? 'done' : 'pending'
  const step3Status = intentResult ? 'done' : isClassifying ? 'active' : 'pending'

  // Derive the headline
  const isIdle = !vcNo && !isLoadingSubs && !isClassifying

  const headline = isClassifying && isLoadingSubs
    ? 'Analyzing intent & fetching subscriber…'
    : isLoadingSubs
    ? 'Fetching subscriber from database…'
    : isClassifying
    ? 'Claude AI is analyzing the transcript…'
    : vcNo
    ? 'VC detected — processing…'
    : 'Waiting for call to start'

  return (
    <div className="wf-panel animate-in">

      {/* ── Header ── */}
      <div className="wf-header">
        <div className={`wf-header-pulse${isIdle ? ' wf-header-pulse--idle' : ''}`} />
        <span className="wf-header-title">
          {isIdle ? 'AWAITING CALL' : 'CALL PROCESSING'}
        </span>
      </div>

      {/* ── Headline ── */}
      <div className="wf-headline">{headline}</div>

      {isIdle && (
        <p className="wf-idle-hint">
          Select a scenario on the right and click <strong>Start</strong> to begin call playback.
          The system will automatically detect the customer's VC number, fetch their record, and
          analyze the call intent.
        </p>
      )}

      {/* ── Step pipeline ── */}
      <div className="wf-steps">
        <Step
          label="Transcript Capture"
          sublabel={vcNo ? `VC detected — ${vcNo}` : 'Waiting for VC number in conversation…'}
          status={step1Status}
        />
        <div className="wf-connector" />
        <Step
          label="Subscriber Lookup"
          sublabel={
            isLoadingSubs ? 'Querying SMSdth2003 database…' :
            vcNo          ? 'Record loaded successfully' :
                            'Will run as soon as VC is found'
          }
          status={step2Status}
        />
        <div className="wf-connector" />
        <Step
          label="Intent Analysis"
          sublabel={
            isClassifying ? 'Claude AI detecting intent, sentiment & churn risk…' :
            intentResult  ? 'Classification complete' :
                            'Will run after transcript finishes'
          }
          status={step3Status}
        />
      </div>

      {/* ── VC pill (only when detected) ── */}
      {vcNo && (
        <div className="wf-vc-row">
          <span className="wf-vc-label">DETECTED VC</span>
          <span className="wf-vc-value mono">{vcNo}</span>
        </div>
      )}
    </div>
  )
}
