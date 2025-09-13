// InsurAgent Frontend JavaScript

// API Configuration
const API_BASE_URL = 'http://localhost:8000';  // Fixed: Backend runs on port 8000, not 8001
const VERIFY_CASE_ENDPOINT = `${API_BASE_URL}/verify-case`;
const VERIFY_CSV_ENDPOINT = `${API_BASE_URL}/verify-csv`;

// Constants for decision types
const DECISION_ALLOWED = 'Allowed';
const DECISION_EXCLUDED = 'Excluded';
const DECISION_FLAGGED = 'Flagged';

// Demo workflow state management
let demoState = {
    currentStep: 'upload', // upload, preview, batch-results, patient-details, submission
    csvData: [],
    batchResults: [],
    currentPatientIndex: null,
    processingProgress: 0
};

// DOM Elements
const sidebar = document.querySelector('.sidebar');
const menuToggle = document.querySelector('.menu-toggle');
const menuItems = document.querySelectorAll('.menu-item');
const uploadDropzone = document.getElementById('uploadDropzone');
const fileUpload = document.getElementById('fileUpload');
const alertContainer = document.getElementById('alertContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultsContainer = document.getElementById('resultsContainer');
const mainContent = document.querySelector('.main-content');
const pageContainers = document.querySelectorAll('.page-container');

// Navigation state management
let currentPage = window.location.hash.substring(1) || 'dashboard';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Simple login gate - Always show login page first
    try {
        const loginContainer = document.getElementById('loginContainer');
        const appRoot = document.querySelector('.app-container');
        const sessionAuthed = sessionStorage.getItem('insuragent_session_authed') === 'true';
        if (loginContainer && appRoot) {
            if (sessionAuthed) {
                // Already authenticated in this browser session
                loginContainer.style.display = 'none';
                appRoot.style.display = 'block';
                document.body.classList.remove('login-mode');
                // Ensure app state exists for back/forward
                window.history.replaceState({ view: 'app' }, '', window.location.href);
            } else {
                // First visit this session: show login
                loginContainer.style.display = 'block';
                appRoot.style.display = 'none';
                document.body.classList.add('login-mode');
                // Push login state for proper back behavior
                window.history.replaceState({ view: 'login' }, '', window.location.href);
            }
        }

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = (document.getElementById('loginEmail')?.value || '').trim().toLowerCase();
                const pwd = (document.getElementById('loginPassword')?.value || '').trim();
                const remember = document.getElementById('rememberMe')?.checked;
                const ok = (email === 'alshifa@gmail.com' && pwd === '123456789');
                const err = document.getElementById('loginError');
                if (ok) {
                    if (remember) localStorage.setItem('insuragent_authed', 'true');
                    // Persist within current browser session (no re-login on in-app navigation)
                    sessionStorage.setItem('insuragent_session_authed', 'true');
                    if (loginContainer && appRoot) {
                        loginContainer.style.display = 'none';
                        appRoot.style.display = 'block';
                        document.body.classList.remove('login-mode');
                        
                        // Push main app to browser history
                        window.history.pushState({ view: 'app' }, '', window.location.href);
                    }
                } else if (err) {
                    err.style.display = 'block';
                    setTimeout(() => err.style.display = 'none', 3000);
                }
            });
        }
    } catch (_) {}
    // Set initial hash if none exists
    if (!window.location.hash) {
        window.location.hash = '#dashboard';
    }
    
    // Initial page setup
    updatePageVisibility();
    updateActiveSidebarLink();
    initPageSpecificFunctionality();
    
    // Add click event listeners to all menu items
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get the page from data-page attribute
            const pageId = item.getAttribute('data-page');
            
            // Update the hash which will trigger the hashchange event
            window.location.hash = `#${pageId}`;
        });
    });

    handleNavigation();
    initializeMobileMenu();
    initializeFileUpload();
});

// Handle hash changes for navigation
window.addEventListener('hashchange', () => {
    currentPage = window.location.hash.substring(1) || 'dashboard';
    updatePageVisibility();
    updateActiveSidebarLink();
    initPageSpecificFunctionality();
});

/**
 * Update page visibility based on current hash
 */
function updatePageVisibility() {
    // Hide all page containers
    pageContainers.forEach(container => {
        container.style.display = 'none';
        container.classList.remove('active');
    });
    
    // Show current page container
    const currentContainer = document.getElementById(`${currentPage}Container`);
    if (currentContainer) {
        currentContainer.style.display = 'block';
        currentContainer.classList.add('active');
        
        // Trigger a resize event to ensure charts and other components render properly
        window.dispatchEvent(new Event('resize'));
    }
}

/**
 * Update active sidebar link based on current page
 */
function updateActiveSidebarLink() {
    menuItems.forEach(item => {
        const itemPage = item.getAttribute('data-page');
        if (itemPage === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

/**
 * Initialize page-specific functionality based on current hash
 */
function initPageSpecificFunctionality() {
    switch(currentPage) {
        case 'dashboard':
            initDashboard();
            break;
        case 'demo':
            initDemoPage();
            break;
        case 'claims':
            initClaimsPage();
            break;
        case 'pending':
            initPendingPage();
            break;
        case 'finance':
            initFinancePage();
            break;
        case 'users':
            initUsersPage();
            break;
        case 'settings':
            initSettingsPage();
            break;
    }
}

/**
 * Initialize Dashboard functionality
 */
function initDashboard() {
    // Add any dashboard-specific initialization here
}

/**
 * Initialize Claims page functionality
 */
function initClaimsPage() {
    // Claims page initialization
}

/**
 * Initialize Pending Reviews page functionality
 */
function initPendingPage() {
    // Pending page initialization
}

/**
 * Initialize Finance page functionality
 */
function initFinancePage() {
    // Finance page initialization
}

/**
 * Initialize Users page functionality
 */
function initUsersPage() {
    // Users page initialization
}

/**
 * Initialize Settings page functionality
 */
function initSettingsPage() {
    // Settings page initialization
}

/**
 * Initialize Demo page functionality with multi-step workflow
 */
function initDemoPage() {
    // Reset demo state when entering demo page
    resetDemoState();
    
    // Initialize upload functionality
    initializeUploadArea();
    
    // Initialize single claim verification
    initializeSingleClaimForm();
    
    // Show initial upload step
    showDemoStep('upload');
}

/**
 * Reset demo state to initial values
 */
function resetDemoState() {
    demoState = {
        currentStep: 'upload',
        csvData: [],
        batchResults: [],
        currentPatientIndex: null,
        processingProgress: 0
    };
    
    // Save state to localStorage for navigation persistence
    localStorage.setItem('demoState', JSON.stringify(demoState));
}

/**
 * Force clear all cached data and reset to fresh state
 */
function forceClearCache() {
    // Clear localStorage
    localStorage.removeItem('demoState');
    localStorage.removeItem('selectedPatient');
    
    // Clear any other cached data
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('insurAgent') || key.startsWith('demo') || key.startsWith('patient')) {
            localStorage.removeItem(key);
        }
    });
    
    // Reset demo state
    resetDemoState();
    
    // Clear any existing patient cards
    const patientsResults = document.getElementById('patientsResults');
    if (patientsResults) {
        patientsResults.innerHTML = '';
    }
    
    // Reset progress
    const progressBar = document.getElementById('batchProgressBar');
    const progressText = document.getElementById('batchProgressText');
    const progressStatus = document.getElementById('batchProgressStatus');
    
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.textContent = '0%';
    if (progressStatus) progressStatus.textContent = 'Ready to start...';
    
    // Show success message
    showSuccessToast('Cache cleared! Please re-upload your CSV file.');
    
    // Return to upload step
    showDemoStep('upload');
}

/**
 * Load demo state from localStorage
 */
function loadDemoState() {
    const saved = localStorage.getItem('demoState');
    if (saved) {
        demoState = JSON.parse(saved);
    }
}

/**
 * Save current demo state to localStorage
 */
function saveDemoState() {
    localStorage.setItem('demoState', JSON.stringify(demoState));
}

/**
 * Show specific demo step and hide others
 */
function showDemoStep(step) {
    demoState.currentStep = step;
    saveDemoState();
    
    // Hide all demo sections
    const sections = [
        'upload-methods-section',
        'config-section', 
        'dataPreviewSection',
        'progressContainer',
        'batchResultsSection',
        'patientDetailsSection',
        'submissionSection'
    ];
    
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId) || document.querySelector(`.${sectionId}`);
        if (section) {
            section.style.display = 'none';
        }
    });
    
    // Show relevant sections based on step
    switch(step) {
        case 'upload':
            showElement('upload-methods-section');
            showElement('config-section');
            break;
        case 'preview':
            showElement('dataPreviewSection');
            break;
        case 'batch-results':
            showElement('batchResultsSection');
            break;
        case 'patient-details':
            showElement('patientDetailsSection');
            break;
        case 'submission':
            showElement('submissionSection');
            break;
    }
}

/**
 * Show element by ID or class
 */
function showElement(identifier) {
    const element = document.getElementById(identifier) || document.querySelector(`.${identifier}`);
    if (element) {
        element.style.display = 'block';
    }
}

/**
 * Initialize upload area functionality
 */
function initializeUploadArea() {
    const uploadArea = document.getElementById('uploadDropzone');
    const fileInput = document.getElementById('fileUpload');

    if (!uploadArea || !fileInput) return;

    // Handle click on upload area
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });

    // Handle file input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });
}

/**
 * Initialize single claim form functionality
 */
function initializeSingleClaimForm() {
    const verifySingleBtn = document.getElementById('verifySingleBtn');
    
    if (verifySingleBtn) {
        verifySingleBtn.addEventListener('click', handleSingleClaimVerification);
    }
}

/**
 * Test API connectivity
 */
