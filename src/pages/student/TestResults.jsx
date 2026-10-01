import React, { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { trackEvent } from '../../lib/analytics.js'
import { downloadReport } from '../../lib/reportDownload.js'
import { ArrowLeft, CheckCircle, Clock, Target, XCircle } from 'lucide-react'

function StatCard({ label, value, color = 'var(--text-primary)' }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

export default function TestResults() {
  const { testId } = useParams()
  const navigate = useNavigate()
  const { user, results, tests } = useApp()

  const result = results.find(r => r.testId === testId && r.studentId === user?.id)
  const test = tests.find(t => t.id === testId)
  const viewedResult = useRef(null)

  useEffect(() => {
    if (!result || viewedResult.current === result.id) return
    trackEvent('report_viewed', { quiz_id: testId, report_type: 'individual', user_role: 'student' })
    viewedResult.current = result.id
  }, [result, testId])

  if (!result) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: 520, margin: '0 auto', padding: 40 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Result not available</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
            Submit the test first to view your analysis.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/student/my-tests')}>
            Back to My Tests
          </button>
        </div>
      </div>
    )
  }

  const subjectEntries = Object.entries(result.subjectBreakdown || {})
  const topicEntries = Object.entries(result.topicBreakdown || {})

  return (
    <div style={{ padding: 40 }} className="animate-fade-in-up">
      <button className="btn btn-ghost" style={{ marginBottom: 24 }} onClick={() => navigate('/student/my-tests')}>
        <ArrowLeft size={14} /> Back to My Tests
      </button>

      <button className="btn btn-primary" style={{ marginLeft: 12, marginBottom: 24 }} onClick={() => {
        downloadReport(result)
        trackEvent('report_downloaded', { quiz_id: testId, report_type: 'individual', file_format: 'csv' })
      }}>
        Download Report (CSV)
      </button>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, marginBottom: 8 }}>
          {test?.title || result.testName}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Submitted on {new Date(result.submittedAt).toLocaleString('en-IN')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Score" value={`${result.score}/${result.totalMarks}`} color="var(--accent-primary)" />
        <StatCard label="Percentage" value={`${result.percentage}%`} color={result.percentage >= 70 ? 'var(--accent-green)' : result.percentage >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)'} />
        <StatCard label="Correct" value={result.correct} color="var(--accent-green)" />
        <StatCard label="Wrong" value={result.wrong} color="var(--accent-red)" />
        <StatCard label="Unattempted" value={result.unattempted} color="var(--text-secondary)" />
        <StatCard label="Time Taken" value={`${result.timeTaken} min`} color="var(--accent-amber)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 18 }}>Performance Breakdown</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {subjectEntries.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No breakdown available.</p>
            ) : subjectEntries.map(([subject, data]) => (
              <div key={subject} style={{ padding: '16px 18px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700 }}>{subject}</span>
                  <span className="badge badge-blue">{data.percentage ?? 0}%</span>
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} color="var(--accent-green)" /> {data.correct} correct</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><XCircle size={14} color="var(--accent-red)" /> {data.wrong} wrong</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Target size={14} color="var(--accent-primary)" /> {data.total} total</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 18 }}>Quick Summary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Clock size={15} color="var(--accent-amber)" /> Finished in {result.timeTaken} minute(s)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CheckCircle size={15} color="var(--accent-green)" /> Accuracy: {result.correct + result.wrong > 0 ? Math.round((result.correct / (result.correct + result.wrong)) * 100) : 0}%</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Target size={15} color="var(--accent-primary)" /> Stream: {result.stream}</div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 18 }}>Topic Breakdown</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topicEntries.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No topic data available.</p>
              ) : topicEntries.map(([topic, data]) => (
                <div key={topic} style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{topic}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {data.correct}/{data.total} correct
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
