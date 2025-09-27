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

function applySavedTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    const savedTheme = localStorage.getItem(CONSTANTS.LOCAL_STORAGE.THEME);
    if (savedTheme) {
        themeToggle.checked = savedTheme === 'dark';
    }
    handleThemeToggle(themeToggle);
}

export function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('change', () => handleThemeToggle(themeToggle));
    }
    applySavedTheme();
}
