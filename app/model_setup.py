import os
import chromadb
from openai import OpenAI
from dotenv import load_dotenv
import numpy as np
from typing import List, Dict, Any, Optional
import random

# Load environment variables
load_dotenv()

# Global clients for reuse
_openai_client = None
_chromadb_client = None
_use_mock = False
_data_loaded = False

class MockEmbedding:
    """Mock embedding class that returns dummy 768-dimensional vectors"""
    
    @staticmethod
    def create_dummy_embedding(text: str, dimensions: int = 1536) -> List[float]:
        """Create a deterministic dummy embedding based on text hash"""
        # Use text hash to create deterministic but varied embeddings
        text_hash = hash(text) % (2**31)
        random.seed(text_hash)
        
        # Generate normalized random vector
        embedding = [random.gauss(0, 1) for _ in range(dimensions)]
        
        # Normalize the vector
        magnitude = sum(x**2 for x in embedding) ** 0.5
        if magnitude > 0:
            embedding = [x / magnitude for x in embedding]
        
        return embedding

class MockLLM:
    """Mock LLM class that returns static responses for testing"""
    
    @staticmethod
    def get_mock_response(prompt: str, field_name: str = "", value: str = "") -> str:
        """Return mock responses based on prompt content"""
        prompt_lower = prompt.lower()
        value_lower = value.lower() if value else ""
        
        # Handle clinical suggestions requests
        if "suggest" in prompt_lower and "alternatives" in prompt_lower:
            if "fatigue" in value_lower:
                return "1. Document specific fatigue symptoms and duration\n2. Request sleep study if chronic\n3. Consider alternative symptom descriptions"
            elif "vitamin d" in value_lower:
                return "1. Request physician documentation of deficiency\n2. Consider calcium-rich foods instead\n3. Sunlight exposure recommendations"
            elif "eye examination" in value_lower:
                return "1. Document medical necessity beyond vision correction\n2. Request ophthalmologist referral for medical condition\n3. Consider covered diagnostic tests"
            else:
                return "1. Document medical necessity\n2. Consider covered alternatives\n3. Consult with physician"
        
        # Mock responses for policy evaluation
        if any(term in value_lower for term in ["fatigue", "eye examination", "vitamin d", "cosmetic"]):
            if "fatigue" in value_lower:
                return "Excluded. The symptom of fatigue is explicitly stated in the policy clause."
            elif "eye examination" in value_lower:
                return "Excluded. The clause explicitly mentions sight correction tests which include 'Eye examination'."
            elif "vitamin d" in value_lower:
                return "Excluded. Vitamin D is part of routine checkup exclusions."
            else:
                return "Excluded. This item is not covered under the policy."
        
        # Mock responses for allowed items
        if any(term in value_lower for term in ["chest pain", "headache", "fever", "antibiotics", "appendicitis", "migraine"]):
            return "Allowed. This item is not excluded in the clause."
        
        # Default response based on prompt type
        if "excluded" in prompt_lower or "exclusion" in prompt_lower:
            return "Allowed. This item is not excluded in the clause."
        
        return "Allowed. This item is not excluded in the clause."

def force_mock_mode():
    """Force the system to use mock mode for testing"""
    global _use_mock
    _use_mock = True
    print("🔧 Forced mock mode enabled")

def is_mock_mode() -> bool:
    """Check if currently in mock mode"""
    return _use_mock

def reset_system():
    """Reset all cached clients and mock mode flags to force re-initialization"""
    global _openai_client, _chromadb_client, _use_mock
    _openai_client = None
    _chromadb_client = None
    _use_mock = False
    print("🔄 System reset - will re-check API availability")

def check_api_availability() -> bool:
    """Check if OpenAI API is available and has quota"""
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("No OpenAI API key found, using mock mode")
            return False
        
        # Try a simple API call to check quota with timeout
        client = OpenAI(api_key=api_key, timeout=10.0)  # 10 second timeout
        response = client.embeddings.create(
            input="test",
            model="text-embedding-ada-002"
        )
        print("✅ OpenAI API is available")
        return True
    except Exception as e:
        error_str = str(e).lower()
        if "quota" in error_str or "insufficient" in error_str or "429" in error_str:
            print(f"OpenAI API quota exceeded, switching to mock mode: {e}")
            return False
        print(f"OpenAI API error, switching to mock mode: {e}")
        return False

