import { GlobalWorkerOptions } from 'pdfjs-dist/build/pdf.mjs';
import * as pdfjs from 'pdfjs-dist/build/pdf.mjs';
import { StateManager } from './stateManager.js';
import { Utils } from './utils.js';
import { KNOWLEDGE_BASE } from './knowledgeBase.js';
import { CreditorManager } from './creditorManager.js';
import { UserProfile } from './userProfile.js';
import { VehicleFinancingModule } from './vehicleFinancing.js';
import { BillEndorsement } from './billEndorsement.js';
import { CreditReportAnalysis } from './creditReportAnalysis.js';
import { FDCPA_Logger } from './fdcpaLogger.js';
import { DenialLetter } from './denialLetter.js';
import { PromiseToPayModule } from './promiseToPay.js';
import { initGlobalControls } from './script.js';

// Set up the PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/static/dist/pdf.worker.mjs';

document.addEventListener('DOMContentLoaded', () => {
    // --- CORE --- 
    const appState = new StateManager();
    const utils = new Utils(appState);

    utils.showLoader();

    try {
        // --- MODULES ---
        const creditorManager = new CreditorManager(appState, utils);
        const userProfile = new UserProfile(appState, utils, creditorManager);
        const vehicleFinancing = new VehicleFinancingModule(appState, KNOWLEDGE_BASE, utils, creditorManager);
        const billEndorsement = new BillEndorsement(appState, KNOWLEDGE_BASE, utils);
        const creditReportAnalysis = new CreditReportAnalysis(appState, KNOWLEDGE_BASE, utils);
        const fdcpaLogger = new FDCPA_Logger(appState, KNOWLEDGE_BASE, utils, creditorManager);
        const denialLetter = new DenialLetter(appState, KNOWLEDGE_BASE, utils);
        const promiseToPay = new PromiseToPayModule(appState, utils, creditorManager);

        // --- GLOBAL CONTROLS ---
        initGlobalControls(appState, utils, [
            vehicleFinancing,
            billEndorsement,
            creditReportAnalysis,
            fdcpaLogger,
            denialLetter,
            userProfile,
            creditorManager,
            promiseToPay
        ]);

        console.log('Sovereign Finance Cockpit Initialized');
    } catch (error) {
        console.error("Failed to initialize the application:", error);
        utils.setStatus("Application failed to load. Check the console for errors.", true);
    } finally {
        utils.hideLoader();
    }
});
