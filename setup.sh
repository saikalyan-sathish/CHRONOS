#!/bin/bash

echo "=================================="
echo "  Chronos Calendar Setup Script"
echo "=================================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed!"
    echo ""
    echo "Please install Node.js first:"
    echo "  Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
    echo "  macOS: brew install node"
    echo "  Or download from: https://nodejs.org/"
    echo ""
    exit 1
fi

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo ""

# Check for MongoDB
if ! command -v mongod &> /dev/null; then
    echo "Warning: MongoDB is not installed locally."
    echo "You can either:"
    echo "  1. Install MongoDB locally: https://www.mongodb.com/docs/manual/installation/"
    echo "  2. Use MongoDB Atlas (cloud) and update the MONGODB_URI in backend/.env"
    echo ""
fi

echo "Installing root dependencies..."
npm install

echo ""
echo "Installing backend dependencies..."
cd backend && npm install

echo ""
echo "Installing frontend dependencies..."
cd ../frontend && npm install

cd ..

echo ""
echo "=================================="
echo "  Setup Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "  1. Make sure MongoDB is running (locally or update .env with Atlas URI)"
echo "  2. Run 'npm run dev' to start both backend and frontend"
echo "  3. Open http://localhost:3000 in your browser"
echo ""
echo "Default ports:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:5000"
echo ""
