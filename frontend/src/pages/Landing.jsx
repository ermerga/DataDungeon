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
  { num: '01', label: 'Draw your parcel on the map' },
  { num: '02', label: 'Enter project details' },
  { num: '03', label: 'Run the simulation' },
  { num: '04', label: 'Get your verdict — and a fix if you need one' }
]

const scenarios = [
  { name: 'Baseline',         modifier: '1.0×', desc: 'Historical average conditions' },
  { name: 'Moderate Drought', modifier: '0.79×', desc: 'CMIP6 SSP2-4.5 mid-century' },
  { name: 'Severe Drought',   modifier: '0.57×', desc: 'CMIP6 SSP5-8.5 prolonged drought' },
  { name: 'Reduced Snowpack', modifier: '0.71×', desc: '29% less snowpack, earlier runoff' }
]

export default function Landing() {
  const navigate = useNavigate()

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
          <div style={s.heroBadge}>Cache County, Utah · Water Viability Platform</div>
          <h1 style={s.heroTitle}>
            Know if your development<br />
            has enough water<br />
            before you build.
          </h1>
          <p style={s.heroSubtitle}>
            Thallo runs 1,000 climate simulations over 50 years to tell real estate
            developers whether Cache County can sustain their project. Get a PASS or FAIL
            verdict in seconds, and AI-powered recommendations if you need to adjust.
          </p>
          <div style={s.heroCtas}>
            <button onClick={() => navigate('/login')} style={s.primaryBtn}>Get Started →</button>
            <a href="#how-it-works" style={s.ghostBtn} className="link-hover">See how it works</a>
          </div>
        </div>

        {/* Hero image */}
        <div style={s.heroCards}>
          <img
            src="/woman-wades-in-ocean-at-sunset.jpg"
            alt="Water landscape"
            style={s.heroImage}
          />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" style={{ ...s.section, background: C.navy }}>
        <div style={s.sectionInner}>
          <h2 style={{ ...s.sectionTitle, color: C.white }}>How it works</h2>
          <p style={{ ...s.sectionSubtitle, color: C.muted }}>Four steps from parcel to verdict.</p>
          <div style={s.stepsGrid}>
            {steps.map((step) => (
              <div key={step.num} style={s.stepCard}>
                <div style={s.stepNum}>{step.num}</div>
                <div style={s.stepLabel}>{step.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ ...s.section, background: C.deep }}>
        <div style={s.sectionInner}>
          <h2 style={{ ...s.sectionTitle, color: C.white }}>Built for serious analysis</h2>
          <p style={{ ...s.sectionSubtitle, color: C.muted }}>
            Every figure sourced from USGS, Utah DWR, and CMIP6 climate projections.
          </p>
          <div style={s.featuresGrid}>
            {features.map((f) => (
              <div key={f.title} style={s.featureCard}>
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
          <h2 style={{ ...s.sectionTitle, color: C.white }}>Four climate scenarios, every run</h2>
          <p style={{ ...s.sectionSubtitle, color: C.muted }}>
            We test your project against each scenario so you know how it holds up
            under the full range of projected futures.
          </p>
          <div style={s.scenariosGrid}>
            {scenarios.map((sc) => (
              <div key={sc.name} style={s.scenarioCard}>
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
          <h2 style={{ ...s.sectionTitle, color: C.white, marginBottom: 16 }}>
            Ready to run your simulation?
          </h2>
          <p style={{ ...s.sectionSubtitle, color: C.muted, marginBottom: 36 }}>
            It takes under two minutes to draw your parcel and get a full 50-year verdict.
          </p>
          <button onClick={() => navigate('/login')} style={s.primaryBtn}>Get Started →</button>
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
    lineHeight: 1.4
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
