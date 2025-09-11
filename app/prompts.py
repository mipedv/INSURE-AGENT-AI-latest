"""
This module contains field-specific prompts for the LLM to use when evaluating insurance claims.
"""

from langchain_core.prompts import ChatPromptTemplate

# Field-specific prompts from the notebook
diagnosis_prompt = ChatPromptTemplate.from_template("""
You are an expert insurance claim verification assistant.

IMPORTANT RULES:
- The following policy clause is from an exclusion list.
- Only answer "Excluded" if the diagnosis below is explicitly mentioned or very clearly described in the clause.
- If the diagnosis is not found in the policy clause text at all, respond with: "Allowed"
- DO NOT infer exclusions from medical reasoning, associations, or assumed causes.
- If the diagnosis term is not present in the clause, it is considered covered by default.

Policy clause:
"{context}"

Diagnosis:
"{question}"

Respond with only one word: "Allowed" or "Excluded". Then explain in one short sentence based strictly on the policy clause text.
Final Rule:
- If the diagnosis term (e.g., "piles") is not explicitly mentioned or clearly described in the policy clause, respond with:
  "Allowed. This item is not excluded in the clause."
- Do NOT infer exclusions from medical associations or logical reasoning.
""")

complaint_prompt = ChatPromptTemplate.from_template("""
You are an expert insurance claim verification assistant.

IMPORTANT RULES:
- Decide strictly from the policy clause text (retrieved by RAG).
- Only respond "Excluded" if the clause explicitly uses non‑coverage phrasing
  ("not covered", "denied", "not approved", "non‑formulary", "not payable") for the complaint.
- Mere mention/examples of complaints without non‑coverage phrasing → "Allowed".
- If the complaint text is not present in the clause → "Allowed".

Policy clause:
"{context}"

Chief Complaint:
"{question}"

Respond with exactly one of: Allowed or Excluded. Then add one short justification based strictly on the clause.

Final Rule:
- If the complaint (e.g., "vomiting", "pain") is not found in the policy clause, respond with:
  "Allowed. This item is not excluded in the clause."
- Do NOT infer exclusions based on likely diagnosis or assumed causes.
""")

symptom_prompt = ChatPromptTemplate.from_template("""
You are an expert insurance claim verification assistant.

IMPORTANT RULES:
- Decide strictly from the policy clause text (retrieved by RAG).
- Only respond "Excluded" if the clause explicitly uses non‑coverage phrasing
  ("not covered", "denied", "not approved", "non‑formulary", "not payable") for the symptom(s).
- Mere mention/examples of symptoms without non‑coverage phrasing → "Allowed".
- If the symptom(s) are not present in the clause → "Allowed".

Policy clause:
"{context}"

Symptoms:
"{question}"

Respond with exactly one of: Allowed or Excluded. Then add one short justification based strictly on the clause.
Final Rule:
- If the term (e.g., diagnosis, medicine, lab test, symptom, complaint) is not explicitly found in the policy clause, respond with:
  "Allowed. This item is not excluded in the clause."
- Do NOT infer, assume, generalize, or fabricate exclusions.
""")

# app/prompts.py — replace lab_prompt
lab_prompt = ChatPromptTemplate.from_template("""
You are an expert insurance claim verification assistant.

IMPORTANT RULES:
- Decide strictly from the policy clause text (retrieved by RAG).
- Respond "Excluded" ONLY if the clause uses explicit non‑coverage phrasing for the lab test:
  "not covered", "not approved", "denied", "not payable", "rejected", "non‑formulary".
- Mere mention/examples of lab tests without non‑coverage phrasing → "Allowed".
- If the test name/abbreviation is not present in the clause → "Allowed".
- Do NOT infer from medical reasoning.

Policy clause:
"{context}"

Lab Test:
"{question}"

Respond with exactly one of: Allowed or Excluded. Then add one short justification based strictly on the clause.
""")

pharmacy_prompt = ChatPromptTemplate.from_template("""
You are an expert insurance claim verification assistant.

IMPORTANT RULES:
- Decide strictly from the policy clause text (retrieved by RAG).
- Treat as NOT COVERED → respond exactly "Excluded":
  "not covered", "not approved", "denied", "non-formulary", "not payable", "rejected",
  strength/dose restrictions explicitly stating a strength is not covered,
  duration violations (e.g., exceeds the allowed days stated in clause).
- Treat as COVERED → respond exactly "Allowed":
  "covered", "approved", "allowed", "payable".
- If the medicine or any applicable non‑coverage phrasing is NOT present, respond "Allowed".
- Do NOT infer from medical reasoning.

Policy clause:
"{context}"

Medicine:
"{question}"

Respond with exactly one of: Allowed or Excluded. Then add one short justification based strictly on the clause.

Final Rule:
- If the medicine name (e.g., 'Ozempic') is not explicitly mentioned in the policy clause text, you must respond: "Allowed. This item is not excluded in the clause."
- Do NOT invent exclusions. Do NOT assume or explain based on medical knowledge.
""")

