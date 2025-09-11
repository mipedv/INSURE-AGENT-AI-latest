#!/usr/bin/env python3
"""
Minimal FastAPI server for testing connectivity
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import pandas as pd
import io

# Create FastAPI app
app = FastAPI(title="InsurAgent API - Test", description="Minimal API for testing")

# Add CORS middleware with explicit configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.get("/")
async def root():
    return {"message": "InsurAgent API is running!", "status": "ok"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "InsurAgent API"}

@app.options("/verify-case")
async def verify_case_options():
    return {"message": "OK"}

@app.options("/verify-csv")
async def verify_csv_options():
    return {"message": "OK"}

@app.post("/verify-case")
async def verify_case_simple(case: dict):
    """Simple test endpoint for case verification"""
    return {
        "final_decision": "Allowed",
        "approval_probability": 85,
        "field_breakdown": {
            "complaint": {"result": "Allowed", "explanation": "Test response"},
            "symptoms": {"result": "Allowed", "explanation": "Test response"},
            "diagnosis": {"result": "Allowed", "explanation": "Test response"},
            "lab": {"result": "Allowed", "explanation": "Test response"},
            "pharmacy": {"result": "Allowed", "explanation": "Test response"}
        },
        "clinical_flags": []
    }

@app.post("/verify-csv")
async def verify_csv_simple(file: UploadFile = File(...)):
    """Process CSV file and return verification results"""
    try:
        # Read the uploaded file
        contents = await file.read()
        
        # Parse CSV
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        print(f"CSV columns: {list(df.columns)}")
        print(f"CSV shape: {df.shape}")
        print(f"First few rows:\n{df.head()}")
        
        # Map your CSV columns to expected format
        column_mapping = {
            'chief_complaints': 'complaint',
            'symptoms': 'symptoms', 
            'diagnosis_description': 'diagnosis',
            'service_detail': 'lab',
            'payer_product_category_name': 'pharmacy'
        }
        
        results = []
        
        for index, row in df.iterrows():
            # Map the columns
            mapped_data = {}
            for csv_col, expected_col in column_mapping.items():
                if csv_col in df.columns:
                    mapped_data[expected_col] = str(row[csv_col]) if pd.notna(row[csv_col]) else ""
                else:
                    mapped_data[expected_col] = ""
            
            # Determine decisions based on content for testing
            symptoms_text = mapped_data.get('symptoms', '').lower()
            lab_text = mapped_data.get('lab', '').lower()
            
            # Create some test exclusions
            symptoms_excluded = 'fatigue' in symptoms_text
            lab_excluded = 'eye examination' in lab_text
            
            final_decision = "Excluded" if (symptoms_excluded or lab_excluded) else "Allowed"
            approval_prob = 60 if final_decision == "Excluded" else 85
            
            # Create clinical flags for excluded items
            clinical_flags = []
            if symptoms_excluded:
                clinical_flags.append({
                    "flagged_field": "symptoms",
                    "flagged_item": "fatigue",
                    "recommendations": [
                        "Consider alternative symptom description",
                        "Request additional medical documentation",
                        "Review with medical team"
                    ]
                })
            
            # Create result for this row
            result = {
                "case_id": f"CASE-{index + 1}",
                "result": {
                    "final_decision": final_decision,
                    "approval_probability": approval_prob,
                    "field_breakdown": {
                        "complaint": {
                            "field": "complaint",
                            "value": mapped_data.get('complaint', ''),
                            "result": "Allowed", 
                            "explanation": f"Complaint '{mapped_data.get('complaint', '')}' is covered",
                            "policy_source": "Main Policy"
                        },
                        "symptoms": {
                            "field": "symptoms",
                            "value": mapped_data.get('symptoms', ''),
                            "result": "Excluded" if symptoms_excluded else "Allowed", 
                            "explanation": f"Symptoms contain excluded term 'fatigue'" if symptoms_excluded else f"Symptoms '{mapped_data.get('symptoms', '')}' are valid",
                            "policy_source": "Main Policy"
                        },
                        "diagnosis": {
                            "field": "diagnosis",
                            "value": mapped_data.get('diagnosis', ''),
                            "result": "Allowed", 
                            "explanation": f"Diagnosis '{mapped_data.get('diagnosis', '')}' is covered",
                            "policy_source": "Main Policy"
                        },
                        "lab": {
                            "field": "lab",
                            "value": mapped_data.get('lab', ''),
                            "result": "Excluded" if lab_excluded else "Allowed", 
                            "explanation": f"Lab test 'eye examination' is excluded for sight correction" if lab_excluded else f"Lab test '{mapped_data.get('lab', '')}' is approved",
                            "policy_source": "Sub Policy" if lab_excluded else "Main Policy"
                        },
                        "pharmacy": {
                            "field": "pharmacy",
                            "value": mapped_data.get('pharmacy', ''),
                            "result": "Allowed", 
                            "explanation": f"Medication '{mapped_data.get('pharmacy', '')}' is covered",
                            "policy_source": "Main Policy"
                        }
                    },
                    "clinical_flags": clinical_flags
                }
            }
            results.append(result)
        
        return {
            "results": results,
            "total_processed": len(results)
        }
        
    except Exception as e:
        print(f"Error processing CSV: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")

if __name__ == "__main__":
    print("Starting minimal InsurAgent API server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info") 