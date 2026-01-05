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

const templates = [
  {
    name: 'Standard Professional',
    description: 'Clean and professional template suitable for all industries',
    category: 'standard',
    componentCode: 'StandardTemplate',
    isDefault: true,
    isActive: true
  },
  {
    name: 'Modern',
    description: 'Contemporary design with bold headers and modern styling',
    category: 'modern',
    componentCode: 'ModernTemplate',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Minimal',
    description: 'Simple and clean design focused on content',
    category: 'minimal',
    componentCode: 'MinimalTemplate',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Professional Executive',
    description: 'Sophisticated template for senior positions',
    category: 'professional',
    componentCode: 'ProfessionalTemplate',
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
