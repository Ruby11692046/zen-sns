import { useState, useEffect } from 'react';
import { Monitor, Moon, Sun, LogOut } from 'lucide-react';
import './Settings.css';

const THEME_OPTIONS = [
  { id: 'system', label: 'システム設定に従う', icon: Monitor },
  { id: 'light', label: 'ライトモード', icon: Sun },
  { id: 'dark', label: 'ダークモード', icon: Moon },
];

export default function Settings({ onLogout }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('zen-theme') || 'system';
  });

  useEffect(() => {
    localStorage.setItem('zen-theme', theme);
    const root = document.documentElement;

    const applyTheme = (t) => {
      if (t === 'dark') {
        root.setAttribute('data-theme', 'dark');
      } else if (t === 'light') {
        root.setAttribute('data-theme', 'light');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.setAttribute('data-theme', 'dark');
        } else {
          root.setAttribute('data-theme', 'light');
        }
      }
    };

    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        if (e.matches) {
          root.setAttribute('data-theme', 'dark');
        } else {
          root.setAttribute('data-theme', 'light');
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [theme]);

  return (
    <div className="settings" id="settings-screen">
      {/* Header */}
      <header className="page-header">
        <h1 className="page-header__title">設定</h1>
      </header>

      <div className="settings__content">
        {/* Theme */}
        <section className="settings__section">
          <h2 className="settings__section-title">テーマ設定</h2>
          <div className="settings__theme-options">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  className={`settings__theme-option ${theme === opt.id ? 'active' : ''}`}
                  onClick={() => setTheme(opt.id)}
                  id={`settings-theme-${opt.id}`}
                >
                  <Icon size={20} />
                  <span>{opt.label}</span>
                  <div className={`settings__radio ${theme === opt.id ? 'active' : ''}`} />
                </button>
              );
            })}
          </div>
        </section>

        {/* Logout */}
        <section className="settings__section">
          <button
            className="settings__logout-btn"
            onClick={onLogout}
            id="settings-logout"
          >
            <LogOut size={20} />
            <span>ログアウト</span>
          </button>
        </section>
      </div>
    </div>
  );
}
