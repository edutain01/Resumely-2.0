import { useState } from 'react'
import { X, Wand2 } from 'lucide-react'
import LoadingSpinner from './ui/LoadingSpinner'

export default function EnhancementDetailsModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false
}) {
  const [enhancementDetails, setEnhancementDetails] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm(enhancementDetails.trim() || '')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Enhancement Details</h2>
              <p className="text-sm text-neutral-600">Optional: Specify what you want to improve</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Specific Enhancement Instructions (Optional)
              </label>
              <textarea
                value={enhancementDetails}
                onChange={(e) => setEnhancementDetails(e.target.value)}
                placeholder="e.g., Emphasize leadership experience, add more technical keywords for software engineering roles, highlight project management skills, focus on quantifiable achievements..."
                className="w-full h-32 p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                disabled={loading}
              />
              <p className="text-xs text-neutral-500 mt-2">
                Leave blank to apply all AI suggestions from the analysis. Or specify particular areas you want to focus on.
              </p>
            </div>
          </div>

          <div className="p-6 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-6 py-2"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary px-6 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Enhance Resume
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

