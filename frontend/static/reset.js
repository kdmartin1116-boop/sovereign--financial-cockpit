function performReset(appState, modules, utils) {
    appState.resetState();
    modules.forEach(module => {
        if (module && typeof module.reset === 'function') {
            module.reset();
        }
    });
    utils.setStatus('Application has been reset.', false, true);
    modules.forEach(module => {
        if (module && typeof module.render === 'function') {
            module.render();
        } else if (module && typeof module.renderLog === 'function') {
            module.renderLog();
        }
    });
    utils.renderHistory();
}

function showResetConfirmation(appState, modules, utils) {
    const modal = document.getElementById('confirmationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDetails = document.getElementById('modalDetails');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');

    if (!modal || !modalTitle || !modalDetails || !confirmBtn || !cancelBtn) {
        console.error('Confirmation modal elements not found!');
        // Fallback to the old confirm dialog
        if (confirm('Are you sure you want to reset all application data? This action cannot be undone.')) {
            performReset(appState, modules, utils);
        }
        return;
    }

    modalTitle.textContent = 'Confirm Application Reset';
    modalDetails.innerHTML = '<p>Are you sure you want to reset all application data? This includes all profiles, creditors, logs, and other saved information.</p><p><strong>This action cannot be undone.</strong></p>';

    modal.classList.remove('hidden');

    const handleConfirm = () => {
        performReset(appState, modules, utils);
        cleanup();
    };

    const handleCancel = () => {
        cleanup();
    };

    const cleanup = () => {
        modal.classList.add('hidden');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
}


export function initReset(appState, modules, utils) {
    const resetAppBtn = document.getElementById('resetAppBtn');
    if (resetAppBtn) {
        resetAppBtn.addEventListener('click', () => showResetConfirmation(appState, modules, utils));
    }
}