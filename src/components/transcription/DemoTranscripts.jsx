import useAppStore from '../../store/useAppStore'
import demoTranscripts from '../../data/demoTranscripts'
import './DemoTranscripts.css'

// Extract VC from transcript text
function extractVcNo(text) {
  const match = text.match(/\b(\d{11})\b/)
  return match ? match[1] : ''
}

export default function DemoTranscripts() {
  const selectedDemoId = useAppStore((s) => s.selectedDemoId)
  const setSelectedDemoId = useAppStore((s) => s.setSelectedDemoId)
  const setTranscript = useAppStore((s) => s.setTranscript)
  const setVcNo = useAppStore((s) => s.setVcNo)
  const setIntentResult = useAppStore((s) => s.setIntentResult)

  const handleSelect = (demo) => {
    setSelectedDemoId(demo.id)
    setTranscript(demo.transcript)
    setIntentResult(null)
    const vc = extractVcNo(demo.transcript)
    if (vc) setVcNo(vc)
  }

  return (
    <div className="demo-list">
      {demoTranscripts.map((demo) => {
        const isSelected = selectedDemoId === demo.id
        return (
          <button
            key={demo.id}
            className={`demo-card ${isSelected ? 'demo-card--selected' : ''}`}
            onClick={() => handleSelect(demo)}
          >
            <div className="demo-card-header">
              <span className="demo-card-title">{demo.title}</span>
              <span className={`badge ${demo.tagClass}`}>{demo.tag}</span>
            </div>
            <p className="demo-card-scenario">{demo.scenario}</p>
          </button>
        )
      })}
    </div>
  )
}
