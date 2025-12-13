import { create } from 'zustand';

export const useStore = create((set) => ({
  // Document state
  sessionId: null,
  fileName: null,
  documentText: null,
  documentMetadata: null,
  
  // Analysis state
  isAnalyzing: false,
  analysisResults: null,
  clauses: [],
  riskScore: null,
  
  // UI state
  processingStage: null,
  processingProgress: 0,
  activeTab: 'upload', // upload, viewer, analysis, qa
  selectedClause: null,
  chatMessages: [],
  
  // Actions
  setSessionId: (id) => set({ sessionId: id }),
  setFileName: (name) => set({ fileName: name }),
  setDocumentText: (text) => set({ documentText: text }),
  setDocumentMetadata: (meta) => set({ documentMetadata: meta }),
  
  setIsAnalyzing: (val) => set({ isAnalyzing: val }),
  setAnalysisResults: (results) => set({ analysisResults: results }),
  setClauses: (clauses) => set({ clauses }),
  setRiskScore: (score) => set({ riskScore: score }),
  
  setProcessingStage: (stage) => set({ processingStage: stage }),
  setProcessingProgress: (progress) => set({ processingProgress: progress }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedClause: (clause) => set({ selectedClause: clause }),
  
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, message]
  })),
  
  clearChatMessages: () => set({ chatMessages: [] }),
  
  reset: () => set({
    sessionId: null,
    fileName: null,
    documentText: null,
    documentMetadata: null,
    isAnalyzing: false,
    analysisResults: null,
    clauses: [],
    riskScore: null,
    processingStage: null,
    processingProgress: 0,
    activeTab: 'upload',
    selectedClause: null,
    chatMessages: []
  })
}));
