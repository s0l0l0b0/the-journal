import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    // Check local storage or system preference, default to 'dark'
    const getInitialTheme = () => {
        const savedTheme = localStorage.getItem('app-theme');
        if (savedTheme) {
            return savedTheme;
        }
        // Optional: Check system preference
        // if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        //     return 'light';
        // }
        return 'dark';
    };

    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        // Apply theme to document body
        document.body.setAttribute('data-theme', theme);
        // Save to local storage
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => {
            if (prevTheme === 'dark') return 'light';
            if (prevTheme === 'light') return 'midnight';
            return 'dark';
        });
    };

    const setThemeValue = (newTheme) => {
        setTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeValue }}>
            {children}
        </ThemeContext.Provider>
    );
};
