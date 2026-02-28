import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Palette ──────────────────────────────────────────────
const C = {
  deep:     '#001233',   // darkest — page bg, nav, footer
  navy:     '#002855',   // primary dark sections
  twilight: '#33415C',   // cards, inputs, elevated surfaces
  muted:    '#979DAC',   // secondary text, borders
  white:    '#FFFFFF',   // primary text, highlights
}

const features = [
  {
    icon: '🗺️',
    title: 'Draw Your Parcel',
    desc: 'Drop points on a satellite map to define your development site. Drag to refine.'
  },
  {
    icon: '💧',
    title: '50-Year Water Simulation',
    desc: '1,000 Monte Carlo runs across four climate scenarios — baseline, moderate drought, severe drought, and reduced snowpack.'
  },
  {
    icon: '✅',
    title: 'Clear PASS / FAIL Verdict',
    desc: 'Know your probability of water deficit by 2074 before you break ground, not after.'
  },
  {
    icon: '🤖',
    title: 'AI Recommendations',
    desc: 'If you fail, Claude analyzes your results and tells you exactly which levers to pull — fewer units, greywater recycling, a pipeline, or a delayed build.'
  }
]

const steps = [
  { num: '01', label: 'Draw your parcel on the map', desc: 'Click points on a satellite view of Cache County to outline your development site. Drag markers to refine the boundary.' },
  { num: '02', label: 'Enter project details', desc: 'Tell us how many homes you\'re planning, your target build year, and whether you\'re adding a pipeline or greywater system.' },
  { num: '03', label: 'Run the simulation', desc: '1,000 Monte Carlo runs stress-test your project across four climate scenarios — from historical baseline to severe drought.' },
  { num: '04', label: 'Get your verdict — and a fix if you need one', desc: 'Receive a clear PASS or FAIL with deficit probability by 2074. If you fail, AI pinpoints exactly which levers to adjust.' }
]

const scenarios = [
  { name: 'Baseline',         modifier: '1.0×', desc: 'Historical average conditions' },
  { name: 'Moderate Drought', modifier: '0.79×', desc: 'CMIP6 SSP2-4.5 mid-century' },
  { name: 'Severe Drought',   modifier: '0.57×', desc: 'CMIP6 SSP5-8.5 prolonged drought' },
  { name: 'Reduced Snowpack', modifier: '0.71×', desc: '29% less snowpack, earlier runoff' }
]

