import React, { useRef, useState } from 'react';
import { useStore } from '../store';
import { api } from '../api';
import { FiUpload, FiFileText } from 'react-icons/fi';

export function DocumentUpload() {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  
  const setSessionId = useStore((state) => state.setSessionId);
  const setFileName = useStore((state) => state.setFileName);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const setProcessingStage = useStore((state) => state.setProcessingStage);
  const setProcessingProgress = useStore((state) => state.setProcessingProgress);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    setError(null);
    
    // Validate file type
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      setError('Only PDF, DOC, and DOCX files are supported');
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    try {
      setUploading(true);
      setProcessingStage('upload');
      setProcessingProgress(0);

      const response = await api.uploadDocument(file);
      const { sessionId, fileName } = response.data;

      setSessionId(sessionId);
      setFileName(fileName);
      setProcessingProgress(100);
      setProcessingStage('extraction');

      // Poll for extraction status
      let extracted = false;
      let attempts = 0;
      while (!extracted && attempts < 100) {
        try {
          const statusResponse = await api.getSessionStatus(sessionId);
          if (statusResponse.data.status === 'extracted') {
            extracted = true;
            setActiveTab('viewer');
            setProcessingStage('ready_for_analysis');
          }
        } catch (err) {
          // Still processing
        }
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!extracted) {
        setProcessingStage('extraction_timeout');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setProcessingStage(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <FiFileText className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Aurora.ai</h1>
            <p className="text-gray-600 text-lg">Professional Legal Document Analysis</p>
          </div>

          {/* Drag Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            <FiUpload className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <p className="text-lg font-medium text-gray-900 mb-2">Drop your document here</p>
            <p className="text-gray-600 mb-4">or click to select from your computer</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Browse Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleChange}
              disabled={uploading}
              className="hidden"
            />
          </div>

          {/* Supported formats */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">Supported formats</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm">PDF</span>
              <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm">DOC</span>
              <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm">DOCX</span>
            </div>
          </div>

          {/* Status messages */}
          {uploading && (
            <div className="mt-6 p-4 bg-blue-50 text-blue-900 rounded-lg">
              <p className="text-sm">Uploading and processing your document...</p>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 text-red-900 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Your documents are processed securely and deleted after analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
