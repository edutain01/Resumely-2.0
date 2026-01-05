import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Plus, Upload, Trash2, Save, Eye, Download, GripVertical, ChevronDown, ChevronUp, Sparkles, FileText } from 'lucide-react'
import A4ResumeRenderer from '../../components/resume/A4ResumeRenderer'
import TemplateSelectionModal from '../../components/TemplateSelectionModal'

export default function ResumeBuilder() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [resumeTitle, setResumeTitle] = useState('New Resume')
  const [importing, setImporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const [metadata, setMetadata] = useState({
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      portfolio: '',
      summary: ''
    },
    education: [],
    experience: [],
    skills: [],
    projects: [],
    certifications: [],
    achievements: [],
    customSections: []
  })

  const [collapsedSections, setCollapsedSections] = useState({})

  // Handle file upload and import
  const handleImportResume = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document')
      return
    }

    setImporting(true)
    const formData = new FormData()
    formData.append('resume', file)

    try {
      const response = await api.post('/resumes/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        const importedData = response.data.data.metadata
        setMetadata(importedData)
        setResumeTitle(importedData.personalInfo?.fullName || importedData.personalInfo?.name ? `${importedData.personalInfo.fullName || importedData.personal Info.fullName}'s Resume` : 'Imported Resume')
        toast.success('Resume imported successfully!')
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error(error.response?.data?.message || 'Failed to import resume')
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Add new custom section
  const handleAddCustomSection = () => {
    const sectionName = prompt('Enter section name:')
    if (!sectionName) return

    const newSection = {
      id: Date.now().toString(),
      title: sectionName,
      items: []
    }

    setMetadata(prev => ({
      ...prev,
      customSections: [...prev.customSections, newSection]
    }))

    toast.success(`Custom section "${sectionName}" added! It's free!`)
  }

  // Add item to custom section
  const handleAddItemToCustomSection = (sectionId) => {
    const newItem = {
      id: Date.now().toString(),
      heading: '',
      subheading: '',
      description: '',
      date: ''
    }

    setMetadata(prev => ({
      ...prev,
      customSections: prev.customSections.map(section =>
        section.id === sectionId
          ? { ...section, items: [...section.items, newItem] }
          : section
      )
    }))
  }

  // Update custom section item
  const handleUpdateCustomSectionItem = (sectionId, itemId, field, value) => {
    setMetadata(prev => ({
      ...prev,
      customSections: prev.customSections.map(section =>
        section.id === sectionId
          ? {
            ...section,
            items: section.items.map(item =>
              item.id === itemId ? { ...item, [field]: value } : item
            )
          }
          : section
      )
    }))
  }

  // Delete custom section item
  const handleDeleteCustomSectionItem = (sectionId, itemId) => {
    setMetadata(prev => ({
      ...prev,
      customSections: prev.customSections.map(section =>
        section.id === sectionId
          ? { ...section, items: section.items.filter(item => item.id !== itemId) }
          : section
      )
    }))
  }

  // Delete custom section
  const handleDeleteCustomSection = (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return

    setMetadata(prev => ({
      ...prev,
      customSections: prev.customSections.filter(section => section.id !== sectionId)
    }))
  }

  // Update personal info
  const handleUpdatePersonalInfo = (field, value) => {
    setMetadata(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }))
  }

  // Add education
  const handleAddEducation = () => {
    setMetadata(prev => ({
      ...prev,
      education: [...prev.education, {
        id: Date.now().toString(),
        degree: '',
        institution: '',
        location: '',
        startDate: '',
        endDate: '',
        gpa: '',
        description: ''
      }]
    }))
  }

  // Update education
  const handleUpdateEducation = (id, field, value) => {
    setMetadata(prev => ({
      ...prev,
      education: prev.education.map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }))
  }

  // Delete education
  const handleDeleteEducation = (id) => {
    setMetadata(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }))
  }

  // Add experience
  const handleAddExperience = () => {
    setMetadata(prev => ({
      ...prev,
      experience: [...prev.experience, {
        id: Date.now().toString(),
        position: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: ''
      }]
    }))
  }

  // Update experience
  const handleUpdateExperience = (id, field, value) => {
    setMetadata(prev => ({
      ...prev,
      experience: prev.experience.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }))
  }

  // Delete experience
  const handleDeleteExperience = (id) => {
    setMetadata(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }))
  }

  // Add project
  const handleAddProject = () => {
    setMetadata(prev => ({
      ...prev,
      projects: [...prev.projects, {
        id: Date.now().toString(),
        name: '',
        description: '',
        technologies: [],
        link: '',
        startDate: '',
        endDate: ''
      }]
    }))
  }

  // Update project
  const handleUpdateProject = (id, field, value) => {
    setMetadata(prev => ({
      ...prev,
      projects: prev.projects.map(proj =>
        proj.id === id ? { ...proj, [field]: value } : proj
      )
    }))
  }

  // Delete project
  const handleDeleteProject = (id) => {
    setMetadata(prev => ({
      ...prev,
      projects: prev.projects.filter(proj => proj.id !== id)
    }))
  }

  // Update skills
  const handleUpdateSkills = (value) => {
    const skillsArray = value.split(',').map(s => s.trim()).filter(s => s)
    setMetadata(prev => ({
      ...prev,
      skills: skillsArray
    }))
  }

  // Toggle section collapse
  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Save resume
  const handleSaveResume = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template first')
      setShowTemplateModal(true)
      return
    }

    if (!metadata.personalInfo.fullName) {
      toast.error('Please enter your name in Personal Information')
      return
    }

    setSaving(true)
    try {
      const response = await api.post('/resumes', {
        title: resumeTitle,
        templateId: selectedTemplate,
        metadata,
        templateStyle: 'standard'
      })

      if (response.data.success) {
        toast.success('Resume created successfully!')
        navigate(`/resumes/${response.data.data.resume._id}/edit`)
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error(error.response?.data?.message || 'Failed to save resume')
    } finally {
      setSaving(false)
    }
  }

  // Export to PDF
  const handleExportPDF = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template first')
      return
    }

    try {
      // Create a temporary resume to export
      const response = await api.post('/resumes/builder/export-pdf', {
        metadata,
        templateId: selectedTemplate,
        templateStyle: 'standard'
      }, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${resumeTitle}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('PDF exported successfully')
    } catch (error) {
      toast.error('Failed to export PDF')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Resume Builder</h1>
              <p className="text-sm text-gray-600 mt-1">
                Build your resume with live preview - Custom sections are FREE!
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleImportResume}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="btn-secondary flex items-center gap-2"
              >
                <Upload size={18} />
                {importing ? 'Importing...' : 'Import Resume'}
              </button>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <FileText size={18} />
                {selectedTemplate ? 'Change Template' : 'Select Template'}
              </button>
              <button
                onClick={handleExportPDF}
                className="btn-secondary flex items-center gap-2"
              >
                <Download size={18} />
                Export PDF
              </button>
              <button
                onClick={handleSaveResume}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Resume'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Overleaf Style Split Pane */}
      <div className="h-[calc(100vh-88px)] grid grid-cols-2 gap-0">
        {/* Left Editor Panel */}
        <div className="bg-gray-50 overflow-y-auto border-r border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
            {/* Resume Title */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resume Title
              </label>
              <input
                type="text"
                value={resumeTitle}
                onChange={(e) => setResumeTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Software Engineer Resume"
              />
            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm">
              <div
                className="p-4 border-b flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection('personalInfo')}
              >
                <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                {collapsedSections.personalInfo ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </div>
              {!collapsedSections.personalInfo && (
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={metadata.personalInfo.fullName}
                        onChange={(e) => handleUpdatePersonalInfo('fullName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        value={metadata.personalInfo.email}
                        onChange={(e) => handleUpdatePersonalInfo('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={metadata.personalInfo.phone}
                        onChange={(e) => handleUpdatePersonalInfo('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={metadata.personalInfo.location}
                        onChange={(e) => handleUpdatePersonalInfo('location', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="New York, NY"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                      <input
                        type="url"
                        value={metadata.personalInfo.linkedin}
                        onChange={(e) => handleUpdatePersonalInfo('linkedin', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="linkedin.com/in/johndoe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                      <input
                        type="url"
                        value={metadata.personalInfo.github}
                        onChange={(e) => handleUpdatePersonalInfo('github', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="github.com/johndoe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Professional Summary</label>
                    <textarea
                      value={metadata.personalInfo.summary}
                      onChange={(e) => handleUpdatePersonalInfo('summary', e.target.value)}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Brief professional summary..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Education */}
            <div className="bg-white rounded-lg shadow-sm">
              <div
                className="p-4 border-b flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection('education')}
              >
                <h2 className="text-lg font-semibold text-gray-900">Education</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddEducation()
                    }}
                    className="p-1 text-primary-600 hover:bg-primary-50 rounded"
                  >
                    <Plus size={20} />
                  </button>
                  {collapsedSections.education ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </div>
              </div>
              {!collapsedSections.education && (
                <div className="p-6 space-y-4">
                  {metadata.education.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No education added yet</p>
                  ) : (
                    metadata.education.map((edu, index) => (
                      <div key={edu.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">Education {index + 1}</span>
                          <button
                            onClick={() => handleDeleteEducation(edu.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => handleUpdateEducation(edu.id, 'degree', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Degree (e.g., B.S. Computer Science)"
                          />
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => handleUpdateEducation(edu.id, 'institution', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Institution"
                          />
                          <input
                            type="text"
                            value={edu.startDate}
                            onChange={(e) => handleUpdateEducation(edu.id, 'startDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Start Date"
                          />
                          <input
                            type="text"
                            value={edu.endDate}
                            onChange={(e) => handleUpdateEducation(edu.id, 'endDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="End Date"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Experience */}
            <div className="bg-white rounded-lg shadow-sm">
              <div
                className="p-4 border-b flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection('experience')}
              >
                <h2 className="text-lg font-semibold text-gray-900">Work Experience</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddExperience()
                    }}
                    className="p-1 text-primary-600 hover:bg-primary-50 rounded"
                  >
                    <Plus size={20} />
                  </button>
                  {collapsedSections.experience ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </div>
              </div>
              {!collapsedSections.experience && (
                <div className="p-6 space-y-4">
                  {metadata.experience.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No experience added yet</p>
                  ) : (
                    metadata.experience.map((exp, index) => (
                      <div key={exp.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">Experience {index + 1}</span>
                          <button
                            onClick={() => handleDeleteExperience(exp.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={exp.position}
                            onChange={(e) => handleUpdateExperience(exp.id, 'position', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Job Title"
                          />
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => handleUpdateExperience(exp.id, 'company', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Company"
                          />
                          <input
                            type="text"
                            value={exp.startDate}
                            onChange={(e) => handleUpdateExperience(exp.id, 'startDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Start Date"
                          />
                          <input
                            type="text"
                            value={exp.endDate}
                            onChange={(e) => handleUpdateExperience(exp.id, 'endDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="End Date or Present"
                          />
                        </div>
                        <textarea
                          value={exp.description}
                          onChange={(e) => handleUpdateExperience(exp.id, 'description', e.target.value)}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Job description and responsibilities..."
                        />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Skills */}
            <div className="bg-white rounded-lg shadow-sm">
              <div
                className="p-4 border-b flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection('skills')}
              >
                <h2 className="text-lg font-semibold text-gray-900">Skills</h2>
                {collapsedSections.skills ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </div>
              {!collapsedSections.skills && (
                <div className="p-6">
                  <textarea
                    value={metadata.skills.join(', ')}
                    onChange={(e) => handleUpdateSkills(e.target.value)}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter skills separated by commas (e.g., JavaScript, React, Node.js)"
                  />
                  <p className="text-xs text-gray-500 mt-2">Separate skills with commas</p>
                </div>
              )}
            </div>

            {/* Projects */}
            <div className="bg-white rounded-lg shadow-sm">
              <div
                className="p-4 border-b flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection('projects')}
              >
                <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddProject()
                    }}
                    className="p-1 text-primary-600 hover:bg-primary-50 rounded"
                  >
                    <Plus size={20} />
                  </button>
                  {collapsedSections.projects ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </div>
              </div>
              {!collapsedSections.projects && (
                <div className="p-6 space-y-4">
                  {metadata.projects.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No projects added yet</p>
                  ) : (
                    metadata.projects.map((proj, index) => (
                      <div key={proj.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">Project {index + 1}</span>
                          <button
                            onClick={() => handleDeleteProject(proj.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={proj.name}
                          onChange={(e) => handleUpdateProject(proj.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Project Name"
                        />
                        <textarea
                          value={proj.description}
                          onChange={(e) => handleUpdateProject(proj.id, 'description', e.target.value)}
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Project description..."
                        />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Custom Sections */}
            <div className="bg-white rounded-lg shadow-sm border-2 border-primary-200">
              <div className="p-4 border-b bg-primary-50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Custom Sections</h2>
                  <p className="text-xs text-primary-600 font-medium mt-1">✨ Add unlimited custom sections - FREE!</p>
                </div>
                <button
                  onClick={handleAddCustomSection}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Plus size={18} />
                  Add Custom Section
                </button>
              </div>
              <div className="p-6 space-y-4">
                {metadata.customSections.length === 0 ? (
                  <div className="text-center py-8">
                    <Sparkles size={48} className="mx-auto text-primary-400 mb-3" />
                    <p className="text-gray-600 font-medium">No custom sections yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Add sections like Awards, Publications, Volunteer Work, etc.
                    </p>
                  </div>
                ) : (
                  metadata.customSections.map((section) => (
                    <div key={section.id} className="border border-primary-200 rounded-lg overflow-hidden">
                      <div className="bg-primary-50 p-3 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">{section.title}</h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAddItemToCustomSection(section.id)}
                            className="p-1 text-primary-600 hover:bg-primary-100 rounded"
                          >
                            <Plus size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomSection(section.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        {section.items.length === 0 ? (
                          <p className="text-gray-500 text-sm text-center py-2">No items added</p>
                        ) : (
                          section.items.map((item) => (
                            <div key={item.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <input
                                  type="text"
                                  value={item.heading}
                                  onChange={(e) => handleUpdateCustomSectionItem(section.id, item.id, 'heading', e.target.value)}
                                  className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm font-medium"
                                  placeholder="Heading"
                                />
                                <button
                                  onClick={() => handleDeleteCustomSectionItem(section.id, item.id)}
                                  className="ml-2 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <input
                                type="text"
                                value={item.subheading}
                                onChange={(e) => handleUpdateCustomSectionItem(section.id, item.id, 'subheading', e.target.value)}
                                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Subheading (optional)"
                              />
                              <input
                                type="text"
                                value={item.date}
                                onChange={(e) => handleUpdateCustomSectionItem(section.id, item.id, 'date', e.target.value)}
                                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Date (optional)"
                              />
                              <textarea
                                value={item.description}
                                onChange={(e) => handleUpdateCustomSectionItem(section.id, item.id, 'description', e.target.value)}
                                rows="2"
                                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Description (optional)"
                              />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Preview Panel */}
        <div className="bg-gray-100 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-300 px-6 py-3 z-10">
            <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
          </div>
          <div className="p-8 flex justify-center">
            {selectedTemplate ? (
              <div className="bg-white shadow-2xl" style={{ transform: 'scale(0.75)', transformOrigin: 'top center' }}>
                <A4ResumeRenderer
                  resumeData={{ metadata }}
                  templateId={selectedTemplate}
                />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText size={48} className="mx-auto mb-3 opacity-50" />
                <p>Select a template to see preview</p>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="btn-primary mt-4"
                >
                  Select Template
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
            {/* Resume Title */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resume Title
              </label>
              <input
                type="text"
                value={resumeTitle}
                onChange={(e) => setResumeTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Software Engineer Resume"
              />
            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm">
              <div
                className="p-4 border-b flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection('personalInfo')}
              >
                <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                {collapsedSections.personalInfo ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </div>
              {!collapsedSections.personalInfo && (
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={metadata.personalInfo.fullName}
                        onChange={(e) => handleUpdatePersonalInfo('fullName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        value={metadata.personalInfo.email}
                        onChange={(e) => handleUpdatePersonalInfo('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={metadata.personalInfo.phone}
                        onChange={(e) => handleUpdatePersonalInfo('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={metadata.personalInfo.location}
                        onChange={(e) => handleUpdatePersonalInfo('location', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="New York, NY"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                      <input
                        type="url"
                        value={metadata.personalInfo.linkedin}
                        onChange={(e) => handleUpdatePersonalInfo('linkedin', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="linkedin.com/in/johndoe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                      <input
                        type="url"
                        value={metadata.personalInfo.github}
                        onChange={(e) => handleUpdatePersonalInfo('github', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="github.com/johndoe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Professional Summary</label>
                    <textarea
                      value={metadata.personalInfo.summary}
                      onChange={(e) => handleUpdatePersonalInfo('summary', e.target.value)}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Brief professional summary..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Education */}
            <div className="bg-white rounded-lg shadow-sm">
              <div
                className="p-4 border-b flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection('education')}
              >
                <h2 className="text-lg font-semibold text-gray-900">Education</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddEducation()
                    }}
                    className="p-1 text-primary-600 hover:bg-primary-50 rounded"
                  >
                    <Plus size={20} />
                  </button>
                  {collapsedSections.education ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </div>
              </div>
              {!collapsedSections.education && (
                <div className="p-6 space-y-4">
                  {metadata.education.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No education added yet</p>
                  ) : (
                    metadata.education.map((edu, index) => (
                      <div key={edu.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">Education {index + 1}</span>
                          <button
                            onClick={() => handleDeleteEducation(edu.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => handleUpdateEducation(edu.id, 'degree', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Degree (e.g., B.S. Computer Science)"
                          />
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => handleUpdateEducation(edu.id, 'institution', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Institution"
                          />
                          <input
                            type="text"
                            value={edu.startDate}
                            onChange={(e) => handleUpdateEducation(edu.id, 'startDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Start Date"
                          />
                          <input
                            type="text"
                            value={edu.endDate}
                            onChange={(e) => handleUpdateEducation(edu.id, 'endDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="End Date"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Experience */}
            <div className="bg-white rounded-lg shadow-sm">
              <div
                className="p-4 border-b flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection('experience')}
              >
                <h2 className="text-lg font-semibold text-gray-900">Work Experience</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddExperience()
                    }}
                    className="p-1 text-primary-600 hover:bg-primary-50 rounded"
                  >
                    <Plus size={20} />
                  </button>
                  {collapsedSections.experience ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </div>
              </div>
              {!collapsedSections.experience && (
                <div className="p-6 space-y-4">
                  {metadata.experience.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No experience added yet</p>
                  ) : (
                    metadata.experience.map((exp, index) => (
                      <div key={exp.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">Experience {index + 1}</span>
                          <button
                            onClick={() => handleDeleteExperience(exp.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={exp.position}
                            onChange={(e) => handleUpdateExperience(exp.id, 'position', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Job Title"
                          />
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => handleUpdateExperience(exp.id, 'company', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Company"
                          />
                          <input
                            type="text"
                            value={exp.startDate}
                            onChange={(e) => handleUpdateExperience(exp.id, 'startDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Start Date"
                          />
                          <input
                            type="text"
                            value={exp.endDate}
                            onChange={(e) => handleUpdateExperience(exp.id, 'endDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="End Date or Present"
                          />
                        </div>
                        <textarea
                          value={exp.description}
                          onChange={(e) => handleUpdateExperience(exp.id, 'description', e.target.value)}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Job description and responsibilities..."
                        />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Skills */}
            <div className="bg-white rounded-lg shadow-sm">
              <div
                className="p-4 border-b flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection('skills')}
              >
                <h2 className="text-lg font-semibold text-gray-900">Skills</h2>
                {collapsedSections.skills ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </div>
              {!collapsedSections.skills && (
                <div className="p-6">
                  <textarea
                    value={metadata.skills.join(', ')}
                    onChange={(e) => handleUpdateSkills(e.target.value)}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter skills separated by commas (e.g., JavaScript, React, Node.js)"
                  />
                  <p className="text-xs text-gray-500 mt-2">Separate skills with commas</p>
                </div>
              )}
            </div>

            {/* Projects */}
            <div className="bg-white rounded-lg shadow-sm">
              <div
                className="p-4 border-b flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection('projects')}
              >
                <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddProject()
                    }}
                    className="p-1 text-primary-600 hover:bg-primary-50 rounded"
                  >
                    <Plus size={20} />
                  </button>
                  {collapsedSections.projects ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </div>
              </div>
              {!collapsedSections.projects && (
                <div className="p-6 space-y-4">
                  {metadata.projects.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No projects added yet</p>
                  ) : (
                    metadata.projects.map((proj, index) => (
                      <div key={proj.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500">Project {index + 1}</span>
                          <button
                            onClick={() => handleDeleteProject(proj.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={proj.name}
                          onChange={(e) => handleUpdateProject(proj.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Project Name"
                        />
                        <textarea
                          value={proj.description}
                          onChange={(e) => handleUpdateProject(proj.id, 'description', e.target.value)}
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Project description..."
                        />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Custom Sections */}
            <div className="bg-white rounded-lg shadow-sm border-2 border-primary-200">
              <div className="p-4 border-b bg-primary-50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Custom Sections</h2>
                  <p className="text-xs text-primary-600 font-medium mt-1">✨ Add unlimited custom sections - FREE!</p>
                </div>
                <button
                  onClick={handleAddCustomSection}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Plus size={18} />
                  Add Custom Section
                </button>
              </div>
              <div className="p-6 space-y-4">
                {metadata.customSections.length === 0 ? (
                  <div className="text-center py-8">
                    <Sparkles size={48} className="mx-auto text-primary-400 mb-3" />
                    <p className="text-gray-600 font-medium">No custom sections yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Add sections like Awards, Publications, Volunteer Work, etc.
                    </p>
                  </div>
                ) : (
                  metadata.customSections.map((section) => (
                    <div key={section.id} className="border border-primary-200 rounded-lg overflow-hidden">
                      <div className="bg-primary-50 p-3 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">{section.title}</h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAddItemToCustomSection(section.id)}
                            className="p-1 text-primary-600 hover:bg-primary-100 rounded"
                          >
                            <Plus size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomSection(section.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        {section.items.length === 0 ? (
                          <p className="text-gray-500 text-sm text-center py-2">No items added</p>
                        ) : (
                          section.items.map((item) => (
                            <div key={item.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <input
                                  type="text"
                                  value={item.heading}
                                  onChange={(e) => handleUpdateCustomSectionItem(section.id, item.id, 'heading', e.target.value)}
                                  className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm font-medium"
                                  placeholder="Heading"
                                />
                                <button
                                  onClick={() => handleDeleteCustomSectionItem(section.id, item.id)}
                                  className="ml-2 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <input
                                type="text"
                                value={item.subheading}
                                onChange={(e) => handleUpdateCustomSectionItem(section.id, item.id, 'subheading', e.target.value)}
                                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Subheading (optional)"
                              />
                              <input
                                type="text"
                                value={item.date}
                                onChange={(e) => handleUpdateCustomSectionItem(section.id, item.id, 'date', e.target.value)}
                                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Date (optional)"
                              />
                              <textarea
                                value={item.description}
                                onChange={(e) => handleUpdateCustomSectionItem(section.id, item.id, 'description', e.target.value)}
                                rows="2"
                                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Description (optional)"
                              />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="sticky top-24 h-fit">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                {selectedTemplate ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="transform scale-75 origin-top-left" style={{ width: '133.33%', height: 'auto' }}>
                      <A4ResumeRenderer
                        resumeData={{ metadata, templateStyle: 'standard' }}
                        templateId={selectedTemplate}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText size={48} className="mx-auto mb-3 opacity-50" />
                    <p>Select a template to see preview</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <TemplateSelectionModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          onSelect={(templateId) => {
            setSelectedTemplate(templateId)
            setShowTemplateModal(false)
            toast.success('Template selected!')
          }}
        />
      )}
    </div>
  )
}

