import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Play, Trophy, Settings, Info, RotateCcw } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useSoundManager } from "@/hooks/useSoundManager";
import { useTranslation } from "react-i18next";

const MenuScreen = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { record, saveData, setSaveData, settings } = useSettings();
  const { playMenuSelect } = useSoundManager(settings.musicOn, settings.musicVolume, true, settings.soundEffectsVolume); // Respect global music setting, always play menu effects

  // Background music is managed globally by AudioManagerProvider and Settings.

  const hasSave = !!saveData;

  const handleContinue = () => {
    playMenuSelect();
    navigate("/game");
  };

  const handleNewGame = () => {
    playMenuSelect();
    setSaveData(null);
    navigate("/game");
  };

  const menuItems = [
    { label: t("Record"), icon: Trophy, path: "/record", delay: "0.2s" },
    { label: t("Settings"), icon: Settings, path: "/settings", delay: "0.3s" },
    { label: t("Credits"), icon: Info, path: "/credits", delay: "0.4s" },
  ];

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-10 w-full max-w-xs px-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 animate-fade-in">
          <span className="text-5xl animate-snake-move">🐍</span>
          <h1 className="font-game text-3xl font-bold neon-text tracking-wider">
            SNAKE FLOW
          </h1>
        </div>

        {/* Last score */}
        {record.highScore > 0 && (
          <div className="animate-fade-in text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("Best Score")}</p>
            <p className="font-game text-xl text-primary">{record.highScore}</p>
          </div>
        )}

        {/* Play buttons */}
        <div className="flex flex-col gap-3 w-full">
          {hasSave && (
            <button
              onClick={handleContinue}
              className="group flex items-center gap-4 w-full px-6 py-4 rounded-xl bg-primary/10 border border-primary hover:neon-glow-box transition-all duration-300 animate-fade-in"
              style={{ animationDelay: "0.05s" }}
            >
              <RotateCcw className="w-5 h-5 text-primary transition-transform duration-200 group-hover:scale-110" />
              <div className="flex flex-col items-start">
                <span className="font-game text-sm tracking-wider text-primary">
                  {t("Continue")}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {t("Score")}: {saveData.gameState.score} · {t("Phase")}: {saveData.gameState.phase}
                </span>
              </div>
            </button>
          )}

          <button
            onClick={handleNewGame}
            className="group flex items-center gap-4 w-full px-6 py-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:neon-glow-box transition-all duration-300 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <Play className="w-5 h-5 text-primary transition-transform duration-200 group-hover:scale-110" />
            <span className="font-game text-sm tracking-wider text-foreground group-hover:text-primary transition-colors">
              {hasSave ? t("New Game") : t("PLAY AGAIN")}
            </span>
          </button>

          {menuItems.map((item) => (
            <button
              key={item.label}
            onClick={() => {
                playMenuSelect();
                navigate(item.path);
              }}
              className="group flex items-center gap-4 w-full px-6 py-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:neon-glow-box transition-all duration-300 animate-fade-in"
              style={{ animationDelay: item.delay }}
            >
              <item.icon className="w-5 h-5 text-primary transition-transform duration-200 group-hover:scale-110" />
              <span className="font-game text-sm tracking-wider text-foreground group-hover:text-primary transition-colors">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuScreen;
