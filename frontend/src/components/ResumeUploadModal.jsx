import { useState } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { X, Upload, Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ResumeUploadModal({ isOpen, onClose, onSuccess }) {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('resume', file)

      const response = await api.post('/resumes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        toast.success('Resume uploaded and parsed successfully!')
        if (onSuccess) onSuccess()
        navigate(`/resumes/${response.data.data.resume._id}/edit`)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload resume')
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Upload Resume</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File (PDF or DOCX)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload size={48} className="text-gray-400 mb-4" />
                {file ? (
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF or DOCX (max 10MB)</p>
                  </>
                )}
              </label>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Your resume will be automatically parsed and populated. You can then edit and enhance it.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={uploading}
              className="flex-1 btn-secondary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Uploading...
                </>
              ) : (
                'Upload & Parse'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}





