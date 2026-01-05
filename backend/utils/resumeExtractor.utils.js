import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs/promises';

/**
 * Extract text from PDF file
 */
export const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

/**
 * Extract text from DOCX file
 */
export const extractTextFromDOCX = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    throw new Error(`Failed to extract text from DOCX: ${error.message}`);
  }
};

/**
 * Extract text from resume file (PDF or DOCX)
 */
export const extractResumeText = async (filePath, mimeType) => {
  if (mimeType === 'application/pdf') {
    return await extractTextFromPDF(filePath);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    return await extractTextFromDOCX(filePath);
  } else {
    throw new Error('Unsupported file type. Please upload PDF or DOCX file.');
  }
};





