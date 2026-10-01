import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext.jsx'

// Pages
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './components/shared/LoginPage.jsx'
import AnalyticsTracker from './components/shared/AnalyticsTracker.jsx'

// Admin pages
import AdminLayout from './components/shared/AdminLayout.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import QuestionBank from './pages/admin/QuestionBank.jsx'
import CreateTest from './pages/admin/CreateTest.jsx'
import ManageTests from './pages/admin/ManageTests.jsx'
import StudentResults from './pages/admin/StudentResults.jsx'
import Analytics from './pages/admin/Analytics.jsx'


import StudentLayout from './pages/student/StudentLayout.jsx'
import StudentDashboard from './pages/student/StudentDashboard.jsx'
import TakeTest from './pages/student/TakeTest.jsx'
import TestResults from './pages/student/TestResults.jsx'
import MyTests from './pages/student/MyTests.jsx'
import AITutor from './pages/student/AITutor.jsx'

function ProtectedRoute({ children, role }) {
  const { user } = useApp()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user } = useApp()
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute role="admin">
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="questions" element={<QuestionBank />} />
        <Route path="create-test" element={<CreateTest />} />
        <Route path="tests" element={<ManageTests />} />
        <Route path="results" element={<StudentResults />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>

      {/* Student Routes */}
      <Route path="/student" element={
        <ProtectedRoute role="student">
          <StudentLayout />
        </ProtectedRoute>
      }>
        <Route index element={<StudentDashboard />} />
        <Route path="my-tests" element={<MyTests />} />
        <Route path="take-test/:testId" element={<TakeTest />} />
        <Route path="results/:testId" element={<TestResults />} />
        <Route path="ai-tutor" element={<AITutor />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AnalyticsTracker />
      <AppRoutes />
    </AppProvider>
  )
}
