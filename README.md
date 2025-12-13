# Aurora.ai - Legal Document Analysis Platform

Professional legal document analysis using Google Gemini API. Extract key information, identify risks, and get instant insights from contracts and agreements.

## Features

### Document Processing
- ✅ Upload PDF, DOC, DOCX files (drag-and-drop)
- ✅ Real-time text extraction
- ✅ Live processing stages via WebSocket
- ✅ Automatic file deletion after processing
- ✅ <10 second processing time

### AI Intelligence (Gemini API)
- ✅ Plain-language document summaries
- ✅ Smart clause detection with color coding:
  - 🔴 Risk Clauses (liability, indemnification)
  - 🟢 Payment Terms
  - 🔵 Obligations
  - 🟠 Expiry/Termination
- ✅ Interactive document Q&A (grounded in content)
- ✅ Multilingual support
- ✅ Risk assessment scoring (low/medium/high)
- ✅ Actionable next-step suggestions

### User Interface
- Professional blue gradient design
- Responsive (mobile + desktop)
- Interactive highlighted document viewer
- Real-time chat interface
- Export analysis (PDF/JSON)
- WebSocket real-time updates

## Architecture

```
Aurora.ai/
├── backend/                 # Node.js/Express server
│   ├── routes/             # API endpoints
│   ├── services/           # Gemini & document processing
│   ├── middleware/         # Rate limiting, CORS
│   ├── utils/              # Helper functions
│   └── server.js           # Express app & WebSocket
├── frontend/               # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── App.jsx         # Main app
│   │   ├── store.js        # Zustand state management
│   │   ├── api.js          # API client
│   │   └── index.css       # Tailwind styles
│   └── vite.config.js      # Vite configuration
└── README.md
```

## Setup

### Prerequisites
- Node.js 18+ (Backend & Frontend)
- Gemini API key (free tier available)
- Git

### 1. Get Gemini API Key

Visit [Google AI Studio](https://aistudio.google.com/app/apikey) and create a free API key.

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start development server
npm run dev
# Backend runs on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend runs on http://localhost:3000
```

### 4. Open Application

Visit `http://localhost:3000` in your browser.

## API Endpoints

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/session/:sessionId` - Get session status
- `GET /api/documents/session/:sessionId/text` - Get extracted text

### Analysis
- `POST /api/analysis/analyze` - Start document analysis
- `GET /api/analysis/results/:sessionId` - Get analysis results
- `POST /api/analysis/question` - Ask question about document

### WebSocket
- `ws://localhost:5000` - Real-time processing updates

## Processing Pipeline

1. **Upload** → File validation and temporary storage
2. **Text Extraction** → PDF/DOC/DOCX to plain text
3. **AI Analysis** → Gemini API document summary
4. **Clause Detection** → Identify and classify clauses
5. **Risk Assessment** → Calculate overall risk score
6. **Next Steps** → Generate actionable recommendations
7. **File Deletion** → Auto-delete after 1 hour

## Supported Document Types

### By Format
- PDF (via pdf-parse)
- DOC/DOCX (via mammoth)

### By Content
- Employment Agreements
- NDAs (Non-Disclosure Agreements)
- Rental Agreements
- Service Agreements
- Contracts (generic)

## Security & Privacy

✅ **No Document Retention**
- Files automatically deleted after processing
- No database storage of documents
- Session-based processing only

✅ **Secure Processing**
- HTTPS/WSS in production
- Rate limiting (100 req/15min, 5 uploads/min)
- Helmet security headers
- CORS configuration

✅ **API Key Security**
- Environment variable based
- Never exposed to frontend
- Backend-only API communication

## Performance

- **Text Extraction**: <2 seconds for most documents
- **AI Analysis**: <5 seconds per document
- **Total Processing**: <10 seconds
- **Q&A Response**: <3 seconds

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **File Upload**: 5 uploads per minute
- **Analysis**: 10 analysis requests per minute

## Multilingual Support

Supported languages for Q&A:
- English
- Spanish
- French
- German
- Chinese
- Japanese

## Export Options

- **PDF Report** - Formatted analysis with clauses
- **JSON Export** - Raw analysis data

## Development

### Project Structure

```
backend/
├── server.js              # Main server with WebSocket
├── routes/
│   ├── documents.js       # Document upload/retrieval
│   └── analysis.js        # Analysis endpoints
├── services/
│   ├── gemini.js          # Gemini API wrapper
│   └── document.js        # Text extraction
├── middleware/
│   └── rateLimiter.js     # Rate limiting
└── utils/
    └── helpers.js         # Utility functions
```

### Key Dependencies

**Backend**
- express - Web framework
- @google-cloud/generative-ai - Gemini API
- pdf-parse - PDF extraction
- mammoth - DOCX extraction
- ws - WebSocket server
- express-rate-limit - Rate limiting

**Frontend**
- react - UI library
- vite - Build tool
- tailwindcss - Styling
- zustand - State management
- axios - HTTP client

## Troubleshooting

### WebSocket Connection Failed
- Ensure backend is running on port 5000
- Check CORS configuration in server.js
- Verify firewall settings

### Gemini API Errors
- Check API key validity
- Verify rate limit not exceeded
- Ensure proper environment variable setup

### Document Extraction Fails
- Verify file is valid PDF/DOC/DOCX
- Check file size (<50MB)
- Try re-uploading the document

### Frontend Styling Issues
- Run `npm install` in frontend directory
- Clear browser cache
- Rebuild with `npm run build`

## Future Enhancements

- [ ] Database storage (PostgreSQL)
- [ ] User authentication
- [ ] Document history and management
- [ ] Comparison between multiple documents
- [ ] Custom clause templates
- [ ] Team collaboration features
- [ ] Advanced redaction tools
- [ ] Email notifications
- [ ] Batch processing
- [ ] OCR support (scanned documents)

## License

MIT

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review backend console logs
3. Check browser console for frontend errors
4. Verify Gemini API key configuration

---

Built with ❤️ for legal professionals and business owners.
