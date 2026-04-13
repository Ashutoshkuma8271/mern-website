import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'faceattend_settings_v1';

const defaultSettings = {
  /** 0.30 – 0.80 — minimum match confidence to allow marking */
  confidenceThreshold: 0.6,
  /** Auto-scan interval in seconds (2–10) */
  autoScanIntervalSec: 5,
  showLandmarks: true,
  soundOnRecognize: true,
  /** manual: only button marks | auto: periodic scan when confident */
  attendanceMode: 'manual',
};

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw);
    return {
      ...defaultSettings,
      ...parsed,
      confidenceThreshold: clamp(
        typeof parsed.confidenceThreshold === 'number' ? parsed.confidenceThreshold : defaultSettings.confidenceThreshold,
        0.3,
        0.8
      ),
      autoScanIntervalSec: clamp(
        typeof parsed.autoScanIntervalSec === 'number' ? parsed.autoScanIntervalSec : defaultSettings.autoScanIntervalSec,
        2,
        10
      ),
    };
  } catch {
    return { ...defaultSettings };
  }
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettingsState] = useState(loadStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* quota */
    }
  }, [settings]);

  const setSettings = useCallback((partial) => {
    setSettingsState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettingsState({ ...defaultSettings });
  }, []);

  const value = useMemo(
    () => ({
      settings,
      setSettings,
      resetToDefaults,
    }),
    [settings, setSettings, resetToDefaults]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
