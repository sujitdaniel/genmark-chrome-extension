# LinkedIn Social Assistant

This project is a Chrome extension that provides AI-powered tools to enhance your LinkedIn experience. It includes a profile analyzer, a feed classifier, and a comment assistant.

## Features

- **Profile Analyzer**: Get an AI-generated analysis of any LinkedIn profile.
- **Feed Classifier**: Automatically classify posts in your feed by industry, tone, and topic.
- **Comment Assistant**: Generate relevant and insightful comments for any post.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Python, FastAPI
- **AI**: OpenAI API

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3.8+ and pip
- An OpenAI API key

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/linkedin-social-assistant.git
   cd linkedin-social-assistant
   ```

2. **Backend Setup:**

   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   ```

   Add your OpenAI API key to the `.env` file:

   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **Frontend Setup:**

   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the backend server:**

   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```

   The backend will be running at `http://localhost:8000`.

2. **Build the frontend:**

   ```bash
   cd ../frontend
   npm run build
   ```

   This will create a `dist` folder in the `frontend` directory.

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable "Developer mode" in the top right corner.
3. Click "Load unpacked" and select the `frontend/dist` directory.
4. The LinkedIn Social Assistant extension should now be installed and ready to use.

## Usage

- **Open the Popup**: Click the extension icon in the Chrome toolbar to open the popup.
- **Open the Side Panel**: Click the "Open Assistant" button in the popup to open the side panel.
- **Content Scripts**: The content scripts will automatically run on LinkedIn pages to provide the features.
