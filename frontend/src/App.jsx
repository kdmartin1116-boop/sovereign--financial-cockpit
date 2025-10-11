import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import FinancialHealth from './components/FinancialHealth';
import LegalKnowledge from './components/LegalKnowledge';
import Sovereignty from './components/Sovereignty';
import ThemeToggle from './components/ThemeToggle';
import { NotificationProvider } from './components/notifications/NotificationContext';
import NotificationContainer from './components/notifications/NotificationContainer';
import { AppProvider } from './contexts/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Creditors from './components/Creditors';
import Vehicle from './components/Vehicle';
import CreditReport from './components/CreditReport';
import FdcpaLog from './components/FdcpaLog';
import Denial from './components/Denial';
import Endorsement from './components/Endorsement';
import PromiseToPay from './components/PromiseToPay';
import Annotator from './components/Annotator';
import './App.css';

function App() {
    return (
        <AppProvider>
            <ErrorBoundary>
                <NotificationProvider>
                    <div className="app-container">
                        <header className="app-header">
                            <h1>🧠 Sovereign Finance Cockpit</h1>
                            <ThemeToggle />
                        </header>
                        <NotificationContainer />
                <ul className="nav nav-tabs" id="myTab" role="tablist">
                    <li className="nav-item" role="presentation">
                        <NavLink className="nav-link" to="/">Dashboard</NavLink>
                    </li>
                    <li className="nav-item" role="presentation">
                        <NavLink className="nav-link" to="/profile">👤 Profile</NavLink>
                    </li>
                    <li className="nav-item" role="presentation">
                        <NavLink className="nav-link" to="/creditors">📚 Creditors</NavLink>
                    </li>
                    <li className="nav-item" role="presentation">
                        <NavLink className="nav-link" to="/vehicle">🚗 Vehicle</NavLink>
                    </li>
                    <li className="nav-item" role="presentation">
                        <NavLink className="nav-link" to="/credit-report">💳 Credit Report</NavLink>
                    </li>
                    <li className="nav-item" role="presentation">
                        <NavLink className="nav-link" to="/fdcpa-log">📢 FDCPA Log</NavLink>
                    </li>
                    <li className="nav-item" role="presentation">
                        <NavLink className="nav-link" to="/denial">✉️ Denial</NavLink>
                    </li>
                    <li className="nav-item" role="presentation">
                        <NavLink className="nav-link" to="/endorsement">💸 Endorsement</NavLink>
                    </li>
                    <li className="nav-item" role="presentation">
                        <NavLink className="nav-link" to="/promise-to-pay">🤝 Promise to Pay</NavLink>
                    </li>
                    <li className="nav-item" role="presentation">
                        <NavLink className="nav-link" to="/annotator">🖋️ Annotator</NavLink>
                    </li>
                </ul>
                <main className="tab-content" id="myTabContent">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/creditors" element={<Creditors />} />
                        <Route path="/vehicle" element={<Vehicle />} />
                        <Route path="/credit-report" element={<CreditReport />} />
                        <Route path="/fdcpa-log" element={<FdcpaLog />} />
                        <Route path="/denial" element={<Denial />} />
                        <Route path="/endorsement" element={<Endorsement />} />
                        <Route path="/promise-to-pay" element={<PromiseToPay />} />
                        <Route path="/annotator" element={<Annotator />} />
                        {/* These routes were in the original App.jsx, keeping them for now */}
                        <Route path="/financial-health" element={<FinancialHealth />} />
                        <Route path="/legal-knowledge" element={<LegalKnowledge />} />
                        <Route path="/sovereignty" element={<Sovereignty />} />
                    </Routes>
                </main>
            </div>
        </NotificationProvider>
            </ErrorBoundary>
        </AppProvider>
    );
}

export default App;
