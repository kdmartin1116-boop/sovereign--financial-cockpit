import { GlobalWorkerOptions } from 'pdfjs-dist/build/pdf.mjs';
import * as pdfjs from 'pdfjs-dist/build/pdf.mjs';
import { StateManager } from './stateManager.js';
import { Utils } from './utils.js';
import { KNOWLEDGE_BASE } from './knowledgeBase.js';
import { CreditorManager } from './creditorManager.js';

import { VehicleFinancingModule } from './vehicleFinancing.js';
import { BillEndorsement } from './billEndorsement.js';
import { CreditReportAnalysis } from './creditReportAnalysis.js';
import { FDCPA_Logger } from './fdcpaLogger.js';
import { DenialLetter } from './denialLetter.js';
import { PromiseToPayModule } from './promiseToPay.js';
import { Dashboard } from './dashboard.js';
import { initGlobalControls } from './script.js'; // Assuming script.js contains initGlobalControls
import { AnnotatorModule } from './annotator.js';

// Set up the PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/static/dist/pdf.worker.mjs';

document.addEventListener('DOMContentLoaded', () => {
    // --- CORE --- 
    const appState = new StateManager();
    const utils = new Utils(appState);
    utils.showAuthModal = showAuthModal; // Make showAuthModal accessible via utils

    // Global Search Elements
    const globalSearchInput = document.getElementById('globalSearchInput');
    const searchResultsDiv = document.getElementById('searchResults');

    // Auth Modal Elements
    const authModal = document.getElementById('authModal');
    console.log('Auth Modal Element:', authModal); // Add this line for debugging
    const authModalTitle = document.getElementById('authModalTitle');
    const authModalCloseBtn = document.getElementById('authModalCloseBtn');
    const authForm = document.getElementById('authForm');
    const authUsernameInput = document.getElementById('authUsername');
    const authPasswordInput = document.getElementById('authPassword');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const toggleRegisterBtn = document.getElementById('toggleRegisterBtn');
    const authMessageDiv = document.getElementById('authMessage');

    let isRegisterMode = false; // State for login/register mode

    // Auth Modal Functions
    function showAuthModal(mode = 'login') {
        console.log('showAuthModal called with mode:', mode);
        isRegisterMode = (mode === 'register');
        authModalTitle.textContent = isRegisterMode ? 'Register' : 'Login';
        authSubmitBtn.textContent = isRegisterMode ? 'Register' : 'Login';
        toggleRegisterBtn.textContent = isRegisterMode ? 'Back to Login' : 'Register';
        authMessageDiv.textContent = ''; // Clear previous messages
        authModal.classList.remove('hidden');
        console.log('After removing hidden class, authModal classes:', authModal.classList);
        authModal.style.display = 'flex'; // Explicitly set display to flex
        console.log('After setting display to flex, authModal style.display:', authModal.style.display);
        console.log('authModal is hidden:', authModal.classList.contains('hidden'));
    }

    function hideAuthModal() {
        authModal.classList.add('hidden');
        authUsernameInput.value = '';
        authPasswordInput.value = '';
        authMessageDiv.textContent = '';
    }

    function toggleAuthMode() {
        isRegisterMode = !isRegisterMode;
        authModalTitle.textContent = isRegisterMode ? 'Register' : 'Login';
        authSubmitBtn.textContent = isRegisterMode ? 'Register' : 'Login';
        toggleRegisterBtn.textContent = isRegisterMode ? 'Back to Login' : 'Register';
        authMessageDiv.textContent = ''; // Clear previous messages
    }

    // Auth Modal Event Listeners
    authModalCloseBtn.addEventListener('click', hideAuthModal);
    toggleRegisterBtn.addEventListener('click', toggleAuthMode);
    authForm.addEventListener('submit', (e) => handleAuthSubmit(e, appState, utils, authMessageDiv, authUsernameInput, authPasswordInput, isRegisterMode));

    utils.showLoader();

    try {
        // --- DASHBOARD ---
        const dashboard = new Dashboard(appState);

        // --- MODULES ---
        const creditorManager = {
            getCreditors: () => {
                try {
                    const savedCreditors = localStorage.getItem('sovereign-creditors');
                    return savedCreditors ? JSON.parse(savedCreditors) : [];
                } catch (e) {
                    console.error("Failed to get creditors from localStorage", e);
                    return [];
                }
            }
        };
        

        // Modules that need deferred initialization
        const modules = {
            vehicleFinancing: null,
            billEndorsement: null,
            creditReportAnalysis: null,
            fdcpaLogger: null,
            denialLetter: null,
            promiseToPay: null,
            annotator: null
        };

        // --- GLOBAL CONTROLS ---
        initGlobalControls(appState, utils, modules);

        // Global Search Logic
        globalSearchInput.addEventListener('keyup', () => {
            const query = globalSearchInput.value.toLowerCase();
            if (query.length > 2) {
                const results = globalSearch(query, appState.getState(), KNOWLEDGE_BASE);
                displaySearchResults(results, searchResultsDiv);
            } else {
                searchResultsDiv.classList.add('hidden');
                searchResultsDiv.innerHTML = '';
            }
        });

        console.log('Sovereign Finance Cockpit Initialized');

        // Deferred module initialization based on tab activation
        const tabElements = document.querySelectorAll('button[data-bs-toggle="tab"]');
        tabElements.forEach(tabEl => {
            tabEl.addEventListener('shown.bs.tab', event => {
                const targetTabId = event.target.dataset.bsTarget; // #tab-endorsement

                switch (targetTabId) {
                    case '#tab-vehicle':
                        if (!modules.vehicleFinancing) {
                            modules.vehicleFinancing = new VehicleFinancingModule(appState, KNOWLEDGE_BASE, utils, creditorManager);
                        }
                        break;
                    case '#tab-endorsement':
                        if (!modules.billEndorsement) {
                            modules.billEndorsement = new BillEndorsement(appState, KNOWLEDGE_BASE, utils);
                        }
                        break;
                    case '#tab-credit-report':
                        if (!modules.creditReportAnalysis) {
                            modules.creditReportAnalysis = new CreditReportAnalysis(appState, KNOWLEDGE_BASE, utils, creditorManager);
                        }
                        break;
                    case '#tab-fdcpa':
                        if (!modules.fdcpaLogger) {
                            modules.fdcpaLogger = new FDCPA_Logger(appState, KNOWLEDGE_BASE, utils, creditorManager);
                        }
                        break;
                    case '#tab-denial':
                        if (!modules.denialLetter) {
                            modules.denialLetter = new DenialLetter(appState, KNOWLEDGE_BASE, utils);
                        }
                        break;
                    case '#tab-promise':
                        if (!modules.promiseToPay) {
                            modules.promiseToPay = new PromiseToPayModule(appState, utils, creditorManager);
                        }
                        break;
                    case '#tab-annotator':
                        if (!modules.annotator) {
                            modules.annotator = new AnnotatorModule(appState, utils);
                        }
                        break;
                }
            });
        });



    } catch (error) {
        console.error("Failed to initialize the application:", error);
        utils.setStatus("Application failed to load. Check the console for errors.", true);
    } finally {
        utils.hideLoader();
    }
});

