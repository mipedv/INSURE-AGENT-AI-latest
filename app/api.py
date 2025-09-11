from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List, Dict, Any
import pandas as pd
import io
import json
from app.schemas import CaseRequest, CaseResponse, BatchResponse
from app.logic import verify_combined_case, generate_policy_recommendations
from app.model_setup import get_chromadb_client, get_openai_client, collections, reset_system, is_mock_mode
import os

router = APIRouter()

@router.post("/verify-case", response_model=CaseResponse)
async def verify_single_case(case: CaseRequest):
    """
    Verify a single insurance case against policy exclusions
    """
    try:
        # Verify the case
        result = verify_combined_case(
            complaint=case.complaint,
            symptoms=case.symptoms,
            diagnosis=case.diagnosis,
            lab=case.lab,
            pharmacy=case.pharmacy
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing case: {str(e)}")

@router.post("/regenerate-field-recommendations")
async def regenerate_field_recommendations(request: Dict[str, Any]):
    """
    Regenerate policy-based recommendations for a specific excluded field
    """
    try:
        field_name = request.get("field_name")
        value = request.get("value")
        explanation = request.get("explanation")
        policy_source = request.get("policy_source", "Policy")
        
        if not all([field_name, value, explanation]):
            raise HTTPException(status_code=400, detail="Missing required fields: field_name, value, explanation")
        
        print(f"🔄 Regenerating recommendations for {field_name}: {value}")
        
        # Extract diagnosis context if available
        diagnosis = request.get("diagnosis", "")
        complaint = request.get("complaint", "")
        symptoms = request.get("symptoms", "")
        
        # Generate new diagnosis-aware recommendations
        new_recommendations = generate_policy_recommendations(
            field_name=field_name,
            value=value,
            explanation=explanation,
            policy_source=policy_source,
            diagnosis=diagnosis,
            complaint=complaint,
            symptoms=symptoms
        )
        
        print(f"✅ Generated {len(new_recommendations)} new recommendations")
        
        return {
            "field_name": field_name,
            "value": value,
            "recommendations": new_recommendations
        }
        
    except Exception as e:
        print(f"Error regenerating field recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error regenerating recommendations: {str(e)}")

@router.post("/regenerate-clinical-recommendations")
async def regenerate_clinical_recommendations(request: Dict[str, Any]):
    """
    Regenerate clinical logic recommendations for medical coherence issues
    """
    try:
        diagnosis = request.get("diagnosis", "")
        complaint = request.get("complaint", "")
        symptoms = request.get("symptoms", "")
        lab = request.get("lab", "")
        pharmacy = request.get("pharmacy", "")
        flagged_field = request.get("flagged_field")
        flagged_item = request.get("flagged_item")
        
        if not flagged_field or not flagged_item:
            raise HTTPException(status_code=400, detail="Missing required fields: flagged_field, flagged_item")
        
        print(f"🔄 Regenerating clinical recommendations for {flagged_field}: {flagged_item}")
        
        # Get OpenAI client
        llm_client = get_openai_client()
        if not llm_client:
            # Return mock recommendations if OpenAI not available
            mock_recommendations = [
                f"Document medical necessity for {flagged_item}",
                f"Consider alternative {flagged_field} options that align with diagnosis"
            ]
            return {
                "flagged_field": flagged_field,
                "flagged_item": flagged_item,
                "recommendations": mock_recommendations
            }
        
        # Generate fresh clinical recommendations using LLM
        regeneration_prompt = f"""
You are a senior clinical pharmacist providing alternative recommendations for a medical logic inconsistency.

CLINICAL CONTEXT:
- Diagnosis: {diagnosis}
- Chief Complaint: {complaint}
- Symptoms: {symptoms}
- Lab Tests: {lab}
- Prescribed Medication: {pharmacy}

IDENTIFIED ISSUE:
- Flagged Field: {flagged_field}
- Problematic Item: {flagged_item}

TASK:
Generate 2 NEW alternative recommendations to resolve this clinical inconsistency. 
Focus on practical, actionable steps that would improve the medical appropriateness.

EXAMPLE OUTPUT FORMAT:
- [Alternative recommendation 1]
- [Alternative recommendation 2]

Provide ONLY the recommendations, one per line, starting with "- ".
"""
        
        try:
            response = llm_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": regeneration_prompt}],
                temperature=0.3  # Slight randomness for variety
            )
            
            clinical_result = response.choices[0].message.content.strip()
            
            # Parse recommendations
            recommendations = []
            for line in clinical_result.split('\n'):
                line = line.strip()
                if line.startswith('- '):
                    rec = line.replace('- ', '').strip()
                    if rec:
                        recommendations.append(rec)
            
            # Ensure we have at least some recommendations
            if not recommendations:
                recommendations = [
                    f"Document medical necessity for {flagged_item}",
                    f"Consider alternative {flagged_field} options that align with diagnosis"
                ]
            
            print(f"✅ Generated {len(recommendations)} new clinical recommendations")
            
            return {
                "flagged_field": flagged_field,
                "flagged_item": flagged_item,
                "recommendations": recommendations
            }
            
        except Exception as llm_error:
            print(f"LLM error, using fallback: {llm_error}")
            # Fallback recommendations
            fallback_recommendations = [
                f"Document medical necessity for {flagged_item}",
                f"Consider alternative {flagged_field} options that align with diagnosis"
            ]
            return {
                "flagged_field": flagged_field,
                "flagged_item": flagged_item,
                "recommendations": fallback_recommendations
            }
        
    except Exception as e:
        print(f"Error regenerating clinical recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error regenerating clinical recommendations: {str(e)}")

