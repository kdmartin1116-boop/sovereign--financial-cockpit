import { CONSTANTS } from './constants.js';

export class CreditorManager {
    constructor(appState, utils) {
        this.appState = appState;
        this.utils = utils;

        // DOM Elements
        this.nameInput = document.getElementById('newCreditorName');
        this.addressInput = document.getElementById('newCreditorAddress');
        this.addBtn = document.getElementById('addCreditorBtn');
        this.exportBtn = document.getElementById('exportCreditorsBtn'); // New Button
        this.creditorListEl = document.getElementById('creditorList');

        this.init();
    }

    init() {
        this.addBtn.addEventListener('click', () => this.addCreditor());
        this.exportBtn.addEventListener('click', () => this.exportCreditors()); // New Listener
        this.creditorListEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-creditor-btn')) {
                const id = Number(e.target.dataset.id);
                this.deleteCreditor(id);
            }
        });
        this.renderCreditorList();
    }

    exportCreditors() {
        const creditors = this.appState.getState().creditors;
        if (creditors.length === 0) {
            this.utils.setStatus('No creditors to export.', true);
            return;
        }

        const creditorsJson = JSON.stringify(creditors, null, 2);
        this.utils.generateDownload(creditorsJson, 'creditors.json', 'application/json');
        this.utils.logAction('Creditors exported.');
    }

    getCreditors() {
        return this.appState.getState().creditors;
    }

    addCreditor() {
        const name = this.nameInput.value.trim();
        const address = this.addressInput.value.trim();

        if (!name || !address) {
            this.utils.setStatus('Please enter both a name and address for the creditor.', true);
            return;
        }

        const newCreditor = {
            id: Date.now(),
            name,
            address
        };

        const currentState = this.appState.getState();
        const updatedCreditors = [...currentState.creditors, newCreditor];
        this.appState.updateState({ creditors: updatedCreditors });
        
        this.saveAndRerender();
        this.utils.logAction(`Creditor added: ${name}`);
        this.nameInput.value = '';
        this.addressInput.value = '';
    }

    deleteCreditor(id) {
        const currentState = this.appState.getState();
        const creditor = currentState.creditors.find(c => c.id === id);
        if (creditor && confirm(`Are you sure you want to delete ${creditor.name}?`)) {
            const updatedCreditors = currentState.creditors.filter(c => c.id !== id);
            this.appState.updateState({ creditors: updatedCreditors });
            this.saveAndRerender();
            this.utils.logAction(`Creditor deleted: ${creditor.name}`);
        }
    }

    saveAndRerender() {
        const currentState = this.appState.getState();
        localStorage.setItem(CONSTANTS.LOCAL_STORAGE.CREDITORS, JSON.stringify(currentState.creditors));
        this.renderCreditorList();
        document.dispatchEvent(new CustomEvent('creditorsUpdated'));
    }

    renderCreditorList() {
        const currentState = this.appState.getState();
        if (currentState.creditors.length === 0) {
            this.creditorListEl.innerHTML = '<p class="text-muted">No creditors saved yet.</p>';
            return;
        }

        this.creditorListEl.innerHTML = `<ul>${currentState.creditors.map(c => `
            <li>
                <div><strong>${c.name}</strong><br><small>${c.address}</small></div>
                <button class="delete-creditor-btn" data-id="${c.id}" title="Delete Creditor">🗑️</button>
            </li>
        `).join('')}</ul>`;
    }
}