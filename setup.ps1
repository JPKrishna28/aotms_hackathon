# Aurora.ai Setup Script for Windows
# Run this in PowerShell

Write-Host "🚀 Aurora.ai - Legal Document Analysis Platform" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Backend setup
Write-Host "📦 Setting up Backend..." -ForegroundColor Yellow
Push-Location backend
npm install
Copy-Item .env.example .env
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
Pop-Location

Write-Host ""

# Frontend setup
Write-Host "📦 Setting up Frontend..." -ForegroundColor Yellow
Push-Location frontend
npm install
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
Pop-Location

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Next steps:" -ForegroundColor Cyan
Write-Host "1. Add your GEMINI_API_KEY to backend\.env"
Write-Host "   Get free key at: https://aistudio.google.com/app/apikey"
Write-Host "2. Start backend: cd backend && npm run dev"
Write-Host "3. Start frontend (new terminal): cd frontend && npm run dev"
Write-Host "4. Open http://localhost:3000"
Write-Host ""
Write-Host "Happy analyzing! 📄🔍" -ForegroundColor Green
