import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { readFileSync } from 'fs';

export class DocumentProcessor {
  /**
   * Extract text from PDF file
   */
  async extractFromPDF(filePath) {
    const fileBuffer = readFileSync(filePath);
    const data = await pdfParse(fileBuffer);
    return data.text;
  }

  /**
   * Extract text from DOCX file
   */
  async extractFromDOCX(filePath) {
    const fileBuffer = readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value;
  }

  /**
   * Extract text from DOC file (treated as DOCX)
   */
  async extractFromDOC(filePath) {
    return this.extractFromDOCX(filePath);
  }

  /**
   * Process any supported document
   */
  async processDocument(filePath, mimeType) {
    // Determine file type from MIME type if extension not available
    let ext = filePath.toLowerCase().split('.').pop();
    
    // If no extension or temp file, use MIME type
    if (!ext || ext === filePath || filePath.includes('tmp')) {
      if (mimeType.includes('pdf')) {
        ext = 'pdf';
      } else if (mimeType.includes('wordprocessingml') || mimeType.includes('word')) {
        ext = 'docx';
      } else if (mimeType === 'application/msword') {
        ext = 'doc';
      }
    }
    
    let text = '';
    switch (ext) {
      case 'pdf':
        text = await this.extractFromPDF(filePath);
        break;
      case 'docx':
      case 'doc':
        text = await this.extractFromDOCX(filePath);
        break;
      default:
        throw new Error(`Unsupported file format: ${mimeType || ext}`);
    }

    // Clean and normalize text
    text = text
      .replace(/\r\n/g, '\n')
      .replace(/\s+\n/g, '\n')
      .replace(/\n\s+/g, '\n')
      .trim();

    return {
      text,
      pageCount: this.estimatePageCount(text),
      wordCount: text.split(/\s+/).length,
      charCount: text.length
    };
  }

  /**
   * Estimate page count from text length
   */
  estimatePageCount(text) {
    const avgCharsPerPage = 2000;
    return Math.ceil(text.length / avgCharsPerPage);
  }

  /**
   * Split document into chunks for processing
   */
  chunkDocument(text, chunkSize = 2000) {
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
      let end = start + chunkSize;
      
      // Try to break at a sentence boundary
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('.', end);
        if (lastPeriod > start + chunkSize * 0.7) {
          end = lastPeriod + 1;
        }
      }
      
      chunks.push(text.substring(start, end).trim());
      start = end;
    }
    
    return chunks;
  }

  /**
   * Extract and highlight clause locations in original text
   */
  findClauseLocations(text, clauses) {
    const locations = [];
    
    for (const clause of clauses) {
      const clauseText = clause.text.substring(0, 50); // First 50 chars
      const index = text.indexOf(clauseText);
      
      if (index !== -1) {
        locations.push({
          ...clause,
          startIndex: index,
          endIndex: index + clause.text.length,
          confidence: 1.0
        });
      }
    }
    
    return locations;
  }
}

export default new DocumentProcessor();
