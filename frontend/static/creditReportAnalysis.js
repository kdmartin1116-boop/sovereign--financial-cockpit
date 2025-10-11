import { CreditReportVisualizer } from './creditReportVisualizer.js';

export class CreditReportAnalysis {
    constructor(appState, knowledgeBase, utils, creditorManager) {
        this.appState = appState;
        this.knowledgeBase = knowledgeBase;
        this.utils = utils;
        this.creditorManager = creditorManager;
        this.visualizer = new CreditReportVisualizer();
        this.letterContent = '';

        // DOM Elements
        this.creditReportUpload = document.getElementById('creditReportUpload');
        this.parseReportBtn = document.getElementById('parseReportBtn');
        this.generateSampleReportBtn = document.getElementById('generateSampleReportBtn'); // New Button
        this.parsedAccountsDiv = document.getElementById('parsed-accounts');
        this.parsedAccountsList = document.getElementById('parsed-accounts-list');
        this.violationSelect = document.getElementById('fcraViolationSelect');
        this.fcraCreditorSelect = document.getElementById('fcraCreditorSelect');
        this.fcraViolationInfo = document.getElementById('fcraViolationInfo');
        this.fcraViolationDetails = document.getElementById('fcraViolationDetails');
        this.accountInput = document.getElementById('accountNumberInput');
        this.reasonInput = document.getElementById('disputeReasonInput');
        this.generateBtn = document.getElementById('generateDisputeBtn');
        this.copyBtn = document.getElementById('copyFcraLetterBtn');
        this.trackDisputeBtn = document.getElementById('trackDisputeBtn');
        this.disputeTrackingTable = document.getElementById('dispute-tracking-table');
        this.selectCreditorBtn = document.getElementById('selectCreditorBtn');
        this.resultsEl = document.getElementById('fcraResults');

        // Modal Elements
        this.confirmationModal = document.getElementById('confirmationModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalBody = document.getElementById('modalBody');
        this.modalConfirmBtn = document.getElementById('modalConfirmBtn');
        this.modalCancelBtn = document.getElementById('modalCancelBtn');

        this.init();
    }

    init() {
        this.populateViolations();
        this.populateCreditors();
        this.generateBtn.addEventListener('click', () => this.generateDisputeLetter());
        this.copyBtn.addEventListener('click', () => this.copyDisputeLetter());
        this.parseReportBtn.addEventListener('click', () => this.parseReport());
        this.generateSampleReportBtn.addEventListener('click', () => this.generateSampleReport()); // New Listener
        this.trackDisputeBtn.addEventListener('click', () => this.trackDispute());
        this.selectCreditorBtn.addEventListener('click', () => this.showCreditorSelection());
        this.fcraViolationInfo.addEventListener('click', () => this.toggleViolationDetails());
        this.loadDisputes();

        // Invalidate cache if details change
        this.accountInput.addEventListener('input', () => { this.letterContent = ''; });
        this.reasonInput.addEventListener('input', () => { this.letterContent = ''; });
        this.violationSelect.addEventListener('change', () => { 
            this.letterContent = '';
            this.fcraViolationDetails.classList.add('hidden'); // Hide details when selection changes
        });

        // Modal event listener
        this.modalCancelBtn.addEventListener('click', () => this.confirmationModal.classList.add('hidden'));
        document.addEventListener('creditorsUpdated', () => this.populateCreditors());
    }

    generateSampleReport() {
        const sampleAccounts = [
            {
                name: "Capital One",
                number: "**** **** **** 1234",
                type: "Credit Card",
                status: "Open",
                balance: "$1,500.00",
                credit_limit: "$5,000.00",
                payment_history: "On Time"
            },
            {
                name: "Wells Fargo",
                number: "**** **** **** 5678",
                type: "Auto Loan",
                status: "Open",
                balance: "$15,000.00",
                credit_limit: "N/A",
                payment_history: "On Time"
            },
            {
                name: "Bank of America",
                number: "**** **** **** 9012",
                type: "Credit Card",
                status: "Open",
                balance: "$800.00",
                credit_limit: "$2,000.00",
                payment_history: "On Time"
            },
            {
                name: "Student Loan Servicing",
                number: "**** **** **** 3456",
                type: "Student Loan",
                status: "Open",
                balance: "$25,000.00",
                credit_limit: "N/A",
                payment_history: "On Time"
            },
            {
                name: "Discover",
                number: "**** **** **** 7890",
                type: "Credit Card",
                status: "Closed",
                balance: "$0.00",
                credit_limit: "$3,000.00",
                payment_history: "On Time"
            }
        ];
        this.displayAccounts(sampleAccounts);
        this.utils.setStatus('Sample credit report generated.', false, true);
    }

    populateCreditors() {
        const creditors = this.creditorManager.getCreditors();
        this.fcraCreditorSelect.innerHTML = '<option value="">Select a Creditor</option>';
        creditors.forEach(creditor => {
            const option = document.createElement('option');
            option.value = creditor.id;
            option.textContent = creditor.name;
            this.fcraCreditorSelect.appendChild(option);
        });
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

    toggleViolationDetails() {
        if (this.fcraViolationDetails.classList.contains('hidden')) {
            const selectedViolationKey = this.violationSelect.value;
            const violation = this.knowledgeBase.FCRA.violations[selectedViolationKey];
            if (violation) {
                this.fcraViolationDetails.innerHTML = `
                    <h4>${violation.summary}</h4>
                    <p>${violation.description}</p>
                    <p><strong>Legal Basis:</strong> ${violation.legalBasis}</p>
                `;
                this.fcraViolationDetails.classList.remove('hidden');
            }
        } else {
            this.fcraViolationDetails.classList.add('hidden');
        }
    }

    async parseReport() {
        const file = this.creditReportUpload.files[0];
        if (!file) {
            this.utils.setStatus('Please select a credit report file to upload.', true);
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        this.utils.showLoader();

        try {
            const response = await fetch('/api/credit-report/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                this.displayAccounts(data.accounts);
            } else {
                const errorData = await response.json();
                this.utils.setStatus(`Error parsing report: ${errorData.error}`, true);
            }
        } catch (error) {
            console.error('Failed to parse report:', error);
            this.utils.setStatus('An error occurred while parsing the report.', true);
        } finally {
            this.utils.hideLoader();
        }
    }

    displayAccounts(accounts) {
        this.parsedAccountsDiv.classList.remove('hidden');
        this.parsedAccountsList.innerHTML = '';

        if (accounts.length === 0) {
            this.parsedAccountsList.innerHTML = '<p>No accounts found in the report.</p>';
            return;
        }

        const accountCards = accounts.map(account => `
            <div class="account-card">
                <div class="account-header">
                    <h3>${account.name}</h3>
                    <button class="start-dispute-btn" data-name="${account.name}" data-number="${account.number}">Start Dispute</button>
                </div>
                <div class="account-details">
                    <p><strong>Account Number:</strong> ${account.number}</p>
                    <p><strong>Type:</strong> ${account.type}</p>
                    <p><strong>Status:</strong> ${account.status}</p>
                    <p><strong>Balance:</strong> ${account.balance}</p>
                    <p><strong>Credit Limit:</strong> ${account.credit_limit}</p>
                    <p><strong>Payment History:</strong> ${account.payment_history}</p>
                </div>
            </div>
        `).join('');

        this.parsedAccountsList.innerHTML = accountCards;
        this.visualizer.createCharts(accounts);

        document.querySelectorAll('.start-dispute-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const name = e.target.dataset.name;
                const number = e.target.dataset.number;
                this.populateDisputeForm(name, number);
            });
        });
    }

