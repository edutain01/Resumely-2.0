import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { DollarSign, RefreshCw, CreditCard, TrendingUp, Calendar, User } from 'lucide-react'

export default function AdminPayments() {
  const [payments, setPayments] = useState([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/payments')
      if (response.data.success) {
        setPayments(response.data.data.payments)
        setTotalRevenue(response.data.data.totalRevenue)
      }
    } catch (error) {
      toast.error('Failed to load payments')
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

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-success-600" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-neutral-900">Payments</h1>
            <p className="text-neutral-600 mt-1">View all payment transactions</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchPayments}
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
              <TrendingUp size={20} className="text-success-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Total Revenue</p>
              <p className="text-2xl font-bold text-success-600">₹{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-20 h-20 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-4">
            <DollarSign size={40} className="text-success-600" />
          </div>
          <h3 className="text-xl font-heading font-bold text-neutral-900 mb-2">No payments yet</h3>
          <p className="text-neutral-600">No payment transactions have been processed</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-700">Order ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-700">User</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-700">Amount</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-700">Credits</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-700">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-700">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {payments.map((payment) => (
                <tr key={payment._id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-4 px-6">
                    <code className="px-2 py-1 bg-neutral-100 rounded text-sm font-mono text-neutral-700">
                      {payment.orderId}
                    </code>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                        {payment.userId?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{payment.userId?.name || 'N/A'}</p>
                        <p className="text-sm text-neutral-500">{payment.userId?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-lg font-bold text-success-600">₹{payment.amount / 100}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                      {payment.credits} credits
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        payment.status === 'completed'
                          ? 'bg-success-100 text-success-700'
                          : payment.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <Calendar size={14} />
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

