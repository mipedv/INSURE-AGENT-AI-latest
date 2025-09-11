# 🧪 InsurAgent Recommendation Enhancement - Test Plan

## 📋 **Testing Overview**
This document outlines comprehensive tests to verify that the recommendation enhancement is working correctly according to your requirements.

## 🎯 **Expected Results**
- ✅ **Excluded fields** show recommendations **inside the table**
- ✅ **Clinical logic issues** show recommendations **below the table**
- ✅ **"Generate New" buttons** work for both types
- ✅ **No breaking changes** to existing functionality

---

## 🔍 **Test Cases**

### **Test 1: Policy Exclusion Recommendations (Table Level)**

**Objective:** Verify excluded fields show recommendations in the table

**Test Data:**
```
Chief Complaint: Fatigue
Symptoms: Skin irritation
Diagnosis: Acne and skin tag removal
Lab: Blood test
Pharmacy: Vitamin D
```

**Expected Results:**
- **Symptoms**: Should be EXCLUDED with recommendations in table
- **Diagnosis**: Should be EXCLUDED with recommendations in table  
- **Pharmacy**: Should be EXCLUDED with recommendations in table
- **Table should show**: Field | Value | Status | Explanation | Source | **Recommendations**

**Specific Recommendations to Look For:**
- **Vitamin D**: "Consider calcium-rich foods", "Submit with authorization"
- **Skin conditions**: "Document medical necessity", "Consider alternative diagnosis"

### **Test 2: Clinical Logic Recommendations (Below Table)**

**Objective:** Verify clinical mismatches appear below the table

**Test Data:**
```
Chief Complaint: Stomach pain
Symptoms: Abdominal discomfort
Diagnosis: Piles (hemorrhoids)
Lab: Blood test
Pharmacy: levosiz-M (antihistamine)
```

**Expected Results:**
- **Pharmacy**: Should be flagged in "Medical Logic & Coherence Analysis" section below table
- **Reason**: Antihistamine inappropriate for hemorrhoids
- **Recommendations**: Should suggest topical treatments, anti-inflammatory options

### **Test 3: Mixed Scenario (Both Types)**

**Objective:** Verify both exclusion and clinical recommendations work together

**Test Data:**
```
Chief Complaint: Skin irritation  
Symptoms: Acne on face
Diagnosis: Cosmetic skin procedure
Lab: Routine checkup
Pharmacy: levosiz-M
```

**Expected Results:**
- **Table Level**: Cosmetic diagnosis excluded with policy recommendations
- **Below Table**: Medication mismatch flagged with clinical recommendations
- **Both sections**: Should display independently

---

## 🔄 **API Testing (Generate New Buttons)**

### **Test 4: Regenerate Field Recommendations API**

**API Endpoint:** `POST /regenerate-field-recommendations`

**Test Payload:**
```json
{
  "field_name": "pharmacy",
  "value": "Vitamin D",
  "explanation": "Excluded. Vitamin D is part of routine checkup exclusions.",
  "policy_source": "Main Policy"
}
```

**Expected Response:**
```json
{
  "field_name": "pharmacy",
  "value": "Vitamin D", 
  "recommendations": [
    "Consider recommending calcium-rich foods or sunlight exposure instead",
    "If medically necessary, submit with prior authorization and physician justification",
    "Suggest alternative vitamin supplements that are covered under the policy"
  ]
}
```

### **Test 5: Regenerate Clinical Recommendations API**

**API Endpoint:** `POST /regenerate-clinical-recommendations`

**Test Payload:**
```json
{
  "diagnosis": "Piles",
  "complaint": "Stomach pain",
  "symptoms": "Abdominal discomfort", 
  "lab": "Blood test",
  "pharmacy": "levosiz-M",
  "flagged_field": "pharmacy",
  "flagged_item": "levosiz-M"
}
```

**Expected Response:**
```json
{
  "flagged_field": "pharmacy",
  "flagged_item": "levosiz-M",
  "recommendations": [
    "Consider topical hemorrhoid treatments instead",
    "Suggest stool softeners for symptom relief", 
    "Recommend anti-inflammatory medications"
  ]
}
```

---

## 📊 **UI Display Testing**

### **Test 6: Table Structure Verification**

