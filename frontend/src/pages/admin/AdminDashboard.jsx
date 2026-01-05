import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Users, FileText, DollarSign, BarChart3, TrendingUp, RefreshCw, Shield, Activity } from 'lucide-react'
import FloatingCard from '../../components/ui/FloatingCard'
import GlowButton from '../../components/ui/GlowButton'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
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
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="xl" color="green" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-8">
        <FloatingCard glass className="text-center py-16">
          <Activity size={64} className="mx-auto mb-4 text-gray-lighter" />
          <h3 className="text-xl font-bold text-gray-text mb-2">Failed to load dashboard</h3>
          <GlowButton variant="primary" onClick={fetchDashboard}>
            <RefreshCw size={18} />
            Retry
          </GlowButton>
        </FloatingCard>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-10 h-10 text-green-neon" />
            <div>
              <h1 className="text-4xl font-bold text-gradient">Admin Dashboard</h1>
              <p className="text-gray-text mt-1">Platform overview and analytics</p>
            </div>
          </div>
          <GlowButton
            variant="ghost"
            onClick={fetchDashboard}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </GlowButton>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.stats.totalUsers}
          subtitle={`${stats.stats.activeUsers} active`}
          icon={Users}
        />
        <StatCard
          title="Total Resumes"
          value={stats.stats.totalResumes}
          icon={FileText}
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats.stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          highlight
        />
        <StatCard
          title="ATS Reports"
          value={stats.stats.totalATSReports}
          icon={BarChart3}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <FloatingCard glass>
          <h2 className="text-xl font-bold text-gray-text mb-4 flex items-center gap-2">
            <Users className="text-green-primary" size={24} />
            Recent Users
          </h2>
          <div className="space-y-2">
            {stats.recentUsers && stats.recentUsers.length > 0 ? (
              stats.recentUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 bg-black-hover rounded-lg border border-gray-dark"
                >
                  <div>
                    <p className="font-semibold text-gray-text">{user.name}</p>
                    <p className="text-sm text-gray-lighter">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-green-neon">{user.credits} credits</div>
                    <div className="text-xs text-gray-lighter">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-lighter py-8">No recent users</p>
            )}
          </div>
        </FloatingCard>

        {/* Recent Payments */}
        <FloatingCard glass>
          <h2 className="text-xl font-bold text-gray-text mb-4 flex items-center gap-2">
            <DollarSign className="text-green-primary" size={24} />
            Recent Payments
          </h2>
          <div className="space-y-2">
            {stats.recentPayments && stats.recentPayments.length > 0 ? (
              stats.recentPayments.map((payment) => (
                <div
                  key={payment._id}
                  className="flex items-center justify-between p-3 bg-black-hover rounded-lg border border-gray-dark"
                >
                  <div>
                    <p className="font-semibold text-gray-text">
                      {payment.userId?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-lighter">
                      {payment.credits} credits
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-neon">
                      ₹{payment.amount}
                    </div>
                    <div className="text-xs text-gray-lighter">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-lighter py-8">No recent payments</p>
            )}
          </div>
        </FloatingCard>
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon: Icon, highlight = false }) {
  return (
    <FloatingCard gradient={highlight} hover>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-lighter mb-1">{title}</p>
          <p className="text-3xl font-bold text-gradient mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-lighter">{subtitle}</p>
          )}
        </div>
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${highlight
            ? 'bg-gradient-green shadow-glow'
            : 'bg-black-hover border border-green-primary border-opacity-30'
          }`}>
          <Icon className={highlight ? 'text-black' : 'text-green-primary'} size={28} />
        </div>
      </div>
    </FloatingCard>
  )
}



