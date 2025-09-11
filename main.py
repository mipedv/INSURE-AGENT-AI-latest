from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(title="InsurAgent API", description="API for insurance claim verification")

# Add CORS middleware - Configured for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080", 
        "http://localhost:3000",  # Common dev ports
        "http://127.0.0.1:3000",
        "*"  # Allow all origins for development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include API router
app.include_router(router, prefix="")

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to InsurAgent API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
