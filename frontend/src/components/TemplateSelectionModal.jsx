import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { X, Check } from 'lucide-react'

export default function TemplateSelectionModal({ isOpen, onClose, onSelect, currentTemplateId = null }) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
    }
  }, [isOpen])

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/resumes/templates')
      if (response.data.success) {
        setTemplates(response.data.data.templates)
        // Auto-select default template
        const defaultTemplate = response.data.data.templates.find(t => t.isDefault) || 
                               response.data.data.templates.find(t => t.isActive) ||
                               response.data.data.templates[0]
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate._id)
        }
      }
    } catch (error) {
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (!selectedTemplate) {
      toast.error('Please select a template')
      return
    }
    onSelect(selectedTemplate)
  }

  if (!isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4" 
      style={{ 
        position: 'fixed', 
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw', 
        height: '100vh',
        minWidth: '100vw',
        minHeight: '100vh',
        zIndex: 99999,
        overflow: 'hidden',
        margin: 0,
        padding: '1rem',
        transform: 'translateZ(0)',
        willChange: 'transform',
        isolation: 'isolate'
      }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Select a Template</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-12">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No templates available</p>
              <p className="text-sm mt-2">Please contact an administrator</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template._id}
                  onClick={() => setSelectedTemplate(template._id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedTemplate === template._id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-500 capitalize mt-1">{template.category}</p>
                    </div>
                    {selectedTemplate === template._id && (
                      <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-600 mt-2">{template.description}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    {template.isDefault && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        Default
                      </span>
                    )}
                    {template.isActive && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-secondary px-6 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedTemplate || loading}
            className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Resume
          </button>
        </div>
      </div>
    </div>
  )

  // Render modal using portal to document.body to ensure it's above everything
  return createPortal(modalContent, document.body)
}




