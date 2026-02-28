export default function VerdictBadge({ verdict }) {
  const isPass = verdict === 'PASS'

  return (
    <div style={{
      ...styles.badge,
      background: isPass ? '#dcfce7' : '#fee2e2',
      border: `2px solid ${isPass ? '#16a34a' : '#dc2626'}`,
    }}>
      <span style={{
        ...styles.icon,
        color: isPass ? '#16a34a' : '#dc2626',
      }}>
        {isPass ? '✓' : '✗'}
      </span>
      <div>
        <div style={{
          ...styles.label,
          color: isPass ? '#16a34a' : '#dc2626',
        }}>
          {verdict}
        </div>
        <div style={styles.sub}>
          {isPass
            ? 'This project meets the 50-year water viability standard.'
            : 'This project exceeds the acceptable water deficit risk threshold.'}
        </div>
      </div>
    </div>
  )
}

const styles = {
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    padding: '20px 28px',
    borderRadius: 12,
  },
  icon: {
    fontSize: 48,
    fontWeight: 700,
    lineHeight: 1,
  },
  label: {
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: 2,
  },
  sub: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
}