    populateDisputeForm(name, number) {
        this.accountInput.value = `${name} - ${number}`;

        const creditors = this.creditorManager.getCreditors();
        const accountNameLower = name.toLowerCase();
        const matchedCreditor = creditors.find(c => accountNameLower.includes(c.name.toLowerCase()));

        if (matchedCreditor) {
            this.fcraCreditorSelect.value = matchedCreditor.id;
        }

        const disputeForm = document.getElementById('dispute-form');
        if (disputeForm) {
            disputeForm.scrollIntoView({ behavior: 'smooth' });
        }
    }

    async trackDispute() {
        const accountInfo = this.accountInput.value.trim();
        if (!accountInfo) {
            this.utils.setStatus('Please enter account information before tracking a dispute.', true);
            return;
        }

        const [account_name, account_number] = accountInfo.split(' - ');

        try {
            const response = await fetch('/api/disputes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ account_name, account_number }),
            });

            if (response.ok) {
                this.utils.setStatus('Dispute tracked successfully.', false, true);
                this.loadDisputes();
            } else {
                const errorData = await response.json();
                this.utils.setStatus(`Error tracking dispute: ${errorData.error}`, true);
            }
        } catch (error) {
            console.error('Failed to track dispute:', error);
            this.utils.setStatus('An error occurred while tracking the dispute.', true);
        }
    }

    async loadDisputes() {
        try {
            const response = await fetch('/api/disputes');
            if (response.ok) {
                const disputes = await response.json();
                this.displayDisputes(disputes);
            } else {
                this.utils.setStatus('Could not load disputes from server.', true);
            }
        } catch (error) {
            console.error('Failed to load disputes:', error);
            this.utils.setStatus('An error occurred while loading disputes.', true);
        }
    }

    displayDisputes(disputes) {
        this.appState.updateState({ disputes: disputes }); // Update app state
        document.dispatchEvent(new CustomEvent('disputesUpdated')); // Dispatch event
        this.disputeTrackingTable.innerHTML = '';

        if (disputes.length === 0) {
            this.disputeTrackingTable.innerHTML = '<p>No disputes tracked yet.</p>';
            return;
        }

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Account Name</th>
                    <th>Account Number</th>
                    <th>Date Sent</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${disputes.map(dispute => `
                    <tr>
                        <td>${dispute.account_name}</td>
                        <td>${dispute.account_number}</td>
                        <td>${dispute.date_sent}</td>
                        <td>
                            <select class="dispute-status-select" data-id="${dispute.id}">
                                <option value="Sent" ${dispute.status === 'Sent' ? 'selected' : ''}>Sent</option>
                                <option value="Responded" ${dispute.status === 'Responded' ? 'selected' : ''}>Responded</option>
                                <option value="Resolved" ${dispute.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                            </select>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;

        this.disputeTrackingTable.appendChild(table);

        document.querySelectorAll('.dispute-status-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const status = e.target.value;
                this.updateDisputeStatus(id, status);
            });
        });
    }

    async updateDisputeStatus(id, status) {
        try {
            const response = await fetch(`/api/disputes/${id}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            });

            if (response.ok) {
                this.utils.setStatus('Dispute status updated successfully.', false, true);
            } else {
                const errorData = await response.json();
                this.utils.setStatus(`Error updating dispute status: ${errorData.error}`, true);
            }
        } catch (error) {
            console.error('Failed to update dispute status:', error);
            this.utils.setStatus('An error occurred while updating the dispute status.', true);
        }
    }

    showCreditorSelection() {
        const creditors = this.appState.getState().creditors;
        this.modalTitle.textContent = 'Select a Creditor';
        this.modalConfirmBtn.classList.add('hidden'); // Hide confirm button

        if (creditors.length === 0) {
            this.modalBody.innerHTML = '<p>No creditors saved yet. Please add some in the Creditors tab.</p>';
        } else {
            const ul = document.createElement('ul');
            ul.style.listStyle = 'none';
            ul.style.padding = '0';
            creditors.forEach(creditor => {
                const li = document.createElement('li');
                li.style.marginBottom = '10px';
                li.innerHTML = `
                    <div><strong>${creditor.name}</strong><br><small>${creditor.address}</small></div>
                    <button class="select-creditor-btn" data-name="${creditor.name}" data-address="${creditor.address}">Select</button>
                `;
                ul.appendChild(li);
            });
            this.modalBody.innerHTML = '';
            this.modalBody.appendChild(ul);

            document.querySelectorAll('.select-creditor-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const name = e.target.dataset.name;
                    const address = e.target.dataset.address;
                    this.populateDisputeForm(`${name} - ${address}`, ''); // Populate account number with name and address
                    this.confirmationModal.classList.add('hidden');
                });
            });
        }

        this.confirmationModal.classList.remove('hidden');
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
        this.creditReportUpload.value = '';
        this.parsedAccountsDiv.classList.add('hidden');
        this.parsedAccountsList.innerHTML = '';
        this.visualizer.destroyCharts();
    }
}