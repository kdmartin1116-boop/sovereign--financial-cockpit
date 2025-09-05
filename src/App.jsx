import { useState } from 'react';
import DocumentList from './components/DocumentList';
import ContractScanner from './components/ContractScanner';
import LetterGenerator from './components/LetterGenerator';
import './App.css';
import Dashboard from './components/Dashboard';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'documents':
        return <DocumentList />;
      case 'scan-contract':
        return <ContractScanner />;
      case 'generate-letter':
        return <LetterGenerator />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`app-container ${theme}-mode`}>
      <div className="sidebar">
        <h1 className="brand">Sovereign Finance</h1>
        <nav className="sidebar-nav">
          <a href="#" onClick={() => setCurrentView('dashboard')} className={currentView === 'dashboard' ? 'active' : ''}>Dashboard</a>
          <a href="#" onClick={() => setCurrentView('documents')} className={currentView === 'documents' ? 'active' : ''}>Documents</a>
          <a href="#" onClick={() => setCurrentView('scan-contract')} className={currentView === 'scan-contract' ? 'active' : ''}>Contract Scanner</a>
          <a href="#" onClick={() => setCurrentView('generate-letter')} className={currentView === 'generate-letter' ? 'active' : ''}>Letter Generator</a>
        </nav>
        <div className="sidebar-footer">
          <button onClick={toggleTheme} className="theme-toggle-button">
            Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>
        </div>
      </div>
      <main className="main-content">
        {renderView()}
      </main>
    </div>
  );
}



export default App;