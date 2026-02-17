import React, { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { AudioManager } from "@/utils/audioManager";

const AudioManagerContext = createContext<AudioManager | null>(null);

// Global AudioManager instance
let globalAudioManager: AudioManager | null = null;

export function AudioManagerProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    globalAudioManager = new AudioManager();

    // Initialize audio context on first user interaction
    const initAudio = async () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
      } catch (e) {
        console.warn('Web Audio API not supported');
      }
    };

    // Add event listeners for user interaction to unlock audio
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, initAudio, { once: true });
    });

    return () => {
      globalAudioManager?.destroy();
      globalAudioManager = null;
      events.forEach(event => {
        document.removeEventListener(event, initAudio);
      });
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