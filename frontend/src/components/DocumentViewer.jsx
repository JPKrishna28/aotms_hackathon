import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { api } from '../api';
import { FiFileText, FiDownload, FiShare2 } from 'react-icons/fi';

export function DocumentViewer() {
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlightedText, setHighlightedText] = useState(null);

  const sessionId = useStore((state) => state.sessionId);
  const fileName = useStore((state) => state.fileName);
  const clauses = useStore((state) => state.clauses);
  const selectedClause = useStore((state) => state.selectedClause);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const setDocumentText = useStore((state) => state.setDocumentText);
  const setIsAnalyzing = useStore((state) => state.setIsAnalyzing);

  useEffect(() => {
    const fetchText = async () => {
      try {
        setLoading(true);
        const response = await api.getSessionText(sessionId);
        setText(response.data.text);
        setDocumentText(response.data.text);
      } catch (err) {
        setError('Failed to load document text');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchText();
    }
  }, [sessionId, setDocumentText]);

  useEffect(() => {
    if (text && clauses.length > 0) {
      highlightClauses(text, clauses);
    }
  }, [text, clauses]);

  const highlightClauses = (fullText, clauseList) => {
    let html = fullText;
    
    // Sort clauses by position (longest first to avoid offset issues)
    const sortedClauses = [...clauseList].sort((a, b) => b.text.length - a.text.length);

    for (const clause of sortedClauses) {
      const regex = new RegExp(`(${clause.text.split(/[.*+?^${}()|[\]\\]/g).join('\\$&')})`, 'gi');
      html = html.replace(regex, `<span class="clause ${clause.type}" data-type="${clause.type}">$1</span>`);
    }

    setHighlightedText(html);
  };

  const handleExport = async (format) => {
    // TODO: Implement PDF/JSON export
    console.log(`Exporting as ${format}`);
  };

  const handleStartAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      await api.analyzeDocument(sessionId);
      setActiveTab('analysis');
    } catch (err) {
      console.error('Analysis error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <FiFileText className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">{fileName}</p>
              <p className="text-sm text-gray-500">{text?.length || 0} characters</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FiDownload className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={() => handleStartAnalysis()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Analyze Document
            </button>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8 text-justify text-gray-800 leading-relaxed">
          {highlightedText ? (
            <div
              dangerouslySetInnerHTML={{ __html: highlightedText }}
              className="prose prose-sm max-w-none"
            />
          ) : (
            <pre className="whitespace-pre-wrap font-sans">{text}</pre>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-medium text-gray-700 mb-3">Clause Types:</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-200 border-l-4 border-red-500 rounded"></div>
              <span className="text-sm text-gray-600">Risk Clauses</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200 border-l-4 border-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Payment Terms</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200 border-l-4 border-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Obligations</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-200 border-l-4 border-orange-500 rounded"></div>
              <span className="text-sm text-gray-600">Expiry/Termination</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
