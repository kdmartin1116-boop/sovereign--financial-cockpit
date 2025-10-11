export class PromiseToPayModule {
    constructor(appState, utils, creditorManager) {
        this.appState = appState;
        this.utils = utils;
        this.creditorManager = creditorManager;
        this.letterData = null; // To hold data for confirmation
        this.init();
    }

    init() {
        // Form elements
        this.creditorSelect = document.getElementById('ptpCreditorSelect');
        this.creditorNameInput = document.getElementById('ptpCreditorName');
        this.creditorAddressInput = document.getElementById('ptpCreditorAddress');
        this.accountNumberInput = document.getElementById('ptpAccountNumber');
        this.promiseAmountInput = document.getElementById('ptpPromiseAmount');
        this.promiseDateInput = document.getElementById('ptpPromiseDate');
        this.generateBtn = document.getElementById('generatePtpLetterBtn');
        this.letterContainer = document.getElementById('ptpLetterContainer');
        this.letterTextarea = document.getElementById('ptpLetterText');
        this.copyBtn = document.getElementById('copyPtpLetterBtn');
        this.downloadBtn = document.getElementById('downloadPtpLetterBtn');

        // Modal elements
        this.modal = document.getElementById('confirmationModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalDetails = document.getElementById('modalDetails');
        this.modalConfirmBtn = document.getElementById('modalConfirmBtn');
        this.modalCancelBtn = document.getElementById('modalCancelBtn');

        this.populateCreditors();
        this.setupEventListeners();
        document.addEventListener('creditorsUpdated', () => this.populateCreditors());
    }

    populateCreditors() {
        const creditors = this.creditorManager.getCreditors();
        this.creditorSelect.innerHTML = '<option value="">Select a Creditor</option>';
        creditors.forEach(creditor => {
            const option = document.createElement('option');
            option.value = creditor.id;
            option.textContent = creditor.name;
            this.creditorSelect.appendChild(option);
        });
    }

    setupEventListeners() {
        this.generateBtn.addEventListener('click', () => this.showConfirmation());
        this.copyBtn.addEventListener('click', () => this.utils.copyToClipboard(this.letterTextarea.value, 'Promise to Pay letter copied!'));
        this.downloadBtn.addEventListener('click', () => this.utils.generateDownload(this.letterTextarea.value, 'promise_to_pay_letter.txt'));
        this.creditorSelect.addEventListener('change', () => this.handleCreditorSelect());
        
        // Modal listeners
        this.modalCancelBtn.addEventListener('click', () => this.hideModal());
    }

    handleCreditorSelect() {
        const creditorId = this.creditorSelect.value;
        if (creditorId) {
            const creditor = this.creditorManager.getCreditors().find(c => c.id == creditorId);
            if (creditor) {
                this.creditorNameInput.value = creditor.name;
                this.creditorAddressInput.value = creditor.address;
            }
        } else {
            this.creditorNameInput.value = '';
            this.creditorAddressInput.value = '';
        }
    }

    showConfirmation() {
        const userProfile = this.appState.getState().userProfile;
        if (!userProfile.name || !userProfile.address) {
            this.utils.setStatus('Please save your user profile information first.', true);
            return;
        }

        const creditorName = this.creditorNameInput.value.trim();
        const creditorAddress = this.creditorAddressInput.value.trim();
        const accountNumber = this.accountNumberInput.value.trim();
        const promiseAmount = this.promiseAmountInput.value;
        const promiseDate = this.promiseDateInput.value;

        if (!creditorName || !creditorAddress || !accountNumber || !promiseAmount || !promiseDate) {
            this.utils.setStatus('Please fill in all fields for the letter.', true);
            return;
        }

        this.letterData = {
            userName: userProfile.name,
            userAddress: userProfile.address,
            creditorName,
            creditorAddress,
            accountNumber,
            promiseAmount,
            promiseDate
        };

        // Populate and show the modal
        this.modalTitle.textContent = 'Confirm Promise to Pay';
        this.modalDetails.innerHTML = `
            <p><strong>To:</strong> ${this.letterData.creditorName}</p>
            <p><strong>Account:</strong> ${this.letterData.accountNumber}</p>
            <p><strong>Amount:</strong> $${this.letterData.promiseAmount}</p>
            <p><strong>Payment Date:</strong> ${new Date(this.letterData.promiseDate).toLocaleDateString()}</p>
        `;
        
        // Set up a one-time listener for the confirm button
        this.modalConfirmBtn.onclick = () => this.handleGenerateLetter();

        this.modal.classList.remove('hidden');
    }

    hideModal() {
        this.modal.classList.add('hidden');
        this.modalConfirmBtn.onclick = null; // Clean up the one-time listener
        this.letterData = null;
    }

    async handleGenerateLetter() {
        if (!this.letterData) return;

        const dataToSend = this.letterData; // Copy data before clearing

        this.utils.showLoader();
        this.hideModal();

        try {
            const response = await fetch('/api/letters', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'promise_to_pay',
                    data: dataToSend
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate letter.');
            }

            const result = await response.json();
            this.letterTextarea.value = result.letterContent;
            this.letterContainer.classList.remove('hidden');
            this.utils.setStatus('Promise to Pay letter generated successfully.', false, true);

            // --- Automatic Logging ---
            const logMessage = `Generated Promise to Pay letter for ${dataToSend.creditorName} for ${dataToSend.promiseAmount}.`;
            this.utils.logAction(logMessage);

        } catch (error) {
            console.error('Error generating letter:', error);
            this.utils.setStatus(error.message, true);
        } finally {
            this.utils.hideLoader();
        }
    }
}