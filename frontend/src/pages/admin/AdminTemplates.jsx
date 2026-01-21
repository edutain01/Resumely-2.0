import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, FileType, RefreshCw, X, Layers, Code, Palette, Info, Eye, EyeOff } from 'lucide-react'
import ConfirmationModal from '../../components/ui/ConfirmationModal'

export default function AdminTemplates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, templateId: null, title: '' })
  const [showHelp, setShowHelp] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'standard',
    componentCode: '',
    templateStyles: '',
    isBuiltIn: false,
    isActive: true,
    isDefault: false
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
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
      templateStyles: template.templateStyles || '',
      isBuiltIn: template.isBuiltIn || false,
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
      templateStyles: '',
      isBuiltIn: false,
      isActive: true,
      isDefault: false
    })
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'modern': return 'bg-purple-100 text-purple-700'
      case 'minimal': return 'bg-neutral-100 text-neutral-700'
      case 'professional': return 'bg-primary-100 text-primary-700'
      case 'creative': return 'bg-pink-100 text-pink-700'
      case 'executive': return 'bg-amber-100 text-amber-700'
      default: return 'bg-accent-100 text-accent-700'
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
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <Layers className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-neutral-900">Templates Management</h1>
            <p className="text-neutral-600 mt-1">Manage resume templates</p>
          </div>
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
        <div className="card text-center py-16">
          <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
            <FileType size={40} className="text-purple-600" />
          </div>
          <h3 className="text-xl font-heading font-bold text-neutral-900 mb-2">No templates yet</h3>
          <p className="text-neutral-600 mb-6">Create your first template to get started</p>
          <button onClick={() => setShowForm(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus size={20} />
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
          <div key={template._id} className="card card-hover group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileType size={20} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-bold text-neutral-900">{template.name}</h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${getCategoryColor(template.category)}`}>
                    {template.category}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(template)}
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(template._id, template.name)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <p className="text-sm text-neutral-600 mb-4 line-clamp-2">{template.description}</p>
            <div className="flex gap-2 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  template.isActive
                    ? 'bg-success-100 text-success-700'
                    : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {template.isActive ? 'Active' : 'Inactive'}
              </span>
              {template.isDefault && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                  Default
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                template.isBuiltIn 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {template.isBuiltIn ? 'Built-in' : 'Custom HTML'}
              </span>
            </div>
          </div>
          ))}
        </div>
      )}

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 my-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  {editingTemplate ? <Edit className="w-6 h-6 text-purple-600" /> : <Plus className="w-6 h-6 text-purple-600" />}
                </div>
                <div>
                  <h2 className="text-xl font-heading font-bold text-neutral-900">
                    {editingTemplate ? 'Edit Template' : 'New Template'}
                  </h2>
                  <p className="text-sm text-neutral-500">Fill in the template details</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowHelp(!showHelp)}
                  className={`p-2 rounded-lg transition-colors ${showHelp ? 'bg-primary-100 text-primary-600' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'}`}
                  title="Template Help"
                >
                  <Info size={20} />
                </button>
                <button 
                  onClick={() => {
                    setShowForm(false)
                    setEditingTemplate(null)
                    resetForm()
                  }}
                  className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Help Panel */}
            {showHelp && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm">
                <h3 className="font-bold text-blue-800 mb-2">Template Placeholder Syntax</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
                  <div>
                    <p className="font-semibold mb-1">Basic Placeholders:</p>
                    <code className="block bg-blue-100 p-2 rounded text-xs mb-2">{'{{personalInfo.fullName}}'}</code>
                    <code className="block bg-blue-100 p-2 rounded text-xs mb-2">{'{{personalInfo.email}}'}</code>
                    <code className="block bg-blue-100 p-2 rounded text-xs">{'{{summary}}'}</code>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Conditionals:</p>
                    <code className="block bg-blue-100 p-2 rounded text-xs mb-2">{'{{#if personalInfo.phone}}...{{/if}}'}</code>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Loops:</p>
                    <code className="block bg-blue-100 p-2 rounded text-xs mb-2">{'{{#each experience}}...{{/each}}'}</code>
                    <code className="block bg-blue-100 p-2 rounded text-xs">{'{{this.title}}, {{this.company}}'}</code>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Available Data:</p>
                    <p className="text-xs">personalInfo, summary, experience[], education[], skills[], projects[], certifications[], awards[], languages[], customSections[]</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="Template name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="standard">Standard</option>
                    <option value="modern">Modern</option>
                    <option value="minimal">Minimal</option>
                    <option value="professional">Professional</option>
                    <option value="creative">Creative</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={2}
                  placeholder="Brief description of the template"
                />
              </div>

              {/* Template Type Toggle */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isBuiltIn}
                    onChange={(e) => setFormData({ ...formData, isBuiltIn: e.target.checked })}
                    className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="font-semibold text-neutral-700">Built-in Template</span>
                    <p className="text-xs text-neutral-500">
                      {formData.isBuiltIn 
                        ? 'Uses a pre-built React component (enter component name like "StandardTemplate")' 
                        : 'Uses custom HTML with placeholder syntax (enter full HTML template)'}
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Code size={16} className="text-neutral-500" />
                  <label className="text-sm font-semibold text-neutral-700">
                    {formData.isBuiltIn ? 'Component Name' : 'HTML Template'}
                  </label>
                </div>
                {formData.isBuiltIn ? (
                  <input
                    type="text"
                    required
                    value={formData.componentCode}
                    onChange={(e) => setFormData({ ...formData, componentCode: e.target.value })}
                    className="input-field font-mono"
                    placeholder="StandardTemplate, ModernTemplate, MinimalTemplate, or ProfessionalTemplate"
                  />
                ) : (
                  <textarea
                    required
                    value={formData.componentCode}
                    onChange={(e) => setFormData({ ...formData, componentCode: e.target.value })}
                    className="input-field font-mono text-sm"
                    rows={12}
                    placeholder={`<div class="resume-container">
  <header class="header">
    <h1>{{personalInfo.fullName}}</h1>
    <p>{{personalInfo.email}} | {{personalInfo.phone}}</p>
  </header>
  
  {{#if summary}}
  <section class="summary">
    <h2>Summary</h2>
    <p>{{summary}}</p>
  </section>
  {{/if}}
  
  {{#each experience}}
  <div class="job">
    <h3>{{this.title}} at {{this.company}}</h3>
    <p>{{this.startDate}} - {{this.endDate}}</p>
  </div>
  {{/each}}
</div>`}
                  />
                )}
              </div>

              {!formData.isBuiltIn && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Palette size={16} className="text-neutral-500" />
                    <label className="text-sm font-semibold text-neutral-700">CSS Styles</label>
                  </div>
                  <textarea
                    value={formData.templateStyles}
                    onChange={(e) => setFormData({ ...formData, templateStyles: e.target.value })}
                    className="input-field font-mono text-sm"
                    rows={10}
                    placeholder={`.resume-container {
  font-family: 'Arial', sans-serif;
  color: #333;
  line-height: 1.5;
}

.header {
  text-align: center;
  border-bottom: 2px solid #333;
  padding-bottom: 16px;
  margin-bottom: 20px;
}

.header h1 {
  font-size: 24px;
  margin: 0;
}

.section h2 {
  font-size: 16px;
  color: #2563eb;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 4px;
}`}
                  />
                </div>
              )}

              <div className="flex items-center gap-6 py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-neutral-700">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-neutral-700">Default Template</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
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