async function handleAuthSubmit(event, appState, utils, authMessageDiv, authUsernameInput, authPasswordInput, isRegisterMode) {
    event.preventDefault();
    utils.showLoader();
    authMessageDiv.textContent = '';

    const username = authUsernameInput.value;
    const password = authPasswordInput.value;
    const endpoint = isRegisterMode ? '/api/register' : '/api/login';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            authMessageDiv.textContent = data.message;
            authMessageDiv.classList.remove('error');
            authMessageDiv.classList.add('success');
            // On successful login/registration, hide modal and potentially refresh profile
            hideAuthModal();
            // Dispatch an event to tell the profile component to reload
            window.dispatchEvent(new CustomEvent('profile-needs-refresh'));
        } else {
            authMessageDiv.textContent = data.error || 'An error occurred.';
            authMessageDiv.classList.remove('success');
            authMessageDiv.classList.add('error');
        }
    } catch (error) {
        console.error('Authentication error:', error);
        authMessageDiv.textContent = 'Network error or server unreachable.';
        authMessageDiv.classList.remove('success');
        authMessageDiv.classList.add('error');
    } finally {
        utils.hideLoader();
    }
}

function globalSearch(query, state, knowledgeBase) {
    const results = [];

    // Search Creditors
    state.creditors.forEach(creditor => {
        if (creditor.name.toLowerCase().includes(query) || creditor.address.toLowerCase().includes(query)) {
            results.push({ type: 'Creditor', name: creditor.name, description: creditor.address });
        }
    });

    // Search FDCPA Log
    state.fdcpaLog.forEach(log => {
        if (log.collector.toLowerCase().includes(query) || log.description.toLowerCase().includes(query)) {
            results.push({ type: 'FDCPA Violation', name: log.collector, description: `${knowledgeBase.FDCPA.violations[log.type].summary} on ${log.date}` });
        }
    });

    // Search Disputes
    state.disputes.forEach(dispute => {
        if (dispute.account_name.toLowerCase().includes(query) || dispute.account_number.toLowerCase().includes(query)) {
            results.push({ type: 'Dispute', name: dispute.account_name, description: `Account: ${dispute.account_number}, Status: ${dispute.status}` });
        }
    });

    // Add more search categories as needed (e.g., parsed credit report accounts, vehicle contract terms)

    return results;
}

function displaySearchResults(results, resultsContainer) {
    resultsContainer.innerHTML = '';
    if (results.length === 0) {
        resultsContainer.classList.add('hidden');
        return;
    }

    const ul = document.createElement('ul');
    results.forEach(result => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${result.type}:</strong> ${result.name} - ${result.description}`;
        ul.appendChild(li);
    });

    resultsContainer.appendChild(ul);
    resultsContainer.classList.remove('hidden');
}
