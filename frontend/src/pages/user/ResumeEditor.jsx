import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import A4ResumeRenderer from '../../components/resume/A4ResumeRenderer'
import { Save, Download, Sparkles, ChevronDown, ChevronUp, Plus, Trash2, GripVertical, X, History, FileText } from 'lucide-react'
import TemplateSelectionModal from '../../components/TemplateSelectionModal'
import ConfirmationModal from '../../components/ui/ConfirmationModal'

export default function ResumeEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [resume, setResume] = useState(null)
  const [metadata, setMetadata] = useState({
    personalInfo: {},
    education: [],
    experience: [],
    skills: [],
    projects: [],
    certifications: [],
    achievements: [],
    customSections: []
  })
  const [templateStyle, setTemplateStyle] = useState('standard')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState({})
  const [versions, setVersions] = useState([])
  const [showVersions, setShowVersions] = useState(false)
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)

  useEffect(() => {
    if (!id || id === 'new') {
      setShowTemplateModal(true)
    } else {
      fetchResume()
    }
  }, [id])

  const createNewResume = async (templateId) => {
    try {
      setLoading(true)
      setShowTemplateModal(false)

      const response = await api.post('/resumes', {
        title: 'Untitled Resume',
        templateId: templateId,
        templateStyle: 'standard'
      })

      if (response.data.success) {
        navigate(`/resumes/${response.data.data.resume._id}/edit`, { replace: true })
      } else {
        toast.error('Failed to create resume')
        navigate('/resumes')
      }
    } catch (error) {
      console.error('Create resume error:', error)
      toast.error(error.response?.data?.message || 'Failed to create resume')
      navigate('/resumes')
    } finally {
      setLoading(false)
    }
  }

  const fetchResume = async () => {
    try {
      const response = await api.get(`/resumes/${id}`)
      if (response.data.success) {
        const resumeData = response.data.data.resume
        setResume(resumeData)
        setMetadata(resumeData.metadata || metadata)
        setTemplateStyle(resumeData.templateStyle || 'standard')
      }
    } catch (error) {
      toast.error('Failed to load resume')
      navigate('/resumes')
    } finally {
      setLoading(false)
    }
  }

  const fetchVersions = async () => {
    if (!resume?._id) return
    setLoadingVersions(true)
    try {
      const response = await api.get(`/resumes/${resume._id}/versions`)
      if (response.data.success) {
        setVersions(response.data.data.versions)
      }
    } catch (error) {
      toast.error('Failed to load versions')
    } finally {
      setLoadingVersions(false)
    }
  }

  const handleRestoreVersion = (versionId) => {
    setRestoreConfirm({ isOpen: true, versionId })
  }

  const confirmRestore = async () => {
    if (!restoreConfirm.versionId || !resume) return
    
    try {
      const response = await api.post(`/resumes/${resume._id}/versions/${restoreConfirm.versionId}/restore`)
      if (response.data.success) {
        toast.success('Version restored successfully')
        setRestoreConfirm({ isOpen: false, versionId: null })
        fetchResume()
        setShowVersions(false)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to restore version')
    }
  }

  const handleSave = async () => {
    if (!resume) {
      // If no resume exists, create one first
      await createNewResume()
      return
    }

    setSaving(true)
    try {
      await api.put(`/resumes/${resume._id}`, {
        metadata,
        templateStyle
      })
      toast.success('Resume saved successfully')
    } catch (error) {
      toast.error('Failed to save resume')
    } finally {
      setSaving(false)
    }
  }

  const handleExportPDF = async () => {
    if (!resume) {
      toast.error('Please save the resume first')
      return
    }

    try {
      const response = await api.post(`/resumes/${resume._id}/export/pdf`, {}, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${resume.title || 'resume'}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('PDF exported successfully')
    } catch (error) {
      toast.error('Failed to export PDF')
    }
  }

  const handleExportDOCX = async () => {
    if (!resume) {
      toast.error('Please save the resume first')
      return
    }

    try {
      const response = await api.post(`/resumes/${resume._id}/export/docx`, {}, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${resume.title || 'resume'}.docx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('DOCX exported successfully')
    } catch (error) {
      toast.error('Failed to export DOCX')
    }
  }

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resume editor...</p>
        </div>
      </div>
    )
  }

  // Show template selection modal for new resumes
  if (showTemplateModal) {
    return (
      <TemplateSelectionModal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false)
          navigate('/resumes')
        }}
        onSelect={createNewResume}
      />
    )
  }

  // Show editor even if resume is null (for new resumes that are being created)
  // The editor will handle the creation

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={resume?.title || 'Untitled Resume'}
            onChange={(e) => {
              if (resume) {
                setResume({ ...resume, title: e.target.value })
              }
            }}
            onBlur={handleSave}
            className="text-xl font-semibold border-none focus:outline-none focus:ring-0"
            placeholder="Resume Title"
          />
          <select
            value={templateStyle}
            onChange={(e) => setTemplateStyle(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="standard">Standard</option>
            <option value="modern">Modern</option>
            <option value="minimal">Minimal</option>
            <option value="professional">Professional</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          {resume && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleExportPDF}
                className="btn-secondary flex items-center gap-2"
              >
                <Download size={18} />
                Export PDF
              </button>
              <button
                onClick={handleExportDOCX}
                className="btn-secondary flex items-center gap-2"
              >
                <Download size={18} />
                Export DOCX
              </button>
              <button
                onClick={() => {
                  setShowVersions(true)
                  fetchVersions()
                }}
                className="btn-secondary flex items-center gap-2"
                title="Version History"
              >
                <History size={18} />
                Versions
              </button>
            </>
          )}
        </div>
      </div>

      {/* Version History Modal */}
      {showVersions && resume && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Version History</h2>
              <button
                onClick={() => setShowVersions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {loadingVersions ? (
                <div className="text-center py-8">Loading versions...</div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No versions available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Current Version */}
                  <div className="p-4 border-2 border-primary-500 rounded-lg bg-primary-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">Current Version</div>
                        <div className="text-sm text-gray-500 mt-1">
                          Last modified: {new Date(resume.lastModified).toLocaleString()}
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-primary-600 text-white text-sm rounded-full">
                        Current
                      </span>
                    </div>
                  </div>

                  {/* Past Versions */}
                  {versions.map((version) => (
                    <div key={version._id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">
                            Version {version.versionNumber}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {new Date(version.createdAt).toLocaleString()}
                          </div>
                          {version.notes && (
                            <div className="text-sm text-gray-600 mt-2">{version.notes}</div>
                          )}
                        </div>
                        <button
                          onClick={() => handleRestoreVersion(version._id)}
                          className="btn-secondary text-sm px-4 py-2"
                        >
                          Restore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editor Layout - Overleaf Style */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Form Editor */}
        <div className="w-96 bg-gray-50 border-r overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Personal Info Section */}
            <SectionEditor
              title="Personal Information"
              collapsed={collapsedSections.personalInfo}
              onToggle={() => toggleSection('personalInfo')}
            >
              <PersonalInfoEditor
                data={metadata.personalInfo}
                onChange={(data) => setMetadata({ ...metadata, personalInfo: data })}
              />
            </SectionEditor>

            {/* Experience Section */}
            <SectionEditor
              title="Experience"
              collapsed={collapsedSections.experience}
              onToggle={() => toggleSection('experience')}
            >
              <ArrayEditor
                items={metadata.experience}
                onItemsChange={(items) => setMetadata({ ...metadata, experience: items })}
                renderItem={(item, index) => (
                  <ExperienceItemEditor
                    key={index}
                    data={item}
                    onChange={(data) => {
                      const newItems = [...metadata.experience]
                      newItems[index] = data
                      setMetadata({ ...metadata, experience: newItems })
                    }}
                    onDelete={() => {
                      const newItems = metadata.experience.filter((_, i) => i !== index)
                      setMetadata({ ...metadata, experience: newItems })
                    }}
                  />
                )}
                defaultItem={{
                  title: '',
                  company: '',
                  location: '',
                  startDate: '',
                  endDate: '',
                  description: '',
                  achievements: []
                }}
              />
            </SectionEditor>

            {/* Education Section */}
            <SectionEditor
              title="Education"
              collapsed={collapsedSections.education}
              onToggle={() => toggleSection('education')}
            >
              <ArrayEditor
                items={metadata.education}
                onItemsChange={(items) => setMetadata({ ...metadata, education: items })}
                renderItem={(item, index) => (
                  <EducationItemEditor
                    key={index}
                    data={item}
                    onChange={(data) => {
                      const newItems = [...metadata.education]
                      newItems[index] = data
                      setMetadata({ ...metadata, education: newItems })
                    }}
                    onDelete={() => {
                      const newItems = metadata.education.filter((_, i) => i !== index)
                      setMetadata({ ...metadata, education: newItems })
                    }}
                  />
                )}
                defaultItem={{
                  degree: '',
                  institution: '',
                  location: '',
                  startDate: '',
                  endDate: '',
                  gpa: '',
                  description: ''
                }}
              />
            </SectionEditor>

            {/* Skills Section */}
            <SectionEditor
              title="Skills"
              collapsed={collapsedSections.skills}
              onToggle={() => toggleSection('skills')}
            >
              <SkillsEditor
                skills={metadata.skills}
                onChange={(skills) => setMetadata({ ...metadata, skills })}
              />
            </SectionEditor>

            {/* Projects Section */}
            <SectionEditor
              title="Projects"
              collapsed={collapsedSections.projects}
              onToggle={() => toggleSection('projects')}
            >
              <ArrayEditor
                items={metadata.projects}
                onItemsChange={(items) => setMetadata({ ...metadata, projects: items })}
                renderItem={(item, index) => (
                  <ProjectItemEditor
                    key={index}
                    data={item}
                    onChange={(data) => {
                      const newItems = [...metadata.projects]
                      newItems[index] = data
                      setMetadata({ ...metadata, projects: newItems })
                    }}
                    onDelete={() => {
                      const newItems = metadata.projects.filter((_, i) => i !== index)
                      setMetadata({ ...metadata, projects: newItems })
                    }}
                  />
                )}
                defaultItem={{
                  name: '',
                  description: '',
                  technologies: [],
                  link: '',
                  startDate: '',
                  endDate: ''
                }}
              />
            </SectionEditor>

            {/* Certifications Section */}
            <SectionEditor
              title="Certifications"
              collapsed={collapsedSections.certifications}
              onToggle={() => toggleSection('certifications')}
            >
              <ArrayEditor
                items={metadata.certifications}
                onItemsChange={(items) => setMetadata({ ...metadata, certifications: items })}
                renderItem={(item, index) => (
                  <CertificationItemEditor
                    key={index}
                    data={item}
                    onChange={(data) => {
                      const newItems = [...metadata.certifications]
                      newItems[index] = data
                      setMetadata({ ...metadata, certifications: newItems })
                    }}
                    onDelete={() => {
                      const newItems = metadata.certifications.filter((_, i) => i !== index)
                      setMetadata({ ...metadata, certifications: newItems })
                    }}
                  />
                )}
                defaultItem={{
                  name: '',
                  issuer: '',
                  date: '',
                  expiryDate: '',
                  credentialId: ''
                }}
              />
            </SectionEditor>
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="flex-1 bg-gray-100 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-8" style={{ minHeight: '842px' }}>
              <A4ResumeRenderer metadata={metadata} templateStyle={templateStyle} />
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={restoreConfirm.isOpen}
        onClose={() => setRestoreConfirm({ isOpen: false, versionId: null })}
        onConfirm={confirmRestore}
        title="Restore Version"
        message="Are you sure you want to restore this version? Current changes will be lost."
        type="warning"
        confirmText="Restore"
      />
    </div>
  )
}

// Section Editor Wrapper Component
function SectionEditor({ title, collapsed, onToggle, children }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between font-semibold text-gray-900 hover:bg-gray-50"
      >
        <span>{title}</span>
        {collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
      </button>
      {!collapsed && <div className="p-4 border-t">{children}</div>}
    </div>
  )
}

// Array Editor Component
function ArrayEditor({ items, onItemsChange, renderItem, defaultItem }) {
  const addItem = () => {
    onItemsChange([...items, { ...defaultItem }])
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          {renderItem(item, index)}
        </div>
      ))}
      <button
        onClick={addItem}
        className="w-full btn-secondary flex items-center justify-center gap-2"
      >
        <Plus size={18} />
        Add Item
      </button>
    </div>
  )
}

// Personal Info Editor
function PersonalInfoEditor({ data = {}, onChange }) {
  const updateField = (field, value) => {
    console.log('PersonalInfoEditor - updateField:', field, value, 'current data:', data)
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Full Name"
        value={data.fullName || data.name || ''}
        onChange={(e) => updateField('fullName', e.target.value)}
        className="input-field"
      />
      <input
        type="email"
        placeholder="Email"
        value={data.email || ''}
        onChange={(e) => updateField('email', e.target.value)}
        className="input-field"
      />
      <input
        type="tel"
        placeholder="Phone"
        value={data.phone || ''}
        onChange={(e) => updateField('phone', e.target.value)}
        className="input-field"
      />
      <input
        type="text"
        placeholder="Location"
        value={data.location || ''}
        onChange={(e) => updateField('location', e.target.value)}
        className="input-field"
      />
      <input
        type="text"
        placeholder="LinkedIn URL"
        value={data.linkedIn || ''}
        onChange={(e) => updateField('linkedIn', e.target.value)}
        className="input-field"
      />
      <input
        type="text"
        placeholder="Portfolio/Github URL"
        value={data.portfolio || ''}
        onChange={(e) => updateField('portfolio', e.target.value)}
        className="input-field"
      />
      <textarea
        placeholder="Professional Summary"
        value={data.summary || ''}
        onChange={(e) => updateField('summary', e.target.value)}
        className="input-field"
        rows={4}
      />
    </div>
  )
}

// Experience Item Editor
function ExperienceItemEditor({ data, onChange, onDelete }) {
  const updateField = (field, value) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-gray-900">Experience Entry</h4>
        <button onClick={onDelete} className="text-red-600 hover:text-red-700">
          <Trash2 size={18} />
        </button>
      </div>
      <input
        type="text"
        placeholder="Job Title"
        value={data.title || ''}
        onChange={(e) => updateField('title', e.target.value)}
        className="input-field"
      />
      <input
        type="text"
        placeholder="Company"
        value={data.company || ''}
        onChange={(e) => updateField('company', e.target.value)}
        className="input-field"
      />
      <input
        type="text"
        placeholder="Location"
        value={data.location || ''}
        onChange={(e) => updateField('location', e.target.value)}
        className="input-field"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Start Date"
          value={data.startDate || ''}
          onChange={(e) => updateField('startDate', e.target.value)}
          className="input-field"
        />
        <input
          type="text"
          placeholder="End Date"
          value={data.endDate || ''}
          onChange={(e) => updateField('endDate', e.target.value)}
          className="input-field"
        />
      </div>
      <textarea
        placeholder="Description"
        value={data.description || ''}
        onChange={(e) => updateField('description', e.target.value)}
        className="input-field"
        rows={4}
      />
    </div>
  )
}

