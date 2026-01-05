import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { User, Mail, Lock, Download, Trash2, AlertTriangle, Shield, Sparkles } from 'lucide-react'

export default function Settings() {
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExportData = async () => {
    setExporting(true)
    try {
      const response = await api.get('/user/export-data', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `resumly-data-${Date.now()}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Data exported successfully')
    } catch (error) {
      toast.error('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password')
      return
    }

    setDeleting(true)
    try {
      await api.delete('/user/account', {
        data: { password: deletePassword }
      })

      toast.success('Account deleted successfully')
      dispatch(logout())
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-neutral-900 mb-2">Settings</h1>
        <p className="text-neutral-600">Manage your account settings and preferences</p>
      </div>

      {/* Profile Information */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold text-neutral-900">{user?.name}</h2>
            <p className="text-neutral-600">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Full Name
            </label>
            <input
              type="text"
              value={user?.name || ''}
              disabled
              className="input-field bg-neutral-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="input-field bg-neutral-50"
            />
          </div>
        </div>

        <div className="mt-4 p-4 rounded-lg bg-neutral-50">
          <p className="text-sm text-neutral-600">
            <Shield className="w-4 h-4 inline mr-2" />
            To update your profile information, please contact support.
          </p>
        </div>
      </div>

      {/* Account Role */}
      <div className="card p-6">
        <h3 className="text-lg font-heading font-bold text-neutral-900 mb-4">Account Type</h3>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-50 text-primary-700">
          <Sparkles className="w-4 h-4" />
          <span className="font-semibold capitalize">{user?.role || 'User'}</span>
        </div>
      </div>

      {/* Data Export */}
      <div className="card p-6">
        <h3 className="text-lg font-heading font-bold text-neutral-900 mb-2">Export Your Data</h3>
        <p className="text-neutral-600 mb-4">
          Download all your data including resumes, ATS reports, and account information.
        </p>
        <button
          onClick={handleExportData}
          disabled={exporting}
          className="btn-secondary inline-flex items-center gap-2"
        >
          {exporting ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export Data
            </>
          )}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="card border-error-200 p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-error-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-heading font-bold text-error-900 mb-1">Danger Zone</h3>
            <p className="text-neutral-600">
              Once you delete your account, there is no going back. Please be certain.
            </p>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors font-semibold"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-4 p-4 bg-error-50 rounded-lg">
            <p className="text-sm font-semibold text-error-900">
              Enter your password to confirm account deletion:
            </p>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="input-field pl-12"
                placeholder="Enter your password"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors font-semibold disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeletePassword('')
                }}
                className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
