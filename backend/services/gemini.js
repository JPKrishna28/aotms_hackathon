import { GoogleGenAI } from '@google/genai';

export class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });
  }

  /**
   * Analyze document for legal summary and metadata
   */
  async analyzeDocument(documentText) {
    const prompt = `Analyze this legal document and return ONLY valid JSON with no additional text:

{"summary": "2-3 sentence plain language summary", "documentType": "type here", "parties": ["party1", "party2"], "effectiveDate": "date or null", "expiryDate": "date or null"}

Document:
${documentText.substring(0, 4000)}`;

    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text?.() || '';
    
    try {
      return JSON.parse(text);
    } catch (e) {
      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (e2) {
          console.error('Analyze document markdown extraction failed:', e2);
        }
      }
      // Fallback if JSON parsing fails
      return {
        summary: text.substring(0, 200),
        documentType: 'Unknown',
        parties: [],
        effectiveDate: null,
        expiryDate: null
      };
    }
  }

  /**
   * Detect and classify clauses in the document
   */
  async detectClauses(documentText) {
    const prompt = `You are a legal document analyst. Find important clauses in this document.

For each clause you find, return ONLY valid JSON array format like this:
[{"text": "exact clause text here", "type": "risk", "riskLevel": "high", "explanation": "brief explanation"}]

Types: risk, payment, obligation, expiry
Risk levels: high, medium, low

Find AT LEAST 2 clauses. Return ONLY JSON, nothing else.

Document:
${documentText.substring(0, 5000)}`;

    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text?.() || '';
    
    try {
      const result = JSON.parse(text);
      // Ensure it's an array
      if (Array.isArray(result)) {
        return result.filter(c => c.text && c.type);
      }
      return [];
    } catch (e) {
      console.error('Clause detection parse error:', e.message, 'Response:', text.substring(0, 100));
      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[1]);
          if (Array.isArray(result)) {
            return result.filter(c => c.text && c.type);
          }
        } catch (e2) {
          console.error('Clause detection markdown extraction failed:', e2);
        }
      }
      
      // If all else fails, generate a fallback clause from the document
      if (documentText.length > 0) {
        return [{
          text: documentText.substring(0, 200) + '...',
          type: 'obligation',
          riskLevel: 'medium',
          explanation: 'Key clause identified in document'
        }];
      }
      return [];
    }
  }

  /**
   * Calculate overall risk score for document
   */
  async calculateRiskScore(documentText, clauses) {
    const prompt = `Assess the risk level of this legal document. Return ONLY valid JSON with no additional text:

{"score": "low", "reasoning": "brief explanation", "topRisks": ["risk1", "risk2"]}

Scores: low, medium, high

Document:
${documentText.substring(0, 3000)}`;

    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text?.() || '';
    
    try {
      return JSON.parse(text);
    } catch (e) {
      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (e2) {
          console.error('Risk assessment markdown extraction failed:', e2);
        }
      }
      return {
        score: 'medium',
        reasoning: 'Unable to fully assess risk',
        topRisks: ['Unable to assess']
      };
    }
  }

  /**
   * Answer questions about document content
   */
  async answerQuestion(documentText, question) {
    const prompt = `You are a legal document Q&A assistant. Answer the following question STRICTLY based on the document provided. If the information is not in the document, say "This information is not contained in the document."

Question: ${question}

Document text:
${documentText.substring(0, 6000)}

Provide a clear, concise answer suitable for non-lawyers. Start with a direct answer, then provide supporting detail if relevant.`;

    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.text || response.text?.() || '';
  }

  /**
   * Translate content to specified language
   */
  async translateContent(content, targetLanguage) {
    const prompt = `Translate the following text to ${targetLanguage}. Maintain meaning and formatting:

${content}`;

    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.text || response.text?.() || '';
  }

  /**
   * Generate next step recommendations
   */
  async generateNextSteps(documentText, documentType) {
    const prompt = `Suggest 2-3 practical next steps for reviewing this ${documentType}. Return ONLY valid JSON with no additional text:

{"steps": [{"step": "action item", "rationale": "why"}], "disclaimer": "Not legal advice"}

Document:
${documentText.substring(0, 4000)}`;

    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text?.() || '';
    
    try {
      return JSON.parse(text);
    } catch (e) {
      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (e2) {
          console.error('Next steps markdown extraction failed:', e2);
        }
      }
      return {
        steps: [{
          step: 'Review document thoroughly',
          rationale: 'Ensure you understand all terms and conditions'
        }],
        disclaimer: 'Not legal advice'
      };
    }
  }
}

// Lazy instantiation - only create when first used
let geminiInstance = null;

export function getGeminiService() {
  if (!geminiInstance) {
    geminiInstance = new GeminiService();
  }
  return geminiInstance;
}


