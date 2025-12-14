import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { isAllowedFileType, sendProcessingUpdate, deleteFileAfterDelay } from '../utils/helpers.js';
import documentProcessor from '../services/document.js';
import { getSession, setSession, updateSession, getSessionIds, getSessionCount, clearExpiredSessions } from '../services/sessions.js';
import path from 'path';

const router = express.Router();

// n8n webhook URL
const N8N_WEBHOOK_URL = 'https://jk2805.app.n8n.cloud/webhook/7ee50578-4c20-45b2-8b00-e05e59772933';

/**
 * Extract name, email, and date from document text
 */
function extractMetadata(text) {
  const metadata = {
    name: null,
    email: 'perlajaswanthkrishna@gmail.com', // Default email
    date: '15-12-2025' // Default date
  };

  // Extract email (look for email pattern)
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    metadata.email = emailMatch[0];
  }

  // Extract date and convert to DD-MM-YYYY format
  const datePatterns = [
    { regex: /(\d{4})-(\d{2})-(\d{2})/, format: 'YYYY-MM-DD' }, // YYYY-MM-DD
    { regex: /(\d{2})\/(\d{2})\/(\d{4})/, format: 'DD/MM/YYYY or MM/DD/YYYY' }, // DD/MM/YYYY or MM/DD/YYYY
    { regex: /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/, format: 'Month DD, YYYY' },
    { regex: /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/, format: 'Month DD, YYYY (short)' }
  ];

  const monthMap = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04',
    'may': '05', 'june': '06', 'july': '07', 'august': '08',
    'september': '09', 'october': '10', 'november': '11', 'december': '12',
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
    'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
  };

  for (const pattern of datePatterns) {
    const dateMatch = text.match(pattern.regex);
    if (dateMatch) {
      let day, month, year;
      
      if (pattern.format === 'YYYY-MM-DD') {
        // YYYY-MM-DD format
        year = dateMatch[1];
        month = dateMatch[2];
        day = dateMatch[3];
      } else if (pattern.format === 'DD/MM/YYYY or MM/DD/YYYY') {
        // Try both formats, prefer DD/MM/YYYY
        const first = dateMatch[1];
        const second = dateMatch[2];
        const third = dateMatch[3];
        
        // If first is > 12, it's definitely DD/MM/YYYY
        if (parseInt(first) > 12) {
          day = first.padStart(2, '0');
          month = second.padStart(2, '0');
          year = third;
        } else {
          // Assume DD/MM/YYYY format
          day = first.padStart(2, '0');
          month = second.padStart(2, '0');
          year = third;
        }
      } else {
        // Month DD, YYYY format
        day = dateMatch[1].padStart(2, '0');
        month = monthMap[dateMatch[2].toLowerCase()];
        year = dateMatch[3];
      }

      if (day && month && year) {
        metadata.date = `${day}-${month}-${year}`;
        break;
      }
    }
  }

  // Extract name (look for "Name:" or "Full Name:" or similar)
  const namePatterns = [
    /(?:Full\s+)?Name[\s:]*([A-Za-z\s]+?)(?:\n|,|$)/i,
    /(?:Employee|Person|Individual)[\s:]*([A-Za-z\s]+?)(?:\n|,|$)/i,
    /^([A-Za-z][A-Za-z\s]{2,})(?:\n|$)/m // First line as name (3+ char words)
  ];

  for (const pattern of namePatterns) {
    const nameMatch = text.match(pattern);
    if (nameMatch && nameMatch[1]) {
      const extracted = nameMatch[1].trim();
      if (extracted.length > 2 && extracted.length < 100) {
        metadata.name = extracted;
        break;
      }
    }
  }

  return metadata;
}

/**
 * Send metadata to n8n webhook
 */
async function sendToN8nWebhook(metadata, sessionId, fileName) {
  try {
    const payload = {
      name: metadata.name,
      email: metadata.email,
      notificationDate: metadata.date
    };

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`Successfully sent metadata to n8n webhook for ${sessionId}`);
    } else {
      console.error(`n8n webhook returned status ${response.status}`);
    }
  } catch (error) {
    console.error('Error sending to n8n webhook:', error.message);
  }
}

/**
 * Upload and start processing document
 */
router.post('/upload', uploadLimiter, async (req, res) => {
  try {
    if (!req.files || !req.files.document) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.document;
    
    // Validate file type
    if (!isAllowedFileType(file.name)) {
      return res.status(400).json({ 
        error: 'Unsupported file type. Allowed: PDF, DOC, DOCX' 
      });
    }

    const sessionId = uuidv4();
    const filePath = file.tempFilePath;

    // Initialize session
    setSession(sessionId, {
      id: sessionId,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date(),
      status: 'uploaded',
      progress: 0,
      results: {}
    });

    // Emit upload event
    sendProcessingUpdate(req.wss, 'upload', 100, { sessionId });

    // Start text extraction (non-blocking)
    setTimeout(async () => {
      try {
        sendProcessingUpdate(req.wss, 'extraction', 10, { sessionId });
        
        const startTime = Date.now();
        const { text, pageCount, wordCount } = await documentProcessor.processDocument(
          filePath,
          file.mimetype
        );
        const extractionTime = Date.now() - startTime;

        // Extract metadata and send to n8n webhook
        const metadata = extractMetadata(text);
        await sendToN8nWebhook(metadata, sessionId, file.name);

        updateSession(sessionId, {
          extractedText: text,
          documentMetadata: { pageCount, wordCount },
          extractedMetadata: metadata,
          status: 'extracted',
          extractionTime
        });

        sendProcessingUpdate(req.wss, 'extraction', 100, { sessionId, pageCount, wordCount, metadata });

        // Schedule file deletion after processing (1 hour)
        deleteFileAfterDelay(filePath, 3600000);
      } catch (error) {
        console.error(`Extraction error for ${sessionId}:`, error);
        sendProcessingUpdate(req.wss, 'error', 0, { 
          sessionId, 
          error: error.message 
        });
      }
    }, 100);

    res.json({
      sessionId,
      fileName: file.name,
      fileSize: file.size,
      message: 'File uploaded successfully. Processing started.'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get session status and extracted text
 */
router.get('/session/:sessionId', (req, res) => {
  const session = getSession(req.params.sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // Don't expose raw extracted text in the response, keep it server-side
  const safeSession = {
    id: session.id,
    fileName: session.fileName,
    fileSize: session.fileSize,
    status: session.status,
    documentMetadata: session.documentMetadata,
    uploadedAt: session.uploadedAt,
    extractionTime: session.extractionTime
  };

  res.json(safeSession);
});

/**
 * Get extracted text for analysis (internal)
 */
router.get('/session/:sessionId/text', (req, res) => {
  const session = getSession(req.params.sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (!session.extractedText) {
    return res.status(400).json({ error: 'Text not yet extracted' });
  }

  res.json({
    sessionId: req.params.sessionId,
    text: session.extractedText,
    metadata: session.documentMetadata
  });
});

/**
 * List active sessions (for development/monitoring)
 */
router.get('/sessions', (req, res) => {
  const activeIds = getSessionIds();
  res.json({
    activeSessions: activeIds.length,
    sessions: activeIds.map(id => {
      const s = getSession(id);
      return {
        id: s.id,
        fileName: s.fileName,
        status: s.status,
        uploadedAt: s.uploadedAt
      };
    })
  });
});

/**
 * Clear old sessions (cleanup)
 */
router.post('/cleanup', (req, res) => {
  const cleaned = clearExpiredSessions(60 * 60 * 1000); // 1 hour
  res.json({ cleaned, remaining: getSessionCount() });
});

export default router;
