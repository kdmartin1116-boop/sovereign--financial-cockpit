import React, { useState, useEffect } from 'react';

const CONSTANTS = {
    LOCAL_STORAGE: {
        CREDITORS: 'sovereign-creditors'
    }
};

const Creditors = () => {
    const [creditors, setCreditors] = useState([]);
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');

    useEffect(() => {
        try {
            const savedCreditors = localStorage.getItem(CONSTANTS.LOCAL_STORAGE.CREDITORS);
            if (savedCreditors) {
                setCreditors(JSON.parse(savedCreditors));
            }
        } catch (error) {
            console.error("Failed to load creditors from localStorage", error);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(CONSTANTS.LOCAL_STORAGE.CREDITORS, JSON.stringify(creditors));
        } catch (error) {
            console.error("Failed to save creditors to localStorage", error);
        }
    }, [creditors]);

    const handleAddCreditor = () => {
        if (!name || !address) {
            alert('Please enter both a name and address for the creditor.');
            return;
        }
        const newCreditor = { id: Date.now(), name, address };
        setCreditors([...creditors, newCreditor]);
        setName('');
        setAddress('');
    };

    const handleDeleteCreditor = (id) => {
        const creditorToDelete = creditors.find(c => c.id === id);
        if (creditorToDelete && window.confirm(`Are you sure you want to delete ${creditorToDelete.name}?`)) {
            setCreditors(creditors.filter(c => c.id !== id));
        }
    };

    const handleExportCreditors = () => {
        if (creditors.length === 0) {
            alert('No creditors to export.');
            return;
        }
        const creditorsJson = JSON.stringify(creditors, null, 2);
        const blob = new Blob([creditorsJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'creditors.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <h2>Creditors</h2>
            <div className="mb-3">
                <label htmlFor="newCreditorName" className="form-label">Creditor Name</label>
                <input 
                    type="text" 
                    className="form-control" 
                    id="newCreditorName" 
                    placeholder="Enter creditor name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                />
            </div>
            <div className="mb-3">
                <label htmlFor="newCreditorAddress" className="form-label">Creditor Address</label>
                <input 
                    type="text" 
                    className="form-control" 
                    id="newCreditorAddress" 
                    placeholder="Enter creditor address" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                />
            </div>
            <button className="btn btn-primary me-2" onClick={handleAddCreditor}>Add Creditor</button>
            <button className="btn btn-secondary" onClick={handleExportCreditors}>Export Creditors</button>
            <hr />
            <h3>Creditor List</h3>
            {creditors.length === 0 ? (
                <p className="text-muted">No creditors saved yet.</p>
            ) : (
                <ul>
                    {creditors.map(c => (
                        <li key={c.id}>
                            <div><strong>{c.name}</strong><br /><small>{c.address}</small></div>
                            <button className="delete-creditor-btn" onClick={() => handleDeleteCreditor(c.id)} title="Delete Creditor">🗑️</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Creditors;
