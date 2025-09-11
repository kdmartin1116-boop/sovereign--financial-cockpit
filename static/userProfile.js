import { CONSTANTS } from './constants.js';

export class UserProfile {
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
        const profile = this.appState.getState().userProfile;
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

        this.appState.updateState({ userProfile: { name, address } });
        localStorage.setItem(CONSTANTS.LOCAL_STORAGE.USER_PROFILE, JSON.stringify({ name, address }));
        this.utils.setStatus('User profile saved successfully.', false, true);
        this.utils.logAction('User profile updated.');
    }
}