@router.post("/reset-system")
async def reset_system_endpoint():
    """
    Reset system to force re-check of API availability and clear mock mode
    """
    try:
        # Reset the system
        reset_system()
        
        # Check if API is now available
        llm_client = get_openai_client()
        
        # Get current status
        mock_mode = is_mock_mode()
        api_available = llm_client is not None
        
        return {
            "message": "System reset completed",
            "mock_mode": mock_mode,
            "api_available": api_available,
            "status": "success"
        }
    except Exception as e:
        print(f"Error resetting system: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error resetting system: {str(e)}")

@router.get("/system-status")
async def get_system_status():
    """
    Get current system status including mock mode and API availability
    """
    try:
        mock_mode = is_mock_mode()
        llm_client = get_openai_client()
        api_available = llm_client is not None
        
        return {
            "mock_mode": mock_mode,
            "api_available": api_available,
            "openai_key_set": bool(os.getenv("OPENAI_API_KEY")),
            "status": "ok"
        }
    except Exception as e:
        return {
            "mock_mode": True,
            "api_available": False,
            "error": str(e),
            "status": "error"
        }

@router.post("/verify-csv", response_model=BatchResponse)
async def verify_csv_cases(file: UploadFile = File(...)):
    """
    Process a CSV or Excel file with multiple insurance cases
    """
    filename = file.filename.lower()
    if not (filename.endswith('.csv') or filename.endswith('.xlsx') or filename.endswith('.xls')):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are accepted")
    
    try:
        # Read file content
        contents = await file.read()
        
        if filename.endswith('.csv'):
            # Read CSV
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        else:
            # Read Excel
            df = pd.read_excel(io.BytesIO(contents))
        
        print(f"Received file with {len(df)} rows and columns: {df.columns.tolist()}")
        
        # Map CSV columns to expected fields - Updated for user's exact format
        field_mapping = {
            # User's exact column names
            'chief_complaints': 'complaint',
            'symptoms': 'symptoms', 
            'diagnosis_description': 'diagnosis',
            'service_detail': 'lab',  # Lab details are in service_detail
            'payer_product_category_name': 'pharmacy',  # Pharmacy details are in payer_product_category_name
            
            # Alternative column names (fallback)
            'chief_complaint': 'complaint',
            'complaints': 'complaint',
            'symptom': 'symptoms',
            'diagnosis': 'diagnosis',
            'diagnosis_code': 'diagnosis',
            'lab': 'lab',
            'lab_test': 'lab',
            'pharmacy': 'pharmacy',
            'medication': 'pharmacy',
            'drug': 'pharmacy'
        }
        
        # Rename columns according to mapping
        df = df.rename(columns={k: v for k, v in field_mapping.items() if k in df.columns})
        
        print(f"After mapping, columns are: {df.columns.tolist()}")
        
        # Ensure required columns exist
        required_columns = ['complaint', 'symptoms', 'diagnosis', 'lab', 'pharmacy']
        for col in required_columns:
            if col not in df.columns:
                df[col] = ''
        
        print(f"Final columns: {df.columns.tolist()}")
        print(f"Sample data preview:")
        print(df[['complaint', 'symptoms', 'diagnosis', 'lab', 'pharmacy']].head().to_string())
        
        # Process each row
        results = []
        for idx, row in df.iterrows():
            try:
                # Generate a case ID if not present
                case_id = row.get('id', row.get('case_id', idx + 1))
                
                # Log processing
                print(f"Processing case {case_id}")
                
                result = verify_combined_case(
                    complaint=str(row.get('complaint', '')),
                    symptoms=str(row.get('symptoms', '')),
                    diagnosis=str(row.get('diagnosis', '')),
                    lab=str(row.get('lab', '')),
                    pharmacy=str(row.get('pharmacy', ''))
                )
                
                results.append({
                    'case_id': case_id,
                    'result': result
                })
                
                # Log result
                print(f"Case {case_id}: {result.final_decision} with probability {result.approval_probability}%")
                
            except Exception as e:
                print(f"Error processing case {case_id}: {str(e)}")
                results.append({
                    'case_id': case_id,
                    'error': str(e)
                })
        
        print(f"Completed processing {len(results)} cases")
        return {"results": results, "total_processed": len(results)}
    
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
