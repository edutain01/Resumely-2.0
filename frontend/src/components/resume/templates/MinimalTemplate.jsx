import React from 'react'

// A4 dimensions in mm
const A4 = {
    width: '210mm',
    height: '297mm',
    padding: '20mm',
    paddingTop: '15mm',
    paddingBottom: '15mm'
}

const MinimalTemplate = ({ metadata }) => {
    const colors = {
        primary: '#171717',
        secondary: '#404040',
        text: '#171717',
        textLight: '#737373',
        border: '#d4d4d4',
        background: '#ffffff'
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
        lineHeight: 1.4,
        boxSizing: 'border-box',
        overflow: 'visible',
        wordWrap: 'break-word',
        overflowWrap: 'break-word'
    }

    const sectionTitleStyle = {
        fontFamily: "'Times New Roman', serif",
        fontSize: '11pt',
        fontWeight: 'bold',
        color: colors.primary,
        borderBottom: `0.3mm solid ${colors.border}`,
        paddingBottom: '1mm',
        marginBottom: '3mm',
        marginTop: '5mm',
        letterSpacing: '0.2mm'
    }

    return (
        <div style={containerStyle} className="a4-resume-container minimal-template">
            {/* Header */}
            <header style={{ marginBottom: '5mm', borderBottom: `0.5mm solid ${colors.primary}`, paddingBottom: '3mm' }}>
                <h1 style={{
                    fontFamily: "'Times New Roman', serif",
                    fontSize: '20pt',
                    fontWeight: 'bold',
                    color: colors.primary,
                    margin: '0',
                    letterSpacing: '0.5mm',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    maxWidth: '100%'
                }}>
                    {personalInfo?.fullName || personalInfo?.name || 'Your Name'}
                </h1>

                <div style={{
                    fontSize: '9pt',
                    color: colors.textLight,
                    marginTop: '2mm',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '2mm'
                }}>
                    {personalInfo?.email && <span>{personalInfo.email}</span>}
                    {personalInfo?.phone && <span style={{ marginLeft: '3mm' }}>{personalInfo.phone}</span>}
                    {personalInfo?.location && <span style={{ marginLeft: '3mm' }}>{personalInfo.location}</span>}
                </div>
                {(personalInfo?.linkedin || personalInfo?.github) && (
                    <div style={{ fontSize: '9pt', color: colors.textLight, marginTop: '1mm' }}>
                        {personalInfo?.linkedin && <span>{personalInfo.linkedin}</span>}
                        {personalInfo?.github && (
                            <span style={{ marginLeft: personalInfo?.linkedin ? '3mm' : '0' }}>
                                {personalInfo.github}
                            </span>
                        )}
                    </div>
                )}
            </header>

            {/* Summary */}
            {personalInfo?.summary && (
                <section style={{ marginBottom: '5mm' }}>
                    <p style={{ fontSize: '10pt', margin: 0, lineHeight: 1.5, textAlign: 'justify' }}>
                        {personalInfo.summary}
                    </p>
                </section>
            )}

            {/* Experience */}
            {experience && experience.length > 0 && (
                <section style={{ marginBottom: '5mm' }}>
                    <h2 style={{ ...sectionTitleStyle, marginTop: '0' }}>Experience</h2>
                    {experience.map((exp, idx) => (
                        <article key={idx} style={{ marginBottom: '4mm' }}>
                            <div style={{ marginBottom: '1mm' }}>
                                <strong style={{ fontSize: '10.5pt' }}>
                                    {exp.position || exp.title}
                                </strong>
                                <span style={{ fontSize: '9pt', color: colors.textLight, marginLeft: '2mm' }}>
                                    — {exp.company}
                                </span>
                                {exp.location && (
                                    <span style={{ fontSize: '9pt', color: colors.textLight, marginLeft: '2mm' }}>
                                        ({exp.location})
                                    </span>
                                )}
                            </div>
                            <div style={{ fontSize: '9pt', color: colors.textLight, marginBottom: '1mm' }}>
                                {exp.startDate} – {exp.current || exp.endDate === 'Present' ? 'Present' : exp.endDate}
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
                <section style={{ marginBottom: '5mm' }}>
                    <h2 style={sectionTitleStyle}>Education</h2>
                    {education.map((edu, idx) => (
                        <article key={idx} style={{ marginBottom: '3mm' }}>
                            <div>
                                <strong style={{ fontSize: '10.5pt' }}>
                                    {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                                </strong>
                                <span style={{ fontSize: '9pt', color: colors.textLight, marginLeft: '2mm' }}>
                                    — {edu.institution}
                                </span>
                            </div>
                            <div style={{ fontSize: '9pt', color: colors.textLight, marginTop: '0.5mm' }}>
                                {edu.startDate} – {edu.endDate}
                                {edu.gpa && ` • GPA: ${edu.gpa}`}
                            </div>
                        </article>
                    ))}
                </section>
            )}

            {/* Skills */}
            {skills && skills.length > 0 && (
                <section style={{ marginBottom: '5mm' }}>
                    <h2 style={sectionTitleStyle}>Skills</h2>
                    <p style={{ fontSize: '9.5pt', margin: 0, lineHeight: 1.5 }}>
                        {skills.join(' • ')}
                    </p>
                </section>
            )}

            {/* Projects */}
            {projects && projects.length > 0 && (
                <section style={{ marginBottom: '5mm' }}>
                    <h2 style={sectionTitleStyle}>Projects</h2>
                    {projects.map((project, idx) => (
                        <article key={idx} style={{ marginBottom: '3mm' }}>
                            <strong style={{ fontSize: '10.5pt' }}>
                                {project.name}
                            </strong>
                            {project.link && (
                                <span style={{ fontSize: '9pt', color: colors.textLight, marginLeft: '2mm' }}>
                                    ({project.link})
                                </span>
                            )}
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
                                    <p style={{ fontSize: '9pt', margin: '0.5mm 0 0 0', color: colors.textLight }}>
                                        {techArray.join(' • ')}
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
                                    <strong style={{ fontSize: '10pt' }}>
                                        {cert.name}
                                    </strong>
                                    {cert.issuer && (
                                        <span style={{ fontSize: '9pt', color: colors.textLight, marginLeft: '2mm' }}>
                                            — {cert.issuer}
                                        </span>
                                    )}
                                </div>
                                {cert.date && (
                                    <span style={{ fontSize: '9pt', color: colors.textLight, whiteSpace: 'nowrap', marginLeft: '2mm' }}>
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
                    <section key={section.id || idx} style={{ marginBottom: '5mm' }}>
                        <h2 style={sectionTitleStyle}>{section.title}</h2>
                        {section.items && section.items.length > 0 && section.items.map((item, i) => (
                            <div key={item.id || i} style={{ marginBottom: '3mm' }}>
                                {item.heading && (
                                    <strong style={{ fontSize: '10pt' }}>
                                        {item.heading}
                                    </strong>
                                )}
                                {item.subheading && (
                                    <span style={{ fontSize: '9pt', color: colors.textLight, marginLeft: '2mm' }}>
                                        — {item.subheading}
                                    </span>
                                )}
                                {item.date && (
                                    <span style={{ fontSize: '9pt', color: colors.textLight, marginLeft: '2mm' }}>
                                        ({item.date})
                                    </span>
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

export default MinimalTemplate