// Education Item Editor
function EducationItemEditor({ data, onChange, onDelete }) {
  const updateField = (field, value) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-gray-900">Education Entry</h4>
        <button onClick={onDelete} className="text-red-600 hover:text-red-700">
          <Trash2 size={18} />
        </button>
      </div>
      <input
        type="text"
        placeholder="Degree"
        value={data.degree || ''}
        onChange={(e) => updateField('degree', e.target.value)}
        className="input-field"
      />
      <input
        type="text"
        placeholder="Institution"
        value={data.institution || ''}
        onChange={(e) => updateField('institution', e.target.value)}
        className="input-field"
      />
      <input
        type="text"
        placeholder="Location"
        value={data.location || ''}
        onChange={(e) => updateField('location', e.target.value)}
        className="input-field"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Start Date"
          value={data.startDate || ''}
          onChange={(e) => updateField('startDate', e.target.value)}
          className="input-field"
        />
        <input
          type="text"
          placeholder="End Date"
          value={data.endDate || ''}
          onChange={(e) => updateField('endDate', e.target.value)}
          className="input-field"
        />
      </div>
      <input
        type="text"
        placeholder="GPA (optional)"
        value={data.gpa || ''}
        onChange={(e) => updateField('gpa', e.target.value)}
        className="input-field"
      />
      <textarea
        placeholder="Description"
        value={data.description || ''}
        onChange={(e) => updateField('description', e.target.value)}
        className="input-field"
        rows={3}
      />
    </div>
  )
}

