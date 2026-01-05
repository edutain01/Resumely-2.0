import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { fetchCurrentUser } from '../../store/slices/authSlice'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Plus, Upload, Trash2, Save, Download, ChevronDown, ChevronUp, Sparkles, FileText, Zap, ZoomIn, ZoomOut, RotateCcw, Wand2 } from 'lucide-react'
import A4PageRenderer from '../../components/resume/A4PageRenderer'
import TemplateSelectionModal from '../../components/TemplateSelectionModal'
import CustomSectionModal from '../../components/CustomSectionModal'
import SaveAsModal from '../../components/SaveAsModal'
import SaveOptionsModal from '../../components/SaveOptionsModal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ConfirmationModal from '../../components/ui/ConfirmationModal'
import EnhancementDetailsModal from '../../components/EnhancementDetailsModal'
import AnalysisLoadingModal from '../../components/ui/AnalysisLoadingModal'

export default function ResumeBuilder() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { user } = useSelector((state) => state.auth)
    const [searchParams] = useSearchParams()
    const fileInputRef = useRef(null)
    const resumeId = searchParams.get('id') // Get resume ID from URL if editing

    const [showTemplateModal, setShowTemplateModal] = useState(false)
    const [showCustomSectionModal, setShowCustomSectionModal] = useState(false)
    const [showSaveAsModal, setShowSaveAsModal] = useState(false)
    const [showSaveOptionsModal, setShowSaveOptionsModal] = useState(false)
    const [showEnhancementModal, setShowEnhancementModal] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState(null)
    const [savedResumes, setSavedResumes] = useState([])
    const [loadingResumes, setLoadingResumes] = useState(false)
    const [loadingTemplate, setLoadingTemplate] = useState(true)
    const [loadingResume, setLoadingResume] = useState(false)
    const [currentResumeId, setCurrentResumeId] = useState(resumeId || null) // Track if editing existing resume
    const [resumeTitle, setResumeTitle] = useState('New Resume')
    const [importing, setImporting] = useState(false)
    const [saving, setSaving] = useState(false)
    const [enhancing, setEnhancing] = useState(false)
    const [autoSaving, setAutoSaving] = useState(false)
    const [enhancementProgress, setEnhancementProgress] = useState(0)
    const [templateStyle, setTemplateStyle] = useState('standard') // Track template style name for preview
    const [previewZoom, setPreviewZoom] = useState(50) // Zoom level: 50-150% (start at 50% to see full page)

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
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning',
        onConfirm: null
    })

    // Load resume data if editing existing resume, or load default template for new resume
    useEffect(() => {
        const loadData = async () => {
            if (resumeId) {
                // Load existing resume
                setLoadingResume(true)
                try {
                    const response = await api.get(`/resumes/${resumeId}`)
                    if (response.data.success) {
                        const resumeData = response.data.data.resume
                        setCurrentResumeId(resumeData._id)
                        setResumeTitle(resumeData.title || 'Untitled Resume')
                        const templateId = resumeData.templateId?._id || resumeData.templateId || null
                        setSelectedTemplate(templateId)
                        
                        // Map template to style name for preview
                        if (templateId) {
                            try {
                                const templateResponse = await api.get('/resumes/templates')
                                if (templateResponse.data.success) {
                                    const template = templateResponse.data.data.templates.find(t => t._id === templateId)
                                    if (template) {
                                        const styleMap = {
                                            'Standard': 'standard',
                                            'Modern': 'modern',
                                            'Minimal': 'minimal',
                                            'Professional': 'professional'
                                        }
                                        const styleName = styleMap[template.name] || template.category?.toLowerCase() || resumeData.templateStyle || 'standard'
                                        setTemplateStyle(styleName)
                                    } else {
                                        // Fallback to saved templateStyle if template not found
                                        setTemplateStyle(resumeData.templateStyle || 'standard')
                                    }
                                }
                            } catch (error) {
                                console.error('Failed to fetch template details:', error)
                                // Fallback to saved templateStyle
                                setTemplateStyle(resumeData.templateStyle || 'standard')
                            }
                        } else {
                            // No template ID, use saved templateStyle or default
                            setTemplateStyle(resumeData.templateStyle || 'standard')
                        }
                        
                        // Load metadata
                        if (resumeData.metadata) {
                            const loadedMetadata = {
                                personalInfo: {
                                    fullName: resumeData.metadata.personalInfo?.fullName || resumeData.metadata.personalInfo?.name || '',
                                    email: resumeData.metadata.personalInfo?.email || '',
                                    phone: resumeData.metadata.personalInfo?.phone || '',
                                    location: resumeData.metadata.personalInfo?.location || '',
                                    linkedin: resumeData.metadata.personalInfo?.linkedin || '',
                                    github: resumeData.metadata.personalInfo?.github || '',
                                    portfolio: resumeData.metadata.personalInfo?.portfolio || '',
                                    summary: resumeData.metadata.personalInfo?.summary || ''
                                },
                                education: Array.isArray(resumeData.metadata.education) ? resumeData.metadata.education : [],
                                experience: Array.isArray(resumeData.metadata.experience) ? resumeData.metadata.experience : [],
                                skills: Array.isArray(resumeData.metadata.skills) ? resumeData.metadata.skills : [],
                                projects: Array.isArray(resumeData.metadata.projects) ? resumeData.metadata.projects : [],
                                certifications: Array.isArray(resumeData.metadata.certifications) ? resumeData.metadata.certifications : [],
                                achievements: Array.isArray(resumeData.metadata.achievements) ? resumeData.metadata.achievements : [],
                                customSections: Array.isArray(resumeData.metadata.customSections) ? resumeData.metadata.customSections : []
                            }
                            setMetadata(loadedMetadata)
                        }
                        // Don't show toast on initial load to avoid duplicate notifications
                    }
                } catch (error) {
                    console.error('Failed to load resume:', error)
                    toast.error('Failed to load resume')
                } finally {
                    setLoadingResume(false)
                    setLoadingTemplate(false)
                }
            } else {
                // Load default template for new resume
                try {
                    const response = await api.get('/resumes/templates')
                    if (response.data.success && response.data.data.templates.length > 0) {
                        const defaultTemplate = response.data.data.templates.find(t => t.isDefault) || 
                                               response.data.data.templates.find(t => t.isActive) ||
                                               response.data.data.templates[0]
                        if (defaultTemplate) {
                            setSelectedTemplate(defaultTemplate._id)
                            console.log('Loaded default template:', defaultTemplate._id, defaultTemplate.name)
                        }
                    }
                } catch (error) {
                    console.error('Failed to load templates:', error)
                } finally {
                    setLoadingTemplate(false)
                }
            }
        }
        loadData()
    }, [resumeId])

    // Fetch saved resumes for dropdown
    useEffect(() => {
        const fetchSavedResumes = async () => {
            setLoadingResumes(true)
            try {
                const response = await api.get('/resumes')
                if (response.data.success) {
                    setSavedResumes(response.data.data.resumes || [])
                }
            } catch (error) {
                console.error('Failed to fetch resumes:', error)
            } finally {
                setLoadingResumes(false)
            }
        }
        fetchSavedResumes()
    }, [])

    // Handle resume selection from dropdown
    const handleResumeSelect = (selectedId) => {
        if (selectedId && selectedId !== currentResumeId) {
            navigate(`/resume-builder?id=${selectedId}`, { replace: true })
        }
    }

    // Handle file upload and import
    const handleImportResume = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

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
                
                console.log('Raw imported data from backend:', importedData)
                console.log('Sections found:', {
                    education: importedData.education?.length || 0,
                    experience: importedData.experience?.length || 0,
                    skills: importedData.skills?.length || 0,
                    projects: importedData.projects?.length || 0,
                    certifications: importedData.certifications?.length || 0,
                    achievements: importedData.achievements?.length || 0,
                    customSections: importedData.customSections?.length || 0
                })
                console.log('PROJECTS DETAIL:', importedData.projects)
                console.log('CERTIFICATIONS DETAIL:', importedData.certifications)
                console.log('ACHIEVEMENTS DETAIL:', importedData.achievements)
                console.log('CUSTOM SECTIONS DETAIL:', importedData.customSections)
                
                // Normalize and map all fields correctly
                const normalizeEducation = (edu) => ({
                    id: edu.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    degree: edu.degree || '',
                    institution: edu.institution || '',
                    location: edu.location || '',
                    startDate: edu.startDate || '',
                    endDate: edu.endDate || '',
                    gpa: edu.gpa || '',
                    description: edu.description || ''
                })

                const normalizeExperience = (exp) => ({
                    id: exp.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    position: exp.position || exp.title || '', // Map title to position
                    company: exp.company || '',
                    location: exp.location || '',
                    startDate: exp.startDate || '',
                    endDate: exp.endDate || '',
                    current: exp.current || false,
                    description: exp.description || '',
                    achievements: Array.isArray(exp.achievements) ? exp.achievements : []
                })

                const normalizeProject = (proj) => ({
                    id: proj.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: proj.name || '',
                    description: proj.description || '',
                    technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
                    link: proj.link || '',
                    startDate: proj.startDate || '',
                    endDate: proj.endDate || ''
                })

                const normalizeCertification = (cert) => ({
                    id: cert.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: cert.name || '',
                    issuer: cert.issuer || '',
                    date: cert.date || '',
                    expiryDate: cert.expiryDate || '',
                    credentialId: cert.credentialId || ''
                })

                const normalizeCustomSection = (section) => ({
                    id: section.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    title: section.title || 'Untitled Section',
                    items: Array.isArray(section.items) ? section.items.map(item => ({
                        id: item.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        heading: item.heading || '',
                        subheading: item.subheading || '',
                        description: item.description || '',
                        date: item.date || ''
                    })) : []
                })

                // Ensure all fields exist with proper structure
                const normalizedData = {
                    personalInfo: {
                        fullName: importedData.personalInfo?.fullName || importedData.personalInfo?.name || '',
                        email: importedData.personalInfo?.email || '',
                        phone: importedData.personalInfo?.phone || '',
                        location: importedData.personalInfo?.location || '',
                        linkedin: importedData.personalInfo?.linkedin || '',
                        github: importedData.personalInfo?.github || '',
                        portfolio: importedData.personalInfo?.portfolio || '',
                        summary: importedData.personalInfo?.summary || ''
                    },
                    education: Array.isArray(importedData.education) 
                        ? importedData.education.map(normalizeEducation) 
                        : [],
                    experience: Array.isArray(importedData.experience) 
                        ? importedData.experience.map(normalizeExperience) 
                        : [],
                    skills: Array.isArray(importedData.skills) 
                        ? importedData.skills.filter(s => s && s.trim()) 
                        : [],
                    projects: Array.isArray(importedData.projects) 
                        ? importedData.projects.map(normalizeProject) 
                        : [],
                    certifications: Array.isArray(importedData.certifications) 
                        ? importedData.certifications.map(normalizeCertification) 
                        : [],
                    achievements: Array.isArray(importedData.achievements) 
                        ? importedData.achievements.filter(a => a && (typeof a === 'string' ? a.trim() : true)).map(a => typeof a === 'string' ? a.trim() : a)
                        : [],
                    customSections: Array.isArray(importedData.customSections) 
                        ? importedData.customSections.map(normalizeCustomSection) 
                        : []
                }
                
                console.log('Normalized imported data:', normalizedData)
                setMetadata(normalizedData)
                const name = normalizedData.personalInfo.fullName
                setResumeTitle(name ? `${name}'s Resume` : 'Imported Resume')
                toast.success(`Resume imported successfully! Found ${normalizedData.education.length} education, ${normalizedData.experience.length} experience, ${normalizedData.customSections.length} custom sections.`)
            } else {
                toast.error(response.data.message || 'Failed to import resume')
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
            projects: prev.projects.map(proj => {
                if (proj.id === id) {
                    // Special handling for technologies field - ensure it's always an array
                    if (field === 'technologies') {
                        let techArray = [];
                        if (Array.isArray(value)) {
                            techArray = value;
                        } else if (typeof value === 'string') {
                            // Split comma-separated string into array
                            techArray = value.split(',').map(t => t.trim()).filter(t => t);
                        }
                        return { ...proj, [field]: techArray };
                    }
                    return { ...proj, [field]: value };
                }
                return proj;
            })
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

    // Add certification
    const handleAddCertification = () => {
        setMetadata(prev => ({
            ...prev,
            certifications: [...prev.certifications, {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                name: '',
                issuer: '',
                date: '',
                expiryDate: '',
                credentialId: ''
            }]
        }))
    }

    // Update certification
    const handleUpdateCertification = (id, field, value) => {
        setMetadata(prev => ({
            ...prev,
            certifications: prev.certifications.map(cert =>
                cert.id === id ? { ...cert, [field]: value } : cert
            )
        }))
    }

    // Delete certification
    const handleDeleteCertification = (id) => {
        setMetadata(prev => ({
            ...prev,
            certifications: prev.certifications.filter(cert => cert.id !== id)
        }))
    }

    // Add achievement
    const handleAddAchievement = () => {
        setMetadata(prev => ({
            ...prev,
            achievements: [...prev.achievements, '']
        }))
    }

    // Update achievement
    const handleUpdateAchievement = (index, value) => {
        setMetadata(prev => ({
            ...prev,
            achievements: prev.achievements.map((ach, i) => i === index ? value : ach)
        }))
    }

    // Delete achievement
    const handleDeleteAchievement = (index) => {
        setMetadata(prev => ({
            ...prev,
            achievements: prev.achievements.filter((_, i) => i !== index)
        }))
    }

    // Add custom section
    const handleAddCustomSection = () => {
        setShowCustomSectionModal(true)
    }

    // Confirm custom section creation
    const handleConfirmCustomSection = (sectionName) => {
        const newSection = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            title: sectionName,
            items: []
        }

        setMetadata(prev => {
            const updated = {
            ...prev,
                customSections: [...(prev.customSections || []), newSection]
            }
            console.log('Added custom section:', newSection, 'Total sections:', updated.customSections.length)
            return updated
        })

        toast.success(`Custom section "${sectionName}" added!`)
    }

    // Add item to custom section
    const handleAddItemToCustomSection = (sectionId) => {
        const newItem = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            heading: '',
            subheading: '',
            description: '',
            date: ''
        }

        setMetadata(prev => {
            const updated = {
            ...prev,
                customSections: (prev.customSections || []).map(section =>
                section.id === sectionId
                        ? { ...section, items: [...(section.items || []), newItem] }
                    : section
            )
            }
            console.log('Added item to section:', sectionId, 'New item:', newItem)
            return updated
        })
    }

    // Update custom section item
    const handleUpdateCustomSectionItem = (sectionId, itemId, field, value) => {
        setMetadata(prev => ({
            ...prev,
            customSections: (prev.customSections || []).map(section =>
                section.id === sectionId
                    ? {
                        ...section,
                        items: (section.items || []).map(item =>
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
            customSections: (prev.customSections || []).map(section =>
                section.id === sectionId
                    ? { ...section, items: (section.items || []).filter(item => item.id !== itemId) }
                    : section
            )
        }))
    }

    // Delete custom section
    const handleDeleteCustomSection = (sectionId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Custom Section',
            message: 'Are you sure you want to delete this section? This action cannot be undone.',
            type: 'warning',
            onConfirm: () => {
                setMetadata(prev => ({
                    ...prev,
                    customSections: (prev.customSections || []).filter(section => section.id !== sectionId)
                }))
                
                toast.success('Section deleted')
                setConfirmModal({ isOpen: false })
            }
        })
    }

    // Toggle section collapse
    const toggleSection = (section) => {
        setCollapsedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }))
    }

    // Save resume (update existing or create new)
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

        // If resume is already saved, show options modal
        if (currentResumeId) {
            setShowSaveOptionsModal(true)
            return
        }

        // For new resumes, save directly
        await performSave(false)
    }

    // Perform the actual save operation
    const performSave = async (isNewCopy = false) => {
        setSaving(true)
        try {
            // Get template style name from selected template
            let templateStyleName = templateStyle || 'standard'
            if (!currentResumeId || isNewCopy) {
                // For new resumes, fetch template details to get style name
                try {
                    const templateResponse = await api.get('/resumes/templates')
                    if (templateResponse.data.success) {
                        const template = templateResponse.data.data.templates.find(t => t._id === selectedTemplate)
                        if (template) {
                            const styleMap = {
                                'Standard': 'standard',
                                'Modern': 'modern',
                                'Minimal': 'minimal',
                                'Professional': 'professional'
                            }
                            templateStyleName = styleMap[template.name] || template.category?.toLowerCase() || 'standard'
                            setTemplateStyle(templateStyleName)
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch template details:', error)
                }
            }

            if (currentResumeId && !isNewCopy) {
                // Update existing resume - also update template if changed
                const response = await api.put(`/resumes/${currentResumeId}`, {
                    title: resumeTitle,
                    metadata,
                    templateStyle: templateStyleName,
                    templateId: selectedTemplate // Update template if changed
                })

                if (response.data.success) {
                    toast.success('Resume saved successfully!')
                    setShowSaveOptionsModal(false)
                }
            } else {
                // Create new resume
                const response = await api.post('/resumes', {
                    title: resumeTitle,
                    templateId: selectedTemplate,
                    metadata,
                    templateStyle: templateStyleName
                })

                if (response.data.success) {
                    setCurrentResumeId(response.data.data.resume._id)
                    toast.success('Resume created successfully!')
                    // Update URL without navigation
                    navigate(`/resume-builder?id=${response.data.data.resume._id}`, { replace: true })
                    setShowSaveOptionsModal(false)
                }
            }
        } catch (error) {
            console.error('Save error:', error)
            toast.error(error.response?.data?.message || 'Failed to save resume')
        } finally {
            setSaving(false)
        }
    }

    // Handle save new from modal
    const handleSaveNewFromModal = async () => {
        setShowSaveOptionsModal(false)
        await performSave(true) // This will create a new resume
    }

    // Save As Confirm (kept for SaveAsModal if needed elsewhere)
    const handleSaveAsConfirm = async (newTitle) => {
        if (!newTitle || !newTitle.trim()) {
            return
        }

        setSaving(true)
        try {
            // Get template style name from selected template
            let templateStyleName = 'standard'
            try {
                const templateResponse = await api.get('/resumes/templates')
                if (templateResponse.data.success) {
                    const template = templateResponse.data.data.templates.find(t => t._id === selectedTemplate)
                    if (template) {
                        const styleMap = {
                            'Standard': 'standard',
                            'Modern': 'modern',
                            'Minimal': 'minimal',
                            'Professional': 'professional'
                        }
                        templateStyleName = styleMap[template.name] || template.category?.toLowerCase() || 'standard'
                    }
                }
            } catch (error) {
                console.error('Failed to fetch template details:', error)
            }

            const response = await api.post('/resumes', {
                title: newTitle.trim(),
                templateId: selectedTemplate,
                metadata,
                templateStyle: templateStyleName
            })

            if (response.data.success) {
                setCurrentResumeId(response.data.data.resume._id)
                setResumeTitle(newTitle.trim())
                toast.success('Resume saved as new copy!')
                navigate(`/resume-builder?id=${response.data.data.resume._id}`, { replace: true })
            }
        } catch (error) {
            console.error('Save As error:', error)
            toast.error(error.response?.data?.message || 'Failed to save resume')
        } finally {
            setSaving(false)
        }
    }

    // Export to PDF using server-side generation (preserves text selectability and clickable links)
    const handleExportPDF = async () => {
        if (!selectedTemplate) {
            toast.error('Please select a template first')
            setShowTemplateModal(true)
            return
        }

        try {
            toast.loading('Generating PDF...', { id: 'pdf-export' })

            // Use server-side PDF generation (Puppeteer) - preserves text selectability and clickable links
            const response = await api.post(
                '/resumes/builder/export-pdf',
                {
                    metadata,
                    templateId: selectedTemplate,
                    templateStyle: templateStyle,
                    title: resumeTitle || 'resume'
                },
                {
                    responseType: 'blob' // Important for binary PDF data
                }
            )

            // Create blob and download
            const blob = new Blob([response.data], { type: 'application/pdf' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${(resumeTitle || 'resume').replace(/[^a-z0-9]/gi, '_')}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
            
            toast.success('PDF exported successfully!', { id: 'pdf-export' })
        } catch (error) {
            console.error('PDF Export Error:', error)
            toast.error(error.response?.data?.message || error.message || 'Failed to export PDF', { id: 'pdf-export' })
        }
    }

    // Enhance resume with AI (charges 5 credits)
    const handleEnhanceResume = async () => {
        const ENHANCEMENT_COST = 5;
        
        if (!user) {
            toast.error('Please log in to use this feature')
            return
        }

        if (user.credits < ENHANCEMENT_COST) {
            toast.error(`Insufficient credits. ${ENHANCEMENT_COST} credits required. You have ${user.credits} credits.`, {
                duration: 5000
            })
            return
        }

        if (!metadata.personalInfo?.fullName) {
            toast.error('Please add at least your name before enhancing')
            return
        }

        // Show enhancement details modal
        setShowEnhancementModal(true)
    }

    const performEnhancement = async (enhancementDetails = '') => {
        const ENHANCEMENT_COST = 5;
        
        setEnhancing(true)
        setShowEnhancementModal(false) // Close modal immediately when starting
        setEnhancementProgress(0)
        
        // Simulate progress
        const progressInterval = setInterval(() => {
            setEnhancementProgress((prev) => {
                if (prev >= 90) {
                    return 90 // Hold at 90% until API completes
                }
                const increment = Math.random() * 8 + 2
                return Math.min(prev + increment, 90)
            })
        }, 300)
        
        try {
            const response = await api.post('/resumes/builder/enhance', {
                metadata,
                enhancementDetails: enhancementDetails || undefined // Pass optional enhancement details
            })

            // Complete progress
            clearInterval(progressInterval)
            setEnhancementProgress(100)

            if (response.data.success && response.data.data.metadata) {
                // Update metadata with enhanced data
                setMetadata(response.data.data.metadata)
                // Refresh user credits
                await dispatch(fetchCurrentUser())
                
                // Wait a moment for modal to show completion, then close
                setTimeout(() => {
                    setEnhancing(false)
                    setEnhancementProgress(0)
                    toast.success(`Resume enhanced! ${ENHANCEMENT_COST} credits used. ${response.data.data.creditsRemaining} credits remaining.`, {
                        duration: 4000
                    })
                }, 1000)
            } else {
                clearInterval(progressInterval)
                setEnhancing(false)
                setEnhancementProgress(0)
                throw new Error('Invalid response from server')
            }
        } catch (error) {
            clearInterval(progressInterval)
            setEnhancing(false)
            setEnhancementProgress(0)
            console.error('Enhance error:', error)
            // Reopen modal if enhancement failed (except for validation errors)
            if (error.response?.status !== 400) {
                setShowEnhancementModal(true)
            }
            if (error.response?.data?.message) {
                toast.error(error.response.data.message)
            } else {
                toast.error('Failed to enhance resume. Please try again.')
            }
        }
    }

    return (
        <div 
            className="h-screen w-full flex flex-col bg-neutral-50 overflow-hidden"
            style={{ 
                boxSizing: 'border-box',
                minWidth: 0,
                maxWidth: '100%',
                maxHeight: '100vh',
                height: '100vh'
            }}
        >
            {/* Top Toolbar */}
            <div 
                className="flex-shrink-0 bg-white border-b border-neutral-200 px-4 md:px-6 py-3 md:py-4 shadow-sm"
                style={{ boxSizing: 'border-box', minWidth: 0 }}
            >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-4" style={{ boxSizing: 'border-box' }}>
                    {/* Left: Title */}
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 overflow-hidden" style={{ minWidth: 0, maxWidth: 'calc(100% - 20px)' }}>
                        <h1 className="text-lg md:text-xl font-heading font-bold text-gradient whitespace-nowrap flex-shrink-0">Resume Builder</h1>
                        <div className="h-6 w-px bg-neutral-200 hidden md:block flex-shrink-0" />
                        {/* Resume Selector Dropdown */}
                        <select
                            value={currentResumeId || ''}
                            onChange={(e) => handleResumeSelect(e.target.value)}
                            className="bg-transparent text-neutral-700 font-medium focus:outline-none focus:text-primary-600 transition-colors px-2 py-1 min-w-[100px] md:min-w-[140px] max-w-[140px] border border-neutral-200 rounded-md text-sm cursor-pointer hover:border-primary-300 flex-shrink-0"
                            style={{ boxSizing: 'border-box' }}
                            disabled={loadingResumes}
                        >
                            <option value="">{loadingResumes ? 'Loading...' : 'Select Resume'}</option>
                            {savedResumes.map((resume) => (
                                <option key={resume._id} value={resume._id}>
                                    {resume.title || 'Untitled Resume'}
                                </option>
                            ))}
                        </select>
                        <div className="h-6 w-px bg-neutral-200 hidden md:block flex-shrink-0" />
                        <input
                            type="text"
                            value={resumeTitle}
                            onChange={(e) => setResumeTitle(e.target.value)}
                            className="bg-transparent text-neutral-900 font-medium focus:outline-none focus:text-primary-600 transition-colors px-2 py-1 min-w-[100px] md:min-w-[120px] max-w-[200px] flex-shrink"
                            placeholder="Untitled Resume"
                            style={{ boxSizing: 'border-box', minWidth: 0 }}
                        />
                        {autoSaving && (
                            <div className="flex items-center gap-2 text-xs text-neutral-500 flex-shrink-0 ml-2">
                                <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                                <span className="hidden sm:inline">Auto-saving...</span>
                            </div>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div 
                        className="flex items-center gap-1.5 md:gap-2 flex-shrink-0 flex-nowrap"
                        style={{ boxSizing: 'border-box' }}
                    >
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
                            className="btn-ghost flex items-center gap-1.5 text-xs md:text-sm px-2 md:px-3 py-2 whitespace-nowrap flex-shrink-0"
                        >
                            {importing ? <LoadingSpinner size="sm" /> : <Upload size={14} className="md:w-4 md:h-4" />}
                            <span className="hidden sm:inline">{importing ? 'Importing...' : 'Import'}</span>
                        </button>
                        <button
                            onClick={() => setShowTemplateModal(true)}
                            className="btn-ghost flex items-center gap-1.5 text-xs md:text-sm px-2 md:px-3 py-2 whitespace-nowrap flex-shrink-0"
                        >
                            <FileText size={14} className="md:w-4 md:h-4" />
                            <span className="hidden lg:inline">{selectedTemplate ? 'Change Template' : 'Select Template'}</span>
                            <span className="lg:hidden hidden md:inline">Template</span>
                        </button>
                        <button
                            onClick={handleEnhanceResume}
                            disabled={enhancing || !user || (user?.credits || 0) < 5}
                            className="btn-secondary flex items-center gap-1.5 text-xs md:text-sm px-2 md:px-3 py-2 disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                            title={user && (user.credits || 0) < 5 ? '5 credits required' : 'Enhance resume with AI (5 credits)'}
                        >
                            {enhancing ? <LoadingSpinner size="sm" /> : <Wand2 size={14} className="md:w-4 md:h-4" />}
                            <span className="hidden sm:inline">{enhancing ? 'Enhancing...' : 'Enhance'}</span>
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="btn-secondary flex items-center gap-1.5 text-xs md:text-sm px-2 md:px-3 py-2 whitespace-nowrap flex-shrink-0"
                        >
                            <Download size={14} className="md:w-4 md:h-4" />
                            <span className="hidden sm:inline">Export PDF</span>
                        </button>
                        <button
                            onClick={handleSaveResume}
                            disabled={saving}
                            className="btn-primary flex items-center gap-1.5 text-xs md:text-sm px-2 md:px-3 py-2 disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                        >
                            {saving ? <LoadingSpinner size="sm" color="white" /> : <Save size={14} className="md:w-4 md:h-4" />}
                            <span className="hidden sm:inline">{saving ? 'Saving...' : (currentResumeId ? 'Save' : 'Save Resume')}</span>
                            <span className="sm:hidden">{saving ? 'Saving...' : 'Save'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Overleaf-Style Split Pane */}
            <div 
                className="flex-1 flex flex-col lg:flex-row overflow-hidden"
                style={{ 
                    boxSizing: 'border-box',
                    minWidth: 0,
                    minHeight: 0
                }}
            >
                {/* Left Editor Panel */}
                <div 
                    className="w-full lg:w-1/2 bg-white overflow-y-auto overflow-x-hidden border-r border-neutral-200 flex flex-col h-full"
                    style={{ 
                        boxSizing: 'border-box',
                        minWidth: 0,
                        maxWidth: '50%',
                        height: '100%',
                        maxHeight: '100%',
                        overscrollBehavior: 'contain' // Prevent scroll chaining
                    }}
                    onWheel={(e) => {
                        // Prevent scroll from bubbling to parent
                        const element = e.currentTarget
                        const { scrollTop, scrollHeight, clientHeight } = element
                        const isAtTop = scrollTop === 0
                        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1
                        
                        // Only prevent propagation if we're not at the boundaries
                        if (!(isAtTop && e.deltaY < 0) && !(isAtBottom && e.deltaY > 0)) {
                            e.stopPropagation()
                        }
                    }}
                >
                    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto w-full" style={{ boxSizing: 'border-box' }}>
                        {/* Personal Information Section */}
                        <Section
                            title="Personal Information"
                            icon={<Sparkles size={20} />}
                            collapsed={collapsedSections.personalInfo}
                            onToggle={() => toggleSection('personalInfo')}
                        >
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField
                                        label="Full Name *"
                                        value={metadata.personalInfo.fullName}
                                        onChange={(e) => handleUpdatePersonalInfo('fullName', e.target.value)}
                                        placeholder="John Doe"
                                    />
                                    <InputField
                                        label="Email *"
                                        type="email"
                                        value={metadata.personalInfo.email}
                                        onChange={(e) => handleUpdatePersonalInfo('email', e.target.value)}
                                        placeholder="john@example.com"
                                    />
                                    <InputField
                                        label="Phone"
                                        type="tel"
                                        value={metadata.personalInfo.phone}
                                        onChange={(e) => handleUpdatePersonalInfo('phone', e.target.value)}
                                        placeholder="+1 (555) 123-4567"
                                    />
                                    <InputField
                                        label="Location"
                                        value={metadata.personalInfo.location}
                                        onChange={(e) => handleUpdatePersonalInfo('location', e.target.value)}
                                        placeholder="New York, NY"
                                    />
                                    <InputField
                                        label="LinkedIn"
                                        value={metadata.personalInfo.linkedin}
                                        onChange={(e) => handleUpdatePersonalInfo('linkedin', e.target.value)}
                                        placeholder="linkedin.com/in/johndoe"
                                    />
                                    <InputField
                                        label="GitHub"
                                        value={metadata.personalInfo.github}
                                        onChange={(e) => handleUpdatePersonalInfo('github', e.target.value)}
                                        placeholder="github.com/johndoe"
                                    />
                                </div>
                                <TextAreaField
                                    label="Professional Summary"
                                    value={metadata.personalInfo.summary}
                                    onChange={(e) => handleUpdatePersonalInfo('summary', e.target.value)}
                                    placeholder="Brief professional summary..."
                                    rows={4}
                                />
                            </div>
                        </Section>

                        {/* Education Section */}
                        <Section
                            title="Education"
                            icon={<Plus size={20} />}
                            collapsed={collapsedSections.education}
                            onToggle={() => toggleSection('education')}
                            onAdd={handleAddEducation}
                        >
                            {metadata.education.length === 0 ? (
                                <EmptyMessage message="No education added yet" />
                            ) : (
                                <div className="space-y-4">
                                    {metadata.education.map((edu, index) => (
                                        <ItemCard
                                            key={edu.id}
                                            title={`Education ${index + 1}`}
                                            onDelete={() => handleDeleteEducation(edu.id)}
                                        >
                                            <div className="grid grid-cols-2 gap-3">
                                                <InputField
                                                    label="Degree"
                                                    value={edu.degree}
                                                    onChange={(e) => handleUpdateEducation(edu.id, 'degree', e.target.value)}
                                                    placeholder="B.S. Computer Science"
                                                    size="sm"
                                                />
                                                <InputField
                                                    label="Institution"
                                                    value={edu.institution}
                                                    onChange={(e) => handleUpdateEducation(edu.id, 'institution', e.target.value)}
                                                    placeholder="University Name"
                                                    size="sm"
                                                />
                                                <InputField
                                                    label="Start Date"
                                                    value={edu.startDate}
                                                    onChange={(e) => handleUpdateEducation(edu.id, 'startDate', e.target.value)}
                                                    placeholder="Sep 2018"
                                                    size="sm"
                                                />
                                                <InputField
                                                    label="End Date"
                                                    value={edu.endDate}
                                                    onChange={(e) => handleUpdateEducation(edu.id, 'endDate', e.target.value)}
                                                    placeholder="May 2022"
                                                    size="sm"
                                                />
                                            </div>
                                        </ItemCard>
                                    ))}
                                </div>
                            )}
                        </Section>

                        {/* Experience Section */}
                        <Section
                            title="Work Experience"
                            icon={<Plus size={20} />}
                            collapsed={collapsedSections.experience}
                            onToggle={() => toggleSection('experience')}
                            onAdd={handleAddExperience}
                        >
                            {metadata.experience.length === 0 ? (
                                <EmptyMessage message="No experience added yet" />
                            ) : (
                                <div className="space-y-4">
                                    {metadata.experience.map((exp, index) => (
                                        <ItemCard
                                            key={exp.id}
                                            title={`Experience ${index + 1}`}
                                            onDelete={() => handleDeleteExperience(exp.id)}
                                        >
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <InputField
                                                        label="Job Title"
                                                        value={exp.position}
                                                        onChange={(e) => handleUpdateExperience(exp.id, 'position', e.target.value)}
                                                        placeholder="Software Engineer"
                                                        size="sm"
                                                    />
                                                    <InputField
                                                        label="Company"
                                                        value={exp.company}
                                                        onChange={(e) => handleUpdateExperience(exp.id, 'company', e.target.value)}
                                                        placeholder="Tech Corp"
                                                        size="sm"
                                                    />
                                                    <InputField
                                                        label="Start Date"
                                                        value={exp.startDate}
                                                        onChange={(e) => handleUpdateExperience(exp.id, 'startDate', e.target.value)}
                                                        placeholder="Jan 2022"
                                                        size="sm"
                                                    />
                                                    <InputField
                                                        label="End Date"
                                                        value={exp.endDate}
                                                        onChange={(e) => handleUpdateExperience(exp.id, 'endDate', e.target.value)}
                                                        placeholder="Present"
                                                        size="sm"
                                                    />
                                                </div>
                                                <TextAreaField
                                                    label="Description"
                                                    value={exp.description}
                                                    onChange={(e) => handleUpdateExperience(exp.id, 'description', e.target.value)}
                                                    placeholder="Job description and responsibilities..."
                                                    rows={3}
                                                    size="sm"
                                                />
                                            </div>
                                        </ItemCard>
                                    ))}
                                </div>
                            )}
                        </Section>

                        {/* Skills Section */}
                        <Section
                            title="Skills"
                            collapsed={collapsedSections.skills}
                            onToggle={() => toggleSection('skills')}
                        >
                            <TextAreaField
                                value={metadata.skills.join(', ')}
                                onChange={(e) => handleUpdateSkills(e.target.value)}
                                placeholder="JavaScript, React, Node.js, Python, etc."
                                rows={3}
                                hint="Separate skills with commas"
                            />
                        </Section>

                        {/* Projects Section */}
                        <Section
                            title="Projects"
                            icon={<Plus size={20} />}
                            collapsed={collapsedSections.projects}
                            onToggle={() => toggleSection('projects')}
                            onAdd={handleAddProject}
                        >
                            {metadata.projects.length === 0 ? (
                                <EmptyMessage message="No projects added yet" />
                            ) : (
                                <div className="space-y-4">
                                    {metadata.projects.map((proj, index) => (
                                        <ItemCard
                                            key={proj.id}
                                            title={`Project ${index + 1}`}
                                            onDelete={() => handleDeleteProject(proj.id)}
                                        >
                                            <div className="space-y-3">
                                                <InputField
                                                    label="Project Name"
                                                    value={proj.name}
                                                    onChange={(e) => handleUpdateProject(proj.id, 'name', e.target.value)}
                                                    placeholder="My Awesome Project"
                                                    size="sm"
                                                />
                                                <TextAreaField
                                                    label="Description"
                                                    value={proj.description}
                                                    onChange={(e) => handleUpdateProject(proj.id, 'description', e.target.value)}
                                                    placeholder="Project description..."
                                                    rows={2}
                                                    size="sm"
                                                />
                                                <InputField
                                                    label="Technologies (comma-separated)"
                                                    value={Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || '')}
                                                    onChange={(e) => handleUpdateProject(proj.id, 'technologies', e.target.value)}
                                                    placeholder="React, Node.js, MongoDB"
                                                    size="sm"
                                                />
                                                <InputField
                                                    label="Link (Optional)"
                                                    value={proj.link}
                                                    onChange={(e) => handleUpdateProject(proj.id, 'link', e.target.value)}
                                                    placeholder="https://project-demo.com"
                                                    size="sm"
                                                />
                                            </div>
                                        </ItemCard>
                                    ))}
                                </div>
                            )}
                        </Section>

                        {/* Certifications Section */}
                        <Section
                            title="Certifications"
                            icon={<Plus size={20} />}
                            collapsed={collapsedSections.certifications}
                            onToggle={() => toggleSection('certifications')}
                            onAdd={handleAddCertification}
                        >
                            {metadata.certifications.length === 0 ? (
                                <EmptyMessage message="No certifications added yet" />
                            ) : (
                                <div className="space-y-4">
                                    {metadata.certifications.map((cert, index) => (
                                        <ItemCard
                                            key={cert.id}
                                            title={`Certification ${index + 1}`}
                                            onDelete={() => handleDeleteCertification(cert.id)}
                                        >
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <InputField
                                                    label="Certification Name"
                                                    value={cert.name}
                                                    onChange={(e) => handleUpdateCertification(cert.id, 'name', e.target.value)}
                                                    placeholder="e.g., AWS Certified Solutions Architect"
                                                    size="sm"
                                                />
                                                <InputField
                                                    label="Issuer"
                                                    value={cert.issuer}
                                                    onChange={(e) => handleUpdateCertification(cert.id, 'issuer', e.target.value)}
                                                    placeholder="e.g., Amazon Web Services"
                                                    size="sm"
                                                />
                                                <InputField
                                                    label="Date"
                                                    value={cert.date}
                                                    onChange={(e) => handleUpdateCertification(cert.id, 'date', e.target.value)}
                                                    placeholder="e.g., Jan 2024"
                                                    size="sm"
                                                />
                                                <InputField
                                                    label="Expiry Date (Optional)"
                                                    value={cert.expiryDate}
                                                    onChange={(e) => handleUpdateCertification(cert.id, 'expiryDate', e.target.value)}
                                                    placeholder="e.g., Jan 2027"
                                                    size="sm"
                                                />
                                                <InputField
                                                    label="Credential ID (Optional)"
                                                    value={cert.credentialId}
                                                    onChange={(e) => handleUpdateCertification(cert.id, 'credentialId', e.target.value)}
                                                    placeholder="e.g., ABC123456"
                                                    size="sm"
                                                />
                                            </div>
                                        </ItemCard>
                                    ))}
                                </div>
                            )}
                        </Section>

                        {/* Achievements Section */}
                        <Section
                            title="Achievements"
                            icon={<Plus size={20} />}
                            collapsed={collapsedSections.achievements}
                            onToggle={() => toggleSection('achievements')}
                            onAdd={handleAddAchievement}
                        >
                            {metadata.achievements.length === 0 ? (
                                <EmptyMessage message="No achievements added yet" />
                            ) : (
                                <div className="space-y-4">
                                    {metadata.achievements.map((achievement, index) => (
                                        <ItemCard
                                            key={`achievement-${index}`}
                                            title={`Achievement ${index + 1}`}
                                            onDelete={() => handleDeleteAchievement(index)}
                                        >
                                            <TextAreaField
                                                value={typeof achievement === 'string' ? achievement : achievement.description || achievement.title || ''}
                                                onChange={(e) => handleUpdateAchievement(index, e.target.value)}
                                                placeholder="e.g., Winner - National Level Hackathon 2024"
                                                rows={2}
                                                size="sm"
                                            />
                                        </ItemCard>
                                    ))}
                                </div>
                            )}
                        </Section>

                        {/* Custom Sections */}
                        <div className="card border-2 border-primary-200 rounded-xl p-4 md:p-6 bg-gradient-to-br from-primary-50 to-white">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="text-primary-600" size={20} />
                                    <h3 className="text-lg font-bold text-gradient">Custom Sections</h3>
                                </div>
                                <button
                                    onClick={handleAddCustomSection}
                                    className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
                                >
                                    <Plus size={18} />
                                    Add Section
                                </button>
                            </div>
                            {metadata.customSections.length === 0 ? (
                                <EmptyMessage message="Add sections like Awards, Publications, Volunteer Work, etc." />
                            ) : (
                                <div className="space-y-4">
                                    {metadata.customSections.map((section) => (
                                        <CustomSectionCard
                                            key={section.id}
                                            section={section}
                                            onAddItem={handleAddItemToCustomSection}
                                            onUpdateItem={handleUpdateCustomSectionItem}
                                            onDeleteItem={handleDeleteCustomSectionItem}
                                            onDelete={handleDeleteCustomSection}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Preview Panel - A4 Multi-Page Preview */}
                <div 
                    className="w-full lg:w-1/2 bg-neutral-200 overflow-hidden flex flex-col h-full"
                    style={{ 
                        boxSizing: 'border-box',
                        minWidth: 0,
                        maxWidth: '50%',
                        height: '100%',
                        maxHeight: '100%'
                    }}
                >
                    {/* Preview Header with Zoom Controls */}
                    <div 
                        className="sticky top-0 bg-white border-b border-neutral-300 px-4 md:px-6 py-3 z-10 shadow-sm flex-shrink-0"
                        style={{ boxSizing: 'border-box' }}
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-sm font-semibold text-neutral-900">Live Preview</h3>
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="hidden sm:inline">Auto-updating</span>
                            </div>
                        </div>
                            
                            {/* Zoom Controls */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPreviewZoom(Math.max(50, previewZoom - 10))}
                                    disabled={previewZoom <= 50}
                                    className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Zoom Out"
                                    aria-label="Zoom Out"
                                >
                                    <ZoomOut size={18} />
                                </button>
                                <span className="text-xs font-medium text-neutral-700 min-w-[3rem] text-center">
                                    {previewZoom}%
                                </span>
                                <button
                                    onClick={() => setPreviewZoom(Math.min(150, previewZoom + 10))}
                                    disabled={previewZoom >= 150}
                                    className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Zoom In"
                                    aria-label="Zoom In"
                                >
                                    <ZoomIn size={18} />
                                </button>
                                <button
                                    onClick={() => setPreviewZoom(100)}
                                    className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                                    title="Reset Zoom"
                                    aria-label="Reset Zoom"
                                >
                                    <RotateCcw size={18} />
                                </button>
                    </div>
                        </div>
                    </div>
                    
                    {/* Preview Content - Scrollable Canvas */}
                    <div 
                        className="flex-1 overflow-y-auto overflow-x-hidden h-full"
                        style={{ 
                            boxSizing: 'border-box',
                            minWidth: 0,
                            minHeight: 0,
                            maxHeight: '100%',
                            backgroundColor: '#e5e5e5', // Canvas background like Canva
                            scrollBehavior: 'smooth',
                            isolation: 'isolate' // Create new stacking context
                        }}
                        onWheel={(e) => {
                            // Prevent scroll from bubbling to parent
                            const element = e.currentTarget
                            const { scrollTop, scrollHeight, clientHeight } = element
                            const isAtTop = scrollTop === 0
                            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1
                            
                            // Only prevent propagation if we're not at the boundaries
                            if (!(isAtTop && e.deltaY < 0) && !(isAtBottom && e.deltaY > 0)) {
                                e.stopPropagation()
                            }
                        }}
                    >
                        {selectedTemplate ? (
                            <div 
                                className="flex justify-center items-start w-full py-8"
                                style={{ 
                                    boxSizing: 'border-box',
                                    minHeight: '100%'
                                }}
                            >
                                <A4PageRenderer
                                    resumeData={{ metadata }}
                                    templateId={templateStyle}
                                    zoom={previewZoom}
                                />
                            </div>
                        ) : loadingTemplate ? (
                            <div className="text-center py-16 w-full">
                                <LoadingSpinner />
                                <p className="text-neutral-500 mt-4">Loading template...</p>
                            </div>
                        ) : (
                            <div className="text-center py-16 w-full">
                                <FileText size={64} className="mx-auto mb-4 text-neutral-300" />
                                <p className="text-neutral-500 mb-4">Select a template to see preview</p>
                                <button
                                    onClick={() => setShowTemplateModal(true)}
                                    className="btn-primary px-6 py-3"
                                >
                                    Select Template
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Template Selection Modal */}
            {showTemplateModal && (
                    <TemplateSelectionModal
                        isOpen={showTemplateModal}
                        onClose={() => setShowTemplateModal(false)}
                    currentTemplateId={selectedTemplate}
                    onSelect={async (templateId) => {
                            setSelectedTemplate(templateId)
                        // Fetch template details to get style name
                        try {
                            const response = await api.get('/resumes/templates')
                            if (response.data.success) {
                                const template = response.data.data.templates.find(t => t._id === templateId)
                                if (template) {
                                    // Map template name/category to style name
                                    const styleMap = {
                                        'Standard': 'standard',
                                        'Modern': 'modern',
                                        'Minimal': 'minimal',
                                        'Professional': 'professional'
                                    }
                                    const styleName = styleMap[template.name] || template.category?.toLowerCase() || 'standard'
                                    setTemplateStyle(styleName)
                                }
                            }
                        } catch (error) {
                            console.error('Failed to fetch template details:', error)
                            setTemplateStyle('standard')
                        }
                            setShowTemplateModal(false)
                            toast.success('Template selected!')
                        }}
                    />
            )}

            {/* Custom Section Modal */}
            <CustomSectionModal
                isOpen={showCustomSectionModal}
                onClose={() => setShowCustomSectionModal(false)}
                onConfirm={handleConfirmCustomSection}
            />

            {/* Save As Modal */}
            <SaveAsModal
                isOpen={showSaveAsModal}
                onClose={() => setShowSaveAsModal(false)}
                onConfirm={handleSaveAsConfirm}
                currentTitle={resumeTitle}
            />

            {/* Save Options Modal */}
            <SaveOptionsModal
                isOpen={showSaveOptionsModal}
                onClose={() => setShowSaveOptionsModal(false)}
                onSave={() => performSave(false)}
                onSaveNew={handleSaveNewFromModal}
                saving={saving}
                resumeTitle={resumeTitle}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, onConfirm: null, title: '', message: '', type: 'warning' })}
                onConfirm={confirmModal.onConfirm || (() => {})}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                loading={enhancing}
            />

            <EnhancementDetailsModal
                isOpen={showEnhancementModal}
                onClose={() => setShowEnhancementModal(false)}
                onConfirm={performEnhancement}
                loading={enhancing}
            />

            {/* Enhancement Loading Modal */}
            <AnalysisLoadingModal
                isOpen={enhancing}
                progress={enhancementProgress}
                title="Enhancing Resume..."
                message="Our AI is optimizing your resume content for ATS compatibility and impact. This may take a moment."
                onComplete={() => {
                    // Modal will close automatically when enhancing is set to false
                }}
            />
        </div >
    )
}

// Helper Components
function Section({ title, icon, collapsed, onToggle, onAdd, children }) {
    return (
        <div className="card border border-neutral-200 rounded-xl overflow-hidden" style={{ boxSizing: 'border-box', minWidth: 0, width: '100%' }}>
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-50 transition-colors border-b border-neutral-200"
                onClick={onToggle}
                style={{ boxSizing: 'border-box' }}
            >
                <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                    {title}
                </h3>
                <div className="flex items-center gap-2">
                    {onAdd && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onAdd()
                            }}
                            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                        >
                            {icon || <Plus size={18} />}
                        </button>
                    )}
                    {collapsed ? <ChevronDown size={20} className="text-neutral-500" /> : <ChevronUp size={20} className="text-neutral-500" />}
                </div>
            </div>
            {!collapsed && (
                <div className="p-4">
                    {children}
                </div>
            )}
        </div>
    )
}

function InputField({ label, value, onChange, placeholder, type = 'text', size = 'md' }) {
    const sizeClasses = {
        sm: 'text-sm py-2',
        md: 'text-base py-3'
    }

    return (
        <div style={{ boxSizing: 'border-box', minWidth: 0 }}>
            {label && (
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                    {label}
                </label>
            )}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full px-3 ${sizeClasses[size]} bg-white text-neutral-900 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:ring-opacity-50 outline-none transition-all placeholder-neutral-400`}
                style={{ boxSizing: 'border-box', minWidth: 0, maxWidth: '100%' }}
            />
        </div>
    )
}

function TextAreaField({ label, value, onChange, placeholder, rows = 3, hint, size = 'md' }) {
    const sizeClasses = {
        sm: 'text-sm py-2',
        md: 'text-base py-3'
    }

    return (
        <div style={{ boxSizing: 'border-box', minWidth: 0 }}>
            {label && (
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                    {label}
                </label>
            )}
            <textarea
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                className={`w-full px-3 ${sizeClasses[size]} bg-white text-neutral-900 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:ring-opacity-50 outline-none transition-all placeholder-neutral-400 resize-none`}
                style={{ boxSizing: 'border-box', minWidth: 0, maxWidth: '100%' }}
            />
            {hint && (
                <p className="text-xs text-neutral-500 mt-1">{hint}</p>
            )}
        </div>
    )
}

function ItemCard({ title, onDelete, children }) {
    return (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">{title}</span>
                <button
                    onClick={onDelete}
                    className="text-red-500 hover:text-red-600 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>
            {children}
        </div>
    )
}

function EmptyMessage({ message }) {
    return (
        <p className="text-sm text-neutral-500 text-center py-6">
            {message}
        </p>
    )
}

function CustomSectionCard({ section, onAddItem, onUpdateItem, onDeleteItem, onDelete }) {
    return (
        <div className="bg-white border border-primary-200 rounded-lg overflow-hidden">
            <div className="bg-primary-50 p-3 flex items-center justify-between border-b border-primary-200">
                <h4 className="font-semibold text-primary-700 text-sm">{section.title}</h4>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onAddItem(section.id)}
                        className="p-1 text-primary-600 hover:bg-primary-100 rounded transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(section.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            <div className="p-3 space-y-3">
                {section.items.length === 0 ? (
                    <EmptyMessage message="No items added" />
                ) : (
                    section.items.map((item) => (
                        <div key={item.id} className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <input
                                    type="text"
                                    value={item.heading}
                                    onChange={(e) => onUpdateItem(section.id, item.id, 'heading', e.target.value)}
                                    className="flex-1 px-3 py-2 bg-white text-neutral-900 border border-neutral-300 rounded text-sm font-medium focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                    placeholder="Heading"
                                />
                                <button
                                    onClick={() => onDeleteItem(section.id, item.id)}
                                    className="text-red-500 hover:text-red-600"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <input
                                type="text"
                                value={item.subheading}
                                onChange={(e) => onUpdateItem(section.id, item.id, 'subheading', e.target.value)}
                                className="w-full px-3 py-2 bg-white text-neutral-900 border border-neutral-300 rounded text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                placeholder="Subheading (optional)"
                            />
                            <input
                                type="text"
                                value={item.date}
                                onChange={(e) => onUpdateItem(section.id, item.id, 'date', e.target.value)}
                                className="w-full px-3 py-2 bg-white text-neutral-900 border border-neutral-300 rounded text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                                placeholder="Date (optional)"
                            />
                            <textarea
                                value={item.description}
                                onChange={(e) => onUpdateItem(section.id, item.id, 'description', e.target.value)}
                                rows="2"
                                className="w-full px-3 py-2 bg-white text-neutral-900 border border-neutral-300 rounded text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none"
                                placeholder="Description (optional)"
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
