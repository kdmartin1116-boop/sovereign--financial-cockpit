import React from 'react';
import Tabs from './components/Tabs';
import FinancialHealth from './components/FinancialHealth';
import LegalKnowledge from './components/LegalKnowledge';
import Sovereignty from './components/Sovereignty';
import StateNationalStatus from './components/StateNationalStatus';
import './App.css';

function App() {
    return (
        <div className="container">
            <header>
                <h1>U.S. State National Status Correction</h1>
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
                <div id="status-correction" title="State National Status">
                    <StateNationalStatus />
                </div>
            </Tabs>
        </div>
    );
}

export default App;