// Skills Editor
function SkillsEditor({ skills, onChange }) {
  const [inputValue, setInputValue] = useState('')

  const addSkill = () => {
    if (inputValue.trim()) {
      onChange([...skills, inputValue.trim()])
      setInputValue('')
    }
  }

  const removeSkill = (index) => {
    onChange(skills.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add skill"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addSkill()}
          className="input-field flex-1"
        />
        <button onClick={addSkill} className="btn-primary">
          <Plus size={18} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span
            key={index}
            className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-2"
          >
            {skill}
            <button onClick={() => removeSkill(index)} className="hover:text-primary-900">
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

// Project Item Editor
function ProjectItemEditor({ data, onChange, onDelete }) {
  const updateField = (field, value) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-gray-900">Project Entry</h4>
        <button onClick={onDelete} className="text-red-600 hover:text-red-700">
          <Trash2 size={18} />
        </button>
      </div>
      <input
        type="text"
        placeholder="Project Name"
        value={data.name || ''}
        onChange={(e) => updateField('name', e.target.value)}
        className="input-field"
      />
      <textarea
        placeholder="Description"
        value={data.description || ''}
        onChange={(e) => updateField('description', e.target.value)}
        className="input-field"
        rows={3}
      />
      <input
        type="text"
        placeholder="Technologies (comma separated)"
        value={data.technologies?.join(', ') || ''}
        onChange={(e) => updateField('technologies', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
        className="input-field"
      />
      <input
        type="text"
        placeholder="Project Link"
        value={data.link || ''}
        onChange={(e) => updateField('link', e.target.value)}
        className="input-field"
      />
    </div>
  )
}

// Certification Item Editor
function CertificationItemEditor({ data, onChange, onDelete }) {
  const updateField = (field, value) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-gray-900">Certification Entry</h4>
        <button onClick={onDelete} className="text-red-600 hover:text-red-700">
          <Trash2 size={18} />
        </button>
      </div>
      <input
        type="text"
        placeholder="Certification Name"
        value={data.name || ''}
        onChange={(e) => updateField('name', e.target.value)}
        className="input-field"
      />
      <input
        type="text"
        placeholder="Issuer"
        value={data.issuer || ''}
        onChange={(e) => updateField('issuer', e.target.value)}
        className="input-field"
      />
      <input
        type="text"
        placeholder="Date"
        value={data.date || ''}
        onChange={(e) => updateField('date', e.target.value)}
        className="input-field"
      />
      <input
        type="text"
        placeholder="Credential ID (optional)"
        value={data.credentialId || ''}
        onChange={(e) => updateField('credentialId', e.target.value)}
        className="input-field"
      />
    </div>
  )
}

