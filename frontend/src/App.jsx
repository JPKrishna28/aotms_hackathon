import React, { useEffect, useState } from 'react';
import { useStore } from './store';
import { DocumentUpload } from './components/DocumentUpload';
import { DocumentViewer } from './components/DocumentViewer';
import { AnalysisResults } from './components/AnalysisResults';
import { DocumentQA } from './components/DocumentQA';
import { FiHome, FiEye, FiBarChart2, FiMessageSquare } from 'react-icons/fi';

function App() {
  const [wsConnected, setWsConnected] = useState(false);
  const [processingUpdates, setProcessingUpdates] = useState({});

  const activeTab = useStore((state) => state.activeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const sessionId = useStore((state) => state.sessionId);
  const setProcessingStage = useStore((state) => state.setProcessingStage);
  const setProcessingProgress = useStore((state) => state.setProcessingProgress);

  // WebSocket connection
  useEffect(() => {
    let ws = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectTimeout = null;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${protocol}//localhost:5000`);

        ws.onopen = () => {
          setWsConnected(true);
          reconnectAttempts = 0;
          console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'processing_update') {
              setProcessingUpdates((prev) => ({
                ...prev,
                [message.sessionId]: message
              }));
              setProcessingStage(message.stage);
              setProcessingProgress(message.progress);
            }
          } catch (err) {
            console.error('WebSocket message error:', err);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setWsConnected(false);
        };

        ws.onclose = () => {
          setWsConnected(false);
          // Try to reconnect with exponential backoff
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            reconnectTimeout = setTimeout(() => {
              console.log(`WebSocket reconnecting... (attempt ${reconnectAttempts})`);
              connectWebSocket();
            }, delay);
          }
        };
      } catch (err) {
        console.error('WebSocket connection error:', err);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [setProcessingStage, setProcessingProgress]);

  const navItems = [
    { id: 'upload', label: 'Upload', icon: FiHome, enabled: true },
    { id: 'viewer', label: 'Document', icon: FiEye, enabled: !!sessionId },
    { id: 'analysis', label: 'Analysis', icon: FiBarChart2, enabled: !!sessionId },
    { id: 'qa', label: 'Q&A', icon: FiMessageSquare, enabled: !!sessionId },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Aurora.ai</h1>
          <div className="flex items-center gap-4">
            <span className={`text-xs px-2 py-1 rounded ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}>
              {wsConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        {sessionId && (
          <nav className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    disabled={!item.enabled}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-100 text-blue-600'
                        : item.enabled
                        ? 'text-gray-700 hover:bg-gray-100'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Processing Status */}
            {Object.keys(processingUpdates).length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">Processing</p>
                {Object.entries(processingUpdates).map(([id, update]) => (
                  <div key={id} className="text-xs">
                    <p className="text-gray-600 mb-1 capitalize">{update.stage}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${update.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </nav>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {activeTab === 'upload' && <DocumentUpload />}
          {activeTab === 'viewer' && sessionId && <DocumentViewer />}
          {activeTab === 'analysis' && sessionId && <AnalysisResults />}
          {activeTab === 'qa' && sessionId && <DocumentQA />}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-4 py-3 text-xs text-gray-500 text-center">
        Aurora.ai - Secure Legal Document Analysis | Documents are processed and deleted immediately
      </footer>
    </div>
  );
}

export default App;
