import { getDocument } from 'pdfjs-dist/build/pdf.mjs';

export class VehicleFinancingModule {
    constructor(appState, knowledgeBase, utils) {
        this.appState = appState;
        this.knowledgeBase = knowledgeBase;
        this.utils = utils;
        this.letterContent = ''; // To store the generated letter text

        // DOM Elements
        this.contractInput = document.getElementById('vehicleContract');
        this.validateBtn = document.getElementById('validateDisclosureBtn');
        this.scanBtn = document.getElementById('scanContractBtn');
        this.scanResultsEl = document.getElementById('scanResults');
        this.remedyDetailsEl = document.getElementById('tila-remedy-details');

        // TILA Remedy Form Elements
        this.tilaUserName = document.getElementById('tilaUserName');
        this.tilaUserAddress = document.getElementById('tilaUserAddress');
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

        // Clear cached letter content if user modifies the details
        const formInputs = this.remedyDetailsEl.querySelectorAll('input');
        formInputs.forEach(input => input.addEventListener('input', () => { this.letterContent = ''; }));
    }

    _getRemedyLetterText() {
        if (this.letterContent) return this.letterContent;
        
        const currentState = this.appState.getState();
        const { name: userName, address: userAddress } = currentState.userProfile;

        if (!userName || !userAddress) {
            this.utils.setStatus('Please save your name and address in the User Profile section first.', true);
            return null;
        }

        const details = {
            userName: this.tilaUserName.value.trim(),
            userAddress: this.tilaUserAddress.value.trim(),
            creditorName: this.tilaCreditorName.value.trim(),
            creditorAddress: this.tilaCreditorAddress.value.trim(),
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

    async _getPdfText(file) {
        const arrayBuffer = await file.arrayBuffer();
        const typedarray = new Uint8Array(arrayBuffer);
        const pdf = await getDocument(typedarray).promise;
        let textContent = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            textContent += text.items.map(s => s.str).join(' ');
        }
        return textContent.toLowerCase();
    }

    async validateTilaDisclosures() {
        const currentState = this.appState.getState();
        if (!currentState.vehicleContractFile) {
            this.utils.setStatus('Please upload a vehicle contract first.', true);
            return;
        }
        this.utils.setStatus('Analyzing TILA disclosures...');
        const pdfText = await this._getPdfText(currentState.vehicleContractFile);
        if (!pdfText) return;

        // This is a simplified check. A real implementation would be more robust.
        const requiredTerms = ['annual percentage rate', 'finance charge', 'amount financed', 'total of payments'];
        const missing = requiredTerms.filter(term => !pdfText.includes(term));

        if (missing.length > 0) {
            this.appState.updateState({ tilaMissingTerms: missing });
            this.utils.setStatus(`Missing TILA disclosures: ${missing.join(', ')}`, true);
            this.remedyDetailsEl.classList.remove('hidden');
        } else {
            this.appState.updateState({ tilaMissingTerms: [] });
            this.utils.setStatus('All required TILA disclosures appear to be present.', false, true);
            this.remedyDetailsEl.classList.add('hidden');
        }
    }

    async scanForTerms() {
        this.utils.setStatus('Scanning for terms... (functionality to be implemented)');
    }

    reset(clearFiles = true) {
        if (clearFiles) {
            this.contractInput.value = '';
            this.appState.updateState({ vehicleContractFile: null });
        }
        this.scanResultsEl.innerHTML = '';
        this.remedyDetailsEl.classList.add('hidden');
        this.remedyDetailsEl.querySelectorAll('input').forEach(input => input.value = '');
        this.letterContent = '';
        this.appState.updateState({ tilaMissingTerms: null });
    }
}
