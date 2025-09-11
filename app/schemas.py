from pydantic import BaseModel
from typing import List, Optional, Union, Dict, Any

class ClinicalFlag(BaseModel):
    flagged_field: str
    flagged_item: str
    recommendations: List[str]

class FieldBreakdown(BaseModel):
    field: str
    value: str
    result: str  # "Allowed" or "Excluded" - matches frontend expectation
    decision: str  # Same as result, for backward compatibility
    explanation: str
    policy_source: str  # Added to match frontend expectation
    probability: float  # Added to match frontend expectation
    recommendations: List[str] = []  # NEW: Table-level recommendations for excluded fields

class CaseRequest(BaseModel):
    complaint: Optional[str] = None
    symptoms: Optional[str] = None
    diagnosis: Optional[str] = None
    lab: Optional[str] = None
    pharmacy: Optional[str] = None

class CaseResponse(BaseModel):
    case_id: str = "single_case"
    final_decision: str  # "Allowed" or "Excluded"
    approval_probability: float
    field_breakdown: Dict[str, FieldBreakdown] = {}  # Updated to use FieldBreakdown model
    clinical_flags: List[ClinicalFlag] = []  # ONLY for clinical logic recommendations (below table)
    policy_sources: List[str] = []  # Policy sources used

class CaseResult(BaseModel):
    case_id: Union[int, str]
    result: Optional[CaseResponse] = None
    error: Optional[str] = None

class BatchResponse(BaseModel):
    results: List[CaseResult]
    total_processed: int
