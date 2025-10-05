import React, { useState, useEffect } from 'react';

const ThemeToggle = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            const isDark = savedTheme === 'dark';
            setIsDarkMode(isDark);
            if (isDark) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        }
    }, []);

    const handleThemeToggle = () => {
        const newIsDarkMode = !isDarkMode;
        setIsDarkMode(newIsDarkMode);
        if (newIsDarkMode) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <div className="form-check form-switch">
            <input 
                className="form-check-input" 
                type="checkbox" 
                id="themeToggle" 
                checked={isDarkMode} 
                onChange={handleThemeToggle} 
            />
            <label className="form-check-label" htmlFor="themeToggle">Dark Mode</label>
        </div>
    );
};

export default ThemeToggle;
