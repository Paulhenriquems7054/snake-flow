import { useCallback, useState, useEffect } from "react";

interface CustomMusicFile {
  id: string;
  name: string;
  url: string;
  type: "upload" | "builtin";
}

interface CustomMusicState {
  files: CustomMusicFile[];
  currentIndex: number;
  isEnabled: boolean;
}

const CUSTOM_MUSIC_KEY = "snake-flow-custom-music";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FORMATS = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3"];

export function useCustomMusic() {
  const [musicState, setMusicState] = useState<CustomMusicState>({
    files: [],
    currentIndex: 0,
    isEnabled: false,
  });

  // Load saved custom music from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CUSTOM_MUSIC_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMusicState(parsed);
      } catch (error) {
        console.error("Failed to load custom music state:", error);
      }
    }
  }, []);

  // Save custom music state to localStorage
  const saveState = useCallback((state: CustomMusicState) => {
    try {
      localStorage.setItem(CUSTOM_MUSIC_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save custom music state:", error);
    }
  }, []);

  // Upload custom music file
  const uploadMusic = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Validate file type
      if (!ALLOWED_FORMATS.includes(file.type)) {
        reject(new Error("Formato de arquivo não suportado. Use MP3, WAV ou OGG."));
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        reject(new Error("Arquivo muito grande. Máximo: 10MB."));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const url = e.target?.result as string;
          const newFile: CustomMusicFile = {
            id: Date.now().toString(),
            name: file.name,
            url,
            type: "upload",
          };

          setMusicState((prev) => {
            const newState = {
              ...prev,
              files: [...prev.files, newFile],
            };
            saveState(newState);
            return newState;
          });

          resolve(newFile.id);
        } catch (error) {
          reject(new Error("Erro ao processar arquivo de áudio."));
        }
      };

      reader.onerror = () => {
        reject(new Error("Erro ao ler arquivo."));
      };

      reader.readAsDataURL(file);
    });
  }, [saveState]);

  // Remove custom music file
  const removeMusic = useCallback((fileId: string) => {
    setMusicState((prev) => {
      const file = prev.files.find(f => f.id === fileId);
      if (file && file.type === "upload") {
        // Revoke object URL to free memory
        URL.revokeObjectURL(file.url);
      }

      const newFiles = prev.files.filter(f => f.id !== fileId);
      const newIndex = prev.currentIndex >= newFiles.length ? 0 : prev.currentIndex;
      
      const newState = {
        ...prev,
        files: newFiles,
        currentIndex: newIndex,
      };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // Select current music
  const selectMusic = useCallback((fileId: string) => {
    setMusicState((prev) => {
      const index = prev.files.findIndex(f => f.id === fileId);
      if (index === -1) return prev;

      const newState = {
        ...prev,
        currentIndex: index,
      };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // Enable/disable custom music
  const toggleCustomMusic = useCallback((enabled: boolean) => {
    setMusicState((prev) => {
      const newState = {
        ...prev,
        isEnabled: enabled,
      };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // Get current music URL
  const getCurrentMusic = useCallback((): string | null => {
    if (!musicState.isEnabled || musicState.files.length === 0) return null;
    return musicState.files[musicState.currentIndex]?.url || null;
  }, [musicState]);

  // Cycle to next music
  const nextMusic = useCallback(() => {
    setMusicState((prev) => {
      if (prev.files.length === 0) return prev;
      
      const newIndex = (prev.currentIndex + 1) % prev.files.length;
      const newState = {
        ...prev,
        currentIndex: newIndex,
      };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // Cycle to previous music
  const previousMusic = useCallback(() => {
    setMusicState((prev) => {
      if (prev.files.length === 0) return prev;
      
      const newIndex = prev.currentIndex === 0 ? prev.files.length - 1 : prev.currentIndex - 1;
      const newState = {
        ...prev,
        currentIndex: newIndex,
      };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  return {
    musicState,
    uploadMusic,
    removeMusic,
    selectMusic,
    toggleCustomMusic,
    getCurrentMusic,
    nextMusic,
    previousMusic,
  };
}