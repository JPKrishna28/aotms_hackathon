#!/bin/bash
# Aurora.ai Installation Verification Script
# Checks if all required files and dependencies are in place

echo "🔍 Aurora.ai - Installation Verification"
echo "========================================"
echo ""

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js $NODE_VERSION found"
else
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

echo ""

# Check files
echo "Checking project files..."
REQUIRED_FILES=(
    "README.md"
    "QUICKSTART.md"
    "API.md"
    "DEPLOYMENT.md"
    "backend/server.js"
    "backend/package.json"
    "backend/.env.example"
    "backend/routes/documents.js"
    "backend/routes/analysis.js"
    "backend/services/gemini.js"
    "backend/services/document.js"
    "frontend/package.json"
    "frontend/src/App.jsx"
    "frontend/src/components/DocumentUpload.jsx"
)

ALL_FOUND=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - MISSING"
        ALL_FOUND=false
    fi
done

echo ""

if [ "$ALL_FOUND" = true ]; then
    echo "✅ All project files present!"
else
    echo "❌ Some files are missing"
    exit 1
fi

echo ""

# Check backend dependencies
echo "Checking backend dependencies..."
if [ -f "backend/package.json" ]; then
    REQUIRED_DEPS=("express" "@google-cloud/generative-ai" "pdf-parse" "mammoth" "ws")
    ALL_FOUND=true
    
    for dep in "${REQUIRED_DEPS[@]}"; do
        if grep -q "\"$dep\"" backend/package.json; then
            echo "✅ $dep"
        else
            echo "⚠️  $dep - not in package.json"
        fi
    done
fi

echo ""

# Check frontend dependencies
echo "Checking frontend dependencies..."
if [ -f "frontend/package.json" ]; then
    REQUIRED_DEPS=("react" "axios" "zustand" "tailwindcss")
    
    for dep in "${REQUIRED_DEPS[@]}"; do
        if grep -q "\"$dep\"" frontend/package.json; then
            echo "✅ $dep"
        else
            echo "⚠️  $dep - not in package.json"
        fi
    done
fi

echo ""
echo "========================================"
echo "✅ Installation check complete!"
echo ""
echo "📚 Next steps:"
echo "1. Read QUICKSTART.md"
echo "2. Get Gemini API key: https://aistudio.google.com/app/apikey"
echo "3. Run: ./setup.sh"
echo "4. Start backend: cd backend && npm run dev"
echo "5. Start frontend: cd frontend && npm run dev"
echo ""
