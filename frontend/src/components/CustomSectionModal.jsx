import { useState, useEffect } from 'react'
import { X, Sparkles } from 'lucide-react'

export default function CustomSectionModal({ isOpen, onClose, onConfirm }) {
  const [sectionName, setSectionName] = useState('')

  useEffect(() => {
    if (isOpen) {
      setSectionName('')
    }
  }, [isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!sectionName.trim()) {
      return
    }
    onConfirm(sectionName.trim())
    setSectionName('')
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div 
        className="bg-white rounded-xl max-w-md w-full shadow-2xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Add Custom Section</h2>
              <p className="text-sm text-neutral-500">Create a new section for your resume</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 hover:bg-neutral-100 rounded"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="section-name" className="block text-sm font-semibold text-neutral-700 mb-2">
                Section Name *
              </label>
              <input
                id="section-name"
                type="text"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                placeholder="e.g., Awards, Publications, Volunteer Work, Languages..."
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-neutral-900 placeholder-neutral-400"
                autoFocus
                required
              />
              <p className="text-xs text-neutral-500 mt-2">
                Examples: Awards, Publications, Volunteer Work, Languages, Hobbies, References, Patents
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!sectionName.trim()}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-600"
            >
              Create Section
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


