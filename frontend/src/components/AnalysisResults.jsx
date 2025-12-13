import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { api } from '../api';
import { FiBarChart2, FiAlertCircle, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';

export function AnalysisResults() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [error, setError] = useState(null);

  const sessionId = useStore((state) => state.sessionId);
  const analysisResults = useStore((state) => state.analysisResults);
  const setAnalysisResults = useStore((state) => state.setAnalysisResults);
  const setClauses = useStore((state) => state.setClauses);
  const setRiskScore = useStore((state) => state.setRiskScore);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 20; // Wait up to 60 seconds (20 retries x 3 seconds)
    
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.getAnalysisResults(sessionId);
        const data = response.data;
        
        setResults(data);
        setAnalysisResults(data);
        setClauses(data.clauses || []);
        setRiskScore(data.riskAssessment || null);
        setLoading(false);
      } catch (err) {
        // Results might still be processing
        if (retryCount < maxRetries) {
          retryCount++;
          // Retry after delay - wait longer as retries progress
          const delay = 2000 + (retryCount * 500); // Start at 2s, increase by 0.5s each retry
          setTimeout(fetchResults, delay);
        } else {
          setError('Analysis is taking longer than expected. Please try again.');
          setLoading(false);
        }
      }
    };

    if (sessionId) {
      fetchResults();
    }
  }, [sessionId, setAnalysisResults, setClauses, setRiskScore]);

  const getRiskColor = (score) => {
    if (score === 'high') return 'text-red-600';
    if (score === 'medium') return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskBgColor = (score) => {
    if (score === 'high') return 'bg-red-50 border-red-200';
    if (score === 'medium') return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  if (loading && !results) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mb-4"></div>
          <p className="text-gray-600">Analyzing document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg text-red-900">
        <p>{error}</p>
      </div>
    );
  }

  const analysis = results || {};
  const clauses = (results?.clauses || []).filter(c => c && c.type); // Filter out undefined clauses
  const riskAssessment = results?.riskAssessment || {};
  const nextSteps = results?.nextSteps || {};

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex overflow-x-auto">
          {['summary', 'clauses', 'risk', 'nextSteps'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'summary' && 'Summary'}
              {tab === 'clauses' && 'Clauses'}
              {tab === 'risk' && 'Risk Assessment'}
              {tab === 'nextSteps' && 'Next Steps'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Plain-Language Summary</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  {analysis.summary || 'No summary available'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Document Type</h4>
                  <p className="text-2xl font-bold text-blue-600">{analysis.documentType || 'Unknown'}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Key Parties</h4>
                  <ul className="space-y-2">
                    {(analysis.parties || []).map((party, idx) => (
                      <li key={idx} className="text-gray-700 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        {party}
                      </li>
                    ))}
                  </ul>
                </div>

                {analysis.effectiveDate && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h4 className="font-medium text-gray-900 mb-2">Effective Date</h4>
                    <p className="text-gray-700">{analysis.effectiveDate}</p>
                  </div>
                )}

                {analysis.expiryDate && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h4 className="font-medium text-gray-900 mb-2">Expiry Date</h4>
                    <p className="text-gray-700">{analysis.expiryDate}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Clauses Tab */}
          {activeTab === 'clauses' && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">Found {clauses.length} key clauses</p>
              {clauses.map((clause, idx) => (
                <div
                  key={idx}
                  className={`p-4 border-l-4 rounded-lg ${
                    clause.type === 'risk'
                      ? 'bg-red-50 border-red-500'
                      : clause.type === 'payment'
                      ? 'bg-green-50 border-green-500'
                      : clause.type === 'obligation'
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-orange-50 border-orange-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="inline-block px-3 py-1 bg-gray-200 text-gray-800 text-xs font-medium rounded">
                      {(clause.type || 'unknown').toUpperCase()}
                    </span>
                    {clause.riskLevel && (
                      <span className="text-xs font-medium text-gray-600">
                        Risk: <span className={getRiskColor(clause.riskLevel)}>{clause.riskLevel}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-2">"{clause.text}"</p>
                  <p className="text-sm text-gray-700">{clause.explanation}</p>
                </div>
              ))}
            </div>
          )}

          {/* Risk Assessment Tab */}
          {activeTab === 'risk' && (
            <div className="space-y-6">
              <div className={`p-8 rounded-lg border-2 ${getRiskBgColor(riskAssessment.score)}`}>
                <div className="flex items-center gap-4 mb-4">
                  {riskAssessment.score === 'high' && (
                    <FiAlertCircle className="w-12 h-12 text-red-600" />
                  )}
                  {riskAssessment.score === 'medium' && (
                    <FiTrendingUp className="w-12 h-12 text-yellow-600" />
                  )}
                  {riskAssessment.score === 'low' && (
                    <FiCheckCircle className="w-12 h-12 text-green-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700">Overall Risk Score</p>
                    <p className={`text-4xl font-bold ${getRiskColor(riskAssessment.score)}`}>
                      {riskAssessment.score?.toUpperCase()}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700">{riskAssessment.reasoning}</p>
              </div>

              {riskAssessment.topRisks && riskAssessment.topRisks.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Top Risk Areas</h4>
                  <ul className="space-y-2">
                    {riskAssessment.topRisks.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Next Steps Tab */}
          {activeTab === 'nextSteps' && (
            <div className="space-y-6">
              {nextSteps.disclaimer && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Disclaimer:</strong> {nextSteps.disclaimer}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {(nextSteps.steps || []).map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">{idx + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 mb-2">{item.step}</p>
                        <p className="text-gray-700 text-sm">{item.rationale}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
