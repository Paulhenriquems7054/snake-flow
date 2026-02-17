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

export class AudioManager {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private musicAudio: HTMLAudioElement | null = null;
  private isMusicPlaying = false;
  private musicVolume = 0.3;
  private soundEffectsVolume = 0.6;
  private currentMusicTrack = 0;
  private customMusicUrl: string | null = null;
  private isCustomMusic = false;
  private customEatUrl: string | null = null;
  private customOverUrl: string | null = null;
  private customPhaseUrl: string | null = null;

  private async checkAudioExists(src: string): Promise<boolean> {
    try {
      const response = await fetch(src, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  private loadAudio(src: string): HTMLAudioElement {
    if (!this.audioCache.has(src)) {
      console.log(`[AudioManager] Loading audio: ${src}`);
      const audio = new Audio(src);
      audio.preload = "auto";

      // Add error handling for loading
      audio.addEventListener('error', (e) => {
        console.error(`[AudioManager] Failed to load audio file: ${src}`, e);
        console.error(`[AudioManager] Error code: ${e.target?.error?.code}`);
        console.error(`[AudioManager] Error message: ${e.target?.error?.message}`);
        console.error(`[AudioManager] Network state: ${e.target?.networkState}`);
        console.error(`[AudioManager] Ready state: ${e.target?.readyState}`);
      });

      audio.addEventListener('canplaythrough', () => {
        console.log(`[AudioManager] Audio loaded successfully: ${src}`);
      });

      audio.addEventListener('loadstart', () => {
        console.log(`[AudioManager] Started loading: ${src}`);
      });

      audio.addEventListener('loadeddata', () => {
        console.log(`[AudioManager] Data loaded: ${src}`);
      });

      audio.addEventListener('canplay', () => {
        console.log(`[AudioManager] Can play: ${src}`);
      });

      this.audioCache.set(src, audio);
    } else {
      console.log(`[AudioManager] Using cached audio: ${src}`);
    }
    return this.audioCache.get(src)!;
  }

  async playSound(src: string, volume = 0.3) {
    console.log(`[AudioManager] Attempting to play sound: ${src} at volume ${volume}`);
    try {
      const audio = this.loadAudio(src);
      audio.volume = volume;
      audio.currentTime = 0; // Reset to start

      console.log(`[AudioManager] Audio element state: networkState=${audio.networkState}, readyState=${audio.readyState}, duration=${audio.duration}`);

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log(`[AudioManager] Audio playing successfully: ${src}`);
        }).catch(async (error) => {
          console.error(`[AudioManager] Play failed for ${src}:`, error);
          if (error.name === 'NotAllowedError') {
            console.log('[AudioManager] Audio blocked by autoplay policy - waiting for user interaction');

            // Try to unlock audio on next user interaction
            const unlockAudio = async () => {
              console.log('[AudioManager] Attempting to unlock audio after user interaction');
              try {
                await audio.play();
                console.log('[AudioManager] Audio unlocked successfully');
                document.removeEventListener('click', unlockAudio);
                document.removeEventListener('touchstart', unlockAudio);
                document.removeEventListener('keydown', unlockAudio);
              } catch (e) {
                console.warn('[AudioManager] Failed to unlock audio:', e);
              }
            };

            document.addEventListener('click', unlockAudio, { once: true });
            document.addEventListener('touchstart', unlockAudio, { once: true });
            document.addEventListener('keydown', unlockAudio, { once: true });

          } else {
            console.warn(`[AudioManager] Audio error: ${src}`, error.name, error.message);
          }
        });
      } else {
        console.log(`[AudioManager] Play promise undefined for ${src}`);
      }
    } catch (error) {
      console.error(`[AudioManager] Audio not supported: ${src}`, error);
    }
  }

  playEatSound() {
    const src = this.customEatUrl ?? AUDIO_FILES.eat;
    this.playSound(src, this.soundEffectsVolume * 0.7);
  }

  playGameOverSound() {
    const src = this.customOverUrl ?? AUDIO_FILES.gameOver;
    this.playSound(src, this.soundEffectsVolume * 0.8);
  }

  playPhaseSound() {
    const src = this.customPhaseUrl ?? AUDIO_FILES.phaseChange;
    this.playSound(src, this.soundEffectsVolume * 0.6);
  }

  playMenuSelectSound() {
    this.playSound(AUDIO_FILES.menuSelect, this.soundEffectsVolume * 0.5);
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
  setCustomEffect(kind: "eat" | "over" | "phase", url: string | null) {
    if (kind === "eat") this.customEatUrl = url;
    if (kind === "over") this.customOverUrl = url;
    if (kind === "phase") this.customPhaseUrl = url;
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