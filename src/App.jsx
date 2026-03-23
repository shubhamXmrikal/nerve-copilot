import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CheckCircle, XCircle, Info } from 'lucide-react'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import useAppStore from './store/useAppStore'

function ToastList() {
  const toasts = useAppStore((s) => s.toasts)

  const iconMap = {
    success: <CheckCircle size={14} />,
    error:   <XCircle size={14} />,
    info:    <Info size={14} />,
  }

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {iconMap[t.type]}
          {t.message}
        </div>
      ))}
    </div>
  )
}

function StatusBar() {
  const agentName = useAppStore((s) => s.agentName)

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <span className="status-bar-live">
          <span className="status-bar-dot" />
          LIVE INDICATOR
        </span>
        <span className="status-bar-sys">SYSTEM OK</span>
      </div>
      <div className="status-bar-right">
        <span className="status-bar-agent">
          AGENT: <strong>{agentName || 'SHUBHAM KUSHMAHA'}</strong>
        </span>
        <span className="status-bar-version">NERVE V2.4</span>
        <span className="status-bar-agent">AGENT: RAHUL S.</span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <div className="main-area">
          <TopBar />
          <div className="page-content">
            <Routes>
              <Route path="/"         element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
          <StatusBar />
        </div>
      </div>
      <ToastList />
    </BrowserRouter>
  )
}
