import React, { useState, useEffect, useCallback } from 'react';

const Profile = () => {
    const [userName, setUserName] = useState('');
    const [userAddress, setUserAddress] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userPhone, setUserPhone] = useState('');
    const [status, setStatus] = useState('');

    const fetchProfile = useCallback(async () => {
        try {
            const response = await fetch('/api/profile');
            if (response.ok) {
                const profile = await response.json();
                if (profile) {
                    setUserName(profile.name || '');
                    setUserAddress(profile.address || '');
                    setUserEmail(profile.email || '');
                    setUserPhone(profile.phone || '');
                }
            } else {
                const errorData = await response.json();
                setStatus(`Error: ${errorData.error}`);
            }
        } catch (error) {
            setStatus(`Error: ${error.message}`);
        }
    }, []);

    useEffect(() => {
        fetchProfile();

        const handleRefresh = () => fetchProfile();
        window.addEventListener('profile-needs-refresh', handleRefresh);

        return () => {
            window.removeEventListener('profile-needs-refresh', handleRefresh);
        };
    }, [fetchProfile]);

    const handleSaveProfile = async () => {
        try {
            const response = await fetch('/api/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: userName, address: userAddress, email: userEmail, phone: userPhone }),
            });

            if (response.ok) {
                setStatus('Profile saved successfully!');
            } else {
                const errorData = await response.json();
                setStatus(`Error: ${errorData.error}`);
            }
        } catch (error) {
            setStatus(`Error: ${error.message}`);
        }
    };

    const handleExportProfile = () => {
        const profile = { name: userName, address: userAddress, email: userEmail, phone: userPhone };
        const profileJson = JSON.stringify(profile, null, 2);
        const blob = new Blob([profileJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'user_profile.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <h2>User Profile</h2>
            <div className="mb-3">
                <label htmlFor="profileUserName" className="form-label">User Name</label>
                <input type="text" className="form-control" id="profileUserName" value={userName} onChange={(e) => setUserName(e.target.value)} />
            </div>
            <div className="mb-3">
                <label htmlFor="profileUserAddress" className="form-label">User Address</label>
                <input type="text" className="form-control" id="profileUserAddress" value={userAddress} onChange={(e) => setUserAddress(e.target.value)} />
            </div>
            <div className="mb-3">
                <label htmlFor="profileUserEmail" className="form-label">User Email</label>
                <input type="email" className="form-control" id="profileUserEmail" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
            </div>
            <div className="mb-3">
                <label htmlFor="profileUserPhone" className="form-label">User Phone</label>
                <input type="tel" className="form-control" id="profileUserPhone" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} />
            </div>
            <button className="btn btn-primary me-2" onClick={handleSaveProfile}>Save Profile</button>
            <button className="btn btn-secondary" onClick={handleExportProfile}>Export Profile</button>
            {status && <div className="mt-3">{status}</div>}
        </div>
    );
};

export default Profile;
