/**
 * Resume HTML Generator - Server-Side
 * 
 * Generates HTML from resume sections using the same logic as the frontend renderer.
 * This is the SINGLE SOURCE OF TRUTH for PDF generation - uses same layout as preview.
 * 
 * Templates are PURE LAYOUT - only control fonts, colors, spacing, alignment.
 * Content structure comes from sections array.
 */

// A4 dimensions
const A4 = {
  width: '210mm',
  height: '297mm',
  padding: '15mm',
  paddingTop: '12mm',
  paddingBottom: '12mm'
}

// Pure Layout Templates - Only control visual styling
const templateConfigs = {
  standard: {
    colors: {
      primary: '#2563eb',
      secondary: '#1e40af',
      text: '#1f2937',
      textLight: '#6b7280',
      border: '#e5e7eb',
      background: '#ffffff',
      accent: '#dbeafe'
    },
    fonts: {
      heading: "'Georgia', serif",
      body: "'Arial', sans-serif"
    },
    spacing: {
      sectionGap: '6mm',
      itemGap: '3mm',
      lineHeight: 1.5
    },
    alignment: {
      header: 'center',
      sections: 'left'
    }
  },
  modern: {
    colors: {
      primary: '#0891b2',
      secondary: '#0e7490',
      text: '#0f172a',
      textLight: '#64748b',
      border: '#e2e8f0',
      background: '#ffffff',
      accent: '#ecfeff'
    },
    fonts: {
      heading: "'Helvetica Neue', 'Arial', sans-serif",
      body: "'Helvetica Neue', 'Arial', sans-serif"
    },
    spacing: {
      sectionGap: '5mm',
      itemGap: '2.5mm',
      lineHeight: 1.45
    },
    alignment: {
      header: 'center',
      sections: 'left'
    }
  },
  minimal: {
    colors: {
      primary: '#171717',
      secondary: '#404040',
      text: '#171717',
      textLight: '#737373',
      border: '#d4d4d4',
      background: '#ffffff',
      accent: '#fafafa'
    },
    fonts: {
      heading: "'Times New Roman', serif",
      body: "'Arial', sans-serif"
    },
    spacing: {
      sectionGap: '5mm',
      itemGap: '2mm',
      lineHeight: 1.4
    },
    alignment: {
      header: 'center',
      sections: 'left'
    }
  },
  professional: {
    colors: {
      primary: '#1e3a5f',
      secondary: '#2c5282',
      text: '#1a202c',
      textLight: '#718096',
      border: '#e2e8f0',
      background: '#ffffff',
      accent: '#ebf8ff'
    },
    fonts: {
      heading: "'Cambria', 'Georgia', serif",
      body: "'Calibri', 'Arial', sans-serif"
    },
    spacing: {
      sectionGap: '6mm',
      itemGap: '3mm',
      lineHeight: 1.5
    },
    alignment: {
      header: 'center',
      sections: 'left'
    }
  }
}

/**
 * Generate HTML from resume sections
 * 
 * @param {Array} sections - Array of section objects
 * @param {String} templateStyle - Template style name
 * @returns {String} HTML string
 */
