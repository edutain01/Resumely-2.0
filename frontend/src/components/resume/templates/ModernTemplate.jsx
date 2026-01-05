import React from 'react'

// A4 dimensions in mm
const A4 = {
    width: '210mm',
    height: '297mm',
    padding: '10mm',
    paddingTop: '10mm',
    paddingBottom: '10mm'
}

const ModernTemplate = ({ metadata }) => {
    const colors = {
        primary: '#0891b2',
        secondary: '#0e7490',
        text: '#0f172a',
        textLight: '#64748b',
        border: '#e2e8f0',
        background: '#ffffff',
        accent: '#ecfeff',
        sidebarBg: '#f0fdfa'
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
        margin: '0 auto',
        backgroundColor: colors.background,
        color: colors.text,
        fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
        fontSize: '10pt',
        lineHeight: 1.45,
        boxSizing: 'border-box',
        display: 'grid',
        gridTemplateColumns: '70mm 1fr',
        gap: '0',
        overflow: 'visible',
        wordWrap: 'break-word',
        overflowWrap: 'break-word'
    }

    const sidebarStyle = {
        backgroundColor: colors.sidebarBg,
        padding: `${A4.paddingTop} 8mm ${A4.paddingBottom} 8mm`,
        borderRight: `1mm solid ${colors.accent}`
    }

    const mainStyle = {
        padding: `${A4.paddingTop} ${A4.padding} ${A4.paddingBottom} ${A4.padding}`
    }

    const sectionTitleStyle = {
        fontSize: '11pt',
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: '3mm',
        marginTop: '5mm',
        textTransform: 'uppercase',
        letterSpacing: '0.5mm',
        borderBottom: `0.5mm solid ${colors.primary}`,
        paddingBottom: '1mm'
    }

    return (
        <div style={containerStyle} className="a4-resume-container modern-template">
            {/* Left Sidebar */}
            <div style={sidebarStyle}>
                {/* Contact Info */}
                <div style={{ marginBottom: '5mm' }}>
                    <h2 style={{ ...sectionTitleStyle, marginTop: '0' }}>Contact</h2>
                    <div style={{ fontSize: '8.5pt', lineHeight: 1.6 }}>
                        {personalInfo?.email && (
                            <div style={{ marginBottom: '2mm', wordBreak: 'break-all' }}>
                                <strong>Email:</strong><br />
                                {personalInfo.email}
                            </div>
                        )}
                        {personalInfo?.phone && (
                            <div style={{ marginBottom: '2mm' }}>
                                <strong>Phone:</strong><br />
                                {personalInfo.phone}
                            </div>
                        )}
                        {personalInfo?.location && (
                            <div style={{ marginBottom: '2mm' }}>
                                <strong>Location:</strong><br />
                                {personalInfo.location}
                            </div>
                        )}
                        {personalInfo?.linkedin && (
                            <div style={{ marginBottom: '2mm', wordBreak: 'break-all' }}>
                                <strong>LinkedIn:</strong><br />
                                {personalInfo.linkedin}
                            </div>
                        )}
                        {personalInfo?.github && (
                            <div style={{ marginBottom: '2mm', wordBreak: 'break-all' }}>
                                <strong>GitHub:</strong><br />
                                {personalInfo.github}
                            </div>
                        )}
                    </div>
                </div>

                {/* Skills */}
                {skills && skills.length > 0 && (
                    <div style={{ marginBottom: '5mm' }}>
                        <h2 style={sectionTitleStyle}>Skills</h2>
                        <div style={{ fontSize: '8.5pt', lineHeight: 1.6 }}>
                            {skills.map((skill, idx) => (
                                <div key={idx} style={{
                                    padding: '1.5mm 0',
                                    borderBottom: idx < skills.length - 1 ? `0.2mm solid ${colors.border}` : 'none'
                                }}>
                                    {skill}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Education */}
                {education && education.length > 0 && (
                    <div>
                        <h2 style={sectionTitleStyle}>Education</h2>
                        {education.map((edu, idx) => (
                            <div key={idx} style={{ marginBottom: '4mm', fontSize: '8.5pt' }}>
                                <div style={{ fontWeight: 'bold', color: colors.text }}>
                                    {edu.degree}
                                </div>
                                <div style={{ color: colors.textLight, fontSize: '8pt', marginTop: '0.5mm' }}>
                                    {edu.institution}
                                </div>
                                <div style={{ color: colors.primary, fontSize: '8pt', marginTop: '0.5mm' }}>
                                    {edu.startDate} – {edu.endDate}
                                </div>
                                {edu.gpa && (
                                    <div style={{ fontSize: '8pt', marginTop: '0.5mm' }}>
                                        GPA: {edu.gpa}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Right Main Content */}
            <div style={mainStyle}>
                {/* Header */}
                <header style={{ marginBottom: '6mm' }}>
                    <h1 style={{
                        fontSize: '20pt',
                        fontWeight: 'bold',
                        color: colors.primary,
                        margin: '0 0 2mm 0',
                        letterSpacing: '0.5mm',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '100%'
                    }}>
                        {personalInfo?.fullName || personalInfo?.name || 'Your Name'}
                    </h1>
                    {personalInfo?.summary && (
                        <p style={{ fontSize: '9.5pt', margin: '3mm 0 0 0', lineHeight: 1.5, textAlign: 'justify', color: colors.textLight }}>
                            {personalInfo.summary}
                        </p>
                    )}
                </header>

                {/* Experience */}
                {experience && experience.length > 0 && (
                    <section style={{ marginBottom: '5mm' }}>
                        <h2 style={{ ...sectionTitleStyle, marginTop: '0' }}>Experience</h2>
                        {experience.map((exp, idx) => (
                            <article key={idx} style={{ marginBottom: '4mm' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1mm' }}>
                                    <h3 style={{ fontSize: '11pt', fontWeight: 'bold', margin: 0, color: colors.text }}>
                                        {exp.position || exp.title}
                                    </h3>
                                    <span style={{ fontSize: '8.5pt', color: colors.primary, whiteSpace: 'nowrap', marginLeft: '3mm' }}>
                                        {exp.startDate} – {exp.current || exp.endDate === 'Present' ? 'Present' : exp.endDate}
                                    </span>
                                </div>
                                <p style={{ fontSize: '9.5pt', color: colors.textLight, margin: '0 0 1mm 0', fontStyle: 'italic' }}>
                                    {exp.company}{exp.location ? ` • ${exp.location}` : ''}
                                </p>
                                {exp.description && (
                                    <p style={{ fontSize: '9pt', margin: '1mm 0', lineHeight: 1.4 }}>
                                        {exp.description}
                                    </p>
                                )}
                            </article>
                        ))}
                    </section>
                )}

                {/* Projects */}
                {projects && projects.length > 0 && (
                    <section style={{ marginBottom: '5mm' }}>
                        <h2 style={sectionTitleStyle}>Projects</h2>
                        {projects.map((project, idx) => (
                            <article key={idx} style={{ marginBottom: '4mm' }}>
                                <h3 style={{ fontSize: '10.5pt', fontWeight: 'bold', margin: 0, color: colors.text }}>
                                    {project.name}
                                    {project.link && (
                                        <span style={{ fontSize: '8.5pt', fontWeight: 'normal', color: colors.primary, marginLeft: '2mm' }}>
                                            ({project.link})
                                        </span>
                                    )}
                                </h3>
                                {project.description && (
                                    <p style={{ fontSize: '9pt', margin: '1mm 0', lineHeight: 1.4 }}>
                                        {project.description}
                                    </p>
                                )}
                                {project.technologies && (() => {
                                    const techArray = Array.isArray(project.technologies) 
                                        ? project.technologies 
                                        : (typeof project.technologies === 'string' ? [project.technologies] : []);
                                    return techArray.length > 0 && (
                                        <p style={{ fontSize: '8.5pt', margin: '1mm 0 0 0', color: colors.textLight }}>
                                            <strong>Tech:</strong> {techArray.join(', ')}
                                        </p>
                                    );
                                })()}
                            </article>
                        ))}
                    </section>
                )}

                {/* Certifications */}
                {certifications && certifications.length > 0 && (
                    <section style={{ marginBottom: '5mm' }}>
                        <h2 style={sectionTitleStyle}>Certifications</h2>
                        {certifications.map((cert, idx) => (
                            <article key={idx} style={{ marginBottom: '2mm' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '10pt', fontWeight: 'bold', margin: 0 }}>
                                            {cert.name}
                                        </h3>
                                        {cert.issuer && (
                                            <p style={{ fontSize: '9pt', color: colors.textLight, margin: '0.5mm 0 0 0' }}>
                                                {cert.issuer}
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
                    <section style={{ marginBottom: '5mm' }}>
                        <h2 style={sectionTitleStyle}>Achievements</h2>
                        {achievements.map((achievement, idx) => (
                            <article key={idx} style={{ marginBottom: '2mm' }}>
                                <p style={{ fontSize: '9pt', margin: 0, lineHeight: 1.4 }}>
                                    {typeof achievement === 'string' ? achievement : achievement.title || achievement.description || ''}
                                </p>
                            </article>
                        ))}
                    </section>
                )}

                {/* Custom Sections */}
                {customSections && customSections.length > 0 && customSections.map((section, idx) => (
                    section && section.title && (
                        <section key={section.id || idx} style={{ marginBottom: '5mm' }}>
                            <h2 style={sectionTitleStyle}>{section.title}</h2>
                            {section.items && section.items.length > 0 && section.items.map((item, i) => (
                                <div key={item.id || i} style={{ marginBottom: '3mm' }}>
                                    {item.heading && (
                                        <h3 style={{ fontSize: '10pt', fontWeight: 'bold', margin: 0 }}>
                                            {item.heading}
                                        </h3>
                                    )}
                                    {item.subheading && (
                                        <p style={{ margin: '0.5mm 0', fontSize: '9pt', color: colors.textLight }}>
                                            {item.subheading}
                                        </p>
                                    )}
                                    {item.description && (
                                        <p style={{ margin: '1mm 0 0 0', fontSize: '9pt' }}>
                                            {item.description}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </section>
                    )
                ))}
            </div>
        </div>
    )
}

export default ModernTemplate
