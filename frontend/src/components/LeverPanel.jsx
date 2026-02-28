export default function LeverPanel({ levers, onChange }) {
  const { unit_reduction_pct, greywater_recycling, pipeline_added, build_delay_years } = levers
  const pct = Math.round(unit_reduction_pct * 100)

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Adjust Your Project</h3>
      <p style={styles.sub}>Changes are re-simulated live across 1,000 scenarios.</p>

      {/* Unit reduction */}
      <div style={styles.lever}>
        <div style={styles.leverHeader}>
          <span style={styles.leverLabel}>Reduce Unit Count</span>
          <span style={styles.leverValue}>{pct === 0 ? 'No change' : `-${pct}% (${Math.round(1 - unit_reduction_pct * 100) / 100} fewer homes)`}</span>
        </div>
        <input
          type="range" min="0" max="50" step="5"
          value={pct}
          onChange={e => onChange({ ...levers, unit_reduction_pct: parseInt(e.target.value) / 100 })}
          style={styles.slider}
        />
        <div style={styles.sliderLabels}><span>0%</span><span>50% fewer homes</span></div>
      </div>

      {/* Build delay */}
      <div style={styles.lever}>
        <div style={styles.leverHeader}>
          <span style={styles.leverLabel}>Delay Build Phase</span>
          <span style={styles.leverValue}>{build_delay_years === 0 ? 'No delay' : `+${build_delay_years} year${build_delay_years > 1 ? 's' : ''}`}</span>
        </div>
        <input
          type="range" min="0" max="10" step="1"
          value={build_delay_years}
          onChange={e => onChange({ ...levers, build_delay_years: parseInt(e.target.value) })}
          style={styles.slider}
        />
        <div style={styles.sliderLabels}><span>No delay</span><span>10 years</span></div>
      </div>

      {/* Greywater toggle */}
      <div style={styles.lever}>
        <div style={styles.toggleRow}>
          <div>
            <div style={styles.leverLabel}>Greywater Recycling</div>
            <div style={styles.leverHint}>Reduces indoor municipal demand by 28%</div>
          </div>
          <button
            onClick={() => onChange({ ...levers, greywater_recycling: !greywater_recycling })}
            style={{ ...styles.toggle, background: greywater_recycling ? '#002855' : '#cbd5e1' }}
          >
            <span style={{ ...styles.knob, transform: greywater_recycling ? 'translateX(20px)' : 'translateX(2px)' }} />
          </button>
        </div>
      </div>

      {/* Pipeline toggle */}
      <div style={styles.lever}>
        <div style={styles.toggleRow}>
          <div>
            <div style={styles.leverLabel}>Add Pipeline / Water Rights</div>
            <div style={styles.leverHint}>Adds 500 acre-feet/year to supply allocation</div>
          </div>
          <button
            onClick={() => onChange({ ...levers, pipeline_added: !pipeline_added })}
            style={{ ...styles.toggle, background: pipeline_added ? '#002855' : '#cbd5e1' }}
          >
            <span style={{ ...styles.knob, transform: pipeline_added ? 'translateX(20px)' : 'translateX(2px)' }} />
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  card: {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: '#001233',
  },
  sub: {
    margin: '-12px 0 0 0',
    fontSize: 13,
    color: '#64748b',
  },
  lever: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  leverHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  leverLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1e293b',
  },
  leverValue: {
    fontSize: 13,
    color: '#002855',
    fontWeight: 500,
  },
  leverHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  slider: {
    width: '100%',
    accentColor: '#002855',
    cursor: 'pointer',
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    color: '#94a3b8',
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    flexShrink: 0,
    transition: 'background 0.2s',
    padding: 0,
  },
  knob: {
    position: 'absolute',
    top: 3,
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s',
    display: 'block',
  },
}
