import { useState, useRef } from "react";
import { Music, Upload, Trash2, Play, SkipForward, SkipBack, Volume2, VolumeX } from "lucide-react";
import { useCustomMusic } from "@/hooks/useCustomMusic";

interface Props {
  onMusicChange?: (musicUrl: string | null) => void;
  currentTheme?: {
    hudText: string;
    hudBg: string;
    snakeColor: string;
  };
}

export default function CustomMusicManager({ onMusicChange, currentTheme }: Props) {
  const { musicState, uploadMusic, removeMusic, selectMusic, toggleCustomMusic, getCurrentMusic } = useCustomMusic();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      await uploadMusic(file);
      // Notify parent of music change
      if (onMusicChange) {
        const currentMusic = getCurrentMusic();
        onMusicChange(currentMusic);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Erro ao fazer upload da música");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveMusic = (fileId: string) => {
    removeMusic(fileId);
    if (onMusicChange) {
      const currentMusic = getCurrentMusic();
      onMusicChange(currentMusic);
    }
  };

  const handleToggleCustomMusic = (enabled: boolean) => {
    toggleCustomMusic(enabled);
    if (onMusicChange) {
      const currentMusic = getCurrentMusic();
      onMusicChange(currentMusic);
    }
  };

  const handleSelectMusic = (fileId: string) => {
    selectMusic(fileId);
    if (onMusicChange) {
      const currentMusic = getCurrentMusic();
      onMusicChange(currentMusic);
    }
  };

  const theme = currentTheme || {
    hudText: "#22c55e",
    hudBg: "#111d33",
    snakeColor: "#22c55e"
  };

  return (
    <div className="space-y-4 p-4 rounded-lg" style={{ backgroundColor: theme.hudBg }}>
      <div className="flex items-center justify-between">
        <h3 className="font-game text-lg flex items-center gap-2" style={{ color: theme.hudText }}>
          <Music className="w-5 h-5" />
          Músicas Personalizadas
        </h3>
        <button
          onClick={() => handleToggleCustomMusic(!musicState.isEnabled)}
          className="p-2 rounded-lg transition-colors hover:opacity-80"
          style={{ color: theme.hudText }}
          title={musicState.isEnabled ? "Desativar músicas personalizadas" : "Ativar músicas personalizadas"}
        >
          {musicState.isEnabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Upload Section */}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full font-game text-sm px-4 py-2 rounded-lg border transition-all hover:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ borderColor: theme.snakeColor, color: theme.snakeColor }}
        >
          <Upload className="w-4 h-4" />
          {isUploading ? "Fazendo Upload..." : "Upload de Música"}
        </button>

        {uploadError && (
          <div className="font-game text-xs px-3 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30">
            {uploadError}
          </div>
        )}
      </div>

      {/* Music List */}
      {musicState.files.length > 0 && (
        <div className="space-y-2">
          <p className="font-game text-xs opacity-70" style={{ color: theme.hudText }}>
            Suas Músicas ({musicState.files.length})
          </p>
          
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {musicState.files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: file.id === musicState.files[musicState.currentIndex]?.id 
                    ? `${theme.snakeColor}20` 
                    : "transparent"
                }}
              >
                <button
                  onClick={() => handleSelectMusic(file.id)}
                  className="flex-1 text-left font-game text-xs truncate hover:opacity-80 transition-opacity"
                  style={{ color: theme.hudText }}
                  title={file.name}
                >
                  {file.name}
                  {file.id === musicState.files[musicState.currentIndex]?.id && (
                    <Play className="w-3 h-3 inline ml-2" />
                  )}
                </button>
                
                {file.type === "upload" && (
                  <button
                    onClick={() => handleRemoveMusic(file.id)}
                    className="p-1 rounded hover:opacity-80 transition-opacity"
                    style={{ color: theme.hudText }}
                    title="Remover música"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Navigation Controls */}
          {musicState.files.length > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  // Implement previous music logic
                }}
                className="p-2 rounded-lg transition-colors hover:opacity-80"
                style={{ color: theme.hudText }}
                title="Música anterior"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              
              <span className="font-game text-xs px-2" style={{ color: theme.hudText }}>
                {musicState.currentIndex + 1} / {musicState.files.length}
              </span>
              
              <button
                onClick={() => {
                  // Implement next music logic
                }}
                className="p-2 rounded-lg transition-colors hover:opacity-80"
                style={{ color: theme.hudText }}
                title="Próxima música"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {musicState.files.length === 0 && (
        <div className="text-center py-4 opacity-50">
          <Music className="w-8 h-8 mx-auto mb-2" style={{ color: theme.hudText }} />
          <p className="font-game text-xs" style={{ color: theme.hudText }}>
            Nenhuma música personalizada
          </p>
        </div>
      )}
    </div>
  );
}