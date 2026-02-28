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

export default function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const canSubmit = name.trim() && email.trim() && password.trim() && confirm.trim()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
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
        <div style={s.formInner} className="page-fade-in">
          <h1 style={s.title}>Create account</h1>
          <p style={s.subtitle}>Start running water viability simulations</p>

          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                style={s.input}
                autoFocus
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={s.input}
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

            <div style={s.field}>
              <label style={s.label}>Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                style={s.input}
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="btn-light"
              style={{ ...s.submitBtn, opacity: canSubmit ? 1 : 0.45 }}
            >
              Create Account →
            </button>
          </form>

          <p style={s.hint}>
            Already have an account?{' '}
            <span onClick={() => navigate('/login')} style={s.hintLink} className="hint-link">Sign in</span>
          </p>
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
  },
  hintLink: {
    color: C.white,
    cursor: 'pointer',
    fontWeight: 600
  }
}
