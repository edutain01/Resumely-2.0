import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Template from '../models/Template.model.js';
import User from '../models/User.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Example custom HTML template for reference
const creativeTemplateHTML = `
<div class="resume-container">
  <header class="resume-header">
    <div class="name-section">
      <h1 class="full-name">{{personalInfo.fullName}}</h1>
      <p class="job-title">{{personalInfo.title}}</p>
    </div>
    <div class="contact-info">
      {{#if personalInfo.email}}<span class="contact-item">📧 {{personalInfo.email}}</span>{{/if}}
      {{#if personalInfo.phone}}<span class="contact-item">📱 {{personalInfo.phone}}</span>{{/if}}
      {{#if personalInfo.location}}<span class="contact-item">📍 {{personalInfo.location}}</span>{{/if}}
      {{#if personalInfo.linkedin}}<span class="contact-item">💼 {{personalInfo.linkedin}}</span>{{/if}}
      {{#if personalInfo.website}}<span class="contact-item">🌐 {{personalInfo.website}}</span>{{/if}}
    </div>
  </header>

  {{#if summary}}
  <section class="resume-section summary-section">
    <h2 class="section-title">Professional Summary</h2>
    <p class="summary-text">{{summary}}</p>
  </section>
  {{/if}}

  {{#if experience.length}}
  <section class="resume-section">
    <h2 class="section-title">Experience</h2>
    {{#each experience}}
    <div class="experience-item">
      <div class="item-header">
        <h3 class="item-title">{{this.title}}</h3>
        <span class="item-date">{{this.startDate}} - {{this.endDate}}</span>
      </div>
      <p class="item-subtitle">{{this.company}}{{#if this.location}} • {{this.location}}{{/if}}</p>
      {{#if this.description}}<p class="item-description">{{this.description}}</p>{{/if}}
      {{#if this.achievements.length}}
      <ul class="achievements-list">
        {{#each this.achievements}}<li>{{this}}</li>{{/each}}
      </ul>
      {{/if}}
    </div>
    {{/each}}
  </section>
  {{/if}}

  {{#if education.length}}
  <section class="resume-section">
    <h2 class="section-title">Education</h2>
    {{#each education}}
    <div class="education-item">
      <div class="item-header">
        <h3 class="item-title">{{this.degree}}{{#if this.field}} in {{this.field}}{{/if}}</h3>
        <span class="item-date">{{this.startDate}} - {{this.endDate}}</span>
      </div>
      <p class="item-subtitle">{{this.institution}}{{#if this.location}} • {{this.location}}{{/if}}</p>
      {{#if this.gpa}}<p class="gpa">GPA: {{this.gpa}}</p>{{/if}}
    </div>
    {{/each}}
  </section>
  {{/if}}

  {{#if skills.length}}
  <section class="resume-section">
    <h2 class="section-title">Skills</h2>
    <div class="skills-container">
      {{#each skills}}
      <div class="skill-category">
        {{#if this.category}}<h4 class="skill-category-name">{{this.category}}</h4>{{/if}}
        <div class="skill-items">
          {{#each this.items}}<span class="skill-tag">{{this}}</span>{{/each}}
        </div>
      </div>
      {{/each}}
    </div>
  </section>
  {{/if}}

  {{#if projects.length}}
  <section class="resume-section">
    <h2 class="section-title">Projects</h2>
    {{#each projects}}
    <div class="project-item">
      <div class="item-header">
        <h3 class="item-title">{{this.name}}</h3>
        {{#if this.date}}<span class="item-date">{{this.date}}</span>{{/if}}
      </div>
      {{#if this.description}}<p class="item-description">{{this.description}}</p>{{/if}}
      {{#if this.technologies}}<p class="technologies">Technologies: {{this.technologies}}</p>{{/if}}
      {{#if this.link}}<a href="{{this.link}}" class="project-link">View Project</a>{{/if}}
    </div>
    {{/each}}
  </section>
  {{/if}}

  {{#if certifications.length}}
  <section class="resume-section">
    <h2 class="section-title">Certifications</h2>
    {{#each certifications}}
    <div class="certification-item">
      <span class="cert-name">{{this.name}}</span>
      {{#if this.issuer}}<span class="cert-issuer"> - {{this.issuer}}</span>{{/if}}
      {{#if this.date}}<span class="cert-date">({{this.date}})</span>{{/if}}
    </div>
    {{/each}}
  </section>
  {{/if}}
</div>
`;

