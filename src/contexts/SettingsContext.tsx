import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type Settings, type RecordData, type SaveData, DEFAULT_SETTINGS } from "@/types/game";
import i18n from "@/i18n";

interface SettingsContextType {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  record: RecordData;
  updateRecord: (score: number, phase: number, difficulty: Settings["difficulty"]) => void;
  saveData: SaveData | null;
  setSaveData: (data: SaveData | null) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const SETTINGS_KEY = "snake-flow-settings";
const RECORD_KEY = "snake-flow-record";
const SAVE_KEY = "snake-flow-save";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
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

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    applyAppTheme(settings.appTheme);
  }, [settings]);

  useEffect(() => {
    // Keep i18n language in sync with settings
    i18n.changeLanguage(settings.language);
  }, [settings.language]);

  useEffect(() => {
    localStorage.setItem(RECORD_KEY, JSON.stringify(record));
  }, [record]);

  useEffect(() => {
    if (saveData) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } else {
      localStorage.removeItem(SAVE_KEY);
    }
  }, [saveData]);

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

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, record, updateRecord, saveData, setSaveData }}>
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
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
}
