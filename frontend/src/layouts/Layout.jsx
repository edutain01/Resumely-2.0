import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect, useState } from 'react'
import { logout, fetchCurrentUser } from '../store/slices/authSlice'
import { User, FileText, BarChart3, CreditCard, LogOut, LayoutDashboard, Users, FolderOpen, FileType, DollarSign, PenTool, Settings as SettingsIcon, Coins, Trash2, Menu, X, Home } from 'lucide-react'
import Footer from '../components/Footer'

export default function Layout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Refresh user data when location changes to update credits dynamically
  useEffect(() => {
    dispatch(fetchCurrentUser())
  }, [location.pathname, dispatch])

  // Close sidebar when route changes (mobile only, don't affect desktop collapsed state)
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  const userNavItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/resume-builder', label: 'Resume Builder', icon: PenTool },
    { path: '/resumes', label: 'My Resumes', icon: FileText },
    { path: '/ats-analyzer', label: 'ATS Analyzer', icon: BarChart3 },
    { path: '/buy-credits', label: 'Buy Credits', icon: CreditCard },
  ]

  const adminNavItems = [
    { path: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/resumes', label: 'Resumes', icon: FolderOpen },
    { path: '/admin/templates', label: 'Templates', icon: FileType },
    { path: '/admin/payments', label: 'Payments', icon: DollarSign },
    { path: '/admin/cleanup', label: 'Cleanup Data', icon: Trash2 },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 flex overflow-hidden" style={{ boxSizing: 'border-box' }}>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-white rounded-lg shadow-md border border-neutral-200"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={24} className="text-neutral-700" /> : <Menu size={24} className="text-neutral-700" />}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[55]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modern Light Sidebar - Full Width */}
      <aside className={`
        fixed left-0 top-0 h-screen bg-white border-r border-neutral-200 z-[55] flex flex-col shadow-soft
        transform transition-all duration-300 ease-in-out
        ${sidebarCollapsed 
          ? 'w-20' 
          : 'w-64'
        }
        ${sidebarOpen 
          ? 'translate-x-0' 
          : '-translate-x-full lg:translate-x-0'
        }
      `}>
        {/* Logo Section with Close Button */}
        <div className={`p-6 border-b border-neutral-200 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-xl font-heading font-bold text-gradient">Resumly</h1>
              <p className="text-xs text-neutral-500">AI Resume Builder</p>
            </div>
          )}
          {/* Close/Collapse button - visible on both mobile and desktop */}
          {!sidebarCollapsed && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                // On mobile, close the overlay sidebar
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false)
                } else {
                  // On desktop, collapse the sidebar
                  setSidebarCollapsed(true)
                }
              }}
              className="p-1 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors flex-shrink-0"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <X size={20} />
            </button>
          )}
          {/* Expand button - visible when collapsed */}
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-1 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <Menu size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${sidebarCollapsed ? 'p-2' : 'p-4'} space-y-1 overflow-y-auto hide-scrollbar`}>
          {/* Regular User Navigation - Only show if NOT admin */}
          {user?.role !== 'admin' && userNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  group flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-lg 
                  transition-all duration-200 font-medium relative
                  ${active
                    ? 'bg-primary-50 text-primary-700 shadow-soft'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-primary-600'
                  }
                `}
                title={sidebarCollapsed ? item.label : ''}
              >
                <Icon className={`${sidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${active ? 'text-primary-600' : 'text-neutral-500'}`} />
                {!sidebarCollapsed && (
                  <>
                    <span>{item.label}</span>
                    {active && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
                    )}
                  </>
                )}
                {sidebarCollapsed && active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full" />
                )}
              </Link>
            )
          })}

          {/* Admin Navigation - Only show if admin */}
          {user?.role === 'admin' && adminNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  group flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-lg 
                  transition-all duration-200 font-medium relative
                  ${active
                    ? 'bg-accent-50 text-accent-700 shadow-soft'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-accent-600'
                  }
                `}
                title={sidebarCollapsed ? item.label : ''}
              >
                <Icon className={`${sidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${active ? 'text-accent-600' : 'text-neutral-500'}`} />
                {!sidebarCollapsed && (
                  <>
                    <span>{item.label}</span>
                    {active && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-500" />
                    )}
                  </>
                )}
                {sidebarCollapsed && active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent-500 rounded-r-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Credits Display */}
        {user?.role !== 'admin' && !sidebarCollapsed && (
          <div className="p-4 border-t border-neutral-200">
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-neutral-700">Credits</span>
                <Coins className="w-4 h-4 text-accent-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gradient">{user?.credits || 0}</span>
                <Link to="/buy-credits" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                  Buy More
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Credits Display - Collapsed */}
        {user?.role !== 'admin' && sidebarCollapsed && (
          <div className="p-2 border-t border-neutral-200">
            <Link
              to="/buy-credits"
              className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-neutral-100 transition-colors"
              title={`${user?.credits || 0} Credits`}
            >
              <Coins className="w-6 h-6 text-accent-500 mb-1" />
              <span className="text-xs font-bold text-gradient">{user?.credits || 0}</span>
            </Link>
          </div>
        )}

        {/* User Profile Section */}
        <div className={`${sidebarCollapsed ? 'p-2' : 'p-4'} border-t border-neutral-200`}>
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 truncate text-sm">{user?.name}</p>
                  <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  to="/settings"
                  className={`btn-ghost w-full flex items-center justify-center gap-2 text-sm py-2 ${
                    isActive('/settings') ? 'bg-primary-50 text-primary-700' : ''
                  }`}
                >
                  <SettingsIcon className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-ghost w-full flex items-center justify-center gap-2 text-sm py-2 text-error-600 hover:bg-error-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold mx-auto">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <Link
                to="/settings"
                className={`w-full flex items-center justify-center p-2 rounded-lg hover:bg-neutral-100 transition-colors ${
                  isActive('/settings') ? 'bg-primary-50' : ''
                }`}
                title="Settings"
              >
                <SettingsIcon className="w-5 h-5 text-neutral-600" />
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-error-50 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-error-600" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`} style={{ boxSizing: 'border-box', minWidth: 0, maxWidth: '100%' }}>
        <main 
          className="flex-1 w-full relative overflow-auto"
          style={{ 
            boxSizing: 'border-box',
            minWidth: 0,
            maxWidth: '100%'
          }}
        >
          <div className="min-h-full flex flex-col">
            <div className="flex-1" style={{ boxSizing: 'border-box' }}>
              <Outlet />
            </div>
            <Footer />
          </div>
        </main>
      </div>
    </div>
  )
}
