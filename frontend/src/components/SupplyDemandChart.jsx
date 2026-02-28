import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Label,
} from 'recharts'

export default function SupplyDemandChart({ failureCurve }) {
  if (!failureCurve || failureCurve.length === 0) return null

  // Convert p_failure (0–1) to percentage for the chart
  const data = failureCurve.map(pt => ({
    year: pt.year,
    probability: parseFloat((pt.p_failure * 100).toFixed(1)),
  }))

  const endYear = data[data.length - 1].year

  return (
    <div style={styles.wrapper}>
      <h3 style={styles.title}>Failure Probability Over Time</h3>
      <p style={styles.sub}>
        Fraction of 1,000 simulations that experienced a water deficit by each year.
        Red dashed line marks the 15% pass/fail threshold.
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickCount={6}
          >
            <Label value="Year" offset={-10} position="insideBottom" style={{ fill: '#64748b', fontSize: 12 }} />
          </XAxis>
          <YAxis
            domain={[0, 100]}
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 12, fill: '#64748b' }}
            width={48}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, 'P(failure)']}
            labelFormatter={(year) => `Year ${year}`}
            contentStyle={{ fontSize: 13, borderRadius: 8 }}
          />
          {/* 15% threshold line */}
          <ReferenceLine
            y={15}
            stroke="#dc2626"
            strokeDasharray="5 4"
            strokeWidth={1.5}
            label={{ value: '15% threshold', position: 'insideTopRight', fill: '#dc2626', fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="probability"
            stroke="#002855"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

const styles = {
  wrapper: {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '20px 24px',
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: 16,
    fontWeight: 600,
    color: '#001233',
  },
  sub: {
    margin: '0 0 16px 0',
    fontSize: 13,
    color: '#64748b',
  },
}
