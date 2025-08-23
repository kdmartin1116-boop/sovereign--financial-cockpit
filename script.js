document.addEventListener('DOMContentLoaded', () => {
    // --- LIBRARIES ---
    const { PDFDocument, rgb, StandardFonts } = PDFLib;
// Add these functions inside your script.js, for example, near your other utils like setStatus.

/**
 * Creates a text file from a string and triggers a browser download.
 * @param {string} content The text content of the file.
 * @param {string} filename The desired name for the downloaded file.
 */
function generateDownload(content, filename) {
    try {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setStatus(`File "${filename}" downloaded successfully.`, false, true);
    } catch (error) {
        console.error('Error generating download:', error);
        setStatus('Failed to generate download link.', true);
    }
}

/**
 * Copies a string to the user's clipboard.
 * @param {string} content The text to copy.
 * @param {string} successMessage The message to display on success.
 */
function copyToClipboard(content, successMessage) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(content).then(() => {
            setStatus(successMessage || 'Text copied to clipboard.', false, true);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            setStatus('Failed to copy text to clipboard.', true);
        });
    } else {
        setStatus('Clipboard API not available in this browser.', true);
    }
}
// In script.js, inside your initializeApp() or equivalent function:

const utils = {
    setStatus,
    logAction,
    showLoader,
    hideLoader,
    generateDownload, // <-- Add this
    copyToClipboard   // <-- Add this
};

// Now all modules will have access to the shared functions
billEndorsement = new BillEndorsementModule(appState, KNOWLEDGE_BASE, utils);
vehicleFinancing = new VehicleFinancingModule(appState, KNOWLEDGE_BASE, utils);
creditReportAnalysis = new CreditReportAnalysisModule(appState, KNOWLEDGE_BASE, utils);
fdcpaLogger = new FdcpaLogger(appState, KNOWLEDGE_BASE, utils);
// In your main initialization logic (e.g., inside DOMContentLoaded)
// This adds IDs to any old log entries that don't have them.
appState.history.forEach((entry, index) => {
    if (!entry.id) {
        entry.id = Date.now() + index;
    }
});

// Replace your existing logAction function with this one
function logAction(action) {
    const timestamp = new Date().toLocaleString();
    const id = Date.now(); // Add a unique ID
    appState.history.push({ id, timestamp, action });
    localStorage.setItem(CONSTANTS.LOCAL_STORAGE.INSTRUMENT_HISTORY, JSON.stringify(appState.history));
    renderHistory();
}
// Replace your existing renderHistory function
function renderHistory() {
    const logEl = document.getElementById('instrumentLog');
    if (appState.history.length === 0) {
        logEl.innerHTML = '<p class="text-muted">No history yet.</p>';
        return;
    }
    const list = appState.history.map(entry => `
        <li data-id="${entry.id}">
            <span class="log-text">${entry.timestamp}: ${entry.action}</span>
            <div class="log-actions">
                <button class="edit-log-btn" title="Edit entry">✏️</button>
                <button class="delete-log-btn" title="Delete entry">🗑️</button>
            </div>
        </li>
    `).join('');
    logEl.innerHTML = `<ul></ul>`;
}
// Add these new functions to your script.js

function deleteHistoryEntry(id) {
    if (!confirm('Are you sure you want to delete this log entry?')) {
        return;
    }
    appState.history = appState.history.filter(entry => entry.id !== id);
    localStorage.setItem(CONSTANTS.LOCAL_STORAGE.INSTRUMENT_HISTORY, JSON.stringify(appState.history));
    renderHistory();
    setStatus('Log entry deleted.', false);
}

function editHistoryEntry(id, logItemElement) {
    // Prevent multiple edits at once
    if (document.querySelector('.edit-container')) {
        return;
    }

    const logTextSpan = logItemElement.querySelector('.log-text');
    const logActionsDiv = logItemElement.querySelector('.log-actions');
    const entry = appState.history.find(e => e.id === id);
    if (!entry) return;

    logTextSpan.style.display = 'none';
    logActionsDiv.style.display = 'none';

    const editContainer = document.createElement('div');
    editContainer.className = 'edit-container';
    editContainer.innerHTML = `
        <input type="text" class="edit-log-input" value="${entry.action}">
        <button class="save-log-btn">Save</button>
        <button class="cancel-log-btn">Cancel</button>
    `;

    logItemElement.appendChild(editContainer);
    const input = editContainer.querySelector('input');
    input.focus();
    input.select();

    const saveHandler = () => {
        const newAction = input.value.trim();
        if (newAction) {
            entry.action = newAction;
            localStorage.setItem(CONSTANTS.LOCAL_STORAGE.INSTRUMENT_HISTORY, JSON.stringify(appState.history));
            setStatus('Log entry updated.', false);
        }
        renderHistory(); // Re-render to show updated state and remove edit UI
    };

    const cancelHandler = () => {
        renderHistory(); // Just re-render to cancel
    };

    editContainer.querySelector('.save-log-btn').addEventListener('click', saveHandler);
    editContainer.querySelector('.cancel-log-btn').addEventListener('click', cancelHandler);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveHandler();
        if (e.key === 'Escape') cancelHandler();
    });
}

