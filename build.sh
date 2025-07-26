#!/bin/bash

# Build the Chrome extension
echo "🔨 Building Chrome extension..."

# Build with Vite
npm run build

# Copy necessary files to dist
echo "📁 Copying files to dist..."
cp manifest.json popup.html popup.css error-handler.js dist/

# Create icons directory if it doesn't exist
mkdir -p dist/icons

# Create professional icons
echo "🎨 Creating professional icons..."

# Create the 128px icon
cat > "dist/icons/icon128.svg" << 'EOF'
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="64" cy="64" r="60" fill="#2563EB" stroke="#1E40AF" stroke-width="2"/>
  
  <!-- Brain/Neural network icon -->
  <g fill="white" opacity="0.9">
    <!-- Main brain shape -->
    <path d="M64 20 C45 20, 30 35, 30 50 C30 65, 45 80, 64 80 C83 80, 98 65, 98 50 C98 35, 83 20, 64 20 Z" fill="none" stroke="white" stroke-width="3"/>
    
    <!-- Neural connections -->
    <circle cx="45" cy="40" r="3" fill="white"/>
    <circle cx="83" cy="40" r="3" fill="white"/>
    <circle cx="64" cy="60" r="4" fill="white"/>
    <circle cx="50" cy="70" r="2" fill="white"/>
    <circle cx="78" cy="70" r="2" fill="white"/>
    
    <!-- Connection lines -->
    <line x1="45" y1="40" x2="64" y2="60" stroke="white" stroke-width="2"/>
    <line x1="83" y1="40" x2="64" y2="60" stroke="white" stroke-width="2"/>
    <line x1="64" y1="60" x2="50" y2="70" stroke="white" stroke-width="2"/>
    <line x1="64" y1="60" x2="78" y2="70" stroke="white" stroke-width="2"/>
  </g>
  
  <!-- Sparkle effect -->
  <g fill="white" opacity="0.7">
    <circle cx="25" cy="25" r="1"/>
    <circle cx="103" cy="25" r="1"/>
    <circle cx="25" cy="103" r="1"/>
    <circle cx="103" cy="103" r="1"/>
  </g>
</svg>
EOF

# Create different sizes by copying and adjusting the main icon
for size in 16 32 48; do
  # Create scaled versions of the main icon
  cat > "dist/icons/icon${size}.svg" << 'EOF'
<svg width="SIZE" height="SIZE" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="64" cy="64" r="60" fill="#2563EB" stroke="#1E40AF" stroke-width="2"/>
  
  <!-- Brain/Neural network icon -->
  <g fill="white" opacity="0.9">
    <!-- Main brain shape -->
    <path d="M64 20 C45 20, 30 35, 30 50 C30 65, 45 80, 64 80 C83 80, 98 65, 98 50 C98 35, 83 20, 64 20 Z" fill="none" stroke="white" stroke-width="3"/>
    
    <!-- Neural connections -->
    <circle cx="45" cy="40" r="3" fill="white"/>
    <circle cx="83" cy="40" r="3" fill="white"/>
    <circle cx="64" cy="60" r="4" fill="white"/>
    <circle cx="50" cy="70" r="2" fill="white"/>
    <circle cx="78" cy="70" r="2" fill="white"/>
    
    <!-- Connection lines -->
    <line x1="45" y1="40" x2="64" y2="60" stroke="white" stroke-width="2"/>
    <line x1="83" y1="40" x2="64" y2="60" stroke="white" stroke-width="2"/>
    <line x1="64" y1="60" x2="50" y2="70" stroke="white" stroke-width="2"/>
    <line x1="64" y1="60" x2="78" y2="70" stroke="white" stroke-width="2"/>
  </g>
  
  <!-- Sparkle effect -->
  <g fill="white" opacity="0.7">
    <circle cx="25" cy="25" r="1"/>
    <circle cx="103" cy="25" r="1"/>
    <circle cx="25" cy="103" r="1"/>
    <circle cx="103" cy="103" r="1"/>
  </g>
</svg>
EOF
  # Replace SIZE placeholder with actual size
  sed -i.bak "s/SIZE/${size}/g" "dist/icons/icon${size}.svg"
  rm "dist/icons/icon${size}.svg.bak"
done

# Verify icons were created properly
echo "🔍 Verifying icons..."
for size in 16 32 48 128; do
  if [ -s "dist/icons/icon${size}.svg" ]; then
    echo "✅ icon${size}.svg created successfully"
  else
    echo "❌ Failed to create icon${size}.svg"
  fi
done

# Verify all essential files are present
echo "🔍 Verifying essential files..."
essential_files=("manifest.json" "popup.html" "popup.css" "popup.js" "background.js" "content.js" "error-handler.js")
for file in "${essential_files[@]}"; do
  if [ -f "dist/${file}" ]; then
    echo "✅ ${file} present"
  else
    echo "❌ ${file} missing"
  fi
done

echo "✅ Build complete! Extension ready in dist/ folder"
echo "📋 To install:"
echo "   1. Open Chrome and go to chrome://extensions/"
echo "   2. Enable 'Developer mode'"
echo "   3. Click 'Load unpacked'"
echo "   4. Select the chrome-extension/dist folder" 