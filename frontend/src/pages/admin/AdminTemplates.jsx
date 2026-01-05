import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, FileType, RefreshCw } from 'lucide-react'

export default function AdminTemplates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, templateId: null, title: '' })
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'standard',
    componentCode: '',
    isActive: true,
    isDefault: false
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/admin/templates')
      if (response.data.success) {
        setTemplates(response.data.data.templates)
      }
    } catch (error) {
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingTemplate) {
        await api.put(`/admin/templates/${editingTemplate._id}`, formData)
        toast.success('Template updated successfully')
      } else {
        await api.post('/admin/templates', formData)
        toast.success('Template created successfully')
      }
      setShowForm(false)
      setEditingTemplate(null)
      resetForm()
      fetchTemplates()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save template')
    }
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      componentCode: template.componentCode,
      isActive: template.isActive,
      isDefault: template.isDefault
    })
    setShowForm(true)
  }

  const handleDelete = (id, title) => {
    setDeleteConfirm({ isOpen: true, templateId: id, title: title || 'this template' })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.templateId) return

    try {
      await api.delete(`/admin/templates/${deleteConfirm.templateId}`)
      toast.success('Template deleted successfully')
      setDeleteConfirm({ isOpen: false, templateId: null, title: '' })
      fetchTemplates()
    } catch (error) {
      toast.error('Failed to delete template')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'standard',
      componentCode: '',
      isActive: true,
      isDefault: false
    })
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates Management</h1>
          <p className="text-gray-600 mt-1">Manage resume templates</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchTemplates}
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            New Template
          </button>
        </div>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="card text-center py-12">
          <FileType size={64} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-600 mb-6">Create your first template to get started</p>
          <button onClick={() => setShowForm(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus size={20} />
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
          <div key={template._id} className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{template.name}</h3>
                <p className="text-sm text-gray-500 capitalize">{template.category}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(template)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(template._id, template.name)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">{template.description}</p>
            <div className="flex gap-2">
              <span
                className={`px-2 py-1 rounded text-xs ${
                  template.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {template.isActive ? 'Active' : 'Inactive'}
              </span>
              {template.isDefault && (
                <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                  Default
                </span>
              )}
            </div>
          </div>
          ))}
        </div>
      )}

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingTemplate ? 'Edit Template' : 'New Template'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field"
                >
                  <option value="standard">Standard</option>
                  <option value="modern">Modern</option>
                  <option value="minimal">Minimal</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Component Code (React Component)
                </label>
                <textarea
                  required
                  value={formData.componentCode}
                  onChange={(e) => setFormData({ ...formData, componentCode: e.target.value })}
                  className="input-field font-mono text-sm"
                  rows={10}
                  placeholder="React component code..."
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  Active
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded"
                  />
                  Default Template
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingTemplate(null)
                    resetForm()
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingTemplate ? 'Update' : 'Create'} Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, templateId: null, title: '' })}
        onConfirm={confirmDelete}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteConfirm.title}"? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
      />
    </div>
  )
}

