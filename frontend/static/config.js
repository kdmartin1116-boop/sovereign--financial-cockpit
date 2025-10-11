import { CONSTANTS } from './constants.js';

function applySavedConfig() {
    const savedConfigPath = localStorage.getItem(CONSTANTS.LOCAL_STORAGE.SOVEREIGN_OVERLAY_CONFIG_PATH_KEY);
    const sovereignOverlayConfigPathInput = document.getElementById('sovereignOverlayConfigPath');
    if (sovereignOverlayConfigPathInput && savedConfigPath) {
        sovereignOverlayConfigPathInput.value = savedConfigPath;
    }
}

export function initConfig(utils) {
    const saveConfigPathBtn = document.getElementById('saveConfigPathBtn');
    const sovereignOverlayConfigPathInput = document.getElementById('sovereignOverlayConfigPath');

    if (saveConfigPathBtn && sovereignOverlayConfigPathInput) {
        saveConfigPathBtn.addEventListener('click', () => {
            const path = sovereignOverlayConfigPathInput.value.trim();
            localStorage.setItem(CONSTANTS.LOCAL_STORAGE.SOVEREIGN_OVERLAY_CONFIG_PATH_KEY, path);
            utils.setStatus('Config path saved.', false, true);
        });
    }
    applySavedConfig();
}
