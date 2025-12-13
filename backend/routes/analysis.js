import express from 'express';
import { analysisLimiter } from '../middleware/rateLimiter.js';
import { sendProcessingUpdate } from '../utils/helpers.js';
import { getGeminiService } from '../services/gemini.js';
import { getSession, updateSession } from '../services/sessions.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * Analyze document (returns from session data)
 */
router.post('/analyze', analysisLimiter, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    // For real implementation, you'd retrieve from persistent storage
    // For now, send signal to client to proceed
    res.json({
      sessionId,
      message: 'Analysis will be performed',
      status: 'analyzing'
    });

    // Start async analysis (non-blocking)
    setTimeout(() => {
      performAnalysis(sessionId, req.wss);
    }, 100);

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get full analysis results
 */
router.get('/results/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = getSession(sessionId);
  
  if (!session) {
    return res.status(404).json({ 
      error: 'Session not found',
      hint: 'Make sure you upload a document first'
    });
  }

  if (!session.analysisResults) {
    return res.status(404).json({ 
      error: 'Results not found or still processing',
      hint: 'Wait for analysis to complete'
    });
  }

  res.json(session.analysisResults);
});

/**
 * Ask question about document
 */
router.post('/question', analysisLimiter, async (req, res) => {
  try {
    const { sessionId, question, language = 'English' } = req.body;

    if (!sessionId || !question) {
      return res.status(400).json({ error: 'sessionId and question are required' });
    }

    const session = getSession(sessionId);
    if (!session || !session.extractedText) {
      return res.status(400).json({ error: 'Document not found or not extracted' });
    }

    // Return immediate response
    res.json({
      sessionId,
      status: 'processing_question'
    });

    // Process asynchronously
    setTimeout(async () => {
      try {
        const answer = await getGeminiService().answerQuestion(
          session.extractedText,
          question
        );

        sendProcessingUpdate(req.wss, 'question_answered', 100, {
          sessionId,
          answer
        });
      } catch (error) {
        console.error('Question answering error:', error);
        sendProcessingUpdate(req.wss, 'error', 0, {
          sessionId,
          error: error.message
        });
      }
    }, 100);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Perform full document analysis
 */
async function performAnalysis(sessionId, wss) {
  try {
    const session = getSession(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    sendProcessingUpdate(wss, 'analysis_started', 5, { sessionId });

    const documentText = session.extractedText;

    if (!documentText) {
      throw new Error('Document text not found. Try uploading again.');
    }

    // 1. Analyze document for summary
    sendProcessingUpdate(wss, 'ai_analysis', 20, { sessionId });
    let analysis;
    try {
      analysis = await getGeminiService().analyzeDocument(documentText);
    } catch (err) {
      console.error('Gemini API analyzeDocument error:', err);
      throw new Error(`AI Analysis failed: ${err.message}`);
    }
    
    // 2. Detect clauses
    sendProcessingUpdate(wss, 'clause_detection', 45, { sessionId });
    let clauses;
    try {
      clauses = await getGeminiService().detectClauses(documentText);
    } catch (err) {
      console.error('Gemini API detectClauses error:', err);
      throw new Error(`Clause detection failed: ${err.message}`);
    }

    // 3. Calculate risk score
    sendProcessingUpdate(wss, 'risk_assessment', 70, { sessionId });
    let riskAssessment;
    try {
      riskAssessment = await getGeminiService().calculateRiskScore(documentText, clauses);
    } catch (err) {
      console.error('Gemini API calculateRiskScore error:', err);
      throw new Error(`Risk assessment failed: ${err.message}`);
    }

    // 4. Generate next steps
    sendProcessingUpdate(wss, 'next_steps', 85, { sessionId });
    let nextSteps;
    try {
      nextSteps = await getGeminiService().generateNextSteps(
        documentText,
        analysis.documentType || 'Unknown'
      );
    } catch (err) {
      console.error('Gemini API generateNextSteps error:', err);
      throw new Error(`Next steps generation failed: ${err.message}`);
    }

    // Compile results
    const results = {
      sessionId,
      summary: analysis.summary,
      documentType: analysis.documentType,
      parties: analysis.parties,
      effectiveDate: analysis.effectiveDate,
      expiryDate: analysis.expiryDate,
      clauses,
      riskAssessment,
      nextSteps,
      completedAt: new Date().toISOString()
    };

    // Store results in session
    updateSession(sessionId, {
      analysisResults: results,
      status: 'analysis_complete'
    });

    sendProcessingUpdate(wss, 'analysis_complete', 100, { 
      sessionId,
      results 
    });

  } catch (error) {
    console.error('Analysis error:', error);
    sendProcessingUpdate(wss, 'error', 0, {
      sessionId,
      error: error.message
    });
  }
}

export default router;
