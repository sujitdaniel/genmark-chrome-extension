from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv
from .routes import comments, profile, classify
from .services.openai_client import get_openai_client

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="LinkedIn Social Assistant API",
    description="AI-powered LinkedIn productivity tools",
    version="1.0.0"
)

# CORS configuration - update these origins for production
ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternative dev port
    "chrome-extension://*",   # Chrome extensions
    "*"  # Remove this in production
]

# Add CORS middleware for Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(profile, tags=["profile"])
app.include_router(classify, tags=["classify"])
app.include_router(comments, tags=["comments"])

# Health check endpoint
@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "LinkedIn Social Assistant API is running", "status": "healthy"}

# OpenAI connection test endpoint
@app.get("/openai-check")
async def openai_check():
    """
    Test OpenAI API connection and return status
    This endpoint verifies that your API key is working correctly
    """
    try:
        # Check if API key is loaded
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "message": "OpenAI API key not found in environment variables",
                    "detail": "Please check your .env file and ensure OPENAI_API_KEY is set"
                }
            )
        
        # Test OpenAI client initialization
        client = get_openai_client()
        
        # Make a minimal test call
        response = await client.generate_response(
            "Respond with just 'OK' if you can read this.",
            max_tokens=10,
            temperature=0
        )
        
        return {
            "status": "success",
            "message": "OpenAI API connection successful",
            "api_key_present": True,
            "test_response": response.strip()
        }
        
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={
                "status": "error",
                "message": "OpenAI API connection failed",
                "detail": e.detail
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "Unexpected error testing OpenAI connection",
                "detail": str(e)
            }
        )

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle all unhandled exceptions"""
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )

# Startup event - validate configuration
@app.on_event("startup")
async def startup_event():
    """Validate configuration on startup"""
    try:
        # Test OpenAI client initialization
        get_openai_client()
        print("✅ OpenAI client initialized successfully")
        print("✅ Backend is ready to serve requests")
    except HTTPException as e:
        print(f"❌ OpenAI configuration error: {e.detail}")
        print("⚠️  Backend will start but API calls will fail")
        # Don't raise here - let the app start but routes will fail gracefully

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000, reload=True)
