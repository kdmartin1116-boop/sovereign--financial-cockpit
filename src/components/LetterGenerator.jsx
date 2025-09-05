import { useState } from 'react';

function LetterGenerator() {
  const [currentLetterType, setCurrentLetterType] = useState('tender'); // 'tender', 'ptp', 'fcra'

  // State for Tender Letter
  const [tenderUserName, setTenderUserName] = useState('');
  const [tenderUserAddress, setTenderUserAddress] = useState('');
  const [tenderCreditorName, setTenderCreditorName] = useState('');
  const [tenderCreditorAddress, setTenderCreditorAddress] = useState('');
  const [tenderBillFileName, setTenderBillFileName] = useState('');

  // State for PTP Letter
  const [ptpUserName, setPtpUserName] = useState('');
  const [ptpUserAddress, setPtpUserAddress] = useState('');
  const [ptpCreditorName, setPtpCreditorName] = useState('');
  const [ptpCreditorAddress, setPtpCreditorAddress] = useState('');
  const [ptpAccountNumber, setPtpAccountNumber] = useState('');
  const [ptpPromiseAmount, setPtpPromiseAmount] = useState('');
  const [ptpPromiseDate, setPtpPromiseDate] = useState('');

  // State for FCRA Dispute Letter
  const [fcraUserName, setFcraUserName] = useState('');
  const [fcraUserAddress, setFcraUserAddress] = useState('');
  const [fcraAccountNumber, setFcraAccountNumber] = useState('');
  const [fcraReason, setFcraReason] = useState('');
  const [fcraViolationTemplate, setFcraViolationTemplate] = useState('');
  const [fcraSelectedBureaus, setFcraSelectedBureaus] = useState([]);

  const [generatedLetterContent, setGeneratedLetterContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateLetter = async (endpoint, data) => {
    setLoading(true);
    setError(null);
    setGeneratedLetterContent('');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        setGeneratedLetterContent(result.data.letterContent || JSON.stringify(result.data, null, 2));
      } else {
        setError(result.message || 'Failed to generate letter.');
      }
    } catch (err) {
      setError(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  const renderTenderLetterForm = () => (
    <div>
      <h3>Generate Tender Letter</h3>
      <form onSubmit={(e) => {
        e.preventDefault();
        handleGenerateLetter('/api/generate-tender-letter', {
          userName: tenderUserName,
          userAddress: tenderUserAddress,
          creditorName: tenderCreditorName,
          creditorAddress: tenderCreditorAddress,
          billFileName: tenderBillFileName,
        });
      }}>
        <label>Your Name: <input type="text" value={tenderUserName} onChange={(e) => setTenderUserName(e.target.value)} required /></label><br />
        <label>Your Address: <input type="text" value={tenderUserAddress} onChange={(e) => setTenderUserAddress(e.target.value)} required /></label><br />
        <label>Creditor Name: <input type="text" value={tenderCreditorName} onChange={(e) => setTenderCreditorName(e.target.value)} required /></label><br />
        <label>Creditor Address: <input type="text" value={tenderCreditorAddress} onChange={(e) => setTenderCreditorAddress(e.target.value)} required /></label><br />
        <label>Bill File Name: <input type="text" value={tenderBillFileName} onChange={(e) => setTenderBillFileName(e.target.value)} required /></label><br />
        <button type="submit" disabled={loading}>Generate Tender Letter</button>
      </form>
    </div>
  );

  const renderPTPLetterForm = () => (
    <div>
      <h3>Generate Promise to Pay Letter</h3>
      <form onSubmit={(e) => {
        e.preventDefault();
        handleGenerateLetter('/api/generate-ptp-letter', {
          userName: ptpUserName,
          userAddress: ptpUserAddress,
          creditorName: ptpCreditorName,
          creditorAddress: ptpCreditorAddress,
          accountNumber: ptpAccountNumber,
          promiseAmount: ptpPromiseAmount,
          promiseDate: ptpPromiseDate,
        });
      }}>
        <label>Your Name: <input type="text" value={ptpUserName} onChange={(e) => setPtpUserName(e.target.value)} required /></label><br />
        <label>Your Address: <input type="text" value={ptpUserAddress} onChange={(e) => setPtpUserAddress(e.target.value)} required /></label><br />
        <label>Creditor Name: <input type="text" value={ptpCreditorName} onChange={(e) => setPtpCreditorName(e.target.value)} required /></label><br />
        <label>Creditor Address: <input type="text" value={ptpCreditorAddress} onChange={(e) => setPtpCreditorAddress(e.target.value)} required /></label><br />
        <label>Account Number: <input type="text" value={ptpAccountNumber} onChange={(e) => setPtpAccountNumber(e.target.value)} required /></label><br />
        <label>Promise Amount: <input type="number" value={ptpPromiseAmount} onChange={(e) => setPtpPromiseAmount(e.target.value)} required /></label><br />
        <label>Promise Date: <input type="date" value={ptpPromiseDate} onChange={(e) => setPtpPromiseDate(e.target.value)} required /></label><br />
        <button type="submit" disabled={loading}>Generate PTP Letter</button>
      </form>
    </div>
  );

  const renderFCRADisputeForm = () => (
    <div>
      <h3>Generate FCRA Dispute Letter</h3>
      <form onSubmit={(e) => {
        e.preventDefault();
        handleGenerateLetter('/api/generate-fcra-dispute', {
          userName: fcraUserName,
          userAddress: fcraUserAddress,
          accountNumber: fcraAccountNumber,
          reason: fcraReason,
          violationTemplate: fcraViolationTemplate,
          selectedBureaus: fcraSelectedBureaus,
        });
      }}>
        <label>Your Name: <input type="text" value={fcraUserName} onChange={(e) => setFcraUserName(e.target.value)} required /></label><br />
        <label>Your Address: <input type="text" value={fcraUserAddress} onChange={(e) => setFcraUserAddress(e.target.value)} required /></label><br />
        <label>Account Number: <input type="text" value={fcraAccountNumber} onChange={(e) => setFcraAccountNumber(e.target.value)} required /></label><br />
        <label>Reason for Dispute: <textarea value={fcraReason} onChange={(e) => setFcraReason(e.target.value)} required></textarea></label><br />
        <label>Violation Template: <textarea value={fcraViolationTemplate} onChange={(e) => setFcraViolationTemplate(e.target.value)}></textarea></label><br />
        <label>Select Bureaus:</label><br />
        <input type="checkbox" id="equifax" value="equifax" checked={fcraSelectedBureaus.includes('equifax')} onChange={(e) => {
          const newBureaus = e.target.checked ? [...fcraSelectedBureaus, 'equifax'] : fcraSelectedBureaus.filter(b => b !== 'equifax');
          setFcraSelectedBureaus(newBureaus);
        }} /> <label htmlFor="equifax">Equifax</label><br />
        <input type="checkbox" id="experian" value="experian" checked={fcraSelectedBureaus.includes('experian')} onChange={(e) => {
          const newBureaus = e.target.checked ? [...fcraSelectedBureaus, 'experian'] : fcraSelectedBureaus.filter(b => b !== 'experian');
          setFcraSelectedBureaus(newBureaus);
        }} /> <label htmlFor="experian">Experian</label><br />
        <input type="checkbox" id="transunion" value="transunion" checked={fcraSelectedBureaus.includes('transunion')} onChange={(e) => {
          const newBureaus = e.target.checked ? [...fcraSelectedBureaus, 'transunion'] : fcraSelectedBureaus.filter(b => b !== 'transunion');
          setFcraSelectedBureaus(newBureaus);
        }} /> <label htmlFor="transunion">TransUnion</label><br />
        <button type="submit" disabled={loading}>Generate FCRA Dispute Letter</button>
      </form>
    </div>
  );

  return (
    <div>
      <h2>Letter Generator</h2>
      <nav>
        <button onClick={() => setCurrentLetterType('tender')}>Tender Letter</button>
        <button onClick={() => setCurrentLetterType('ptp')}>PTP Letter</button>
        <button onClick={() => setCurrentLetterType('fcra')}>FCRA Dispute</button>
      </nav>
      <hr />
      {currentLetterType === 'tender' && renderTenderLetterForm()}
      {currentLetterType === 'ptp' && renderPTPLetterForm()}
      {currentLetterType === 'fcra' && renderFCRADisputeForm()}

      {loading && <p>Generating letter...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {generatedLetterContent && (
        <div>
          <h3>Generated Letter:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', border: '1px solid #ccc', padding: '10px' }}>
            {generatedLetterContent}
          </pre>
        </div>
      )}
    </div>
  );
}

export default LetterGenerator;