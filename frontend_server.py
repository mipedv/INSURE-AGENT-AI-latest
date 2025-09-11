#!/usr/bin/env python3
"""
FastAPI Frontend Server for InsurAgent
Serves the frontend files with proper routing
"""

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import os

# Create FastAPI app for frontend
app = FastAPI(title="InsurAgent Frontend", description="Frontend server for InsurAgent UI")

# Check if frontend directory exists
frontend_dir = "frontend"
if not os.path.exists(frontend_dir):
    raise Exception(f"Frontend directory '{frontend_dir}' not found!")

# Health check endpoint (define before catch-all)
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "InsurAgent Frontend"}

# Serve index.html at root
@app.get("/")
async def serve_index():
    """Serve the main index.html file"""
    index_path = os.path.join(frontend_dir, "index.html")
    if not os.path.exists(index_path):
        raise Exception(f"index.html not found at {index_path}")
    return FileResponse(index_path)

# Catch-all route to serve static files or index.html
@app.get("/{full_path:path}")
async def serve_files(full_path: str, request: Request):
    """Serve static files or index.html for SPA routing"""
    # Check if it's a request for a static file
    static_file_path = os.path.join(frontend_dir, full_path)
    
    # If the file exists, serve it
    if os.path.isfile(static_file_path):
        return FileResponse(static_file_path)
    
    # Otherwise, serve index.html for SPA routing (handles #demo, #demo-details, etc.)
    index_path = os.path.join(frontend_dir, "index.html")
    return FileResponse(index_path)

if __name__ == "__main__":
    print("🚀 Starting InsurAgent Frontend Server...")
    print(f"📁 Serving files from: {os.path.abspath(frontend_dir)}")
    print("🌐 Frontend will be available at: http://localhost:8080")
    print("📄 Root page: index.html")
    uvicorn.run(app, host="0.0.0.0", port=8080, log_level="info") 