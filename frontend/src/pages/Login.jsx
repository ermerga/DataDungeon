import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../lib/auth'

const C = {
  deep:     '#001233',
  navy:     '#002855',
  twilight: '#33415C',
  muted:    '#979DAC',
  white:    '#FFFFFF',
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const canSubmit = email.trim() && password.trim()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    login()
    navigate('/app')
  }

  return (
    <div style={s.page}>

      {/* ── Left: image panel ── */}
      <div style={s.imagePanel}>
        <div style={s.imagePanelOverlay}>
          <button onClick={() => navigate('/')} style={s.backBtn}>← Back</button>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div style={s.formPanel}>
        <div style={s.formInner}>
          <h1 style={s.title}>Welcome back</h1>
          <p style={s.subtitle}>Sign in to run your simulation</p>

          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={s.input}
                autoFocus
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={s.input}
              />
            </div>

            {error && <div style={s.error}>{error}</div>}

            <button
              type="submit"
              disabled={!canSubmit}
              style={{ ...s.submitBtn, opacity: canSubmit ? 1 : 0.45 }}
            >
              Sign In →
            </button>
          </form>

          <p style={s.hint}>Demo — any email and password will work.</p>
        </div>
      </div>

    </div>
  )
}

const s = {
  page: {
    display: 'flex',
    height: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden'
  },

  // ── Left image panel
  imagePanel: {
    flex: 1,
    backgroundImage: 'url(/view-of-the-sea-iphone-wallpaper.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative'
  },
  imagePanelOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to bottom, rgba(0,18,51,0.6) 0%, rgba(0,18,51,0.3) 100%)',
    display: 'flex',
    flexDirection: 'column',
    padding: '32px 40px',
    justifyContent: 'flex-end'
  },
  backBtn: {
    position: 'absolute',
    top: 28,
    left: 40,
    background: 'none',
    border: 'none',
    color: C.white,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    opacity: 0.8
  },
  panelLogo: {
    height: 36,
    marginBottom: 16
  },
  panelTagline: {
    margin: 0,
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.5
  },

  // ── Right form panel
  formPanel: {
    width: 460,
    flexShrink: 0,
    background: C.deep,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 40px'
  },
  formInner: {
    width: '100%',
    maxWidth: 340
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: 28,
    fontWeight: 800,
    color: C.white,
    letterSpacing: '-0.02em'
  },
  subtitle: {
    margin: '0 0 36px 0',
    fontSize: 14,
    color: C.muted,
    lineHeight: 1.5
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: C.white,
    letterSpacing: '0.02em'
  },
  input: {
    padding: '12px 14px',
    fontSize: 15,
    border: `1px solid rgba(151,157,172,0.25)`,
    borderRadius: 8,
    outline: 'none',
    background: C.navy,
    color: C.white,
    boxSizing: 'border-box',
    width: '100%'
  },
  error: {
    background: 'rgba(220,38,38,0.15)',
    color: '#fca5a5',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
    border: '1px solid rgba(220,38,38,0.3)'
  },
  submitBtn: {
    marginTop: 4,
    padding: '14px',
    fontSize: 16,
    fontWeight: 700,
    color: C.deep,
    background: C.white,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    letterSpacing: '-0.01em'
  },
  hint: {
    marginTop: 24,
    fontSize: 12,
    color: C.muted,
    textAlign: 'center'
  }
}
