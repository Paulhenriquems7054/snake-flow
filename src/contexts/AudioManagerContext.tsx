import React, { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { AudioManager } from "@/utils/audioManager";
import { useSettings } from "./SettingsContext";

type AudioContextValue = {
  manager: AudioManager | null;
  isSoundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
};

const AudioManagerContext = createContext<AudioContextValue | null>(null);

export function AudioManagerProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings, customAudio } = useSettings();
  const [manager, setManager] = useState<AudioManager | null>(null);

  // Create single AudioManager instance
  useEffect(() => {
    // Reuse a global singleton to avoid multiple instances during HMR/dev
    const globalKey = "__SNAKE_FLOW_AUDIO_MANAGER__";
    const win = typeof window !== "undefined" ? (window as any) : undefined;
    if (win && win[globalKey]) {
      setManager(win[globalKey] as AudioManager);
      return;
    }

    const m = new AudioManager();
    if (win) {
      // Persist singleton on window so HMR doesn't create duplicates
      win[globalKey] = m;
    }
    setManager(m);

    // Do not destroy singleton on unmount to avoid hot-reload duplication.
    return () => {
      setManager(null);
    };
  }, []);

  // Sync volumes from settings to manager
  useEffect(() => {
    if (!manager) return;
    if (isFinite(settings.musicVolume)) manager.setMusicVolume(settings.musicVolume);
    if (isFinite(settings.soundEffectsVolume)) manager.setSoundEffectsVolume(settings.soundEffectsVolume);
  }, [manager, settings.musicVolume, settings.soundEffectsVolume]);

  // Start/stop music when global setting changes.
  useEffect(() => {
    if (!manager) return;
    if (settings.musicOn) {
      // Attempt to start music; AudioManager handles autoplay unlocking internally.
      manager.startMusic();
    } else {
      manager.stopMusic();
    }
  }, [manager, settings.musicOn]);

  // Keep custom audio (session) in sync with the global manager so "Restore defaults"
  // immediately takes effect even outside the Game screen.
  useEffect(() => {
    if (!manager) return;
    manager.setCustomMusic(customAudio.music ?? null);
    manager.setCustomEffect("eat", customAudio.eat ?? null);
    manager.setCustomEffect("over", customAudio.over ?? null);
    manager.setCustomEffect("phase", customAudio.phase ?? null);
  }, [manager, customAudio.music, customAudio.eat, customAudio.over, customAudio.phase]);

  // Ensure music restarts on SPA navigation (e.g. /menu -> /game).
  useEffect(() => {
    if (!manager) return;

    const ensureMusic = () => {
      if (settings.musicOn) {
        try {
          manager.startMusic();
        } catch {}
      }
    };

    // Dispatch a synthetic event when history.pushState / replaceState are called so we catch SPA navigation.
    const globalKey = "__SNAKE_FLOW_HISTORY_PATCHED__";
    const win = typeof window !== "undefined" ? (window as any) : undefined;
    if (win && !win[globalKey]) {
      const origPush = history.pushState;
      const origReplace = history.replaceState;
      history.pushState = function (...args: any[]) {
        const res = origPush.apply(this, args as any);
        window.dispatchEvent(new Event("snake-flow-navigate"));
        return res;
      };
      history.replaceState = function (...args: any[]) {
        const res = origReplace.apply(this, args as any);
        window.dispatchEvent(new Event("snake-flow-navigate"));
        return res;
      };
      win[globalKey] = true;
    }

    window.addEventListener("snake-flow-navigate", ensureMusic);
    window.addEventListener("popstate", ensureMusic);

    return () => {
      window.removeEventListener("snake-flow-navigate", ensureMusic);
      window.removeEventListener("popstate", ensureMusic);
    };
  }, [manager, settings.musicOn]);

  // Extra resilience: attempt to start music a few times after mount/focus in case autoplay blocks.
  useEffect(() => {
    if (!manager) return;
    if (!settings.musicOn) return;

    try {
      manager.startMusic();
    } catch {}

    const t1 = setTimeout(() => {
      try {
        manager.startMusic();
      } catch {}
    }, 500);
    const t2 = setTimeout(() => {
      try {
        manager.startMusic();
      } catch {}
    }, 2000);

    const onFocus = () => {
      try {
        manager.startMusic();
      } catch {}
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("focus", onFocus);
    };
  }, [manager, settings.musicOn]);

  // Add a one-time user interaction listener to unlock audio context when user interacts.
  useEffect(() => {
    if (!manager) return;
    const events = ["click", "touchstart", "keydown"];
    const handler = async () => {
      try {
        await manager.unlockAudio();
        // If music is enabled, try to start it after unlocking.
        if (settings.musicOn) {
          manager.startMusic();
        }
      } catch {
        // ignore
      }
    };
    events.forEach((e) => document.addEventListener(e, handler, { once: true }));
    return () => {
      events.forEach((e) => document.removeEventListener(e, handler));
    };
  }, [manager, settings.musicOn]);

  const setSoundEnabled = (v: boolean) => {
    // Persist in settings so UI and other hooks stay in sync
    updateSettings({ musicOn: v });
  };

  return (
    <AudioManagerContext.Provider value={{ manager, isSoundEnabled: !!settings.musicOn, setSoundEnabled }}>
      {children}
    </AudioManagerContext.Provider>
  );
}

// Backwards-compatible hook returning only the AudioManager instance (existing callers)
export function useGlobalAudioManager() {
  const ctx = useContext(AudioManagerContext);
  return ctx?.manager ?? null;
}

// New hook to control audio flags
export function useAudioControls() {
  const ctx = useContext(AudioManagerContext);
  if (!ctx) throw new Error("useAudioControls must be used inside AudioManagerProvider");
  return { isSoundEnabled: ctx.isSoundEnabled, setSoundEnabled: ctx.setSoundEnabled, manager: ctx.manager };
}