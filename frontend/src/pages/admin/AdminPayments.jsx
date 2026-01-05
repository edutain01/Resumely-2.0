import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { DollarSign, RefreshCw } from 'lucide-react'

export default function AdminPayments() {
  const [payments, setPayments] = useState([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
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
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">View all payment transactions</p>
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
          <div className="text-right">
            <div className="text-sm text-gray-600">Total Revenue</div>
            <div className="text-2xl font-bold text-primary-600">₹{totalRevenue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="card text-center py-12">
          <DollarSign size={64} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No payments yet</h3>
          <p className="text-gray-600">No payment transactions have been processed</p>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Order ID</th>
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Credits</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                <tr key={payment._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm">{payment.orderId}</td>
                  <td className="py-3 px-4">
                    {payment.userId?.name || 'N/A'}
                    <div className="text-sm text-gray-500">{payment.userId?.email}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold">₹{payment.amount / 100}</td>
                  <td className="py-3 px-4">{payment.credits}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        payment.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">{new Date(payment.createdAt).toLocaleDateString()}</td>
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

