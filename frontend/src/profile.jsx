import React from 'react';
import ReactDOM from 'react-dom/client';
import Profile from './components/Profile.jsx';

const profileRoot = document.getElementById('profile-react-root');
if (profileRoot) {
    ReactDOM.createRoot(profileRoot).render(
        <React.StrictMode>
            <Profile />
        </React.StrictMode>,
    );
}