function handleHistoryAction(e) {
    const target = e.target;
    const logItem = target.closest('li[data-id]');
    if (!logItem) return;

    const logId = Number(logItem.dataset.id);

    if (target.classList.contains('delete-log-btn')) {
        deleteHistoryEntry(logId);
    } else if (target.classList.contains('edit-log-btn')) {
        editHistoryEntry(logId, logItem);
    }
}

// In your main initialization logic (e.g., inside DOMContentLoaded), set up the listener
const instrumentLogEl = document.getElementById('instrumentLog');
instrumentLogEl.addEventListener('click', handleHistoryAction);
    
    // --- CONSTANTS ---
    const CONSTANTS = {
        LOCAL_STORAGE: {
            FDCPA_LOG: 'fdcpaLog',
            INSTRUMENT_HISTORY: 'instrumentHistory',
            THEME: 'theme',
            USER_PROFILE: 'userProfile',
            CREDITORS: 'sovereignCreditors'
        }
    };
    // --- STATE MANAGEMENT ---
    function getInitialState() {
        const savedCreditors = JSON.parse(localStorage.getItem(CONSTANTS.LOCAL_STORAGE.CREDITORS)) || [];
        const savedFdcpaLog = JSON.parse(localStorage.getItem(CONSTANTS.LOCAL_STORAGE.FDCPA_LOG)) || [];
        const savedHistory = JSON.parse(localStorage.getItem(CONSTANTS.LOCAL_STORAGE.INSTRUMENT_HISTORY)) || [];
        const savedProfile = JSON.parse(localStorage.getItem(CONSTANTS.LOCAL_STORAGE.USER_PROFILE)) || { name: '', address: '' };

        return {
            pdfPage: null,
            endorsement: { text: null, x: 0, y: 0 },
            userProfile: savedProfile,
            creditors: savedCreditors,
            history: savedHistory,
            loopState: 'intake', // intake, validate, remedy, log, reflect
            validationResults: { found: [], missing: [] },
            uccValidationResults: { passed: [], failed: [] },
            fdcpaLog: savedFdcpaLog
        };
    }
    let appState = getInitialState();

    // --- MODULE INSTANCES ---
    let billEndorsement, vehicleFinancing, creditReportAnalysis, fdcpaLogger, userProfile, creditorManager;

    // --- DOM ELEMENTS ---
    const globalLoader = document.getElementById('global-loader');
    const statusEl = document.getElementById('endorsementStatus');
    const resetAppBtn = document.getElementById('resetAppBtn');
    const trackInstrumentBtn = document.getElementById('trackInstrumentBtn');
    const customLogEntryInput = document.getElementById('customLogEntry');
    const themeToggle = document.getElementById('themeToggle');
    const instrumentLogEl = document.getElementById('instrumentLog');

    // --- LOADER UTILITIES ---
    // These are now available to be passed in the 'utils' object if needed by modules
    function showLoader() { globalLoader.classList.remove('hidden'); }
    function hideLoader() { globalLoader.classList.add('hidden'); }

    // --- UTILITY FUNCTIONS ---
    function setStatus(message, isError = false) {
        statusEl.textContent = message;
        if (isError) {
            statusEl.style.color = 'var(--status-error-color)';
        } else if (message) {
            statusEl.style.color = 'var(--status-info-color)';
        } else {
            statusEl.style.color = 'var(--text-color)';
        }
    }

    function logAction(action) {
        const timestamp = new Date().toLocaleString();
        appState.history.push({ timestamp, action });
        localStorage.setItem(CONSTANTS.LOCAL_STORAGE.INSTRUMENT_HISTORY, JSON.stringify(appState.history));
        renderHistory();
    }

    function renderHistory() {
        instrumentLogEl.innerHTML = '<ul>' + appState.history.map(entry => `
            <li><strong>[${entry.timestamp}]</strong>: ${entry.action}</li>
        `).join('') + '</ul>';
    }

    function download(data, filename, type) {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function updateSovereignLoopUI() {
        const states = ['intake', 'validate', 'remedy', 'log', 'reflect'];
        states.forEach(state => {
            const el = document.getElementById(`loop-${state}`);
            if (el) {
                el.classList.toggle('active', state === appState.loopState);
            }
        });
    }

    async function extractTextFromPdf(file) {
        showLoader();
        setStatus('Extracting text from PDF...', false);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const typedarray = new Uint8Array(arrayBuffer);
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map(item => item.str).join(' ');
            }
            setStatus('Text extracted successfully.', false);
            return fullText;
        } catch (error) {
            console.error("Error extracting text from PDF:", error);
            setStatus('Failed to process PDF. It may be corrupted or encrypted.', true);
            return null; // Return null to indicate failure
        } finally {
            hideLoader(); // Ensure loader is always hidden
        }
    }

    // --- THEME HANDLING ---
    function handleThemeToggle() {
        if (themeToggle.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem(CONSTANTS.LOCAL_STORAGE.THEME, 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem(CONSTANTS.LOCAL_STORAGE.THEME, 'light');
        }
    }

    function applySavedTheme() {
        const savedTheme = localStorage.getItem(CONSTANTS.LOCAL_STORAGE.THEME);
        if (savedTheme) {
            themeToggle.checked = savedTheme === 'dark';
        }
        handleThemeToggle();
    }

    // --- EVENT HANDLERS ---
    function handleTrackInstrument() {
        const note = customLogEntryInput.value.trim();
        if (!note) {
            setStatus("Please enter a note for the log.", true);
            return;
        }
        logAction(`Custom Note: "${note}"`);
        customLogEntryInput.value = '';
        setStatus("Custom note added to log.", false);
    }

    function handleReset(clearFiles = true) {
        if (!confirm('Are you sure you want to reset all application data? This action cannot be undone.')) {
            return;
        }
        localStorage.removeItem(CONSTANTS.LOCAL_STORAGE.INSTRUMENT_HISTORY);
        localStorage.removeItem(CONSTANTS.LOCAL_STORAGE.FDCPA_LOG);
        localStorage.removeItem(CONSTANTS.LOCAL_STORAGE.CREDITORS);
        localStorage.removeItem(CONSTANTS.LOCAL_STORAGE.USER_PROFILE);

        appState = getInitialState();
        billEndorsement.reset(clearFiles);
        vehicleFinancing.reset(clearFiles);
        creditReportAnalysis.reset();
        creditorManager.renderCreditorList();
        fdcpaLogger.reset();
        
        userProfile.loadProfile(); // Reloads the empty profile into the form
        customLogEntryInput.value = '';
        setStatus('');
        renderAllLogs();
        updateSovereignLoopUI();
    }

    function renderAllLogs() {
        renderHistory();
        fdcpaLogger.renderLog();
    }

    // --- INITIALIZATION ---
    const utils = {
        logAction,
        updateSovereignLoopUI,
        download,
        extractTextFromPdf,
        setStatus,
        showLoader,
        hideLoader
    };

    // Instantiate classes instead of calling .init() on modules.
    // Ensure your module files (e.g., vehicleFinancing.js) define these classes.
    billEndorsement = new BillEndorsement(appState, KNOWLEDGE_BASE, PDFLib, pdfjsLib, utils);
    vehicleFinancing = new VehicleFinancing(appState, KNOWLEDGE_BASE, utils);
    creditReportAnalysis = new CreditReportAnalysis(appState, KNOWLEDGE_BASE, utils);
    fdcpaLogger = new FdcpaLogger(appState, KNOWLEDGE_BASE, utils);
    creditorManager = new CreditorManagerModule(appState, utils);
    userProfile = new UserProfileModule(appState, utils);

    resetAppBtn.addEventListener('click', () => handleReset(true));
    trackInstrumentBtn.addEventListener('click', handleTrackInstrument);
    themeToggle.addEventListener('change', handleThemeToggle);

    applySavedTheme();
    renderAllLogs(); // Render logs loaded from localStorage
    updateSovereignLoopUI();
});
