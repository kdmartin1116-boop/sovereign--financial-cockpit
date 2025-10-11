import { initTheme } from './theme.js';
import { initConfig } from './config.js';
import { initLogging } from './logging.js';
import { initReset } from './reset.js';

export function initGlobalControls(appState, utils, modules) {
    initTheme();
    initConfig(utils);
    initLogging(utils);
    initReset(appState, modules, utils);

    // The original script.js also called renderHistory, so we preserve that.
    utils.renderHistory();
}
