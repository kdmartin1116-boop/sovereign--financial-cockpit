import { useState, useEffect } from 'react';

function DocumentList() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setDocuments(data.data);
      } else {
        setError(data.message);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDownload = (filename) => {
    window.open(`/api/documents/${filename}`, '_blank');
  };

  const handleDelete = async (filename) => {
    if (window.confirm(`Are you sure you want to delete ${filename}?`)) {
      try {
        const response = await fetch(`/api/documents/${filename}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          alert('Document deleted successfully!');
          fetchDocuments(); // Refresh the list
        } else {
          alert(`Error deleting document: ${data.message}`);
        }
      } catch (e) {
        alert(`Error deleting document: ${e.message}`);
      }
    }
  };

  if (loading) {
    return <div>Loading documents...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Document Management</h2>
      {documents.length === 0 ? (
        <p>No documents found. Upload some!</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Original Filename</th>
              <th>Document Type</th>
              <th>Date Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.stored_filename}>
                <td>{doc.original_filename}</td>
                <td>{doc.doc_type}</td>
                <td>{new Date(doc.date_added).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleDownload(doc.stored_filename)}>Download</button>
                  <button onClick={() => handleDelete(doc.stored_filename)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DocumentList;