import React from 'react';
import Tabs from './components/Tabs';
import FinancialHealth from './components/FinancialHealth';
import LegalKnowledge from './components/LegalKnowledge';
import Sovereignty from './components/Sovereignty';
import ThemeToggle from './components/ThemeToggle';
import './App.css';

function App() {
    return (
        <div className="container">
            <header>
                <h1>Sovereign Financial Cockpit</h1>
                <ThemeToggle />
            </header>
            <Tabs>
                <div id="financial-health" title="Financial Health">
                    <FinancialHealth />
                </div>
                <div id="legal-knowledge" title="Legal Knowledge">
                    <LegalKnowledge />
                </div>
                <div id="sovereignty" title="Sovereignty">
                    <Sovereignty />
                </div>
            </Tabs>
        </div>
    );
}

export default App;
