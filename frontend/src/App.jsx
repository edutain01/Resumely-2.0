import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { fetchCurrentUser } from './store/slices/authSlice'
import Layout from './layouts/Layout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import OAuthCallback from './pages/auth/OAuthCallback'
import Home from './pages/Home'
import Dashboard from './pages/user/Dashboard'
import Resumes from './pages/user/Resumes'
import ResumeEditor from './pages/user/ResumeEditor'
import ResumeBuilder from './pages/user/ResumeBuilder'
import ATSAnalyzer from './pages/user/ATSAnalyzer'
import BuyCredits from './pages/user/BuyCredits'
import Settings from './pages/user/Settings'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminResumes from './pages/admin/AdminResumes'
import AdminTemplates from './pages/admin/AdminTemplates'
import AdminPayments from './pages/admin/AdminPayments'
import AdminCleanup from './pages/admin/AdminCleanup'

function App() {
  const dispatch = useDispatch()
  const { user, token } = useSelector((state) => state.auth)

  useEffect(() => {
    // Fetch current user if token exists
    if (token && !user) {
      dispatch(fetchCurrentUser())
    }
  }, [token, user, dispatch])

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />

      {/* Protected User Routes */}
      <Route element={user ? <Layout /> : <Navigate to="/" />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/resumes" element={<Resumes />} />
        <Route path="/resumes/new" element={<ResumeEditor />} />
        <Route path="/resumes/:id/edit" element={<ResumeEditor />} />
        <Route path="/resume-builder" element={<ResumeBuilder />} />
        <Route path="/ats-analyzer" element={<ATSAnalyzer />} />
        <Route path="/buy-credits" element={<BuyCredits />} />
        <Route path="/settings" element={<Settings />} />
        
        {/* Admin Routes */}
        {user?.role === 'admin' && (
          <>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/resumes" element={<AdminResumes />} />
            <Route path="/admin/templates" element={<AdminTemplates />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/cleanup" element={<AdminCleanup />} />
          </>
        )}
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} />} />
    </Routes>
  )
}

export default App

