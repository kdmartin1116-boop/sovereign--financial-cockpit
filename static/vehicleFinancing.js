import { getDocument } from 'pdfjs-dist/build/pdf.mjs';

export class VehicleFinancingModule {
    constructor(appState, knowledgeBase, utils, creditorManager) {
        this.appState = appState;
        this.knowledgeBase = knowledgeBase;
        this.utils = utils;
        this.creditorManager = creditorManager;
        this.letterContent = ''; // To store the generated letter text

        // DOM Elements
        this.contractInput = document.getElementById('vehicleContract');
        this.validateBtn = document.getElementById('validateDisclosureBtn');
        this.scanBtn = document.getElementById('scanContractBtn');
        this.scanResultsEl = document.getElementById('scanResults');
        this.remedyDetailsEl = document.getElementById('tila-remedy-details');
        this.tilaValidationResultsEl = document.getElementById('tila-validation-results');
        this.tilaResultsListEl = document.getElementById('tila-results-list');

        // TILA Remedy Form Elements
        this.tilaCreditorSelect = document.getElementById('tilaCreditorSelect');
        this.tilaCreditorName = document.getElementById('tilaCreditorName');
        this.tilaCreditorAddress = document.getElementById('tilaCreditorAddress');
        this.tilaContractDate = document.getElementById('tilaContractDate');
        this.tilaVehicleInfo = document.getElementById('tilaVehicleInfo');

        this.generateRemedyBtn = document.getElementById('generateRemedyBtn');
        this.copyTilaLetterBtn = document.getElementById('copyTilaLetterBtn');

        this.init();
    }

