import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import VerdictBadge from '../components/VerdictBadge'
import SupplyDemandChart from '../components/SupplyDemandChart'

const POLL_INTERVAL_MS = 2000

const SCENARIO_LABELS = {
  baseline:         'Baseline (historical average)',
  moderate_drought: 'Moderate Drought (CMIP6 SSP2-4.5)',
  severe_drought:   'Severe Drought (CMIP6 SSP5-8.5)',
  reduced_snowpack: 'Reduced Snowpack (-29% snowpack)',
}

export default function Results() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [status, setStatus]   = useState('running')  // pending | running | complete | failed
  const [results, setResults] = useState(null)
  const [project, setProject] = useState(null)
  const [error, setError]     = useState(null)

  const intervalRef = useRef(null)

  // Fetch project details for the header
  useEffect(() => {
    api.get(`/projects/${id}`)
      .then(res => setProject(res.data))
      .catch(() => {}) // non-critical — page still works without it
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
      } catch (err) {
        setError('Could not reach the backend. Is it running?')
        clearInterval(intervalRef.current)
      }
    }

    poll() // run immediately on mount
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(intervalRef.current)
  }, [id])

  // -------------------------------------------------------------------------
  // Loading screen
  // -------------------------------------------------------------------------

  if (status !== 'complete') {
    return (
      <div style={styles.loadingScreen}>
        {error ? (
          <div style={styles.errorBox}>
            <div style={styles.errorTitle}>Something went wrong</div>
            <div style={styles.errorText}>{error}</div>
            <button style={styles.backBtn} onClick={() => navigate('/app')}>
              Back to New Project
            </button>
          </div>
        ) : (
          <div style={styles.loadingCard}>
            <div style={styles.spinner} />
            <h2 style={styles.loadingTitle}>Running Simulation</h2>
            <p style={styles.loadingText}>
              Running 1,000 climate scenarios over 50 years...
            </p>
            <p style={styles.loadingText}>This usually takes a few seconds.</p>
          </div>
        )}
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Results screen
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

  return (
    <div style={styles.page}>
      <div style={styles.content}>

        {/* Header */}
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate('/app')}>
            ← New Project
          </button>
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

        {/* Verdict */}
        <VerdictBadge verdict={verdict} />

        {/* Stats row */}
        <div style={styles.statsRow}>
          <StatCard
            label={`P(Failure by ${simulation_end_year})`}
            value={`${(p_failure_by_end_year * 100).toFixed(1)}%`}
            sub="15% = pass threshold"
            highlight={isFail}
          />
          <StatCard
            label="First Failure Year"
            value={first_failure_year ?? 'None'}
            sub={first_failure_year ? 'median across failed runs' : 'no failures detected'}
          />
          <StatCard
            label="Median Deficit"
            value={median_deficit_acre_feet ? `${median_deficit_acre_feet.toLocaleString()} AF/yr` : 'None'}
            sub={median_deficit_acre_feet ? 'acre-feet per year' : 'no deficit recorded'}
          />
        </div>

        {/* Failure curve chart */}
        <SupplyDemandChart failureCurve={failure_curve} />

        {/* Scenario results */}
        <div style={styles.scenarioCard}>
          <h3 style={styles.sectionTitle}>Fixed Climate Scenarios</h3>
          <div style={styles.scenarioGrid}>
            {Object.entries(SCENARIO_LABELS).map(([key, label]) => {
              const r = scenario_results[key]
              const pass = r === 'PASS'
              return (
                <div key={key} style={styles.scenarioRow}>
                  <span style={styles.scenarioLabel}>{label}</span>
                  <span style={{
                    ...styles.scenarioBadge,
                    background: pass ? '#dcfce7' : '#fee2e2',
                    color: pass ? '#16a34a' : '#dc2626',
                  }}>
                    {r}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div style={styles.actions}>
          <a
            href={`http://localhost:8000/projects/${id}/report`}
            target="_blank"
            rel="noreferrer"
            style={styles.reportBtn}
          >
            Download Report (PDF)
          </a>
          {isFail && (
            <button
              style={styles.whatifBtn}
              onClick={() => navigate(`/projects/${id}/whatif`)}
            >
              Explore What-If Scenarios →
            </button>
          )}
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
      <div style={{
        ...styles.statValue,
        color: highlight ? '#dc2626' : '#001233',
      }}>
        {value}
      </div>
      <div style={styles.statSub}>{sub}</div>
    </div>
  )
}

// -------------------------------------------------------------------------
// Styles
// -------------------------------------------------------------------------

const styles = {
  // Loading
  loadingScreen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loadingCard: {
    background: 'white',
    borderRadius: 16,
    padding: '48px 64px',
    textAlign: 'center',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    maxWidth: 400,
  },
  spinner: {
    width: 48,
    height: 48,
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #002855',
    borderRadius: '50%',
    animation: 'spin 0.9s linear infinite',
    margin: '0 auto 24px auto',
  },
  loadingTitle: {
    margin: '0 0 12px 0',
    fontSize: 22,
    fontWeight: 700,
    color: '#001233',
  },
  loadingText: {
    margin: '4px 0',
    color: '#64748b',
    fontSize: 14,
  },
  errorBox: {
    background: 'white',
    borderRadius: 16,
    padding: '48px 64px',
    textAlign: 'center',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    maxWidth: 400,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#dc2626',
    marginBottom: 12,
  },
  errorText: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 24,
  },
  // Results page
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '32px 24px',
  },
  content: {
    maxWidth: 860,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
  },
  backBtn: {
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 500,
    color: '#002855',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
  },
  projectMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  projectName: {
    fontSize: 20,
    fontWeight: 700,
    color: '#001233',
  },
  projectSub: {
    fontSize: 13,
    color: '#64748b',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
  },
  statCard: {
    borderRadius: 12,
    padding: '16px 20px',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1,
    marginBottom: 4,
  },
  statSub: {
    fontSize: 12,
    color: '#94a3b8',
  },
  scenarioCard: {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '20px 24px',
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: 16,
    fontWeight: 600,
    color: '#001233',
  },
  scenarioGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  scenarioRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    background: '#f8fafc',
    borderRadius: 8,
  },
  scenarioLabel: {
    fontSize: 14,
    color: '#334155',
  },
  scenarioBadge: {
    fontSize: 13,
    fontWeight: 700,
    padding: '3px 12px',
    borderRadius: 20,
    letterSpacing: 0.5,
  },
  actions: {
    display: 'flex',
    gap: 12,
    paddingBottom: 32,
  },
  reportBtn: {
    padding: '12px 24px',
    fontSize: 15,
    fontWeight: 600,
    color: '#002855',
    background: 'white',
    border: '1px solid #002855',
    borderRadius: 8,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  },
  whatifBtn: {
    padding: '12px 24px',
    fontSize: 15,
    fontWeight: 600,
    color: 'white',
    background: '#002855',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
}
