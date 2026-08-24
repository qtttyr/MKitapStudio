import { Moon, SunMedium, Settings } from 'lucide-react'

type Props = {
  dark: boolean
  onToggleTheme: () => void
  userName: string
  onOpenProfile: () => void
  onOpenSettings: () => void
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
  return parts.map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'
}

export function TopBar({ dark, onToggleTheme, userName, onOpenProfile, onOpenSettings }: Props) {
  return (
    <header className="topbar">
      <div className="brand-mark">
        mk<span>.</span>studio
      </div>

      <div className="top-actions">
        <button className="icon-btn" onClick={onToggleTheme} aria-label="Switch theme">
          {dark ? <SunMedium size={19} /> : <Moon size={19} />}
        </button>
        <button className="icon-btn" onClick={onOpenSettings} aria-label="Settings">
          <Settings size={19} />
        </button>
        <button className="profile-button" onClick={onOpenProfile} aria-label="Profile">
          {initials(userName)}
        </button>
      </div>
    </header>
  )
}
