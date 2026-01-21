import React, { useMemo } from 'react'

/**
 * DynamicTemplateRenderer - Renders HTML templates stored in database
 * 
 * This component takes an HTML template string with placeholders and
 * injects resume data safely. Used for admin-created custom templates.
 * 
 * Placeholder syntax:
 * - {{personalInfo.fullName}} - Simple value
 * - {{#each experience}}...{{/each}} - Loop
 * - {{#if skills.length}}...{{/if}} - Conditional
 */

// A4 dimensions
const A4 = {
  width: '210mm',
  height: '297mm'
}

/**
 * Safely get nested property from object
 */
const getNestedValue = (obj, path) => {
  if (!path) return obj
  const keys = path.split('.')
  let value = obj
  for (const key of keys) {
    if (value === null || value === undefined) return ''
    value = value[key]
  }
  return value ?? ''
}

/**
 * Process template string and replace placeholders with data
 */
const processTemplate = (template, data) => {
  if (!template) return ''
  
  let result = template

  // Process {{#each array}}...{{/each}} loops
  const eachRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g
  result = result.replace(eachRegex, (match, arrayName, content) => {
    const array = data[arrayName]
    if (!Array.isArray(array) || array.length === 0) return ''
    
    return array.map((item, index) => {
      let itemContent = content
      // Replace {{this.property}} with item properties
      itemContent = itemContent.replace(/\{\{this\.(\w+)\}\}/g, (m, prop) => {
        return escapeHtml(item[prop] ?? '')
      })
      // Replace {{@index}} with current index
      itemContent = itemContent.replace(/\{\{@index\}\}/g, index)
      // Replace {{this}} for simple arrays (like skills)
      itemContent = itemContent.replace(/\{\{this\}\}/g, escapeHtml(typeof item === 'string' ? item : JSON.stringify(item)))
      return itemContent
    }).join('')
  })

  // Process {{#if condition}}...{{/if}} conditionals
  const ifRegex = /\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g
  result = result.replace(ifRegex, (match, condition, content) => {
    const value = getNestedValue(data, condition)
    // Check if value is truthy (exists, not empty, not zero-length array)
    const isTruthy = value && (Array.isArray(value) ? value.length > 0 : true)
    return isTruthy ? content : ''
  })

  // Process {{#ifLength array}}...{{/ifLength}} for checking array length
  const ifLengthRegex = /\{\{#ifLength\s+(\w+)\}\}([\s\S]*?)\{\{\/ifLength\}\}/g
  result = result.replace(ifLengthRegex, (match, arrayName, content) => {
    const array = data[arrayName]
    return Array.isArray(array) && array.length > 0 ? content : ''
  })

  // Process simple {{property}} or {{object.property}} placeholders
  const simpleRegex = /\{\{([\w.]+)\}\}/g
  result = result.replace(simpleRegex, (match, path) => {
    const value = getNestedValue(data, path)
    return escapeHtml(value)
  })

  return result
}

/**
 * Escape HTML to prevent XSS
 */
const escapeHtml = (text) => {
  if (text === null || text === undefined) return ''
  if (typeof text !== 'string') return String(text)
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

/**
 * Default CSS styles for dynamic templates
 */
const getDefaultStyles = () => `
  .dynamic-resume {
    width: ${A4.width};
    min-height: ${A4.height};
    max-width: ${A4.width};
    margin: 0 auto;
    background: #ffffff;
    font-family: 'Arial', sans-serif;
    font-size: 10pt;
    line-height: 1.5;
    color: #1f2937;
    box-sizing: border-box;
    overflow: visible;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  .dynamic-resume * {
    box-sizing: border-box;
    max-width: 100%;
  }
  
  .dynamic-resume h1, 
  .dynamic-resume h2, 
  .dynamic-resume h3 {
    margin: 0 0 2mm 0;
    word-wrap: break-word;
  }
  
  .dynamic-resume section {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  .dynamic-resume article {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  
  @media print {
    .dynamic-resume {
      width: 210mm !important;
      min-height: 297mm !important;
      margin: 0 !important;
      box-shadow: none !important;
    }
  }
`

const DynamicTemplateRenderer = ({ templateCode, templateStyles, metadata }) => {
  // Flatten metadata for easier template access
  const flatData = useMemo(() => {
    const {
      personalInfo = {},
      education = [],
      experience = [],
      skills = [],
      projects = [],
      certifications = [],
      achievements = [],
      customSections = []
    } = metadata || {}

    return {
      // Personal info fields
      fullName: personalInfo.fullName || personalInfo.name || '',
      email: personalInfo.email || '',
      phone: personalInfo.phone || '',
      location: personalInfo.location || '',
      linkedin: personalInfo.linkedin || '',
      github: personalInfo.github || '',
      portfolio: personalInfo.portfolio || '',
      summary: personalInfo.summary || '',
      // Also keep nested access
      personalInfo,
      // Arrays
      education,
      experience,
      skills,
      projects,
      certifications,
      achievements,
      customSections
    }
  }, [metadata])

  // Process the template with data
  const processedHtml = useMemo(() => {
    return processTemplate(templateCode, flatData)
  }, [templateCode, flatData])

  // Combine default styles with template-specific styles
  const combinedStyles = useMemo(() => {
    return getDefaultStyles() + (templateStyles || '')
  }, [templateStyles])

  return (
    <>
      <style>{combinedStyles}</style>
      <div 
        className="dynamic-resume a4-resume-container"
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />
    </>
  )
}

export default DynamicTemplateRenderer