export const generateResumeHTML = (sections = [], templateStyle = 'standard') => {
  const config = templateConfigs[templateStyle] || templateConfigs.standard
  const { colors, fonts, spacing, alignment } = config

  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => (a.order || 0) - (b.order || 0))

  // Generate HTML for each section
  const sectionsHTML = sortedSections
    .map(section => renderSectionHTML(section, config))
    .filter(html => html)
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    html, body {
      margin: 0;
      padding: 0;
      width: 210mm;
      min-height: 297mm;
      font-family: ${fonts.body};
      font-size: 10pt;
      line-height: ${spacing.lineHeight};
      color: ${colors.text};
      background: ${colors.background};
    }
    
    .resume-container {
      width: 210mm;
      min-height: 297mm;
      padding: ${A4.paddingTop} ${A4.padding} ${A4.paddingBottom} ${A4.padding};
      background: ${colors.background};
    }
    
    /* Page break handling - smart flow */
    .resume-container {
      orphans: 3;
      widows: 3;
    }
    
    section {
      margin-bottom: ${spacing.sectionGap};
      page-break-inside: auto;
      break-inside: auto;
      page-break-after: auto;
      break-after: auto;
      orphans: 2;
      widows: 2;
    }
    
    article {
      margin-bottom: ${spacing.itemGap};
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    header {
      text-align: ${alignment.header};
      margin-bottom: ${spacing.sectionGap};
      page-break-inside: avoid;
      break-inside: avoid;
      page-break-after: auto;
      break-after: auto;
    }
    
    li {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    p {
      orphans: 2;
      widows: 2;
    }
    
    h1 {
      font-family: ${fonts.heading};
      font-size: 18pt;
      font-weight: bold;
      color: ${colors.primary};
      margin: 0 0 2mm 0;
      letter-spacing: 1mm;
    }
    
    h2 {
      font-family: ${fonts.heading};
      font-size: 12pt;
      font-weight: bold;
      color: ${colors.primary};
      border-bottom: 0.5mm solid ${colors.border};
      padding-bottom: 1.5mm;
      margin-bottom: 3mm;
      text-transform: uppercase;
      letter-spacing: 0.5mm;
    }
    
    h3 {
      font-family: ${fonts.heading};
      font-size: 11pt;
      font-weight: bold;
      color: ${colors.text};
      margin: 0;
    }
    
    p {
      margin: 0;
      line-height: ${spacing.lineHeight};
    }
    
    ul {
      margin: 2mm 0 0 0;
      padding-left: 4mm;
    }
    
    li {
      margin-bottom: 1mm;
    }
  </style>
</head>
<body>
  <div class="resume-container">
    ${sectionsHTML}
  </div>
</body>
</html>`
}

/**
 * Render a single section to HTML
 */
const renderSectionHTML = (section, config) => {
  if (!section || !section.type) return ''

  const { colors, fonts, spacing } = config

  switch (section.type) {
    case 'header':
      return renderHeaderHTML(section, config)
    case 'summary':
      return renderSummaryHTML(section, config)
    case 'experience':
      return renderExperienceHTML(section, config)
    case 'education':
      return renderEducationHTML(section, config)
    case 'skills':
      return renderSkillsHTML(section, config)
    case 'projects':
      return renderProjectsHTML(section, config)
    case 'certifications':
      return renderCertificationsHTML(section, config)
    case 'achievements':
      return renderAchievementsHTML(section, config)
    case 'custom':
      return renderCustomHTML(section, config)
    default:
      return renderCustomHTML(section, config)
  }
}

const renderHeaderHTML = (section, config) => {
  const { colors, fonts, alignment } = config
  const content = section.content || {}
  const name = content.fullName || content.name || 'Your Name'
  
  const contactInfo = []
  if (content.email) contactInfo.push(content.email)
  if (content.phone) contactInfo.push(`• ${content.phone}`)
  if (content.location) contactInfo.push(`• ${content.location}`)
  if (content.linkedIn) contactInfo.push(`• ${content.linkedIn}`)
  if (content.portfolio) contactInfo.push(`• ${content.portfolio}`)

  return `<header>
    <h1>${escapeHtml(name)}</h1>
    <div style="font-size: 9pt; color: ${colors.textLight}; display: flex; flex-wrap: wrap; justify-content: center; gap: 3mm;">
      ${contactInfo.map(info => `<span>${escapeHtml(info)}</span>`).join('')}
    </div>
  </header>`
}

const renderSummaryHTML = (section, config) => {
  const { spacing } = config
  const text = section.content?.text || ''
  if (!text) return ''

  return `<section>
    <h2>${escapeHtml(section.title || 'Professional Summary')}</h2>
    <p style="font-size: 10pt; text-align: justify;">${escapeHtml(text)}</p>
  </section>`
}

const renderExperienceHTML = (section, config) => {
  const { colors, spacing } = config
  const items = section.content?.items || []
  if (!items || items.length === 0) return ''

  const itemsHTML = items.map(item => {
    const achievementsHTML = item.achievements && item.achievements.length > 0
      ? `<ul style="page-break-inside: avoid; break-inside: avoid; margin: 1mm 0 0 0; padding-left: 4mm;">${item.achievements.map(ach => `<li style="font-size: 9.5pt; page-break-inside: avoid; break-inside: avoid;">${escapeHtml(ach)}</li>`).join('')}</ul>`
      : ''

    return `<article style="page-break-inside: avoid; break-inside: avoid; margin-bottom: 3mm;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1mm;">
        <div>
          <h3 style="font-size: 11pt;">${escapeHtml(item.title || '')}</h3>
          <p style="font-size: 9.5pt; color: ${colors.textLight}; margin: 1mm 0 0 0;">
            ${escapeHtml(item.company || '')} ${item.location ? `• ${escapeHtml(item.location)}` : ''}
          </p>
        </div>
        ${(item.startDate || item.endDate) ? `<span style="font-size: 9pt; color: ${colors.textLight}; white-space: nowrap;">${escapeHtml(item.startDate || '')} – ${escapeHtml(item.endDate || 'Present')}</span>` : ''}
      </div>
      ${item.description ? `<p style="font-size: 9.5pt; margin: 1mm 0 0 0;">${escapeHtml(item.description)}</p>` : ''}
      ${achievementsHTML}
    </article>`
  }).join('')

  return `<section>
    <h2>${escapeHtml(section.title || 'Professional Experience')}</h2>
    ${itemsHTML}
  </section>`
}

const renderEducationHTML = (section, config) => {
  const { colors, spacing } = config
  const items = section.content?.items || []
  if (!items || items.length === 0) return ''

  const itemsHTML = items.map(item => {
    return `<article>
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h3 style="font-size: 10pt;">${escapeHtml(item.degree || '')}</h3>
          <p style="font-size: 9.5pt; color: ${colors.textLight}; margin: 1mm 0 0 0;">
            ${escapeHtml(item.institution || '')} ${item.location ? `• ${escapeHtml(item.location)}` : ''}
          </p>
          ${item.gpa ? `<p style="font-size: 9pt; color: ${colors.textLight}; margin: 1mm 0 0 0;">GPA: ${escapeHtml(item.gpa)}</p>` : ''}
        </div>
        ${(item.startDate || item.endDate) ? `<span style="font-size: 9pt; color: ${colors.textLight}; white-space: nowrap;">${escapeHtml(item.startDate || '')} – ${escapeHtml(item.endDate || 'Present')}</span>` : ''}
      </div>
      ${item.description ? `<p style="font-size: 9.5pt; margin: 1mm 0 0 0;">${escapeHtml(item.description)}</p>` : ''}
    </article>`
  }).join('')

  return `<section>
    <h2>${escapeHtml(section.title || 'Education')}</h2>
    ${itemsHTML}
  </section>`
}

const renderSkillsHTML = (section, config) => {
  const items = section.content?.items || []
  const skills = Array.isArray(items[0]) ? items.flat() : items
  if (!skills || skills.length === 0) return ''

  return `<section>
    <h2>${escapeHtml(section.title || 'Skills')}</h2>
    <p style="font-size: 10pt;">${skills.map(s => escapeHtml(s)).join(' • ')}</p>
  </section>`
}

const renderProjectsHTML = (section, config) => {
  const { colors, spacing } = config
  const items = section.content?.items || []
  if (!items || items.length === 0) return ''

  const itemsHTML = items.map(item => {
    return `<article>
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1mm;">
        <h3 style="font-size: 11pt;">
          ${escapeHtml(item.name || '')}
          ${item.link ? `<span style="font-size: 9pt; font-weight: normal; color: ${colors.primary}; margin-left: 2mm;">(${escapeHtml(item.link)})</span>` : ''}
        </h3>
        ${(item.startDate || item.endDate) ? `<span style="font-size: 9pt; color: ${colors.textLight}; white-space: nowrap;">${escapeHtml(item.startDate || '')} – ${escapeHtml(item.endDate || 'Present')}</span>` : ''}
      </div>
      ${item.description ? `<p style="font-size: 9.5pt; margin: 1mm 0;">${escapeHtml(item.description)}</p>` : ''}
      ${item.technologies && item.technologies.length > 0 ? `<p style="font-size: 9pt; margin: 1mm 0 0 0; color: ${colors.textLight};"><strong>Technologies:</strong> ${item.technologies.map(t => escapeHtml(t)).join(', ')}</p>` : ''}
    </article>`
  }).join('')

  return `<section>
    <h2>${escapeHtml(section.title || 'Projects')}</h2>
    ${itemsHTML}
  </section>`
}

const renderCertificationsHTML = (section, config) => {
  const { colors } = config
  const items = section.content?.items || []
  if (!items || items.length === 0) return ''

  const itemsHTML = items.map(item => {
    return `<article style="page-break-inside: avoid; break-inside: avoid; margin-bottom: 2mm;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h3 style="font-size: 10pt;">${escapeHtml(item.name || '')}</h3>
          <p style="font-size: 9pt; color: ${colors.textLight}; margin: 0;">${escapeHtml(item.issuer || '')}</p>
        </div>
        ${item.date ? `<span style="font-size: 9pt; color: ${colors.textLight}; white-space: nowrap;">${escapeHtml(item.date)}</span>` : ''}
      </div>
    </article>`
  }).join('')

  return `<section>
    <h2>${escapeHtml(section.title || 'Certifications')}</h2>
    ${itemsHTML}
  </section>`
}

const renderAchievementsHTML = (section, config) => {
  const { colors, spacing } = config
  const items = section.content?.items || []
  if (!items || items.length === 0) return ''

  const itemsHTML = items.map(item => {
    return `<article style="page-break-inside: avoid; break-inside: avoid; margin-bottom: 2mm;">
      <h3 style="font-size: 10pt;">${escapeHtml(item.title || '')}</h3>
      ${item.description ? `<p style="font-size: 9.5pt; margin: 1mm 0 0 0;">${escapeHtml(item.description)}</p>` : ''}
    </article>`
  }).join('')

  return `<section>
    <h2>${escapeHtml(section.title || 'Achievements')}</h2>
    ${itemsHTML}
  </section>`
}

const renderCustomHTML = (section, config) => {
  const { colors, spacing } = config
  const content = section.content || {}
  
  let contentHTML = ''
  
  // New format with items array
  if (content.items && Array.isArray(content.items) && content.items.length > 0) {
    contentHTML = content.items.map(item => {
      return `<article style="page-break-inside: avoid; break-inside: avoid; margin-bottom: 3mm;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          ${item.heading ? `<h3 style="font-size: 10pt; margin: 0; color: ${colors.text};">${escapeHtml(item.heading)}</h3>` : ''}
          ${item.date ? `<span style="font-size: 9pt; color: ${colors.textLight}; font-style: italic;">${escapeHtml(item.date)}</span>` : ''}
        </div>
        ${item.subheading ? `<p style="margin: 0.5mm 0; font-size: 9.5pt; color: ${colors.textLight};">${escapeHtml(item.subheading)}</p>` : ''}
        ${item.description ? `<p style="margin: 1mm 0 0 0; font-size: 9.5pt; color: ${colors.text};">${escapeHtml(item.description)}</p>` : ''}
      </article>`
    }).join('')
  } 
  // Legacy format support
  else if (typeof content === 'string') {
    contentHTML = `<p>${escapeHtml(content)}</p>`
  } else if (Array.isArray(content)) {
    contentHTML = content.map(item => {
      if (typeof item === 'string') {
        return `<div style="margin-bottom: ${config.spacing.itemGap};"><p>${escapeHtml(item)}</p></div>`
      } else {
        return `<div style="margin-bottom: ${config.spacing.itemGap};">
          ${item.title ? `<h3 style="font-size: 10pt;">${escapeHtml(item.title)}</h3>` : ''}
          ${item.description ? `<p style="margin: 1mm 0 0 0; color: ${colors.textLight};">${escapeHtml(item.description)}</p>` : ''}
        </div>`
      }
    }).join('')
  } else if (content.text) {
    contentHTML = `<p>${escapeHtml(content.text)}</p>`
  }

  return `<section>
    <h2>${escapeHtml(section.title || 'Section')}</h2>
    <div style="font-size: 9.5pt;">
      ${contentHTML}
    </div>
  </section>`
}

/**
 * Escape HTML to prevent XSS
 */
const escapeHtml = (text) => {
  if (!text) return ''
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return String(text).replace(/[&<>"']/g, m => map[m])
}





