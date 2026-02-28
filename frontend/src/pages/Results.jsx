import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import VerdictBadge from '../components/VerdictBadge'
import SupplyDemandChart from '../components/SupplyDemandChart'
import LeverPanel from '../components/LeverPanel'
import AgentCard from '../components/AgentCard'

const POLL_INTERVAL_MS = 2000

const SCENARIO_LABELS = {
  baseline:         'Baseline (historical average)',
  moderate_drought: 'Moderate Drought (CMIP6 SSP2-4.5)',
  severe_drought:   'Severe Drought (CMIP6 SSP5-8.5)',
  reduced_snowpack: 'Reduced Snowpack (-29% snowpack)',
}

const DEFAULT_LEVERS = {
  unit_reduction_pct: 0.0,
  greywater_recycling: false,
  pipeline_added: false,
  build_delay_years: 0,
}

export default function Results() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Simulation polling
  const [status, setStatus]   = useState('running')
  const [results, setResults] = useState(null)
  const [project, setProject] = useState(null)
  const [error, setError]     = useState(null)
  const intervalRef = useRef(null)

  // What-if
  const [levers, setLevers]             = useState(DEFAULT_LEVERS)
  const leversInitialized               = useRef(false)
  const [whatIfResult, setWhatIfResult] = useState(null)
  const [whatIfLoading, setWhatIfLoading] = useState(false)

  // AI recommendations
  const [recommendations, setRecommendations] = useState(null)
  const [recsLoading, setRecsLoading]         = useState(false)
  const [recsError, setRecsError]             = useState(null)

  // Scroll-triggered fade-up (re-observe whenever results or recommendations render new elements)
  useEffect(() => {
    const els = document.querySelectorAll('.fade-up:not(.visible)')
    if (!els.length) return
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } }),
      { threshold: 0, rootMargin: '0px 0px -40px 0px' }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [results, recommendations])

  // Fetch project details for the header; seed levers from project's initial settings
  useEffect(() => {
    api.get(`/projects/${id}`)
      .then(res => {
        setProject(res.data)
        if (!leversInitialized.current) {
          leversInitialized.current = true
          setLevers(prev => ({
            ...prev,
            greywater_recycling: res.data.greywater_recycling,
            pipeline_added: res.data.pipeline_added,
          }))
        }
      })
      .catch(() => {})
  }, [id])

  // Poll for simulation results
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await api.get(`/projects/${id}/results`)
        const { status: s, results: r } = res.data
        setStatus(s)
        if (s === 'complete') {
          setResults(r)
          clearInterval(intervalRef.current)
        } else if (s === 'failed') {
          setError('The simulation encountered an error. Please try again.')
          clearInterval(intervalRef.current)
        }
      } catch {
        setError('Could not reach the backend. Is it running?')
        clearInterval(intervalRef.current)
      }
    }
    poll()
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(intervalRef.current)
  }, [id])

  // Debounced what-if re-simulation when levers change
  useEffect(() => {
    if (status !== 'complete') return

    const hasChanges =
      levers.unit_reduction_pct > 0 ||
      levers.greywater_recycling !== (project?.greywater_recycling ?? false) ||
      levers.pipeline_added !== (project?.pipeline_added ?? false) ||
      levers.build_delay_years > 0

    if (!hasChanges) {
      setWhatIfResult(null)
      return
    }

    setWhatIfLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await api.patch(`/projects/${id}/whatif`, levers)
        setWhatIfResult(res.data)
      } catch (err) {
        console.error('What-if error:', err)
      } finally {
        setWhatIfLoading(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [levers, status, id, project])

  const fetchRecommendations = async () => {
    setRecsLoading(true)
    setRecsError(null)
    try {
      const res = await api.post(`/projects/${id}/recommend`)
      setRecommendations(res.data)
    } catch (err) {
      setRecsError(err.response?.data?.detail || 'Failed to get recommendations.')
    } finally {
      setRecsLoading(false)
    }
  }

  // -------------------------------------------------------------------------
  // Loading / error screen
  // -------------------------------------------------------------------------

  if (status !== 'complete') {
    return (
      <div style={styles.loadingScreen}>
        {error ? (
          <div style={styles.loadingCard}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#dc2626', marginBottom: 12 }}>Something went wrong</div>
            <div style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>{error}</div>
            <button className="btn-outline" style={styles.backBtn} onClick={() => navigate('/app')}>Back to New Project</button>
          </div>
        ) : (
          <div style={styles.loadingCard}>
            <div style={styles.spinner} />
            <h2 style={styles.loadingTitle}>Running Simulation</h2>
            <p style={styles.loadingText}>Running 1,000 climate scenarios over 50 years...</p>
            <p style={styles.loadingText}>This usually takes a few seconds.</p>
          </div>
        )}
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Results
  // -------------------------------------------------------------------------

  const {
    verdict,
    p_failure_by_end_year,
    simulation_end_year,
    first_failure_year,
    median_deficit_acre_feet,
    failure_curve,
    scenario_results,
  } = results

  const isFail = verdict === 'FAIL'

  // Use what-if results for the live verdict/stats if levers are active
  const displayed = whatIfResult || results
  const isLive    = !!whatIfResult

  return (
    <div style={styles.page}>
      <div style={styles.content}>

        {/* Header */}
        <div style={styles.header} className="fade-up">
          <button className="btn-outline" style={styles.backBtn} onClick={() => navigate('/app')}><span style={{ position: 'relative', top: '-2px', marginRight: '3px' }}>←</span>New Project</button>
          {project && (
            <div style={styles.projectMeta}>
              <span style={styles.projectName}>{project.project_name}</span>
              <span style={styles.projectSub}>
                {project.unit_count.toLocaleString()} units · Build {project.build_year}
                {project.greywater_recycling && ' · Greywater'}
                {project.pipeline_added && ' · Pipeline'}
              </span>
            </div>
          )}
        </div>

        {/* Verdict — updates live when levers change */}
        {isLive && (
          <div style={styles.liveTag}>
            {whatIfLoading ? 'Recalculating...' : 'Live what-if result'}
          </div>
        )}
        <div className="fade-up"><VerdictBadge verdict={displayed.verdict} /></div>

        {/* Stats row */}
        <div style={styles.statsRow} className="fade-up">
          <StatCard
            label={`Chance of Water Shortage by ${displayed.simulation_end_year}`}
            value={`${(displayed.p_failure_by_end_year * 100).toFixed(1)}%`}
            sub={`${Math.round(displayed.p_failure_by_end_year * 1000)} of 1,000 simulated futures ran short  ·  15% = pass threshold`}
            highlight={displayed.verdict === 'FAIL'}
          />
          <StatCard
            label="First Failure Year"
            value={displayed.first_failure_year ?? 'None'}
            sub={displayed.first_failure_year ? 'median across failed runs' : 'no failures detected'}
          />
          <StatCard
            label="Median Deficit"
            value={displayed.median_deficit_acre_feet
              ? `${displayed.median_deficit_acre_feet.toLocaleString()} AF/yr`
              : 'None'}
            sub={displayed.median_deficit_acre_feet ? 'acre-feet per year' : 'no deficit recorded'}
          />
        </div>

        {/* Chart — updates live */}
        <div className="fade-up">
          <SupplyDemandChart failureCurve={displayed.failure_curve} />
        </div>

        {/* Scenario results — updates live when levers change */}
        <div style={styles.card} className="fade-up">
          <h3 style={styles.sectionTitle}>Fixed Climate Scenarios</h3>
          <div style={styles.scenarioGrid}>
            {Object.entries(SCENARIO_LABELS).map(([key, label]) => {
              const r = (displayed.scenario_results || scenario_results)[key]
              const pass = r === 'PASS'
              return (
                <div key={key} style={styles.scenarioRow}>
                  <span style={styles.scenarioLabel}>{label}</span>
                  <span style={{
                    ...styles.scenarioBadge,
                    background: pass ? '#dcfce7' : '#fee2e2',
                    color: pass ? '#16a34a' : '#dc2626',
                  }}>{r}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* What-If section                                                     */}
        {/* ------------------------------------------------------------------ */}

        <div style={styles.divider} className="fade-up">
          <div style={styles.dividerLine} />
          <span style={styles.dividerLabel}>What-If Scenarios</span>
          <div style={styles.dividerLine} />
        </div>

        <div className="fade-up"><LeverPanel levers={levers} onChange={setLevers} /></div>

        {/* AI Recommendations */}
        {isFail && (
          <div style={styles.card} className="fade-up">
            <div style={styles.recsHeader}>
              <div>
                <h3 style={styles.sectionTitle}>AI Recommendations</h3>
                <p style={styles.sectionSub}>
                  Claude will suggest lever combinations and verify each one with the real simulation.
                </p>
              </div>
              {!recommendations && (
                <button
                  onClick={fetchRecommendations}
                  disabled={recsLoading}
                  style={{ ...styles.recsBtn, opacity: recsLoading ? 0.75 : 1, display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {recsLoading && (
                    <span style={{
                      width: 14, height: 14, borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.35)',
                      borderTopColor: '#ffffff',
                      animation: 'spin 0.7s linear infinite',
                      flexShrink: 0,
                    }} />
                  )}
                  {recsLoading ? 'Analyzing...' : 'Get Recommendations'}
                </button>
              )}
            </div>

            {recsError && <div style={styles.recsError}>{recsError}</div>}

            {recommendations && (
              <div style={styles.recsList}>
                {recommendations.unfixable && (
                  <div style={styles.unfixableBox}>
                    <strong>No fix found:</strong> {recommendations.unfixable_reason}
                  </div>
                )}
                {recommendations.recommendations.map(rec => (
                  <AgentCard key={rec.rank} recommendation={rec} />
                ))}
                <button
                  onClick={() => { setRecommendations(null) }}
                  style={styles.refreshBtn}
                >
                  Refresh Recommendations
                </button>
              </div>
            )}
          </div>
        )}

        {/* Download report */}
        <div style={styles.actions} className="fade-up">
          <a
            href={(() => {
              const base = `http://localhost:8000/projects/${id}/report`
              if (!whatIfResult) return base
              const p = new URLSearchParams({
                unit_reduction_pct: levers.unit_reduction_pct,
                greywater_recycling: levers.greywater_recycling,
                pipeline_added: levers.pipeline_added,
                build_delay_years: levers.build_delay_years,
              })
              return `${base}?${p}`
            })()}
            target="_blank"
            rel="noreferrer"
            style={styles.reportBtn}
          >
            Download Report (PDF)
          </a>
        </div>

      </div>
    </div>
  )
}

function StatCard({ label, value, sub, highlight }) {
  return (
    <div style={{
      ...styles.statCard,
      border: highlight ? '1px solid #fca5a5' : '1px solid #e2e8f0',
      background: highlight ? '#fff5f5' : 'white',
    }}>
      <div style={styles.statLabel}>{label}</div>
      <div style={{ ...styles.statValue, color: highlight ? '#dc2626' : '#001233' }}>{value}</div>
      <div style={styles.statSub}>{sub}</div>
    </div>
  )
}

// -------------------------------------------------------------------------
// Styles
// -------------------------------------------------------------------------

const styles = {
  loadingScreen: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#eef2f7',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loadingCard: {
    background: 'white', borderRadius: 16, padding: '48px 64px',
    textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: 400,
  },
  spinner: {
    width: 48, height: 48,
    border: '4px solid #e2e8f0', borderTop: '4px solid #002855',
    borderRadius: '50%', animation: 'spin 0.9s linear infinite',
    margin: '0 auto 24px auto',
  },
  loadingTitle: { margin: '0 0 12px 0', fontSize: 22, fontWeight: 700, color: '#001233' },
  loadingText:  { margin: '4px 0', color: '#64748b', fontSize: 14 },

  page: {
    minHeight: '100vh', background: '#eef2f7', padding: '32px 24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  content: { maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 },

  header: { display: 'flex', alignItems: 'center', gap: 20 },
  backBtn: {
    padding: '8px 16px', fontSize: 14, fontWeight: 500,
    color: '#002855', background: 'white', border: '1px solid #002855',
    borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap', textDecoration: 'none',
  },
  projectMeta:  { display: 'flex', flexDirection: 'column', gap: 2 },
  projectName:  { fontSize: 20, fontWeight: 700, color: '#001233' },
  projectSub:   { fontSize: 13, color: '#64748b' },

  liveTag: {
    fontSize: 12, fontWeight: 600, color: '#002855',
    background: '#eff6ff', border: '1px solid #bfdbfe',
    borderRadius: 6, padding: '4px 10px', alignSelf: 'flex-start',
  },

  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 },
  statCard:  { borderRadius: 12, padding: '16px 20px' },
  statLabel: { fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: 700, lineHeight: 1, marginBottom: 4 },
  statSub:   { fontSize: 12, color: '#94a3b8' },

  card: { background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 24px' },
  sectionTitle: { margin: '0 0 4px 0', fontSize: 16, fontWeight: 600, color: '#001233' },
  sectionSub:   { margin: 0, fontSize: 13, color: '#64748b' },

  scenarioGrid: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 },
  scenarioRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#eef2f7', borderRadius: 8 },
  scenarioLabel: { fontSize: 14, color: '#334155' },
  scenarioBadge: { fontSize: 13, fontWeight: 700, padding: '3px 12px', borderRadius: 20, letterSpacing: 0.5 },

  divider: { display: 'flex', alignItems: 'center', gap: 12 },
  dividerLine:  { flex: 1, height: 1, background: '#e2e8f0' },
  dividerLabel: { fontSize: 13, fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap' },

  recsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  recsBtn: {
    padding: '10px 20px', fontSize: 14, fontWeight: 600,
    color: 'white', background: '#002855', border: 'none',
    borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
  },
  recsError: {
    marginTop: 12, padding: '10px 14px', background: '#fee2e2',
    color: '#dc2626', borderRadius: 8, fontSize: 13,
  },
  recsList:    { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 },
  unfixableBox: {
    padding: '12px 16px', background: '#fef3c7', color: '#92400e',
    borderRadius: 8, fontSize: 13, border: '1px solid #fde68a',
  },
  refreshBtn: {
    alignSelf: 'flex-start', padding: '8px 16px', fontSize: 13,
    color: '#64748b', background: 'white', border: '1px solid #e2e8f0',
    borderRadius: 8, cursor: 'pointer',
  },

  actions:   { paddingBottom: 32 },
  reportBtn: {
    padding: '12px 24px', fontSize: 15, fontWeight: 600,
    color: 'white', background: '#001233', border: 'none',
    borderRadius: 8, cursor: 'pointer', textDecoration: 'none', display: 'inline-block',
  },
}
