class CreditorManagerModule {
    constructor(appState, utils) {
        this.appState = appState;
        this.utils = utils;

        // DOM Elements
        this.nameInput = document.getElementById('newCreditorName');
        this.addressInput = document.getElementById('newCreditorAddress');
        this.addBtn = document.getElementById('addCreditorBtn');
        this.creditorListEl = document.getElementById('creditorList');

        this.init();
    }

    init() {
        this.addBtn.addEventListener('click', () => this.addCreditor());
        this.creditorListEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-creditor-btn')) {
                const id = Number(e.target.dataset.id);
                this.deleteCreditor(id);
            }
        });
        this.renderCreditorList();
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

        this.appState.creditors.push(newCreditor);
        this.saveAndRerender();
        this.utils.logAction(`Creditor added: ${name}`);
        this.nameInput.value = '';
        this.addressInput.value = '';
    }

    deleteCreditor(id) {
        const creditor = this.appState.creditors.find(c => c.id === id);
        if (creditor && confirm(`Are you sure you want to delete ${creditor.name}?`)) {
            this.appState.creditors = this.appState.creditors.filter(c => c.id !== id);
            this.saveAndRerender();
            this.utils.logAction(`Creditor deleted: ${creditor.name}`);
        }
    }

    saveAndRerender() {
        localStorage.setItem('sovereignCreditors', JSON.stringify(this.appState.creditors));
        this.renderCreditorList();
        // Dispatch a global event that other modules can listen to
        document.dispatchEvent(new CustomEvent('creditorsUpdated'));
    }

    renderCreditorList() {
        if (this.appState.creditors.length === 0) {
            this.creditorListEl.innerHTML = '<p class="text-muted">No creditors saved yet.</p>';
            return;
        }

        this.creditorListEl.innerHTML = `<ul>${this.appState.creditors.map(c => `
            <li>
                <div><strong>${c.name}</strong><br><small>${c.address}</small></div>
                <button class="delete-creditor-btn" data-id="${c.id}" title="Delete Creditor">🗑️</button>
            </li>
        `).join('')}</ul>`;
    }
}