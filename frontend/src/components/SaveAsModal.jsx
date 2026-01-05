import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function SaveAsModal({ isOpen, onClose, onConfirm, currentTitle = '' }) {
  const [newTitle, setNewTitle] = useState('')

  useEffect(() => {
    if (isOpen) {
      setNewTitle(`${currentTitle} (Copy)`)
    }
  }, [isOpen, currentTitle])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!newTitle.trim()) {
      return
    }
    onConfirm(newTitle.trim())
    setNewTitle('')
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
    >
      <div 
        className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">Save As</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Enter a new name for this resume
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-neutral-900"
              placeholder="Resume name"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-6 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save As
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


