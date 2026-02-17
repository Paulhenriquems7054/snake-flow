import { useCallback, useEffect } from "react";
import { useGlobalAudioManager } from "@/contexts/AudioManagerContext";
import { AudioManager } from "@/utils/audioManager";

export function useSoundManager(
  musicOn: boolean,
  musicVolume: number,
  soundEffectsOn: boolean,
  soundEffectsVolume: number,
  custom?: { music?: string | null; eat?: string | null; over?: string | null; phase?: string | null }
) {
  const audioManager = useGlobalAudioManager();

  // Set custom music
  const setCustomMusic = useCallback((url: string | null) => {
    audioManager?.setCustomMusic(url);
  }, [audioManager]);
  const setCustomEffect = useCallback((kind: "eat" | "over" | "phase", url: string | null) => {
    audioManager?.setCustomEffect(kind, url);
  }, [audioManager]);

  // Apply initial custom URLs (session)
  useEffect(() => {
    if (!audioManager) return;
    if (custom) {
      if (typeof custom.music !== "undefined") audioManager.setCustomMusic(custom.music ?? null);
      if (typeof custom.eat !== "undefined") audioManager.setCustomEffect("eat", custom.eat ?? null);
      if (typeof custom.over !== "undefined") audioManager.setCustomEffect("over", custom.over ?? null);
      if (typeof custom.phase !== "undefined") audioManager.setCustomEffect("phase", custom.phase ?? null);
    }
  }, [audioManager, custom]);

  // Start/stop music based on setting
  useEffect(() => {
    if (audioManager) {
      if (musicOn) {
        audioManager.startMusic();
      } else {
        audioManager.stopMusic();
      }
    }
  }, [audioManager, musicOn]);

  // Update volumes when they change
  useEffect(() => {
    if (audioManager && isFinite(musicVolume)) {
      audioManager.setMusicVolume(musicVolume);
    }
  }, [audioManager, musicVolume]);

  useEffect(() => {
    if (audioManager && isFinite(soundEffectsVolume)) {
      audioManager.setSoundEffectsVolume(soundEffectsVolume);
    }
  }, [audioManager, soundEffectsVolume]);

  const playEat = useCallback(() => {
    if (soundEffectsOn) audioManager?.playEatSound();
  }, [audioManager, soundEffectsOn]);

  const playOver = useCallback(() => {
    if (soundEffectsOn) audioManager?.playGameOverSound();
  }, [audioManager, soundEffectsOn]);

  const playPhase = useCallback(() => {
    if (soundEffectsOn) audioManager?.playPhaseSound();
  }, [audioManager, soundEffectsOn]);

  const playMenuSelect = useCallback(() => {
    if (soundEffectsOn) audioManager?.playMenuSelectSound();
  }, [audioManager, soundEffectsOn]);

  const pauseMusic = useCallback(() => {
    audioManager?.fadeForPause();
  }, [audioManager]);

  const resumeMusic = useCallback(() => {
    audioManager?.fadeForResume();
  }, [audioManager]);

  const stopMusic = useCallback(() => {
    audioManager?.stopMusic();
  }, [audioManager]);

  return { playEat, playOver, playPhase, playMenuSelect, pauseMusic, resumeMusic, stopMusic, setCustomMusic, setCustomEffect };
}
