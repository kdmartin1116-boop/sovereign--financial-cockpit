import { CONSTANTS } from './constants.js';
import { getDocument } from 'pdfjs-dist/build/pdf.mjs';

export class Utils {
    constructor(appState) {
        this.appState = appState;
        this.globalLoader = document.getElementById('global-loader');
        this.statusEl = document.getElementById('status');
        this.instrumentLogEl = document.getElementById('instrumentLog');
    }

    showLoader() {
        if (this.globalLoader) this.globalLoader.classList.remove('hidden');
    }

    hideLoader() {
        if (this.globalLoader) this.globalLoader.classList.add('hidden');
    }

    setStatus(message, isError = false, isSuccess = false) {
        if (isError) {
            alert(`Error: ${message}`);
        }
        if (!this.statusEl) return;
        this.statusEl.innerHTML = message; // Use innerHTML to render the list
        if (isError) {
            this.statusEl.className = 'status-message error';
        } else if (isSuccess) {
            this.statusEl.className = 'status-message success';
        } else {
            this.statusEl.className = 'status-message';
        }
    }

    logAction(action) {
        const timestamp = new Date().toLocaleString();
        const currentState = this.appState.getState();
        currentState.history.push({ timestamp, action });
        this.appState.updateState({ history: currentState.history });
        localStorage.setItem(CONSTANTS.LOCAL_STORAGE.INSTRUMENT_HISTORY, JSON.stringify(currentState.history));
        this.renderHistory();
    }

    renderHistory() {
        if (!this.instrumentLogEl) return;
        const currentState = this.appState.getState();
        this.instrumentLogEl.innerHTML = '<ul>' + currentState.history.map(entry => `
            <li><strong>[${entry.timestamp}]</strong>: ${entry.action}</li>
        `).join('') + '</ul>';
    }

    generateDownload(content, filename) {
        try {
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            this.setStatus(`File "${filename}" downloaded successfully.`, false, true);
        } catch (error) {
            console.error('Error generating download:', error);
            this.setStatus('Failed to generate download link.', true);
        }
    }
    
    copyToClipboard(text, successMessage) {
        navigator.clipboard.writeText(text).then(() => {
            this.setStatus(successMessage, false, true);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            this.setStatus('Failed to copy text.', true);
        });
    }

    updateSovereignLoopUI() {
        const states = ['intake', 'validate', 'remedy', 'log', 'reflect'];
        const currentState = this.appState.getState();
        states.forEach(state => {
            const el = document.getElementById(`loop-${state}`);
            if (el) {
                el.classList.toggle('active', state === currentState.loopState);
            }
        });
    }

    async extractTextFromPdf(file) {
        this.showLoader();
        this.setStatus('Extracting text from PDF...', false);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const typedarray = new Uint8Array(arrayBuffer);
            const pdf = await getDocument(typedarray).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map(item => item.str).join(' ');
            }
            this.setStatus('Text extracted successfully.', false, true);
            return fullText;
        } catch (error) {
            console.error("Error extracting text from PDF:", error);
            this.setStatus('Failed to process PDF. It may be corrupted or encrypted.', true);
            return null;
        } finally {
            this.hideLoader();
        }
    }
}
