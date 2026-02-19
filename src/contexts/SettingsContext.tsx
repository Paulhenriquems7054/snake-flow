import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type Settings, type RecordData, type SaveData, DEFAULT_SETTINGS } from "@/types/game";
import i18n from "@/i18n";
import { getLocalItem, getPreferenceItem, removeBoth, setJsonBoth } from "@/utils/persist";

interface SettingsContextType {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  record: RecordData;
  updateRecord: (score: number, phase: number, difficulty: Settings["difficulty"]) => void;
  saveData: SaveData | null;
  setSaveData: (data: SaveData | null) => void;
  // Session-only custom audio URLs (blob URLs)
  customAudio: {
    music: string | null;
    eat: string | null;
    phase: string | null;
    over: string | null;
  };
  setCustomAudio: (kind: "music" | "eat" | "phase" | "over", url: string | null) => void;
  resetAllCustomAudio: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const SETTINGS_KEY = "snake-flow-settings";
const RECORD_KEY = "snake-flow-record";
const SAVE_KEY = "snake-flow-save";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = getLocalItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = loadFromStorage(SETTINGS_KEY, DEFAULT_SETTINGS) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...stored };
  });
  const [record, setRecord] = useState<RecordData>(() =>
    loadFromStorage(RECORD_KEY, { highScore: 0, maxPhase: 1, difficulty: "medium" as const })
  );
  const [saveData, setSaveDataState] = useState<SaveData | null>(() =>
    loadFromStorage(SAVE_KEY, null)
  );
  // Session-only custom audio (do not persist blob URLs across reloads)
  const [customAudio, setCustomAudioState] = useState<{ music: string | null; eat: string | null; phase: string | null; over: string | null }>({
    music: null,
    eat: null,
    phase: null,
    over: null,
  });

  useEffect(() => {
    setJsonBoth(SETTINGS_KEY, settings);
    applyAppTheme(settings.appTheme);
  }, [settings]);

  useEffect(() => {
    // Keep i18n language in sync with settings
    i18n.changeLanguage(settings.language);
  }, [settings.language]);

  useEffect(() => {
    setJsonBoth(RECORD_KEY, record);
  }, [record]);

  useEffect(() => {
    if (saveData) {
      setJsonBoth(SAVE_KEY, saveData);
    } else {
      removeBoth(SAVE_KEY);
    }
  }, [saveData]);

  // Hydrate from Capacitor Preferences if localStorage is empty/cleared on device.
  useEffect(() => {
    const hydrate = async () => {
      try {
        const localSettings = getLocalItem(SETTINGS_KEY);
        if (!localSettings) {
          const pref = await getPreferenceItem(SETTINGS_KEY);
          if (pref) {
            const parsed = JSON.parse(pref) as Partial<Settings>;
            setSettings((prev) => ({ ...prev, ...parsed }));
          }
        }

        const localRecord = getLocalItem(RECORD_KEY);
        if (!localRecord) {
          const pref = await getPreferenceItem(RECORD_KEY);
          if (pref) setRecord(JSON.parse(pref) as RecordData);
        }

        const localSave = getLocalItem(SAVE_KEY);
        if (!localSave) {
          const pref = await getPreferenceItem(SAVE_KEY);
          if (pref) setSaveDataState(JSON.parse(pref) as SaveData);
        }
      } catch {
        // ignore
      }
    };
    void hydrate();
  }, []);

  const updateSettings = (partial: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const updateRecord = (score: number, phase: number, difficulty: Settings["difficulty"]) => {
    setRecord((prev) => ({
      highScore: Math.max(prev.highScore, score),
      maxPhase: Math.max(prev.maxPhase, phase),
      difficulty: score > prev.highScore ? difficulty : prev.difficulty,
    }));
  };

  const setSaveData = (data: SaveData | null) => {
    setSaveDataState(data);
  };

  const setCustomAudio = (kind: "music" | "eat" | "phase" | "over", url: string | null) => {
    setCustomAudioState((prev) => ({ ...prev, [kind]: url }));
  };
  const resetAllCustomAudio = () => {
    // Revoke existing URLs if any
    Object.values(customAudio).forEach((u) => {
      if (u) URL.revokeObjectURL(u);
    });
    setCustomAudioState({ music: null, eat: null, phase: null, over: null });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, record, updateRecord, saveData, setSaveData, customAudio, setCustomAudio, resetAllCustomAudio }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
}

function applyAppTheme(theme: Settings["appTheme"]) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}
