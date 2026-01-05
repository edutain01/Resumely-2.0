import React from 'react'

/**
 * A4ResumeRenderer V2 - Document-Based Architecture
 * 
 * This is the SINGLE SOURCE OF TRUTH for resume rendering.
 * Used for both live preview AND PDF generation.
 * 
 * Key Principles:
 * 1. Templates are PURE LAYOUT - only control fonts, colors, spacing, alignment
 * 2. Sections are rendered dynamically from flexible data structure
 * 3. Natural content flow - CSS handles page breaks automatically
 * 4. No manual page break calculations
 */

// A4 dimensions in mm
const A4 = {
  width: '210mm',
  height: '297mm',
  padding: '15mm',
  paddingTop: '12mm',
  paddingBottom: '12mm'
}

// Pure Layout Templates - Only control visual styling, not content structure
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
 * A4ResumeRenderer - Renders resume from flexible sections array
 * 
 * @param {Array} sections - Array of section objects with type, order, title, content
 * @param {String} templateStyle - Template style name (controls layout only)
 */
const A4ResumeRenderer = ({ sections = [], templateStyle = 'standard', forPrint = false }) => {
  const config = templateConfigs[templateStyle] || templateConfigs.standard
  const { colors, fonts, spacing, alignment } = config

  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => (a.order || 0) - (b.order || 0))

  // Base container styles - exact A4 dimensions
  const containerStyle = {
    width: A4.width,
    minHeight: A4.height,
    maxWidth: A4.width,
    padding: `${A4.paddingTop} ${A4.padding} ${A4.paddingBottom} ${A4.padding}`,
    margin: '0 auto',
    backgroundColor: colors.background,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: '10pt',
    lineHeight: spacing.lineHeight,
    boxSizing: 'border-box',
    position: 'relative',
    WebkitPrintColorAdjust: 'exact',
    printColorAdjust: 'exact'
  }

  // Section styles - natural flow with page-break protection
  const sectionStyle = {
    marginBottom: spacing.sectionGap,
    pageBreakInside: 'avoid',
    breakInside: 'avoid'
  }

  const sectionTitleStyle = {
    fontFamily: fonts.heading,
    fontSize: '12pt',
    fontWeight: 'bold',
    color: colors.primary,
    borderBottom: `0.5mm solid ${colors.border}`,
    paddingBottom: '1.5mm',
    marginBottom: '3mm',
    textTransform: 'uppercase',
    letterSpacing: '0.5mm'
  }

  const itemStyle = {
    marginBottom: spacing.itemGap,
    pageBreakInside: 'avoid',
    breakInside: 'avoid'
  }

  // Render a section based on its type
  const renderSection = (section) => {
    if (!section || !section.type) return null

    switch (section.type) {
      case 'header':
        return renderHeaderSection(section, config, sectionStyle)
      case 'summary':
        return renderSummarySection(section, config, sectionStyle, sectionTitleStyle)
      case 'experience':
        return renderExperienceSection(section, config, sectionStyle, sectionTitleStyle, itemStyle)
      case 'education':
        return renderEducationSection(section, config, sectionStyle, sectionTitleStyle, itemStyle)
      case 'skills':
        return renderSkillsSection(section, config, sectionStyle, sectionTitleStyle)
      case 'projects':
        return renderProjectsSection(section, config, sectionStyle, sectionTitleStyle, itemStyle)
      case 'certifications':
        return renderCertificationsSection(section, config, sectionStyle, sectionTitleStyle, itemStyle)
      case 'achievements':
        return renderAchievementsSection(section, config, sectionStyle, sectionTitleStyle, itemStyle)
      case 'custom':
        return renderCustomSection(section, config, sectionStyle, sectionTitleStyle, itemStyle)
      default:
        return renderCustomSection(section, config, sectionStyle, sectionTitleStyle, itemStyle)
    }
  }

  return (
    <div
      style={containerStyle}
      data-resume-content="true"
      data-template-style={templateStyle}
      className="a4-resume-container"
    >
      {/* Print-specific CSS - ensures natural page flow */}
      <style>{`
        @media print {
          .a4-resume-container {
            width: 210mm !important;
            min-height: 297mm !important;
            padding: ${A4.paddingTop} ${A4.padding} ${A4.paddingBottom} ${A4.padding} !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          
          .a4-resume-container section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          .a4-resume-container article {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          .a4-resume-container header {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
        
        @page {
          size: A4;
          margin: 0;
        }
      `}</style>

      {/* Render all sections in order */}
      {sortedSections.map((section, index) => (
        <React.Fragment key={section._id || index}>
          {renderSection(section)}
        </React.Fragment>
      ))}
    </div>
  )
}

