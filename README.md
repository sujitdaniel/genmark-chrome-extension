# LinkedIn Social Assistant Chrome Extension

AI-powered productivity tools for LinkedIn: profile analyzer, feed classifier, and comment assistant.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- OpenAI API key

### 1. Setup Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file with your OpenAI API key
echo "OPENAI_API_KEY=sk-your-openai-api-key-here" > .env

# Start the FastAPI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```

### 2. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Build the extension
npm run build
```

### 3. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `frontend/dist` folder
5. The extension is now active!

## 🔧 Configuration

### OpenAI API Key Setup

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a `.env` file in the `backend` directory:
   ```bash
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
3. Restart the backend server

### Testing OpenAI Connection

After setting up your API key, test the connection:

```bash
# Start the backend
python -m uvicorn backend.app.main:app --reload

# Test the connection (in browser or curl)
curl http://localhost:5000/openai-check
```

**Expected successful response:**
```json
{
  "status": "success",
  "message": "OpenAI API connection successful",
  "api_key_present": true,
  "test_response": "OK"
}
```

**If you see an error, check:**
- Your `.env` file exists in the `backend` directory
- The API key is correct and active
- You have sufficient OpenAI credits

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |

## 📁 Project Structure

```
genmark-chrome-extension/
├── frontend/                 # Chrome Extension
│   ├── src/
│   │   ├── content/         # Content scripts
│   │   │   ├── index.tsx    # Profile analyzer
│   │   │   ├── feed.tsx     # Feed classifier
│   │   │   └── post.tsx     # Comment assistant
│   │   ├── popup/           # Extension popup
│   │   └── manifest.json    # Extension config
│   ├── background.js        # Service worker
│   └── vite.config.ts       # Build config
└── backend/                 # FastAPI Server
    ├── app/
    │   ├── main.py          # FastAPI app
    │   ├── routes/          # API endpoints
    │   ├── schemas/         # Pydantic models
    │   └── services/        # Business logic
    ├── .env                 # Environment variables (create this)
    └── requirements.txt     # Python dependencies
```

## 🛠️ Development

### Backend Development

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run with auto-reload
python -m uvicorn app.main:app --reload

# API Documentation
# Visit http://localhost:5000/docs for Swagger UI

# Test OpenAI connection
curl http://localhost:5000/openai-check
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Development mode (for popup only)
npm run dev

# Build extension
npm run build

# Watch mode for development
npm run build -- --watch
```

## 📦 Build & Deploy

### 1. Build Extension

```bash
cd frontend
npm run build
```

### 2. Prepare for Chrome Web Store

1. Copy `manifest.json` into the `dist/` folder if not present
2. Ensure `background.js` is in `dist/`
3. Zip the contents of `dist/` (not the folder itself)
4. Upload to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

### 3. Deploy Backend

```bash
cd backend

# Production dependencies
pip install -r requirements.txt

# Set production environment variables
export OPENAI_API_KEY=your-production-key

# Run with production server
python -m uvicorn app.main:app --host 0.0.0.0 --port 5000
```

## 🔍 Features

### Profile Analyzer
- Analyzes LinkedIn profiles for improvement suggestions
- Extracts banner, headline, about, and services data
- Provides AI-powered recommendations

### Feed Classifier
- Classifies feed posts by industry, tone, topic, and summary
- Uses IntersectionObserver for performance
- Skips ads and promoted content

### Comment Assistant
- Generates 3 AI-powered comment suggestions
- Copy and insert functionality
- Works on post detail pages

## 🛡️ Security & Privacy

- All API calls are made directly from the extension to your backend
- No data is stored or logged
- OpenAI API key is kept secure on your backend
- CORS is configured for Chrome extension origins
- `.env` file is excluded from version control

## 🐛 Troubleshooting

### Backend Issues
- **"OpenAI API key not configured"**: Check your `.env` file
- **"Module not found"**: Run `pip install -r requirements.txt`
- **Port already in use**: Change port in uvicorn command
- **API connection fails**: Test with `/openai-check` endpoint

### Frontend Issues
- **Extension not loading**: Check `manifest.json` and build output
- **Content scripts not running**: Verify URL patterns in manifest
- **Build errors**: Check TypeScript compilation

### API Issues
- **CORS errors**: Ensure backend is running on correct port
- **404 errors**: Check endpoint URLs in content scripts
- **500 errors**: Check backend logs and OpenAI API key

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/openai-check` | GET | Test OpenAI API connection |
| `/analyze-profile` | POST | Analyze LinkedIn profile data |
| `/classify-post` | POST | Classify feed post content |
| `/generate-comments` | POST | Generate comment suggestions |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Need help?** Open an issue or contact the maintainer.
