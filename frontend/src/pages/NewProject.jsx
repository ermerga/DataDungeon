import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ParcelMap from '../components/ParcelMap'
import api from '../lib/api'

export default function NewProject() {
  const navigate = useNavigate()
  
  const [parcel, setParcel] = useState(null)
  const [projectName, setProjectName] = useState('')
  const [unitCount, setUnitCount] = useState('')
  const [buildYear, setBuildYear] = useState('2028')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const canSubmit = parcel && projectName && unitCount && buildYear && !isSubmitting

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return

    setIsSubmitting(true)
    setError(null)

    try {
      // POST /projects
      const projectRes = await api.post('/projects', {
        name: projectName,
        parcel_geojson: parcel,
        unit_count: parseInt(unitCount),
        build_year: parseInt(buildYear)
      })

      const projectId = projectRes.data.id

      // POST /projects/{id}/simulate
      await api.post(`/projects/${projectId}/simulate`)

      // Navigate to results page
      navigate(`/projects/${projectId}/results`)
    } catch (err) {
      console.error('Submit error:', err)
      setError(err.response?.data?.detail || 'Failed to create project. Is the backend running?')
      setIsSubmitting(false)
    }
  }

  return (
    <div style={styles.container}>
      {/* Left side - Map */}
      <div style={styles.mapSection}>
        <ParcelMap onParcelDrawn={setParcel} />
      </div>

      {/* Right side - Form */}
      <div style={styles.formSection}>
        <div style={styles.formCard}>
          <h1 style={styles.title}>New Development</h1>
          <p style={styles.subtitle}>
            Draw your parcel on the map and enter project details
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Parcel status */}
            <div style={styles.parcelStatus}>
              {parcel ? (
                <div style={styles.parcelOk}>
                  ✓ Parcel drawn ({parcel.coordinates[0].length - 1} points)
                </div>
              ) : (
                <div style={styles.parcelPending}>
                  ← Click on the map to draw your parcel
                </div>
              )}
            </div>

            {/* Project name */}
            <div style={styles.field}>
              <label style={styles.label}>Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Riverside Estates"
                style={styles.input}
              />
            </div>

            {/* Unit count */}
            <div style={styles.field}>
              <label style={styles.label}>Number of Homes</label>
              <input
                type="number"
                value={unitCount}
                onChange={(e) => setUnitCount(e.target.value)}
                placeholder="e.g. 500"
                min="1"
                max="10000"
                style={styles.input}
              />
            </div>

            {/* Build year */}
            <div style={styles.field}>
              <label style={styles.label}>Build Year</label>
              <select
                value={buildYear}
                onChange={(e) => setBuildYear(e.target.value)}
                style={styles.input}
              >
                {Array.from({ length: 15 }, (_, i) => 2025 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Error display */}
            {error && (
              <div style={styles.error}>{error}</div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                ...styles.submitButton,
                opacity: canSubmit ? 1 : 0.5,
                cursor: canSubmit ? 'pointer' : 'not-allowed'
              }}
            >
              {isSubmitting ? 'Running Simulation...' : 'Run Simulation'}
            </button>
          </form>

          {/* Info box */}
          <div style={styles.infoBox}>
            <strong>What happens next?</strong>
            <p style={{ margin: '8px 0 0 0', opacity: 0.85 }}>
              We'll run 1,000 climate simulations over 50 years to determine if 
              Cache County has enough water for your development.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  mapSection: {
    flex: 1,
    minWidth: 0
  },
  formSection: {
    width: 400,
    background: '#f8fafc',
    borderLeft: '1px solid #e2e8f0',
    overflowY: 'auto'
  },
  formCard: {
    padding: 32
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: '#0f172a'
  },
  subtitle: {
    margin: '8px 0 24px 0',
    color: '#64748b',
    fontSize: 15
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20
  },
  parcelStatus: {
    padding: '12px 16px',
    borderRadius: 8,
    fontSize: 14
  },
  parcelOk: {
    background: '#dcfce7',
    color: '#166534',
    padding: '12px 16px',
    borderRadius: 8,
    fontWeight: 500
  },
  parcelPending: {
    background: '#fef3c7',
    color: '#92400e',
    padding: '12px 16px',
    borderRadius: 8
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: '#374151'
  },
  input: {
    padding: '12px 14px',
    fontSize: 16,
    border: '1px solid #d1d5db',
    borderRadius: 8,
    outline: 'none',
    transition: 'border-color 0.15s',
    ':focus': {
      borderColor: '#3b82f6'
    }
  },
  error: {
    background: '#fef2f2',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: 8,
    fontSize: 14
  },
  submitButton: {
    marginTop: 8,
    padding: '14px 24px',
    fontSize: 16,
    fontWeight: 600,
    color: 'white',
    background: '#2563eb',
    border: 'none',
    borderRadius: 8,
    transition: 'background 0.15s'
  },
  infoBox: {
    marginTop: 32,
    padding: 20,
    background: '#eff6ff',
    borderRadius: 8,
    fontSize: 14,
    color: '#1e40af'
  }
}