import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Users, Plus, UserPlus, RefreshCw, Trash2, Eye, ToggleLeft, ToggleRight, X, AlertTriangle, Shield } from 'lucide-react'
import ConfirmationModal from '../../components/ui/ConfirmationModal'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [viewUser, setViewUser] = useState(null)
  const [deleteUser, setDeleteUser] = useState(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [creditDescription, setCreditDescription] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/users')
      if (response.data.success) {
        setUsers(response.data.data.users)
      }
    } catch (error) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCredits = async (userId) => {
    if (!creditAmount || parseInt(creditAmount) <= 0) {
      toast.error('Please enter a valid credit amount')
      return
    }

    try {
      await api.post(`/admin/users/${userId}/credits`, {
        amount: parseInt(creditAmount),
        description: creditDescription || 'Credits added by admin'
      })
      toast.success('Credits added successfully')
      setSelectedUser(null)
      setCreditAmount('')
      setCreditDescription('')
      fetchUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add credits')
    }
  }

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`)
      toast.success('User deleted successfully')
      setDeleteUser(null)
      fetchUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user')
    }
  }

  const handleToggleStatus = async (userId) => {
    try {
      const response = await api.put(`/admin/users/${userId}/toggle-status`)
      if (response.data.success) {
        toast.success(response.data.message)
        fetchUsers()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user status')
    }
  }

  const fetchUserDetails = async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`)
      if (response.data.success) {
        setViewUser(response.data.data)
      }
    } catch (error) {
      toast.error('Failed to load user details')
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
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-neutral-900">Users Management</h1>
            <p className="text-neutral-600 mt-1">Manage all users and their credits</p>
          </div>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {users.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <UserPlus size={40} className="text-primary-600" />
          </div>
          <h3 className="text-xl font-heading font-bold text-neutral-900 mb-2">No users yet</h3>
          <p className="text-neutral-600">No users have registered</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-700">Name</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-700">Email</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-700">Credits</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-700">Role</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-700">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-700">Joined</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {users.map((user) => (
                <tr key={user._id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-neutral-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-neutral-600">{user.email}</td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary-600">{user.credits} total</span>
                      <span className="text-xs text-neutral-500">
                        {user.purchasedCredits || 0} purchased • {user.earnedCredits || 0} earned
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {user.role === 'admin' && <Shield size={12} />}
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.isActive
                          ? 'bg-success-100 text-success-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-neutral-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => fetchUserDetails(user._id)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2 text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                        title="Add Credits"
                      >
                        <Plus size={18} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user._id)}
                        className={`p-2 rounded-lg transition-colors ${user.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-success-600 hover:bg-success-50'}`}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {user.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => setDeleteUser(user)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Credits Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center">
                <Plus className="w-6 h-6 text-success-600" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold text-neutral-900">Add Credits</h2>
                <p className="text-sm text-neutral-500">to {selectedUser.name}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Credit Amount
                </label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="input-field"
                  placeholder="Enter amount"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={creditDescription}
                  onChange={(e) => setCreditDescription(e.target.value)}
                  className="input-field"
                  placeholder="Reason for adding credits"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setSelectedUser(null)
                    setCreditAmount('')
                    setCreditDescription('')
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddCredits(selectedUser._id)}
                  className="flex-1 btn-primary"
                >
                  Add Credits
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View User Details Modal */}
      {viewUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xl font-bold">
                  {viewUser.user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-heading font-bold text-neutral-900">{viewUser.user.name}</h2>
                  <p className="text-sm text-neutral-500">{viewUser.user.email}</p>
                </div>
              </div>
              <button onClick={() => setViewUser(null)} className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Role</label>
                  <p className="font-semibold text-neutral-900 mt-1 capitalize">{viewUser.user.role}</p>
                </div>
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Status</label>
                  <p className={`font-semibold mt-1 ${viewUser.user.isActive ? 'text-success-600' : 'text-red-600'}`}>
                    {viewUser.user.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-heading font-bold text-lg text-neutral-900 mb-3">Credits Information</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl text-center">
                    <p className="text-2xl font-bold text-primary-600">{viewUser.user.credits}</p>
                    <p className="text-xs font-medium text-primary-700">Total Credits</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-success-50 to-success-100 rounded-xl text-center">
                    <p className="text-2xl font-bold text-success-600">{viewUser.user.purchasedCredits || 0}</p>
                    <p className="text-xs font-medium text-success-700">Purchased</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl text-center">
                    <p className="text-2xl font-bold text-accent-600">{viewUser.user.earnedCredits || 0}</p>
                    <p className="text-xs font-medium text-accent-700">Earned</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-heading font-bold text-lg text-neutral-900 mb-3">Activity Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-neutral-50 rounded-xl">
                    <p className="text-2xl font-bold text-neutral-900">{viewUser.stats?.resumeCount || 0}</p>
                    <p className="text-xs font-medium text-neutral-500">Resumes Created</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-xl">
                    <p className="text-2xl font-bold text-neutral-900">{viewUser.stats?.paymentCount || 0}</p>
                    <p className="text-xs font-medium text-neutral-500">Payments Made</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Phone</label>
                  <p className="font-medium text-neutral-900 mt-1">{viewUser.user.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Location</label>
                  <p className="font-medium text-neutral-900 mt-1">{viewUser.user.location || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Joined</label>
                  <p className="font-medium text-neutral-900 mt-1">{new Date(viewUser.user.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Last Updated</label>
                  <p className="font-medium text-neutral-900 mt-1">{new Date(viewUser.user.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-xl font-heading font-bold">Delete User</h2>
            </div>
            <p className="text-neutral-600 mb-2">
              Are you sure you want to delete <strong className="text-neutral-900">{deleteUser.name}</strong>?
            </p>
            <p className="text-sm text-neutral-500 mb-6 p-3 bg-red-50 rounded-lg border border-red-100">
              This will permanently delete the user and all their data including resumes, reports, and transaction history. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteUser(null)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteUser._id)}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