export default function Landing() {
  const navigate = useNavigate()

  useEffect(() => {
    const els = document.querySelectorAll('.fade-up')
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          obs.unobserve(e.target)
        }
      }),
      { threshold: 0, rootMargin: '0px 0px -50px 0px' }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <div style={s.page}>

      {/* ── Nav ── */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <img src="/image.png" alt="Thallo" style={s.logo} />
          <div style={s.navBtns}>
            <button onClick={() => navigate('/login')} style={s.navBtn}>Sign In</button>
            <button onClick={() => navigate('/signup')} style={s.navBtnPrimary} className="btn-light">Sign Up</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={s.heroSection}>
        <div style={s.heroContent}>
          <div style={s.heroBadge} className="hero-badge">Cache County, Utah · Water Viability Platform</div>
          <h1 style={s.heroTitle} className="hero-title">
            Know if your development<br />
            has enough water<br />
            before you build.
          </h1>
          <p style={s.heroSubtitle} className="hero-subtitle">
            Thallo runs 1,000 climate simulations over 50 years to tell real estate
            developers whether Cache County can sustain their project. Get a PASS or FAIL
            verdict in seconds, and AI-powered recommendations if you need to adjust.
          </p>
          <div style={s.heroCtas} className="hero-ctas">
            <button onClick={() => navigate('/signup')} style={s.primaryBtn}>Get Started →</button>
            <a
              href="#how-it-works"
              style={s.ghostBtn}
              className="link-hover"
              onClick={(e) => {
                e.preventDefault()
                const target = document.getElementById('how-it-works')
                if (!target) return
                const start = window.scrollY
                const end = target.getBoundingClientRect().top + start
                const duration = 700
                const startTime = performance.now()
                const ease = (t) => t < 0.5 ? 2*t*t : -1+(4-2*t)*t
                const step = (now) => {
                  const elapsed = now - startTime
                  const progress = Math.min(elapsed / duration, 1)
                  window.scrollTo(0, start + (end - start) * ease(progress))
                  if (progress < 1) requestAnimationFrame(step)
                }
                requestAnimationFrame(step)
              }}
            >See how it works</a>
          </div>
        </div>

        {/* Hero image */}
        <div style={s.heroCards}>
          <img
            src="/woman-wades-in-ocean-at-sunset.jpg"
            alt="Water landscape"
            style={s.heroImage}
            className="hero-image-enter"
          />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" style={{ ...s.section, background: C.navy }}>
        <div style={s.sectionInner}>
          <h2 style={{ ...s.sectionTitle, color: C.white }} className="fade-up">How it works</h2>
          <p style={{ ...s.sectionSubtitle, color: C.muted }} className="fade-up">Four steps from parcel to verdict.</p>
          <div style={s.stepsGrid}>
            {steps.map((step, i) => (
              <div key={step.num} style={{ ...s.stepCard, transitionDelay: `${i * 0.08}s` }} className="fade-up">
                <div style={s.stepNum}>{step.num}</div>
                <div style={s.stepLabel}>{step.label}</div>
                <div style={s.stepDesc}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ ...s.section, background: C.deep }}>
        <div style={s.sectionInner}>
          <h2 style={{ ...s.sectionTitle, color: C.white }} className="fade-up">Built for serious analysis</h2>
          <p style={{ ...s.sectionSubtitle, color: C.muted }} className="fade-up">
            Every figure sourced from USGS, Utah DWR, and CMIP6 climate projections.
          </p>
          <div style={s.featuresGrid}>
            {features.map((f, i) => (
              <div key={f.title} style={{ ...s.featureCard, transitionDelay: `${i * 0.08}s` }} className="fade-up">
                <div style={s.featureIcon}>{f.icon}</div>
                <h3 style={s.featureTitle}>{f.title}</h3>
                <p style={s.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Climate Scenarios ── */}
      <section style={{ ...s.section, background: C.navy }}>
        <div style={s.sectionInner}>
          <h2 style={{ ...s.sectionTitle, color: C.white }} className="fade-up">Four climate scenarios, every run</h2>
          <p style={{ ...s.sectionSubtitle, color: C.muted }} className="fade-up">
            We test your project against each scenario so you know how it holds up
            under the full range of projected futures.
          </p>
          <div style={s.scenariosGrid}>
            {scenarios.map((sc, i) => (
              <div key={sc.name} style={{ ...s.scenarioCard, transitionDelay: `${i * 0.08}s` }} className="fade-up">
                <div style={s.scenarioModifier}>{sc.modifier}</div>
                <div style={s.scenarioName}>{sc.name}</div>
                <div style={s.scenarioDesc}>{sc.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ ...s.section, background: C.deep, textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ ...s.sectionTitle, color: C.white, marginBottom: 16 }} className="fade-up">
            Ready to run your simulation?
          </h2>
          <p style={{ ...s.sectionSubtitle, color: C.muted, marginBottom: 36 }} className="fade-up">
            It takes under two minutes to draw your parcel and get a full 50-year verdict.
          </p>
          <button onClick={() => navigate('/signup')} style={s.primaryBtn} className="fade-up">Get Started →</button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <span style={s.footerLogoText}>Thallo</span>
          <span style={s.footerMeta}>USU Sandbox Hackathon 2026 · Cache County, Utah</span>
        </div>
      </footer>

    </div>
  )
}

const s = {
  page: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: C.white,
    background: C.deep,
    minHeight: '100vh'
  },

  // ── Nav
  nav: {
    position: 'sticky',
    top: 0,
    background: C.deep,
    borderBottom: `1px solid rgba(151,157,172,0.15)`,
    zIndex: 100
  },
  navInner: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 32px',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  logo: {
    height: 40,
    display: 'block',
  },
  navBtns: {
    display: 'flex',
    gap: 8,
    alignItems: 'center'
  },
  navBtn: {
    background: 'none',
    border: `1px solid rgba(151,157,172,0.4)`,
    padding: '8px 20px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    color: C.white,
    cursor: 'pointer'
  },
  navBtnPrimary: {
    background: C.white,
    border: 'none',
    padding: '8px 20px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    color: C.deep,
    cursor: 'pointer'
  },

  // ── Hero
  heroSection: {
    background: C.deep,
    padding: '36px 32px 72px',
    display: 'flex',
    justifyContent: 'flex-start',
    gap: 72,
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    maxWidth: 1100,
    margin: '0 auto'
  },
  heroContent: {
    flex: 1,
    maxWidth: 560
  },
  heroBadge: {
    display: 'inline-block',
    background: C.twilight,
    color: C.muted,
    fontSize: 12,
    fontWeight: 600,
    padding: '6px 14px',
    borderRadius: 20,
    marginBottom: 28,
    letterSpacing: '0.04em',
    textTransform: 'uppercase'
  },
  heroTitle: {
    margin: '0 0 24px 0',
    fontSize: 48,
    fontWeight: 800,
    lineHeight: 1.18,
    letterSpacing: '-0.03em',
    color: C.white
  },
  heroSubtitle: {
    margin: '0 0 40px 0',
    fontSize: 17,
    lineHeight: 1.7,
    color: C.muted
  },
  heroCtas: {
    display: 'flex',
    gap: 20,
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  primaryBtn: {
    background: C.twilight,
    color: C.white,
    border: 'none',
    padding: '14px 28px',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '-0.01em'
  },
  ghostBtn: {
    color: C.muted,
    fontSize: 15,
    fontWeight: 500,
    textDecoration: 'none'
  },
  heroCards: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column'
  },
  heroImage: {
    width: 420,
    maxWidth: '100%',
    height: 500,
    borderRadius: 16,
    objectFit: 'cover',
    objectPosition: 'bottom',
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
    display: 'block'
  },

  // ── Shared section
  section: {
    padding: '80px 32px'
  },
  sectionInner: {
    maxWidth: 1100,
    margin: '0 auto'
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: 36,
    fontWeight: 800,
    letterSpacing: '-0.02em'
  },
  sectionSubtitle: {
    margin: '0 0 48px 0',
    fontSize: 17,
    lineHeight: 1.6
  },

  // ── Steps
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 20
  },
  stepCard: {
    padding: '28px 24px',
    background: C.twilight,
    border: `1px solid rgba(151,157,172,0.15)`,
    borderRadius: 12
  },
  stepNum: {
    fontSize: 36,
    fontWeight: 800,
    color: C.white,
    opacity: 0.2,
    marginBottom: 12,
    letterSpacing: '-0.04em'
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: 600,
    color: C.white,
    lineHeight: 1.4,
    marginBottom: 10
  },
  stepDesc: {
    fontSize: 13,
    color: C.muted,
    lineHeight: 1.6
  },

  // ── Features
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 24
  },
  featureCard: {
    padding: '28px 24px',
    background: C.navy,
    borderRadius: 12,
    border: `1px solid rgba(151,157,172,0.15)`
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 16
  },
  featureTitle: {
    margin: '0 0 10px 0',
    fontSize: 17,
    fontWeight: 700,
    color: C.white
  },
  featureDesc: {
    margin: 0,
    fontSize: 14,
    color: C.muted,
    lineHeight: 1.65
  },

  // ── Scenarios
  scenariosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 20
  },
  scenarioCard: {
    padding: '24px',
    background: C.twilight,
    borderRadius: 12,
    border: `1px solid rgba(151,157,172,0.15)`
  },
  scenarioModifier: {
    fontSize: 32,
    fontWeight: 800,
    color: C.white,
    letterSpacing: '-0.03em',
    marginBottom: 10
  },
  scenarioName: {
    fontSize: 15,
    fontWeight: 700,
    color: C.white,
    marginBottom: 6
  },
  scenarioDesc: {
    fontSize: 13,
    color: C.muted,
    lineHeight: 1.5
  },

  // ── Footer
  footer: {
    background: C.navy,
    borderTop: `1px solid rgba(151,157,172,0.15)`,
    padding: '24px 32px'
  },
  footerInner: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8
  },
  footerLogoText: {
    fontSize: 16,
    fontWeight: 800,
    color: C.white,
    letterSpacing: '-0.03em',
  },
  footerMeta: {
    fontSize: 13,
    color: C.muted
  }
}