// Header Section Renderer
const renderHeaderSection = (section, config, sectionStyle) => {
  const { colors, fonts, alignment } = config
  const content = section.content || {}
  
  return (
    <header style={{
      ...sectionStyle,
      textAlign: alignment.header,
      marginBottom: config.spacing.sectionGap
    }}>
      <h1 style={{
        fontFamily: fonts.heading,
        fontSize: '18pt',
        fontWeight: 'bold',
        color: colors.primary,
        margin: '0 0 2mm 0',
        letterSpacing: '1mm'
      }}>
        {content.fullName || content.name || 'Your Name'}
      </h1>
      <div style={{
        fontSize: '9pt',
        color: colors.textLight,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '3mm'
      }}>
        {content.email && <span>{content.email}</span>}
        {content.phone && <span>• {content.phone}</span>}
        {content.location && <span>• {content.location}</span>}
        {content.linkedIn && <span>• {content.linkedIn}</span>}
        {content.portfolio && <span>• {content.portfolio}</span>}
      </div>
    </header>
  )
}

// Summary Section Renderer
const renderSummarySection = (section, config, sectionStyle, sectionTitleStyle) => {
  const { colors, spacing } = config
  const text = section.content?.text || ''
  
  if (!text) return null

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>{section.title || 'Professional Summary'}</h2>
      <p style={{
        fontSize: '10pt',
        lineHeight: spacing.lineHeight,
        margin: 0,
        textAlign: 'justify'
      }}>
        {text}
      </p>
    </section>
  )
}

// Experience Section Renderer
const renderExperienceSection = (section, config, sectionStyle, sectionTitleStyle, itemStyle) => {
  const { colors, spacing } = config
  const items = section.content?.items || []
  
  if (!items || items.length === 0) return null

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>{section.title || 'Professional Experience'}</h2>
      {items.map((item, idx) => (
        <article key={idx} style={itemStyle}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1mm'
          }}>
            <div>
              <h3 style={{
                fontSize: '11pt',
                fontWeight: 'bold',
                margin: 0,
                color: colors.text
              }}>
                {item.title}
              </h3>
              <p style={{
                fontSize: '9.5pt',
                color: colors.textLight,
                margin: '1mm 0 0 0'
              }}>
                {item.company} {item.location && `• ${item.location}`}
              </p>
            </div>
            {(item.startDate || item.endDate) && (
              <span style={{
                fontSize: '9pt',
                color: colors.textLight,
                whiteSpace: 'nowrap'
              }}>
                {item.startDate} – {item.endDate || 'Present'}
              </span>
            )}
          </div>
          {item.description && (
            <p style={{
              fontSize: '9.5pt',
              margin: '1mm 0 0 0',
              lineHeight: spacing.lineHeight
            }}>
              {item.description}
            </p>
          )}
          {item.achievements && item.achievements.length > 0 && (
            <ul style={{ margin: '2mm 0 0 0', paddingLeft: '4mm' }}>
              {item.achievements.map((ach, i) => (
                <li key={i} style={{ fontSize: '9.5pt', marginBottom: '1mm' }}>{ach}</li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </section>
  )
}

// Education Section Renderer
const renderEducationSection = (section, config, sectionStyle, sectionTitleStyle, itemStyle) => {
  const { colors, spacing } = config
  const items = section.content?.items || []
  
  if (!items || items.length === 0) return null

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>{section.title || 'Education'}</h2>
      {items.map((item, idx) => (
        <article key={idx} style={itemStyle}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div>
              <h3 style={{
                fontSize: '10pt',
                fontWeight: 'bold',
                margin: 0,
                color: colors.text
              }}>
                {item.degree}
              </h3>
              <p style={{
                fontSize: '9.5pt',
                color: colors.textLight,
                margin: '1mm 0 0 0'
              }}>
                {item.institution} {item.location && `• ${item.location}`}
              </p>
              {item.gpa && (
                <p style={{
                  fontSize: '9pt',
                  color: colors.textLight,
                  margin: '1mm 0 0 0'
                }}>
                  GPA: {item.gpa}
                </p>
              )}
            </div>
            {(item.startDate || item.endDate) && (
              <span style={{
                fontSize: '9pt',
                color: colors.textLight,
                whiteSpace: 'nowrap'
              }}>
                {item.startDate} – {item.endDate || 'Present'}
              </span>
            )}
          </div>
          {item.description && (
            <p style={{
              fontSize: '9.5pt',
              margin: '1mm 0 0 0',
              lineHeight: spacing.lineHeight
            }}>
              {item.description}
            </p>
          )}
        </article>
      ))}
    </section>
  )
}

// Skills Section Renderer
const renderSkillsSection = (section, config, sectionStyle, sectionTitleStyle) => {
  const { colors } = config
  const items = section.content?.items || []
  const skills = Array.isArray(items[0]) ? items.flat() : items
  
  if (!skills || skills.length === 0) return null

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>{section.title || 'Skills'}</h2>
      <p style={{
        fontSize: '10pt',
        lineHeight: 1.5,
        margin: 0
      }}>
        {skills.join(' • ')}
      </p>
    </section>
  )
}

// Projects Section Renderer
const renderProjectsSection = (section, config, sectionStyle, sectionTitleStyle, itemStyle) => {
  const { colors, spacing } = config
  const items = section.content?.items || []
  
  if (!items || items.length === 0) return null

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>{section.title || 'Projects'}</h2>
      {items.map((item, idx) => (
        <article key={idx} style={itemStyle}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1mm'
          }}>
            <h3 style={{
              fontSize: '11pt',
              fontWeight: 'bold',
              margin: 0,
              color: colors.text
            }}>
              {item.name}
              {item.link && (
                <span style={{ fontSize: '9pt', fontWeight: 'normal', color: colors.primary, marginLeft: '2mm' }}>
                  ({item.link})
                </span>
              )}
            </h3>
            {(item.startDate || item.endDate) && (
              <span style={{
                fontSize: '9pt',
                color: colors.textLight,
                whiteSpace: 'nowrap'
              }}>
                {item.startDate} – {item.endDate || 'Present'}
              </span>
            )}
          </div>
          {item.description && (
            <p style={{
              fontSize: '9.5pt',
              margin: '1mm 0',
              lineHeight: spacing.lineHeight
            }}>
              {item.description}
            </p>
          )}
          {item.technologies && item.technologies.length > 0 && (
            <p style={{
              fontSize: '9pt',
              margin: '1mm 0 0 0',
              color: colors.textLight
            }}>
              <strong>Technologies:</strong> {item.technologies.join(', ')}
            </p>
          )}
        </article>
      ))}
    </section>
  )
}

