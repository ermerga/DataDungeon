const LEVER_LABELS = {
  unit_reduction_pct:  v => v > 0   ? `Reduce units by ${Math.round(v * 100)}%` : null,
  greywater_recycling: v => v        ? 'Add greywater recycling'                 : null,
  pipeline_added:      v => v        ? 'Add pipeline / water rights'             : null,
  build_delay_years:   v => v > 0   ? `Delay build by ${v} year${v > 1 ? 's' : ''}` : null,
}

export default function AgentCard({ recommendation }) {
  const { rank, levers, projected_verdict, projected_p_failure, explanation } = recommendation
  const isPass = projected_verdict === 'PASS'

  const activeLevers = Object.entries(LEVER_LABELS)
    .map(([key, fn]) => fn(levers[key]))
    .filter(Boolean)

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.rank}>Option {rank}</span>
        <span style={{
          ...styles.badge,
          background: isPass ? '#dcfce7' : '#fee2e2',
          color: isPass ? '#16a34a' : '#dc2626',
        }}>
          {projected_verdict} &middot; {(projected_p_failure * 100).toFixed(1)}%
        </span>
      </div>

      {activeLevers.length > 0 && (
        <div style={styles.levers}>
          {activeLevers.map((label, i) => (
            <span key={i} style={styles.leverTag}>{label}</span>
          ))}
        </div>
      )}

      <p style={styles.explanation}>{explanation}</p>
    </div>
  )
}

const styles = {
  card: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rank: {
    fontSize: 13,
    fontWeight: 700,
    color: '#001233',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    fontSize: 13,
    fontWeight: 700,
    padding: '3px 12px',
    borderRadius: 20,
  },
  levers: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  leverTag: {
    fontSize: 12,
    fontWeight: 500,
    color: '#002855',
    background: '#e0e7ff',
    padding: '3px 10px',
    borderRadius: 20,
  },
  explanation: {
    margin: 0,
    fontSize: 13,
    color: '#475569',
    lineHeight: 1.6,
  },
}
