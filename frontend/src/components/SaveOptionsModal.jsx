import { X, Save, Copy } from 'lucide-react'
import LoadingSpinner from './ui/LoadingSpinner'

export default function SaveOptionsModal({
  isOpen,
  onClose,
  onSave,
  onSaveNew,
  saving = false,
  resumeTitle = 'Untitled Resume'
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-neutral-900">Save Resume</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={saving}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-neutral-700 mb-6">
            This resume "<strong>{resumeTitle}</strong>" is already saved. Choose an option:
          </p>

          <div className="space-y-3">
            <button
              onClick={onSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>Save - Update existing resume</span>
                </>
              )}
            </button>

            <button
              onClick={onSaveNew}
              disabled={saving}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              <Copy size={20} />
              <span>Save New - Create a new resume</span>
            </button>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg font-medium transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