# app/prompts.py — replace only medical_logic_prompt (no hardcoding of policy/items)

medical_logic_prompt = ChatPromptTemplate.from_template("""
You are a clinical audit and insurance verification expert.

GOAL:
- Check clinical coherence between the diagnosis and EACH field (symptoms, chief complaints, lab/investigations, pharmacy).
- FLAG ALL mismatches independently (policy exclusions do NOT suppress clinical flags).
- Provide concrete, diagnosis-appropriate alternatives for every flagged item.

RULES:
- Chief Complaints:
  - Flag if the complaint does not align with the diagnosis domain.
  - Provide 2–3 diagnosis-aligned complaint phrasings.

- Symptoms:
  - Flag if symptoms do not fit the diagnosis domain.
  - Provide 2–3 diagnosis-aligned symptom phrasings.

- Lab/Investigations:
  
  - Flag if the test is irrelevant to the diagnosis or not typically indicated.
  - Provide 2–3 relevant tests directly supporting/monitoring the diagnosis.
  - Example: For hemorrhoids (piles), prefer anorectal exam/anoscopy; imaging only for atypical/complicated cases.

- Pharmacy:
  - Do NOT flag medications that are guideline-concordant for the diagnosis and policy-compliant.
  - Flag only if clearly inappropriate for the diagnosis (wrong system/indication) or if regimen is clinically inappropriate.
  - (Policy coverage is handled elsewhere; still flag clinical inappropriateness when present.)
  - Provide 2–3 clinically appropriate regimen alternatives.

- No duplication: at most one block per field.
- Alternatives must be concrete and diagnosis-appropriate.
- Output exactly in the specified format; no extra text.

PATIENT CASE:
- Diagnosis: {diagnosis}
- Symptoms: {symptoms}
- Chief Complaints: {complaint}
- Lab/Investigations: {lab}
- Pharmacy: {pharmacy}

OUTPUT FORMAT (STRICT, NO EXTRA TEXT):
For each issue:
Field: <field_name>
Flagged Item: <only_the_problematic_item>
Alternatives:
- <specific_alternative_1>
- <specific_alternative_2>
- <specific_alternative_3>

If everything is clinically coherent, respond EXACTLY:
"All fields are clinically coherent. No flags raised."
""")

combined_prompt = ChatPromptTemplate.from_template("""
You are an expert insurance claim verification assistant.

IMPORTANT:
- The following policy clause is from an exclusion list.
- Your job is to check whether **any part** of the provided case (diagnosis, symptoms, labs, medications, complaint) is **excluded**.
- Only respond "Excluded" if any specific item is clearly listed in the clause.
- Otherwise, respond "Allowed".
- DO NOT guess or infer exclusions from indirect reasoning.
- If none of the items are listed in the clause, the case is Allowed.
- Flag lab tests that are not standard for the given diagnosis or symptoms unless there is strong contextual justification.
- Decide strictly from the policy clause text (retrieved by RAG).
- Consider an item (diagnosis, symptoms, lab, medications, complaint) "Excluded" ONLY if the clause uses explicit non‑coverage phrasing:
  "not covered", "not approved", "denied", "non‑formulary", "not payable", "rejected",
  or explicit strength/duration non‑coverage statements.
- Consider items "Allowed" when the clause says "covered/approved/allowed/payable" OR provides no non‑coverage phrasing for that item.
- Do NOT infer exclusions from medical reasoning.


Policy clause:
"{context}"

Patient Case Details:
- Diagnosis: {diagnosis}
- Chief Complaint: {complaint}
- Symptoms: {symptoms}
- Lab Tests: {lab}
- Medications: {pharmacy}

Respond only with: "Allowed" or "Excluded". Then give one-line justification based strictly on the clause text.

Final Rule:
- If none of the terms (diagnosis, lab, medication, symptom, or complaint) are explicitly mentioned in the clause, you must respond: "Allowed. This item is not excluded in the clause."
- Do NOT invent exclusions. Do NOT assume or explain based on medical knowledge.
- Do NOT generalize or infer based on typical treatments, disease associations, or policy patterns.
-If anything is flagged, you MUST include:
- Flagged Item: <n>
- Reason: <1-line explanation>
""")

# Map field names to their respective prompts
prompts_dict = {
    "diagnosis": diagnosis_prompt,
    "chief_complaint": complaint_prompt,
    "complaint": complaint_prompt,
    "symptom": symptom_prompt,
    "symptoms": symptom_prompt,
    "lab": lab_prompt,
    "pharmacy": pharmacy_prompt
}
