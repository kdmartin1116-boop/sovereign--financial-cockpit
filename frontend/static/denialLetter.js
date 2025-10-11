export class DenialLetter {
    constructor(appState, knowledgeBase, utils) {
        this.appState = appState;
        this.knowledgeBase = knowledgeBase;
        this.utils = utils;

        // DOM Elements
        this.uploadInput = document.getElementById('denialLetterUpload');
        this.analyzeBtn = document.getElementById('analyzeDenialBtn');
        this.analysisResultsEl = document.getElementById('denial-analysis-results');
        this.denialReasonEl = document.getElementById('denialReason');
        this.detailsFieldset = document.getElementById('denial-details-fieldset');
        this.responseOptionsEl = document.getElementById('denial-response-options');
        this.letterOutputEl = document.getElementById('denial-letter-output');
        this.letterTextEl = document.getElementById('denialLetterText');

        // New Input Fields
        this.creditorNameInput = document.getElementById('denialCreditorName');
        this.creditorAddressInput = document.getElementById('denialCreditorAddress');
        this.denialDateInput = document.getElementById('denialDate');
        this.loanTypeInput = document.getElementById('denialLoanType');

        // Letter Generation Buttons
        this.genReconBtn = document.getElementById('generateReconsiderationBtn');
        this.genFcraBtn = document.getElementById('generateFcraDisputeBtn');

        // Letter Action Buttons
        this.copyBtn = document.getElementById('copyDenialLetterBtn');
        this.downloadBtn = document.getElementById('downloadDenialLetterBtn');
        
        // Input fields for letters
        this.reconInputs = document.getElementById('reconsideration-inputs');
        this.fcraInputs = document.getElementById('fcra-dispute-inputs');
        this.reconNote = document.getElementById('reconsiderationNote');
        this.fcraItem = document.getElementById('fcraDisputeItem');

        this.init();
    }

    init() {
        this.uploadInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.appState.updateState({ denialLetterFile: e.target.files[0] });
                this.utils.logAction('Denial letter uploaded.');
            }
        });
        this.analyzeBtn.addEventListener('click', () => this.analyzeDenialLetter());
        this.genReconBtn.addEventListener('click', () => this.generateReconsiderationLetter());
        this.genFcraBtn.addEventListener('click', () => this.generateFcraDisputeLetter());
        this.copyBtn.addEventListener('click', () => this.copyLetter());
        this.downloadBtn.addEventListener('click', () => this.downloadLetter());
    }

    async analyzeDenialLetter() {
        const { denialLetterFile } = this.appState.getState();
        if (!denialLetterFile) {
            this.utils.setStatus('Please upload a denial letter first.', true);
            return;
        }

        this.utils.showLoader();
        this.utils.setStatus('Analyzing denial letter...', false);

        try {
            const text = await this.utils.extractTextFromPdf(denialLetterFile);
            if (!text) return;

            const lowerCaseText = text.toLowerCase();
            let reasonFound = 'unknown';

            for (const reason in this.knowledgeBase.DenialReasons) {
                const { keywords } = this.knowledgeBase.DenialReasons[reason];
                if (keywords.some(keyword => lowerCaseText.includes(keyword))) {
                    reasonFound = reason;
                    break;
                }
            }
            
            const reasonSummary = this.knowledgeBase.DenialReasons[reasonFound]?.summary || 'Could not determine reason.';
            this.appState.updateState({ denialReason: reasonFound });
            this.denialReasonEl.textContent = reasonSummary;
            this.analysisResultsEl.classList.remove('hidden');
            this.responseOptionsEl.classList.remove('hidden');
            this.utils.setStatus('Analysis complete. Please choose a response type.', false, true);
            this.utils.logAction(`Denial reason identified: ${reasonSummary}`);

        } catch (error) {
            console.error('Error analyzing denial letter:', error);
            this.utils.setStatus('Failed to analyze the denial letter.', true);
        } finally {
            this.utils.hideLoader();
        }
    }

    generateReconsiderationLetter() {
        const { userProfile } = this.appState.getState();
        if (!userProfile || !userProfile.name || !userProfile.address) {
            this.utils.setStatus('Please complete your user profile first.', true);
            return;
        }

        const personalNote = this.reconNote.value;
        const letter = `
[Your Name]
[Your Address]
[Your Phone Number]
[Your Email]

[Date]

[Creditor Name]
[Creditor Address]

Subject: Letter of Reconsideration

To Whom It May Concern,

I am writing to request a reconsideration of my recent application for [Credit Card Name or Loan Type], which was denied on [Date of Denial].

I was disappointed to learn of your decision, and I would appreciate it if you would take a moment to review my application again. 

${personalNote ? `Specifically, I would like to bring to your attention that: ${personalNote}` : 'I believe I am a strong candidate and would be a responsible customer.'}

Thank you for your time and consideration. I look forward to hearing from you soon.

Sincerely,
${userProfile.name}
        `.trim();

        this.letterTextEl.value = letter;
        this.letterOutputEl.classList.remove('hidden');
        this.reconInputs.classList.remove('hidden');
        this.fcraInputs.classList.add('hidden');
        this.utils.setStatus('Reconsideration letter generated.', false, true);
    }

    generateFcraDisputeLetter() {
        const { userProfile, denialReason } = this.appState.getState();
        if (!userProfile || !userProfile.name || !userProfile.address) {
            this.utils.setStatus('Please complete your user profile first.', true);
            return;
        }

        const disputeItem = this.fcraItem.value;
        if (!disputeItem) {
            this.utils.setStatus('Please specify the item you wish to dispute.', true);
            return;
        }

        const reasonSummary = this.knowledgeBase.DenialReasons[denialReason]?.summary || 'the information in my credit report';

        const letter = `
[Your Name]
[Your Address]
[Your Phone Number]
[Your Email]

[Date]

[Creditor Name]
[Creditor Address]

Subject: Formal Dispute of Information Leading to Credit Denial

To Whom It May Concern,

I am writing to dispute information that led to the denial of my application for [Credit Card Name or Loan Type], as communicated to me in your letter dated [Date of Denial].

Your decision was based on ${reasonSummary}. I believe this is inaccurate. Specifically, I am disputing the following item:
${disputeItem}

Under the Fair Credit Reporting Act (FCRA), I am requesting that you investigate this matter and provide me with the results of your investigation.

Please provide me with a copy of the credit report you used to make your decision, and if you are unable to verify the accuracy of the disputed information, I request that you remove it from my file and reconsider my application.

Thank you for your prompt attention to this matter.

Sincerely,
${userProfile.name}
        `.trim();

        this.letterTextEl.value = letter;
        this.letterOutputEl.classList.remove('hidden');
        this.fcraInputs.classList.remove('hidden');
        this.reconInputs.classList.add('hidden');
        this.utils.setStatus('FCRA dispute letter generated.', false, true);
    }

    copyLetter() {
        this.utils.copyToClipboard(this.letterTextEl.value, 'Letter copied to clipboard.');
    }

    downloadLetter() {
        this.utils.generateDownload(this.letterTextEl.value, 'denial_response_letter.txt');
    }

    reset() {
        this.uploadInput.value = '';
        this.appState.updateState({ denialLetterFile: null, denialReason: null });
        this.analysisResultsEl.classList.add('hidden');
        this.responseOptionsEl.classList.add('hidden');
        this.letterOutputEl.classList.add('hidden');
        this.reconInputs.classList.add('hidden');
        this.fcraInputs.classList.add('hidden');
        this.letterTextEl.value = '';
        this.reconNote.value = '';
        this.fcraItem.value = '';
    }
}
