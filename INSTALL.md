# UsersPrompts Chrome Extension - Installation Guide

## Quick Installation

### Step 1: Build the Extension
```bash
cd chrome-extension
npm install
npm run build
```

### Step 2: Load in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension/dist` folder
5. The extension should now appear in your extensions list

### Step 3: Test the Extension
1. Click the UsersPrompts icon in your Chrome toolbar
2. Enter a test prompt like: "You are an AI assistant. Help users."
3. Click "Optimize Prompt"
4. View the detailed results and analysis

## Features to Test

### 🎯 Basic Functionality
- **Popup Interface**: Click the extension icon to open the optimizer
- **Form Input**: Enter system prompts, context, and target audience
- **Optimization**: Get detailed analysis and improved prompts
- **Results View**: See scores, improvements, and recommendations

### 🌐 Web Integration
- **Floating Button**: Look for the blue "UP" button on any webpage
- **Text Selection**: Select text on any page to see optimization tooltip
- **Context Menu**: Right-click selected text for quick optimization

### 📊 Advanced Features
- **Score Breakdown**: View detailed scores across 5 criteria
- **Improvement Metrics**: See overall improvement percentages
- **Detailed Feedback**: Understand what was wrong and what was improved
- **Recommendations**: Get specific advice for further improvements

## Troubleshooting

### Extension Not Loading
- Check that all files are in the `dist` folder
- Verify `manifest.json` is valid
- Check Chrome's extension error console

### API Connection Issues
- Ensure your backend server is running on `http://localhost:8000`
- Check the API endpoints are accessible
- Verify CORS settings on your backend

### Build Errors
- Run `npm install` to ensure dependencies are installed
- Check TypeScript configuration
- Verify all source files are present

## Development Mode

For development with hot reloading:
```bash
npm run dev
```

This will start a development server and watch for changes.

## Production Deployment

For Chrome Web Store deployment:
1. Build the extension: `npm run build`
2. Zip the contents of the `dist` folder
3. Submit to Chrome Web Store

## API Configuration

The extension connects to your UsersPrompts AI backend. Update the API URL in `src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8000/api/v1'; // Development
// const API_BASE_URL = 'https://usersprompts.com/api/v1'; // Production
```

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify the backend API is running
3. Test the API endpoints directly
4. Check the extension's error log in Chrome

---

**UsersPrompts AI** - Advanced Prompt Optimization for Everyone 