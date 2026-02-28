import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ParcelMap from '../components/ParcelMap'
import api from '../lib/api'

const TOTAL_STEPS = 5

export default function NewProject() {
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [parcel, setParcel] = useState(null)
  const [projectName, setProjectName] = useState('')
  const [unitCount, setUnitCount] = useState('')
  const [buildYear, setBuildYear] = useState('2028')
  const [pipelineAdded, setPipelineAdded] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const nameRef = useRef(null)
  const unitRef = useRef(null)

  // Autofocus the input when a new step becomes active
  useEffect(() => {
    if (step === 1) nameRef.current?.focus()
    if (step === 2) unitRef.current?.focus()
  }, [step])

  const handleSubmit = async (greywaterRecycling) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const { data: project } = await api.post('/projects', {
        project_name: projectName,
        unit_count: parseInt(unitCount),
        build_year: parseInt(buildYear),
        parcel_geojson: parcel
      })
      await api.post(`/projects/${project.id}/simulate`)
      // Pass initial lever values to results page so WhatIf can pre-populate them
      navigate(`/projects/${project.id}/results`, {
        state: { pipelineAdded, greywaterRecycling }
      })
    } catch (err) {
      console.error('Submit error:', err)
      setError(err.response?.data?.detail || 'Failed to create project. Is the backend running?')
      setIsSubmitting(false)
    }
  }

  const handleGreywater = (value) => {
    handleSubmit(value)
  }

  const handlePipeline = (value) => {
    setPipelineAdded(value)
    setStep(5)
  }

  return (
    <div style={s.container}>
      {/* Map — always fills remaining space */}
      <div style={s.mapWrap}>
        <ParcelMap onParcelDrawn={setParcel} />

        {/* Continue button floats over the map at step 0, appears once parcel is ready */}
        {step === 0 && parcel && (
          <button
            onClick={() => setStep(1)}
            style={s.continueBtn}
          >
            Continue →
          </button>
        )}
      </div>

      {/* Slide-out panel */}
      <div style={{ ...s.panel, width: step >= 1 ? 380 : 0 }}>
        <div style={s.panelInner}>

          {/* Step indicator */}
          <div style={s.stepIndicator}>Step {step} of {TOTAL_STEPS}</div>

          {/* Back link for steps 2 and 3 */}
          {step >= 2 && step <= 3 && (
            <button onClick={() => setStep(step - 1)} style={s.backBtn}>
              ← Back
            </button>
          )}

          {/* ── Step 1: Project Name ── */}
          {step === 1 && (
            <div style={s.stepContent}>
              <h2 style={s.stepTitle}>What's the project name?</h2>
              <input
                ref={nameRef}
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && projectName.trim() && setStep(2)}
                placeholder="e.g. Riverside Estates"
                style={s.input}
              />
              <button
                onClick={() => setStep(2)}
                disabled={!projectName.trim()}
                style={{ ...s.nextBtn, opacity: projectName.trim() ? 1 : 0.4 }}
              >
                Next →
              </button>
            </div>
          )}

          {/* ── Step 2: Number of Homes ── */}
          {step === 2 && (
            <div style={s.stepContent}>
              <h2 style={s.stepTitle}>How many homes?</h2>
              <input
                ref={unitRef}
                type="number"
                value={unitCount}
                onChange={(e) => setUnitCount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && unitCount > 0 && setStep(3)}
                placeholder="e.g. 500"
                min="1"
                max="10000"
                style={s.input}
              />
              <button
                onClick={() => setStep(3)}
                disabled={!unitCount || parseInt(unitCount) < 1}
                style={{ ...s.nextBtn, opacity: unitCount && parseInt(unitCount) >= 1 ? 1 : 0.4 }}
              >
                Next →
              </button>
            </div>
          )}

          {/* ── Step 3: Build Year ── */}
          {step === 3 && (
            <div style={s.stepContent}>
              <h2 style={s.stepTitle}>When will you break ground?</h2>
              <select
                value={buildYear}
                onChange={(e) => setBuildYear(e.target.value)}
                style={s.input}
              >
                {Array.from({ length: 15 }, (_, i) => 2025 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <button
                onClick={() => setStep(4)}
                style={s.nextBtn}
              >
                Next →
              </button>
            </div>
          )}

          {/* ── Step 4: Pipeline ── */}
          {step === 4 && (
            <div style={s.stepContent}>
              <h2 style={s.stepTitle}>Are you planning to add a water pipeline?</h2>
              <p style={s.stepSubtitle}>A pipeline adds dedicated supply capacity to your development.</p>
              <div style={s.yesNoRow}>
                <button onClick={() => handlePipeline(true)} style={s.yesBtn}>Yes</button>
                <button onClick={() => handlePipeline(false)} style={s.noBtn}>No</button>
              </div>
            </div>
          )}

          {/* ── Step 5: Greywater ── */}
          {step === 5 && (
            <div style={s.stepContent}>
              <h2 style={s.stepTitle}>Planning greywater recycling?</h2>
              <p style={s.stepSubtitle}>Greywater systems reduce indoor municipal demand by about 28%.</p>
              {error && <div style={s.error}>{error}</div>}
              <div style={s.yesNoRow}>
                <button
                  onClick={() => !isSubmitting && handleGreywater(true)}
                  disabled={isSubmitting}
                  style={{ ...s.yesBtn, opacity: isSubmitting ? 0.5 : 1 }}
                >
                  {isSubmitting ? '...' : 'Yes'}
                </button>
                <button
                  onClick={() => !isSubmitting && handleGreywater(false)}
                  disabled={isSubmitting}
                  style={{ ...s.noBtn, opacity: isSubmitting ? 0.5 : 1 }}
                >
                  {isSubmitting ? '...' : 'No'}
                </button>
              </div>
              {isSubmitting && (
                <p style={s.submittingText}>Running simulation…</p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

const s = {
  container: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  mapWrap: {
    flex: 1,
    minWidth: 0,
    position: 'relative'
  },
  continueBtn: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    background: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(37,99,235,0.4)',
    zIndex: 10
  },
  panel: {
    flexShrink: 0,
    background: '#f8fafc',
    borderLeft: '1px solid #e2e8f0',
    overflow: 'hidden',
    transition: 'width 0.35s ease',
    display: 'flex',
    flexDirection: 'column'
  },
  panelInner: {
    width: 380,
    padding: '36px 32px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    boxSizing: 'border-box'
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 24
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: 14,
    cursor: 'pointer',
    padding: 0,
    marginBottom: 16,
    alignSelf: 'flex-start'
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    flex: 1
  },
  stepTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: '#0f172a',
    lineHeight: 1.3
  },
  stepSubtitle: {
    margin: 0,
    fontSize: 14,
    color: '#64748b',
    lineHeight: 1.5
  },
  input: {
    padding: '13px 14px',
    fontSize: 16,
    border: '1px solid #d1d5db',
    borderRadius: 8,
    outline: 'none',
    background: 'white',
    width: '100%',
    boxSizing: 'border-box'
  },
  nextBtn: {
    padding: '14px 24px',
    fontSize: 16,
    fontWeight: 600,
    color: 'white',
    background: '#2563eb',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'opacity 0.15s'
  },
  yesNoRow: {
    display: 'flex',
    gap: 12,
    marginTop: 8
  },
  yesBtn: {
    flex: 1,
    padding: '18px',
    fontSize: 18,
    fontWeight: 600,
    color: 'white',
    background: '#16a34a',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer'
  },
  noBtn: {
    flex: 1,
    padding: '18px',
    fontSize: 18,
    fontWeight: 600,
    color: 'white',
    background: '#64748b',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer'
  },
  error: {
    background: '#fef2f2',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: 8,
    fontSize: 14
  },
  submittingText: {
    margin: 0,
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center'
  }
}
