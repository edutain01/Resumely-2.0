import puppeteer from 'puppeteer';
import { generateResumeHTML } from './resumeHTMLGenerator.utils.js';
import { sectionsToMetadata, metadataToSections } from './resumeSectionConverter.utils.js';

/**
 * PDF Generator using Puppeteer
 * 
 * Generates pixel-perfect A4 PDFs using the SAME layout engine as the preview.
 * Uses sections-based rendering for consistent output.
 */

/**
 * Generate PDF from resume sections using Puppeteer
 * 
 * This uses the SAME layout engine as the preview for pixel-perfect output.
 * 
 * @param {Array} sections - Array of section objects (new format)
 * @param {Object} metadata - Legacy metadata object (for backward compatibility)
 * @param {string} templateStyle - Template style name
 * @returns {Promise<Buffer>} - PDF buffer
 */
export const generatePDF = async (sections = null, metadata = null, templateStyle = 'standard') => {
  let browser = null;
  
  try {
    // Convert metadata to sections if sections not provided (backward compatibility)
    let resumeSections = sections;
    if (!resumeSections && metadata) {
      resumeSections = metadataToSections(metadata);
    }
    if (!resumeSections) {
      resumeSections = [];
    }

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security'
      ]
    });
    
    const page = await browser.newPage();
    
    // Listen for page errors
    const pageErrors = [];
    page.on('pageerror', (error) => {
      console.error('Page error:', error);
      pageErrors.push(error);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
        pageErrors.push(msg.text());
      }
    });
    
    // Set viewport to A4 size
    await page.setViewport({
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      deviceScaleFactor: 1
    });
    
    // Generate HTML content using the same renderer as preview
    const html = generateResumeHTML(resumeSections, templateStyle);
    
    // Validate HTML
    if (!html || html.length === 0) {
      throw new Error('Generated HTML is empty');
    }
    
    // Set content with longer timeout
    try {
      await page.setContent(html, {
        waitUntil: 'load', // Changed from networkidle0 to load for faster execution
        timeout: 30000
      });
      
      // Check for page errors after loading
      if (pageErrors.length > 0) {
        console.warn('Page errors detected:', pageErrors);
      }
    } catch (contentError) {
      console.error('Error setting page content:', contentError);
      throw new Error('Failed to set page content: ' + contentError.message);
    }
    
    // Wait a bit for any dynamic content (using setTimeout instead of deprecated waitForTimeout)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Ensure page is fully rendered
    try {
      await page.evaluate(() => {
        return new Promise((resolve) => {
          if (document.readyState === 'complete') {
            resolve();
          } else {
            window.addEventListener('load', resolve);
          }
        });
      });
    } catch (evalError) {
      console.warn('Error waiting for page load:', evalError);
    }
    
    // Generate PDF with A4 format
    let pdfBuffer;
    try {
      pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm'
        },
        preferCSSPageSize: true,
        displayHeaderFooter: false
      });
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
      throw new Error('Failed to generate PDF buffer: ' + pdfError.message);
    }
    
    // Validate PDF buffer
    if (!pdfBuffer) {
      throw new Error('Generated PDF buffer is null or undefined');
    }
    
    // Puppeteer returns Uint8Array, convert to Buffer if needed
    let buffer;
    if (Buffer.isBuffer(pdfBuffer)) {
      buffer = pdfBuffer;
    } else if (pdfBuffer instanceof Uint8Array) {
      buffer = Buffer.from(pdfBuffer);
    } else if (Array.isArray(pdfBuffer)) {
      buffer = Buffer.from(pdfBuffer);
    } else {
      console.error('PDF buffer type:', typeof pdfBuffer);
      console.error('PDF buffer constructor:', pdfBuffer?.constructor?.name);
      console.error('PDF buffer length:', pdfBuffer?.length);
      throw new Error('Generated PDF is not a valid buffer type. Type: ' + typeof pdfBuffer);
    }
    
    if (buffer.length === 0) {
      throw new Error('Generated PDF buffer is empty');
    }
    
    // Check PDF header
    const pdfHeader = buffer.toString('ascii', 0, Math.min(4, buffer.length));
    if (pdfHeader !== '%PDF') {
      console.error('Invalid PDF header. Got:', pdfHeader);
      console.error('First 50 bytes (hex):', buffer.toString('hex', 0, Math.min(50, buffer.length)));
      console.error('First 100 bytes (ascii):', buffer.toString('ascii', 0, Math.min(100, buffer.length)));
      console.error('Page errors:', pageErrors);
      
      // If it looks like HTML error, try to extract error message
      const bufferStr = buffer.toString('utf8', 0, Math.min(500, buffer.length));
      if (bufferStr.includes('<html') || bufferStr.includes('<!DOCTYPE')) {
        throw new Error('Puppeteer returned HTML instead of PDF. This usually means there was an error rendering the page. Check page errors above.');
      }
      
      throw new Error(`Generated buffer does not have valid PDF header. Got: "${pdfHeader}" instead of "%PDF". Buffer length: ${buffer.length}`);
    }
    
    return buffer;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error('Failed to generate PDF: ' + error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

/**
 * Generate PDF and save to file
 * 
 * @param {Array} sections - Array of section objects (new format)
 * @param {Object} metadata - Legacy metadata object (for backward compatibility)
 * @param {string} templateStyle - Template style name
 * @param {string} outputPath - Path to save PDF
 * @returns {Promise<string>} - Path to saved PDF
 */
export const generatePDFToFile = async (sections = null, metadata = null, templateStyle = 'standard', outputPath) => {
  const pdfBuffer = await generatePDF(sections, metadata, templateStyle);
  const fs = await import('fs/promises');
  await fs.writeFile(outputPath, pdfBuffer);
  return outputPath;
};
