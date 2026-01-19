import { useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Trash2, AlertTriangle, Database, Info, ShieldAlert } from 'lucide-react'

export default function AdminCleanup() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState('')

  const handleCleanupResumes = async () => {
    if (!password) {
      toast.error('Please enter your admin password')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/admin/cleanup/resumes', {
        confirmPassword: password
      })

      if (response.data.success) {
        toast.success(response.data.message)
        setPassword('')
        setShowConfirm('')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cleanup resumes')
    } finally {
      setLoading(false)
    }
  }

  const handleCleanupAllTestData = async () => {
    if (!password) {
      toast.error('Please enter your admin password')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/admin/cleanup/test-data', {
        confirmPassword: password
      })

      if (response.data.success) {
        toast.success(response.data.message)
        setPassword('')
        setShowConfirm('')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cleanup test data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold text-neutral-900">Database Cleanup</h1>
          <p className="text-neutral-600 mt-1">Remove fake/test data from the database</p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="card bg-gradient-to-r from-red-50 to-amber-50 border-red-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-red-800">Warning: Destructive Actions</h3>
            <p className="mt-1 text-red-700">
              These actions are PERMANENT and cannot be undone. All data will be deleted from the database.
              Please use with extreme caution.
            </p>
          </div>
        </div>
      </div>

      {/* Cleanup Resumes */}
      <div className="card">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-7 h-7 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-heading font-bold text-neutral-900 mb-2">Delete All Resumes</h2>
            <p className="text-neutral-600 mb-4">
              This will permanently delete all resumes and resume versions from the database.
            </p>
            {showConfirm === 'resumes' ? (
              <div className="space-y-4 p-4 bg-red-50 rounded-xl border border-red-200">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Enter your admin password to confirm
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field max-w-md"
                    placeholder="Admin password"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCleanupResumes}
                    disabled={loading}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={18} />
                        Confirm Delete All Resumes
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirm('')
                      setPassword('')
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirm('resumes')}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete All Resumes
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cleanup All Test Data */}
      <div className="card">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Database className="w-7 h-7 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-heading font-bold text-neutral-900 mb-2">Delete All Test Data</h2>
            <p className="text-neutral-600 mb-4">
              This will permanently delete all resumes, resume versions, and ATS reports from the database.
              Use this to clear all fake/test data at once.
            </p>
            {showConfirm === 'all' ? (
              <div className="space-y-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Enter your admin password to confirm
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field max-w-md"
                    placeholder="Admin password"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCleanupAllTestData}
                    disabled={loading}
                    className="bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Database size={18} />
                        Confirm Delete All Test Data
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirm('')
                      setPassword('')
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirm('all')}
                className="bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors flex items-center gap-2"
              >
                <Database size={18} />
                Delete All Test Data
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="card bg-gradient-to-r from-primary-50 to-accent-50 border-primary-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-primary-900 mb-2">What gets deleted?</h3>
            <ul className="space-y-2 text-sm text-primary-800">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">•</span>
                <span><strong>Delete All Resumes:</strong> Removes all resumes and resume versions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">•</span>
                <span><strong>Delete All Test Data:</strong> Removes resumes, resume versions, and ATS reports</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-500 mt-0.5">✓</span>
                <span>User accounts, templates, and payments are NOT affected</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