def get_openai_client() -> OpenAI:
    """Get or create an OpenAI client"""
    global _openai_client, _use_mock
    if _openai_client is None:
        if not check_api_availability():
            _use_mock = True
            print("⚠️  Using mock mode - OpenAI API not available")
            return None
        _openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _openai_client

def get_chromadb_client() -> chromadb.Client:
    """Initialize and return a ChromaDB client"""
    global _chromadb_client
    if _chromadb_client is None:
        try:
            # Use persistent storage for production
            _chromadb_client = chromadb.PersistentClient(path="./chroma_db")
        except Exception as e:
            print(f"Error initializing ChromaDB: {e}")
            # Fallback to in-memory client for development
            _chromadb_client = chromadb.Client()
    return _chromadb_client

def setup_collections() -> Dict[str, Any]:
    """Set up all required ChromaDB collections"""
    client = get_chromadb_client()
    collections = {}
    
    # Create collections for different policy types
    collection_names = ["main_exclusions"]
    
    for name in collection_names:
        try:
            collections[name] = client.get_or_create_collection(
                name=name,
                metadata={"hnsw:space": "cosine"}
            )
        except Exception as e:
            print(f"Error creating collection {name}: {e}")
            raise
    
    return collections

def embed_text(text: str) -> List[float]:
    """Generate embeddings for text using OpenAI or mock"""
    global _use_mock
    
    # Use mock if API is not available
    if _use_mock:
        return MockEmbedding.create_dummy_embedding(text)
    
    try:
        client = get_openai_client()
        if client is None:  # API check failed
            _use_mock = True
            return MockEmbedding.create_dummy_embedding(text)
            
        response = client.embeddings.create(
            input=text,
            model="text-embedding-ada-002"
        )
        return response.data[0].embedding
    except Exception as e:
        error_str = str(e).lower()
        if "quota" in error_str or "insufficient" in error_str or "429" in error_str:
            print(f"⚠️  OpenAI quota exceeded, switching to mock embeddings: {e}")
            _use_mock = True
            return MockEmbedding.create_dummy_embedding(text)
        
        print(f"Error generating embeddings: {e}")
        # Return mock embedding as fallback
        return MockEmbedding.create_dummy_embedding(text)

def query_llm(prompt: str, model: str = "gpt-4o-mini", system_prompt: Optional[str] = None, temperature: float = 0.0, field_name: str = "", value: str = "") -> str:
    """Query the OpenAI LLM with a prompt or return mock response"""
    global _use_mock
    
    # Use mock if API is not available
    if _use_mock:
        return MockLLM.get_mock_response(prompt, field_name, value)
    
    try:
        client = get_openai_client()
        if client is None:  # API check failed
            _use_mock = True
            return MockLLM.get_mock_response(prompt, field_name, value)
            
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            timeout=30.0  # 30 second timeout for LLM calls
        )
        return response.choices[0].message.content
    except Exception as e:
        error_str = str(e).lower()
        if "quota" in error_str or "insufficient" in error_str or "429" in error_str:
            print(f"⚠️  OpenAI quota exceeded, switching to mock LLM: {e}")
            _use_mock = True
            return MockLLM.get_mock_response(prompt, field_name, value)
        
        print(f"Error querying LLM: {e}")
        return MockLLM.get_mock_response(prompt, field_name, value)

# Vector Database Population
def load_policy_data(collections: Dict[str, Any], policy_data: Dict[str, List[str]]) -> None:
    """Load policy data into ChromaDB collections"""
    for collection_name, data_list in policy_data.items():
        if collection_name not in collections:
            print(f"Collection {collection_name} not found")
            continue
            
        collection = collections[collection_name]
        
        # Check if data already exists to prevent infinite loop
        try:
            existing_count = collection.count()
            if existing_count > 0:
                print(f"Collection {collection_name} already has {existing_count} items, skipping load")
                continue
        except:
            pass
        
        # Add new data only if collection is empty
        ids = [f"policy_{i}" for i in range(len(data_list))]
        embeddings = [embed_text(text) for text in data_list]
        metadatas = [{"source": "policy_document", "index": i} for i in range(len(data_list))]
        
        try:
            collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=data_list,
                metadatas=metadatas
            )
            print(f"Loaded {len(data_list)} items into {collection_name}")
        except Exception as e:
            print(f"Error loading data into {collection_name}: {e}")
        
    print(f"Policy data loading completed for {len(policy_data)} collections")