    init() {
        this.validateBtn.addEventListener('click', () => this.validateTilaDisclosures());
        this.scanBtn.addEventListener('click', () => this.scanForTerms());
        this.generateRemedyBtn.addEventListener('click', () => this.generateTilaRemedyLetter());
        this.copyTilaLetterBtn.addEventListener('click', () => this.copyTilaLetter());

        this.contractInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.appState.updateState({ vehicleContractFile: e.target.files[0] });
                this.utils.logAction('Vehicle contract uploaded.');
            }
        });

        // Listen for creditor updates
        this.populateCreditors();
        document.addEventListener('creditorsUpdated', () => this.populateCreditors());
        this.tilaCreditorSelect.addEventListener('change', () => this.handleCreditorSelect());

        // Clear cached letter content if user modifies the details
        const formInputs = this.remedyDetailsEl.querySelectorAll('input, select');
        formInputs.forEach(input => input.addEventListener('input', () => { this.letterContent = ''; }));
    }

    populateCreditors() {
        const creditors = this.creditorManager.getCreditors();
        this.tilaCreditorSelect.innerHTML = '<option value="">Select a Creditor</option>';
        creditors.forEach(creditor => {
            const option = document.createElement('option');
            option.value = creditor.id;
            option.textContent = creditor.name;
            this.tilaCreditorSelect.appendChild(option);
        });
    }

    handleCreditorSelect() {
        const creditorId = this.tilaCreditorSelect.value;
        if (creditorId) {
            const creditor = this.creditorManager.getCreditors().find(c => c.id == creditorId);
            if (creditor) {
                this.tilaCreditorName.value = creditor.name;
                this.tilaCreditorAddress.value = creditor.address;
            }
        } else {
            this.tilaCreditorName.value = '';
            this.tilaCreditorAddress.value = '';
        }
    }

    _getRemedyLetterText() {
        if (this.letterContent) return this.letterContent;
        
        const currentState = this.appState.getState();
        const { name: userName, address: userAddress } = currentState.userProfile;

        if (!userName || !userAddress) {
            this.utils.setStatus('Please save your name and address in the User Profile section first.', true);
            return null;
        }

        const creditorName = this.tilaCreditorName.value.trim();
        const creditorAddress = this.tilaCreditorAddress.value.trim();

        if (!creditorName || !creditorAddress) {
            this.utils.setStatus('Please enter the creditor name and address.', true);
            return null;
        }

        const details = {
            userName,
            userAddress,
            creditorName,
            creditorAddress,
            contractDate: this.tilaContractDate.value.trim(),
            vehicleInfo: this.tilaVehicleInfo.value.trim(),
            currentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        };

        for (const [key, value] of Object.entries(details)) {
            if (!value) {
                const fieldName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                this.utils.setStatus(`Please fill out the "${fieldName}" field.`, true);
                return null;
            }
        }

        const missingTerms = currentState.tilaMissingTerms || ['required disclosures'];
        const missingTermsString = missingTerms.join(', ');

        const letter = `
${details.userName}
${details.userAddress}

${details.currentDate}

${details.creditorName}
${details.creditorAddress}

VIA CERTIFIED MAIL

RE: NOTICE OF TILA VIOLATIONS AND DEMAND FOR REMEDY
Contract Date: ${details.contractDate}
Vehicle: ${details.vehicleInfo}

To Whom It May Concern:

This letter serves as a formal notice of violations of the Truth in Lending Act (TILA), 15 U.S.C. § 1601 et seq., and its implementing regulation, Regulation Z (12 C.F.R. Part 1026), in the above-referenced consumer credit transaction.

Upon review of the contract dated ${details.contractDate} for the financing of a ${details.vehicleInfo}, it has come to my attention that you have failed to provide clear and conspicuous written disclosures as required by federal law. Specifically, the following material disclosures were found to be missing or inaccurate:

- ${missingTermsString}

TILA § 1638(a) mandates that for each closed-end consumer credit transaction, the creditor shall disclose specific information to the consumer before credit is extended. Your failure to provide these disclosures constitutes a clear violation of your statutory obligations.

This violation grants the consumer the right to remedies, which may include statutory damages and the right of rescission where applicable.

I hereby demand that you remedy this violation immediately by providing a corrected disclosure statement that fully complies with TILA and Regulation Z. Failure to cure these violations within a reasonable timeframe will compel me to seek all available legal remedies, including but not limited to filing a complaint with the Consumer Financial Protection Bureau (CFPB) and pursuing private litigation for damages.

Please govern yourselves accordingly.

Sincerely,

_________________________
${details.userName}
        `.trim();

        this.letterContent = letter;
        return letter;
    }

    generateTilaRemedyLetter() {
        const letterText = this._getRemedyLetterText();
        if (!letterText) return;

        const filename = `TILA_Remedy_Letter_${this.tilaCreditorName.value.trim().replace(/\s/g, '_')}.txt`;
        this.utils.generateDownload(letterText, filename);
        this.utils.logAction('TILA remedy letter generated and downloaded.');
    }

    copyTilaLetter() {
        const letterText = this._getRemedyLetterText();
        if (!letterText) return;

        this.utils.copyToClipboard(letterText, 'TILA remedy letter text copied to clipboard.');
        this.utils.logAction('TILA remedy letter text copied.');
    }

    async validateTilaDisclosures() {
        const currentState = this.appState.getState();
        if (!currentState.vehicleContractFile) {
            this.utils.setStatus('Please upload a vehicle contract first.', true);
            return;
        }

        const formData = new FormData();
        formData.append('file', currentState.vehicleContractFile);

        this.utils.showLoader();
        this.utils.setStatus('Analyzing TILA disclosures...');

        try {
            const response = await fetch('/api/validations/tila', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to validate TILA disclosures.');
            }

            const data = await response.json();
            this.displayTilaResults(data.results);

        } catch (error) {
            console.error('Error validating TILA disclosures:', error);
            this.utils.setStatus(error.message, true);
        } finally {
            this.utils.hideLoader();
        }
    }

    displayTilaResults(results) {
        this.tilaValidationResultsEl.classList.remove('hidden');
        this.tilaResultsListEl.innerHTML = '';
        let missingTerms = [];

        for (const [term, found] of Object.entries(results)) {
            const li = document.createElement('li');
            li.textContent = `${term}: `;
            const statusSpan = document.createElement('span');
            statusSpan.textContent = found ? 'FOUND' : 'MISSING';
            statusSpan.classList.add(found ? 'text-success' : 'text-error');
            li.appendChild(statusSpan);
            this.tilaResultsListEl.appendChild(li);

            if (!found) {
                missingTerms.push(term);
            }
        }

        if (missingTerms.length > 0) {
            this.appState.updateState({ tilaMissingTerms: missingTerms });
            this.utils.setStatus(`Missing TILA disclosures: ${missingTerms.join(', ')}`, true);
            this.remedyDetailsEl.classList.remove('hidden');
        } else {
            this.appState.updateState({ tilaMissingTerms: [] });
            this.utils.setStatus('All required TILA disclosures appear to be present.', false, true);
            this.remedyDetailsEl.classList.add('hidden');
        }
    }

    async scanForTerms() {
        const currentState = this.appState.getState();
        if (!currentState.vehicleContractFile) {
            this.utils.setStatus('Please upload a vehicle contract first.', true);
            return;
        }

        const tag = document.getElementById('violationTags').value;
        const formData = new FormData();
        formData.append('file', currentState.vehicleContractFile);
        formData.append('tag', tag);

        this.utils.showLoader();
        this.scanResultsEl.innerHTML = ''; // Clear previous results

        try {
            const response = await fetch('/api/contracts/analysis', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to scan document.');
            }

            const result = await response.json();
            this.displayScanResults(result.found_clauses, tag);

        } catch (error) {
            console.error('Error scanning document:', error);
            this.utils.setStatus(error.message, true);
        } finally {
            this.utils.hideLoader();
        }
    }

    displayScanResults(clauses, tag) {
        if (clauses.length === 0) {
            this.scanResultsEl.innerHTML = `<p class="text-muted">No clauses containing keywords for "${tag}" were found.</p>`;
            return;
        }

        const resultsHtml = clauses.map(clause => `
            <li class="context-clause">
                <p class="context context-before">${clause.before}</p>
                <blockquote class="context-match">${this.highlightKeywords(clause.match, tag)}</blockquote>
                <p class="context context-after">${clause.after}</p>
            </li>
        `).join('');

        this.scanResultsEl.innerHTML = `
            <h3>Scan Results for "${tag}"</h3>
            <ul class="context-list">${resultsHtml}</ul>
        `;
    }

    highlightKeywords(text, tag) {
        const keywordMap = {
            "hidden_fee": ["convenience fee", "service charge", "processing fee", "undisclosed", "surcharge"],
            "misrepresentation": ["misrepresented", "misleading", "deceptive", "false statement", "inaccurate"],
            "arbitration": ["arbitration", "arbitrator", "binding arbitration", "waive your right to"]
        };
        const keywords = keywordMap[tag] || [];
        let highlightedText = text;
        keywords.forEach(keyword => {
            const regex = new RegExp(`(${keyword})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<strong class="text-error">$1</strong>');
        });
        return highlightedText;
    }

    reset(clearFiles = true) {
        if (clearFiles) {
            this.contractInput.value = '';
            this.appState.updateState({ vehicleContractFile: null });
        }
        this.scanResultsEl.innerHTML = '';
        this.remedyDetailsEl.classList.add('hidden');
        this.tilaValidationResultsEl.classList.add('hidden');
        this.tilaResultsListEl.innerHTML = '';
        this.remedyDetailsEl.querySelectorAll('input').forEach(input => input.value = '');
        this.letterContent = '';
        this.appState.updateState({ tilaMissingTerms: null });
    }
}