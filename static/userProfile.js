import { CONSTANTS } from './constants.js';

export class UserProfile {
    constructor(appState, utils, creditorManager) {
        this.appState = appState;
        this.utils = utils;
        this.creditorManager = creditorManager; // Also ensure creditorManager is passed and stored

        // DOM Elements
        this.userNameInput = document.getElementById('profileUserName');
        this.userAddressInput = document.getElementById('profileUserAddress');
        this.userEmailInput = document.getElementById('profileUserEmail');
        this.userPhoneInput = document.getElementById('profileUserPhone');
        this.saveBtn = document.getElementById('saveProfileBtn');
        this.exportBtn = document.getElementById('exportProfileBtn'); // New Button
        this.statusDiv = document.getElementById('profile-status');

        this.init();
    }

    init() {
        this.loadProfile();
        this.saveBtn.addEventListener('click', () => this.saveProfile());
        this.exportBtn.addEventListener('click', () => this.exportProfile()); // New Listener
    }

    exportProfile() {
        const profile = this.appState.getState().userProfile;
        if (!profile || (!profile.name && !profile.address && !profile.email && !profile.phone)) {
            this.utils.setStatus('No profile data to export.', true);
            return;
        }

        const profileJson = JSON.stringify(profile, null, 2);
        this.utils.generateDownload(profileJson, 'user_profile.json', 'application/json');
        this.utils.logAction('User profile exported.');
    }

    async loadProfile() {
        try {
            // Check authentication status first
            const authStatusResponse = await fetch('/api/status');
            const authStatus = await authStatusResponse.json();

            if (!authStatus.is_authenticated) {
                console.log('User not authenticated. Profile not loaded.');
                this.utils.setStatus('Please log in to view your profile.', false);
                // Show the authentication modal
                // Assuming showAuthModal is a global function or accessible via utils
                console.log('userProfile.js: Checking this.utils.showAuthModal:', this.utils.showAuthModal); // New debug log
                if (typeof this.utils.showAuthModal === 'function') {
                    console.log('Calling showAuthModal from userProfile.js via utils'); // Updated log
                    this.utils.showAuthModal();
                } else {
                    console.error('showAuthModal function not found in utils. Cannot display login prompt.');
                }
                return;
            }

            const response = await fetch('/api/profile');
            if (response.ok) {
                const profile = await response.json();
                if (profile) {
                    this.userNameInput.value = profile.name || '';
                    this.userAddressInput.value = profile.address || '';
                    this.userEmailInput.value = profile.email || '';
                    this.userPhoneInput.value = profile.phone || '';
                    this.appState.updateState({ userProfile: profile });
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to load profile.');
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
            this.utils.setStatus(`Could not load profile from server: ${error.message}`, true);
        }
    }

    async saveProfile() {
        const name = this.userNameInput.value.trim();
        const address = this.userAddressInput.value.trim();
        const email = this.userEmailInput.value.trim();
        const phone = this.userPhoneInput.value.trim();

        if (!name || !address) {
            this.utils.setStatus('Please enter both your name and address.', true);
            return;
        }

        this.utils.showLoader();
        this.statusDiv.textContent = '';

        try {
            const response = await fetch('/api/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, address, email, phone }),
            });

            if (response.ok) {
                this.appState.updateState({ userProfile: { name, address, email, phone } });
                this.utils.setStatus('User profile saved successfully.', false, true);
                this.utils.logAction('User profile updated.');
                this.statusDiv.textContent = 'Profile saved successfully!';
                this.statusDiv.classList.add('success');
                setTimeout(() => {
                    this.statusDiv.textContent = '';
                    this.statusDiv.classList.remove('success');
                }, 3000);
            } else {
                const errorData = await response.json();
                this.utils.setStatus(`Error saving profile: ${errorData.error}`, true);
            }
        } catch (error) {
            console.error('Failed to save profile:', error);
            this.utils.setStatus('An error occurred while saving the profile.', true);
        } finally {
            this.utils.hideLoader();
        }
    }
}