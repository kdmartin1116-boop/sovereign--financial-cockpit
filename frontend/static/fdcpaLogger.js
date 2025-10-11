import { CONSTANTS } from './constants.js';

export class FDCPA_Logger {
    constructor(appState, knowledgeBase, utils, creditorManager) {
        this.appState = appState;
        this.knowledgeBase = knowledgeBase;
        this.utils = utils;
        this.creditorManager = creditorManager;
        this.letterContent = '';

        // DOM Elements
        this.logDisplay = document.getElementById('fdcpaLogDisplay');
        this.violationTypeSelect = document.getElementById('fdcpaViolationType');
        this.logBtn = document.getElementById('logFdcpaViolationBtn');
        this.prepareBtn = document.getElementById('prepareCeaseDesistBtn');
        this.exportBtn = document.getElementById('exportFdcpaLogBtn');
        this.actionDetailsEl = document.getElementById('fdcpa-action-details');

        // Log Violation Form
        this.collectorNameInput = document.getElementById('collectorName');
        this.violationDateInput = document.getElementById('violationDate');
        this.violationDescInput = document.getElementById('violationDescription');
        this.suggestionConfidenceEl = document.getElementById('fdcpaSuggestionConfidence');

        // Cease & Desist Form
        this.generateBtn = document.getElementById('generateCeaseDesistBtn');
        this.copyBtn = document.getElementById('copyCeaseDesistBtn');
        this.fdcpaCollectorName = document.getElementById('fdcpaCollectorName');
        this.fdcpaCollectorAddress = document.getElementById('fdcpaCollectorAddress');
        this.fdcpaAccountNumber = document.getElementById('fdcpaAccountNumber');

        // Modal elements
        this.modal = document.getElementById('confirmationModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalDetails = document.getElementById('modalDetails');
        this.modalConfirmBtn = document.getElementById('modalConfirmBtn');
        this.modalCancelBtn = document.getElementById('modalCancelBtn');

        this.init();
    }

    init() {
        this.populateViolationTypes();
        this.renderLog();
        this.logBtn.addEventListener('click', () => this.logViolation());
        this.prepareBtn.addEventListener('click', () => this.prepareCeaseAndDesist());
        this.exportBtn.addEventListener('click', () => this.exportLogToCsv());
        this.generateBtn.addEventListener('click', () => this.showConfirmation('generate'));
        this.copyBtn.addEventListener('click', () => this.showConfirmation('copy'));
        this.modalCancelBtn.addEventListener('click', () => this.hideModal());

        this.violationDescInput.addEventListener('input', () => this.suggestViolationType());
    }

    exportLogToCsv() {
        const log = this.appState.getState().fdcpaLog;
        if (log.length === 0) {
            this.utils.setStatus('There are no violations to export.', true);
            return;
        }

        const headers = ['ID', 'Date', 'Violation Type', 'Collector', 'Description'];
        const csvRows = [headers.join(',')];

        log.forEach(item => {
            const violationSummary = this.knowledgeBase.FDCPA.violations[item.type].summary;
            const sanitize = (str) => `"${String(str).replace(/"/g, '""').replace(/\n/g, ' ')}"`;

            const values = [
                item.id,
                item.date,
                sanitize(violationSummary),
                sanitize(item.collector),
                sanitize(item.description)
            ];
            csvRows.push(values.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'fdcpa_log.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.utils.setStatus('FDCPA log exported to fdcpa_log.csv', false);
    }

    hideModal() {
        this.modal.classList.add('hidden');
        this.modalConfirmBtn.onclick = null;
    }

    showConfirmation(action) {
        const letterText = this._getCeaseAndDesistLetterText();
        if (!letterText) return;

        this.modalTitle.textContent = 'Confirm Cease & Desist';
        this.modalDetails.innerHTML = `
            <p>You are about to create a Cease and Desist letter for:</p>
            <p><strong>${this.fdcpaCollectorName.value.trim()}</strong></p>
            <p>Please confirm you want to proceed.</p>
        `;

        this.modalConfirmBtn.onclick = () => {
            if (action === 'generate') {
                this.generateCeaseAndDesist(letterText);
            } else if (action === 'copy') {
                this.copyCeaseAndDesist(letterText);
            }
            this.hideModal();
        };

        this.modal.classList.remove('hidden');
    }

    populateViolationTypes() {
        const violations = this.knowledgeBase.FDCPA.violations;
        for (const key in violations) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = violations[key].summary;
            this.violationTypeSelect.appendChild(option);
        }
    }

    suggestViolationType() {
        const description = this.violationDescInput.value.toLowerCase();
        if (!description) {
            this.suggestionConfidenceEl.textContent = '';
            return;
        }

        const scores = {};
        let bestMatch = { key: null, score: 0 };
        const violations = this.knowledgeBase.FDCPA.violations;

        for (const key in violations) {
            scores[key] = 0;
            const violation = violations[key];
            if (violation.keywords && Array.isArray(violation.keywords)) {
                for (const keyword of violation.keywords) {
                    const regex = new RegExp(`\b${keyword.toLowerCase()}\b`);
                    if (regex.test(description)) {
                        scores[key]++;
                    }
                }
            }
        }

        for (const key in scores) {
            if (scores[key] > bestMatch.score) {
                bestMatch = { key, score: scores[key] };
            }
        }

        if (bestMatch.score > 0) {
            this.violationTypeSelect.value = bestMatch.key;
            this.suggestionConfidenceEl.textContent = `Suggestion (Confidence: ${bestMatch.score})`;
        } else {
            this.suggestionConfidenceEl.textContent = '';
        }
    }

    logViolation() {
        const newLog = {
            id: Date.now(),
            type: this.violationTypeSelect.value,
            collector: this.collectorNameInput.value.trim(),
            date: this.violationDateInput.value,
            description: this.violationDescInput.value.trim(),
        };

        if (!newLog.collector || !newLog.date || !newLog.description) {
            this.utils.setStatus('Please fill out all fields to log a violation.', true);
            return;
        }

        const currentState = this.appState.getState();
        const updatedLog = [...currentState.fdcpaLog, newLog];
        this.appState.updateState({ fdcpaLog: updatedLog });
        localStorage.setItem(CONSTANTS.LOCAL_STORAGE.FDCPA_LOG, JSON.stringify(updatedLog));
        this.renderLog();
        document.dispatchEvent(new CustomEvent('fdcpaLogUpdated'));
        this.utils.logAction(`FDCPA violation logged for ${newLog.collector}.`);

        this.collectorNameInput.value = '';
        this.violationDateInput.value = '';
        this.violationDescInput.value = '';
        this.suggestionConfidenceEl.textContent = '';
    }

    renderLog() {
        const currentState = this.appState.getState();
        if (currentState.fdcpaLog.length === 0) {
            this.logDisplay.innerHTML = '<p class="text-muted">No violations logged yet.</p>';
            this.prepareBtn.disabled = true;
            return;
        }

        const list = currentState.fdcpaLog.map(item => `
            <li>
                <strong>${item.date} - ${this.knowledgeBase.FDCPA.violations[item.type].summary}</strong><br>
                <em>Collector:</em> ${item.collector}<br>
                <em>Details:</em> ${item.description}
            </li>
        `).join('');

        this.logDisplay.innerHTML = `<ul>${list}</ul>`;
        this.prepareBtn.disabled = false;
    }

    prepareCeaseAndDesist() {
        this.actionDetailsEl.classList.toggle('hidden');
        if (!this.actionDetailsEl.classList.contains('hidden')) {
            const currentState = this.appState.getState();
            const lastLog = currentState.fdcpaLog[currentState.fdcpaLog.length - 1];
            if (lastLog) {
                const collectorName = lastLog.collector;
                this.fdcpaCollectorName.value = collectorName;

                const knownCreditor = this.creditorManager.getCreditors().find(c => c.name.toLowerCase() === collectorName.toLowerCase());
                if (knownCreditor) {
                    this.fdcpaCollectorAddress.value = knownCreditor.address;
                    this.utils.setStatus(`Address for ${collectorName} auto-filled from address book.`, false);
                }
            }
        }
    }

    _getCeaseAndDesistLetterText() {
        const currentState = this.appState.getState();
        const details = {
            userName: currentState.userProfile.name,
            userAddress: currentState.userProfile.address,
            collectorName: this.fdcpaCollectorName.value.trim(),
            collectorAddress: this.fdcpaCollectorAddress.value.trim(),
            accountNumber: this.fdcpaAccountNumber.value.trim(),
            currentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        };

        if (!details.userName || !details.userAddress || !details.collectorName || !details.collectorAddress) {
            this.utils.setStatus('Please fill out your name, your address, and the collector\'s name and address.', true);
            return null;
        }

        return `
${details.userName}
${details.userAddress}

${details.currentDate}

${details.collectorName}
${details.collectorAddress}

VIA CERTIFIED MAIL

RE: Cease and Desist All Communications${details.accountNumber ? `\nAccount/Reference Number: ${details.accountNumber}` : ''}

To Whom It May Concern:

This letter is a formal notification, pursuant to my rights under the Fair Debt Collection Practices Act (FDCPA), 15 U.S.C. § 1692c(c), that I demand you cease all further communication with me regarding this matter.

This means you must not contact me by mail, telephone, email, in person, or by any other means for any reason, except for the specific purposes allowed by the statute: (1) to advise me that your further efforts are being terminated; (2) to notify me that you may invoke specified remedies which are ordinarily invoked by you or your company; or (3) where applicable, to notify me that you intend to invoke a specified remedy.

Be advised that any communication from you that does not comply with this demand will constitute a violation of the FDCPA. Such a violation will be reported to the appropriate federal and state authorities, and I will not hesitate to pursue all available legal remedies.

This demand applies to you, your company, and any attorneys, agents, or other third parties acting on your behalf.

Govern yourselves accordingly.

Sincerely,

_________________________
${details.userName}
        `.trim();
    }

    generateCeaseAndDesist(letterText) {
        if (!letterText) return;
        this.utils.generateDownload(letterText, `Cease_and_Desist_${this.fdcpaCollectorName.value.trim().replace(/\s/g, '_')}.txt`);
        this.utils.logAction('Cease and Desist letter generated and downloaded.');
    }

    copyCeaseAndDesist(letterText) {
        if (!letterText) return;
        this.utils.copyToClipboard(letterText, 'Cease and Desist letter text copied to clipboard.');
        this.utils.logAction('Cease and Desist letter text copied.');
    }

    reset() {
        this.appState.updateState({ fdcpaLog: [] });
        localStorage.removeItem(CONSTANTS.LOCAL_STORAGE.FDCPA_LOG);
        this.actionDetailsEl.classList.add('hidden');
        this.renderLog();
    }
}