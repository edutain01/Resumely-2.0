import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Users, FileText, DollarSign, BarChart3, RefreshCw, Shield, Activity, ArrowRight, TrendingUp, Calendar } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/dashboard')
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-8">
        <div className="card text-center py-16">
          <Activity size={64} className="mx-auto mb-4 text-neutral-400" />
          <h3 className="text-xl font-bold text-neutral-900 mb-4">Failed to load dashboard</h3>
          <button onClick={fetchDashboard} className="btn-primary inline-flex items-center gap-2">
            <RefreshCw size={18} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.stats.totalUsers,
      subtitle: `${stats.stats.activeUsers} active`,
      icon: Users,
      gradient: 'from-primary-500 to-primary-600',
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600'
    },
    {
      title: 'Total Resumes',
      value: stats.stats.totalResumes,
      icon: FileText,
      gradient: 'from-accent-500 to-accent-600',
      iconBg: 'bg-accent-100',
      iconColor: 'text-accent-600'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      gradient: 'from-success-500 to-success-600',
      iconBg: 'bg-success-100',
      iconColor: 'text-success-600',
      highlight: true
    },
    {
      title: 'ATS Reports',
      value: stats.stats.totalATSReports,
      icon: BarChart3,
      gradient: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ]

  return (
    <div className="p-8 space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl p-8" style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #f97316 100%)'
      }}>
        <div className="relative z-10 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6" />
            <span className="text-sm font-semibold opacity-90">Admin Panel</span>
          </div>
          <h1 className="text-4xl font-heading font-bold mb-3">
            Admin Dashboard
          </h1>
          <p className="text-lg opacity-90 max-w-2xl">
            Monitor platform activity, manage users, and track revenue all in one place.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/admin/users" className="card card-hover p-6 group">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-bold text-lg text-neutral-900 mb-1">Manage Users</h3>
              <p className="text-sm text-neutral-600">View and manage all registered users</p>
            </div>
            <ArrowRight className="w-5 h-5 text-primary-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link to="/admin/payments" className="card card-hover p-6 group">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-bold text-lg text-neutral-900 mb-1">View Payments</h3>
              <p className="text-sm text-neutral-600">Track all payment transactions</p>
            </div>
            <ArrowRight className="w-5 h-5 text-accent-500 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className={`card p-6 ${stat.highlight ? 'ring-2 ring-success-500 ring-opacity-50' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                {stat.highlight && (
                  <span className="badge-success text-xs">Revenue</span>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-neutral-600">{stat.title}</p>
                <p className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                  {stat.value}
                </p>
                {stat.subtitle && (
                  <p className="text-sm text-neutral-500">{stat.subtitle}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-heading font-bold text-neutral-900 flex items-center gap-2">
              <Users className="text-primary-500" size={24} />
              Recent Users
            </h2>
            <Link to="/admin/users" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentUsers && stats.recentUsers.length > 0 ? (
              stats.recentUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-primary-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">{user.name}</p>
                      <p className="text-sm text-neutral-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary-600">{user.credits} credits</div>
                    <div className="text-xs text-neutral-500 flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <Users size={48} className="mx-auto mb-2 opacity-50" />
                <p>No recent users</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-heading font-bold text-neutral-900 flex items-center gap-2">
              <DollarSign className="text-success-500" size={24} />
              Recent Payments
            </h2>
            <Link to="/admin/payments" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentPayments && stats.recentPayments.length > 0 ? (
              stats.recentPayments.map((payment) => (
                <div
                  key={payment._id}
                  className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-success-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center text-white">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">
                        {payment.userId?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {payment.credits} credits
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-success-600">
                      ₹{payment.amount}
                    </div>
                    <div className="text-xs text-neutral-500 flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <DollarSign size={48} className="mx-auto mb-2 opacity-50" />
                <p>No recent payments</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



