#!/bin/bash
# Aurora.ai Setup Script

echo "🚀 Aurora.ai - Legal Document Analysis Platform"
echo "================================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

echo "✅ Node.js $(node --version) found"
echo ""

# Backend setup
echo "📦 Setting up Backend..."
cd backend
npm install
cp .env.example .env

echo ""
echo "⚠️  IMPORTANT: Edit backend/.env and add your Gemini API key"
echo "   Visit: https://aistudio.google.com/app/apikey"
echo ""

# Frontend setup
echo "📦 Setting up Frontend..."
cd ../frontend
npm install

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Add your GEMINI_API_KEY to backend/.env"
echo "2. Start backend: cd backend && npm run dev"
echo "3. Start frontend: cd frontend && npm run dev"
echo "4. Open http://localhost:3000"
echo ""
echo "Happy analyzing! 📄🔍"
