import axios from 'axios';

const API_BASE = 'https://aotms-hackathon.onrender.com/api';

export const api = {
  // Document endpoints
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('document', file);
    return axios.post(`${API_BASE}/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  getSessionStatus: async (sessionId) => {
    return axios.get(`${API_BASE}/documents/session/${sessionId}`);
  },

  getSessionText: async (sessionId) => {
    return axios.get(`${API_BASE}/documents/session/${sessionId}/text`);
  },

  getSessions: async () => {
    return axios.get(`${API_BASE}/documents/sessions`);
  },

  // Analysis endpoints
  analyzeDocument: async (sessionId) => {
    return axios.post(`${API_BASE}/analysis/analyze`, { sessionId });
  },

  getAnalysisResults: async (sessionId) => {
    return axios.get(`${API_BASE}/analysis/results/${sessionId}`);
  },

  askQuestion: async (sessionId, question, language = 'English') => {
    return axios.post(`${API_BASE}/analysis/question`, {
      sessionId,
      question,
      language
    });
  },

  // Health check
  healthCheck: async () => {
    return axios.get(`${API_BASE}/health`);
  }
};
