# UsersPrompts Chrome Extension

A powerful Chrome extension that provides advanced AI prompt optimization and scoring capabilities directly in your browser.

## Features

### 🚀 Core Functionality
- **Prompt Optimization**: Transform basic prompts into comprehensive, effective system prompts
- **Detailed Scoring**: Get scores across 5 key criteria (clarity, specificity, completeness, effectiveness, robustness)
- **Comprehensive Feedback**: Understand what was wrong, what was improved, and specific recommendations
- **Before/After Comparison**: See the exact changes made to your prompts

### 🎯 User Experience
- **Floating Button**: Quick access button on every webpage
- **Text Selection**: Select text on any page to optimize it
- **Context Menu**: Right-click to optimize selected text
- **Beautiful UI**: Modern, responsive design with Tailwind CSS

### 📊 Advanced Analytics
- **Score Breakdown**: Detailed scoring for each optimization criterion
- **Improvement Metrics**: Track overall improvement and percentage gains
- **Recommendations**: Get specific advice for further improvements
- **Best Practices**: Learn from applied optimization techniques

## Installation

### Development Setup

1. **Clone and Install Dependencies**
   ```bash
   cd chrome-extension
   npm install
   ```

2. **Build the Extension**
   ```bash
   npm run build
   ```

3. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `chrome-extension` folder

### Production Build

1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Package for Chrome Web Store**
   - The built files will be in the `dist` folder
   - Zip the contents for Chrome Web Store submission

## Usage

### Basic Usage

1. **Click the Extension Icon**
   - Click the UsersPrompts icon in your Chrome toolbar
   - Enter your system prompt in the form
   - Click "Optimize Prompt"

2. **Select Text on Any Page**
   - Select any text on a webpage
   - A tooltip will appear offering to optimize it
   - Click the tooltip to open the optimizer with the selected text

3. **Right-Click Context Menu**
   - Select text on any page
   - Right-click and choose "Optimize Prompt with UsersPrompts"

### Advanced Features

- **Custom Context**: Add context about your use case
- **Target Audience**: Specify who will use the AI
- **Optimization Focus**: Choose which criteria to focus on
- **Batch Processing**: Optimize multiple prompts at once

## API Integration

The extension connects to your UsersPrompts AI backend API:

- **Base URL**: `http://localhost:8000/api/v1`
- **Endpoints**:
  - `POST /prompt-optimizer/optimize` - Optimize a single prompt
  - `POST /prompt-optimizer/batch-optimize` - Optimize multiple prompts
  - `POST /prompt-scorer/score` - Score a prompt
  - `POST /prompt-optimizer/discover` - Discover system prompts

## Development

### Project Structure

```
chrome-extension/
├── src/
│   ├── components/
│   │   ├── PromptOptimizer.tsx
│   │   └── ResultViewer.tsx
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── api.ts
│   ├── popup.tsx
│   ├── background.ts
│   └── content.ts
├── manifest.json
├── popup.html
├── popup.css
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Key Components

- **PromptOptimizer**: Main form component for prompt input
- **ResultViewer**: Displays optimization results and analysis
- **ApiService**: Handles communication with the backend
- **Background Script**: Manages extension lifecycle and messaging
- **Content Script**: Injects UI elements and handles text selection

### Technologies Used

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Fast build tool
- **Chrome Extension APIs**: Manifest V3

## Configuration

### API Configuration

Update the API base URL in `src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8000/api/v1'; // Development
// const API_BASE_URL = 'https://usersprompts.com/api/v1'; // Production
```

### Manifest Configuration

The `manifest.json` file configures:
- Extension permissions
- Host permissions for API access
- Content script injection
- Background service worker

## Deployment

### Chrome Web Store

1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Create ZIP File**
   - Zip the contents of the `dist` folder
   - Include all necessary files

3. **Submit to Chrome Web Store**
   - Create a developer account
   - Upload the ZIP file
   - Provide store listing information

### Self-Hosting

1. **Build the Extension**
   ```bash
   npm run build
   ```

2. **Load in Chrome**
   - Use "Load unpacked" in developer mode
   - Point to the `dist` folder

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Ensure your backend server is running
   - Check the API base URL configuration
   - Verify CORS settings on your backend

2. **Extension Not Loading**
   - Check the manifest.json for syntax errors
   - Ensure all required files are present
   - Check Chrome's extension error console

3. **Build Errors**
   - Run `npm install` to ensure all dependencies are installed
   - Check TypeScript configuration
   - Verify Vite configuration

### Debug Mode

Enable debug logging by adding to `background.ts`:

```typescript
console.log('Debug mode enabled');
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**UsersPrompts AI** - Advanced Prompt Optimization for Everyone 