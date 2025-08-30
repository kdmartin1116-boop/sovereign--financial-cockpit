import { CONSTANTS } from './constants.js';

function handleThemeToggle(themeToggle) {
    if (themeToggle.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem(CONSTANTS.LOCAL_STORAGE.THEME, 'dark');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem(CONSTANTS.LOCAL_STORAGE.THEME, 'light');
    }
}

function applySavedTheme(themeToggle) {
    const savedTheme = localStorage.getItem(CONSTANTS.LOCAL_STORAGE.THEME);
    if (savedTheme) {
        themeToggle.checked = savedTheme === 'dark';
    }
    handleThemeToggle(themeToggle);

    const savedConfigPath = localStorage.getItem(CONSTANTS.LOCAL_STORAGE.SOVEREIGN_OVERLAY_CONFIG_PATH_KEY);
    const sovereignOverlayConfigPathInput = document.getElementById('sovereignOverlayConfigPath');
    if (sovereignOverlayConfigPathInput && savedConfigPath) {
        sovereignOverlayConfigPathInput.value = savedConfigPath;
    }
}

function handleTrackInstrument(utils, customLogEntryInput) {
    const note = customLogEntryInput.value.trim();
    if (!note) {
        utils.setStatus("Please enter a note for the log.", true);
        return;
    }
    utils.logAction(`Custom Note: "${note}"`);
    customLogEntryInput.value = '';
    utils.setStatus("Custom note added to log.", false);
}

function handleReset(appState, modules, utils) {
    if (!confirm('Are you sure you want to reset all application data? This action cannot be undone.')) {
        return;
    }
    appState.resetState();
    modules.forEach(module => {
        if (typeof module.reset === 'function') {
            module.reset();
        }
    });
    utils.setStatus('Application has been reset.', false, true);
    modules.forEach(module => {
        if (typeof module.render === 'function') {
            module.render();
        } else if (typeof module.renderLog === 'function') {
            module.renderLog();
        }
    });
    utils.renderHistory();
}

function activateTab(tabId) {
    const tabPanels = document.querySelectorAll('.tab-panel');
    const tabLinks = document.querySelectorAll('.tab-link');

    tabPanels.forEach(panel => {
        panel.classList.toggle('active', panel.id === tabId);
    });

    tabLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.tab === tabId);
    });
}

function initTabs() {
    const tabNav = document.querySelector('.tab-nav');
    if (!tabNav) return;

    tabNav.addEventListener('click', (e) => {
        if (e.target.matches('.tab-link')) {
            const tabId = e.target.dataset.tab;
            activateTab(tabId);
            localStorage.setItem(CONSTANTS.LOCAL_STORAGE.ACTIVE_TAB, tabId);
        }
    });

    const savedTab = localStorage.getItem(CONSTANTS.LOCAL_STORAGE.ACTIVE_TAB);
    if (savedTab && document.getElementById(savedTab)) {
        activateTab(savedTab);
    } else {
        activateTab('tab-dashboard'); // Default tab
    }
}

export function initGlobalControls(appState, utils, modules) {
    const resetAppBtn = document.getElementById('resetAppBtn');
    const trackInstrumentBtn = document.getElementById('trackInstrumentBtn');
    const customLogEntryInput = document.getElementById('customLogEntry');
    const themeToggle = document.getElementById('themeToggle');
    const saveConfigPathBtn = document.getElementById('saveConfigPathBtn');
    const sovereignOverlayConfigPathInput = document.getElementById('sovereignOverlayConfigPath');

    if (resetAppBtn) {
        resetAppBtn.addEventListener('click', () => handleReset(appState, modules, utils));
    }
    if (trackInstrumentBtn) {
        trackInstrumentBtn.addEventListener('click', () => handleTrackInstrument(utils, customLogEntryInput));
    }
    if (themeToggle) {
        themeToggle.addEventListener('change', () => handleThemeToggle(themeToggle));
    }

    if (saveConfigPathBtn) {
        saveConfigPathBtn.addEventListener('click', () => {
            const path = sovereignOverlayConfigPathInput.value.trim();
            localStorage.setItem(CONSTANTS.LOCAL_STORAGE.SOVEREIGN_OVERLAY_CONFIG_PATH_KEY, path);
            utils.setStatus('Config path saved.', false, true);
        });
    }

    applySavedTheme(themeToggle);
    utils.renderHistory();
    initTabs();
}