async function testAPIConnectivity() {
    try {
        const response = await fetch(API_BASE_URL + '/', {
            method: 'GET',
            mode: 'cors'
        });
        
        if (response.ok) {
            const data = await response.json();
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
}

/**
 * Handle file selection and show preview
 */
async function handleFileSelection(file) {
    showLoading(true);
    
    try {
        // Validate file
        const validation = validateFile(file);
        if (!validation.isValid) {
            showAlert(validation.message, 'error');
            return;
        }

        // Parse CSV file to show preview
        if (file.name.toLowerCase().endsWith('.csv')) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    if (results.errors.length > 0) {
                        showAlert('Error parsing CSV file: ' + results.errors[0].message, 'error');
                        return;
                    }
                    
                    // Map CSV columns to expected fields
                    const mappedData = results.data.map((row, index) => ({
                        patientName: row.patient_name || row.patientName || row.patient || row.name || `Patient #${index + 1}`,
                        claimId: row.id || row.case_id || `CASE-${index + 1}`,
                        complaint: row.chief_complaints || row.chief_complaint || row.complaints || row.complaint || '',
                        symptoms: row.symptoms || row.symptom || '',
                        diagnosis: row.diagnosis_description || row.diagnosis_code || row.diagnosis || '',
                        lab: row.service_detail || row.lab_test || row.lab || '',
                        pharmacy: row.payer_product_category_name || row.medication || row.drug || row.pharmacy || ''
                    }));
                    
                    // Store CSV data
                    demoState.csvData = mappedData;
                    
                    // Show preview
                    showCSVPreview(mappedData, file.name);
                    showDemoStep('preview');
                },
                error: function(error) {
                    showAlert('Error reading CSV file: ' + error.message, 'error');
                }
            });
        } else {
            // For Excel files, we'll need to send to backend for parsing and then show preview
            showAlert('Excel file preview is not yet implemented. CSV files only for now.', 'error');
        }
        
    } catch (error) {
        showAlert('Error processing file: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Show CSV preview before processing
 */
function showCSVPreview(data, filename) {
    const previewTitle = document.getElementById('previewTitle');
    const previewTableBody = document.getElementById('previewTableBody');
    
    if (previewTitle) {
        previewTitle.textContent = `Patients Data Preview (${data.length} patients)`;
    }
    
    if (previewTableBody) {
        previewTableBody.innerHTML = '';
        
        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${row.patientName || `Patient #${index + 1}`}</td>
                <td>${row.complaint || '-'}</td>
                <td>${row.symptoms || '-'}</td>
                <td>${row.diagnosis || '-'}</td>
                <td>${row.lab || '-'}</td>
                <td>${row.pharmacy || '-'}</td>
            `;
            previewTableBody.appendChild(tr);
        });
    }
    
    // Add event listener for verify batch button
    const verifyBatchBtn = document.getElementById('verifyBatchBtn');
    if (verifyBatchBtn) {
        verifyBatchBtn.onclick = () => processBatchVerification();
    }
    
    // Add event listener for back button
    const backToUpload = document.getElementById('backToUpload');
    if (backToUpload) {
        backToUpload.onclick = () => showDemoStep('upload');
    }
}

/**
 * Process batch verification with progress indication
 */
async function processBatchVerification() {
    try {
        showLoading(true);
        showDemoStep('batch-results');
        createBatchResultsSection();
        
        const totalCases = demoState.csvData.length;
        let completedCases = 0;
        const results = [];
        
        // Show initial progress
        updateBatchProgress(0, `Starting verification of ${totalCases} patients...`);
        
        // Process each case individually for real-time progress
        for (let i = 0; i < demoState.csvData.length; i++) {
            const patient = demoState.csvData[i];
            
            try {
                // Update progress to show current case being processed
                const currentProgress = Math.round((completedCases / totalCases) * 100);
                updateBatchProgress(
                    currentProgress, 
                    `Processing case ${completedCases + 1} of ${totalCases}... (${currentProgress}%)`
                );
                
                // Verify individual case using the existing single case endpoint
                const result = await verifyPatientCase(patient);
                
                // Validate the result to ensure it has the expected structure
                if (!result || typeof result !== 'object') {
                    throw new Error('Invalid API response: empty or malformed result');
                }
                
                // Ensure final_decision is valid
                if (!result.final_decision || !['Allowed', 'Excluded'].includes(result.final_decision)) {
                    console.warn(`Invalid final_decision "${result.final_decision}" for patient ${i + 1}, defaulting to Excluded`);
                    result.final_decision = 'Excluded';
                }
                
                // Ensure approval_probability is a valid number
                if (typeof result.approval_probability !== 'number' || isNaN(result.approval_probability)) {
                    console.warn(`Invalid approval_probability "${result.approval_probability}" for patient ${i + 1}, defaulting to 0`);
                    result.approval_probability = 0;
                }
                
                // Store result with case ID
                results.push({
                    case_id: i + 1,
                    result: result
                });
                
                // Increment completed cases
                completedCases++;
                
                // Update progress with completion
                const newProgress = Math.round((completedCases / totalCases) * 100);
                updateBatchProgress(
                    newProgress, 
                    `Completed case ${completedCases} of ${totalCases}... (${newProgress}%)`
                );
                
                // Create the result object explicitly to avoid spread operator issues
                const cardData = {
                    final_decision: result.final_decision,
                    approval_probability: result.approval_probability,
                    field_breakdown: result.field_breakdown,
                    clinical_flags: result.clinical_flags,
                    policy_sources: result.policy_sources,
                    patientIndex: i,
                    patientName: patient.patientName || `Patient #${i + 1}`,
                    claimId: i + 1
                };
                

                
                // Add patient card immediately for visual feedback
                addPatientResultCard(cardData, i);
                
                // Add fade-in animation to the newly added card
                const newCard = document.querySelector(`[data-patient-index="${i}"]`);
                if (newCard) {
                    newCard.style.opacity = '0';
                    newCard.style.transform = 'translateY(20px)';
                    newCard.style.transition = 'all 0.4s ease';
                    setTimeout(() => {
                        newCard.style.opacity = '1';
                        newCard.style.transform = 'translateY(0)';
                    }, 50);
                }
                
                // Small delay to make progress visible and allow animations to complete
                await new Promise(resolve => setTimeout(resolve, 50));
                
            } catch (error) {
                console.error(`Error processing case ${i + 1}:`, error);
                
                // Store error result
                results.push({
                    case_id: i + 1,
                    error: error.message
                });
                
                // Add error card
                addPatientResultCard({
                    patientIndex: i,
                    patientName: patient.patientName || `Patient #${i + 1}`,
                    claimId: i + 1,
                    final_decision: 'Error',
                    approval_probability: 0,
                    error: error.message
                }, i);
                
                // Add fade-in animation to the error card
                const errorCard = document.querySelector(`[data-patient-index="${i}"]`);
                if (errorCard) {
                    errorCard.style.opacity = '0';
                    errorCard.style.transform = 'translateY(20px)';
                    errorCard.style.transition = 'all 0.4s ease';
                    setTimeout(() => {
                        errorCard.style.opacity = '1';
                        errorCard.style.transform = 'translateY(0)';
                    }, 50);
                }
                
                completedCases++;
                const newProgress = Math.round((completedCases / totalCases) * 100);
                updateBatchProgress(
                    newProgress, 
                    `Completed case ${completedCases} of ${totalCases}... (${newProgress}%)`
                );
            }
        }
        
        // Store results in demo state
        demoState.batchResults = results;
        
        // Show final completion message
        updateBatchProgress(100, `All ${totalCases} patients have been verified successfully!`);
        
    } catch (error) {
        showAlert('Error processing batch: ' + error.message, 'error');
        showDemoStep('preview');
    } finally {
        showLoading(false);
    }
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data) {
    const headers = ['complaint', 'symptoms', 'diagnosis', 'lab', 'pharmacy'];
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header] || '';
            return `"${value.replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
}

/**
 * Show batch results from API response (legacy function - kept for compatibility)
 * Note: In real-time processing, patient cards are added individually during processing
 */
function showBatchResults(results) {
    // This function is no longer needed for real-time processing
    // but kept for compatibility with any remaining legacy calls
    
    // If results are provided and no cards exist yet, add them
    const patientsResults = document.getElementById('patientsResults');
    if (patientsResults && patientsResults.children.length === 0) {
        results.forEach((item, index) => {
            if (item.error) {
                // Handle error cases
                const errorResult = {
                    patientIndex: index,
                    patientName: demoState.csvData[index]?.patientName || `Patient #${index + 1}`,
                    claimId: item.case_id,
                    final_decision: 'Error',
                    approval_probability: 0,
                    error: item.error
                };
                addPatientResultCard(errorResult, index);
            } else if (item.result) {
                // Handle successful results
                const result = {
                    ...item.result,
                    patientIndex: index,
                    patientName: demoState.csvData[index]?.patientName || `Patient #${index + 1}`,
                    claimId: item.case_id
                };
                addPatientResultCard(result, index);
            }
        });
    }
}

/**
 * Create batch results section HTML
 */
function createBatchResultsSection() {
    const demoContainer = document.getElementById('demoContainer');
    
    // Remove existing batch results section
    const existing = document.getElementById('batchResultsSection');
    if (existing) {
        existing.remove();
    }
    
    const batchResultsHTML = `
        <div id="batchResultsSection" class="batch-results-section">
            <div class="batch-header">
                <div class="batch-title">
                    <h3><i class="bi bi-clipboard-check me-2"></i>Batch Verification Results</h3>
                    <button class="btn btn-outline-secondary btn-sm" onclick="showDemoStep('preview')">
                        <i class="bi bi-arrow-left me-1"></i>Back to Preview
                    </button>
                </div>
            </div>
            
            <div class="progress-container mb-4">
                <div class="progress-header">
                    <span class="progress-label">Processing patients...</span>
                    <span class="progress-percentage" id="batchProgressText">0%</span>
                </div>
                <div class="progress">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" 
                         id="batchProgressBar" style="width: 0%"></div>
                </div>
                <div class="progress-status" id="batchProgressStatus">Starting verification process...</div>
            </div>
            
            <div class="patients-results" id="patientsResults">
                <!-- Patient cards will be added here -->
            </div>
            
            <div class="batch-completion" id="batchCompletion" style="display: none;">
                <div class="alert alert-success">
                    <i class="bi bi-check-circle me-2"></i>
                    <span id="completionMessage">All patients have been verified.</span>
                </div>
            </div>
        </div>
    `;
    
    demoContainer.insertAdjacentHTML('beforeend', batchResultsHTML);
}

/**
 * Update batch processing progress with enhanced visual feedback
 */
function updateBatchProgress(percentage, status) {
    const progressBar = document.getElementById('batchProgressBar');
    const progressText = document.getElementById('batchProgressText');
    const progressStatus = document.getElementById('batchProgressStatus');
    const progressLabel = document.querySelector('.progress-label');
    
    if (progressBar) {
        // Smooth progress bar animation
        progressBar.style.transition = 'width 0.3s ease-in-out';
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute('aria-valuenow', percentage);
        
        // Update progress bar color based on completion
        if (percentage === 100) {
            progressBar.classList.remove('progress-bar-striped', 'progress-bar-animated');
            progressBar.style.backgroundColor = '#28a745'; // Success green
        } else {
            progressBar.classList.add('progress-bar-striped', 'progress-bar-animated');
            progressBar.style.backgroundColor = '#007bff'; // Processing blue
        }
    }
    
    if (progressText) {
        progressText.textContent = `${percentage}%`;
        // Add visual emphasis for completion
        if (percentage === 100) {
            progressText.style.color = '#28a745';
            progressText.style.fontWeight = 'bold';
        }
    }
    
    if (progressStatus) {
        progressStatus.textContent = status;
        // Update status styling based on progress
        if (percentage === 100) {
            progressStatus.style.color = '#28a745';
            progressStatus.style.fontWeight = 'bold';
        } else {
            progressStatus.style.color = '#6c757d';
            progressStatus.style.fontWeight = 'normal';
        }
    }
    
    if (progressLabel) {
        // Update label based on progress
        if (percentage === 100) {
            progressLabel.textContent = 'Verification Complete!';
            progressLabel.style.color = '#28a745';
            progressLabel.style.fontWeight = 'bold';
        } else if (percentage > 0) {
            progressLabel.textContent = 'Processing patients...';
            progressLabel.style.color = '#007bff';
        } else {
            progressLabel.textContent = 'Starting verification...';
            progressLabel.style.color = '#6c757d';
        }
    }
    
    // Show completion message when done
    if (percentage === 100) {
        const completion = document.getElementById('batchCompletion');
        const progressContainer = document.querySelector('.progress-container');
        
        if (completion) {
            completion.style.display = 'block';
            // Add fade-in animation
            completion.style.opacity = '0';
            completion.style.transition = 'opacity 0.5s ease-in';
            setTimeout(() => {
                completion.style.opacity = '1';
            }, 100);
        }
        
        // Add completion styling to progress container
        if (progressContainer) {
            progressContainer.classList.add('completed');
        }
    }
}

/**
 * Add patient result card to the results section
 */
function addPatientResultCard(result, index) {
    const patientsResults = document.getElementById('patientsResults');
    if (!patientsResults) return;
    
    const actualResult = result.result || result;
    const isAllowed = actualResult.final_decision === 'Allowed';
    const isError = actualResult.final_decision === 'Error';
    const alignedScore = calculateCoherenceScore(actualResult);
    
    const cardHTML = `
        <div class="patient-card ${isAllowed ? 'allowed' : isError ? 'error' : 'excluded'}" data-patient-index="${index}" style="border-left: 4px solid ${isAllowed ? '#28a745' : isError ? '#ffc107' : '#dc3545'};">
            <div class="patient-header">
                <div class="patient-info">
                    <h5>${result.patientName}</h5>
                    <span class="claim-id">${result.claimId}</span>
                </div>
                <div class="patient-status">
                    <span class="status-badge ${isAllowed ? 'allowed' : isError ? 'error' : 'excluded'}">
                        ${actualResult.final_decision}
                    </span>
                </div>
            </div>
            
            <div class="patient-details">
                <div class="detail-row">
                    <span class="label">Complaint:</span>
                    <span class="value">${demoState.csvData[index]?.complaint || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Symptoms:</span>
                    <span class="value">${demoState.csvData[index]?.symptoms || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Diagnosis:</span>
                    <span class="value">${demoState.csvData[index]?.diagnosis || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Lab:</span>
                    <span class="value">${demoState.csvData[index]?.lab || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Pharmacy:</span>
                    <span class="value">${demoState.csvData[index]?.pharmacy || '-'}</span>
                </div>
            </div>
            
            <div class="patient-footer">
                <div class="approval-score">
                    <span class="score-label">Score:</span>
                    <span class="score-value">${isError ? '0' : alignedScore}%</span>
                </div>
                <button class="btn btn-outline-primary btn-sm view-details-btn" 
                        onclick="showPatientDetails(${index})" ${isError ? 'disabled' : ''}>
                    <i class="bi bi-eye me-1"></i>View Details
                </button>
            </div>
        </div>
    `;
    
    patientsResults.insertAdjacentHTML('beforeend', cardHTML);
}

/**
 * Show detailed patient view (Step 3: Patient Details)
 */
function showPatientDetails(patientIndex) {
    demoState.currentPatientIndex = patientIndex;
    saveDemoState();
    
    const patient = demoState.csvData[patientIndex];
    const result = demoState.batchResults[patientIndex];
    
    if (!patient || !result) {
        showAlert('Patient data not found', 'error');
        return;
    }
    
    // Store selected patient in localStorage for navigation
    localStorage.setItem('selectedPatient', JSON.stringify({
        patient: patient,
        result: result.result || result, // Handle both nested and direct result structures
        patientIndex: patientIndex
    }));
    
    // Push state for browser back button support
    window.history.pushState(
        { 
            view: 'patient-details', 
            patientIndex: patientIndex 
        }, 
        `Patient #${patientIndex + 1} Details`, 
        '#demo-details'
    );
    
    createPatientDetailsSection(patient, result, patientIndex);
    showDemoStep('patient-details');
}

/**
 * Create patient details section HTML
 */
function createPatientDetailsSection(patient, result, patientIndex) {
    const demoContainer = document.getElementById('demoContainer');
    
    // Remove existing patient details section
    const existing = document.getElementById('patientDetailsSection');
    if (existing) {
        existing.remove();
    }
    
        const patientDetailsHTML = `
        <div id="patientDetailsSection" class="patient-details-section">
            <!-- Header Section -->
            <div class="patient-details-header">
                <div class="patient-info-section">
                    <h2>Patient Name: ${patient.patientName || `Patient #${patientIndex + 1}`}</h2>
                </div>
                <button class="btn btn-primary back-to-results-btn" onclick="goBackToResults()">
                    <i class="bi bi-arrow-left me-1"></i>Back to Results
                </button>
            </div>
                
            <!-- Clinical Details Table -->
            <div class="clinical-details-container">
                <div class="clinical-table-wrapper">
                    <table class="table clinical-details-table">
                        <thead>
                            <tr>
                                <th>Clinical Fields</th>
                                <th>Submitted Details</th>
                                <th>Coverage Status</th>
                                <th>Policy Evaluation</th>
                                <th>Policy Source</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${generateEnhancedClinicalTableRows(patient, result)}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Unified Recommendations Section -->
            ${generateUnifiedRecommendations(patient, result)}
            
            <div class="submission-actions">
                <div class="row">
                    <div class="col-6">
                        <button class="btn btn-outline-secondary btn-lg w-100" onclick="generateBatchPatientReport(${patientIndex})">
                            <i class="bi bi-file-earmark-text me-2"></i>Generate Report
                        </button>
                    </div>
                    <div class="col-6">
                        <button class="btn btn-success btn-lg w-100 submit-claim-btn" onclick="submitClaimEvaluation(${patientIndex})">
                            <i class="bi bi-check-circle me-2"></i>Submit Claim Evaluation
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    demoContainer.insertAdjacentHTML('beforeend', patientDetailsHTML);
}