// Certifications Section Renderer
const renderCertificationsSection = (section, config, sectionStyle, sectionTitleStyle, itemStyle) => {
  const { colors } = config
  const items = section.content?.items || []
  
  if (!items || items.length === 0) return null

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>{section.title || 'Certifications'}</h2>
      {items.map((item, idx) => (
        <article key={idx} style={itemStyle}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div>
              <h3 style={{
                fontSize: '10pt',
                fontWeight: 'bold',
                margin: 0,
                color: colors.text
              }}>
                {item.name}
              </h3>
              <p style={{
                fontSize: '9pt',
                color: colors.textLight,
                margin: 0
              }}>
                {item.issuer}
              </p>
            </div>
            {item.date && (
              <span style={{
                fontSize: '9pt',
                color: colors.textLight,
                whiteSpace: 'nowrap'
              }}>
                {item.date}
              </span>
            )}
          </div>
        </article>
      ))}
    </section>
  )
}

// Achievements Section Renderer
const renderAchievementsSection = (section, config, sectionStyle, sectionTitleStyle, itemStyle) => {
  const { colors, spacing } = config
  const items = section.content?.items || []
  
  if (!items || items.length === 0) return null

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>{section.title || 'Achievements'}</h2>
      {items.map((item, idx) => (
        <article key={idx} style={itemStyle}>
          <h3 style={{
            fontSize: '10pt',
            fontWeight: 'bold',
            margin: 0,
            color: colors.text
          }}>
            {item.title}
          </h3>
          {item.description && (
            <p style={{
              fontSize: '9.5pt',
              margin: '1mm 0 0 0',
              lineHeight: spacing.lineHeight
            }}>
              {item.description}
            </p>
          )}
        </article>
      ))}
    </section>
  )
}

// Custom Section Renderer - Handles any unknown section type
const renderCustomSection = (section, config, sectionStyle, sectionTitleStyle, itemStyle) => {
  const { colors, spacing } = config
  const content = section.content || {}
  
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>{section.title || 'Section'}</h2>
      <div style={{ fontSize: '9.5pt', lineHeight: spacing.lineHeight }}>
        {typeof content === 'string' ? (
          <p style={{ margin: 0 }}>{content}</p>
        ) : Array.isArray(content) ? (
          content.map((item, i) => (
            <div key={i} style={itemStyle}>
              {typeof item === 'string' ? (
                <p style={{ margin: 0 }}>{item}</p>
              ) : (
                <div>
                  {item.title && (
                    <h3 style={{ fontSize: '10pt', fontWeight: 'bold', margin: 0 }}>
                      {item.title}
                    </h3>
                  )}
                  {item.description && (
                    <p style={{ margin: '1mm 0 0 0', color: colors.textLight }}>
                      {item.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        ) : content.text ? (
          <p style={{ margin: 0 }}>{content.text}</p>
        ) : null}
      </div>
    </section>
  )
}

export default A4ResumeRenderer





