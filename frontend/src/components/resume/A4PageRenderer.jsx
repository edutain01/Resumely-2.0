import React, { useRef, useEffect, useState } from 'react'
import A4ResumeRenderer from './A4ResumeRenderer'

/**
 * A4PageRenderer - Multi-page A4 resume preview with zoom controls
 * 
 * Renders resume in true A4 format (210mm × 297mm) with:
 * - Multiple pages with visible spacing
 * - Zoom controls (50% - 150%)
 * - Exact PDF matching
 * - Page break logic
 */

// A4 dimensions in mm (exact ISO 216 standard)
const A4_MM = {
  width: 210,
  height: 297
}

// A4 dimensions in pixels at 96 DPI
const A4_PX = {
  width: 794,  // 210mm × 3.779527559
  height: 1123 // 297mm × 3.779527559
}

const A4PageRenderer = ({ resumeData, templateId = 'standard', zoom = 100 }) => {
  const containerRef = useRef(null)

  const zoomScale = zoom / 100

  return (
    <div
      ref={containerRef}
      className="a4-preview-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px',
        minHeight: '100%',
        boxSizing: 'border-box',
        width: '100%'
      }}
    >
      <style>{`
        .a4-page-wrapper {
          width: ${A4_MM.width}mm;
          min-height: ${A4_MM.height}mm;
          max-width: ${A4_MM.width}mm;
          background: white;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
          overflow: visible;
          position: relative;
          page-break-after: always;
          break-after: page;
          box-sizing: border-box;
          transform: scale(${zoomScale});
          transform-origin: top center;
          margin-bottom: 24px;
          flex-shrink: 0;
        }

        .a4-page-content {
          width: ${A4_MM.width}mm;
          min-height: ${A4_MM.height}mm;
          height: auto;
          overflow: visible;
          box-sizing: border-box;
          position: relative;
        }

        /* Ensure content doesn't overflow pages horizontally */
        .a4-page-content > * {
          max-width: 100%;
          box-sizing: border-box;
        }

        /* Print styles - exact A4 dimensions */
        @media print {
          .a4-preview-container {
            padding: 0 !important;
            gap: 0 !important;
            background: white !important;
          }

          .a4-page-wrapper {
            width: 210mm !important;
            min-height: 297mm !important;
            height: 297mm !important;
            max-width: 210mm !important;
            box-shadow: none !important;
            margin: 0 !important;
            transform: none !important;
            page-break-after: always !important;
            break-after: page !important;
            overflow: visible !important;
          }

          .a4-page-content {
            width: 210mm !important;
            min-height: 297mm !important;
            height: auto !important;
            overflow: visible !important;
          }
        }
      `}</style>

      {/* Render A4 page with all content - let it flow naturally across pages */}
      <div className="a4-page-wrapper">
        <div className="a4-page-content">
          <A4ResumeRenderer
            resumeData={resumeData}
            templateId={templateId}
            forPrint={false}
          />
        </div>
      </div>
    </div>
  )
}

export default A4PageRenderer