const creativeTemplateCSS = `
.resume-container {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #2d3748;
  line-height: 1.5;
  max-width: 100%;
}

.resume-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  margin: -20px -20px 20px -20px;
  border-radius: 0 0 12px 12px;
}

.full-name {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 4px 0;
  letter-spacing: 0.5px;
}

.job-title {
  font-size: 16px;
  opacity: 0.9;
  margin: 0 0 12px 0;
}

.contact-info {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
}

.contact-item {
  background: rgba(255,255,255,0.2);
  padding: 4px 10px;
  border-radius: 20px;
}

.resume-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #667eea;
  border-bottom: 2px solid #667eea;
  padding-bottom: 6px;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.summary-text {
  font-size: 13px;
  color: #4a5568;
  margin: 0;
}

.experience-item, .education-item, .project-item {
  margin-bottom: 16px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
}

.item-title {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.item-date {
  font-size: 12px;
  color: #718096;
  font-style: italic;
}

.item-subtitle {
  font-size: 13px;
  color: #4a5568;
  margin: 2px 0 6px 0;
}

.item-description {
  font-size: 12px;
  color: #4a5568;
  margin: 6px 0;
}

.achievements-list {
  margin: 6px 0 0 16px;
  padding: 0;
  font-size: 12px;
}

.achievements-list li {
  margin-bottom: 3px;
  color: #4a5568;
}

.gpa {
  font-size: 12px;
  color: #718096;
  margin: 4px 0 0 0;
}

.skills-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skill-category-name {
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
  margin: 0 0 6px 0;
}

.skill-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.skill-tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.certification-item {
  font-size: 13px;
  margin-bottom: 6px;
}

.cert-name {
  font-weight: 600;
}

.cert-issuer {
  color: #4a5568;
}

.cert-date {
  color: #718096;
  font-size: 12px;
}

.technologies {
  font-size: 11px;
  color: #718096;
  margin: 4px 0;
}

.project-link {
  font-size: 11px;
  color: #667eea;
  text-decoration: none;
}
`;

const templates = [
  {
    name: 'Standard Professional',
    description: 'Clean and professional template suitable for all industries',
    category: 'standard',
    componentCode: 'StandardTemplate',
    templateStyles: '',
    isBuiltIn: true,
    isDefault: true,
    isActive: true
  },
  {
    name: 'Modern',
    description: 'Contemporary design with bold headers and modern styling',
    category: 'modern',
    componentCode: 'ModernTemplate',
    templateStyles: '',
    isBuiltIn: true,
    isDefault: false,
    isActive: true
  },
  {
    name: 'Minimal',
    description: 'Simple and clean design focused on content',
    category: 'minimal',
    componentCode: 'MinimalTemplate',
    templateStyles: '',
    isBuiltIn: true,
    isDefault: false,
    isActive: true
  },
  {
    name: 'Professional Executive',
    description: 'Sophisticated template for senior positions',
    category: 'professional',
    componentCode: 'ProfessionalTemplate',
    templateStyles: '',
    isBuiltIn: true,
    isDefault: false,
    isActive: true
  },
  {
    name: 'Creative Gradient',
    description: 'Modern creative template with gradient header - Example custom template',
    category: 'creative',
    componentCode: creativeTemplateHTML,
    templateStyles: creativeTemplateCSS,
    isBuiltIn: false,
    isDefault: false,
    isActive: true
  }
];

async function seedTemplates() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Find an admin user or create a system user
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('No admin user found, creating system user...');
      adminUser = await User.create({
        name: 'System',
        email: 'system@resumly.com',
        password: 'system123', // This will be hashed by the model
        role: 'admin',
        isActive: true,
        credits: {
          total: 0,
          purchased: 0,
          earned: 0
        }
      });
      console.log('✓ System user created');
    }

    // Clear existing templates
    console.log('Clearing existing templates...');
    await Template.deleteMany({});
    console.log('✓ Existing templates cleared');

    // Create new templates
    console.log('Creating sample templates...');
    const createdTemplates = await Promise.all(
      templates.map(template => 
        Template.create({
          ...template,
          createdBy: adminUser._id
        })
      )
    );

    console.log(`✓ Created ${createdTemplates.length} templates:`);
    createdTemplates.forEach(template => {
      console.log(`  - ${template.name} (${template.category})`);
    });

    console.log('\n✅ Template seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    process.exit(1);
  }
}

// Run the seeder
seedTemplates();