# Initialize collections on module import
collections = setup_collections()

# Policy data from notebook - CBRE Services and Asry policies
main_policy_text = """
FMC Insurance – Drug Formulary & Prescription Regulations (Draft)

General Principles
- The formulary defines all medications approved for coverage under FMC Health Insurance.
- Medications outside the formulary, or not compliant with the rules below, are not covered (denied).
- Prescriptions must be issued by a licensed physician and linked to a valid diagnosis.
- All prescriptions must clearly include dosage, strength, frequency, and duration.

Coverage Rules
- Generic Preference:
  - Covered: Generic equivalents where available.
  - Branded: Covered only if no equivalent generic exists or if explicitly justified by the physician.

- Dosage & Strength:
  - Only approved strengths are covered.
  - Example (Procid): Covered → Procid 20 mg; Not covered → Procid 40 mg.

- Brand Substitution:
  - Non‑formulary brands are not covered when a formulary brand exists.
  - Example: Panadol → Not covered; Adol → Covered.

Duration Limits
- Acute conditions (e.g., fever, cough, gastritis, sinusitis):
  - Maximum covered duration: 10 days.
  - Prescriptions exceeding 10 days are not covered unless medically justified and pre‑authorized.

- Chronic conditions (e.g., diabetes, hypertension, asthma):
  - Maintenance medicines: Covered up to 30 days per refill.
  - Durations beyond 30 days require prior approval.

Exclusions (Not Covered)
- Non‑medically necessary items (vitamins, supplements, tonics, herbal remedies, cosmetic products, weight‑loss medications).
- Experimental / non‑standard therapies (e.g., stem cell therapy, unregistered biologics).
- Over‑the‑counter (OTC) medications unless prescribed and included in the formulary.

Prescription Compliance
- The prescription must match the clinical diagnosis and chief complaints.
  - Example: Gastritis diagnosis should align with complaints like abdominal pain, bloating, reflux.
  - Mismatch (e.g., headache complaint with sinusitis diagnosis) → Not covered.
- All five clinical fields are mandatory for evaluation:
  - Chief Complaints, Symptoms, Diagnosis, Lab/Investigations, Pharmacy.
- Missing or incomplete documentation may lead to rejection.

Pharmacy Dispensing Rules
- Medicines must be dispensed strictly as per the physician prescription and formulary guidelines.
- Substitution to covered alternatives (e.g., Adol instead of Panadol) must be documented in the claim submission.
- Any deviation requires prior approval from the FMC insurance medical review team.

Examples (Applied Rules)
- Procid 20 mg → Covered (e.g., for gastritis/GERD/PUD).
- Procid 40 mg → Not covered.
- Panadol → Not covered.
- Adol → Covered.
- Antibiotics for acute sinusitis → Covered up to 10 days.
- Cough syrups (acute) → Covered, maximum 10 days.
- Multivitamins → Not covered unless deficiency is proven by lab.
"""

#sub_policy_text = ""

# Extract exclusion lines from policies (Policy Parsing & Chunking)
def extract_exclusion_lines(policy_text: str) -> List[str]:
    """Extract meaningful policy rules/exclusions from text."""
    extracted: List[str] = []
    for raw_line in policy_text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        # Skip separators
        if line in {"---", "—", "–––"}:
            continue
        # Keep original dash bullet behavior
        if line.startswith("-"):
            extracted.append(line.lstrip("- ").strip())
            continue
        # Capture common policy rule/exclusion phrasing
        lower = line.lower()
        if any(kw in lower for kw in [
            "not covered",
            "excluded",
            "will be denied",
            "denied unless",
            "maximum prescription coverage",
            "max 10 days",
            "require prior approval",
            "requires prior approval",
            "only approved strengths",
            "non-formulary",
            "generic equivalents",
            "brand substitution",
            "must be",
            "mandatory for evaluation"
        ]):
            extracted.append(line)
            continue
        # Keep example lines with arrows, they are explicit rules
        if "→" in line:
            extracted.append(line)
    return extracted

# Load policy data into collections only once
if not _data_loaded:
    try:
        main_exclusions = extract_exclusion_lines(main_policy_text)
        
        policy_data = {
            "main_exclusions": main_exclusions
        }
        
        load_policy_data(collections, policy_data)
        print(f"Successfully loaded {len(main_exclusions)} main exclusions")
        _data_loaded = True
        
    except Exception as e:
        print(f"Error loading policy data: {e}")
