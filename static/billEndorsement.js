class BillEndorsementModule {
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
        this.saveBtn = document.getElementById('saveEndorsementBtn');
        this.validateNegoBtn = document.getElementById('validateNegotiabilityBtn');
        this.nonNegoBtn = document.getElementById('generateNonNegotiableNoticeBtn');

        this.init();
    }

    init() {
        this.renderPreviewBtn.addEventListener('click', () => this.renderPdfPreview());
        this.validateNegoBtn.addEventListener('click', () => this.validateNegotiability());
        this.canvas.addEventListener('click', (e) => this.placeEndorsement(e));
        this.saveBtn.addEventListener('click', () => this.saveEndorsedPdf());
        this.nonNegoBtn.addEventListener('click', () => this.generateNonNegotiableNotice());

        this.billUploadInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.appState.billFile = e.target.files[0];
                this.utils.logAction('Bill/instrument uploaded.');
                this.endorsementFieldset.disabled = false;
                this.resetEndorsementState();
            }
        });

        // Add tooltip event listeners
        this.qualifierSelect.addEventListener('mouseover', () => this.showQualifierTooltip());
        this.qualifierSelect.addEventListener('mouseout', () => this.hideQualifierTooltip());
        this.qualifierSelect.addEventListener('mousemove', (e) => this.moveQualifierTooltip(e));
        this.qualifierSelect.addEventListener('change', () => this.showQualifierTooltip()); // Update tooltip on change
    }

    // --- Tooltip Methods ---
    showQualifierTooltip() {
        const selectedOption = this.qualifierSelect.options[this.qualifierSelect.selectedIndex];
        const kbKey = selectedOption.dataset.kbKey;

        if (kbKey && this.knowledgeBase.Endorsements && this.knowledgeBase.Endorsements[kbKey]) {
            const info = this.knowledgeBase.Endorsements[kbKey];
            this.qualifierTooltip.innerHTML = `<strong>${info.summary}</strong><p>${info.detail}</p>`;
            this.qualifierTooltip.classList.remove('hidden');
        }
    }

    hideQualifierTooltip() {
        this.qualifierTooltip.classList.add('hidden');
    }

    moveQualifierTooltip(e) {
        // Position tooltip near the cursor
        this.qualifierTooltip.style.left = `${e.pageX + 15}px`;
        this.qualifierTooltip.style.top = `${e.pageY + 15}px`;
    }

    // --- Core Module Methods ---
    async renderPdfPreview() {
        if (!this.appState.billFile) {
            this.utils.setStatus('Please upload a bill/instrument first.', true);
            return;
        }

        this.loader.classList.remove('hidden');
        this.canvas.classList.add('hidden');

        try {
            const arrayBuffer = await this.appState.billFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(1);
            
            this.appState.pdfPage = page;
            const viewport = page.getViewport({ scale: this.canvas.width / page.getViewport({ scale: 1.0 }).width });
            this.appState.pdfViewport = viewport;

            this.canvas.height = viewport.height;
            const renderContext = { canvasContext: this.ctx, viewport: viewport };
            await page.render(renderContext).promise;
            this.utils.setStatus('Preview rendered. Click on the preview to place your endorsement.', false);
            this.utils.logAction('PDF preview rendered.');
            this.resetEndorsementState();
        } catch (error) {
            console.error("Error rendering PDF:", error);
            this.utils.setStatus('Failed to render PDF. It might be corrupted or in an unsupported format.', true);
        } finally {
            this.loader.classList.add('hidden');
            this.canvas.classList.remove('hidden');
        }
    }

    placeEndorsement(e) {
        if (!this.appState.pdfPage || !this.appState.pdfViewport) {
            this.utils.setStatus('Please render a preview first.', true);
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const renderContext = { canvasContext: this.ctx, viewport: this.appState.pdfViewport };
        this.appState.pdfPage.render(renderContext).promise.then(() => {
            const fullEndorsementText = `${this.endorsementText.value} ${this.qualifierSelect.value}`;
            this.ctx.font = '12px Helvetica';
            this.ctx.fillStyle = 'blue';
            this.ctx.fillText(fullEndorsementText, x, y);
        });

        const pdfPoint = this.appState.pdfViewport.convertToPdfPoint(x, y);
        this.appState.endorsementCoords = { x: pdfPoint[0], y: pdfPoint[1] };

        this.utils.setStatus('Endorsement placed. You can now save the PDF.', false);
        this.utils.logAction('Endorsement placed on preview.');
        this.saveBtn.disabled = false;
    }

    async saveEndorsedPdf() {
        if (!this.appState.billFile || !this.appState.endorsementCoords) {
            this.utils.setStatus('Please upload a bill and place an endorsement on the preview first.', true);
            return;
        }

        this.utils.showLoader();
        try {
            const { PDFDocument, rgb, StandardFonts } = PDFLib;

            const existingPdfBytes = await this.appState.billFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const firstPage = pdfDoc.getPages()[0];

            const fullEndorsementText = `${this.endorsementText.value} ${this.qualifierSelect.value}`;
            const { x, y } = this.appState.endorsementCoords;

            firstPage.drawText(fullEndorsementText, {
                x,
                y,
                font: helveticaFont,
                size: 12,
                color: rgb(0, 0, 0),
            });

            const pdfBytes = await pdfDoc.save();
            this.utils.generateDownload(pdfBytes, `${this.appState.billFile.name.replace(/\.pdf$/i, '')}_endorsed.pdf`, 'application/pdf');
            this.utils.logAction('Endorsed PDF saved.');

        } catch (error) {
            console.error('Error saving endorsed PDF:', error);
            this.utils.setStatus('An error occurred while saving the PDF.', true);
        } finally {
            this.utils.hideLoader();
        }
    }

    async _getPDFText(file) {
        if (!file) return '';
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(' ');
        }
        return fullText.toLowerCase();
    }

    async validateNegotiability() { /* ... existing logic ... */ }
    generateNonNegotiableNotice() { /* ... existing logic ... */ }

    resetEndorsementState() {
        this.saveBtn.disabled = true;
        delete this.appState.endorsementCoords;
        delete this.appState.pdfPage;
        delete this.appState.pdfViewport;
        delete this.appState.negotiabilityFailures;
    }

    reset(clearFiles = true) {
        if (clearFiles) {
            this.billUploadInput.value = '';
            this.appState.billFile = null;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.endorsementFieldset.disabled = true;
        this.nonNegoBtn.classList.add('hidden');
        this.resetEndorsementState();
    }
}