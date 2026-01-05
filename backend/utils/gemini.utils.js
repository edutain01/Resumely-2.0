import { GoogleGenAI } from '@google/genai';

// Initialize Gemini AI - will use API key from environment variable GEMINI_API_KEY
let ai = null;

const getAI = () => {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key') {
      throw new Error('GEMINI_API_KEY is not configured in .env file');
    }
    // The client gets the API key from the environment variable GEMINI_API_KEY
    ai = new GoogleGenAI({});
  }
  return ai;
};

/**
 * Basic resume parsing without AI (fallback)
 */
export const basicResumeParser = (resumeText) => {
  const text = resumeText || '';
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Extract email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : '';
  
  // Extract phone
  const phoneMatch = text.match(/(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : '';
  
  // Extract LinkedIn
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  const linkedin = linkedinMatch ? `https://${linkedinMatch[0]}` : '';
  
  // Extract GitHub
  const githubMatch = text.match(/github\.com\/[\w-]+/i);
  const github = githubMatch ? `https://${githubMatch[0]}` : '';
  
  // Try to get name (usually first line)
  let name = '';
  for (const line of lines.slice(0, 5)) {
    if (!line.includes('@') && !line.match(/\d{3}/) && line.length < 50 && line.length > 2) {
      name = line;
      break;
    }
  }
  
  // Find sections by common headers
  const findSection = (headers) => {
    for (const header of headers) {
      const regex = new RegExp(`\\b${header}\\b`, 'i');
      const idx = lines.findIndex(l => regex.test(l));
      if (idx !== -1) return idx;
    }
    return -1;
  };
  
  const summaryIdx = findSection(['summary', 'objective', 'profile', 'about']);
  const experienceIdx = findSection(['experience', 'employment', 'work history', 'professional experience', 'work experience']);
  const educationIdx = findSection(['education', 'academic', 'qualification', 'academic background']);
  const skillsIdx = findSection(['skills', 'technical skills', 'competencies', 'expertise', 'core competencies']);
  const projectsIdx = findSection(['projects', 'portfolio', 'personal projects', 'key projects']);
  const certificationsIdx = findSection(['certifications', 'certificates', 'licenses', 'credentials']);
  const achievementsIdx = findSection(['achievements', 'awards', 'honors', 'accomplishments']);
  
  // Extract summary
  let summary = '';
  if (summaryIdx !== -1) {
    const nextSection = Math.min(
      ...[experienceIdx, educationIdx, skillsIdx, projectsIdx, certificationsIdx, achievementsIdx].filter(i => i > summaryIdx && i !== -1)
    );
    const endIdx = nextSection < Infinity ? nextSection : summaryIdx + 5;
    summary = lines.slice(summaryIdx + 1, endIdx).join(' ').slice(0, 500);
  }
  
  // Extract skills
  let skills = [];
  if (skillsIdx !== -1) {
    const nextSection = Math.min(
      ...[experienceIdx, educationIdx, projectsIdx, certificationsIdx, achievementsIdx].filter(i => i > skillsIdx && i !== -1)
    );
    const endIdx = nextSection < Infinity ? nextSection : skillsIdx + 10;
    const skillLines = lines.slice(skillsIdx + 1, endIdx).join(', ');
    skills = skillLines.split(/[,•·|;]/)
      .map(s => s.trim())
      .filter(s => s.length > 1 && s.length < 50)
      .slice(0, 20);
  }
  
  // Extract education
  const education = [];
  if (educationIdx !== -1) {
    const nextSection = Math.min(
      ...[experienceIdx, skillsIdx, projectsIdx, certificationsIdx, achievementsIdx].filter(i => i > educationIdx && i !== -1)
    );
    const endIdx = nextSection < Infinity ? nextSection : educationIdx + 20;
    const eduLines = lines.slice(educationIdx + 1, endIdx);
    
    // Try to parse education entries (look for degree patterns, institutions, dates)
    let currentEdu = null;
    for (let i = 0; i < eduLines.length; i++) {
      const line = eduLines[i];
      // Check if line looks like a degree (contains degree keywords or institution)
      const degreeMatch = line.match(/\b(B\.?S\.?|B\.?A\.?|B\.?E\.?|M\.?S\.?|M\.?A\.?|M\.?B\.?A\.?|Ph\.?D\.?|Bachelor|Master|Doctorate|Diploma|Certificate)\b/i);
      const institutionMatch = line.match(/\b(University|College|Institute|School|Academy)\b/i);
      const dateMatch = line.match(/\b(19|20)\d{2}\b/);
      
      if (degreeMatch || institutionMatch) {
        // Save previous education entry if exists
        if (currentEdu) {
          education.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            degree: currentEdu.degree || '',
            institution: currentEdu.institution || '',
            location: currentEdu.location || '',
            startDate: currentEdu.startDate || '',
            endDate: currentEdu.endDate || '',
            gpa: currentEdu.gpa || '',
            description: currentEdu.description || ''
          });
        }
        // Start new education entry
        currentEdu = {
          degree: degreeMatch ? line.substring(0, 100) : '',
          institution: institutionMatch ? line : '',
          startDate: dateMatch ? dateMatch[0] : '',
          endDate: '',
          location: '',
          gpa: '',
          description: ''
        };
      } else if (currentEdu) {
        // Continue building current education entry
        if (dateMatch && !currentEdu.endDate) {
          currentEdu.endDate = dateMatch[0];
        } else if (line.length > 5 && line.length < 100) {
          if (!currentEdu.institution) {
            currentEdu.institution = line;
          } else if (!currentEdu.description) {
            currentEdu.description = line;
          }
        }
      }
    }
    // Add last education entry
    if (currentEdu) {
      education.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        degree: currentEdu.degree || '',
        institution: currentEdu.institution || '',
        location: currentEdu.location || '',
        startDate: currentEdu.startDate || '',
        endDate: currentEdu.endDate || '',
        gpa: currentEdu.gpa || '',
        description: currentEdu.description || ''
      });
    }
  }
  
  // Extract experience
  const experience = [];
  if (experienceIdx !== -1) {
    const nextSection = Math.min(
      ...[educationIdx, skillsIdx, projectsIdx, certificationsIdx, achievementsIdx].filter(i => i > experienceIdx && i !== -1)
    );
    const endIdx = nextSection < Infinity ? nextSection : experienceIdx + 30;
    const expLines = lines.slice(experienceIdx + 1, endIdx);
    
    // Try to parse experience entries
    let currentExp = null;
    let descriptionLines = [];
    for (let i = 0; i < expLines.length; i++) {
      const line = expLines[i];
      // Check if line looks like a job title or company
      const titleMatch = line.match(/\b(Engineer|Developer|Manager|Analyst|Designer|Consultant|Specialist|Coordinator|Director|Lead|Senior|Junior|Intern)\b/i);
      const companyMatch = line.match(/\b(Inc\.?|LLC|Corp\.?|Ltd\.?|Company|Technologies|Solutions|Systems)\b/i);
      const dateMatch = line.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\b(19|20)\d{2}\b|Present|Current/i);
      
      if (titleMatch || (companyMatch && !currentExp)) {
        // Save previous experience entry if exists
        if (currentExp) {
          experience.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            title: currentExp.title || currentExp.position || '',
            position: currentExp.position || currentExp.title || '',
            company: currentExp.company || '',
            location: currentExp.location || '',
            startDate: currentExp.startDate || '',
            endDate: currentExp.endDate || '',
            current: currentExp.endDate === 'Present' || currentExp.endDate === 'Current',
            description: descriptionLines.join(' ').slice(0, 500),
            achievements: []
          });
          descriptionLines = [];
        }
        // Start new experience entry
        currentExp = {
          title: titleMatch ? line : '',
          position: titleMatch ? line : '',
          company: companyMatch ? line : '',
          startDate: dateMatch ? dateMatch[0] : '',
          endDate: '',
          location: '',
          description: ''
        };
      } else if (currentExp) {
        // Continue building current experience entry
        if (dateMatch && !currentExp.endDate) {
          currentExp.endDate = dateMatch[0];
        } else if (line.length > 10) {
          if (!currentExp.company && line.length < 50) {
            currentExp.company = line;
          } else {
            descriptionLines.push(line);
          }
        }
      }
    }
    // Add last experience entry
    if (currentExp) {
      experience.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title: currentExp.title || currentExp.position || '',
        position: currentExp.position || currentExp.title || '',
        company: currentExp.company || '',
        location: currentExp.location || '',
        startDate: currentExp.startDate || '',
        endDate: currentExp.endDate || '',
        current: currentExp.endDate === 'Present' || currentExp.endDate === 'Current',
        description: descriptionLines.join(' ').slice(0, 500),
        achievements: []
      });
    }
  }
  
  // Extract projects
  const projects = [];
  if (projectsIdx !== -1) {
    const nextSection = Math.min(
      ...[experienceIdx, educationIdx, skillsIdx, certificationsIdx, achievementsIdx].filter(i => i > projectsIdx && i !== -1)
    );
    const endIdx = nextSection < Infinity ? nextSection : projectsIdx + 15;
    const projLines = lines.slice(projectsIdx + 1, endIdx);
    
    // Simple project extraction - look for project names and descriptions
    let currentProj = null;
    for (let i = 0; i < projLines.length; i++) {
      const line = projLines[i];
      // Check if line looks like a project name (short line, no special chars)
      if (line.length > 3 && line.length < 60 && !line.includes('•') && !line.includes('-')) {
        if (currentProj) {
          projects.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: currentProj.name || '',
            description: currentProj.description || '',
            technologies: [],
            link: '',
            startDate: '',
            endDate: ''
          });
        }
        currentProj = { name: line, description: '' };
      } else if (currentProj && line.length > 10) {
        currentProj.description = (currentProj.description + ' ' + line).slice(0, 300);
      }
    }
    if (currentProj) {
      projects.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: currentProj.name || '',
        description: currentProj.description || '',
        technologies: [],
        link: '',
        startDate: '',
        endDate: ''
      });
    }
  }
  
  // Extract certifications
  const certifications = [];
  if (certificationsIdx !== -1) {
    const nextSection = Math.min(
      ...[experienceIdx, educationIdx, skillsIdx, projectsIdx, achievementsIdx].filter(i => i > certificationsIdx && i !== -1)
    );
    const endIdx = nextSection < Infinity ? nextSection : certificationsIdx + 10;
    const certLines = lines.slice(certificationsIdx + 1, endIdx);
    
    certLines.forEach(line => {
      if (line.length > 5 && line.length < 100) {
        certifications.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: line,
          issuer: '',
          date: '',
          expiryDate: '',
          credentialId: ''
        });
      }
    });
  }
  
  // Extract achievements (simple - just collect lines)
  const achievements = [];
  if (achievementsIdx !== -1) {
    const nextSection = Math.min(
      ...[experienceIdx, educationIdx, skillsIdx, projectsIdx, certificationsIdx].filter(i => i > achievementsIdx && i !== -1)
    );
    const endIdx = nextSection < Infinity ? nextSection : achievementsIdx + 10;
    const achLines = lines.slice(achievementsIdx + 1, endIdx);
    
    achLines.forEach(line => {
      if (line.length > 5 && line.length < 200) {
        achievements.push(line.trim());
      }
    });
  }
  
  return {
    personalInfo: {
      name,
      email,
      phone,
      location: '',
      linkedin,
      github,
      portfolio: '',
      summary
    },
    education,
    experience,
    skills,
    projects,
    certifications,
    achievements,
    customSections: []
  };
};

