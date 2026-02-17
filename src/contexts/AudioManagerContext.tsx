import React, { createContext, useContext, ReactNode, useEffect } from "react";
import { AudioManager } from "@/utils/audioManager";

const AudioManagerContext = createContext<AudioManager | null>(null);

// Global AudioManager instance
let globalAudioManager: AudioManager | null = null;

export function AudioManagerProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    globalAudioManager = new AudioManager();
    return () => {
      globalAudioManager?.destroy();
      globalAudioManager = null;
    };
  }, []);

  return (
    <AudioManagerContext.Provider value={globalAudioManager}>
      {children}
    </AudioManagerContext.Provider>
  );
}

export function useGlobalAudioManager() {
  const context = useContext(AudioManagerContext);
  return context;
}