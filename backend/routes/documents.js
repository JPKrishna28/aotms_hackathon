import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { isAllowedFileType, sendProcessingUpdate, deleteFileAfterDelay } from '../utils/helpers.js';
import documentProcessor from '../services/document.js';
import { getSession, setSession, updateSession, getSessionIds, getSessionCount, clearExpiredSessions } from '../services/sessions.js';
import path from 'path';

const router = express.Router();

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

        updateSession(sessionId, {
          extractedText: text,
          documentMetadata: { pageCount, wordCount },
          status: 'extracted',
          extractionTime
        });

        sendProcessingUpdate(req.wss, 'extraction', 100, { sessionId, pageCount, wordCount });

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
