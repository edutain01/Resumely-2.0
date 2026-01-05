import { useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Trash2, AlertTriangle, Database } from 'lucide-react'

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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Database Cleanup</h1>
        <p className="text-gray-600 mt-1">Remove fake/test data from the database</p>
      </div>

      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <AlertTriangle className="text-red-400" size={24} />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Warning</h3>
            <p className="mt-2 text-sm text-red-700">
              These actions are PERMANENT and cannot be undone. All data will be deleted from the database.
              Please use with extreme caution.
            </p>
          </div>
        </div>
      </div>

      {/* Cleanup Resumes */}
      <div className="card">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Trash2 className="text-red-600" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Delete All Resumes</h2>
            <p className="text-gray-600 mb-4">
              This will permanently delete all resumes and resume versions from the database.
            </p>
            {showConfirm === 'resumes' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? 'Deleting...' : 'Confirm Delete All Resumes'}
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
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
              >
                Delete All Resumes
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cleanup All Test Data */}
      <div className="card">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Database className="text-orange-600" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Delete All Test Data</h2>
            <p className="text-gray-600 mb-4">
              This will permanently delete all resumes, resume versions, and ATS reports from the database.
              Use this to clear all fake/test data at once.
            </p>
            {showConfirm === 'all' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? 'Deleting...' : 'Confirm Delete All Test Data'}
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
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
              >
                Delete All Test Data
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">What gets deleted?</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• <strong>Delete All Resumes:</strong> Removes all resumes and resume versions</li>
          <li>• <strong>Delete All Test Data:</strong> Removes resumes, resume versions, and ATS reports</li>
          <li>• User accounts, templates, and payments are NOT affected</li>
        </ul>
      </div>
    </div>
  )
}
