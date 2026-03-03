/**
 * SaveManager.js — Persistence layer for high scores and settings.
 *
 * Current backend: localStorage (works in any browser, no server needed).
 *
 * ── Future backend swap (Steam Cloud via Electron + greenworks) ───────────
 * When targeting Steam, create a new adapter object that implements the same
 * four methods (saveHighScores, loadHighScores, saveSettings, loadSettings)
 * and assign it to SaveManager._backend.  No calling code needs to change.
 *
 * Example adapter stub (Phase 11 / Steam integration):
 *
 *   const SteamBackend = {
 *     saveHighScores(scores)    { greenworks.saveTextToFile(...) },
 *     loadHighScores()          { return greenworks.readTextFromFile(...) },
 *     saveSettings(settings)    { greenworks.saveTextToFile(...) },
 *     loadSettings()            { return greenworks.readTextFromFile(...) },
 *   };
 *   SaveManager.useBackend(SteamBackend);
 */

const SaveManager = (() => {

  // ── Storage keys ─────────────────────────────────────────────────────────
  const KEYS = {
    HIGH_SCORES: 'adversary_highscores',
    SETTINGS:    'adversary_settings',
  };

  // ── Default backend: localStorage ────────────────────────────────────────
  let _backend = {
    /** @param {Array} scores */
    saveHighScores(scores) {
      try {
        localStorage.setItem(KEYS.HIGH_SCORES, JSON.stringify(scores));
        return true;
      } catch (e) {
        console.warn('[SaveManager] saveHighScores failed:', e);
        return false;
      }
    },

    /** @returns {Array} */
    loadHighScores() {
      try {
        const raw = localStorage.getItem(KEYS.HIGH_SCORES);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.warn('[SaveManager] loadHighScores failed:', e);
        return [];
      }
    },

    /** @param {Object} settings */
    saveSettings(settings) {
      try {
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
        return true;
      } catch (e) {
        console.warn('[SaveManager] saveSettings failed:', e);
        return false;
      }
    },

    /** @returns {Object} */
    loadSettings() {
      try {
        const raw = localStorage.getItem(KEYS.SETTINGS);
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        console.warn('[SaveManager] loadSettings failed:', e);
        return {};
      }
    },
  };

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    /** Swap the storage backend (e.g. Steam Cloud). */
    useBackend(backend) {
      _backend = backend;
    },

    saveHighScores(scores)   { return _backend.saveHighScores(scores); },
    loadHighScores()         { return _backend.loadHighScores(); },
    saveSettings(settings)   { return _backend.saveSettings(settings); },
    loadSettings()           { return _backend.loadSettings(); },
  };

})();
