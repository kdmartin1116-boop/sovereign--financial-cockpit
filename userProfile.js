class UserProfileModule {
    constructor(appState, utils) {
        this.appState = appState;
        this.utils = utils;

        // DOM Elements
        this.userNameInput = document.getElementById('profileUserName');
        this.userAddressInput = document.getElementById('profileUserAddress');
        this.saveBtn = document.getElementById('saveProfileBtn');

        this.init();
    }

    init() {
        this.loadProfile();
        this.saveBtn.addEventListener('click', () => this.saveProfile());
    }

    loadProfile() {
        const profile = this.appState.userProfile;
        if (profile) {
            this.userNameInput.value = profile.name || '';
            this.userAddressInput.value = profile.address || '';
        }
    }

    saveProfile() {
        const name = this.userNameInput.value.trim();
        const address = this.userAddressInput.value.trim();

        if (!name || !address) {
            this.utils.setStatus('Please enter both your name and address.', true);
            return;
        }

        this.appState.userProfile = { name, address };
        localStorage.setItem('userProfile', JSON.stringify(this.appState.userProfile));
        this.utils.setStatus('User profile saved successfully.', false, true);
        this.utils.logAction('User profile updated.');
    }
}