/**
 * Parse resume text using AI to extract structured data
 */
export const parseResumeWithAI = async (resumeText) => {
  try {
    // Validate input
    if (!resumeText || resumeText.trim().length === 0) {
      throw new Error('Resume text is empty');
    }

    // Check if Gemini API is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key') {
      console.log('Gemini API key not configured, using basic resume parser');
      return basicResumeParser(resumeText);
    }

    const ai = getAI();
    
    const prompt = `
You are an expert resume parser. Extract ALL structured data from the following resume text and return ONLY a valid JSON object with no additional text.

CRITICAL INSTRUCTIONS:
1. Extract EVERY piece of information from the resume - do not skip any sections
2. Identify ALL sections including standard sections (Education, Experience, Skills, Projects) AND custom sections
3. For personalInfo:
   - Extract full name (first line or header)
   - Extract email, phone, location (city, state, country)
   - Extract LinkedIn (linkedin.com/in/username or full URL)
   - Extract GitHub (github.com/username or full URL)
   - Extract portfolio/website URL if mentioned
   - Extract full summary/objective text
4. For education entries, extract: degree, institution, location, startDate, endDate, GPA/percentage, and any description
5. For experience entries, extract: title/position, company, location, employment type (Freelance, Full-time, etc.), startDate, endDate, description, and any achievements or bullet points
6. For skills:
   - Extract ALL skills mentioned, including categorized skills (Programming Languages, Front-End, Back-End, Databases, etc.)
   - If skills are categorized, extract all items from each category
   - Include technical skills, soft skills, tools, methodologies, etc.
7. For projects, extract: name, description, technologies used, links (View Demo, GitHub, etc.), and dates if mentioned - CRITICAL: Extract EVERY project mentioned in the resume, including all project names, full descriptions, and all links
8. For certifications, extract: name, issuer/organization, date, expiry date (if mentioned), and credential ID (if mentioned)
   - Certifications may be listed as bullet points (e.g., "- Certified System Administrator – ServiceNow")
   - Format: "Certification Name – Issuer" or "Certification Name (Issuer)"
   - Extract the certification name (before dash or before parentheses)
   - Extract the issuer (after dash or in parentheses)
   - If issuer is in parentheses like "(Java SE8 Features, OOPs Concepts)", extract the full text
   - Extract ALL certifications listed, even if they're simple bullet points
9. For achievements, extract: title/heading, date (if mentioned), description/details
   - Achievements may be listed as bullet points with full descriptions
   - Format: "Title - Description: Full details..."
   - Extract the complete achievement text including everything after the title
   - Example: "Winner - Synapse 2K25 National Level Hackathon: Secured first place among 250 teams..." - extract the FULL text
   - Extract ALL achievements listed
10. For custom sections, create a custom section for ANY section that doesn't fit standard categories. Examples include:
   - Positions Held / Leadership Roles / Roles & Responsibilities
   - Awards / Honors
   - Publications
   - Volunteer Work / Volunteer Experience
   - Languages
   - Hobbies / Interests
   - References
   - Patents
   - Professional Memberships
   - Conferences / Workshops
   - Extracurricular Activities
   - Any other section that appears in the resume
11. For custom sections, extract ALL items within that section:
    - Each item should have: heading (title/name), subheading (role/organization), date, description
    - If the section has bullet points or multiple entries, create separate items for each
12. Be extremely thorough - extract as much detail as possible from each section
13. If a section appears in the resume but doesn't fit standard categories, it MUST be added to customSections
14. Pay special attention to sections like "Positions Held", "Leadership Roles", "Roles & Responsibilities" - these should be custom sections
15. Extract ALL links mentioned (portfolio, LinkedIn, GitHub, project demos, etc.)

Return JSON in this exact format:
{
  "personalInfo": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": "",
    "portfolio": "",
    "summary": ""
  },
  "education": [
    {
      "degree": "",
      "institution": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "gpa": "",
      "description": ""
    }
  ],
  "experience": [
    {
      "title": "",
      "company": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "description": "",
      "achievements": []
    }
  ],
  "skills": ["skill1", "skill2", "skill3"],
  "projects": [
    {
      "name": "Project Name",
      "description": "Full project description with details",
      "technologies": ["tech1", "tech2"],
      "link": "https://project-link.com",
      "startDate": "",
      "endDate": ""
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "date": "",
      "expiryDate": "",
      "credentialId": ""
    }
  ],
  "achievements": [],
  "customSections": [
    {
      "id": "unique-id",
      "title": "Section Title (e.g., Awards, Publications, Volunteer Work, Languages, etc.)",
      "items": [
        {
          "id": "unique-id",
          "heading": "Main heading/title",
          "subheading": "Optional subheading",
          "date": "Optional date",
          "description": "Optional description"
        }
      ]
    }
  ]
}

For customSections:
- Include ANY section that doesn't fit into the standard categories above
- Common custom sections: Awards, Publications, Volunteer Experience, Languages, Hobbies, References, Patents, Positions Held, Leadership Roles, etc.
- Each custom section should have a descriptive title and items
- Generate unique IDs using timestamp format (e.g., "1234567890")
- IMPORTANT: "Positions Held", "Leadership Roles", "Roles & Responsibilities" should be custom sections

Resume Text:
${resumeText}

CRITICAL REMINDERS FOR YOUR RESUME:
- Extract ALL sections, including "Positions Held", "Leadership Roles", etc. as custom sections
- Extract ALL skills from all categories (Programming Languages, Front-End, Back-End, Databases, Cloud & Tools, Methodologies, etc.)
- For PROJECTS: 
  * Projects may be formatted as: **Project Name – Subtitle** (bold text)
  * Look for "View Demo" links after project names
  * Extract full descriptions that may span multiple lines
  * If a project section has multiple items (like "Chrome Extensions" with "Joke Babai | Wordmaster"), create separate project entries
  * Extract ALL 7 projects: CETA Website, Code Runner & Analyzer, EASYLEAVE, Desiguide, Weather Predictor, MBUSPARKS, Chrome Extensions
- For CERTIFICATIONS:
  * Format: "- Certification Name – Issuer" or "- Certification Name (Issuer Details)"
  * Extract ALL 9 certifications listed
  * Parse issuer correctly (e.g., "ServiceNow", "Infosys Springboard (Java SE8 Features, OOPs Concepts)", "Google (Coursera)")
- For ACHIEVEMENTS:
  * Format: "- Title - Description: Full details..."
  * Extract ALL 3 achievements with complete descriptions
- Extract portfolio links, GitHub links, LinkedIn links, project demo links
- Extract employment types (Freelance, Full-time, etc.) in experience descriptions
- Be comprehensive - don't leave any information behind

Return ONLY the JSON object with clean plain text (no markdown formatting like **, *, __, #, [], etc.). 
- No markdown formatting
- No bold/italic symbols
- No markdown headers
- No markdown links
- No code blocks or backticks
- Just clean, plain text in JSON format
- No explanations, no additional text - just the JSON object.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });
    
    // Handle different response formats
    let text = '';
    
    // Try response.candidates first (Gemini API format - most common)
    if (response.candidates && response.candidates[0] && response.candidates[0].content) {
      const parts = response.candidates[0].content.parts;
      if (parts && parts[0] && parts[0].text) {
        text = parts[0].text;
      }
    }
    // Try response.response.candidates
    else if (response.response && response.response.candidates && response.response.candidates[0]) {
      const parts = response.response.candidates[0].content?.parts;
      if (parts && parts[0] && parts[0].text) {
        text = parts[0].text;
      }
    }
    // Try response.text as string
    else if (typeof response.text === 'string') {
      text = response.text;
    }
    // Try response.text as function
    else if (response.text && typeof response.text === 'function') {
      text = response.text();
    }
    // Try response.data.text
    else if (response.data && response.data.text) {
      text = response.data.text;
    }
    else {
      console.error('Unexpected response format in parseResumeWithAI:', JSON.stringify(response, null, 2));
      throw new Error('Unexpected response format from AI');
    }
    
    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from AI');
    }
    
    // Clean the response to extract JSON - handle markdown code blocks
    let cleanedText = text.trim();
    
    // Remove markdown code blocks if present
    cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Try to find JSON object
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to extract JSON. Response text:', text.substring(0, 500));
      throw new Error('Failed to extract JSON from AI response');
    }
    
    let parsedData;
    try {
      parsedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('JSON String:', jsonMatch[0].substring(0, 500));
      throw new Error('Failed to parse JSON from AI response');
    }
    
    // Log what was extracted for debugging
    console.log('AI Parsed Resume Data:', {
      personalInfo: parsedData.personalInfo ? {
        name: parsedData.personalInfo.name || 'Missing',
        email: parsedData.personalInfo.email || 'Missing',
        phone: parsedData.personalInfo.phone || 'Missing',
        linkedin: parsedData.personalInfo.linkedin || 'Missing',
        github: parsedData.personalInfo.github || 'Missing'
      } : 'Missing',
      educationCount: parsedData.education?.length || 0,
      experienceCount: parsedData.experience?.length || 0,
      skillsCount: parsedData.skills?.length || 0,
      projectsCount: parsedData.projects?.length || 0,
      certificationsCount: parsedData.certifications?.length || 0,
      achievementsCount: parsedData.achievements?.length || 0,
      customSectionsCount: parsedData.customSections?.length || 0,
      customSections: parsedData.customSections?.map(s => s.title) || []
    });
    
    // Ensure all items have IDs
    if (parsedData.education && Array.isArray(parsedData.education)) {
      parsedData.education = parsedData.education.map(edu => ({
        ...edu,
        id: edu.id || Date.now().toString() + Math.random().toString(36).substr(2, 9)
      }));
    }
    
    if (parsedData.experience && Array.isArray(parsedData.experience)) {
      parsedData.experience = parsedData.experience.map(exp => ({
        ...exp,
        id: exp.id || Date.now().toString() + Math.random().toString(36).substr(2, 9)
      }));
    }
    
    if (parsedData.projects && Array.isArray(parsedData.projects)) {
      parsedData.projects = parsedData.projects.map(proj => ({
        ...proj,
        id: proj.id || Date.now().toString() + Math.random().toString(36).substr(2, 9)
      }));
    }
    
    if (parsedData.customSections && Array.isArray(parsedData.customSections)) {
      parsedData.customSections = parsedData.customSections.map(section => ({
        ...section,
        id: section.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title: section.title || 'Untitled Section',
        items: section.items ? section.items.map(item => ({
          ...item,
          id: item.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
          heading: item.heading || item.title || '',
          subheading: item.subheading || '',
          date: item.date || '',
          description: item.description || ''
        })) : []
      }));
    } else {
      // Ensure custom sections array exists
      parsedData.customSections = [];
    }
    
    return parsedData;
  } catch (error) {
    console.error('AI Resume Parsing Error:', error);
    console.log('Falling back to basic resume parser due to error:', error.message);
    return basicResumeParser(resumeText);
  }
};

/**
 * Clean markdown formatting from text
 */
const cleanMarkdown = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  // Remove markdown bold/italic
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1'); // **bold**
  text = text.replace(/\*([^*]+)\*/g, '$1'); // *italic*
  text = text.replace(/__([^_]+)__/g, '$1'); // __bold__
  text = text.replace(/_([^_]+)_/g, '$1'); // _italic_
  
  // Remove markdown headers
  text = text.replace(/^#{1,6}\s+/gm, '');
  
  // Remove markdown links but keep text
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Remove markdown lists
  text = text.replace(/^[\*\-\+]\s+/gm, '');
  text = text.replace(/^\d+\.\s+/gm, '');
  
  // Remove markdown code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');
  
  // Clean up extra whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();
  
  return text;
};

/**
 * Recursively clean markdown from all string values in an object
 */
const cleanMarkdownFromObject = (obj) => {
  if (typeof obj === 'string') {
    return cleanMarkdown(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(item => cleanMarkdownFromObject(item));
  } else if (obj && typeof obj === 'object') {
    const cleaned = {};
    for (const key in obj) {
      cleaned[key] = cleanMarkdownFromObject(obj[key]);
    }
    return cleaned;
  }
  return obj;
};

/**
 * Enhance resume content using AI
 */
export const enhanceResumeContent = async (resumeData, inputs = {}) => {
  try {
    const ai = getAI();
    
    const { experienceLevel = '', targetRole = '', industry = '', atsSuggestions, missingKeywords, sectionWiseTips, customInstructions } = inputs || {};
    
    const prompt = `
You are a professional resume enhancement expert with 15+ years of experience helping job seekers land their dream jobs. Your expertise includes ATS optimization, keyword integration, and crafting compelling career narratives.

TARGET POSITION ANALYSIS:
- Target Role: ${targetRole}
- Experience Level: ${experienceLevel}
- Industry: ${industry || 'General'}

${atsSuggestions && atsSuggestions.length > 0 ? `ATS ANALYSIS FEEDBACK TO APPLY:
The following specific suggestions from ATS analysis must be incorporated:
${atsSuggestions.map((s, i) => `${i + 1}. [${s.type?.toUpperCase() || 'INFO'}] ${s.title || ''}: ${s.description || ''}`).join('\n')}
` : ''}

${missingKeywords && missingKeywords.length > 0 ? `MISSING KEYWORDS TO INTEGRATE:
The following critical keywords are missing and must be naturally integrated: ${missingKeywords.join(', ')}
` : ''}

${sectionWiseTips && Object.keys(sectionWiseTips).length > 0 ? `SECTION-SPECIFIC IMPROVEMENTS:
${Object.entries(sectionWiseTips).map(([section, tips]) => 
  `- ${section}: ${Array.isArray(tips) ? tips.join('; ') : tips}`
).join('\n')}
` : ''}

${customInstructions ? `CUSTOM ENHANCEMENT INSTRUCTIONS:
The user has provided specific instructions for this enhancement:
${customInstructions}

Please incorporate these specific requirements while following all other enhancement guidelines below.
` : ''}

ENHANCEMENT INSTRUCTIONS:
Transform this resume into an ATS-optimized, compelling document that will pass applicant tracking systems and impress hiring managers. Follow these professional standards:

1. SUMMARY/PROFILE SECTION:
   - Create a powerful 3-4 line professional summary that immediately communicates value
   - Include 3-5 relevant keywords from the target role
   - Quantify achievements when possible
   - Use industry-specific terminology
   - Make it scannable for both ATS and human readers

2. EXPERIENCE SECTION:
   - Rewrite ALL bullet points using strong action verbs (Led, Developed, Implemented, Optimized, Achieved, etc.)
   - Start each bullet with a power verb
   - Add quantifiable metrics (percentages, dollar amounts, team sizes, timeframes)
   - Include relevant keywords naturally throughout
   - Focus on achievements and impact, not just responsibilities
   - Use industry-standard terminology
   - Ensure each role demonstrates progression and growth
   - Format: Action Verb + What You Did + Quantified Result + Impact

3. PROJECTS SECTION:
   - Enhance project descriptions with technical depth
   - Add quantifiable outcomes and metrics
   - Include technologies and methodologies used
   - Highlight business impact and problem-solving
   - Make projects relevant to target role

4. SKILLS SECTION:
   - Ensure all skills are relevant to the target role
   - Include both technical and soft skills
   - Use industry-standard skill names
   - Categorize skills logically (Technical, Tools, Methodologies, etc.)

5. EDUCATION & CERTIFICATIONS:
   - Enhance descriptions to show relevance
   - Add any relevant coursework or achievements
   - Format consistently

6. KEYWORD OPTIMIZATION:
   - Naturally integrate 10-15 relevant keywords from the target role
   - Avoid keyword stuffing - make it read naturally
   - Use variations of important terms
   - Include both technical and soft skill keywords

7. ATS OPTIMIZATION:
   - Ensure all dates are in consistent format (MM/YYYY or Month YYYY)
   - Use standard section headings
   - Avoid graphics, tables, or complex formatting
   - Ensure proper spacing and readability
   - Use standard fonts and formatting

8. PROFESSIONAL TONE:
   - Maintain confident, professional language
   - Use present tense for current roles, past tense for previous roles
   - Avoid first-person pronouns
   - Keep language concise and impactful
   - Remove any filler words or vague statements

9. CUSTOM SECTIONS:
   - Enhance any custom sections with relevant, impactful content
   - Ensure they add value to the overall narrative

CRITICAL REQUIREMENTS:
- Maintain the EXACT same JSON structure as the input
- Do NOT add new fields or remove existing fields
- Do NOT change field names
- Enhance content while preserving all original information
- Make improvements that would increase ATS score by 20-30 points
- Ensure every section is optimized for both ATS and human readers
- DO NOT use markdown formatting (no **, *, __, _, #, [], etc.) - use plain text only
- DO NOT use markdown code blocks or backticks
- Return clean, plain text content without any formatting symbols
- All text should be readable plain text that can be directly inserted into the resume

Current Resume Data (JSON):
${JSON.stringify(resumeData, null, 2)}

Return ONLY the enhanced JSON object with the same structure. 
- No markdown formatting
- No bold/italic symbols (**, *, __, _)
- No markdown headers (#)
- No markdown links ([text](url))
- No code blocks or backticks
- Just clean, plain text in JSON format
- No explanations, no additional text - just the JSON object.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });
    
    // Handle different response formats
    let text = '';
    
    // Try response.candidates first (Gemini API format - most common)
    if (response.candidates && response.candidates[0] && response.candidates[0].content) {
      const parts = response.candidates[0].content.parts;
      if (parts && parts[0] && parts[0].text) {
        text = parts[0].text;
      }
    }
    // Try response.response.candidates
    else if (response.response && response.response.candidates && response.response.candidates[0]) {
      const parts = response.response.candidates[0].content?.parts;
      if (parts && parts[0] && parts[0].text) {
        text = parts[0].text;
      }
    }
    // Try response.text as string
    else if (typeof response.text === 'string') {
      text = response.text;
    }
    // Try response.text as function
    else if (response.text && typeof response.text === 'function') {
      text = response.text();
    }
    // Try response.data.text
    else if (response.data && response.data.text) {
      text = response.data.text;
    }
    else {
      console.error('Unexpected response format:', JSON.stringify(response, null, 2));
      throw new Error('Unexpected response format from AI');
    }
    
    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from AI');
    }
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response. Response text:', text.substring(0, 500));
      throw new Error('Failed to extract JSON from AI response');
    }
    
    let enhancedData;
    try {
      enhancedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('JSON string:', jsonMatch[0].substring(0, 500));
      throw new Error(`Failed to parse JSON from AI response: ${parseError.message}`);
    }
    
    if (!enhancedData || typeof enhancedData !== 'object') {
      throw new Error('Enhanced data is not a valid object');
    }
    
    // Clean markdown formatting from the enhanced data
    const cleanedData = cleanMarkdownFromObject(enhancedData);
    
    return cleanedData;
  } catch (error) {
    console.error('AI Content Enhancement Error:', error);
    console.error('Error stack:', error.stack);
    throw new Error(`Failed to enhance resume content: ${error.message}`);
  }
};

