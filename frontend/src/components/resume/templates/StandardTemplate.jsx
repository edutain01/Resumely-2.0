import React from 'react'

// A4 dimensions in mm
const A4 = {
  width: '210mm',
  height: '297mm',
  padding: '15mm',
  paddingTop: '12mm',
  paddingBottom: '12mm'
}

const StandardTemplate = ({ metadata }) => {
  const colors = {
    primary: '#2563eb',
    secondary: '#1e40af',
    text: '#1f2937',
    textLight: '#6b7280',
    border: '#e5e7eb',
    background: '#ffffff',
    accent: '#dbeafe'
  }

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

  const containerStyle = {
    width: A4.width,
    minHeight: A4.height,
    maxWidth: A4.width,
    padding: `${A4.paddingTop} ${A4.padding} ${A4.paddingBottom} ${A4.padding}`,
    margin: '0 auto',
    backgroundColor: colors.background,
    color: colors.text,
    fontFamily: "'Arial', sans-serif",
    fontSize: '10pt',
    lineHeight: 1.5,
    boxSizing: 'border-box',
    overflow: 'visible',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    position: 'relative',
    pageBreakAfter: 'auto',
    breakAfter: 'auto'
  }

  const sectionTitleStyle = {
    fontFamily: "'Georgia', serif",
    fontSize: '12pt',
    fontWeight: 'bold',
    color: colors.primary,
    borderBottom: `0.5mm solid ${colors.border}`,
    paddingBottom: '1.5mm',
    marginBottom: '3mm',
    textTransform: 'uppercase',
    letterSpacing: '0.5mm'
  }

  return (
    <div style={containerStyle} className="a4-resume-container">
      {/* Header */}
      <header style={{ marginBottom: '6mm', textAlign: 'center' }}>
        <h1 style={{
          fontFamily: "'Georgia', serif",
          fontSize: '18pt',
          fontWeight: 'bold',
          color: colors.primary,
          margin: '0 0 2mm 0',
          letterSpacing: '1mm',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          maxWidth: '100%'
        }}>
          {personalInfo?.fullName || personalInfo?.name || 'Your Name'}
        </h1>
        
        <div style={{
          fontSize: '9pt',
          color: colors.textLight,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '3mm'
        }}>
          {personalInfo?.email && <span>{personalInfo.email}</span>}
          {personalInfo?.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo?.location && <span>• {personalInfo.location}</span>}
          {personalInfo?.linkedin && <span>• {personalInfo.linkedin}</span>}
          {personalInfo?.github && <span>• {personalInfo.github}</span>}
        </div>
      </header>

      {/* Summary */}
      {personalInfo?.summary && (
        <section style={{ marginBottom: '6mm' }}>
          <h2 style={sectionTitleStyle}>Professional Summary</h2>
          <p style={{ fontSize: '10pt', margin: 0, textAlign: 'justify' }}>
            {personalInfo.summary}
          </p>
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section style={{ marginBottom: '6mm' }}>
          <h2 style={sectionTitleStyle}>Professional Experience</h2>
          {experience.map((exp, idx) => (
            <article key={idx} style={{ marginBottom: '3mm' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1mm' }}>
                <div>
                  <h3 style={{ fontSize: '11pt', fontWeight: 'bold', margin: 0 }}>
                    {exp.position || exp.title}
                  </h3>
                  <p style={{ fontSize: '10pt', color: colors.textLight, margin: 0, fontStyle: 'italic' }}>
                    {exp.company}{exp.location ? ` • ${exp.location}` : ''}
                  </p>
                </div>
                <span style={{ fontSize: '9pt', color: colors.primary, whiteSpace: 'nowrap' }}>
                  {exp.startDate} – {exp.current || exp.endDate === 'Present' ? 'Present' : exp.endDate}
                </span>
              </div>
              {exp.description && (
                <p style={{ fontSize: '9.5pt', margin: '1mm 0', lineHeight: 1.4 }}>
                  {exp.description}
                </p>
              )}
            </article>
          ))}
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section style={{ marginBottom: '6mm' }}>
          <h2 style={sectionTitleStyle}>Education</h2>
          {education.map((edu, idx) => (
            <article key={idx} style={{ marginBottom: '3mm' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '11pt', fontWeight: 'bold', margin: 0 }}>
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                  </h3>
                  <p style={{ fontSize: '10pt', color: colors.textLight, margin: 0, fontStyle: 'italic' }}>
                    {edu.institution}
                  </p>
                </div>
                <span style={{ fontSize: '9pt', color: colors.primary, whiteSpace: 'nowrap' }}>
                  {edu.startDate} – {edu.endDate}
                </span>
              </div>
              {edu.gpa && (
                <p style={{ fontSize: '9pt', margin: '1mm 0 0 0', color: colors.textLight }}>
                  GPA: {edu.gpa}
                </p>
              )}
            </article>
          ))}
        </section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section style={{ marginBottom: '6mm' }}>
          <h2 style={sectionTitleStyle}>Skills</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2mm' }}>
            {skills.map((skill, idx) => (
              <span key={idx} style={{
                backgroundColor: colors.accent,
                color: colors.primary,
                padding: '1mm 3mm',
                borderRadius: '1mm',
                fontSize: '9pt',
                fontWeight: '500',
                border: `0.2mm solid ${colors.border}`
              }}>
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section style={{ marginBottom: '6mm' }}>
          <h2 style={sectionTitleStyle}>Projects</h2>
          {projects.map((project, idx) => (
            <article key={idx} style={{ marginBottom: '3mm' }}>
              <h3 style={{ fontSize: '11pt', fontWeight: 'bold', margin: 0 }}>
                {project.name}
                {project.link && (
                  <span style={{ fontSize: '9pt', fontWeight: 'normal', color: colors.primary, marginLeft: '2mm' }}>
                    ({project.link})
                  </span>
                )}
              </h3>
              {project.description && (
                <p style={{ fontSize: '9.5pt', margin: '1mm 0', lineHeight: 1.4 }}>
                  {project.description}
                </p>
              )}
              {project.technologies && (() => {
                const techArray = Array.isArray(project.technologies) 
                  ? project.technologies 
                  : (typeof project.technologies === 'string' ? [project.technologies] : []);
                return techArray.length > 0 && (
                  <p style={{ fontSize: '9pt', margin: '1mm 0 0 0', color: colors.textLight }}>
                    <strong>Technologies:</strong> {techArray.join(', ')}
                  </p>
                );
              })()}
            </article>
          ))}
        </section>
      )}

      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <section style={{ marginBottom: '6mm' }}>
          <h2 style={sectionTitleStyle}>Certifications</h2>
          {certifications.map((cert, idx) => (
            <article key={idx} style={{ marginBottom: '2mm' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '10pt', fontWeight: 'bold', margin: 0 }}>
                    {cert.name}
                  </h3>
                  {cert.issuer && (
                    <p style={{ fontSize: '9pt', color: colors.textLight, margin: '0.5mm 0 0 0', fontStyle: 'italic' }}>
                      {cert.issuer}
                    </p>
                  )}
                  {cert.credentialId && (
                    <p style={{ fontSize: '8.5pt', color: colors.textLight, margin: '0.5mm 0 0 0' }}>
                      Credential ID: {cert.credentialId}
                    </p>
                  )}
                </div>
                {cert.date && (
                  <span style={{ fontSize: '9pt', color: colors.primary, whiteSpace: 'nowrap', marginLeft: '3mm' }}>
                    {cert.date}
                  </span>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Achievements */}
      {achievements && achievements.length > 0 && (
        <section style={{ marginBottom: '6mm' }}>
          <h2 style={sectionTitleStyle}>Achievements</h2>
          {achievements.map((achievement, idx) => (
            <article key={idx} style={{ marginBottom: '2mm' }}>
              <p style={{ fontSize: '9.5pt', margin: 0, lineHeight: 1.4 }}>
                {typeof achievement === 'string' ? achievement : achievement.title || achievement.description || ''}
              </p>
            </article>
          ))}
        </section>
      )}

      {/* Custom Sections */}
      {customSections && customSections.length > 0 && customSections.map((section, idx) => (
        section && section.title && (
          <section key={section.id || idx} style={{ marginBottom: '6mm' }}>
            <h2 style={sectionTitleStyle}>{section.title}</h2>
            {section.items && section.items.length > 0 && section.items.map((item, i) => (
              <div key={item.id || i} style={{ marginBottom: '3mm' }}>
                {item.heading && (
                  <h3 style={{ fontSize: '10pt', fontWeight: 'bold', margin: 0 }}>
                    {item.heading}
                  </h3>
                )}
                {item.subheading && (
                  <p style={{ margin: '0.5mm 0', fontSize: '9.5pt', color: colors.textLight }}>
                    {item.subheading}
                  </p>
                )}
                {item.description && (
                  <p style={{ margin: '1mm 0 0 0', fontSize: '9.5pt' }}>
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </section>
        )
      ))}
    </div>
  )
}

export default StandardTemplate
