# InsurAgent - Production Insurance Claim Verification System

## Overview
InsurAgent is a production-ready medical insurance claim verification application that uses AI to evaluate insurance claims against policy exclusions and clinical logic.

## Features Implemented

### ✅ Core Functionality
- **CSV Upload with Preview**: Upload CSV files and preview patient data before processing
- **Batch Verification**: Process multiple patients with real-time progress indication
- **Individual Claim Verification**: Manual single claim entry and verification
- **Detailed Results View**: Comprehensive field-by-field analysis with policy evaluation
- **Clinical Logic Analysis**: Medical coherence scoring and recommendations
- **Score Deduction Logic**: 100% base score with 20% deductions for exclusions and clinical flags

### ✅ User Interface
- **Modern Dashboard**: Clean, responsive design matching Figma prototypes
- **Progress Tracking**: Real-time batch processing with progress bars
- **Color-Coded Results**: Green for allowed, red for excluded claims
- **Interactive Recommendations**: Checkbox recommendations with Apply functionality
- **Navigation**: Full browser back/forward support with state management
- **Toast Notifications**: Success confirmations and alert messages

### ✅ Technical Features
- **FastAPI Backend**: High-performance API with OpenAI integration
- **ChromaDB Vector Search**: Efficient policy clause matching
- **CSV Processing**: Client-side and server-side CSV handling
- **Real-time Updates**: Dynamic UI updates during processing
- **Error Handling**: Robust error management and user feedback

## Quick Start

### Prerequisites
- Python 3.8+
- OpenAI API key
- ChromaDB setup with policy data

### Installation
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   ```bash
   set OPENAI_API_KEY=your_openai_api_key_here
   ```

### Running the Application

**Option 1: Windows Batch File (Recommended)**
```bash
start_servers_production.bat
```

**Option 2: Manual Start**
```bash
# Terminal 1 - Backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
python frontend_server.py
```

### Access Points
- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Usage Flow

### 1. CSV Upload & Preview
1. Navigate to Demo page
2. Upload CSV file with columns: `chief_complaints`, `symptoms`, `diagnosis_description`, `service_detail`, `payer_product_category_name`
3. Preview patient data in table format
4. Click "Start Verification" to begin processing

### 2. Batch Processing
- Real-time progress bar shows processing status
- Each patient result appears as completed
- Color-coded cards (green=allowed, red=excluded)
- Score displays approval percentage

### 3. View Patient Details
- Click "View Details" on any patient card
- See field-by-field breakdown with:
  - Clinical Fields
  - Submitted Details
  - Coverage Status (Allowed/Excluded)
  - Policy Evaluation
  - Policy Source
  - Recommendations

### 4. Apply Recommendations
- Check desired recommendations
- Click "Apply Selected" buttons
- See confirmation toasts
- Applied recommendations show in green alerts

### 5. Submit Claim
- Click "Submit Claim Evaluation"
- Loading animation during submission
- Success toast confirmation
- Auto-return to results

## Scoring Logic
- **Base Score**: 100%
- **Exclusion Penalty**: -20% if any field is excluded
- **Clinical Flag Penalty**: -20% if clinical coherence issues found
- **Minimum Score**: 0%

## File Structure
```
project_demo/
├── app/                 # Backend FastAPI application
│   ├── main.py         # FastAPI app entry point
│   ├── api.py          # API endpoints
│   ├── logic.py        # Verification logic
│   ├── schemas.py      # Data models
│   ├── prompts.py      # LLM prompts
│   └── model_setup.py  # OpenAI/ChromaDB setup
├── frontend/           # Frontend web application
│   ├── index.html      # Main HTML file
│   ├── app.js          # JavaScript logic
│   └── styles.css      # CSS styling
├── chroma_db/          # ChromaDB vector database
├── test_demo.csv       # Sample test data
└── start_servers_production.bat  # Windows startup script
```

## Production Notes
- All mock/test logic has been removed
- Clean error handling without debug output
- Optimized for real OpenAI API usage
- Browser compatibility tested
- Mobile responsive design
- Production-ready security considerations

## API Endpoints
- `POST /verify-case` - Single claim verification
- `POST /verify-csv` - Batch CSV processing
- `GET /` - Health check

## Support
For issues or questions, refer to the codebase documentation or API documentation at `/docs`. 