/**
 * Basic ATS analysis without AI (fallback)
 */
const basicATSAnalysis = (resumeText, inputs) => {
  const { targetRole, experienceLevel, industry } = inputs;
  const text = resumeText.toLowerCase();
  const role = targetRole.toLowerCase();
  
  // Common ATS keywords by category
  const commonKeywords = {
    general: ['experience', 'skills', 'education', 'project', 'achievement', 'leadership', 'team', 'communication', 'problem-solving'],
    tech: ['javascript', 'python', 'react', 'node', 'sql', 'api', 'git', 'agile', 'cloud', 'database', 'software', 'development', 'programming'],
    management: ['management', 'leadership', 'strategy', 'planning', 'budget', 'stakeholder', 'project management', 'team lead'],
    marketing: ['marketing', 'seo', 'analytics', 'campaign', 'content', 'social media', 'brand', 'digital marketing'],
    finance: ['finance', 'accounting', 'analysis', 'budget', 'forecasting', 'excel', 'reporting', 'compliance'],
    design: ['design', 'ui', 'ux', 'figma', 'adobe', 'creative', 'visual', 'prototype', 'user research']
  };

  // Role-based keywords
  const roleKeywords = role.split(' ').filter(w => w.length > 3);
  
  // Determine industry keywords
  let industryKeywords = commonKeywords.general;
  if (industry) {
    const ind = industry.toLowerCase();
    if (ind.includes('tech') || ind.includes('software') || ind.includes('it')) industryKeywords = [...commonKeywords.general, ...commonKeywords.tech];
    else if (ind.includes('market')) industryKeywords = [...commonKeywords.general, ...commonKeywords.marketing];
    else if (ind.includes('finance') || ind.includes('bank')) industryKeywords = [...commonKeywords.general, ...commonKeywords.finance];
    else if (ind.includes('design')) industryKeywords = [...commonKeywords.general, ...commonKeywords.design];
  } else {
    // Try to detect from role
    if (role.includes('develop') || role.includes('engineer') || role.includes('software')) {
      industryKeywords = [...commonKeywords.general, ...commonKeywords.tech];
    } else if (role.includes('market')) {
      industryKeywords = [...commonKeywords.general, ...commonKeywords.marketing];
    } else if (role.includes('design')) {
      industryKeywords = [...commonKeywords.general, ...commonKeywords.design];
    }
  }

  // Check for keywords
  const foundKeywords = [];
  const missingKeywords = [];
  
  [...industryKeywords, ...roleKeywords].forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      if (!foundKeywords.includes(keyword)) foundKeywords.push(keyword);
    } else {
      if (!missingKeywords.includes(keyword) && !foundKeywords.includes(keyword)) missingKeywords.push(keyword);
    }
  });

  // Check for sections
  const sections = {
    personalInfo: text.includes('email') || text.includes('phone') || text.includes('@'),
    education: text.includes('education') || text.includes('degree') || text.includes('university') || text.includes('college'),
    experience: text.includes('experience') || text.includes('work') || text.includes('employment'),
    skills: text.includes('skill') || text.includes('proficient') || text.includes('expertise'),
    projects: text.includes('project') || text.includes('portfolio')
  };

  // Calculate scores
  const keywordScore = Math.min(100, Math.round((foundKeywords.length / (foundKeywords.length + missingKeywords.length)) * 100)) || 50;
  const sectionScore = Object.values(sections).filter(Boolean).length * 20;
  const lengthScore = Math.min(20, Math.round(text.length / 200));
  
  const score = Math.min(100, Math.round((keywordScore * 0.5) + (sectionScore * 0.4) + lengthScore));

  // Generate suggestions
  const suggestions = [];
  if (!sections.personalInfo) suggestions.push('Add contact information including email and phone number');
  if (!sections.education) suggestions.push('Include your educational background');
  if (!sections.experience) suggestions.push('Add work experience section with detailed descriptions');
  if (!sections.skills) suggestions.push('Create a dedicated skills section');
  if (!sections.projects) suggestions.push('Consider adding a projects section to showcase your work');
  if (missingKeywords.length > 0) suggestions.push(`Consider adding keywords: ${missingKeywords.slice(0, 5).join(', ')}`);
  if (text.length < 500) suggestions.push('Your resume content seems brief. Consider adding more detail');
  
  // Section-wise tips
  const sectionWiseTips = {
    personalInfo: sections.personalInfo 
      ? ['Ensure all contact details are up to date'] 
      : ['Add your name, email, phone, and location'],
    education: sections.education 
      ? ['Include graduation dates and GPA if notable'] 
      : ['Add your educational qualifications'],
    experience: sections.experience 
      ? ['Use action verbs and quantify achievements', 'Include job titles, company names, and dates'] 
      : ['Add your work experience with detailed descriptions'],
    skills: sections.skills 
      ? ['Organize skills by category for better readability'] 
      : ['Create a skills section listing your technical and soft skills'],
    projects: sections.projects 
      ? ['Include technologies used and your role in each project'] 
      : ['Add relevant projects to demonstrate your abilities']
  };

  // Formatting suggestions
  const formattingSuggestions = [
    'Use a clean, ATS-friendly format',
    'Avoid tables, images, and complex formatting',
    'Use standard section headings',
    'Keep bullet points concise and impactful'
  ];

  return {
    score,
    keywordMatch: keywordScore,
    missingKeywords: missingKeywords.slice(0, 10),
    suggestions,
    sectionWiseTips,
    formattingSuggestions,
    aiAnalysis: `Resume analysis for ${targetRole} position. Your resume scored ${score}/100 based on keyword relevance (${keywordScore}%), section completeness (${sectionScore}%), and content depth. ${foundKeywords.length} relevant keywords were found. ${suggestions.length > 0 ? 'Key areas for improvement: ' + suggestions.slice(0, 3).join('. ') : 'Your resume covers the essential sections.'}`
  };
};

