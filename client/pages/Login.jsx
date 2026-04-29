import { useState } from 'react';
import { usersAPI } from '../services/api';
import '../styles/login.css';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmed = username.trim();
    if (!trimmed) { setError('Please enter a username.'); return; }
    setLoading(true);
    try {
      const user = await usersAPI.createOrFind(trimmed);
      localStorage.setItem('user', JSON.stringify(user));
      onLoginSuccess(user);
    } catch (err) {
      setError(err.response?.data?.error || 'Connection failed. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-root">
      {/* Left branding panel */}
      <div className="lp-left">
        <div className="lp-left-inner">
          <div className="lp-illustration">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="none">
              <circle cx="100" cy="100" r="100" fill="#202c33"/>
              <circle cx="100" cy="100" r="72" fill="#111b21"/>
              {/* Phone body */}
              <rect x="70" y="55" width="60" height="90" rx="8" fill="#2a3942"/>
              <rect x="75" y="65" width="50" height="65" rx="4" fill="#0b141a"/>
              {/* Screen content */}
              <rect x="79" y="69" width="30" height="6" rx="3" fill="#202c33"/>
              <rect x="79" y="80" width="42" height="5" rx="2.5" fill="#005c4b"/>
              <rect x="79" y="89" width="25" height="5" rx="2.5" fill="#202c33"/>
              <rect x="95" y="98" width="26" height="5" rx="2.5" fill="#005c4b"/>
              <rect x="79" y="107" width="20" height="5" rx="2.5" fill="#202c33"/>
              {/* Home indicator */}
              <rect x="90" y="134" width="20" height="3" rx="1.5" fill="#2a3942"/>
              {/* WhatsApp icon small */}
              <circle cx="100" cy="168" r="14" fill="#00a884"/>
              <path d="M100 157c-6.07 0-11 4.93-11 11 0 1.94.51 3.76 1.4 5.33L89 179l5.83-1.35A10.94 10.94 0 00100 179c6.07 0 11-4.93 11-11s-4.93-11-11-11zm5.3 15.4l-.77.54c-.72.5-1.7.57-2.5.2-.87-.4-2.43-1.3-3.7-2.57-1.27-1.27-2.17-2.83-2.57-3.7-.37-.8-.3-1.78.2-2.5l.54-.77c.3-.43.88-.56 1.33-.3l1.53.87c.42.24.56.77.33 1.2l-.5.9c-.13.23-.1.52.07.72.47.53 1.57 1.7 2.13 2.13.2.17.49.2.72.07l.9-.5c.43-.23.96-.09 1.2.33l.87 1.53c.26.45.13 1.03-.3 1.33l.02.02z" fill="white"/>
            </svg>
          </div>
          <h1 className="lp-brand">WhatsApp<span>Web</span></h1>
          <p className="lp-tagline">Send and receive messages without keeping your phone online</p>
          <div className="lp-divider"/>
          <p className="lp-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="#8696a0"/></svg>
            End-to-end encrypted
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="lp-right">
        <div className="lp-form-card">
          <div className="lp-form-logo">
            <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 4C13 4 4 13 4 24c0 3.55.93 6.88 2.56 9.77L4 44l10.52-2.51A19.92 19.92 0 0024 44c11 0 20-9 20-20S35 4 24 4z" fill="#25d366"/>
              <path d="M34.12 29.02c-.49 1.38-2.44 2.53-3.46 2.69-.93.15-2.12.21-3.42-.22-.79-.26-1.8-.61-3.1-1.2-5.47-2.36-9.04-7.87-9.31-8.23-.27-.36-2.22-2.95-2.22-5.62 0-2.67 1.4-3.98 1.9-4.52.49-.54 1.07-.67 1.43-.67.36 0 .71.01 1.02.02.33.01.77-.13 1.2.92.45 1.07 1.53 3.73 1.67 4.0.13.27.22.58.04.93-.18.36-.27.58-.53.89-.27.31-.56.7-.8.94-.27.27-.54.56-.23 1.09.31.54 1.36 2.24 2.92 3.62 2 1.79 3.69 2.34 4.23 2.6.54.27.85.22 1.16-.13.31-.36 1.33-1.55 1.69-2.08.36-.54.71-.45 1.2-.27.49.18 3.11 1.47 3.64 1.74.54.27.9.4 1.03.62.13.22.13 1.25-.36 2.63z" fill="white"/>
            </svg>
          </div>

          <h2 className="lp-form-title">Sign in to WhatsApp Clone</h2>
          <p className="lp-form-sub">Enter a username to get started. If you're new, we'll create your account automatically.</p>

          <form onSubmit={handleSubmit} className="lp-form">
            <div className="lp-input-wrap">
              <svg className="lp-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" fill="#8696a0"/>
              </svg>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {error && (
              <p className="lp-error">{error}</p>
            )}

            <button type="submit" disabled={loading || !username.trim()} className="lp-btn">
              {loading
                ? <><span className="lp-spinner" /> Connecting…</>
                : 'Get Started →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
