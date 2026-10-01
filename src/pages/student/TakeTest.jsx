import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { trackEvent } from '../../lib/analytics.js'
import { generateHint } from '../../claude.js'
import { Clock, AlertTriangle, ChevronLeft, ChevronRight, Flag, Send, Lightbulb, CheckCircle, X, SkipForward } from 'lucide-react'

export default function TakeTest() {
  const { testId } = useParams()
  const { tests, questions, user, submitResult, results } = useApp()
  const navigate = useNavigate()

  const test = tests.find(t => t.id === testId)
  const testQuestions = test ? questions.filter(q => test.questionIds.includes(q.id)) : []

  const [started, setStarted] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [flagged, setFlagged] = useState(new Set())
  const [timeLeft, setTimeLeft] = useState(test ? test.duration * 60 : 0)
  const [hintText, setHintText] = useState('')
  const [hintLoading, setHintLoading] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const submittedRef = useRef(false)

  // Check if already completed
  const alreadyDone = results.find(r => r.testId === testId && r.studentId === user?.id)

  useEffect(() => {
    if (started && !submitted) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          return Math.max(0, prev - 1)
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [started, submitted])

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const handleAnswer = (qId, optIdx) => {
    setAnswers(prev => ({ ...prev, [qId]: optIdx }))
  }

  const toggleFlag = (qId) => {
    setFlagged(prev => {
      const next = new Set(prev)
      next.has(qId) ? next.delete(qId) : next.add(qId)
      return next
    })
  }

  const handleHint = async () => {
    const q = testQuestions[currentIdx]
    setHintLoading(true)
    setHintText('')
    try {
      const hint = await generateHint(q.question, answers[q.id] !== undefined ? q.options[answers[q.id]] : undefined)
      setHintText(hint)
    } catch (err) {
      setHintText('Hint unavailable. (Requires API key in .env file)')
    }
    setHintLoading(false)
  }

  const handleSubmit = useCallback((autoSubmit = false) => {
    if (submittedRef.current) return
    submittedRef.current = true
    clearInterval(timerRef.current)
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 60000)

    let correct = 0, wrong = 0, unattempted = 0
    const subjectBreakdown = {}
    const topicBreakdown = {}

    testQuestions.forEach(q => {
      const ans = answers[q.id]
      if (ans === undefined) {
        unattempted++
      } else if (ans === q.correct) {
        correct++
        if (!subjectBreakdown[q.subject]) subjectBreakdown[q.subject] = { correct: 0, wrong: 0, total: 0 }
        subjectBreakdown[q.subject].correct++
      } else {
        wrong++
        if (!subjectBreakdown[q.subject]) subjectBreakdown[q.subject] = { correct: 0, wrong: 0, total: 0 }
        subjectBreakdown[q.subject].wrong++
      }
      if (!subjectBreakdown[q.subject]) subjectBreakdown[q.subject] = { correct: 0, wrong: 0, total: 0 }
      subjectBreakdown[q.subject].total++
      if (!topicBreakdown[q.topic]) topicBreakdown[q.topic] = { correct: 0, wrong: 0, total: 0 }
      topicBreakdown[q.topic].total++
      if (answers[q.id] === q.correct) topicBreakdown[q.topic].correct++
      else if (answers[q.id] !== undefined) topicBreakdown[q.topic].wrong++
    })

    // Add percentages
    Object.keys(subjectBreakdown).forEach(s => {
      const d = subjectBreakdown[s]
      d.percentage = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0
    })

    const score = correct * 4 - wrong * 1
    const totalMarks = test.totalMarks || testQuestions.length * 4
    const percentage = Math.max(0, Math.round((score / totalMarks) * 100))

    const result = submitResult({
      testId, studentId: user.id, studentName: user.name,
      testName: test.title, stream: test.stream,
      submissionType: autoSubmit ? 'automatic' : 'manual',
      score, totalMarks, percentage,
      correct, wrong, unattempted,
      timeTaken: Math.max(1, timeTaken),
      subjectBreakdown, topicBreakdown,
      answers
    })

    setSubmitted(true)
    navigate(`/student/results/${testId}`)
  }, [answers, testQuestions, test, testId, user, submitResult, navigate])

  useEffect(() => {
    if (started && !submitted && timeLeft === 0) handleSubmit(true)
  }, [started, submitted, timeLeft, handleSubmit])

  if (!test) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
      <p>Test not found.</p>
    </div>
  )

  if (alreadyDone) return (
    <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ maxWidth: 440, textAlign: 'center', padding: 40 }}>
        <CheckCircle size={48} color="var(--accent-green)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Already Completed</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>You've already submitted this test. View your full analysis below.</p>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate(`/student/results/${testId}`)}>
          View Analysis
        </button>
      </div>
    </div>
  )

  // Pre-start screen
  if (!started) return (
    <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ maxWidth: 560, width: '100%' }} className="animate-fade-in-up">
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 32px rgba(0,212,255,0.3)' }}>
            <Flag size={28} color="#fff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{test.title}</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6 }}>{test.description}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
            {[
              ['⏱️ Duration', `${test.duration} min`],
              ['📝 Questions', testQuestions.length],
              ['🎯 Total Marks', test.totalMarks],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 700 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '14px 18px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, marginBottom: 28, textAlign: 'left' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-amber)', marginBottom: 8 }}>📋 Instructions</p>
            <ul style={{ fontSize: 13, color: 'var(--text-secondary)', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>✅ Correct answer: <strong style={{ color: 'var(--accent-green)' }}>+4 marks</strong></li>
              <li>❌ Wrong answer: <strong style={{ color: 'var(--accent-red)' }}>-1 mark</strong></li>
              <li>⬜ Unattempted: <strong>0 marks</strong></li>
              <li>🚩 You can flag questions to review later</li>
              <li>💡 AI hints available (requires API key)</li>
            </ul>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 16 }}
            onClick={() => {
              if (startTimeRef.current !== null) return
              setStarted(true)
              startTimeRef.current = Date.now()
              trackEvent('quiz_started', { quiz_id: testId, question_count: testQuestions.length })
            }}>
            <Flag size={16} /> Begin Test
          </button>
        </div>
      </div>
    </div>
  )

  const currentQ = testQuestions[currentIdx]
  const answered = Object.keys(answers).length
  const timerUrgent = timeLeft < 300

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ padding: '12px 24px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{test.title}</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{answered}/{testQuestions.length} answered</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 100, background: timerUrgent ? 'rgba(239,68,68,0.15)' : 'var(--bg-elevated)', border: `1px solid ${timerUrgent ? 'rgba(239,68,68,0.4)' : 'var(--border)'}` }}>
          <Clock size={14} color={timerUrgent ? 'var(--accent-red)' : 'var(--accent-primary)'} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: timerUrgent ? 'var(--accent-red)' : 'var(--text-primary)', animation: timerUrgent ? 'pulse-glow 1s infinite' : 'none' }}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <button className="btn btn-danger" style={{ fontSize: 13 }} onClick={() => setShowSubmitConfirm(true)}>
          <Send size={13} /> Submit
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Question panel */}
        <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          <div style={{ maxWidth: 720 }}>
            {/* Question header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Q{currentIdx + 1} of {testQuestions.length}</span>
              <span className="badge badge-blue" style={{ fontSize: 10 }}>{currentQ.subject}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{currentQ.topic}</span>
              <span className={`badge ${currentQ.difficulty === 'Easy' ? 'badge-green' : currentQ.difficulty === 'Medium' ? 'badge-amber' : 'badge-red'}`} style={{ fontSize: 10 }}>{currentQ.difficulty}</span>
              <button onClick={() => toggleFlag(currentQ.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: flagged.has(currentQ.id) ? 'var(--accent-amber)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                <Flag size={14} fill={flagged.has(currentQ.id) ? 'var(--accent-amber)' : 'none'} />
                {flagged.has(currentQ.id) ? 'Flagged' : 'Flag'}
              </button>
            </div>

            {/* Question text */}
            <div style={{ padding: '20px 24px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 24, lineHeight: 1.8, fontSize: 16 }}>
              {currentQ.question}
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {currentQ.options.map((opt, i) => {
                const isSelected = answers[currentQ.id] === i
                return (
                  <button key={i} onClick={() => handleAnswer(currentQ.id, i)}
                    style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', border: `2px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border)'}`, background: isSelected ? 'rgba(0,212,255,0.08)' : 'var(--bg-elevated)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.15s', textAlign: 'left', width: '100%' }}
                    onMouseOver={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'var(--bg-card)' } }}
                    onMouseOut={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elevated)' } }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-strong)'}`, background: isSelected ? 'var(--accent-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: isSelected ? '#fff' : 'var(--text-muted)', transition: 'all 0.15s' }}>
                      {isSelected ? <CheckCircle size={14} /> : String.fromCharCode(65 + i)}
                    </div>
                    <span style={{ fontSize: 14, color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)', fontWeight: isSelected ? 500 : 400, flex: 1 }}>{opt}</span>
                  </button>
                )
              })}
            </div>

            {/* Hint */}
            <div style={{ marginBottom: 24 }}>
              <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={handleHint} disabled={hintLoading}>
                <Lightbulb size={14} color="var(--accent-amber)" />
                {hintLoading ? 'Loading hint...' : 'Get AI Hint'}
              </button>
              {hintText && (
                <div style={{ marginTop: 12, padding: '14px 18px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  <strong style={{ color: 'var(--accent-amber)' }}>💡 Hint: </strong>{hintText}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => { setCurrentIdx(i => i - 1); setHintText('') }} disabled={currentIdx === 0}>
                <ChevronLeft size={15} /> Previous
              </button>
              {answers[currentQ.id] === undefined && (
                <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => { setCurrentIdx(i => Math.min(testQuestions.length - 1, i + 1)); setHintText('') }}>
                  <SkipForward size={14} /> Skip
                </button>
              )}
              <button className="btn btn-primary" onClick={() => { setCurrentIdx(i => i + 1); setHintText('') }} disabled={currentIdx === testQuestions.length - 1}>
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Question navigator */}
        <div style={{ width: 220, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)', padding: 20, overflowY: 'auto', flexShrink: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>Question Map</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 20 }}>
            {testQuestions.map((q, i) => {
              const isAnswered = answers[q.id] !== undefined
              const isFlagged = flagged.has(q.id)
              const isCurrent = i === currentIdx
              return (
                <button key={q.id} onClick={() => { setCurrentIdx(i); setHintText('') }}
                  style={{ width: '100%', aspectRatio: '1', borderRadius: 8, border: `2px solid ${isCurrent ? 'var(--accent-primary)' : isFlagged ? 'var(--accent-amber)' : isAnswered ? 'var(--accent-green)' : 'var(--border)'}`, background: isCurrent ? 'rgba(0,212,255,0.15)' : isFlagged ? 'rgba(245,158,11,0.1)' : isAnswered ? 'rgba(16,185,129,0.1)' : 'var(--bg-elevated)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: isCurrent ? 'var(--accent-primary)' : isFlagged ? 'var(--accent-amber)' : isAnswered ? 'var(--accent-green)' : 'var(--text-muted)', transition: 'all 0.15s' }}>
                  {i + 1}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            {[
              { color: 'var(--accent-green)', label: 'Answered' },
              { color: 'var(--accent-amber)', label: 'Flagged' },
              { color: 'var(--border-strong)', label: 'Unanswered' },
              { color: 'var(--accent-primary)', label: 'Current' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color }} />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submit confirm modal */}
      {showSubmitConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div className="card" style={{ maxWidth: 400, width: '100%', margin: 20, textAlign: 'center', padding: 36 }}>
            <AlertTriangle size={40} color="var(--accent-amber)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Submit Test?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>
              {testQuestions.length - answered} question{testQuestions.length - answered !== 1 ? 's' : ''} unattempted.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowSubmitConfirm(false)}>
                Continue Test
              </button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleSubmit(false)}>
                <Send size={14} /> Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