/**
 * Analyze resume for ATS compatibility
 */
export const analyzeATS = async (resumeText, inputs) => {
  try {
    // Check if AI is available
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key') {
      console.log('Gemini API key not configured, using basic ATS analysis');
      return basicATSAnalysis(resumeText, inputs);
    }

    const ai = getAI();
    
    const { targetRole, experienceLevel, industry } = inputs;
    
    const prompt = `
You are a senior ATS (Applicant Tracking System) optimization expert with deep knowledge of how major ATS platforms (Taleo, Workday, Greenhouse, Lever, iCIMS, etc.) parse and score resumes. You have analyzed thousands of resumes and understand exactly what makes a resume pass ATS filters.

TARGET POSITION:
- Role: ${targetRole}
- Experience Level: ${experienceLevel}
- Industry: ${industry || 'General'}

ANALYSIS FRAMEWORK:
Perform a comprehensive, professional-grade ATS analysis following industry best practices used by top resume services.

1. KEYWORD ANALYSIS (Critical for ATS):
   - Identify all relevant keywords for the target role
   - Check keyword density and placement
   - Identify missing critical keywords
   - Check for keyword variations and synonyms
   - Score keyword optimization (0-100)
   - Provide specific missing keywords that would improve ATS score

2. SECTION COMPLETENESS:
   - Verify all standard sections are present (Contact, Summary, Experience, Education, Skills)
   - Check for missing critical sections
   - Assess section order and organization
   - Evaluate content depth in each section

3. FORMATTING & STRUCTURE (ATS Parsing):
   - Check for ATS-friendly formatting (no tables, graphics, complex layouts)
   - Verify consistent date formats
   - Check for proper section headings
   - Assess file format compatibility
   - Identify formatting issues that could cause parsing errors
   - Check for proper spacing and readability

4. CONTENT QUALITY:
   - Evaluate use of action verbs
   - Check for quantifiable achievements
   - Assess professional tone and language
   - Review clarity and conciseness
   - Check for industry-appropriate terminology

5. EXPERIENCE LEVEL MATCHING:
   - Verify content matches stated experience level
   - Check for appropriate depth and detail
   - Assess career progression narrative

6. ATS-SPECIFIC ISSUES:
   - Identify potential parsing errors
   - Check for non-standard characters or symbols
   - Verify contact information format
   - Check for proper section naming
   - Identify any red flags that could cause rejection

SCORING CRITERIA:
- Score (0-100): Overall ATS compatibility score
  * 90-100: Excellent - Will pass most ATS systems
  * 80-89: Good - Minor improvements needed
  * 70-79: Fair - Several areas need improvement
  * 60-69: Poor - Significant improvements required
  * Below 60: Critical issues - Unlikely to pass ATS

- Keyword Match (0-100): Percentage of relevant keywords present

Provide actionable, specific recommendations that will measurably improve ATS score.

Resume Text:
${resumeText}

Return ONLY a valid JSON object with this exact structure:
{
  "score": 0-100,
  "keywordMatch": 0-100,
  "missingKeywords": ["keyword1", "keyword2", ...],
  "suggestions": [
    {"type": "critical" | "warning" | "info", "title": "Short actionable title", "description": "Detailed explanation"},
    ...
  ],
  "sectionWiseTips": {
    "personalInfo": ["specific tip1", "specific tip2"],
    "education": ["specific tip1", "specific tip2"],
    "experience": ["specific tip1", "specific tip2"],
    "skills": ["specific tip1", "specific tip2"],
    "projects": ["specific tip1", "specific tip2"],
    "summary": ["specific tip1", "specific tip2"]
  },
  "formattingSuggestions": ["specific formatting suggestion1", "specific formatting suggestion2", ...],
  "aiAnalysis": "Comprehensive 3-4 paragraph analysis explaining: (1) Current ATS score and what it means, (2) Key strengths of the resume, (3) Critical weaknesses that are lowering the score, (4) Specific actionable steps to improve the score by 15-25 points, (5) Industry-specific recommendations for this role and experience level. Write in a professional, encouraging tone similar to top resume services."
}

Return ONLY the JSON object with clean plain text (no markdown formatting like **, *, __, #, [], etc.). 
- No markdown formatting
- No bold/italic symbols
- No markdown headers
- No markdown links
- No code blocks or backticks
- Just clean, plain text in JSON format
- No explanations, no additional text - just the JSON object.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });
    
    console.log('AI Response type:', typeof response);
    console.log('AI Response keys:', Object.keys(response || {}));
    
    // Handle different response formats
    let text = '';
    
    // Try response.candidates first (Gemini API format - most common)
    if (response.candidates && response.candidates[0] && response.candidates[0].content) {
      const parts = response.candidates[0].content.parts;
      if (parts && parts[0] && parts[0].text) {
        text = parts[0].text;
      }
    }
    // Try response.response.candidates
    else if (response.response && response.response.candidates && response.response.candidates[0]) {
      const parts = response.response.candidates[0].content?.parts;
      if (parts && parts[0] && parts[0].text) {
        text = parts[0].text;
      }
    }
    // Try response.text as string
    else if (typeof response.text === 'string') {
      text = response.text;
    }
    // Try response.text as function
    else if (response.text && typeof response.text === 'function') {
      text = response.text();
    }
    // Try response.response.text()
    else if (response.response && typeof response.response.text === 'function') {
      text = response.response.text();
    }
    // Try response.data.text
    else if (response.data && response.data.text) {
      text = response.data.text;
    }
    // Last resort: try to stringify and extract
    else {
      console.error('Unexpected response format in analyzeATS. Full response:', JSON.stringify(response, null, 2));
      // Try to extract text from any nested structure
      const responseStr = JSON.stringify(response);
      const textMatch = responseStr.match(/"text"\s*:\s*"([^"]+)"/);
      if (textMatch) {
        text = textMatch[1];
      } else {
        throw new Error('Unexpected response format from AI - could not extract text');
      }
    }
    
    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from AI');
    }
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response. Response text:', text.substring(0, 500));
      throw new Error('Failed to extract JSON from AI response');
    }
    
    let analysis = JSON.parse(jsonMatch[0]);
    
    // Clean markdown from all string values in the analysis
    analysis = cleanMarkdownFromObject(analysis);
    
    // Ensure score is between 0-100
    analysis.score = Math.max(0, Math.min(100, parseInt(analysis.score) || 0));
    analysis.keywordMatch = Math.max(0, Math.min(100, parseInt(analysis.keywordMatch) || 0));
    
    return analysis;
  } catch (error) {
    console.error('ATS Analysis Error:', error);
    // Fallback to basic analysis if AI fails
    console.log('Falling back to basic ATS analysis due to error:', error.message);
    return basicATSAnalysis(resumeText, inputs);
  }
};




