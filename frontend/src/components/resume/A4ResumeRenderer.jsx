import React from 'react'
import StandardTemplate from './templates/StandardTemplate'
import ModernTemplate from './templates/ModernTemplate'
import MinimalTemplate from './templates/MinimalTemplate'
import ProfessionalTemplate from './templates/ProfessionalTemplate'
import DynamicTemplateRenderer from './templates/DynamicTemplateRenderer'

/**
 * A4ResumeRenderer - Pixel-perfect A4 resume renderer
 * 
 * This component renders resumes in exact A4 dimensions (210mm × 297mm)
 * using different template components based on templateId.
 * 
 * Key features:
 * - Supports built-in templates (standard, modern, minimal, professional)
 * - Supports dynamic templates stored in database (admin-created)
 * - Uses CSS mm units for consistent preview and PDF output
 * - Same HTML used for preview and PDF generation
 * 
 * For dynamic templates:
 * - templateId should be the template object from database
 * - Template object should have: componentCode (HTML), templateStyles (CSS)
 */

const A4ResumeRenderer = ({ resumeData, templateId = 'standard', templateData = null, forPrint = false }) => {
  // Extract metadata from resumeData (handle both formats)
  const metadata = resumeData?.metadata || resumeData || {}

  // Map built-in template IDs to template components
  const builtInTemplates = {
    'standard': StandardTemplate,
    'modern': ModernTemplate,
    'minimal': MinimalTemplate,
    'professional': ProfessionalTemplate
  }

  // Check if this is a dynamic template (has componentCode from database)
  const isDynamicTemplate = templateData && templateData.componentCode && 
    !builtInTemplates[templateData.componentCode] && 
    templateData.componentCode.includes('<')  // Contains HTML

  // Get the template component for built-in templates
  const TemplateComponent = builtInTemplates[templateId] || builtInTemplates['standard']

  return (
    <>
      {/* CSS for print media - ensures consistent PDF output */}
      <style>{`
        .a4-resume-container {
          overflow: visible !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          position: relative;
          min-height: 297mm;
        }
        
        .a4-resume-container * {
          max-width: 100% !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          box-sizing: border-box;
        }
        
        .a4-resume-container h1,
        .a4-resume-container h2,
        .a4-resume-container h3 {
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          max-width: 100% !important;
        }

        /* Page break handling */
        .a4-resume-container section {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .a4-resume-container article {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .a4-resume-container header {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        /* Allow page breaks between major sections if needed */
        .a4-resume-container > section:not(:last-child) {
          page-break-after: auto;
          break-after: auto;
        }
        
        @media print {
          .a4-resume-container {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            padding: 12mm 15mm !important;
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

      {isDynamicTemplate ? (
        <DynamicTemplateRenderer 
          templateCode={templateData.componentCode}
          templateStyles={templateData.templateStyles || ''}
          metadata={metadata}
        />
      ) : (
        <TemplateComponent metadata={metadata} />
      )}
    </>
  )
}

export default A4ResumeRenderer
