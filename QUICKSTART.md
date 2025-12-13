# Quick Start Guide - Aurora.ai

Get Aurora.ai running in 5 minutes!

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Gemini API Key** (free - get at [Google AI Studio](https://aistudio.google.com/app/apikey))

## Windows Setup (PowerShell)

```powershell
# 1. Run setup script (admin terminal recommended)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup.ps1

# 2. Edit backend/.env and add your Gemini API key
# Open in notepad:
notepad backend\.env

# 3. Terminal 1: Start Backend
cd backend
npm run dev
# Should show: "Aurora.ai backend running on http://localhost:5000"

# 4. Terminal 2: Start Frontend
cd frontend
npm run dev
# Should show: "VITE v5.0.0 ready in XXX ms"

# 5. Open in browser
# http://localhost:3000
```

## macOS/Linux Setup (Bash)

```bash
# 1. Run setup script
chmod +x setup.sh
./setup.sh

# 2. Edit backend/.env and add your Gemini API key
nano backend/.env

# 3. Terminal 1: Start Backend
cd backend
npm run dev

# 4. Terminal 2: Start Frontend
cd frontend
npm run dev

# 5. Open in browser
# http://localhost:3000
```

## Manual Setup

If scripts don't work, do this manually:

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your API key
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Getting Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key
4. Paste into `backend/.env` as: `GEMINI_API_KEY=your_key_here`

## Verify It's Working

- Backend health check: `http://localhost:5000/api/health`
- Should return: `{"status":"ok","timestamp":"..."}`

## Using Aurora.ai

1. **Upload a Document**
   - Drag & drop PDF, DOC, or DOCX
   - Or click to browse

2. **View Document**
   - See extracted text with clause highlighting
   - Color-coded clauses appear automatically

3. **Get Analysis**
   - Click "Analyze Document"
   - View summary, clauses, risk score, next steps

4. **Ask Questions**
   - Switch to Q&A tab
   - Ask anything about the document
   - Choose language for multilingual support

## Troubleshooting

### "Cannot find module" error
```bash
# Reinstall dependencies
npm install
```

### WebSocket connection failed
- Ensure backend is running on port 5000
- Check if port is already in use: `netstat -ano | findstr :5000` (Windows)
- Kill process: `taskkill /PID <PID> /F`

### Gemini API errors
- Verify API key is valid
- Check API key has no extra spaces: `GEMINI_API_KEY=abc123` (not `= abc123 `)
- Ensure API is enabled in Google Cloud Console

### Documents not extracting
- Try a different PDF (some PDFs have image-only pages)
- Ensure file is <50MB
- Check browser console for errors (F12)

### Port 3000 or 5000 already in use

**Windows:**
```powershell
# Find process
netstat -ano | findstr :3000
# Kill it (replace 1234 with actual PID)
taskkill /PID 1234 /F
```

**Mac/Linux:**
```bash
# Find process
lsof -i :3000
# Kill it (replace 1234 with actual PID)
kill -9 1234
```

## File Structure

```
backend/               # Express server
├── server.js          # Main server
├── routes/            # API routes
├── services/          # AI logic
├── middleware/        # Rate limiting, etc
└── package.json

frontend/              # React app
├── src/
│   ├── App.jsx        # Main component
│   ├── components/    # UI components
│   ├── store.js       # State management
│   └── api.js         # API client
├── index.html
└── package.json
```

## Environment Variables

Create `backend/.env`:
```
GEMINI_API_KEY=your_api_key_here
PORT=5000
NODE_ENV=development
```

## Development Commands

**Backend:**
```bash
cd backend
npm run dev      # Start dev server with auto-reload
npm start        # Run without reload
```

**Frontend:**
```bash
cd frontend
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Next Steps

- 📖 Read [Full Documentation](./README.md)
- 🐛 Report issues or improvements
- 🚀 Deploy to production (coming soon)

## Production Deployment

Ready to deploy? See deployment section in README.md

---

**Have fun analyzing! 📄🔍**
