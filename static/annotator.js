export class AnnotatorModule {
    constructor(appState, utils) {
        this.appState = appState;
        this.utils = utils;
        this.init();
    }

    init() {
        this.fileInput = document.getElementById('annotatorFile');
        this.addAnnotationBtn = document.getElementById('addAnnotationBtn');
        this.annotationEntries = document.getElementById('annotation-entries');
        this.annotateBtn = document.getElementById('annotateAndDownloadBtn');

        this.addAnnotationBtn.addEventListener('click', () => this.addAnnotationEntry());
        this.annotateBtn.addEventListener('click', () => this.handleAnnotationSubmit());

        // Add one entry by default
        this.addAnnotationEntry();
    }

    addAnnotationEntry() {
        const entryCount = this.annotationEntries.children.length;
        const newEntry = document.createElement('div');
        newEntry.classList.add('row', 'mb-2', 'annotation-entry');
        newEntry.innerHTML = `
            <div class="col-md-5">
                <input type="text" class="form-control form-control-sm" placeholder="Annotation Text">
            </div>
            <div class="col-md-3">
                <input type="number" class="form-control form-control-sm" placeholder="X-coord">
            </div>
            <div class="col-md-3">
                <input type="number" class="form-control form-control-sm" placeholder="Y-coord">
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-sm btn-danger remove-annotation-btn">X</button>
            </div>
        `;
        this.annotationEntries.appendChild(newEntry);

        newEntry.querySelector('.remove-annotation-btn').addEventListener('click', (e) => {
            e.target.closest('.annotation-entry').remove();
        });
    }

    async handleAnnotationSubmit() {
        const file = this.fileInput.files[0];
        if (!file) {
            this.utils.setStatus('Please upload a document to annotate.', true);
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        // Collect annotations
        const annotations = {};
        const entries = this.annotationEntries.querySelectorAll('.annotation-entry');
        entries.forEach(entry => {
            const text = entry.children[0].querySelector('input').value;
            const x = entry.children[1].querySelector('input').value;
            const y = entry.children[2].querySelector('input').value;
            if (text && x && y) {
                annotations[text] = [parseInt(x, 10), parseInt(y, 10)];
            }
        });
        formData.append('annotations', JSON.stringify(annotations));

        // Collect signature
        const signatureText = document.getElementById('signatureText').value;
        const sigX = document.getElementById('signatureX').value;
        const sigY = document.getElementById('signatureY').value;
        if (signatureText && sigX && sigY) {
            formData.append('signature_text', signatureText);
            formData.append('signature_coords', JSON.stringify([parseInt(sigX, 10), parseInt(sigY, 10)]));
        }

        this.utils.showLoader();
        this.utils.setStatus('Annotating document...', false);

        try {
            const response = await fetch('/api/documents/annotate', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'An unknown error occurred during annotation.');
            }

            const blob = await response.blob();
            this.utils.generateDownload(blob, `annotated_${file.name}`);
            this.utils.setStatus('Annotation successful! Check your downloads.', false, true);
            this.utils.logAction('Document annotated and downloaded.');

        } catch (error) {
            console.error('Error annotating document:', error);
            this.utils.setStatus(`Error: ${error.message}`, true);
        } finally {
            this.utils.hideLoader();
        }
    }
}
