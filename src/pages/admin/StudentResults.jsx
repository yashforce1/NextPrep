import React, { useEffect, useRef, useState } from 'react'
import { trackEvent } from '../../lib/analytics.js'
import { useApp } from '../../context/AppContext.jsx'
import { Search, TrendingUp, TrendingDown } from 'lucide-react'

export default function StudentResults() {
  const { results, students, tests } = useApp()
  const [selectedStudent, setSelectedStudent] = useState('All')
  const [selectedTest, setSelectedTest] = useState('All')
  const trackedView = useRef(false)

  useEffect(() => {
    if (trackedView.current) return
    trackEvent('report_viewed', { report_type: 'student_results', user_role: 'admin' })
    trackedView.current = true
  }, [])

  const filtered = results.filter(r => {
    const matchStudent = selectedStudent === 'All' || r.studentId === selectedStudent
    const matchTest = selectedTest === 'All' || r.testId === selectedTest
    return matchStudent && matchTest
  }).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))

  const getGrade = (pct) => {
    if (pct >= 90) return { grade: 'A+', color: 'var(--accent-green)' }
    if (pct >= 80) return { grade: 'A', color: 'var(--accent-green)' }
    if (pct >= 70) return { grade: 'B', color: 'var(--accent-primary)' }
    if (pct >= 60) return { grade: 'C', color: 'var(--accent-amber)' }
    return { grade: 'D', color: 'var(--accent-red)' }
  }

  return (
    <div style={{ padding: 40 }} className="animate-fade-in-up">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>Student Results</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{results.length} test submissions total</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <select className="select" style={{ width: 200 }} value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
          <option value="All">All Students</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="select" style={{ width: 280 }} value={selectedTest} onChange={e => setSelectedTest(e.target.value)}>
          <option value="All">All Tests</option>
          {tests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </div>

      {/* Summary cards */}
      {selectedStudent !== 'All' && (() => {
        const studentResults = results.filter(r => r.studentId === selectedStudent)
        const student = students.find(s => s.id === selectedStudent)
        const avg = studentResults.length > 0 ? Math.round(studentResults.reduce((s, r) => s + r.percentage, 0) / studentResults.length) : 0
        const best = studentResults.length > 0 ? Math.max(...studentResults.map(r => r.percentage)) : 0
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
            <div className="card" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--accent-primary)' }}>{studentResults.length}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Tests Taken</div>
            </div>
            <div className="card" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: avg >= 60 ? 'var(--accent-green)' : 'var(--accent-red)' }}>{avg}%</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Avg Score</div>
            </div>
            <div className="card" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--accent-amber)' }}>{best}%</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Best Score</div>
            </div>
            <div className="card" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800 }}>{getGrade(avg).grade}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Overall Grade</div>
            </div>
          </div>
        )
      })()}

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
          <TrendingUp size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p>No results yet. Assign tests to students to see results here.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                {['Student', 'Test', 'Score', 'Grade', 'Correct', 'Wrong', 'Time Taken', 'Submitted'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((result, i) => {
                const { grade, color } = getGrade(result.percentage)
                return (
                  <tr key={result.id} style={{ transition: 'background 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                          {result.studentName?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{result.studentName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', maxWidth: 200 }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{result.testName}</span>
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color }}>{result.percentage}%</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>{result.score}/{result.totalMarks}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color }}>{grade}</span>
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--accent-green)', fontWeight: 600 }}>
                      ✓ {result.correct}
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--accent-red)', fontWeight: 600 }}>
                      ✗ {result.wrong}
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {result.timeTaken} min
                    </td>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(result.submittedAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
