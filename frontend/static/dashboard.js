export class Dashboard {
    constructor(appState) {
        this.appState = appState;

        // DOM Elements
        this.totalCreditorsEl = document.getElementById('stats-total-creditors');
        this.fdcpaViolationsEl = document.getElementById('stats-fdcpa-violations');
        this.activeDisputesEl = document.getElementById('stats-active-disputes');

        this.init();
    }

    init() {
        this.updateStats();
        document.addEventListener('creditorsUpdated', () => this.updateStats());
        document.addEventListener('fdcpaLogUpdated', () => this.updateStats());
        document.addEventListener('disputesUpdated', () => this.updateStats());
    }

    updateStats() {
        const state = this.appState.getState();
        
        this.totalCreditorsEl.textContent = state.creditors.length;
        this.fdcpaViolationsEl.textContent = state.fdcpaLog.length;
        
        const activeDisputes = state.disputes.filter(d => d.status.toLowerCase() !== 'resolved').length;
        this.activeDisputesEl.textContent = activeDisputes;
    }
}
