#!/bin/bash

# Ensure dist directory exists
mkdir -p dist

# Copy static files to dist
cp popup.html dist/
cp popup.css dist/
cp popup.js dist/
cp background.js dist/
cp content.js dist/
cp manifest.json dist/
cp error-handler.js dist/

# Copy src assets if they exist
if [ -d "src/assets" ]; then
    cp -r src/assets dist/
fi

echo "Static files copied to dist/"
echo "CSS file copied and applied"