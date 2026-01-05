import React from 'react'
import StandardTemplate from './templates/StandardTemplate'
import ModernTemplate from './templates/ModernTemplate'
import MinimalTemplate from './templates/MinimalTemplate'
import ProfessionalTemplate from './templates/ProfessionalTemplate'

/**
 * A4ResumeRenderer - Pixel-perfect A4 resume renderer
 * 
 * This component renders resumes in exact A4 dimensions (210mm × 297mm)
 * using different template components based on templateId.
 * 
 * Key features:
 * - Dynamically loads template components
 * - Supports multiple distinct templates (standard, modern, minimal, professional)
 * - Uses CSS mm units for consistent preview and PDF output
 * - Same HTML used for preview and PDF generation
 */

const A4ResumeRenderer = ({ resumeData, templateId = 'standard', forPrint = false }) => {
  // Extract metadata from resumeData (handle both formats)
  const metadata = resumeData?.metadata || resumeData || {}

  // Map template IDs to template components
  const templateMap = {
    'standard': StandardTemplate,
    'modern': ModernTemplate,
    'minimal': MinimalTemplate,
    'professional': ProfessionalTemplate
  }

  // Get the template component (default to StandardTemplate)
  const TemplateComponent = templateMap[templateId] || templateMap['standard']

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

      <TemplateComponent metadata={metadata} />
    </>
  )
}

export default A4ResumeRenderer
