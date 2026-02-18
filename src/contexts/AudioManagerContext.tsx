import React, { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { AudioManager } from "@/utils/audioManager";

const AudioManagerContext = createContext<AudioManager | null>(null);

export function AudioManagerProvider({ children }: { children: ReactNode }) {
  const [manager, setManager] = useState<AudioManager | null>(null);

  useEffect(() => {
    const m = new AudioManager();
    setManager(m);

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

    // Global fallback: attempt to start/unlock music on first real user interaction.
    // This helps when WebViews (APK) still block audio unless the gesture triggers playback.
    const unlockMusicFallback = async () => {
      try {
        // Try to initialize Web Audio API first (resume context)
        await initAudio();
        // Then attempt to start music via the AudioManager instance.
        // startMusic() is safe to call — it will no-op if music is already playing.
        try {
          m.startMusic();
        } catch (e) {
          // ignore any errors from starting music
        }
      } catch {}
    };

    events.forEach(event => {
      document.addEventListener(event, unlockMusicFallback, { once: true });
    });

    return () => {
      m.destroy();
      setManager(null);
      events.forEach(event => {
        document.removeEventListener(event, initAudio);
      });
    };
  }, []);

  return (
    <AudioManagerContext.Provider value={manager}>
      {children}
    </AudioManagerContext.Provider>
  );
}

export function useGlobalAudioManager() {
  const context = useContext(AudioManagerContext);
  return context;
}