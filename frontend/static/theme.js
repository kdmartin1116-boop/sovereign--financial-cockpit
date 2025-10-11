import { CONSTANTS } from './constants.js';

// Get the toggle element once.
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Function to set the theme based on a string ('dark' or 'light')
function setTheme(theme) {
    if (theme === 'dark') {
        body.classList.add('dark-mode');
        if (themeToggle) themeToggle.checked = true;
    } else {
        body.classList.remove('dark-mode');
        if (themeToggle) themeToggle.checked = false;
    }
    localStorage.setItem(CONSTANTS.LOCAL_STORAGE.THEME, theme);
}

// Function to handle the toggle click
function handleToggle() {
    const currentTheme = localStorage.getItem(CONSTANTS.LOCAL_STORAGE.THEME);
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// Main initialization function
export function initTheme() {
    if (!themeToggle) {
        console.warn('Theme toggle element not found.');
        // Still apply saved theme to body, even if toggle is missing
        const savedTheme = localStorage.getItem(CONSTANTS.LOCAL_STORAGE.THEME) || 'light';
        setTheme(savedTheme);
        return;
    }

    // Add the event listener
    themeToggle.addEventListener('change', handleToggle);

    // Apply the saved theme on initial load
    const savedTheme = localStorage.getItem(CONSTANTS.LOCAL_STORAGE.THEME) || 'light';
    setTheme(savedTheme);
}