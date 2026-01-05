import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { FileText, BarChart3, Plus, TrendingUp, Clock, Zap, Award, Target, ArrowRight, Sparkles } from 'lucide-react'

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth)
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/user/dashboard')
      if (response.data.success) {
        setDashboardData(response.data.data)
      }
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  const stats = [
    {
      label: 'Total Resumes',
      value: dashboardData?.totalResumes || 0,
      icon: FileText,
      gradient: 'from-primary-500 to-primary-600',
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600'
    },
    {
      label: 'ATS Reports',
      value: dashboardData?.totalATSReports || 0,
      icon: BarChart3,
      gradient: 'from-accent-500 to-accent-600',
      iconBg: 'bg-accent-100',
      iconColor: 'text-accent-600'
    },
    {
      label: 'Credits Left',
      value: user?.credits || 0,
      icon: Zap,
      gradient: 'from-success-500 to-success-600',
      iconBg: 'bg-success-100',
      iconColor: 'text-success-600'
    },
  ]

  return (
    <div className="p-8 space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl p-8" style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #f97316 100%)'
      }}>
        <div className="relative z-10 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6" />
            <span className="text-sm font-semibold opacity-90">Welcome back!</span>
          </div>
          <h1 className="text-4xl font-heading font-bold mb-3">
            Hi, {user?.name}! 👋
          </h1>
          <p className="text-lg opacity-90 max-w-2xl">
            Ready to create impressive resumes? Let's boost your career journey today.
          </p>
        </div>

        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/resume-builder" className="card card-hover p-6 group">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-primary">
              <Plus className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-bold text-lg text-neutral-900 mb-1">Create New Resume</h3>
              <p className="text-sm text-neutral-600">Start building your professional resume</p>
            </div>
            <ArrowRight className="w-5 h-5 text-primary-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link to="/ats-analyzer" className="card card-hover p-6 group">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-accent flex items-center justify-center flex-shrink-0 shadow-accent">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-bold text-lg text-neutral-900 mb-1">Analyze ATS Score</h3>
              <p className="text-sm text-neutral-600">Optimize your resume for ATS</p>
            </div>
            <ArrowRight className="w-5 h-5 text-accent-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-neutral-600">{stat.label}</p>
                <p className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Resumes */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-heading font-bold text-neutral-900">Recent Resumes</h2>
            <Link to="/resumes" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
              View All
            </Link>
          </div>

          {dashboardData?.recentResumes?.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.recentResumes.slice(0, 5).map((resume) => (
                <div key={resume._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">{resume.title || 'Untitled Resume'}</p>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(resume.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Link to={`/resume-builder?id=${resume._id}`} className="text-primary-600 hover:text-primary-700">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-600 mb-4">No resumes yet</p>
              <Link to="/resume-builder" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Resume
              </Link>
            </div>
          )}
        </div>

        {/* Recent ATS Reports */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-heading font-bold text-neutral-900">ATS Reports</h2>
            <Link to="/ats-analyzer" className="text-sm font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1">
              Analyze Again
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {dashboardData?.recentATSReports?.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.recentATSReports.slice(0, 5).map((report) => (
                <Link
                  key={report._id}
                  to={`/ats-analyzer?reportId=${report._id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${report.score >= 80 ? 'bg-success-100' : report.score >= 60 ? 'bg-warning-100' : 'bg-error-100'
                    }`}>
                    <span className={`text-lg font-bold ${report.score >= 80 ? 'text-success-700' : report.score >= 60 ? 'text-warning-700' : 'text-error-700'
                      }`}>
                      {report.score}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">{report.resumeTitle || report.targetRole || 'Resume Analysis'}</p>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-400" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-600 mb-4">No ATS reports yet</p>
              <Link to="/ats-analyzer" className="btn-accent inline-flex items-center gap-2">
                <Target className="w-4 h-4" />
                Analyze Resume
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Pro Tips */}
      <div className="card p-6" style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
      }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-bold text-lg text-neutral-900 mb-2">Pro Tip of the Day</h3>
            <p className="text-neutral-700 mb-3">
              Use action verbs like "achieved," "developed," and "led" to make your resume more impactful and ATS-friendly!
            </p>
            <Link to="/ats-analyzer" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700">
              Learn More
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
