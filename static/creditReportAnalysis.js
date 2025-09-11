export class CreditReportAnalysis {
    constructor(appState, knowledgeBase, utils) {
        this.appState = appState;
        this.knowledgeBase = knowledgeBase;
        this.utils = utils;
        this.letterContent = '';

        // DOM Elements
        this.violationSelect = document.getElementById('fcraViolationSelect');
        this.accountInput = document.getElementById('accountNumberInput');
        this.reasonInput = document.getElementById('disputeReasonInput');
        this.generateBtn = document.getElementById('generateDisputeBtn');
        this.copyBtn = document.getElementById('copyFcraLetterBtn');
        this.resultsEl = document.getElementById('fcraResults');

        this.init();
    }

    init() {
        this.populateViolations();
        this.generateBtn.addEventListener('click', () => this.generateDisputeLetter());
        this.copyBtn.addEventListener('click', () => this.copyDisputeLetter());

        // Invalidate cache if details change
        this.accountInput.addEventListener('input', () => { this.letterContent = ''; });
        this.reasonInput.addEventListener('input', () => { this.letterContent = ''; });
        this.violationSelect.addEventListener('change', () => { this.letterContent = ''; });
    }

    populateViolations() {
        const violations = this.knowledgeBase.FCRA.violations;
        for (const key in violations) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = violations[key].summary;
            this.violationSelect.appendChild(option);
        }
    }

    _getDisputeLetterText() {
        if (this.letterContent) return this.letterContent;

        // Pull user info from the central user profile state
        const { name: userName, address: userAddress } = this.appState.getState().userProfile;
        const accountNumber = this.accountInput.value.trim();
        const reason = this.reasonInput.value.trim();
        const violationKey = this.violationSelect.value;

        if (!userName || !userAddress || !accountNumber || !reason) {
            this.utils.setStatus('Please fill out your profile (top of page) and the account details for the dispute.', true);
            return null;
        }

        const violationTemplate = this.knowledgeBase.FCRA.violations[violationKey]?.template || "The information is inaccurate.";

        const letter = `
${userName}
${userAddress}

${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

Equifax Information Services LLC
P.O. Box 740256
Atlanta, GA 30374

Experian
P.O. Box 4500
Allen, TX 75013

TransUnion LLC
Consumer Dispute Center
P.O. Box 2000
Chester, PA 19016

RE: Formal Dispute of Inaccurate Information
Account: ${accountNumber}

To Whom It May Concern:

I am writing to dispute the following information in my file. The item I dispute is: ${accountNumber}.

My reason for dispute is: ${reason}. ${violationTemplate}

Under the Fair Credit Reporting Act (15 U.S.C. § 1681i), I request that you investigate this matter and delete the disputed information from my report. Please provide written confirmation of the results of your investigation.

Sincerely,
${userName}
        `.trim();

        this.letterContent = letter;
        return letter;
    }

    generateDisputeLetter() {
        const letterText = this._getDisputeLetterText();
        if (!letterText) return;
        this.utils.generateDownload(letterText, `FCRA_Dispute_Letter_${this.accountInput.value.trim().replace(/\s/g, '_')}.txt`);
        this.utils.logAction('FCRA dispute letter generated.');
    }

    copyDisputeLetter() {
        const letterText = this._getDisputeLetterText();
        if (!letterText) return;
        this.utils.copyToClipboard(letterText, 'FCRA dispute letter text copied.');
        this.utils.logAction('FCRA dispute letter text copied.');
    }

    reset() {
        this.accountInput.value = '';
        this.reasonInput.value = '';
        this.resultsEl.innerHTML = '';
        this.letterContent = '';
    }
}