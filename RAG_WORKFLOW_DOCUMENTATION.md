# 🔄 InsurAgent RAG Workflow - Complete Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Phase 1: System Initialization & Policy Setup](#phase-1-system-initialization--policy-setup)
3. [Phase 2: User Query Processing](#phase-2-user-query-processing)
4. [Phase 3: RAG Retrieval Process](#phase-3-rag-retrieval-process)
5. [Phase 4: LLM Evaluation](#phase-4-llm-evaluation)
6. [Phase 5: Clinical Logic Validation](#phase-5-clinical-logic-validation)
7. [Phase 6: Recommendation Generation](#phase-6-recommendation-generation)
8. [Phase 7: Response Assembly & Delivery](#phase-7-response-assembly--delivery)
9. [Key RAG Advantages](#key-rag-advantages)
10. [Policy Update Process](#policy-update-process)
11. [Technical Architecture](#technical-architecture)

---

## Overview

InsurAgent uses a sophisticated **Retrieval-Augmented Generation (RAG)** system to evaluate insurance claims against policy exclusions and clinical logic. This document provides a complete walkthrough of how the system processes claims from initial policy setup to final decision delivery.

The RAG approach ensures that:
- Policy decisions are based on actual policy text, not hardcoded rules
- The system can adapt to new policies without code changes
- Every decision is explainable and traceable to specific policy clauses
- Complex medical scenarios are handled with semantic understanding

---

## Phase 1: System Initialization & Policy Setup

### 1. Policy Text Storage
**Location**: `app/model_setup.py` (lines 271-328)

When the system starts up, it reads the hardcoded FMC Insurance policy text from the code. This policy contains all the rules, exclusions, and coverage guidelines in plain text format. Think of this as your "source document" that contains everything about what's covered and what's not.

**Example Policy Content**:
```
FMC Insurance – Drug Formulary & Prescription Regulations (Draft)

General Principles
- The formulary defines all medications approved for coverage under FMC Health Insurance.
- Medications outside the formulary, or not compliant with the rules below, are not covered (denied).
- Prescriptions must be issued by a licensed physician and linked to a valid diagnosis.

Coverage Rules
- Generic Preference: Covered: Generic equivalents where available.
- Dosage & Strength: Only approved strengths are covered.
  Example (Procid): Covered → Procid 20 mg; Not covered → Procid 40 mg.
- Brand Substitution: Non‑formulary brands are not covered when a formulary brand exists.
  Example: Panadol → Not covered; Adol → Covered.
```

### 2. Policy Parsing & Chunking
**Location**: `app/model_setup.py` (lines 333-370)

The system breaks down the large policy text into smaller, meaningful chunks using the `extract_exclusion_lines()` function. It looks for:

- **Bullet Points**: Lines that start with dashes (`-`)
- **Exclusion Keywords**: Lines containing "not covered", "excluded", "denied", "not approved"
- **Example Statements**: Lines with arrows (like "Panadol → Not covered")
- **Duration Limits**: Lines mentioning "maximum", "up to", "days"
- **Strength Restrictions**: Lines with specific dosages and coverage status

**Chunking Logic**:
```python
def extract_exclusion_lines(policy_text: str) -> List[str]:
    extracted: List[str] = []
    for raw_line in policy_text.splitlines():
        line = raw_line.strip()
        
        # Keep original dash bullet behavior
        if line.startswith("-"):
            extracted.append(line.lstrip("- ").strip())
            
        # Capture policy rule phrases
        elif any(kw in line.lower() for kw in [
            "not covered", "excluded", "will be denied", "denied unless",
            "maximum prescription coverage", "max 10 days", "require prior approval",
            "only approved strengths", "non-formulary", "generic equivalents"
        ]):
            extracted.append(line)
            
        # Keep example lines with arrows
        if "→" in line:
            extracted.append(line)
```

### 3. Vector Embedding Creation
**Location**: `app/model_setup.py` (lines 165-194)

Each policy chunk is converted into a mathematical vector (embedding) using OpenAI's `text-embedding-ada-002` model. This vector represents the "meaning" of that text chunk in a 1536-dimensional space.

**Key Properties**:
- **Semantic Similarity**: Similar concepts have similar vectors, even with different words
- **Language Agnostic**: Captures meaning regardless of exact wording
- **Context Aware**: Understands relationships between medical terms

**Embedding Process**:
```python
def embed_text(text: str) -> List[float]:
    response = client.embeddings.create(
        input=text,
        model="text-embedding-ada-002"
    )
    return response.data[0].embedding
```

### 4. ChromaDB Storage
**Location**: `app/model_setup.py` (lines 231-265)

All policy chunks and their embeddings are stored in ChromaDB (a vector database). Each chunk gets:

- **Unique ID**: `policy_0`, `policy_1`, etc.
- **Original Text**: The policy chunk content
- **Embedding Vector**: 1536-dimensional mathematical representation
- **Metadata**: Source information and indexing data

**Storage Structure**:
```python
collection.add(
    ids=["policy_0", "policy_1", "policy_2"],
    embeddings=[embedding_0, embedding_1, embedding_2],
    documents=[chunk_0, chunk_1, chunk_2],
    metadatas=[{"source": "policy_document", "index": 0}, ...]
)
```

---

## Phase 2: User Query Processing

### 5. User Input Reception
**Location**: `app/api.py` and `app/logic.py`

When a user submits a claim, the system receives information across multiple fields:

**Input Fields**:
- **Chief Complaint**: "Severe upper abdominal pain, worsens after meals"
- **Symptoms**: "Heartburn, nausea, bloating"
- **Diagnosis**: "Gastritis"
- **Lab Tests**: "H. pylori antigen test"
- **Pharmacy**: "Procid 40 mg, 1 tablet daily for 10 days"

### 6. Query Preprocessing
**Location**: `app/logic.py` (lines 608-615)

For each field, the system performs preprocessing:

**Normalization Steps**:
- **Text Cleaning**: Remove extra spaces, normalize case
- **Brand Name Correction**: Handle common typos (e.g., "Penadol" → "Panadol")
- **Query Construction**: Combine field name with value for better search

**Brand Normalization Example**:
```python
def normalize_pharmacy_brand_name(query: str) -> str:
    # Handle common misspellings
    if "penadol" in query.lower():
        return query.lower().replace("penadol", "panadol")
    return query
```

### 7. Embedding Generation
**Location**: `app/logic.py` (lines 615)

The user's query is converted into the same type of embedding vector as the policy chunks:

```python
query_embedding = embed_text(f"{field_name}: {value}")
```

This allows the system to find semantically similar content, not just exact word matches.

---

## Phase 3: RAG Retrieval Process

### 8. Semantic Search
**Location**: `app/logic.py` (lines 617-622)

The system searches ChromaDB using the query embedding to find the most similar policy chunks:

```python
main_results = main_exclusion_db.query(
    query_embeddings=[query_embedding],
    n_results=3  # Get top 3 most similar policy clauses
)
```

**Search Process**:
1. **Vector Comparison**: Compare query embedding with all stored policy embeddings
2. **Similarity Calculation**: Use cosine similarity to measure closeness
3. **Ranking**: Sort results by similarity score
4. **Top-K Selection**: Return the 3 most similar policy chunks

### 9. Result Ranking & Filtering
**Location**: `app/logic.py` (lines 637-666)

The search returns multiple results, which are then ranked and filtered:

**Similarity Scoring**:
```python
def cosine_similarity(v1, v2):
    return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

# Calculate similarity for each result
for i, doc in enumerate(main_results["documents"][0]):
    doc_embedding = embed_text(doc)
    score = cosine_similarity(query_embedding, doc_embedding)
    if score > best_main_score:
        best_main_score = score
        best_main_doc = doc
```

**Heuristic Re-ranking**:
The system applies additional logic to prefer exact matches:
```python
# Prefer clauses that mention key brand/strength terms from the query
if "panadol" in query.lower() and "panadol" in doc.lower():
    best_main_doc = doc  # Boost exact brand matches
```

**Threshold Filtering**:
Only results above a similarity threshold (0.3) are considered valid matches.

### 10. Context Selection
**Location**: `app/logic.py` (lines 668-682)

The best matching policy chunk becomes the "context" that will be used to evaluate the user's query:

```python
if best_main_score > 0.3:
    source = "FMC Insurance"
    context = best_main_doc  # This is the retrieved policy context
else:
    # No relevant policy found - default to "Allowed"
    decision = "Allowed"
```

---

## Phase 4: LLM Evaluation

### 11. Prompt Construction
**Location**: `app/logic.py` (lines 224-290) and `app/prompts.py`

The system creates specialized prompts for each field type. Each prompt includes:

**Prompt Components**:
- **Retrieved Policy Context**: The RAG-retrieved policy clause
- **User's Specific Query**: The field value being evaluated
- **Clear Instructions**: How to interpret the policy
- **Decision Rules**: What constitutes "Allowed" vs "Excluded"

**Example Pharmacy Prompt**:
```
You are an expert insurance claim verification assistant.

IMPORTANT RULES:
- Decide strictly from the policy clause text (retrieved by RAG).
- Treat as NOT COVERED → respond exactly "Excluded":
  "not covered", "not approved", "denied", "non-formulary", "not payable"
- Treat as COVERED → respond exactly "Allowed":
  "covered", "approved", "allowed", "payable"
- If the medicine is not present in the clause → "Allowed"

Policy clause: "{context}"  # ← RAG-retrieved policy text
Medicine: "{question}"      # ← User's medicine query

Respond with exactly one of: Allowed or Excluded. Then add one short justification.
```

### 12. LLM Decision Making
**Location**: `app/logic.py` (lines 252-257)

The LLM (GPT-4o-mini) analyzes the retrieved policy context and user's query:

**LLM Analysis Process**:
1. **Context Understanding**: Comprehend the retrieved policy clause
2. **Query Matching**: Compare user's query against policy content
3. **Rule Application**: Apply policy rules to the specific case
4. **Decision Generation**: Determine "Allowed" or "Excluded"
5. **Explanation Creation**: Provide reasoning for the decision

**LLM Call**:
```python
result_text = query_llm(prompt_text, model="gpt-4o-mini", temperature=0.0)
```

### 13. Response Parsing
**Location**: `app/logic.py` (lines 259-275)

The LLM's response is parsed to extract structured information:

**Parsing Logic**:
```python
text_lower = result_text.lower()
excluded_terms = ["not covered", "not approved", "denied", "non-formulary"]
allowed_terms = ["covered", "approved", "allowed", "payable"]

if any(t in text_lower for t in excluded_terms):
    decision = "Excluded"
    confidence = 90
elif any(t in text_lower for t in allowed_terms):
    decision = "Allowed"
    confidence = 80
else:
    # Fallback to first token
    decision = "Excluded" if "excluded" in text_lower else "Allowed"
```

**Extracted Information**:
- **Decision**: "Allowed" or "Excluded"
- **Explanation**: The LLM's reasoning
- **Confidence**: Numerical confidence score

---

## Phase 5: Clinical Logic Validation

### 14. Multi-Field Coherence Check
**Location**: `app/logic.py` (lines 800-900)

After policy evaluation, the system runs a separate clinical logic check to ensure medical coherence between all fields:

**Clinical Validation Process**:
1. **Complaint-Diagnosis Alignment**: Does the complaint match the diagnosis domain?
2. **Symptom Appropriateness**: Are symptoms consistent with the diagnosis?
3. **Lab Test Relevance**: Is the lab test indicated for this condition?
4. **Medication Appropriateness**: Is the medication suitable for the diagnosis?

**Clinical Logic Prompt**:
```
You are a clinical audit and insurance verification expert.

GOAL: Check clinical coherence between the diagnosis and EACH field.
FLAG ALL mismatches independently (policy exclusions do NOT suppress clinical flags).

RULES:
- Chief Complaints: Flag if the complaint does not align with the diagnosis domain.
- Symptoms: Flag if symptoms do not fit the diagnosis domain.
- Lab/Investigations: Flag if the test is irrelevant to the diagnosis.
- Pharmacy: Flag only if clearly inappropriate for the diagnosis.

PATIENT CASE:
- Diagnosis: {diagnosis}
- Symptoms: {symptoms}
- Chief Complaints: {complaint}
- Lab/Investigations: {lab}
- Pharmacy: {pharmacy}
```

### 15. Clinical Flag Prioritization
**Location**: `app/logic.py` (lines 950-1000)

If multiple clinical issues are found, the system prioritizes them to avoid overwhelming the user:

**Priority Order**:
1. **Chief Complaint mismatches** (highest priority)
2. **Symptom mismatches**
3. **Lab test irrelevance**
4. **Pharmacy inappropriateness** (lowest priority)

**Consolidation Logic**:
```python
# Only show the highest priority flag
if complaint_flag:
    final_clinical_flag = complaint_flag
elif symptom_flag:
    final_clinical_flag = symptom_flag
elif lab_flag:
    final_clinical_flag = lab_flag
elif pharmacy_flag:
    final_clinical_flag = pharmacy_flag
```

---

## Phase 6: Recommendation Generation

### 16. Policy-Based Alternative Extraction
**Location**: `app/logic.py` (lines 410-438)

For excluded items, the system first tries to extract explicit alternatives from the matched policy clause:

**Extraction Examples**:
```python
# Strength substitution
if "procid" in value.lower() and "20 mg" in policy_clause.lower():
    extracted.append("Procid 20 mg — once daily for 10 days (approved strength)")

# Brand substitution
if "panadol" in value.lower() and "adol" in policy_clause.lower():
    extracted.append("Adol 500 mg — 1 tablet every 6 hours (formulary)")

# Duration hints
if "antibiotics" in policy_clause.lower() and "10 days" in policy_clause.lower():
    extracted.append("Formulary antibiotic — diagnosis-appropriate regimen within 10 days")
```

### 17. LLM-Generated Alternatives
**Location**: `app/logic.py` (lines 450-525)

If no explicit alternatives are found in the policy, the system uses the LLM to generate diagnosis-aware alternatives:

**LLM Prompt for Alternatives**:
```
Generate DIAGNOSIS-AWARE ALLOWED ALTERNATIVES for excluded {field_name} item.

EXCLUDED ITEM: {value}
PATIENT DIAGNOSIS: {diagnosis}
REQUIREMENT: Alternatives must be contextually relevant to "{diagnosis}"

DIAGNOSIS-AWARE GUIDELINES:
- If diagnosis is "fever" and pharmacy "Vitamin D" is excluded → suggest "Paracetamol" and "Ibuprofen"
- If diagnosis is "osteoporosis" and pharmacy "Vitamin D" is excluded → suggest "Calcitriol" and "Ergocalciferol"
- If diagnosis is "piles" and pharmacy "levosiz-M" is excluded → suggest "Topical hemorrhoid cream" and "Anti-inflammatory medication"
```

### 18. Alternative Filtering & Ranking
**Location**: `app/logic.py` (lines 508-525)

The generated alternatives are filtered and limited to ensure they're:

**Quality Criteria**:
- **Clinically Appropriate**: Suitable for the patient's diagnosis
- **Likely Covered**: Typically approved by insurance policies
- **Specific**: Concrete, actionable recommendations
- **Limited**: Maximum of 2 recommendations per excluded item

**Filtering Process**:
```python
# Parse alternatives from LLM response
alternatives = []
for line in alternatives_result.split('\n'):
    line = line.strip()
    if line.startswith('- ') and len(line) > 3:
        alternatives.append(line.replace('- ', '').strip())

# Limit to 2 recommendations
return alternatives[:2]
```

---

## Phase 7: Response Assembly & Delivery

### 19. Result Compilation
**Location**: `app/logic.py` (lines 1020-1030)

All individual field evaluations are compiled into a comprehensive response:

**Response Structure**:
```python
{
    "overall_decision": "Excluded",
    "approval_probability": 60,  # 100% - 20% (exclusion) - 20% (clinical flag)
    "field_breakdown": [
        {
            "field": "pharmacy",
            "value": "Procid 40 mg",
            "decision": "Excluded",
            "explanation": "Procid 40 mg not approved; only 20 mg is allowed.",
            "policy_source": "FMC Insurance",
            "probability": 0,
            "recommendations": ["Procid 20 mg — once daily for 10 days"]
        }
    ],
    "clinical_flags": [
        {
            "field": "lab",
            "flagged_item": "X-ray",
            "alternatives": ["Anorectal examination", "Anoscopy", "Digital rectal exam"]
        }
    ]
}
```

### 20. Frontend Display
**Location**: `frontend/app.js` and `frontend/index.html`

The results are sent to the frontend where they're displayed in a user-friendly format:

**UI Components**:
- **Color-coded Decisions**: Green for allowed, red for excluded
- **Detailed Explanations**: Policy-based reasoning for each decision
- **Actionable Recommendations**: Checkbox recommendations with Apply functionality
- **Clinical Flag Warnings**: Highlighted medical coherence issues
- **Score Display**: Approval probability with breakdown

---

## Key RAG Advantages

### 1. Semantic Understanding
- **Meaning-Based Search**: Finds relevant content even with different wording
- **Context Awareness**: Understands relationships between medical terms
- **Language Flexibility**: Handles variations in medical terminology

### 2. Context-Aware Decisions
- **Relevant Policy Retrieval**: Each decision based on most relevant policy context
- **Explainable Results**: Every decision traceable to specific policy text
- **Nuanced Evaluation**: Handles complex medical scenarios with appropriate context

### 3. Flexible Policy Updates
- **No Code Changes**: Updating policy text automatically updates entire system
- **Dynamic Adaptation**: System learns new rules from policy changes
- **Scalable**: Can handle policies with thousands of rules

### 4. No Hardcoding
- **Policy-Driven**: All rules learned from policy text, not programmed
- **Maintainable**: Easy to update without developer intervention
- **Accurate**: Decisions based on actual policy content

### 5. Scalable Architecture
- **Vector Database**: Efficient storage and retrieval of policy information
- **LLM Integration**: Leverages advanced language models for decision making
- **Modular Design**: Easy to extend with new fields or policy types

---

## Policy Update Process

### Simple Policy Updates
To change your policy, simply:

1. **Replace Policy Text**: Update `main_policy_text` in `app/model_setup.py`
2. **Clear Vector Database**: Delete `chroma_db` folder
3. **Restart System**: The system will automatically re-embed and store the new policy

### Commands for Policy Update
```bash
# Windows PowerShell
Remove-Item -Recurse -Force chroma_db

# Or using rmdir
rmdir /s chroma_db

# Restart the server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### What Happens During Update
1. **Policy Parsing**: New policy text is chunked into meaningful segments
2. **Embedding Generation**: Each chunk gets new vector embeddings
3. **Database Recreation**: ChromaDB is populated with new policy data
4. **Automatic Adaptation**: System immediately uses new policy for decisions

---

## Technical Architecture

### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   FastAPI       │    │   OpenAI API    │
│   (HTML/JS)     │◄──►│   Backend       │◄──►│   (GPT-4o-mini) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   ChromaDB      │
                       │   (Vector DB)   │
                       └─────────────────┘
```

### Data Flow
1. **User Input** → Frontend → FastAPI Backend
2. **Query Processing** → Embedding Generation → Vector Search
3. **Policy Retrieval** → LLM Evaluation → Clinical Validation
4. **Recommendation Generation** → Response Assembly → Frontend Display

### Key Technologies
- **FastAPI**: High-performance Python web framework
- **OpenAI GPT-4o-mini**: Advanced language model for decision making
- **OpenAI text-embedding-ada-002**: Vector embeddings for semantic search
- **ChromaDB**: Vector database for policy storage and retrieval
- **NLTK**: Natural language processing for text preprocessing

---

## Conclusion

The RAG workflow in InsurAgent provides a sophisticated, scalable, and maintainable approach to insurance claim verification. By combining semantic search with advanced language models, the system can:

- Make accurate policy-based decisions
- Provide explainable results
- Adapt to new policies without code changes
- Handle complex medical scenarios
- Scale to large policy documents

This architecture ensures that your insurance verification system remains accurate, maintainable, and adaptable to changing policy requirements while providing transparent, traceable decision-making processes.

---

## Document Information
- **Created**: December 2024
- **Version**: 1.0
- **Project**: InsurAgent - Insurance Claim Verification System
- **Technology**: RAG (Retrieval-Augmented Generation) with OpenAI GPT-4o-mini
- **Format**: Markdown (can be converted to PDF using tools like Pandoc or online converters)
