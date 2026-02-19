// Audio files served from Vite `public/` folder.
// IMPORTANT: these paths must match filenames EXACTLY (use unaccented, no spaces)
// to avoid URL encoding issues on some hosts and Android WebViews.
const AUDIO_FILES = {
  eat: "/come-fruta.mp3",
  gameOver: "/perde-afase.mp3",
  phaseChange: "/muda-de-fase.mp3",
  music: "/musica.mp3",
  menuSelect: "/muda-de-opcao.mp3",
} as const;

// Background music tracks (fallback rotation). Keep only files that exist in `public/`.
const BACKGROUND_MUSIC_TRACKS = [
  AUDIO_FILES.music,
] as const;

export class AudioManager {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private musicAudio: HTMLAudioElement | null = null;
  private isMusicPlaying = false;
  private isMusicUnlockPending = false;
  private hasUserUnlockedAudio = false;
  private webAudioUnlockAttempted = false;
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
      // Helps some Android WebViews treat audio as inline media.
      try {
        audio.setAttribute("playsinline", "true");
        audio.setAttribute("webkit-playsinline", "true");
      } catch {}

      // Add error handling for loading
      audio.addEventListener('error', (e) => {
        const target = (e.currentTarget ?? e.target) as HTMLAudioElement | null;
        console.error(`[AudioManager] Failed to load audio file: ${src}`, e);
        console.error(`[AudioManager] Error code: ${target?.error?.code}`);
        console.error(`[AudioManager] Error message: ${target?.error?.message}`);
        console.error(`[AudioManager] Network state: ${target?.networkState}`);
        console.error(`[AudioManager] Ready state: ${target?.readyState}`);
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
      // If the app has already been unlocked by a gesture once, this is a no-op.
      // If it hasn't, some WebViews will still block play() outside a gesture — we handle that below.
      try {
        await this.ensureAudioUnlocked();
      } catch {}

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
    const next = url ?? null;
    // Avoid restarting music when the URL hasn't actually changed (common on route mounts).
    if (next === this.customMusicUrl) return;

    this.customMusicUrl = next;
    this.isCustomMusic = !!next;

    // If music is currently playing, restart with new music
    if (this.isMusicPlaying) {
      this.stopMusic();
      this.startMusic();
    }
  }
  setCustomEffect(kind: "eat" | "over" | "phase", url: string | null) {
    const next = url ?? null;
    if (kind === "eat") {
      if (this.customEatUrl === next) return;
      this.customEatUrl = next;
    }
    if (kind === "over") {
      if (this.customOverUrl === next) return;
      this.customOverUrl = next;
    }
    if (kind === "phase") {
      if (this.customPhaseUrl === next) return;
      this.customPhaseUrl = next;
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
    console.debug("[AudioManager] startMusic() called — isMusicPlaying:", this.isMusicPlaying);
    // If we already consider music playing, try to resume if the element is paused.
    if (this.isMusicPlaying) {
      if (this.musicAudio && this.musicAudio.paused) {
        this.musicAudio.play().then(() => {
          this.isMusicPlaying = true;
          console.debug("[AudioManager] resumed paused musicAudio");
        }).catch((e) => {
          console.warn("[AudioManager] failed to resume paused musicAudio", e);
        });
      }
      return;
    }

    try {
      if (!this.musicAudio) {
        const musicSrc = this.getNextMusicTrack();
        this.musicAudio = this.loadAudio(musicSrc);
        this.musicAudio.loop = true;
        // Ensure autoplay-friendly start: start muted and with volume 0, then unmute after play succeeds.
        this.musicAudio.muted = true;
        this.musicAudio.volume = 0;
        console.debug("[AudioManager] created musicAudio src=", musicSrc);

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

      // Try to unlock audio via Web Audio API before attempting to play
      const tryPlay = async () => {
        await this.ensureAudioUnlocked();
        return this.musicAudio!.play();
      };

      tryPlay().then(() => {
        this.isMusicPlaying = true;
        console.debug("[AudioManager] musicAudio.play() succeeded");
        // Unmute and fade in volume over 800ms
        const target = isFinite(this.musicVolume) ? this.musicVolume : 0.3;
        try {
          if (this.musicAudio) this.musicAudio.muted = false;
        } catch {}
        const start = performance.now();
        const duration = 800;
        const step = () => {
          const now = performance.now();
          const t = Math.min(1, (now - start) / duration);
          try {
            if (this.musicAudio) this.musicAudio.volume = target * t;
          } catch {}
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }).catch((error: any) => {
        console.warn("[AudioManager] musicAudio.play() failed:", error);
        // Autoplay policies often block music because we start via useEffect.
        // If blocked, retry once on next user interaction.
        if (error?.name === "NotAllowedError") {
          if (this.isMusicUnlockPending) return;
          this.isMusicUnlockPending = true;

          const unlockMusic = async () => {
            try {
              await this.musicAudio?.play();
              this.isMusicPlaying = true;
              this.isMusicUnlockPending = false;
              try { if (this.musicAudio) this.musicAudio.muted = false; } catch {}
              document.removeEventListener("click", unlockMusic);
              document.removeEventListener("touchstart", unlockMusic);
              document.removeEventListener("keydown", unlockMusic);
            } catch (e) {
              // If it still fails, allow future retries
              this.isMusicUnlockPending = false;
              console.warn("[AudioManager] Failed to unlock music:", e);
            }
          };

          document.addEventListener("click", unlockMusic, { once: true });
          document.addEventListener("touchstart", unlockMusic, { once: true });
          document.addEventListener("keydown", unlockMusic, { once: true });
        } else {
          console.warn("[AudioManager] Music play failed:", error?.name, error?.message);
        }
      });
    } catch {
      // Audio not supported
    }
  }

  stopMusic() {
    console.debug("[AudioManager] stopMusic() called");
    // Trace caller for debugging
    try { console.trace(); } catch {}

    // If user is on game route, avoid fully pausing music — fade to low volume instead.
    try {
      const path = typeof window !== "undefined" ? window.location.pathname : "";
      if (path && path.startsWith("/game")) {
        console.debug("[AudioManager] stopMusic() intercepted on /game — fading instead of pausing");
        this.fadeForPause();
        this.isMusicPlaying = true; // keep flag so resume logic won't try to recreate element
        return;
      }
    } catch (e) {
      // ignore
    }

    this.isMusicPlaying = false;
    if (this.musicAudio) {
      try {
        this.musicAudio.pause();
        this.musicAudio.currentTime = 0;
      } catch (e) {
        console.warn("[AudioManager] stopMusic() error", e);
      }
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
    console.debug("[AudioManager] fadeForPause()");
    if (this.musicAudio) {
      const fadeVolume = this.musicVolume * 0.3;
      try { this.musicAudio.volume = isFinite(fadeVolume) ? fadeVolume : 0.1; } catch {}
    }
  }

  fadeForResume() {
    console.debug("[AudioManager] fadeForResume()");
    if (this.musicAudio) {
      try { this.musicAudio.volume = isFinite(this.musicVolume) ? this.musicVolume : 0.3; } catch {}
    }
  }

  // Clean up method
  destroy() {
    this.stopMusic();
    this.audioCache.clear();
    this.musicAudio = null;
  }
  /**
   * Try to unlock audio by resuming/using the Web Audio API.
   * This helps WebViews that block HTMLAudio autoplay until a user gesture
   * resumes an AudioContext or a short buffer is played.
   */
  private async ensureAudioUnlocked(opts: { force?: boolean } = {}): Promise<void> {
    // Avoid creating AudioContexts on every sound call; but allow a forced retry
    // when we know we're inside a user gesture (unlockAudio()).
    if (this.webAudioUnlockAttempted && !opts.force) return;
    this.webAudioUnlockAttempted = true;
    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      // Play tiny silent buffer to ensure audio is unlocked
      const buffer = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      src.start(0);
      // Stop immediately
      src.stop(0);
      // Close context if supported
      if (typeof (ctx as any).close === 'function') {
        try { (ctx as any).close(); } catch {}
      }
    } catch (e) {
      // ignore
    }
  }

  private async primeElementForGesture(audio: HTMLAudioElement): Promise<void> {
    // Some Android WebViews require each HTMLAudioElement to be started at least once
    // within a user gesture before future non-gesture playback is allowed (e.g. from a game loop).
    const prevMuted = audio.muted;
    const prevVolume = audio.volume;
    const prevTime = audio.currentTime;
    try {
      audio.muted = true;
      audio.volume = 0;
      audio.currentTime = 0;
      try { audio.load(); } catch {}

      const p = audio.play();
      if (p && typeof (p as any).then === "function") {
        await p.then(() => {}).catch(() => {});
      }

      try { audio.pause(); } catch {}
      try { audio.currentTime = 0; } catch {}
    } finally {
      try { audio.muted = prevMuted; } catch {}
      try { audio.volume = prevVolume; } catch {}
      try { audio.currentTime = prevTime; } catch {}
    }
  }
  /**
   * Public method to attempt unlocking audio without starting playback.
   * Useful to call on first user interaction so autoplay policies are satisfied.
   */
  public async unlockAudio(): Promise<void> {
    // Unlock WebAudio (helps some WebViews) and prime HTMLAudio elements for effects.
    await this.ensureAudioUnlocked({ force: true });

    // Prime default effect sounds so they can later play from non-gesture code (game loop).
    const effectSrcs = [
      this.customEatUrl ?? AUDIO_FILES.eat,
      this.customOverUrl ?? AUDIO_FILES.gameOver,
      this.customPhaseUrl ?? AUDIO_FILES.phaseChange,
      AUDIO_FILES.menuSelect,
    ];

    // Prime sequentially to avoid stressing the audio pipeline on slower devices.
    for (const src of effectSrcs) {
      try {
        const a = this.loadAudio(src);
        await this.primeElementForGesture(a);
      } catch {
        // ignore
      }
    }

    // Mark that we've performed a user-gesture unlock + priming at least once.
    this.hasUserUnlockedAudio = true;
  }
}