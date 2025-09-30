

import { useState } from 'react';

function Dashboard() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleParseBill = async () => {
    if (!selectedFile) {
      alert('Please select a file to parse.');
      return;
    }

    setLoading(true);
    setError(null);
    setBillData(null);

    const formData = new FormData();
    formData.append('bill', selectedFile);

    try {
      const response = await fetch('/get-bill-data', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setBillData(data);
      } else {
        setError(data.error || 'An unknown error occurred.');
      }
    } catch (e) {
      setError(e.message || 'Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Welcome to the Sovereign Finance Cockpit</h2>
      <p>Select a tool from the sidebar to get started.</p>
      <p>This application is designed to empower you to take control of your financial sovereignty.</p>

      <div style={{ marginTop: '20px' }}>
        <h3>Parse Bill</h3>
        <div>
          <label htmlFor="billFile">Upload Bill:</label>
          <input
            type="file"
            id="billFile"
            onChange={handleFileChange}
          />
        </div>
        <button onClick={handleParseBill} disabled={loading} style={{ marginTop: '10px' }}>
          {loading ? 'Parsing...' : 'Parse Bill'}
        </button>

        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        {billData && (
          <div style={{ marginTop: '20px' }}>
            <h3>Parsed Bill Data</h3>
            <ul>
              {Object.entries(billData).map(([key, value]) => (
                <li key={key}><strong>{key.replace(/_/g, ' ').toUpperCase()}:</strong> {value}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;