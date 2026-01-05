/**
 * Resume Section Converter Utilities
 * 
 * Converts between legacy metadata format and new flexible sections format
 * This ensures backward compatibility during migration
 */

/**
 * Convert legacy metadata to sections array
 */
export const metadataToSections = (metadata) => {
  const sections = [];
  let order = 0;

  if (!metadata) return sections;

  // Header section (from personalInfo)
  if (metadata.personalInfo) {
    sections.push({
      type: 'header',
      order: order++,
      title: 'Header',
      content: metadata.personalInfo
    });
  }

  // Summary section
  if (metadata.personalInfo?.summary) {
    sections.push({
      type: 'summary',
      order: order++,
      title: 'Professional Summary',
      content: { text: metadata.personalInfo.summary }
    });
  }

  // Experience section
  if (metadata.experience && metadata.experience.length > 0) {
    sections.push({
      type: 'experience',
      order: order++,
      title: 'Professional Experience',
      content: { items: metadata.experience }
    });
  }

  // Education section
  if (metadata.education && metadata.education.length > 0) {
    sections.push({
      type: 'education',
      order: order++,
      title: 'Education',
      content: { items: metadata.education }
    });
  }

  // Skills section
  if (metadata.skills && metadata.skills.length > 0) {
    const skillsArray = Array.isArray(metadata.skills[0]) ? metadata.skills : [metadata.skills];
    sections.push({
      type: 'skills',
      order: order++,
      title: 'Skills',
      content: { items: skillsArray }
    });
  }

  // Projects section
  if (metadata.projects && metadata.projects.length > 0) {
    sections.push({
      type: 'projects',
      order: order++,
      title: 'Projects',
      content: { items: metadata.projects }
    });
  }

  // Certifications section
  if (metadata.certifications && metadata.certifications.length > 0) {
    sections.push({
      type: 'certifications',
      order: order++,
      title: 'Certifications',
      content: { items: metadata.certifications }
    });
  }

  // Achievements section
  if (metadata.achievements && metadata.achievements.length > 0) {
    sections.push({
      type: 'achievements',
      order: order++,
      title: 'Achievements',
      content: { items: metadata.achievements }
    });
  }

  // Custom sections
  if (metadata.customSections && metadata.customSections.length > 0) {
    metadata.customSections.forEach(section => {
      sections.push({
        type: 'custom',
        order: order++,
        title: section.title || 'Custom Section',
        content: {
          items: section.items || section.content || []
        }
      });
    });
  }

  return sections;
};

/**
 * Convert sections array to legacy metadata format (for backward compatibility)
 */
export const sectionsToMetadata = (sections) => {
  const metadata = {
    personalInfo: {},
    education: [],
    experience: [],
    skills: [],
    projects: [],
    certifications: [],
    achievements: [],
    customSections: []
  };

  if (!sections || sections.length === 0) return metadata;

  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  sortedSections.forEach(section => {
    switch (section.type) {
      case 'header':
        metadata.personalInfo = { ...metadata.personalInfo, ...section.content };
        break;
      case 'summary':
        metadata.personalInfo = { ...metadata.personalInfo, summary: section.content.text || '' };
        break;
      case 'experience':
        if (section.content.items) {
          metadata.experience = section.content.items;
        }
        break;
      case 'education':
        if (section.content.items) {
          metadata.education = section.content.items;
        }
        break;
      case 'skills':
        if (section.content.items) {
          metadata.skills = section.content.items.flat();
        }
        break;
      case 'projects':
        if (section.content.items) {
          metadata.projects = section.content.items;
        }
        break;
      case 'certifications':
        if (section.content.items) {
          metadata.certifications = section.content.items;
        }
        break;
      case 'achievements':
        if (section.content.items) {
          metadata.achievements = section.content.items;
        }
        break;
      case 'custom':
        metadata.customSections.push({
          id: section.id || Date.now().toString(),
          title: section.title,
          items: section.content?.items || [],
          content: section.content // Keep for backward compatibility
        });
        break;
    }
  });

  return metadata;
};





