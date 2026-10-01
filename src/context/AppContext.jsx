import React, { createContext, useContext, useState, useEffect } from 'react'
import { SAMPLE_QUESTIONS, SAMPLE_TESTS, SAMPLE_STUDENTS } from '../sampleData.js'
import { trackEvent } from '../lib/analytics.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('nexprep_user')
    return saved ? JSON.parse(saved) : null
  })
  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem('nexprep_questions')
    return saved ? JSON.parse(saved) : SAMPLE_QUESTIONS
  })
  const [tests, setTests] = useState(() => {
    const saved = localStorage.getItem('nexprep_tests')
    return saved ? JSON.parse(saved) : SAMPLE_TESTS
  })
  const [students] = useState(SAMPLE_STUDENTS)
  const [results, setResults] = useState(() => {
    const saved = localStorage.getItem('nexprep_results')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    if (user) localStorage.setItem('nexprep_user', JSON.stringify(user))
    else localStorage.removeItem('nexprep_user')
  }, [user])

  useEffect(() => {
    localStorage.setItem('nexprep_questions', JSON.stringify(questions))
  }, [questions])

  useEffect(() => {
    localStorage.setItem('nexprep_tests', JSON.stringify(tests))
  }, [tests])

  useEffect(() => {
    localStorage.setItem('nexprep_results', JSON.stringify(results))
  }, [results])

  const login = (email, password) => {
    // Admin credentials
    if (email === 'admin@nexprep.in' && password === 'admin123') {
      const adminUser = { id: 'admin_1', name: 'Dr. Rajan Sharma', email, role: 'admin', avatar: 'RS' }
      setUser(adminUser)
      return { success: true, role: 'admin' }
    }
    // Student credentials
    const student = SAMPLE_STUDENTS.find(s => s.email === email && s.password === password)
    if (student) {
      const { password: _, ...studentUser } = student
      setUser({ ...studentUser, role: 'student' })
      return { success: true, role: 'student' }
    }
    return { success: false, error: 'Invalid credentials' }
  }

  const logout = () => setUser(null)

  const addQuestion = (q) => setQuestions(prev => [{ ...q, id: `q_${Date.now()}` }, ...prev])
  const updateQuestion = (id, updates) => setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q))
  const deleteQuestion = (id) => setQuestions(prev => prev.filter(q => q.id !== id))

  const addTest = (t) => {
    const test = { ...t, id: `t_${Date.now()}`, createdAt: new Date().toISOString() }
    setTests(prev => [test, ...prev])
    const params = { quiz_id: test.id, question_count: test.questionIds?.length || 0, duration_minutes: test.duration, status: test.status }
    trackEvent('quiz_created', params)
    if (test.status === 'active') trackEvent('quiz_published', params)
  }
  const updateTest = (id, updates) => {
    const existing = tests.find(t => t.id === id)
    setTests(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    if (existing && existing.status !== 'active' && updates.status === 'active') {
      trackEvent('quiz_published', { quiz_id: id })
    }
  }
  const deleteTest = (id) => setTests(prev => prev.filter(t => t.id !== id))

  const submitResult = (result) => {
    const newResult = { ...result, id: `r_${Date.now()}`, submittedAt: new Date().toISOString() }
    setResults(prev => [...prev, newResult])
    trackEvent('quiz_submitted', { quiz_id: result.testId, submission_type: result.submissionType })
    return newResult
  }

  const getStudentResults = (studentId) => results.filter(r => r.studentId === studentId)
  const getTestResults = (testId) => results.filter(r => r.testId === testId)

  return (
    <AppContext.Provider value={{
      user, login, logout,
      questions, addQuestion, updateQuestion, deleteQuestion,
      tests, addTest, updateTest, deleteTest,
      students, results, submitResult,
      getStudentResults, getTestResults
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
