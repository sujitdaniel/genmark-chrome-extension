# LinkedIn Social Assistant Chrome Extension

AI-powered Chrome extension that provides intelligent insights and comment suggestions for LinkedIn posts and profiles.

## Features

- **Profile Analysis**: AI-powered suggestions for LinkedIn profile improvements
- **Post Classification**: Automatically categorizes LinkedIn posts by industry, tone, and topic
- **Comment Generation**: Generates contextual comment suggestions for LinkedIn posts
- **Smart Deduplication**: Ensures unique and relevant suggestions

## Project Structure

```
genmark-chrome-extension/
├── backend/                 # FastAPI backend server
│   ├── app/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # OpenAI client service
│   │   └── schemas/        # Pydantic models
│   └── requirements.txt    # Python dependencies
├── frontend/               # Chrome extension frontend
│   ├── src/
│   │   ├── content/        # Content scripts for LinkedIn
│   │   ├── popup/          # Extension popup
│   │   └── sidepanel/      # Extension sidepanel
│   ├── public/
│   │   └── manifest.json   # Chrome extension manifest
│   └── package.json        # Node.js dependencies
└── README.md
```

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 18+
- OpenAI API key

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment:**
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Create .env file:**
   ```bash
   echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
   ```

6. **Start backend server:**
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the extension:**
   ```bash
   npm run build:extension
   ```

4. **Load extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `frontend/dist` folder

## Usage

### Profile Analysis
- Navigate to any LinkedIn profile page
- Click the "🔍 AI Suggestions" button
- View AI-powered profile improvement suggestions

### Post Classification
- Browse LinkedIn feed
- Posts will automatically show AI analysis overlays
- View industry, tone, topic, and summary

### Comment Generation
- Open any LinkedIn post
- Scroll down to see AI-generated comment suggestions
- Copy or insert suggestions directly

## API Endpoints

- `POST /analyze-profile` - Analyze LinkedIn profile data
- `POST /classify-post` - Classify LinkedIn post content
- `POST /generate-comments` - Generate comment suggestions
- `GET /openai-check` - Test OpenAI API connection

## Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   - Ensure backend is running on port 8000
   - Check firewall settings
   - Verify .env file has valid OpenAI API key

2. **Extension Not Working**
   - Reload the extension in Chrome
   - Check browser console for errors
   - Ensure content scripts are loaded

3. **OpenAI API Errors**
   - Verify API key is valid and has credits
   - Check rate limits
   - Ensure model availability

### Debug Mode

Enable debug logging by checking the browser console and backend terminal for detailed error messages.

## Development

### Adding New Features

1. **Backend**: Add new routes in `backend/app/routes/`
2. **Frontend**: Create new content scripts in `frontend/src/content/`
3. **Manifest**: Update `manifest.json` to include new scripts

### Testing

- Backend: Use FastAPI's automatic docs at `http://localhost:8000/docs`
- Frontend: Test in Chrome with extension loaded
- Integration: Verify content scripts work on LinkedIn pages

## Security Notes

- Never commit API keys to version control
- Use environment variables for sensitive data
- Consider rate limiting for production use
- Validate all user inputs

## License

This project is for educational and personal use. Please respect LinkedIn's terms of service and OpenAI's usage policies.
