import { useCallback, useRef, useEffect } from "react";

// Audio files from public folder
const AUDIO_FILES = {
  eat: "/come fruta.mp3.mpeg",
  gameOver: "/perde a fase.mp3.mpeg",
  phaseChange: "/Muda de fase.mp3.mpeg",
  music: "/música.mp3.mpeg",
  menuSelect: "/muda de opção.mp3.mpeg"
} as const;

// Multiple background music tracks
const BACKGROUND_MUSIC_TRACKS = [
  "/música.mp3.mpeg",
  "/música2.mp3.mpeg",
  "/música3.mp3.mpeg",
  "/música4.mp3.mpeg"
] as const;

class AudioManager {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private musicAudio: HTMLAudioElement | null = null;
  private isMusicPlaying = false;
  private musicVolume = 0.3;
  private soundEffectsVolume = 0.6;
  private currentMusicTrack = 0;
  private customMusicUrl: string | null = null;
  private isCustomMusic = false;

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

  setCustomMusic(url: string | null) {
    this.customMusicUrl = url;
    this.isCustomMusic = !!url;
    
    // If music is currently playing, restart with new music
    if (this.isMusicPlaying) {
      this.stopMusic();
      this.startMusic();
    }
  }

  getNextMusicTrack(): string {
    if (this.isCustomMusic && this.customMusicUrl) {
      return this.customMusicUrl;
    }
    
    const track = BACKGROUND_MUSIC_TRACKS[this.currentMusicTrack % BACKGROUND_MUSIC_TRACKS.length];
    this.currentMusicTrack++;
    return track;
  }

  startMusic() {
    if (this.isMusicPlaying) return;

    try {
      if (!this.musicAudio) {
        const musicSrc = this.getNextMusicTrack();
        this.musicAudio = this.loadAudio(musicSrc);
        this.musicAudio.loop = true;
        this.musicAudio.volume = this.musicVolume;
        
        // Add ended event listener to cycle through tracks
        this.musicAudio.addEventListener('ended', () => {
          if (!this.isCustomMusic) {
            this.currentMusicTrack++;
            this.musicAudio!.src = this.getNextMusicTrack();
            this.musicAudio!.currentTime = 0;
            this.musicAudio!.play().catch(() => {});
          }
        });
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
    // Ensure volume is a valid finite number between 0 and 1
    const validVolume = Math.max(0, Math.min(1, volume));
    this.musicVolume = isFinite(validVolume) ? validVolume : 0.3;
    if (this.musicAudio) {
      this.musicAudio.volume = this.musicVolume;
    }
  }

  setSoundEffectsVolume(volume: number) {
    // Ensure volume is a valid finite number between 0 and 1
    const validVolume = Math.max(0, Math.min(1, volume));
    this.soundEffectsVolume = isFinite(validVolume) ? validVolume : 0.6;
  }

  fadeForPause() {
    if (this.musicAudio) {
      const fadeVolume = this.musicVolume * 0.3;
      this.musicAudio.volume = isFinite(fadeVolume) ? fadeVolume : 0.1;
    }
  }

  fadeForResume() {
    if (this.musicAudio) {
      this.musicAudio.volume = isFinite(this.musicVolume) ? this.musicVolume : 0.3;
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

  // Set custom music
  const setCustomMusic = useCallback((url: string | null) => {
    audioManagerRef.current?.setCustomMusic(url);
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
    if (audioManagerRef.current && isFinite(musicVolume)) {
      audioManagerRef.current.setMusicVolume(musicVolume);
    }
  }, [musicVolume]);

  useEffect(() => {
    if (audioManagerRef.current && isFinite(soundEffectsVolume)) {
      audioManagerRef.current.setSoundEffectsVolume(soundEffectsVolume);
    }
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

  return { playEat, playOver, playPhase, playMenuSelect, pauseMusic, resumeMusic, stopMusic, setCustomMusic };
}
