import React from 'react';
import ReactDOM from 'react-dom/client';
import Creditors from './components/Creditors.jsx';

const creditorsRoot = document.getElementById('creditors-react-root');
if (creditorsRoot) {
    ReactDOM.createRoot(creditorsRoot).render(
        <React.StrictMode>
            <Creditors />
        </React.StrictMode>,
    );
}