/**
 * Generate enhanced clinical table rows for patient details
 */
function generateEnhancedClinicalTableRows(patient, result) {
    const fields = [
        { key: 'complaint', label: 'Chief Complaints' },
        { key: 'symptoms', label: 'Symptoms' },
        { key: 'diagnosis', label: 'Diagnosis' },
        { key: 'lab', label: 'Lab' },
        { key: 'pharmacy', label: 'Pharmacy' }
    ];
    
    // Access the result data - handle both direct result and nested structure
    const actualResult = result.result || result;
    
    return fields.map((field, index) => {
        // Get the actual submitted value from patient data
        const submittedValue = patient[field.key] || '-';
        
        // Access field breakdown from the backend structure
        const fieldResult = actualResult.field_breakdown?.[field.key];
        
        let decision, explanation, policySource;
        
        if (fieldResult) {
            // Extract data from the actual backend structure
            decision = fieldResult.result || fieldResult.decision || 'Unknown';
            explanation = fieldResult.explanation || 'No evaluation available';
            policySource = fieldResult.policy_source || 'Main Policy';
        } else {
            // Use overall decision as fallback
            decision = actualResult.final_decision || 'Unknown';
            explanation = 'Field evaluated as part of overall assessment';
            policySource = 'Main Policy';
        }
        
        const isAllowed = decision === 'Allowed';
        const isExcluded = decision === 'Excluded';
        const statusClass = isAllowed ? 'allowed' : isExcluded ? 'excluded' : 'unknown';
        const statusIcon = isAllowed ? 'bi-check-circle' : isExcluded ? 'bi-x-circle' : 'bi-question-circle';
        
        return `
            <tr class="clinical-row ${statusClass}">
                <td class="clinical-field">
                    <i class="bi ${statusIcon} ${statusClass}"></i>
                    <span class="field-name">${field.label}</span>
                </td>
                <td class="submitted-details">${submittedValue}</td>
                <td class="coverage-status">
                    <span class="status-badge ${statusClass}">
                        ${decision}
                    </span>
                </td>
                <td class="policy-evaluation">${explanation}</td>
                <td class="policy-source">${policySource}</td>
            </tr>
        `;
    }).join('');
}

/**
 * Generate field-specific recommendations
 */
