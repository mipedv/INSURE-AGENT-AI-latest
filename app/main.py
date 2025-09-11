from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Handle both direct execution and module import
try:
    from .api import router as api_router
except ImportError:
    # When running directly, use absolute import
    from api import router as api_router

app = FastAPI(title="InsurAgent", description="AI-powered insurance claim verification")

# Configure CORS to allow frontend to communicate with backend - Updated for development
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

# Include the API router
app.include_router(api_router)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to InsurAgent API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
