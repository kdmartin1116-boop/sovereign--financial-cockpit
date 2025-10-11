import React, { useContext } from 'react';
import { NotificationContext } from './NotificationContext';
import Notification from './Notification';
import './notification.css';

const NotificationContainer = () => {
    const { notifications } = useContext(NotificationContext);

    return (
        <div className="notification-container">
            {notifications.map(notification => (
                <Notification 
                    key={notification.id} 
                    message={notification.message} 
                    type={notification.type} 
                />
            ))}
        </div>
    );
};

export default NotificationContainer;
