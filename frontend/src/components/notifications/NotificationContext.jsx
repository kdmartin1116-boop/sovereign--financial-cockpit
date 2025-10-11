import React, { createContext, useState, useCallback } from 'react';

export const NotificationContext = createContext();

let idCounter = 0;

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((message, type = 'info', duration = 5000) => {
        const id = idCounter++;
        setNotifications(currentNotifications => [
            ...currentNotifications,
            { id, message, type }
        ]);

        setTimeout(() => {
            setNotifications(currentNotifications =>
                currentNotifications.filter(notification => notification.id !== id)
            );
        }, duration);
    }, []);

    return (
        <NotificationContext.Provider value={{ addNotification, notifications }}>
            {children}
        </NotificationContext.Provider>
    );
};
