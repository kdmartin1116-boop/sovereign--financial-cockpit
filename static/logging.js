function handleTrackInstrument(utils, customLogEntryInput) {
    const note = customLogEntryInput.value.trim();
    if (!note) {
        utils.setStatus("Please enter a note for the log.", true);
        return;
    }
    utils.logAction(`Custom Note: "${note}"`);
    customLogEntryInput.value = '';
    utils.setStatus("Custom note added to log.", false);
}

export function initLogging(utils) {
    const trackInstrumentBtn = document.getElementById('trackInstrumentBtn');
    const customLogEntryInput = document.getElementById('customLogEntry');

    if (trackInstrumentBtn && customLogEntryInput) {
        trackInstrumentBtn.addEventListener('click', () => handleTrackInstrument(utils, customLogEntryInput));
    }
}
