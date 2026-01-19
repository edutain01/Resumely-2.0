import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { FileText, RefreshCw, Trash2, FolderOpen, Calendar, User } from 'lucide-react'
import ConfirmationModal from '../../components/ui/ConfirmationModal'

export default function AdminResumes() {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, resumeId: null, title: '' })

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    setLoading(true)
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
          <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center">
            <FolderOpen className="w-6 h-6 text-accent-600" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-neutral-900">All Resumes</h1>
            <p className="text-neutral-600 mt-1">View all resumes created by users</p>
          </div>
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
        <div className="card text-center py-16">
          <div className="w-20 h-20 rounded-full bg-accent-100 flex items-center justify-center mx-auto mb-4">
            <FileText size={40} className="text-accent-600" />
          </div>
          <h3 className="text-xl font-heading font-bold text-neutral-900 mb-2">No resumes yet</h3>
          <p className="text-neutral-600">No resumes have been created by users</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-700">Title</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-700">User</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-700">Template</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-700">Created</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-700">Last Modified</th>
                  <th className="text-left py-4 px-6 font-semibold text-neutral-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {resumes.map((resume) => (
                  <tr key={resume._id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center">
                          <FileText size={20} className="text-accent-600" />
                        </div>
                        <span className="font-medium text-neutral-900">{resume.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-neutral-400" />
                        <div>
                          <p className="font-medium text-neutral-900">{resume.userId?.name || 'N/A'}</p>
                          <p className="text-sm text-neutral-500">{resume.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                        {resume.templateId?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-neutral-600">
                        <Calendar size={14} />
                        {new Date(resume.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-neutral-600">
                        <Calendar size={14} />
                        {new Date(resume.lastModified).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleHardDelete(resume._id, resume.title)}
                        disabled={deleting === resume._id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors"
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

