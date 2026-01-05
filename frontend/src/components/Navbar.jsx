import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, LayoutDashboard, PenTool, BarChart3, LogOut } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../store/slices/authSlice'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await dispatch(logout())
    toast.success('Logged out successfully!')
    navigate('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)'
            }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-heading font-bold text-gradient">Resumly</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2 md:gap-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-3 py-2 text-neutral-700 hover:text-primary-600 hover:bg-primary-50 font-medium transition-colors rounded-lg"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <Link
                  to="/resume-builder"
                  className="inline-flex items-center gap-2 px-3 py-2 text-neutral-700 hover:text-primary-600 hover:bg-primary-50 font-medium transition-colors rounded-lg"
                >
                  <PenTool className="w-4 h-4" />
                  <span className="hidden sm:inline">Resume Builder</span>
                </Link>
                <Link
                  to="/ats-analyzer"
                  className="inline-flex items-center gap-2 px-3 py-2 text-neutral-700 hover:text-primary-600 hover:bg-primary-50 font-medium transition-colors rounded-lg"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">ATS Analyzer</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-3 py-2 text-error-600 hover:text-error-700 hover:bg-error-50 font-medium transition-colors rounded-lg border border-error-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-neutral-700 hover:text-primary-600 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-neutral-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

