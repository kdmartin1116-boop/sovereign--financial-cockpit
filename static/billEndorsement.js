import { getDocument } from 'pdfjs-dist/build/pdf.mjs';

export class BillEndorsement {
    constructor(appState, knowledgeBase, utils) {
        this.appState = appState;
        this.knowledgeBase = knowledgeBase;
        this.utils = utils;

        // DOM Elements
        this.billUploadInput = document.getElementById('billUpload');
        this.renderPreviewBtn = document.getElementById('renderPreview');
        this.canvas = document.getElementById('previewCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.loader = document.getElementById('loader');
        this.endorsementFieldset = document.getElementById('endorsement-fieldset');
        this.endorsementText = document.getElementById('endorsementText');
        this.qualifierSelect = document.getElementById('qualifier');
        this.qualifierTooltip = document.getElementById('qualifier-tooltip');
        this.acceptedForValueWarning = document.getElementById('acceptedForValueWarning');
        this.saveBtn = document.getElementById('saveEndorsementBtn');
        this.validateNegoBtn = document.getElementById('validateNegotiabilityBtn');
        this.nonNegoBtn = document.getElementById('generateNonNegotiableNoticeBtn');
        this.nonNegoContainer = document.getElementById('nonNegotiableNoticeContainer');
        this.nonNegoText = document.getElementById('nonNegotiableNoticeText');
        this.copyNoticeBtn = document.getElementById('copyNoticeBtn');
        this.downloadNoticeBtn = document.getElementById('downloadNoticeBtn');
        this.generateTenderLetterBtn = document.getElementById('generateTenderLetterBtn');
        this.tenderLetterContainer = document.getElementById('tenderLetterContainer');
        this.tenderLetterText = document.getElementById('tenderLetterText');
        this.copyTenderLetterBtn = document.getElementById('copyTenderLetterBtn');
        this.downloadTenderLetterBtn = document.getElementById('downloadTenderLetterBtn');


        this.init();
    }

    init() {
        this.renderPreviewBtn.addEventListener('click', () => this.renderPdfPreview());
        this.validateNegoBtn.addEventListener('click', () => this.validateNegotiability());
        this.saveBtn.addEventListener('click', () => this.stampEndorsement());
        this.nonNegoBtn.addEventListener('click', () => this.generateNonNegotiableNotice());
        this.generateTenderLetterBtn.addEventListener('click', () => this.generateTenderLetter());
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.copyNoticeBtn.addEventListener('click', () => this.copyNotice());
        this.downloadNoticeBtn.addEventListener('click', () => this.downloadNotice());
        this.copyTenderLetterBtn.addEventListener('click', () => this.copyTenderLetter());
        this.downloadTenderLetterBtn.addEventListener('click', () => this.downloadTenderLetter());

        this.billUploadInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.appState.updateState({ billFile: e.target.files[0] });
                this.utils.logAction('Bill/instrument uploaded.');
                this.endorsementFieldset.disabled = false;
                this.resetEndorsementState();
                this.resetTenderLetterState(); // Reset tender letter state on new upload
            }
        });

        // Add tooltip event listeners
        this.qualifierSelect.addEventListener('mouseover', () => this.showQualifierTooltip());
        this.qualifierSelect.addEventListener('mouseout', () => this.hideQualifierTooltip());
        this.qualifierSelect.addEventListener('mousemove', (e) => this.moveQualifierTooltip(e));
        this.qualifierSelect.addEventListener('change', () => this.showQualifierTooltip()); // Update tooltip on change
    }

    handleCanvasClick(e) {
        const currentState = this.appState.getState();
        if (!currentState.pdfPage) {
            this.utils.setStatus('Please render a PDF preview first.', true);
            return;
        }

        const endorsementText = this.endorsementText.value.trim();
        if (!endorsementText) {
            this.utils.setStatus('Please enter endorsement text before selecting a position.', true);
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert view coordinates to PDF coordinates
        const pdfPoint = currentState.pdfViewport.convertToPdfPoint(x, y);

        this.appState.updateState({ endorsementCoords: { x: pdfPoint[0], y: pdfPoint[1] } });

        this.utils.setStatus(`Endorsement position set. Ready to save.`, false);
        this.utils.logAction(`Endorsement position selected.`);
        this.saveBtn.disabled = false;

        // Re-render the PDF to clear previous drawings, then draw the new text
        this.renderPdfPreview().then(() => {
            this.ctx.fillStyle = 'rgba(200, 0, 0, 0.8)';
            this.ctx.font = '10px sans-serif';
            // Add qualifier text
            const qualifier = this.qualifierSelect.value;
            const fullText = `${endorsementText} - ${qualifier}`;
            this.ctx.fillText(fullText, x, y);
        });
    }

    async stampEndorsement() {
        const currentState = this.appState.getState();
        if (!currentState.billFile || !currentState.endorsementCoords) {
            this.utils.setStatus('Please upload a bill and select an endorsement position on the preview.', true);
            return;
        }

        const endorsementText = this.endorsementText.value.trim();
        const qualifier = this.qualifierSelect.value;

        if (!endorsementText) {
            this.utils.setStatus('Please enter endorsement text.', true);
            return;
        }

        this.utils.showLoader();
        this.utils.setStatus('Stamping endorsement...', false);

        const formData = new FormData();
        formData.append('bill', currentState.billFile);
        formData.append('x', currentState.endorsementCoords.x);
        formData.append('y', currentState.endorsementCoords.y);
        formData.append('endorsement_text', endorsementText);
        formData.append('qualifier', qualifier);

        try {
            const response = await fetch('/stamp_endorsement', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'An unknown error occurred during stamping.');
            }

            const blob = await response.blob();
            this.utils.generateDownload(blob, `endorsed_${currentState.billFile.name}`);
            this.utils.setStatus('Endorsement successful! Check your downloads.', false, true);
            this.utils.logAction('Endorsement stamped and downloaded.');

        } catch (error) {
            console.error('Error stamping endorsement:', error);
            this.utils.setStatus(`Error: ${error.message}`, true);
        } finally {
            this.utils.hideLoader();
        }
    }

    // --- Tooltip Methods ---
    showQualifierTooltip() {
        const selectedOption = this.qualifierSelect.options[this.qualifierSelect.selectedIndex];
        const kbKey = selectedOption.dataset.kbKey;

        // Hide previous warning if any
        this.acceptedForValueWarning.classList.add('hidden');

        if (kbKey && this.knowledgeBase.Endorsements && this.knowledgeBase.Endorsements[kbKey]) {
            const info = this.knowledgeBase.Endorsements[kbKey];
            this.qualifierTooltip.innerHTML = `<strong>${info.summary}</strong><p>${info.detail}</p>`;
            this.qualifierTooltip.classList.remove('hidden');

            // Show specific warning for "Accepted for Value"
            if (kbKey === 'AcceptedForValue') {
                this.acceptedForValueWarning.classList.remove('hidden');
            }
        }
    }

    hideQualifierTooltip() {
        this.qualifierTooltip.classList.add('hidden');
        this.acceptedForValueWarning.classList.add('hidden'); // Also hide the warning
    }

    moveQualifierTooltip(e) {
        // Position tooltip near the cursor
        this.qualifierTooltip.style.left = `${e.pageX + 15}px`;
        this.qualifierTooltip.style.top = `${e.pageY + 15}px`;
    }

    // --- Core Module Methods ---
    async renderPdfPreview() {
        const currentState = this.appState.getState();
        if (!currentState.billFile) {
            this.utils.setStatus('Please upload a bill/instrument first.', true);
            return;
        }

        this.loader.classList.remove('hidden');
        this.canvas.classList.add('hidden');

        try {
            const arrayBuffer = await currentState.billFile.arrayBuffer();
            const pdf = await getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(1);
            
            this.appState.updateState({ pdfPage: page });
            const viewport = page.getViewport({ scale: this.canvas.width / page.getViewport({ scale: 1.0 }).width });
            this.appState.updateState({ pdfViewport: viewport });

            this.canvas.height = viewport.height;
            const renderContext = { canvasContext: this.ctx, viewport: viewport };
            await page.render(renderContext).promise;
            this.utils.setStatus('Preview rendered. Click on the preview to place your endorsement.', false);
            this.utils.logAction('PDF preview rendered.');
        } catch (error) {
            console.error("Error rendering PDF:", error);
            this.utils.setStatus('Failed to render PDF. It might be corrupted or in an unsupported format.', true);
        } finally {
            this.loader.classList.add('hidden');
            this.canvas.classList.remove('hidden');
        }
    }

    async processBillOnBackend() {
        const currentState = this.appState.getState();
        if (!currentState.billFile) {
            this.utils.setStatus('Please upload a bill/instrument first.', true);
            return;
        }

        this.utils.showLoader();
        this.utils.setStatus('Processing bill on the server...', false);

        const formData = new FormData();
        formData.append('bill', currentState.billFile);

        try {
            const response = await fetch('/endorse-bill', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'An unknown error occurred.');
            }

            this.utils.setStatus(result.message || 'Bill processed successfully!', false);
            this.utils.logAction('Backend processing complete.');
            
            // Optionally, provide download links for the endorsed files
            if (result.endorsed_files && result.endorsed_files.length > 0) {
                this.utils.logAction(`Endorsed files created: ${result.endorsed_files.join(', ')}`);
                // Here you could add logic to display download links to the user
            }

        } catch (error) {
            console.error('Error processing bill:', error);
            this.utils.setStatus(`Error: ${error.message}`, true);
        } finally {
            this.utils.hideLoader();
        }
    }

    async _getPDFText(file) {
        if (!file) return '';
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(' ');
        }
        return fullText.toLowerCase();
    }

    async validateNegotiability() {
        this.utils.showLoader();
        this.utils.setStatus('Analyzing instrument for negotiability...', false);

        const currentState = this.appState.getState();
        if (!currentState.billFile) {
            this.utils.setStatus('Please upload a bill/instrument first.', true);
            this.utils.hideLoader();
            return;
        }

        try {
            const text = await this._getPDFText(currentState.billFile);
            const failures = [];
            const successes = [];

            // UCC 3-104(a) - The "Magic Words"
            if (text.includes('pay to the order of') || text.includes('pay to bearer')) {
                successes.push('Contains promise to pay to order or bearer.');
            } else {
                failures.push('Missing "Pay to the order of" or "Pay to bearer" language.');
            }

            // UCC 3-104(a) - Fixed Amount
            if (/$\\s?[\d,]+(\\.\\d{2})?\b/.test(text)) {
                 successes.push('Specifies a fixed amount of money.');
            } else {
                failures.push('Does not appear to specify a fixed amount of money (e.g., $1,234.56).');
            }

            // UCC 3-104(a) - Unconditional Promise
            if (!/subject to|governed by|as per/.test(text)) {
                successes.push('The promise or order appears to be unconditional.');
            } else {
                failures.push('The promise or order may be conditional (contains "subject to", "governed by", etc.).');
            }
            
            // UCC 3-104(a) - Payable on Demand or at a Definite Time
            if (text.includes('on demand') || /\bon or before\b/.test(text) || /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/.test(text)) {
                successes.push('Appears to be payable on demand or at a definite time.');
            } else {
                failures.push('Does not appear to be payable on demand or at a definite time.');
            }

            this.appState.updateState({ negotiabilityFailures: failures });

            if (failures.length > 0) {
                let failureList = failures.map(f => `<li>- ${f}</li>`).join('');
                this.utils.setStatus(`<strong>Instrument may not be negotiable:</strong><ul>${failureList}</ul>`, true);
                this.nonNegoBtn.classList.remove('hidden');
                this.generateTenderLetterBtn.disabled = true; // Disable if not negotiable
                 this.utils.logAction('Validation failed.', { failures });
            } else {
                let successList = successes.map(s => `<li>- ${s}</li>`).join('');
                this.utils.setStatus(`<strong>Instrument appears to be negotiable:</strong><ul>${successList}</ul>`, false, true);
                this.nonNegoBtn.classList.add('hidden');
                this.generateTenderLetterBtn.disabled = false; // Enable if negotiable
                this.utils.logAction('Validation succeeded.', { successes });
            }

        } catch (error) {
            console.error('Error validating negotiability:', error);
            this.utils.setStatus('Could not analyze the document.', true);
        } finally {
            this.utils.hideLoader();
        }
    }
    
    generateNonNegotiableNotice() {
        const currentState = this.appState.getState();
        const { negotiabilityFailures, userProfile, billFile } = currentState;

        if (!negotiabilityFailures || negotiabilityFailures.length === 0) {
            this.utils.setStatus('No negotiability failures were found.', true);
            return;
        }

        if (!userProfile || !userProfile.name || !userProfile.address) {
            this.utils.setStatus('Please complete your user profile first.', true);
            // Maybe highlight the profile section
            return;
        }
        
        const today = new Date().toLocaleDateString();
        const failureList = negotiabilityFailures.map(f => `- ${f}`).join('\n');

        const noticeText = `
[${userProfile.name}]
[${userProfile.address}]

[${today}]

TO: [Creditor Name and Address Here]

NOTICE OF NON-NEGOTIABLE INSTRUMENT

This letter is to inform you that the instrument titled "${billFile ? billFile.name : 'N/A'}" is not a negotiable instrument under the Uniform Commercial Code (UCC) for the following reasons:

${failureList}

This notice is to inform you of these defects. Any attempt to negotiate this instrument may be unlawful.

Sincerely,

${userProfile.name}
        `.trim();

        this.nonNegoText.value = noticeText;
        this.nonNegoContainer.classList.remove('hidden');
        this.utils.setStatus('Non-negotiable notice generated below.', false);
        this.utils.logAction('Non-negotiable notice generated.');
    }

    copyNotice() {
        this.nonNegoText.select();
        document.execCommand('copy');
        this.utils.setStatus('Notice copied to clipboard!', false, true);
    }

    downloadNotice() {
        const text = this.nonNegoText.value;
        const blob = new Blob([text], { type: 'text/plain' });
        this.utils.generateDownload(blob, 'non-negotiable-notice.txt');
    }

    resetEndorsementState() {
        this.saveBtn.disabled = true;
        this.appState.updateState({
            endorsementCoords: null,
            pdfPage: null,
            pdfViewport: null,
            negotiabilityFailures: null
        });
        this.nonNegoContainer.classList.add('hidden');
    }

    reset(clearFiles = true) {
        if (clearFiles) {
            this.billUploadInput.value = '';
            this.appState.updateState({ billFile: null });
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.endorsementFieldset.disabled = true;
        this.nonNegoBtn.classList.add('hidden');
        this.resetEndorsementState();
        this.resetTenderLetterState();
    }

    resetTenderLetterState() {
        this.tenderLetterContainer.classList.add('hidden');
        this.tenderLetterText.value = '';
    }

    async generateTenderLetter() {
        const currentState = this.appState.getState();
        const { userProfile, billFile } = currentState;

        if (!userProfile || !userProfile.name || !userProfile.address) {
            this.utils.setStatus('Please complete your user profile (Your Information) first.', true);
            return;
        }

        if (!billFile) {
            this.utils.setStatus('Please upload a bill/instrument first.', true);
            return;
        }

        // For now, we'll use a placeholder for creditor info. In a real app, you'd select from saved creditors.
        const creditorName = "[Creditor Name Here]";
        const creditorAddress = "[Creditor Address Here]";

        this.utils.showLoader();
        this.utils.setStatus('Generating tender letter...', false);

        try {
            const response = await fetch('/generate_tender_letter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userName: userProfile.name,
                    userAddress: userProfile.address,
                    creditorName: creditorName,
                    creditorAddress: creditorAddress,
                    billFileName: billFile.name,
                }),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'An unknown error occurred during tender letter generation.');
            }

            const result = await response.json();
            this.tenderLetterText.value = result.letterContent;
            this.tenderLetterContainer.classList.remove('hidden');
            this.utils.setStatus('Tender letter generated below.', false, true);
            this.utils.logAction('Tender letter generated.');

        } catch (error) {
            console.error('Error generating tender letter:', error);
            this.utils.setStatus(`Error: ${error.message}`, true);
        } finally {
            this.utils.hideLoader();
        }
    }

    copyTenderLetter() {
        this.tenderLetterText.select();
        document.execCommand('copy');
        this.utils.setStatus('Tender letter copied to clipboard!', false, true);
    }

    downloadTenderLetter() {
        const text = this.tenderLetterText.value;
        const blob = new Blob([text], { type: 'text/plain' });
        this.utils.generateDownload(blob, 'tender-letter.txt');
    }
}