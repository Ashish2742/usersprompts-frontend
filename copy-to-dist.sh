#!/bin/bash

# Copy necessary files to dist directory
echo "📁 Copying files to dist directory..."

# Copy essential files
cp manifest.json dist/
cp popup.html dist/
cp popup.css dist/
cp error-handler.js dist/

# Copy README if it exists
if [ -f "README.md" ]; then
    cp README.md dist/
fi

# Copy any other static files that might be needed
if [ -f "icons/icon128.png" ]; then
    mkdir -p dist/icons
    cp icons/* dist/icons/ 2>/dev/null || true
fi

# Copy any assets from src
if [ -d "src/assets" ]; then
    cp -r src/assets dist/
fi

echo "✅ Files copied to dist directory"
echo "📋 Extension ready in dist/ folder"
echo "To install:"
echo "   1. Open Chrome and go to chrome://extensions/"
echo "   2. Enable 'Developer mode'"
echo "   3. Click 'Load unpacked'"
echo "   4. Select the chrome-extension/dist folder"