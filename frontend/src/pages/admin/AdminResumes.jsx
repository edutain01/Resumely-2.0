import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { FileText, RefreshCw, Trash2 } from 'lucide-react'

export default function AdminResumes() {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, resumeId: null, title: '' })

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    try {
      const response = await api.get('/admin/resumes')
      if (response.data.success) {
        setResumes(response.data.data.resumes)
      }
    } catch (error) {
      toast.error('Failed to load resumes')
    } finally {
      setLoading(false)
    }
  }

  const handleHardDelete = (resumeId, title) => {
    setDeleteConfirm({ isOpen: true, resumeId, title: title || 'this resume' })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.resumeId) return

    setDeleting(deleteConfirm.resumeId)
    setDeleteConfirm({ isOpen: false, resumeId: null, title: '' })
    
    try {
      const response = await api.delete(`/admin/resumes/${deleteConfirm.resumeId}/hard-delete`)
      if (response.data.success) {
        toast.success('Resume permanently deleted')
        fetchResumes()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete resume')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Resumes</h1>
          <p className="text-gray-600 mt-1">View all resumes created by users</p>
        </div>
        <button
          onClick={fetchResumes}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {resumes.length === 0 ? (
        <div className="card text-center py-12">
          <FileText size={64} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No resumes yet</h3>
          <p className="text-gray-600">No resumes have been created by users</p>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Title</th>
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Template</th>
                  <th className="text-left py-3 px-4">Created</th>
                  <th className="text-left py-3 px-4">Last Modified</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resumes.map((resume) => (
                  <tr key={resume._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{resume.title}</td>
                    <td className="py-3 px-4">
                      {resume.userId?.name || 'N/A'}
                      <div className="text-sm text-gray-500">{resume.userId?.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      {resume.templateId?.name || 'N/A'}
                    </td>
                    <td className="py-3 px-4">{new Date(resume.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{new Date(resume.lastModified).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleHardDelete(resume._id, resume.title)}
                        disabled={deleting === resume._id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                        title="Permanently delete"
                      >
                        {deleting === resume._id ? (
                          <RefreshCw size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, resumeId: null, title: '' })}
        onConfirm={confirmDelete}
        title="Permanently Delete Resume"
        message={`Are you sure you want to permanently delete "${deleteConfirm.title}"? This action cannot be undone.`}
        type="danger"
        confirmText="Delete Permanently"
        loading={deleting !== null}
      />
    </div>
  )
}