**Check Table Headers:**
- Field
- Submitted Details  
- Coverage Status
- Policy Evaluation
- Policy Source
- **Recommendations** (NEW COLUMN)

**Check Table Rows:**
- ✅ Allowed fields: Empty recommendations cell
- ❌ Excluded fields: Populated recommendations with checkboxes
- "Apply Selected" buttons for excluded fields

### **Test 7: Clinical Flags Section**

**Check Below-Table Section:**
- "Medical Logic & Coherence Analysis" header
- Clinical Consistency Score
- Individual flag cards with:
  - Flagged field and item
  - Recommendation checkboxes
  - "Apply Selected" button
  - **"Generate New" button** (NEW)

---

## 🚀 **Step-by-Step Testing Instructions**

### **Setup & Start Testing**

1. **Start the application:**
   ```bash
   cd /e:/project_demo
   python main.py
   ```

2. **Open browser:** `http://localhost:8000`

3. **Navigate to Demo page**

### **Single Claim Testing**

4. **Test Case 1**: Enter the policy exclusion test data
5. **Submit and verify**: 
   - Table shows recommendations for excluded fields
   - Check recommendation text matches expected patterns

6. **Test Case 2**: Enter the clinical logic test data  
7. **Submit and verify**:
   - Clinical flags appear below table
   - Medical appropriateness issues flagged

8. **Test Case 3**: Enter mixed scenario data
9. **Submit and verify**:
   - Both table and below-table recommendations present
   - No overlap or duplication

### **API Testing**

10. **Test API endpoints** using browser dev tools or Postman:
    - Test regenerate field recommendations
    - Test regenerate clinical recommendations
    - Verify response formats match expected

### **UI Interaction Testing**

11. **Click "Generate New" buttons** (if implemented in frontend)
12. **Test "Apply Selected" functionality**
13. **Verify navigation and back buttons still work**

---

## ✅ **Success Criteria**

### **✅ Core Functionality**
- [ ] Excluded fields show recommendations in table
- [ ] Clinical logic issues show recommendations below table
- [ ] Both types can coexist without conflicts
- [ ] Existing functionality unchanged

### **✅ API Functionality** 
- [ ] Field recommendation regeneration API works
- [ ] Clinical recommendation regeneration API works
- [ ] Proper error handling for invalid requests

### **✅ User Experience**
- [ ] Table layout matches screenshot reference
- [ ] Recommendations are actionable and specific
- [ ] "Generate New" buttons are accessible
- [ ] No performance degradation

### **✅ Data Accuracy**
- [ ] Policy exclusions trigger field-level recommendations
- [ ] Clinical mismatches trigger below-table recommendations  
- [ ] Recommendation content is relevant and helpful
- [ ] No duplicate recommendations between sections

---

## 🐛 **Common Issues to Watch For**

### **Potential Problems:**
- ❌ All recommendations appearing in clinical flags (old behavior)
- ❌ No recommendations appearing for excluded fields
- ❌ Frontend not displaying table recommendations
- ❌ API endpoints returning errors
- ❌ Performance issues with recommendation generation

### **Quick Fixes:**
- Check browser console for JavaScript errors
- Verify API responses in Network tab
- Ensure backend prints show proper separation
- Test with different field combinations

---

## 📝 **Test Results Template**

```
TEST RESULTS - [Date]

✅ Test 1 - Policy Exclusions: PASS/FAIL
   Notes: ____________________

✅ Test 2 - Clinical Logic: PASS/FAIL  
   Notes: ____________________

✅ Test 3 - Mixed Scenario: PASS/FAIL
   Notes: ____________________

✅ Test 4 - Field API: PASS/FAIL
   Notes: ____________________

✅ Test 5 - Clinical API: PASS/FAIL
   Notes: ____________________

✅ Test 6 - UI Display: PASS/FAIL
   Notes: ____________________

Overall Status: READY FOR DEPLOYMENT / NEEDS FIXES
Issues Found: ____________________
```

---

## 🚀 **Ready to Test!**

Run through these tests and let me know:
1. **Which tests pass/fail**
2. **Any unexpected behavior**  
3. **UI/UX feedback**
4. **Performance observations**

Once testing is complete and any issues are resolved, we can proceed with deployment! 🎯 