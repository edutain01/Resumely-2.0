import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Plus, FileText, Trash2, Copy, Edit2, Download, Calendar, MoreVertical } from 'lucide-react'
import ConfirmationModal from '../../components/ui/ConfirmationModal'

export default function Resumes() {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState(null)
  const [menuOpen, setMenuOpen] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, resumeId: null, title: '' })

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    try {
      const response = await api.get('/resumes')
      if (response.data.success) {
        setResumes(response.data.data.resumes)
      }
    } catch (error) {
      toast.error('Failed to load resumes')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id, title) => {
    setDeleteConfirm({ isOpen: true, resumeId: id, title: title || 'this resume' })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.resumeId) return
    
    try {
      await api.delete(`/resumes/${deleteConfirm.resumeId}`)
      toast.success('Resume deleted successfully')
      setDeleteConfirm({ isOpen: false, resumeId: null, title: '' })
      fetchResumes()
    } catch (error) {
      toast.error('Failed to delete resume')
    }
  }

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/resumes/${id}/duplicate`)
      toast.success('Resume duplicated successfully')
      fetchResumes()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to duplicate resume')
    }
  }

  const handleDownloadPdf = async (resumeId, title) => {
    setDownloadingPdf(resumeId)
    try {
      const response = await api.post(`/resumes/${resumeId}/export/pdf`, {}, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${title || 'resume'}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Resume downloaded successfully')
    } catch (error) {
      toast.error('Failed to download resume')
    } finally {
      setDownloadingPdf(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-neutral-900 mb-2">My Resumes</h1>
          <p className="text-neutral-600">Manage all your professional resumes in one place</p>
        </div>
        <Link to="/resume-builder" className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create New Resume
        </Link>
      </div>

      {/* Resumes Grid */}
      {resumes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => (
            <div key={resume._id} className="card card-hover group">
              {/* Resume Preview Header */}
              <div className="h-48 bg-gradient-to-br from-primary-50 to-accent-50 rounded-t-lg flex items-center justify-center mb-4">
                <FileText className="w-20 h-20 text-primary-300" />
              </div>

              {/* Resume Details */}
              <div className="p-4">
                <h3 className="font-heading font-bold text-lg text-neutral-900 mb-2 truncate">
                  {resume.title || 'Untitled Resume'}
                </h3>

                <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>Updated {new Date(resume.updatedAt).toLocaleDateString()}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Link
                    to={`/resume-builder?id=${resume._id}`}
                    className="flex-1 btn-secondary py-2 flex items-center justify-center gap-2 text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Link>

                  <button
                    onClick={() => handleDownloadPdf(resume._id, resume.title)}
                    disabled={downloadingPdf === resume._id}
                    className="btn-primary py-2 px-4 flex items-center justify-center"
                  >
                    {downloadingPdf === resume._id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>

                  {/* More Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === resume._id ? null : resume._id)}
                      className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-neutral-600" />
                    </button>

                    {menuOpen === resume._id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpen(null)}
                        ></div>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-soft-lg border border-neutral-200 py-1 z-20">
                          <button
                            onClick={() => {
                              handleDuplicate(resume._id)
                              setMenuOpen(null)
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <button
                            onClick={() => {
                              handleDelete(resume._id, resume.title)
                              setMenuOpen(null)
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-error-600 hover:bg-error-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary-50 flex items-center justify-center">
            <FileText className="w-12 h-12 text-primary-500" />
          </div>
          <h3 className="text-2xl font-heading font-bold text-neutral-900 mb-2">
            No Resumes Yet
          </h3>
          <p className="text-neutral-600 mb-6 max-w-md mx-auto">
            Start building your professional resume today and land your dream job!
          </p>
          <Link to="/resume-builder" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Your First Resume
          </Link>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, resumeId: null, title: '' })}
        onConfirm={confirmDelete}
        title="Delete Resume"
        message={`Are you sure you want to delete "${deleteConfirm.title}"? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
      />
    </div>
  )
}
