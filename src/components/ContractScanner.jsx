import { useState } from 'react';

// Hardcoding KEYWORD_MAP for now, as there's no API to fetch it.
// In a real application, this would ideally be fetched from the backend.
const KEYWORD_MAP_FRONTEND = {
  "hidden_fee": ["convenience fee", "service charge", "processing fee", "undisclosed", "surcharge"],
  "misrepresentation": ["misrepresented", "misleading", "deceptive", "false statement", "inaccurate"],
  "arbitration": ["arbitration", "arbitrator", "binding arbitration", "waive your right to"]
};

function ContractScanner() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedTag, setSelectedTag] = useState(Object.keys(KEYWORD_MAP_FRONTEND)[0]);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleTagChange = (event) => {
    setSelectedTag(event.target.value);
  };

  const handleScan = async () => {
    if (!selectedFile) {
      alert('Please select a PDF file to scan.');
      return;
    }
    if (!selectedTag) {
      alert('Please select a tag.');
      return;
    }

    setLoading(true);
    setError(null);
    setScanResult(null);

    const formData = new FormData();
    formData.append('contract', selectedFile);
    formData.append('tag', selectedTag);

    try {
      const response = await fetch('/api/scan-contract', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setScanResult(data.data.output);
      } else {
        setError(data.message || 'An unknown error occurred during scan.');
      }
    } catch (e) {
      setError(e.message || 'Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Contract Scanner</h2>
      <div>
        <label htmlFor="contractFile">Upload Contract (PDF):</label>
        <input
          type="file"
          id="contractFile"
          accept=".pdf"
          onChange={handleFileChange}
        />
      </div>
      <div style={{ marginTop: '10px' }}>
        <label htmlFor="tagSelect">Select Tag:</label>
        <select id="tagSelect" value={selectedTag} onChange={handleTagChange}>
          {Object.keys(KEYWORD_MAP_FRONTEND).map((key) => (
            <option key={key} value={key}>
              {key.replace(/_/g, ' ').toUpperCase()}
            </option>
          ))}
        </select>
      </div>
      <button onClick={handleScan} disabled={loading} style={{ marginTop: '10px' }}>
        {loading ? 'Scanning...' : 'Scan Contract'}
      </button>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {scanResult && scanResult.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Found Sentences:</h3>
          <ul>
            {scanResult.map((sentence, index) => (
              <li key={index}>{sentence}</li>
            ))}
          </ul>
        </div>
      )}

      {scanResult && scanResult.length === 0 && !loading && (
        <p style={{ marginTop: '20px' }}>No sentences found for the selected tag.</p>
      )}
    </div>
  );
}

export default ContractScanner;