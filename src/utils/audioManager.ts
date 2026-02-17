// Audio files from public folder
const AUDIO_FILES = {
  eat: "/come fruta.mp3",
  gameOver: "/perde a fase.mp3",
  phaseChange: "/Muda de fase.mp3",
  music: "/música.mp3",
  menuSelect: "/muda de opção.mp3"
} as const;

// Multiple background music tracks
const BACKGROUND_MUSIC_TRACKS = [
  "/música.mp3",
  "/música2.mp3",
  "/música3.mp3",
  "/música4.mp3"
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
      const audio = new Audio(src);
      audio.preload = "auto";

      // Add error handling for loading
      audio.addEventListener('error', (e) => {
        console.error(`Failed to load audio file: ${src}`, e);
      });

      audio.addEventListener('canplaythrough', () => {
        console.log(`Audio loaded successfully: ${src}`);
      });

      // Check if file exists
      this.checkAudioExists(src).then(exists => {
        if (!exists) {
          console.warn(`Audio file does not exist: ${src}`);
        }
      });

      this.audioCache.set(src, audio);
    }
    return this.audioCache.get(src)!;
  }

  playSound(src: string, volume = 0.3) {
    try {
      const audio = this.loadAudio(src);
      audio.volume = volume;
      audio.currentTime = 0; // Reset to start
      audio.play().catch((error) => {
        // Audio play failed, log for debugging
        console.warn(`Failed to play audio: ${src}`, error);
      });
    } catch (error) {
      // Audio not supported
      console.warn(`Audio not supported: ${src}`, error);
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