function generateFieldRecommendations(fieldKey, result) {
    // Debug logging
    console.log(`🔧 generateFieldRecommendations called for ${fieldKey}:`, result);
    
    // ✅ FIRST: Check for field-level policy recommendations in field_breakdown
    const fieldBreakdown = result.field_breakdown || {};
    const fieldData = fieldBreakdown[fieldKey];
    
    if (fieldData && fieldData.recommendations && fieldData.recommendations.length > 0) {
        const recommendations = fieldData.recommendations;
        console.log(`🔧 Found ${recommendations.length} field-level recommendations for ${fieldKey}:`, recommendations);
        
        return `
            <div class="recommendations-list">
                ${recommendations.map((rec, index) => `
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="rec-${fieldKey}-${index}">
                        <label class="form-check-label" for="rec-${fieldKey}-${index}">
                            ${rec}
                        </label>
                    </div>
                `).join('')}
                <div class="recommendation-buttons mt-2">
                    <button class="btn btn-outline-primary btn-sm me-2 apply-recommendation-btn" 
                            onclick="applyRecommendations('${fieldKey}', ${recommendations.length})">
                        Apply Selected
                    </button>
                    <button class="btn btn-outline-secondary btn-sm generate-new-btn" 
                            onclick="generateNewFieldRecommendations('${fieldKey}', '${fieldData.value}', '${fieldData.explanation}', '${fieldData.policy_source}')">
                        Generate New
                    </button>
                </div>
            </div>
        `;
    }
    
    // ✅ SECOND: Fallback to clinical flags for clinical logic recommendations  
    const clinicalFlags = result.clinical_flags || [];
    const fieldFlags = clinicalFlags.filter(flag => flag.flagged_field === fieldKey);
    
    if (fieldFlags.length === 0) {
        console.log(`🔧 No recommendations found for ${fieldKey} (neither field-level nor clinical flags)`);
        return '<span class="text-muted">—</span>';
    }
    
    console.log(`🔧 Found ${fieldFlags.length} clinical flag recommendations for ${fieldKey}`);
    
    return fieldFlags.map(flag => {
        const recommendations = flag.recommendations || [];
        if (recommendations.length === 0) return '';
        
        return `
            <div class="recommendations-list">
                ${recommendations.map((rec, index) => `
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="rec-${fieldKey}-${index}">
                        <label class="form-check-label" for="rec-${fieldKey}-${index}">
                            ${rec}
                        </label>
                    </div>
                `).join('')}
                <div class="recommendation-buttons mt-2">
                    <button class="btn btn-outline-primary btn-sm me-2 apply-recommendation-btn" 
                            onclick="applyRecommendations('${fieldKey}', ${recommendations.length})">
                        Apply Selected
                    </button>
                    <button class="btn btn-outline-secondary btn-sm generate-new-btn" 
                            onclick="generateNewClinicalRecommendations('${fieldKey}')">
                        Generate New
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Generate clinical flags for medical logic section
 */
function generateClinicalFlags(result) {
    const clinicalFlags = result.clinical_flags || [];
    
    if (clinicalFlags.length === 0) {
        return `
            <div class="no-flags-message">
                <p class="text-muted">No clinical flags detected for this case.</p>
            </div>
        `;
    }
    
    return clinicalFlags.map(flag => {
        // Handle both object and string structures
        let flaggedField, flaggedItem, recommendations;
        
        if (typeof flag === 'object') {
            flaggedField = flag.flagged_field || 'Unknown';
            flaggedItem = flag.flagged_item || 'Unknown';
            recommendations = flag.recommendations || [];
        } else {
            // If it's a string, parse it
            flaggedField = 'Clinical Issue';
            flaggedItem = flag;
            recommendations = [];
        }
        
        return `
            <div class="clinical-flag-card">
                <div class="flag-header">
                    <i class="bi bi-exclamation-triangle text-warning"></i>
                    <span class="flag-title">${flaggedField}: ${flaggedItem}</span>
                </div>
                <div class="flag-content">
                    <div class="recommendations-section">
                        <span class="recommendations-label">Recommendations:</span>
                        <div class="recommendations-checkboxes">
                            ${recommendations.length > 0 ? recommendations.map((rec, index) => `
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="flag-${flaggedField}-${index}">
                                    <label class="form-check-label" for="flag-${flaggedField}-${index}">
                                        ${rec}
                                    </label>
                                </div>
                            `).join('') : '<p class="text-muted">No specific recommendations available.</p>'}
                        </div>
                        ${recommendations.length > 0 ? `
                            <div class="clinical-recommendation-buttons mt-2">
                                <button class="btn btn-outline-primary btn-sm me-2 apply-btn" 
                                        onclick="applyClinicalRecommendations('${flaggedField}', ${recommendations.length})">
                                    Apply Selected
                                </button>
                                <button class="btn btn-outline-secondary btn-sm generate-new-clinical-btn" 
                                        onclick="generateNewClinicalRecommendations('${flaggedField}', '${flaggedItem}')">
                                    Generate New
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Calculate coherence score from result using the same logic as backend
 */
function calculateCoherenceScore(result) {
    // Use the approval probability directly from backend if available
    if (result.approval_probability !== undefined) {
        return Math.round(result.approval_probability);
    }
    
    // Fallback calculation matching backend logic: start at 100%, deduct 20% for exclusions and clinical flags
    let score = 100;
    
    // Check if any field is excluded (final_decision is Excluded)
    if (result.final_decision === 'Excluded') {
        score -= 20;
    }
    
    // Deduct 20% for clinical flags
    const clinicalFlags = result.clinical_flags || [];
    if (clinicalFlags.length > 0) {
        score -= 20;
    }
    
    return Math.max(0, score);
}

/**
 * Submit claim evaluation (Step 4: Final Submission)
 */
function submitClaimEvaluation(patientIndex) {
    const patient = demoState.csvData[patientIndex];
    const result = demoState.batchResults[patientIndex];
    
    // Simply show success message without any backend submission
    showSuccessToast('✅ Claim submitted successfully!');
}

/**
 * Show submission confirmation
 */
function showSubmissionConfirmation(patient, result) {
    const demoContainer = document.getElementById('demoContainer');
    
    // Remove existing submission section
    const existing = document.getElementById('submissionSection');
    if (existing) {
        existing.remove();
    }
    
    const submissionHTML = `
        <div id="submissionSection" class="submission-section">
            <div class="submission-success">
                <div class="success-icon">
                    <i class="bi bi-check-circle-fill text-success"></i>
                </div>
                <h3>Claim Successfully Submitted</h3>
                <p>The claim evaluation for <strong>${result.patientName}</strong> has been submitted successfully.</p>
                
                <div class="submission-summary">
                    <div class="summary-card">
                        <h5>Submission Summary</h5>
                        <div class="summary-details">
                            <div class="detail-item">
                                <span class="label">Patient:</span>
                                <span class="value">${result.patientName}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Claim ID:</span>
                                <span class="value">${result.claimId}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Final Decision:</span>
                                <span class="value status-${result.final_decision.toLowerCase()}">${result.final_decision}</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Approval Probability:</span>
                                <span class="value">${Math.round(result.approval_probability || 0)}%</span>
                            </div>
                            <div class="detail-item">
                                <span class="label">Submitted At:</span>
                                <span class="value">${new Date().toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="submission-actions">
                    <button class="btn btn-primary" onclick="showDemoStep('batch-results')">
                        <i class="bi bi-arrow-left me-2"></i>Back to Results
                    </button>
                    <button class="btn btn-success" onclick="resetDemoState(); showDemoStep('upload');">
                        <i class="bi bi-plus-circle me-2"></i>Review Another Patient
                    </button>
                    <button class="btn btn-outline-secondary" onclick="window.location.hash = '#dashboard'">
                        <i class="bi bi-house me-2"></i>Back to Home
                    </button>
                </div>
            </div>
        </div>
    `;
    
    demoContainer.insertAdjacentHTML('beforeend', submissionHTML);
}

/**
 * Verify individual patient case via API
 */
async function verifyPatientCase(patient) {
    try {
        console.log('Attempting to verify patient:', patient);
        console.log('API endpoint:', VERIFY_CASE_ENDPOINT);
        
        const requestBody = {
            complaint: patient.complaint || null,
            symptoms: patient.symptoms || null,
            diagnosis: patient.diagnosis || null,
            lab: patient.lab || null,
            pharmacy: patient.pharmacy || null
        };
        
        console.log('Request body:', requestBody);
        
        const response = await fetch(VERIFY_CASE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
        }

        const result = await response.json();
        
        // Log successful API response for debugging
        console.log(`API Success for patient ${patient.patientName || 'Unknown'}:`, {
            final_decision: result.final_decision,
            approval_probability: result.approval_probability,
            full_result: result
        });
        
        return result;
        
    } catch (error) {
        console.error('verifyPatientCase error details:', {
            error: error,
            message: error.message,
            stack: error.stack,
            patient: patient
        });
        
        // Check if it's a network error
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error: Unable to connect to the backend server. Make sure the backend is running on port 8000.');
        }
        
        // Re-throw the error with more context
        throw new Error(`Failed to verify patient case: ${error.message}`);
    }
}

/**
 * Handle single claim verification
 */
async function handleSingleClaimVerification() {
    const complaint = document.getElementById('complaint')?.value.trim();
    const symptoms = document.getElementById('symptoms')?.value.trim();
    const diagnosis = document.getElementById('diagnosis')?.value.trim();
    const lab = document.getElementById('lab')?.value.trim();
    const pharmacy = document.getElementById('pharmacy')?.value.trim();

    // Validate input
    if (!complaint && !symptoms && !diagnosis && !lab && !pharmacy) {
        showAlert('Please fill in at least one field', 'warning');
        return;
    }

    try {
        showLoading(true);

        const response = await fetch(VERIFY_CASE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                complaint: complaint || null,
                symptoms: symptoms || null,
                diagnosis: diagnosis || null,
                lab: lab || null,
                pharmacy: pharmacy || null
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        displaySingleClaimResult(result);

    } catch (error) {
        console.error('Verification error:', error);
        showAlert('Error verifying claim: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Display single claim result in modal with enhanced UI matching batch results
 */
function displaySingleClaimResult(result) {
    const modal = new bootstrap.Modal(document.getElementById('singleResultModal'));
    const modalContent = document.getElementById('singleResultContent');
    
    // Debug log to see the actual result structure
    console.log('Single Claim Result:', result);
    
    const isAllowed = result.final_decision === 'Allowed';
    const hasFlags = result.clinical_flags && result.clinical_flags.length > 0;
    const approvalProbability = Math.round(result.approval_probability || 0);
    
    modalContent.innerHTML = `
        <div class="single-result-content">
            <!-- Enhanced Header with Decision and Score -->
            <div class="result-header mb-4">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <div class="decision-badge ${isAllowed ? 'allowed' : 'excluded'}">
                            <i class="bi ${isAllowed ? 'bi-check-circle' : 'bi-x-circle'}"></i>
                            <strong>Decision: ${result.final_decision}</strong>
                        </div>
                    </div>
                    <div class="col-md-6 text-end">
                        <div class="approval-score">
                            <span class="score-label">📊 Score:</span>
                            <span class="score-value ${approvalProbability >= 80 ? 'high' : approvalProbability >= 50 ? 'medium' : 'low'}">
                                ${approvalProbability}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Field Analysis Section -->
            <div class="field-breakdown mb-4">
                <h5><i class="bi bi-clipboard-data me-2"></i>Field Analysis</h5>
                ${generateDetailedFieldBreakdownTable(result.field_breakdown || {})}
            </div>
            
            <!-- Unified Recommendations for Single Claim -->
            ${generateSingleClaimUnifiedRecommendations(result)}
            
            <!-- Action Buttons -->
            <div class="result-actions mt-4">
                <div class="row">
                    <div class="col-6">
                        <button class="btn btn-outline-secondary w-100" onclick="generateDetailedReport('single', window.currentSingleResult)">
                            <i class="bi bi-file-earmark-text me-2"></i>Generate Report
                        </button>
                    </div>
                    <div class="col-6">
                        <button class="btn btn-primary w-100" onclick="submitSingleClaimEvaluation()">
                            <i class="bi bi-check-square me-2"></i>Submit Claim Evaluation
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Store result for later use
    window.currentSingleResult = result;
    
    modal.show();
}

/**
 * Generate unified recommendations for single claim modal
 */
function generateSingleClaimUnifiedRecommendations(result) {
    const fieldBreakdown = result.field_breakdown || {};
    const clinicalFlags = result.clinical_flags || [];
    
    // Collect excluded field recommendations
    const excludedFields = [];
    Object.keys(fieldBreakdown).forEach(fieldKey => {
        const fieldData = fieldBreakdown[fieldKey];
        if (fieldData && 
            (fieldData.result === 'Excluded' || fieldData.decision === 'Excluded') && 
            fieldData.recommendations && 
            fieldData.recommendations.length > 0) {
            
            excludedFields.push({
                type: 'policy_exclusion',
                key: fieldKey,
                label: fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1),
                value: fieldData.value || '-',
                title: `${fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1)}: ${fieldData.value || '-'}`,
                description: fieldData.explanation || '',
                recommendations: fieldData.recommendations,
                policy_source: fieldData.policy_source || ''
            });
        }
    });
    
    // Enhanced field mapping for complete deduplication - NO DUPLICATE RECOMMENDATIONS FOR SAME FIELD
    const fieldMappings = {
        'pharmacy': ['pharmacy', 'prescribed_medication', 'medication', 'drug', 'medicine', 'med'],
        'lab': ['lab', 'laboratory', 'lab_test', 'test', 'labs'],
        'diagnosis': ['diagnosis', 'condition', 'disease', 'disorder'],
        'symptoms': ['symptoms', 'symptom', 'chief_complaint'],
        'complaint': ['complaint', 'chief_complaint', 'symptoms', 'symptom']
    };
    
    // Get all field keys and their variations that are excluded
    const excludedFieldKeys = excludedFields.map(field => field.key);
    const excludedFieldVariations = [];
    const excludedValues = [];
    
    excludedFields.forEach(field => {
        // Add the main field key
        excludedFieldVariations.push(field.key);
        
        // Add all possible variations for this field
        if (fieldMappings[field.key]) {
            excludedFieldVariations.push(...fieldMappings[field.key]);
        }
        
        // Store excluded values for cross-matching
        if (field.value && field.value !== '-') {
            excludedValues.push(field.value.toLowerCase().trim());
        }
    });
    
    // Function to check if a clinical flag relates to an already excluded field
    const isFieldAlreadyExcluded = (flaggedField, flaggedItem) => {
        if (!flaggedField && !flaggedItem) return false;
        
        // Check field name variations
        if (flaggedField) {
            const fieldLower = flaggedField.toLowerCase().trim();
            if (excludedFieldVariations.some(variant => 
                variant.toLowerCase() === fieldLower || 
                fieldLower.includes(variant.toLowerCase()) ||
                variant.toLowerCase().includes(fieldLower)
            )) {
                console.log(`🚫 SINGLE CLAIM DUPLICATE: Clinical flag field "${flaggedField}" matches excluded policy field`);
                return true;
            }
        }
        
        // Check if the flagged item (value) matches any excluded field value
        if (flaggedItem) {
            const itemLower = flaggedItem.toLowerCase().trim();
            if (excludedValues.some(excludedValue => 
                excludedValue === itemLower || 
                itemLower.includes(excludedValue) ||
                excludedValue.includes(itemLower)
            )) {
                console.log(`🚫 SINGLE CLAIM DUPLICATE: Clinical flag item "${flaggedItem}" matches excluded policy value`);
                return true;
            }
        }
        
        return false;
    };
    
    // Collect clinical logic recommendations, COMPLETELY excluding fields that already have policy exclusions
    const clinicalRecommendations = clinicalFlags
        .filter(flag => {
            const flaggedField = flag.flagged_field || '';
            const flaggedItem = flag.flagged_item || '';
            
            // Skip if this clinical flag relates to a field that already has a policy exclusion
            const isExcluded = isFieldAlreadyExcluded(flaggedField, flaggedItem);
            
            if (!isExcluded) {
                console.log(`✅ SINGLE CLAIM KEEPING: Clinical flag "${flaggedField}: ${flaggedItem}" - no policy exclusion match`);
            }
            
            return !isExcluded;
        })
        .map(flag => ({
            type: 'clinical_logic',
            key: flag.flagged_field || 'clinical',
            label: (flag.flagged_field || 'Clinical Issue').charAt(0).toUpperCase() + (flag.flagged_field || 'Clinical Issue').slice(1),
            value: flag.flagged_item || 'Unknown',
            title: `${(flag.flagged_field || 'Clinical Issue').charAt(0).toUpperCase() + (flag.flagged_field || 'Clinical Issue').slice(1)}: ${flag.flagged_item || 'Unknown'}`,
            description: 'Medical logic inconsistency detected',
            reasoning: generateClinicalReasoning(flag.flagged_field, flag.flagged_item, null, result),
            recommendations: flag.recommendations || [],
            policy_source: 'Clinical Logic'
        }));
    
    // Combine all recommendations (policy exclusions take priority, clinical duplicates filtered out)
    const allRecommendations = [...excludedFields, ...clinicalRecommendations];
    
    console.log(`📊 SINGLE CLAIM SUMMARY: ${excludedFields.length} policy exclusions + ${clinicalRecommendations.length} clinical flags = ${allRecommendations.length} total recommendations`);
    
    if (allRecommendations.length === 0) {
        return `
            <div class="unified-recommendations-section mb-4">
                <h5><i class="bi bi-lightbulb me-2"></i>Recommendations</h5>
                <div class="coherence-score-section mb-3">
                    <span class="metric-label">Clinical Consistency Score:</span>
                    <span class="score-badge coherence">${calculateCoherenceScore(result)}%</span>
                </div>
                <div class="alert alert-success">
                    <i class="bi bi-check-circle me-2"></i>
                    <strong>No Issues Found</strong> - All fields are policy-compliant and medically coherent.
                </div>
            </div>
        `;
    }
    
    // Separate policy exclusions and clinical logic recommendations
    const policyExclusions = allRecommendations.filter(item => item.type === 'policy_exclusion');
    const clinicalLogicRecommendations = allRecommendations.filter(item => item.type === 'clinical_logic');
    
    return `
        <div class="unified-recommendations-section mb-4">
            <h5><i class="bi bi-lightbulb me-2"></i>Recommendations</h5>
            <div class="coherence-score-section mb-3">
                <span class="metric-label">Clinical Consistency Score:</span>
                <span class="score-badge coherence">${calculateCoherenceScore(result)}%</span>
            </div>
            
            ${policyExclusions.length > 0 ? `
                <div class="policy-exclusions-section mb-4">
                    <h6><i class="bi bi-x-circle text-danger me-2"></i>Policy Exclusions</h6>
                    <p class="text-muted small mb-3">These recommendations address policy exclusions:</p>
                    
                    ${policyExclusions.map((item, index) => `
                        <div class="recommendation-card mb-3 ${item.type} border rounded">
                            <div class="card-header p-2">
                                <div class="recommendation-info">
                                    <h6 class="recommendation-title mb-1">
                                        <i class="bi bi-x-circle text-danger me-2"></i>
                                        ${item.title}
                                    </h6>
                                    <p class="recommendation-description text-muted small mb-1">${item.description}</p>
                                    <span class="source-badge badge bg-danger">Policy Exclusion</span>
                                </div>
                            </div>
                            
                            ${item.recommendations.length > 0 ? `
                                <div class="card-body p-3">
                                    <div class="recommendations-list">
                                        ${item.recommendations.map((rec, recIndex) => `
                                            <div class="form-check recommendation-item">
                                                <input class="form-check-input" type="checkbox" 
                                                       id="single-unified-${item.key}-rec-${recIndex}"
                                                       data-field="${item.key}" 
                                                       data-recommendation="${rec}"
                                                       data-type="${item.type}">
                                                <label class="form-check-label small" for="single-unified-${item.key}-rec-${recIndex}">
                                                    ${rec}
                                                </label>
                                            </div>
                                        `).join('')}
                                    </div>
                                    
                                    <div class="recommendation-buttons mt-2">
                                        <button class="btn btn-outline-primary btn-sm me-2" 
                                                onclick="applySingleClaimUnifiedRecommendations('${item.key}', '${item.type}', ${item.recommendations.length})">
                                            <i class="bi bi-check-square me-1"></i>Apply Selected
                                        </button>
                                        <button class="btn btn-outline-secondary btn-sm" 
                                                onclick="generateNewFieldRecommendations('${item.key}', '${item.value}', '${item.description}', '${item.policy_source}')">
                                            <i class="bi bi-arrow-repeat me-1"></i>Generate New
                                        </button>
                                    </div>
                                </div>
                            ` : `
                                <div class="card-body p-3">
                                    <p class="text-muted small">No specific recommendations available for this exclusion.</p>
                                </div>
                            `}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            ${clinicalLogicRecommendations.length > 0 ? `
                <div class="clinical-logic-section mb-4">
                    <h6><i class="bi bi-exclamation-triangle text-warning me-2"></i>Medical Logic & Coherence Analysis</h6>
                    <p class="text-muted small mb-3">These recommendations address clinical coherence issues:</p>
                    
                    ${clinicalLogicRecommendations.map((item, index) => `
                        <div class="recommendation-card mb-3 ${item.type} border rounded">
                            <div class="card-header p-2">
                                <div class="recommendation-info">
                                    <h6 class="recommendation-title mb-1">
                                        <i class="bi bi-exclamation-triangle text-warning me-2"></i>
                                        ${item.title}
                                    </h6>
                                    <p class="recommendation-description text-muted small mb-1">${item.description}</p>
                                    <p class="clinical-reasoning text-info small mb-1" style="font-style: italic;">${item.reasoning || ''}</p>
                                    <span class="source-badge badge bg-warning">Clinical Logic</span>
                                </div>
                            </div>
                            
                            ${item.recommendations.length > 0 ? `
                                <div class="card-body p-3">
                                    <div class="recommendations-list">
                                        ${item.recommendations.map((rec, recIndex) => `
                                            <div class="form-check recommendation-item">
                                                <input class="form-check-input" type="checkbox" 
                                                       id="single-unified-${item.key}-rec-${recIndex}"
                                                       data-field="${item.key}" 
                                                       data-recommendation="${rec}"
                                                       data-type="${item.type}">
                                                <label class="form-check-label small" for="single-unified-${item.key}-rec-${recIndex}">
                                                    ${rec}
                                                </label>
                                            </div>
                                        `).join('')}
                                    </div>
                                    
                                    <div class="recommendation-buttons mt-2">
                                        <button class="btn btn-outline-primary btn-sm me-2" 
                                                onclick="applySingleClaimUnifiedRecommendations('${item.key}', '${item.type}', ${item.recommendations.length})">
                                            <i class="bi bi-check-square me-1"></i>Apply Selected
                                        </button>
                                        <button class="btn btn-outline-secondary btn-sm" 
                                                onclick="generateNewClinicalRecommendations('${item.key}', '${item.value}')">
                                            <i class="bi bi-arrow-repeat me-1"></i>Generate New
                                        </button>
                                    </div>
                                </div>
                            ` : `
                                <div class="card-body p-3">
                                    <p class="text-muted small">No specific recommendations available for this clinical issue.</p>
                                </div>
                            `}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Apply unified recommendations for single claim modal
 */
function applySingleClaimUnifiedRecommendations(fieldKey, type, totalRecommendations) {
    const selectedRecommendations = [];
    
    // Collect selected recommendations
    for (let i = 0; i < totalRecommendations; i++) {
        const checkbox = document.getElementById(`single-unified-${fieldKey}-rec-${i}`);
        if (checkbox && checkbox.checked) {
            selectedRecommendations.push(checkbox.dataset.recommendation);
        }
    }
    
    if (selectedRecommendations.length === 0) {
        showAlert('Please select at least one recommendation to apply', 'warning');
        return;
    }
    
    // Apply based on type
    if (type === 'policy_exclusion') {
        updateSingleClaimFieldToAllowed(fieldKey, selectedRecommendations);
    } else if (type === 'clinical_logic') {
        updateSingleClaimClinicalLogicToAllowed(fieldKey, selectedRecommendations);
    }
    
    showSuccessToast(`✅ Applied ${selectedRecommendations.length} recommendation(s) for ${fieldKey}`);
}

/**
 * Update single claim clinical logic field to "Allowed" status when recommendation is applied
 */
function updateSingleClaimClinicalLogicToAllowed(fieldKey, appliedRecommendations) {
    // Find the field row in the single claim table
    const fieldRows = document.querySelectorAll('.field-breakdown-row');
    
    fieldRows.forEach(row => {
        const fieldNameElement = row.querySelector('.field-name');
        if (fieldNameElement) {
            // Map field keys to labels for matching (case-insensitive)
            const fieldLabels = {
                'complaint': 'Chief Complaints',
                'symptoms': 'Symptoms',
                'diagnosis': 'Diagnosis',
                'lab': 'Lab',
                'pharmacy': 'Pharmacy'
            };
            
            // Check if this row matches the field key (case-insensitive)
            const fieldLabel = fieldLabels[fieldKey.toLowerCase()];
            if (fieldLabel && fieldNameElement.textContent.includes(fieldLabel)) {
                // Update the row classes
                row.classList.remove('excluded', 'unknown');
                row.classList.add('allowed');
                
                // Update the status badge
                const statusBadge = row.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.className = 'status-badge allowed';
                    statusBadge.textContent = 'Allowed';
                }
                
                // Update the field value with the applied recommendation
                const fieldValueElement = row.querySelector('.field-value');
                if (fieldValueElement && appliedRecommendations.length > 0) {
                    // Add green highlight and check badge
                    fieldValueElement.innerHTML = `
                        <div class="applied-recommendation-value">
                            <i class="bi bi-check-circle text-success me-1"></i>
                            <strong>${appliedRecommendations[0]}</strong>
                            ${appliedRecommendations.length > 1 ? `<small class="text-muted"> (+${appliedRecommendations.length - 1} more)</small>` : ''}
                            <div class="applied-badge">
                                <small class="text-success">✓ Applied</small>
                            </div>
                        </div>
                    `;
                    
                    // Add green highlight
                    fieldValueElement.style.backgroundColor = '#d4edda';
                    fieldValueElement.style.borderLeft = '4px solid #28a745';
                    fieldValueElement.style.padding = '8px';
                }
                
                // Update the evaluation text
                const evaluationElement = row.querySelector('.field-evaluation');
                if (evaluationElement) {
                    evaluationElement.innerHTML = `
                        <div class="text-success">
                            <i class="bi bi-check-circle me-1"></i>
                            Allowed after applying clinical logic recommendation
                        </div>
                    `;
                }
            }
        }
    });
    
    // Update overall decision if all critical issues are resolved
    updateSingleClaimOverallDecision();
}

/**
 * Generate enhanced field breakdown table matching batch results style
 */
function generateEnhancedFieldBreakdownTable(fieldBreakdown) {
    const fields = Object.keys(fieldBreakdown);
    
    // Debug logging (comment out for production)
    // console.log('🔧 generateEnhancedFieldBreakdownTable called with:', fieldBreakdown);
    // console.log('🔧 Fields found:', fields);
    
    if (fields.length === 0) {
        return '<p class="text-muted">No field breakdown available</p>';
    }
    
    return `
        <div class="table-responsive">
            <table class="table table-striped clinical-details-table">
                <thead class="table-dark">
                    <tr>
                        <th><i class="bi bi-tags me-1"></i>Clinical Fields</th>
                        <th><i class="bi bi-file-text me-1"></i>Submitted Details</th>
                        <th><i class="bi bi-shield-check me-1"></i>Coverage Status</th>
                        <th><i class="bi bi-info-circle me-1"></i>Policy Evaluation</th>
                        <th><i class="bi bi-bookmarks me-1"></i>Policy Source</th>
                    </tr>
                </thead>
                <tbody>
                    ${fields.map(field => {
                        const data = fieldBreakdown[field];
                        const isAllowed = (data.result || data.decision) === 'Allowed';
                        const statusIcon = isAllowed ? 'bi-check-circle' : 'bi-x-circle';
                        const statusClass = isAllowed ? 'allowed' : 'excluded';
                        const result = data.result || data.decision || 'Unknown';
                        
                        return `
                            <tr class="field-row clinical-row ${statusClass}">
                                <td class="field-name clinical-field">
                                    <div class="field-icon">
                                        <i class="bi ${statusIcon} ${statusClass}"></i>
                                    </div>
                                    <strong class="field-title">${field.charAt(0).toUpperCase() + field.slice(1)}</strong>
                                </td>
                                <td class="field-value submitted-details">
                                    <span class="value-text">${data.value || '-'}</span>
                                </td>
                                <td class="field-result coverage-status">
                                    <span class="status-badge ${statusClass}">
                                        <i class="bi ${statusIcon} me-1"></i>
                                        ${result}
                                    </span>
                                </td>
                                <td class="field-explanation policy-evaluation">
                                    <small class="explanation-text">${data.explanation || 'No evaluation available'}</small>
                                </td>
                                <td class="field-source policy-source">
                                    <span class="source-badge">${data.policy_source || 'N/A'}</span>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        <!-- Excluded Field Recommendations for Single Claim -->
        ${generateSingleClaimExcludedRecommendations(fieldBreakdown)}
    `;
}

/**
 * Generate detailed field breakdown table for single result without excluded recommendations
 */
function generateDetailedFieldBreakdownTable(fieldBreakdown) {
    const fields = Object.keys(fieldBreakdown);
    
    if (fields.length === 0) {
        return '<p class="text-muted">No field breakdown available</p>';
    }
    
    return `
        <div class="table-responsive">
            <table class="table table-striped clinical-details-table">
                <thead class="table-dark">
                    <tr>
                        <th><i class="bi bi-tags me-1"></i>Clinical Fields</th>
                        <th><i class="bi bi-file-text me-1"></i>Submitted Details</th>
                        <th><i class="bi bi-shield-check me-1"></i>Coverage Status</th>
                        <th><i class="bi bi-info-circle me-1"></i>Policy Evaluation</th>
                        <th><i class="bi bi-bookmarks me-1"></i>Policy Source</th>
                    </tr>
                </thead>
                <tbody>
                    ${fields.map(field => {
                        const data = fieldBreakdown[field];
                        const isAllowed = (data.result || data.decision) === 'Allowed';
                        const statusIcon = isAllowed ? 'bi-check-circle' : 'bi-x-circle';
                        const statusClass = isAllowed ? 'allowed' : 'excluded';
                        const result = data.result || data.decision || 'Unknown';
                        
                        return `
                            <tr class="field-row clinical-row ${statusClass}">
                                <td class="field-name clinical-field">
                                    <div class="field-icon">
                                        <i class="bi ${statusIcon} ${statusClass}"></i>
                                    </div>
                                    <strong class="field-title">${field.charAt(0).toUpperCase() + field.slice(1)}</strong>
                                </td>
                                <td class="field-value submitted-details">
                                    <span class="value-text">${data.value || '-'}</span>
                                </td>
                                <td class="field-result coverage-status">
                                    <span class="status-badge ${statusClass}">
                                        <i class="bi ${statusIcon} me-1"></i>
                                        ${result}
                                    </span>
                                </td>
                                <td class="field-explanation policy-evaluation">
                                    <small class="explanation-text">${data.explanation || 'No evaluation available'}</small>
                                </td>
                                <td class="field-source policy-source">
                                    <span class="source-badge">${data.policy_source || 'N/A'}</span>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Validate uploaded file
 */
function validateFile(file) {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
        return { isValid: false, message: 'Please upload a CSV or Excel file' };
    }

    if (file.size > maxSize) {
        return { isValid: false, message: 'File size must be less than 10MB' };
    }

    return { isValid: true, message: 'File is valid' };
}

/**
 * Show alert message
 */
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;

    const alertId = 'alert-' + Date.now();
    const alertHTML = `
        <div id="${alertId}" class="alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show" role="alert">
            <i class="bi bi-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    alertContainer.insertAdjacentHTML('beforeend', alertHTML);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 5000);
}

/**
 * Show success toast notification
 */
function showSuccessToast(message) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    const toastId = 'toast-' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white bg-success border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-check-circle-fill me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);

    // Show the toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 4000
    });
    toast.show();

    // Clean up after hiding
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

/**
 * Show/hide loading spinner
 */
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Go back to batch results from patient details
 */
function goBackToResults() {
    // Restore batch results view
    showDemoStep('batch-results');
    
    // Update browser history without adding a new entry
    window.history.replaceState(
        { view: 'batch-results' }, 
        'Batch Results', 
        '#demo'
    );
    
    // Scroll to the patient card that was being viewed
    const currentPatientIndex = demoState.currentPatientIndex;
    if (currentPatientIndex !== null) {
        setTimeout(() => {
            const patientCard = document.querySelector(`[data-patient-index="${currentPatientIndex}"]`);
            if (patientCard) {
                patientCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                patientCard.style.boxShadow = '0 0 10px rgba(67, 97, 238, 0.5)';
                setTimeout(() => {
                    patientCard.style.boxShadow = '';
                }, 2000);
            }
        }, 100);
    }
}

/**
 * Handle browser back button and navigation
 */
function handleNavigation() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
        if (event.state) {
            if (event.state.view === 'login') {
                // Back to login page
                const loginContainer = document.getElementById('loginContainer');
                const appRoot = document.querySelector('.app-container');
                if (loginContainer && appRoot) {
                    loginContainer.style.display = 'block';
                    appRoot.style.display = 'none';
                    document.body.classList.add('login-mode');
                }
            } else if (event.state.view === 'app') {
                // Back to main app
                const loginContainer = document.getElementById('loginContainer');
                const appRoot = document.querySelector('.app-container');
                if (loginContainer && appRoot) {
                    loginContainer.style.display = 'none';
                    appRoot.style.display = 'block';
                    document.body.classList.remove('login-mode');
                }
            } else if (event.state.view === 'patient-details' && event.state.patientIndex !== undefined) {
                // Restore patient details view
                const savedPatient = localStorage.getItem('selectedPatient');
                if (savedPatient) {
                    const patientData = JSON.parse(savedPatient);
                    createPatientDetailsSection(patientData.patient, { result: patientData.result }, patientData.patientIndex);
                    showDemoStep('patient-details');
                }
            } else if (event.state.view === 'batch-results') {
                // Restore batch results view
                showDemoStep('batch-results');
            }
        } else {
            // Default: keep current page; do not force login
            updatePageVisibility();
            updateActiveSidebarLink();
            initPageSpecificFunctionality();
        }
    });
}

function initializeMobileMenu() {
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
}

function initializeFileUpload() {
    // This is handled in initializeUploadArea() for demo page
    // Keep this function for compatibility
}

/**
 * Apply selected field recommendations
 */
function applyRecommendations(fieldKey, count) {
    const selectedRecommendations = [];
    
    for (let i = 0; i < count; i++) {
        const checkbox = document.getElementById(`rec-${fieldKey}-${i}`);
        if (checkbox && checkbox.checked) {
            selectedRecommendations.push(checkbox.nextElementSibling.textContent.trim());
        }
    }
    
    if (selectedRecommendations.length === 0) {
        showAlert('Please select at least one recommendation to apply.', 'warning');
        return;
    }
    
    // Show success message
    showSuccessToast(`✅ Applied ${selectedRecommendations.length} recommendation(s) for ${fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1)}`);
    
    // Update the UI to show applied recommendations
    updateAppliedRecommendations(fieldKey, selectedRecommendations);
    
    // Save state for persistence
    saveDemoState();
}

/**
 * Apply selected clinical recommendations
 */
function applyClinicalRecommendations(flaggedField, count) {
    const selectedRecommendations = [];
    
    for (let i = 0; i < count; i++) {
        const checkbox = document.getElementById(`flag-${flaggedField}-${i}`);
        if (checkbox && checkbox.checked) {
            selectedRecommendations.push(checkbox.nextElementSibling.textContent.trim());
        }
    }
    
    if (selectedRecommendations.length === 0) {
        showAlert('Please select at least one recommendation to apply.', 'warning');
        return;
    }
    
    // Show success message
    showSuccessToast(`✅ Applied ${selectedRecommendations.length} recommendation(s) for ${flaggedField}`);
    
    // Update the UI to show applied recommendations
    updateAppliedClinicalRecommendations(flaggedField, selectedRecommendations);
    
    // Save state for persistence
    saveDemoState();
}

/**
 * Update UI to show applied field recommendations
 */
function updateAppliedRecommendations(fieldKey, recommendations) {
    // Find the field row and add applied recommendations indicator
    const fieldRows = document.querySelectorAll('.clinical-row');
    fieldRows.forEach(row => {
        const fieldName = row.querySelector('.field-name');
        if (fieldName && fieldName.textContent.toLowerCase().includes(fieldKey)) {
            const recommendationsCell = row.querySelector('.recommendations');
            if (recommendationsCell) {
                // Add applied recommendations indicator
                const appliedDiv = document.createElement('div');
                appliedDiv.className = 'applied-recommendations mt-2';
                appliedDiv.innerHTML = `
                    <div class="alert alert-success alert-sm p-2">
                        <i class="bi bi-check-circle me-1"></i>
                        <strong>Applied:</strong> ${recommendations.join(', ')}
                    </div>
                `;
                recommendationsCell.appendChild(appliedDiv);
            }
        }
    });
}

/**
 * Update UI to show applied clinical recommendations
 */
function updateAppliedClinicalRecommendations(flaggedField, recommendations) {
    // Find the clinical flag card and add applied recommendations
    const flagCards = document.querySelectorAll('.clinical-flag-card');
    flagCards.forEach(card => {
        const flagTitle = card.querySelector('.flag-title');
        if (flagTitle && flagTitle.textContent.includes(flaggedField)) {
            const flagContent = card.querySelector('.flag-content');
            if (flagContent) {
                // Add applied recommendations indicator
                const appliedDiv = document.createElement('div');
                appliedDiv.className = 'applied-clinical-recommendations mt-2';
                appliedDiv.innerHTML = `
                    <div class="alert alert-success alert-sm p-2">
                        <i class="bi bi-check-circle me-1"></i>
                        <strong>Applied Clinical Recommendations:</strong> ${recommendations.join(', ')}
                    </div>
                `;
                flagContent.appendChild(appliedDiv);
            }
        }
    });
    
    // Also update the main table to show the applied clinical logic recommendation
    updateClinicalLogicFieldToAllowed(flaggedField, recommendations);
}

/**
 * Track recommendation applications for single claims
 */
function trackRecommendationApplication(fieldName, recommendation, isApplied) {
    console.log(`Recommendation ${isApplied ? 'applied' : 'removed'} for ${fieldName}: ${recommendation}`);
    
    // Track in window object for later use
    if (!window.appliedRecommendations) {
        window.appliedRecommendations = {};
    }
    
    if (!window.appliedRecommendations[fieldName]) {
        window.appliedRecommendations[fieldName] = [];
    }
    
    if (isApplied) {
        if (!window.appliedRecommendations[fieldName].includes(recommendation)) {
            window.appliedRecommendations[fieldName].push(recommendation);
        }
    } else {
        window.appliedRecommendations[fieldName] = window.appliedRecommendations[fieldName]
            .filter(rec => rec !== recommendation);
    }
    
    // Update UI if needed
    updateRecommendationCounter(fieldName);
}

/**
 * Update recommendation counter display
 */
function updateRecommendationCounter(fieldName) {
    const appliedCount = window.appliedRecommendations[fieldName]?.length || 0;
    
    // Find the field's recommendation section and update counter
    const flagCards = document.querySelectorAll('.clinical-flag-card');
    flagCards.forEach(card => {
        const titleElement = card.querySelector('.flag-title');
        if (titleElement && titleElement.textContent.toLowerCase().includes(fieldName.toLowerCase())) {
            let counter = card.querySelector('.applied-counter');
            if (!counter && appliedCount > 0) {
                counter = document.createElement('span');
                counter.className = 'applied-counter badge bg-success ms-2';
                titleElement.appendChild(counter);
            }
            
            if (counter) {
                if (appliedCount > 0) {
                    counter.textContent = `${appliedCount} applied`;
                    counter.style.display = 'inline';
                } else {
                    counter.style.display = 'none';
                }
            }
        }
    });
}

/**
 * Submit single claim evaluation with applied recommendations
 */
function submitSingleClaimEvaluation() {
    // Simply show success message without any backend submission
    showSuccessToast('✅ Claim submitted successfully!');
}

/**
 * Generate detailed report for batch patient
 */
function generateBatchPatientReport(patientIndex) {
    const patient = demoState.csvData[patientIndex];
    const result = demoState.batchResults[patientIndex];
    const actualResult = result.result || result;
    
    // Call the existing generateDetailedReport function with batch data
    generateDetailedReport('batch', actualResult, patient);
}

/**
 * Generate detailed report for single claim
 */
function generateDetailedReport(type, result, patientData = null) {
    const reportData = {
        timestamp: new Date().toISOString(),
        type: type,
        result: result,
        appliedRecommendations: window.appliedRecommendations || {}
    };
    
    // Create downloadable report
    const reportContent = `
INSURANCE CLAIM VERIFICATION REPORT
==================================
Generated: ${new Date().toLocaleString()}
Report Type: ${type.toUpperCase()}

SUMMARY
-------
Claim Decision: ${result.final_decision}
Approval Probability: ${Math.round(result.approval_probability || 0)}%
Clinical Flags: ${result.clinical_flags?.length || 0}

FIELD ANALYSIS
--------------
${Object.entries(result.field_breakdown || {}).map(([field, data]) => `
${field.toUpperCase()}:
  Submitted Value: ${data.value || 'N/A'}
  Result: ${data.result || data.decision || 'Unknown'}
  Explanation: ${data.explanation || 'No explanation available'}
  Policy Source: ${data.policy_source || 'N/A'}
`).join('')}

CLINICAL FLAGS
--------------
${result.clinical_flags && result.clinical_flags.length > 0 ? 
    result.clinical_flags.map(flag => `
Flag: ${flag.flagged_field?.toUpperCase()} - ${flag.flagged_item}
Recommendations:
${flag.recommendations?.map(rec => `  • ${rec}`).join('\n') || '  • None'}
`).join('') : 'No clinical flags detected'}

APPLIED RECOMMENDATIONS
-----------------------
${Object.entries(window.appliedRecommendations || {}).map(([field, recs]) => 
    recs.length > 0 ? `${field.toUpperCase()}:\n${recs.map(rec => `  • ${rec}`).join('\n')}` : ''
).filter(Boolean).join('\n\n') || 'No recommendations applied'}

CONCLUSION
----------
This claim has been ${result.final_decision.toLowerCase()} based on policy evaluation 
and clinical analysis. ${result.clinical_flags?.length > 0 ? 
    `${result.clinical_flags.length} clinical flag(s) were identified and addressed.` : 
    'No clinical issues were identified.'}
    `;
    
    // Download report
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claim-verification-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccessToast('Detailed report downloaded successfully');
}

/**
 * Close single result modal and reset state
 */
function closeSingleResultModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('singleResultModal'));
    if (modal) {
        modal.hide();
    }
    
    // Reset applied recommendations
    window.appliedRecommendations = {};
    window.currentSingleResult = null;
    
    // Clear form if needed
    const form = document.querySelector('.manual-entry-section');
    if (form) {
        form.querySelectorAll('input, textarea').forEach(input => {
            input.value = '';
        });
    }
}

/**
 * Generate new field-level recommendations for excluded fields
 */
async function generateNewFieldRecommendations(fieldKey, value, explanation, policySource) {
    try {
        console.log(`🔄 Generating new field recommendations for ${fieldKey}: ${value}`);
        
        // Show loading state
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Generating...';
        button.disabled = true;
        
        // Call the API to regenerate field recommendations
        const response = await fetch('http://localhost:8000/regenerate-field-recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                field_name: fieldKey,
                value: value,
                explanation: explanation,
                policy_source: policySource
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log(`✅ Generated ${result.recommendations.length} new recommendations for ${fieldKey}`);
        
        // Update the recommendations in the UI
        updateFieldRecommendationsInUI(fieldKey, result.recommendations);
        
        // Show success message
        showSuccessToast(`Generated ${result.recommendations.length} new recommendations for ${fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1)}`);
        
        // Restore button state
        button.textContent = originalText;
        button.disabled = false;
        
    } catch (error) {
        console.error('Error generating new field recommendations:', error);
        showAlert(`Error generating new recommendations: ${error.message}`, 'error');
        
        // Restore button state
        const button = event.target;
        button.textContent = 'Generate New';
        button.disabled = false;
    }
}

/**
 * Generate new clinical recommendations for medical logic issues
 */
async function generateNewClinicalRecommendations(flaggedField, flaggedItem) {
    try {
        console.log(`🔄 Generating new clinical recommendations for ${flaggedField}: ${flaggedItem}`);
        
        // Show loading state
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Generating...';
        button.disabled = true;
        
        // Get current case data (try both single result and batch result)
        let currentCase = window.currentSingleResult;
        if (!currentCase && demoState.currentPatientIndex !== null) {
            const patientData = demoState.csvData[demoState.currentPatientIndex];
            currentCase = {
                complaint: patientData.complaint || '',
                symptoms: patientData.symptoms || '',
                diagnosis: patientData.diagnosis || '',
                lab: patientData.lab || '',
                pharmacy: patientData.pharmacy || ''
            };
        }
        
        if (!currentCase) {
            throw new Error('No case data available for generating recommendations');
        }
        
        // Call the API to regenerate clinical recommendations
        const response = await fetch('http://localhost:8000/regenerate-clinical-recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                diagnosis: currentCase.diagnosis || '',
                complaint: currentCase.complaint || '',
                symptoms: currentCase.symptoms || '',
                lab: currentCase.lab || '',
                pharmacy: currentCase.pharmacy || '',
                flagged_field: flaggedField,
                flagged_item: flaggedItem
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log(`✅ Generated ${result.recommendations.length} new clinical recommendations for ${flaggedField}`);
        
        // Update the recommendations in the UI
        updateClinicalRecommendationsInUI(flaggedField, flaggedItem, result.recommendations);
        
        // Show success message
        showSuccessToast(`Generated ${result.recommendations.length} new clinical recommendations for ${flaggedField.charAt(0).toUpperCase() + flaggedField.slice(1)}`);
        
        // Restore button state
        button.textContent = originalText;
        button.disabled = false;
        
    } catch (error) {
        console.error('Error generating new clinical recommendations:', error);
        showAlert(`Error generating new clinical recommendations: ${error.message}`, 'error');
        
        // Restore button state
        const button = event.target;
        button.textContent = 'Generate New';
        button.disabled = false;
    }
}

/**
 * Update field recommendations in the UI
 */
function updateFieldRecommendationsInUI(fieldKey, newRecommendations) {
    // Find the recommendations container for this field
    const fieldRows = document.querySelectorAll(`tr.clinical-row`);
    
    for (const row of fieldRows) {
        const fieldNameElement = row.querySelector('.field-name, .clinical-field');
        if (fieldNameElement && fieldNameElement.textContent.toLowerCase().includes(fieldKey.toLowerCase())) {
            const recommendationsCell = row.querySelector('.recommendations');
            if (recommendationsCell) {
                // Generate new recommendations HTML
                const newRecommendationsHtml = `
                    <div class="recommendations-list">
                        ${newRecommendations.map((rec, index) => `
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="new-rec-${fieldKey}-${index}">
                                <label class="form-check-label" for="new-rec-${fieldKey}-${index}">
                                    ${rec}
                                </label>
                            </div>
                        `).join('')}
                        <div class="recommendation-buttons mt-2">
                            <button class="btn btn-outline-primary btn-sm me-2 apply-recommendation-btn" 
                                    onclick="applyRecommendations('${fieldKey}', ${newRecommendations.length})">
                                Apply Selected
                            </button>
                            <button class="btn btn-outline-secondary btn-sm generate-new-btn" 
                                    onclick="generateNewFieldRecommendations('${fieldKey}', 'value', 'explanation', 'policy')">
                                Generate New
                            </button>
                        </div>
                    </div>
                `;
                recommendationsCell.innerHTML = newRecommendationsHtml;
                break;
            }
        }
    }
}

/**
 * Update clinical recommendations in the UI
 */
function updateClinicalRecommendationsInUI(flaggedField, flaggedItem, newRecommendations) {
    // Find the clinical flag card for this field
    const flagCards = document.querySelectorAll('.clinical-flag-card');
    
    for (const card of flagCards) {
        const flagTitle = card.querySelector('.flag-title');
        if (flagTitle && flagTitle.textContent.toLowerCase().includes(flaggedField.toLowerCase())) {
            const recommendationsSection = card.querySelector('.recommendations-checkboxes');
            if (recommendationsSection) {
                // Generate new recommendations HTML
                const newRecommendationsHtml = newRecommendations.map((rec, index) => `
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="new-clinical-${flaggedField}-${index}">
                        <label class="form-check-label" for="new-clinical-${flaggedField}-${index}">
                            ${rec}
                        </label>
                    </div>
                `).join('');
                
                recommendationsSection.innerHTML = newRecommendationsHtml;
                
                // Update the buttons section
                const buttonsSection = card.querySelector('.clinical-recommendation-buttons');
                if (buttonsSection) {
                    buttonsSection.innerHTML = `
                        <button class="btn btn-outline-primary btn-sm me-2 apply-btn" 
                                onclick="applyClinicalRecommendations('${flaggedField}', ${newRecommendations.length})">
                            Apply Selected
                        </button>
                        <button class="btn btn-outline-secondary btn-sm generate-new-clinical-btn" 
                                onclick="generateNewClinicalRecommendations('${flaggedField}', '${flaggedItem}')">
                            Generate New
                        </button>
                    `;
                }
                break;
            }
        }
    }
}

/**
 * Generate unified recommendations section merging excluded fields and clinical logic
 */
function generateUnifiedRecommendations(patient, result) {
    // Access the result data - handle both direct result and nested structure
    const actualResult = result.result || result;
    const fieldBreakdown = actualResult.field_breakdown || {};
    const clinicalFlags = actualResult.clinical_flags || [];
    
    // Collect excluded field recommendations
    const excludedFields = [];
    const fields = [
        { key: 'complaint', label: 'Chief Complaints' },
        { key: 'symptoms', label: 'Symptoms' },
        { key: 'diagnosis', label: 'Diagnosis' },
        { key: 'lab', label: 'Lab' },
        { key: 'pharmacy', label: 'Pharmacy' }
    ];
    
    fields.forEach(field => {
        const fieldData = fieldBreakdown[field.key];
        if (fieldData && 
            (fieldData.result === 'Excluded' || fieldData.decision === 'Excluded') && 
            fieldData.recommendations && 
            fieldData.recommendations.length > 0) {
            
            excludedFields.push({
                type: 'policy_exclusion',
                key: field.key,
                label: field.label,
                value: patient[field.key] || '-',
                title: `${field.label}: ${patient[field.key] || '-'}`,
                description: fieldData.explanation || '',
                recommendations: fieldData.recommendations,
                policy_source: fieldData.policy_source || ''
            });
        }
    });
    
    // Enhanced field mapping for complete deduplication - NO DUPLICATE RECOMMENDATIONS FOR SAME FIELD
    const fieldMappings = {
        'pharmacy': ['pharmacy', 'prescribed_medication', 'medication', 'drug', 'medicine', 'med'],
        'lab': ['lab', 'laboratory', 'lab_test', 'test', 'labs'],
        'diagnosis': ['diagnosis', 'condition', 'disease', 'disorder'],
        'symptoms': ['symptoms', 'symptom', 'chief_complaint'],
        'complaint': ['complaint', 'chief_complaint', 'symptoms', 'symptom']
    };
    
    // Get all field keys and their variations that are excluded
    const excludedFieldKeys = excludedFields.map(field => field.key);
    const excludedFieldVariations = [];
    const excludedValues = [];
    
    excludedFields.forEach(field => {
        // Add the main field key
        excludedFieldVariations.push(field.key);
        
        // Add all possible variations for this field
        if (fieldMappings[field.key]) {
            excludedFieldVariations.push(...fieldMappings[field.key]);
        }
        
        // Store excluded values for cross-matching
        if (field.value && field.value !== '-') {
            excludedValues.push(field.value.toLowerCase().trim());
        }
    });
    
    // Function to check if a clinical flag relates to an already excluded field
    const isFieldAlreadyExcluded = (flaggedField, flaggedItem) => {
        if (!flaggedField && !flaggedItem) return false;
        
        // Check field name variations
        if (flaggedField) {
            const fieldLower = flaggedField.toLowerCase().trim();
            if (excludedFieldVariations.some(variant => 
                variant.toLowerCase() === fieldLower || 
                fieldLower.includes(variant.toLowerCase()) ||
                variant.toLowerCase().includes(fieldLower)
            )) {
                console.log(`🚫 DUPLICATE DETECTED: Clinical flag field "${flaggedField}" matches excluded policy field`);
                return true;
            }
        }
        
        // Check if the flagged item (value) matches any excluded field value
        if (flaggedItem) {
            const itemLower = flaggedItem.toLowerCase().trim();
            if (excludedValues.some(excludedValue => 
                excludedValue === itemLower || 
                itemLower.includes(excludedValue) ||
                excludedValue.includes(itemLower)
            )) {
                console.log(`🚫 DUPLICATE DETECTED: Clinical flag item "${flaggedItem}" matches excluded policy value`);
                return true;
            }
        }
        
        return false;
    };
    
    // Collect clinical logic recommendations, COMPLETELY excluding fields that already have policy exclusions
    const clinicalRecommendations = clinicalFlags
        .filter(flag => {
            const flaggedField = flag.flagged_field || '';
            const flaggedItem = flag.flagged_item || '';
            
            // Skip if this clinical flag relates to a field that already has a policy exclusion
            const isExcluded = isFieldAlreadyExcluded(flaggedField, flaggedItem);
            
            if (!isExcluded) {
                console.log(`✅ KEEPING: Clinical flag "${flaggedField}: ${flaggedItem}" - no policy exclusion match`);
            }
            
            return !isExcluded;
        })
        .map(flag => ({
            type: 'clinical_logic',
            key: flag.flagged_field || 'clinical',
            label: (flag.flagged_field || 'Clinical Issue').charAt(0).toUpperCase() + (flag.flagged_field || 'Clinical Issue').slice(1),
            value: flag.flagged_item || 'Unknown',
            title: `${(flag.flagged_field || 'Clinical Issue').charAt(0).toUpperCase() + (flag.flagged_field || 'Clinical Issue').slice(1)}: ${flag.flagged_item || 'Unknown'}`,
            description: 'Medical logic inconsistency detected',
            reasoning: generateClinicalReasoning(flag.flagged_field, flag.flagged_item, patient, actualResult),
            recommendations: flag.recommendations || [],
            policy_source: 'Clinical Logic'
        }));
    
    // Combine all recommendations (policy exclusions take priority, clinical duplicates filtered out)
    const allRecommendations = [...excludedFields, ...clinicalRecommendations];
    
    console.log(`📊 RECOMMENDATION SUMMARY: ${excludedFields.length} policy exclusions + ${clinicalRecommendations.length} clinical flags = ${allRecommendations.length} total recommendations`);
    
    if (allRecommendations.length === 0) {
        return `
            <div class="unified-recommendations-section mb-4">
                <h3><i class="bi bi-lightbulb me-2"></i>Recommendations</h3>
                <div class="coherence-score-section mb-3">
                    <span class="coherence-label">Clinical Coherence Score:</span>
                    <span class="coherence-badge">${calculateCoherenceScore(actualResult)}%</span>
                </div>
                <div class="alert alert-success">
                    <i class="bi bi-check-circle me-2"></i>
                    <strong>No Issues Found</strong> - All fields are policy-compliant and medically coherent.
                </div>
            </div>
        `;
    }
    
    // Separate policy exclusions and clinical logic recommendations
    const policyExclusions = allRecommendations.filter(item => item.type === 'policy_exclusion');
    const clinicalLogicRecommendations = allRecommendations.filter(item => item.type === 'clinical_logic');
    
    return `
        <div class="unified-recommendations-section mb-4">
            <h3><i class="bi bi-lightbulb me-2"></i>Recommendations</h3>
            <div class="coherence-score-section mb-3">
                <span class="coherence-label">Clinical Coherence Score:</span>
                <span class="coherence-badge">${calculateCoherenceScore(actualResult)}%</span>
            </div>
            
            ${policyExclusions.length > 0 ? `
                <div class="policy-exclusions-section mb-4">
                    <h4><i class="bi bi-x-circle text-danger me-2"></i>Policy Exclusions</h4>
                    <p class="text-muted mb-3">These recommendations address policy exclusions:</p>
                    
                    ${policyExclusions.map((item, index) => `
                        <div class="recommendation-card mb-3 ${item.type}">
                            <div class="card-header">
                                <div class="recommendation-info">
                                    <h6 class="recommendation-title">
                                        <i class="bi bi-x-circle text-danger me-2"></i>
                                        ${item.title}
                                    </h6>
                                    <p class="recommendation-description text-muted">${item.description}</p>
                                    <span class="source-badge">Policy Exclusion</span>
                                </div>
                            </div>
                            
                            ${item.recommendations.length > 0 ? `
                                <div class="card-body">
                                    <div class="recommendations-list">
                                        ${item.recommendations.map((rec, recIndex) => `
                                            <div class="form-check recommendation-item">
                                                <input class="form-check-input" type="checkbox" 
                                                       id="unified-${item.key}-rec-${recIndex}"
                                                       data-field="${item.key}" 
                                                       data-recommendation="${rec}"
                                                       data-type="${item.type}">
                                                <label class="form-check-label" for="unified-${item.key}-rec-${recIndex}">
                                                    ${rec}
                                                </label>
                                            </div>
                                        `).join('')}
                                    </div>
                                    
                                    <div class="recommendation-buttons mt-3">
                                        <button class="btn btn-outline-primary btn-sm me-2 apply-unified-btn" 
                                                onclick="applyUnifiedRecommendations('${item.key}', '${item.type}', ${item.recommendations.length})">
                                            <i class="bi bi-check-square me-1"></i>Apply Selected
                                        </button>
                                        <button class="btn btn-outline-secondary btn-sm generate-new-unified-btn" 
                                                onclick="generateNewFieldRecommendations('${item.key}', '${item.value}', '${item.description}', '${item.policy_source}')">
                                            <i class="bi bi-arrow-repeat me-1"></i>Generate New
                                        </button>
                                    </div>
                                </div>
                            ` : `
                                <div class="card-body">
                                    <p class="text-muted">No specific recommendations available for this exclusion.</p>
                                </div>
                            `}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            ${clinicalLogicRecommendations.length > 0 ? `
                <div class="clinical-logic-section mb-4">
                    <h4><i class="bi bi-exclamation-triangle text-warning me-2"></i>Medical Logic & Coherence Analysis</h4>
                    <p class="text-muted mb-3">These recommendations address clinical coherence issues:</p>
                    
                    ${clinicalLogicRecommendations.map((item, index) => `
                        <div class="recommendation-card mb-3 ${item.type}">
                            <div class="card-header">
                                <div class="recommendation-info">
                                    <h6 class="recommendation-title">
                                        <i class="bi bi-exclamation-triangle text-warning me-2"></i>
                                        ${item.title}
                                    </h6>
                                    <p class="recommendation-description text-muted">${item.description}</p>
                                    <p class="clinical-reasoning text-info small mb-1" style="font-style: italic;">${item.reasoning || ''}</p>
                                    <span class="source-badge">Clinical Logic</span>
                                </div>
                            </div>
                            
                            ${item.recommendations.length > 0 ? `
                                <div class="card-body">
                                    <div class="recommendations-list">
                                        ${item.recommendations.map((rec, recIndex) => `
                                            <div class="form-check recommendation-item">
                                                <input class="form-check-input" type="checkbox" 
                                                       id="unified-${item.key}-rec-${recIndex}"
                                                       data-field="${item.key}" 
                                                       data-recommendation="${rec}"
                                                       data-type="${item.type}">
                                                <label class="form-check-label" for="unified-${item.key}-rec-${recIndex}">
                                                    ${rec}
                                                </label>
                                            </div>
                                        `).join('')}
                                    </div>
                                    
                                    <div class="recommendation-buttons mt-3">
                                        <button class="btn btn-outline-primary btn-sm me-2 apply-unified-btn" 
                                                onclick="applyUnifiedRecommendations('${item.key}', '${item.type}', ${item.recommendations.length})">
                                            <i class="bi bi-check-square me-1"></i>Apply Selected
                                        </button>
                                        <button class="btn btn-outline-secondary btn-sm generate-new-unified-btn" 
                                                onclick="generateNewClinicalRecommendations('${item.key}', '${item.value}')">
                                            <i class="bi bi-arrow-repeat me-1"></i>Generate New
                                        </button>
                                    </div>
                                </div>
                            ` : `
                                <div class="card-body">
                                    <p class="text-muted">No specific recommendations available for this clinical issue.</p>
                                </div>
                            `}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Apply unified recommendations for both policy exclusions and clinical logic
 */
function applyUnifiedRecommendations(fieldKey, type, totalRecommendations) {
    const selectedRecommendations = [];
    
    // Collect selected recommendations
    for (let i = 0; i < totalRecommendations; i++) {
        const checkbox = document.getElementById(`unified-${fieldKey}-rec-${i}`);
        if (checkbox && checkbox.checked) {
            selectedRecommendations.push(checkbox.dataset.recommendation);
        }
    }
    
    if (selectedRecommendations.length === 0) {
        showAlert('Please select at least one recommendation to apply', 'warning');
        return;
    }
    
    // Apply based on type
    if (type === 'policy_exclusion') {
        updateExcludedFieldToAllowed(fieldKey, selectedRecommendations);
    } else if (type === 'clinical_logic') {
        updateClinicalLogicFieldToAllowed(fieldKey, selectedRecommendations);
    }
    
    // Save state for persistence
    saveDemoState();
    
    showSuccessToast(`✅ Applied ${selectedRecommendations.length} recommendation(s) for ${fieldKey}`);
}

/**
 * Update a clinical logic field to "Allowed" status when recommendation is applied
 */
function updateClinicalLogicFieldToAllowed(fieldKey, appliedRecommendations) {
    // Find the field row in the table
    const fieldRows = document.querySelectorAll('.clinical-row');
    
    fieldRows.forEach(row => {
        const fieldNameElement = row.querySelector('.field-name');
        if (fieldNameElement) {
            // Map clinical flag field names to table field labels
            const flaggedFieldToTableField = {
                'lab tests': 'Lab',
                'chief complaints': 'Chief Complaints', 
                'chief complaint': 'Chief Complaints',
                'symptoms': 'Symptoms',
                'diagnosis': 'Diagnosis',
                'pharmacy': 'Pharmacy'
            };
            
            // Extract the base field name from the flagged field (e.g., "Lab tests: cbc" -> "lab tests")
            const baseFieldName = fieldKey.toLowerCase().split(':')[0].trim();
            const tableFieldName = flaggedFieldToTableField[baseFieldName];
            
            // Check if this row matches the field
            if (tableFieldName && fieldNameElement.textContent.includes(tableFieldName)) {
                // Update the row classes
                row.classList.remove('excluded', 'unknown');
                row.classList.add('allowed');
                
                // Update the icon
                const icon = row.querySelector('.bi');
                if (icon) {
                    icon.className = 'bi bi-check-circle allowed';
                }
                
                // Update the status badge
                const statusBadge = row.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.className = 'status-badge allowed';
                    statusBadge.textContent = 'Allowed';
                }
                
                // Update the submitted details with the applied recommendation
                const submittedDetailsCell = row.querySelector('.submitted-details');
                if (submittedDetailsCell && appliedRecommendations.length > 0) {
                    // Add green highlight and check badge
                    submittedDetailsCell.innerHTML = `
                        <div class="applied-recommendation-value">
                            <i class="bi bi-check-circle text-success me-1"></i>
                            <strong>${appliedRecommendations[0]}</strong>
                            ${appliedRecommendations.length > 1 ? `<small class="text-muted"> (+${appliedRecommendations.length - 1} more)</small>` : ''}
                            <div class="applied-badge">
                                <small class="text-success">✓ Applied</small>
                            </div>
                        </div>
                    `;
                    
                    // Add green highlight
                    submittedDetailsCell.style.backgroundColor = '#d4edda';
                    submittedDetailsCell.style.borderLeft = '4px solid #28a745';
                    submittedDetailsCell.style.padding = '8px';
                }
                
                // Update the policy evaluation
                const policyEvaluationCell = row.querySelector('.policy-evaluation');
                if (policyEvaluationCell) {
                    policyEvaluationCell.innerHTML = `
                        <div class="text-success">
                            <i class="bi bi-check-circle me-1"></i>
                            Allowed after applying clinical logic recommendation
                        </div>
                    `;
                }
            }
        }
    });
    
    // Update overall decision if all critical issues are resolved
    updateOverallDecisionAfterRecommendationApplication();
}

/**
 * Update an excluded field to "Allowed" status when recommendation is applied
 */
function updateExcludedFieldToAllowed(fieldKey, appliedRecommendations) {
    // Find the field row in the table
    const fieldRows = document.querySelectorAll('.clinical-row');
    
    fieldRows.forEach(row => {
        const fieldNameElement = row.querySelector('.field-name');
        if (fieldNameElement) {
            // Map field keys to labels for matching
            const fieldLabels = {
                'complaint': 'Chief Complaints',
                'symptoms': 'Symptoms',
                'diagnosis': 'Diagnosis',
                'lab': 'Lab',
                'pharmacy': 'Pharmacy'
            };
            
            if (fieldNameElement.textContent.includes(fieldLabels[fieldKey])) {
                // Update the row classes
                row.classList.remove('excluded');
                row.classList.add('allowed');
                
                // Update the icon
                const icon = row.querySelector('.bi');
                if (icon) {
                    icon.className = 'bi bi-check-circle allowed';
                }
                
                // Update the status badge
                const statusBadge = row.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.className = 'status-badge allowed';
                    statusBadge.textContent = 'Allowed';
                }
                
                // Update the submitted details with the applied recommendation
                const submittedDetailsCell = row.querySelector('.submitted-details');
                if (submittedDetailsCell && appliedRecommendations.length > 0) {
                    submittedDetailsCell.innerHTML = `
                        <div class="applied-recommendation-value">
                            <i class="bi bi-check-circle text-success me-1"></i>
                            <strong>${appliedRecommendations[0]}</strong>
                            ${appliedRecommendations.length > 1 ? `<small class="text-muted"> (+${appliedRecommendations.length - 1} more)</small>` : ''}
                            <div class="applied-badge">
                                <small class="text-success">✓ Applied</small>
                            </div>
                        </div>
                    `;
                    
                    // Add green highlight
                    submittedDetailsCell.style.backgroundColor = '#d4edda';
                    submittedDetailsCell.style.borderLeft = '4px solid #28a745';
                    submittedDetailsCell.style.padding = '8px';
                }
                
                // Update the policy evaluation
                const policyEvaluationCell = row.querySelector('.policy-evaluation');
                if (policyEvaluationCell) {
                    policyEvaluationCell.innerHTML = `
                        <div class="text-success">
                            <i class="bi bi-check-circle me-1"></i>
                            Allowed after applying selected recommendation
                        </div>
                    `;
                }
            }
        }
    });
    
    // Update overall decision if all critical issues are resolved
    updateOverallDecisionAfterRecommendationApplication();
}

/**
 * Update overall decision after recommendation application
 */
function updateOverallDecisionAfterRecommendationApplication() {
    // Check if any fields are still excluded
    const excludedRows = document.querySelectorAll('.clinical-row.excluded');
    const hasExcludedFields = excludedRows.length > 0;
    
    // Update approval probability display
    const approvalScoreElements = document.querySelectorAll('.approval-score .score-value, .coherence-badge');
    
    if (!hasExcludedFields) {
        // If no excluded fields, improve the approval probability
        approvalScoreElements.forEach(element => {
            const currentScore = parseInt(element.textContent) || 0;
            const newScore = Math.min(100, currentScore + 20); // Increase by 20% for removing exclusions
            element.textContent = `${newScore}%`;
            element.className = element.className.replace(/\b(low|medium|high)\b/g, newScore >= 80 ? 'high' : newScore >= 50 ? 'medium' : 'low');
        });
        
        showSuccessToast('✅ All excluded fields have been resolved! Approval probability increased.');
    }
}

/**
 * Generate excluded field recommendations for single claim modal
 */
function generateSingleClaimExcludedRecommendations(fieldBreakdown) {
    // Find all excluded fields with recommendations
    const excludedFields = [];
    
    Object.keys(fieldBreakdown).forEach(fieldKey => {
        const fieldData = fieldBreakdown[fieldKey];
        if (fieldData && 
            (fieldData.result === 'Excluded' || fieldData.decision === 'Excluded') && 
            fieldData.recommendations && 
            fieldData.recommendations.length > 0) {
            
            excludedFields.push({
                key: fieldKey,
                label: fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1),
                value: fieldData.value || '-',
                recommendations: fieldData.recommendations,
                explanation: fieldData.explanation || '',
                policy_source: fieldData.policy_source || ''
            });
        }
    });
    
    if (excludedFields.length === 0) {
        return ''; // No excluded fields with recommendations
    }
    
    return `
        <div class="excluded-recommendations-section mb-4 mt-4">
            <h6><i class="bi bi-lightbulb me-2"></i>Alternative Recommendations for Excluded Fields</h6>
            <p class="text-muted small mb-3">These recommendations provide alternative options for fields that were excluded by policy:</p>
            
            ${excludedFields.map(field => `
                <div class="excluded-field-card mb-3 border rounded p-3">
                    <div class="field-header mb-2">
                        <h6 class="field-title mb-1">
                            <i class="bi bi-x-circle text-danger me-2"></i>
                            ${field.label}: ${field.value}
                        </h6>
                        <p class="field-explanation text-muted small mb-2">${field.explanation}</p>
                    </div>
                    
                    <div class="recommendations-content">
                        <div class="recommendations-list">
                            ${field.recommendations.map((rec, index) => `
                                <div class="form-check recommendation-item">
                                    <input class="form-check-input" type="checkbox" 
                                           id="single-excluded-${field.key}-rec-${index}"
                                           data-field="${field.key}" 
                                           data-recommendation="${rec}">
                                    <label class="form-check-label small" for="single-excluded-${field.key}-rec-${index}">
                                        ${rec}
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="recommendation-buttons mt-2">
                            <button class="btn btn-outline-primary btn-sm me-2" 
                                    onclick="applySingleClaimExcludedRecommendations('${field.key}', ${field.recommendations.length})">
                                Apply Selected
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" 
                                    onclick="generateNewFieldRecommendations('${field.key}', '${field.value}', '${field.explanation}', '${field.policy_source}')">
                                Generate New
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Apply selected excluded field recommendations in single claim modal
 */
function applySingleClaimExcludedRecommendations(fieldKey, totalRecommendations) {
    const selectedRecommendations = [];
    
    // Collect selected recommendations
    for (let i = 0; i < totalRecommendations; i++) {
        const checkbox = document.getElementById(`single-excluded-${fieldKey}-rec-${i}`);
        if (checkbox && checkbox.checked) {
            selectedRecommendations.push(checkbox.dataset.recommendation);
        }
    }
    
    if (selectedRecommendations.length === 0) {
        showAlert('Please select at least one recommendation to apply', 'warning');
        return;
    }
    
    // Update the field status to "Allowed" in the single claim modal
    updateSingleClaimFieldToAllowed(fieldKey, selectedRecommendations);
    
    showSuccessToast(`✅ Applied ${selectedRecommendations.length} recommendation(s) for ${fieldKey}`);
}

/**
 * Update an excluded field to "Allowed" status in single claim modal
 */
function updateSingleClaimFieldToAllowed(fieldKey, appliedRecommendations) {
    // Find the field row in the single claim modal table
    const modal = document.querySelector('#singleResultModal');
    if (!modal) return;
    
    const fieldRows = modal.querySelectorAll('.clinical-row');
    
    fieldRows.forEach(row => {
        const fieldNameElement = row.querySelector('.field-title');
        if (fieldNameElement && fieldNameElement.textContent.toLowerCase().includes(fieldKey)) {
            // Update the row classes
            row.classList.remove('excluded');
            row.classList.add('allowed');
            
            // Update the icon
            const icon = row.querySelector('.bi');
            if (icon) {
                icon.className = 'bi bi-check-circle allowed';
            }
            
            // Update the status badge
            const statusBadge = row.querySelector('.status-badge');
            if (statusBadge) {
                statusBadge.className = 'status-badge allowed';
                statusBadge.innerHTML = '<i class="bi bi-check-circle me-1"></i>Allowed';
            }
            
            // Update the submitted details with the applied recommendation
            const submittedDetailsCell = row.querySelector('.submitted-details .value-text');
            if (submittedDetailsCell && appliedRecommendations.length > 0) {
                submittedDetailsCell.innerHTML = `
                    <div class="applied-recommendation">
                        <strong>Applied:</strong> ${appliedRecommendations[0]}
                        ${appliedRecommendations.length > 1 ? ` <small>(+${appliedRecommendations.length - 1} more)</small>` : ''}
                    </div>
                `;
            }
            
            // Update the policy evaluation
            const policyEvaluationCell = row.querySelector('.policy-evaluation .explanation-text');
            if (policyEvaluationCell) {
                policyEvaluationCell.textContent = 'Allowed after applying selected recommendation';
            }
        }
    });
    
    // Remove the excluded field recommendations section for this field in the modal
    const excludedFieldCards = modal.querySelectorAll('.excluded-field-card');
    excludedFieldCards.forEach(card => {
        const applyButton = card.querySelector(`[onclick*="applySingleClaimExcludedRecommendations('${fieldKey}'"]`);
        if (applyButton) {
            card.style.display = 'none';
            // Add a success message
            card.insertAdjacentHTML('afterend', `
                <div class="alert alert-success mb-3" style="animation: fadeIn 0.5s;">
                    <i class="bi bi-check-circle me-2"></i>
                    <strong>Recommendation Applied!</strong> The ${fieldKey} field is now marked as "Allowed".
                </div>
            `);
        }
    });
    
    // Update the overall decision header in the modal
    updateSingleClaimOverallDecision();
}

/**
 * Update overall decision in single claim modal after recommendation application
 */
function updateSingleClaimOverallDecision() {
    const modal = document.querySelector('#singleResultModal');
    if (!modal) return;
    
    // Check if any fields are still excluded
    const excludedRows = modal.querySelectorAll('.clinical-row.excluded');
    const hasExcludedFields = excludedRows.length > 0;
    
    if (!hasExcludedFields) {
        // Update decision badge
        const decisionBadge = modal.querySelector('.decision-badge');
        if (decisionBadge) {
            decisionBadge.className = 'decision-badge allowed';
            decisionBadge.innerHTML = '<i class="bi bi-check-circle"></i><strong>Decision: Allowed</strong>';
        }
        
        // Update approval score
        const scoreValue = modal.querySelector('.score-value');
        if (scoreValue) {
            const currentScore = parseInt(scoreValue.textContent) || 0;
            const newScore = Math.min(100, currentScore + 20);
            scoreValue.textContent = `${newScore}%`;
            scoreValue.className = scoreValue.className.replace(/\b(low|medium|high)\b/g, newScore >= 80 ? 'high' : newScore >= 50 ? 'medium' : 'low');
        }
    }
}

/**
 * Generate clinical reasoning for medical logic inconsistency
 */
function generateClinicalReasoning(flaggedField, flaggedItem, patient, result) {
    const field = flaggedField?.toLowerCase() || '';
    const item = flaggedItem || '';
    const diagnosis = patient?.diagnosis || result?.field_breakdown?.diagnosis?.value || '';
    
    // Generate intelligent reasoning based on field type and content
    if (field.includes('symptom')) {
        if (diagnosis) {
            return `🧠 Reason: Symptom does not match or support the diagnosis "${diagnosis}"`;
        }
        return `🧠 Reason: Symptom appears clinically inconsistent with other reported conditions`;
    }
    
    if (field.includes('lab') || field.includes('test')) {
        if (diagnosis) {
            return `🧠 Reason: Lab test is not typically indicated or relevant for diagnosis "${diagnosis}"`;
        }
        return `🧠 Reason: Lab test does not align with the presented clinical picture`;
    }
    
    if (field.includes('chief') || field.includes('complaint')) {
        if (diagnosis) {
            return `🧠 Reason: Chief complaint does not typically lead to diagnosis "${diagnosis}"`;
        }
        return `🧠 Reason: Chief complaint appears inconsistent with other clinical findings`;
    }
    
    if (field.includes('pharmacy') || field.includes('medication') || field.includes('drug')) {
        if (diagnosis) {
            return `🧠 Reason: Medication is not standard treatment or indicated for "${diagnosis}"`;
        }
        return `🧠 Reason: Medication prescription appears clinically inappropriate for the condition`;
    }
    
    if (field.includes('diagnosis')) {
        return `🧠 Reason: Diagnosis does not align with the reported symptoms and clinical presentation`;
    }
    
    // Default reasoning for other cases
    return `🧠 Reason: Clinical data does not follow expected medical logic patterns`;
}

// Sample Cases Download Function
function downloadSampleCase(caseType) {
    const sampleCases = {
        mixed: {
            filename: 'test_cases.csv',
            data: [
                ['patient_name', 'chief_complaints', 'symptoms', 'diagnosis_description', 'service_detail', 'payer_product_category_name'],
                ['Ahmed M', 'Severe upper abdominal pain, worsens after meals', 'Heartburn, nausea, bloating', 'Gastritis', 'H. pylori antigen test', 'Procid 40 mg, 1 tablet daily for 10 days'],
                ['Fatima A', 'Joint pain in knees', 'Pain aggravated by walking, mild swelling in knees', 'Acute Sinusitis', 'Nasal swab culture', 'Amoxicillin 500 mg, 1 tablet twice daily for 7 days'],
                ['Mohammed R', 'Fever with cough for 3 days', 'Sore throat, runny nose, mild body ache', 'Acute Upper Respiratory Tract Infection (URTI)', 'CBC (Complete Blood Count)', 'Adol 500 mg, 1 tablet every 6 hours for 5 days'],
                ['Ali H', 'Chest pain and shortness of breath', 'Cough with phlegm, wheezing', 'Acute Bronchitis', 'Chest X-ray', 'Amoxicillin 500 mg, 1 tablet three times daily for 15 days']
            ]
        }
    };

    const caseData = sampleCases[caseType];
    if (!caseData) {
        console.error('Invalid case type:', caseType);
        return;
    }

    // Convert data to CSV format
    const csvContent = caseData.data.map(row => 
        row.map(field => `"${field}"`).join(',')
    ).join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', caseData.filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    showAlert(`Sample case "${caseType}" downloaded successfully!`, 'success');
}

