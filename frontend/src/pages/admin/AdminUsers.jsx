import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Plus, UserPlus, RefreshCw, Trash2, Eye, ToggleLeft, ToggleRight, X, AlertTriangle } from 'lucide-react'

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
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-1">Manage all users and their credits</p>
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
        <div className="card text-center py-12">
          <UserPlus size={64} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No users yet</h3>
          <p className="text-gray-600">No users have registered</p>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Credits</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Joined</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                <tr key={user._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{user.name}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary-600">{user.credits} total</span>
                      <span className="text-xs text-gray-500">
                        {user.purchasedCredits || 0} purchased • {user.earnedCredits || 0} earned
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchUserDetails(user._id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Add Credits"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user._id)}
                        className={`p-2 rounded ${user.isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {user.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => setDeleteUser(user)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              Add Credits to {selectedUser.name}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <div className="flex gap-3">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">User Details</h2>
              <button onClick={() => setViewUser(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Name</label>
                  <p className="font-medium">{viewUser.user.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{viewUser.user.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Role</label>
                  <p className="font-medium capitalize">{viewUser.user.role}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p className={`font-medium ${viewUser.user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {viewUser.user.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              
              <hr />
              
              <div>
                <h3 className="font-semibold text-lg mb-3">Credits Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-primary-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary-600">{viewUser.user.credits}</p>
                    <p className="text-sm text-gray-600">Total Credits</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{viewUser.user.purchasedCredits || 0}</p>
                    <p className="text-sm text-gray-600">Purchased</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{viewUser.user.earnedCredits || 0}</p>
                    <p className="text-sm text-gray-600">Earned</p>
                  </div>
                </div>
              </div>
              
              <hr />
              
              <div>
                <h3 className="font-semibold text-lg mb-3">Activity Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xl font-bold">{viewUser.stats?.resumeCount || 0}</p>
                    <p className="text-sm text-gray-600">Resumes Created</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xl font-bold">{viewUser.stats?.paymentCount || 0}</p>
                    <p className="text-sm text-gray-600">Payments Made</p>
                  </div>
                </div>
              </div>
              
              <hr />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-gray-500">Phone</label>
                  <p className="font-medium">{viewUser.user.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-gray-500">Location</label>
                  <p className="font-medium">{viewUser.user.location || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-gray-500">Joined</label>
                  <p className="font-medium">{new Date(viewUser.user.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-gray-500">Last Updated</label>
                  <p className="font-medium">{new Date(viewUser.user.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <AlertTriangle size={24} />
              <h2 className="text-xl font-semibold">Delete User</h2>
            </div>
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete <strong>{deleteUser.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-4">
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
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
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

