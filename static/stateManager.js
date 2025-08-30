export class StateManager {
    constructor() {
        this.state = this._getInitialState();
    }

    _getInitialState() {
        const savedCreditors = JSON.parse(localStorage.getItem('sovereign-creditors')) || [];
        const savedFdcpaLog = JSON.parse(localStorage.getItem('sovereign-fdcpa-log')) || [];
        const savedHistory = JSON.parse(localStorage.getItem('sovereign-instrument-history')) || [];
        const savedProfile = JSON.parse(localStorage.getItem('sovereign-user-profile')) || { name: '', address: '' };

        return {
            pdfPage: null,
            endorsement: { text: null, x: 0, y: 0 },
            userProfile: savedProfile,
            creditors: savedCreditors,
            history: savedHistory,
            loopState: 'intake', // intake, validate, remedy, log, reflect
            validationResults: { found: [], missing: [] },
            uccValidationResults: { passed: [], failed: [] },
            fdcpaLog: savedFdcpaLog,
            vehicleContractFile: null,
            tilaMissingTerms: null,
            denialLetterFile: null,
            denialReason: null,
        };
    }

    getState() {
        return this.state;
    }

    updateState(newState) {
        this.state = { ...this.state, ...newState };
    }

    resetState() {
        localStorage.removeItem('sovereign-creditors');
        localStorage.removeItem('sovereign-fdcpa-log');
        localStorage.removeItem('sovereign-instrument-history');
        localStorage.removeItem('sovereign-user-profile');
        this.state = this._getInitialState();
    }
}
