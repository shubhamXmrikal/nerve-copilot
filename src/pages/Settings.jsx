import SettingsForm from '../components/settings/SettingsForm'
import './Settings.css'

export default function Settings() {
  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <h2 className="settings-page-title">Settings</h2>
        <p className="settings-page-desc">Configure your agent profile, AI credentials, and backend connection.</p>
      </div>
      <SettingsForm />
    </div>
  )
}
