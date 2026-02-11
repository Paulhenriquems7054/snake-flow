import { useCallback, useRef, useEffect } from "react";

// Audio files from public folder
const AUDIO_FILES = {
  eat: "/come fruta.mp3.mpeg",
  gameOver: "/perde a fase.mp3.mpeg",
  phaseChange: "/Muda de fase.mp3.mpeg",
  music: "/música.mp3.mpeg",
  menuSelect: "/muda de opção.mp3.mpeg"
} as const;

class AudioManager {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private musicAudio: HTMLAudioElement | null = null;
  private isMusicPlaying = false;
  private musicVolume = 0.3;
  private soundEffectsVolume = 0.6;

  private loadAudio(src: string): HTMLAudioElement {
    if (!this.audioCache.has(src)) {
      const audio = new Audio(src);
      audio.preload = "auto";
      this.audioCache.set(src, audio);
    }
    return this.audioCache.get(src)!;
  }

  playSound(src: string, volume = 0.3) {
    try {
      const audio = this.loadAudio(src);
      audio.volume = volume;
      audio.currentTime = 0; // Reset to start
      audio.play().catch(() => {
        // Audio play failed, silently ignore
      });
    } catch {
      // Audio not supported
    }
  }

  playEatSound() {
    this.playSound(AUDIO_FILES.eat, this.soundEffectsVolume * 0.7); // Slightly lower for eat sound
  }

  playGameOverSound() {
    this.playSound(AUDIO_FILES.gameOver, this.soundEffectsVolume * 0.8); // Game over slightly louder
  }

  playPhaseSound() {
    this.playSound(AUDIO_FILES.phaseChange, this.soundEffectsVolume * 0.6);
  }

  playMenuSelectSound() {
    this.playSound(AUDIO_FILES.menuSelect, this.soundEffectsVolume * 0.5); // Menu sounds quieter
  }

  startMusic() {
    if (this.isMusicPlaying) return;

    try {
      if (!this.musicAudio) {
        this.musicAudio = this.loadAudio(AUDIO_FILES.music);
        this.musicAudio.loop = true;
        this.musicAudio.volume = this.musicVolume;
      }

      this.musicAudio.play().then(() => {
        this.isMusicPlaying = true;
      }).catch(() => {
        // Music play failed, silently ignore
      });
    } catch {
      // Audio not supported
    }
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicAudio) {
      this.musicAudio.pause();
      this.musicAudio.currentTime = 0;
    }
  }

  setMusicVolume(volume: number) {
    this.musicVolume = volume;
    if (this.musicAudio) {
      this.musicAudio.volume = volume;
    }
  }

  setSoundEffectsVolume(volume: number) {
    this.soundEffectsVolume = volume;
  }

  fadeForPause() {
    if (this.musicAudio) {
      this.musicAudio.volume = this.musicVolume * 0.3; // 30% of current volume
    }
  }

  fadeForResume() {
    if (this.musicAudio) {
      this.musicAudio.volume = this.musicVolume;
    }
  }

  // Clean up method
  destroy() {
    this.stopMusic();
    this.audioCache.clear();
    this.musicAudio = null;
  }
}

export function useSoundManager(
  musicOn: boolean,
  musicVolume: number,
  soundEffectsOn: boolean,
  soundEffectsVolume: number
) {
  const audioManagerRef = useRef<AudioManager | null>(null);

  // Initialize audio manager
  useEffect(() => {
    audioManagerRef.current = new AudioManager();
    return () => {
      audioManagerRef.current?.destroy();
    };
  }, []);

  // Start/stop music based on setting
  useEffect(() => {
    if (musicOn) {
      audioManagerRef.current?.startMusic();
    } else {
      audioManagerRef.current?.stopMusic();
    }
  }, [musicOn]);

  // Update volumes when they change
  useEffect(() => {
    audioManagerRef.current?.setMusicVolume(musicVolume);
  }, [musicVolume]);

  useEffect(() => {
    audioManagerRef.current?.setSoundEffectsVolume(soundEffectsVolume);
  }, [soundEffectsVolume]);

  const playEat = useCallback(() => {
    if (soundEffectsOn) audioManagerRef.current?.playEatSound();
  }, [soundEffectsOn]);

  const playOver = useCallback(() => {
    if (soundEffectsOn) audioManagerRef.current?.playGameOverSound();
  }, [soundEffectsOn]);

  const playPhase = useCallback(() => {
    if (soundEffectsOn) audioManagerRef.current?.playPhaseSound();
  }, [soundEffectsOn]);

  const playMenuSelect = useCallback(() => {
    if (soundEffectsOn) audioManagerRef.current?.playMenuSelectSound();
  }, [soundEffectsOn]);

  const pauseMusic = useCallback(() => {
    audioManagerRef.current?.fadeForPause();
  }, []);

  const resumeMusic = useCallback(() => {
    audioManagerRef.current?.fadeForResume();
  }, []);

  const stopMusic = useCallback(() => {
    audioManagerRef.current?.stopMusic();
  }, []);

  return { playEat, playOver, playPhase, playMenuSelect, pauseMusic, resumeMusic, stopMusic };
}
