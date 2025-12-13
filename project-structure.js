#!/usr/bin/env node

/**
 * Aurora.ai Project Structure & File Overview
 * Run this to see all project files and their purposes
 */

const fs = require('fs');
const path = require('path');

const structure = {
  root: {
    description: 'Project Root',
    files: {
      'README.md': 'Full project documentation and feature guide',
      'QUICKSTART.md': '5-minute quick start guide for Windows/Mac/Linux',
      'API.md': 'Complete API reference with code examples',
      'DEPLOYMENT.md': 'Production deployment guide (Heroku, AWS, Docker, K8s)',
      'PROJECT_COMPLETE.md': 'Project completion summary',
      'setup.ps1': 'Windows PowerShell setup script',
      'setup.sh': 'Linux/Mac bash setup script',
      '.gitignore': 'Git ignore rules'
    }
  },
  backend: {
    description: 'Node.js/Express Backend Server',
    files: {
      'server.js': 'Main Express server + WebSocket setup',
      'package.json': 'Dependencies: express, Gemini API, pdf-parse, mammoth, ws',
      '.env.example': 'Environment variables template (copy to .env)',
      'routes/documents.js': 'File upload, session management, text retrieval',
      'routes/analysis.js': 'AI analysis, clause detection, Q&A endpoints',
      'services/gemini.js': 'Gemini API wrapper (summary, clauses, risk, Q&A)',
      'services/document.js': 'PDF/DOC/DOCX text extraction',
      'middleware/rateLimiter.js': 'Express rate limiting middleware',
      'utils/helpers.js': 'File management, WebSocket utilities'
    }
  },
  frontend: {
    description: 'React + Vite + Tailwind Frontend',
    files: {
      'index.html': 'HTML entry point',
      'vite.config.js': 'Vite build configuration',
      'tailwind.config.js': 'Tailwind CSS configuration',
      'postcss.config.js': 'PostCSS (Tailwind processor) config',
      'package.json': 'Dependencies: react, vite, tailwindcss, zustand, axios',
      'src/main.jsx': 'React entry point',
      'src/App.jsx': 'Main app component + navigation',
      'src/store.js': 'Zustand state management (all app state)',
      'src/api.js': 'API client for backend communication',
      'src/index.css': 'Global styles + Tailwind directives',
      'src/components/DocumentUpload.jsx': 'Drag-drop upload interface',
      'src/components/DocumentViewer.jsx': 'Display extracted text with highlighting',
      'src/components/AnalysisResults.jsx': 'Summary, clauses, risk, next steps tabs',
      'src/components/DocumentQA.jsx': 'Chat interface for document questions'
    }
  }
};

console.log('\n🎯 Aurora.ai - Project File Structure\n');
console.log('=====================================\n');

Object.entries(structure).forEach(([dir, config]) => {
  console.log(`📁 ${dir.toUpperCase()}`);
  console.log(`   ${config.description}\n`);
  
  Object.entries(config.files).forEach(([file, purpose]) => {
    const indent = file.includes('/') ? '   ├─ ' : '   ├─ ';
    console.log(`${indent}${file}`);
    console.log(`   │  → ${purpose}`);
  });
  
  console.log('\n');
});

console.log('\n=====================================\n');
console.log('📊 PROJECT STATISTICS\n');

const countFiles = (obj) => {
  let count = 0;
  Object.values(obj).forEach(config => {
    if (config.files) count += Object.keys(config.files).length;
  });
  return count;
};

console.log(`Total Files: ${countFiles(structure)}`);
console.log('Backend: Node.js + Express + Gemini API');
console.log('Frontend: React + Vite + Tailwind CSS');
console.log('State Management: Zustand');
console.log('Real-time: WebSocket');
console.log('Package Manager: npm');
console.log('\n=====================================\n');

console.log('🚀 GETTING STARTED\n');
console.log('1. Read QUICKSTART.md');
console.log('2. Get Gemini API key: https://aistudio.google.com/app/apikey');
console.log('3. Run setup.ps1 (Windows) or setup.sh (Mac/Linux)');
console.log('4. npm run dev in both backend/ and frontend/');
console.log('5. Open http://localhost:3000\n');

console.log('📚 DOCUMENTATION\n');
console.log('• README.md - Full documentation');
console.log('• QUICKSTART.md - 5-minute setup');
console.log('• API.md - API reference');
console.log('• DEPLOYMENT.md - Deploy to production');
console.log('\n');
