import { useNavigate } from "react-router-dom";
import { ArrowLeft, Languages, Volume2, VolumeX, Sun, Moon, Monitor, Smartphone, Gamepad2 } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "react-i18next";
import type { AppTheme, Difficulty } from "@/types/game";

const SettingsScreen = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();

  const appThemes: { value: AppTheme; label: string; icon: typeof Sun }[] = [
    { value: "system", label: t("System"), icon: Monitor },
    { value: "light", label: t("Light"), icon: Sun },
    { value: "dark", label: t("Dark"), icon: Moon },
  ];

  const difficulties: { value: Difficulty; label: string; desc: string }[] = [
    { value: "easy", label: t("Easy"), desc: t("Slow speed, gentle progression") },
    { value: "medium", label: t("Medium"), desc: t("Balanced speed and progression") },
    { value: "hard", label: t("Hard"), desc: t("Fast speed, aggressive progression") },
  ];

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <button onClick={() => navigate("/menu")} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-game text-lg tracking-wider text-foreground">{t("Settings")}</h1>
      </div>

      <div className="flex flex-col gap-6 p-5 max-w-md mx-auto w-full animate-fade-in">
        {/* Audio */}
        <Section title={t("Audio")}>
          <VolumeRow
            label={t("Music")}
            icon={settings.musicOn ? Volume2 : VolumeX}
            active={settings.musicOn}
            volume={settings.musicVolume}
            onToggle={() => updateSettings({ musicOn: !settings.musicOn })}
            onVolumeChange={(volume) => updateSettings({ musicVolume: volume })}
          />
          <VolumeRow
            label={t("Sound Effects")}
            icon={settings.soundEffectsOn ? Volume2 : VolumeX}
            active={settings.soundEffectsOn}
            volume={settings.soundEffectsVolume}
            onToggle={() => updateSettings({ soundEffectsOn: !settings.soundEffectsOn })}
            onVolumeChange={(volume) => updateSettings({ soundEffectsVolume: volume })}
          />
        </Section>

        {/* Language */}
        <Section title={t("Language")}>
          <div className="flex gap-2">
            <button
              onClick={() => updateSettings({ language: "pt" })}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all duration-200 ${
                settings.language === "pt"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}
            >
              <Languages className="w-5 h-5" />
              <span className="text-xs font-medium">{t("Portuguese")}</span>
            </button>
            <button
              onClick={() => updateSettings({ language: "en" })}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all duration-200 ${
                settings.language === "en"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}
            >
              <Languages className="w-5 h-5" />
              <span className="text-xs font-medium">{t("English")}</span>
            </button>
          </div>
        </Section>

        {/* App Theme */}
        <Section title={t("App Theme")}>
          <div className="flex gap-2">
            {appThemes.map((t) => (
              <button
                key={t.value}
                onClick={() => updateSettings({ appTheme: t.value })}
                className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border transition-all duration-200 ${
                  settings.appTheme === t.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30"
                }`}
              >
                <t.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* Game Theme */}
        <Section title="🎨 Game Theme">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border">
            <Gamepad2 className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">{t("Auto (by phase)")}</p>
              <p className="text-xs text-muted-foreground">{t("Changes every 3 phases")}</p>
            </div>
          </div>
        </Section>

        {/* Vibration */}
        <Section title={t("Vibration")}>
          <ToggleRow
            label={t("Vibration")}
            icon={Smartphone}
            active={settings.vibrationOn}
            onToggle={() => updateSettings({ vibrationOn: !settings.vibrationOn })}
          />
        </Section>

        {/* Training Mode */}
        <Section title={t("Training Mode")}>
          <ToggleRow
            label={t("Training Mode")}
            icon={Gamepad2}
            active={settings.trainingMode}
            onToggle={() => updateSettings({ trainingMode: !settings.trainingMode })}
          />
          <p className="text-xs text-muted-foreground px-1">{t("No game over, walls wrap around. Perfect for practice.")}</p>
        </Section>

        {/* Difficulty */}
        <Section title={t("Difficulty")}>
          <div className="flex flex-col gap-2">
            {difficulties.map((d) => (
              <button
                key={d.value}
                onClick={() => updateSettings({ difficulty: d.value })}
                className={`flex flex-col items-start px-4 py-3 rounded-xl border transition-all duration-200 ${
                  settings.difficulty === d.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <span className={`text-sm font-semibold ${
                  settings.difficulty === d.value ? "text-primary" : "text-foreground"
                }`}>
                  {d.label}
                </span>
                <span className="text-xs text-muted-foreground">{d.desc}</span>
              </button>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-game text-xs tracking-wider text-muted-foreground uppercase">{title}</h2>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  icon: Icon,
  active,
  onToggle,
}: {
  label: string;
  icon: typeof Volume2;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div
        className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${
          active ? "bg-primary" : "bg-muted"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-primary-foreground shadow transition-transform duration-200 ${
            active ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}

function VolumeRow({
  label,
  icon: Icon,
  active,
  volume,
  onToggle,
  onVolumeChange,
}: {
  label: string;
  icon: typeof Volume2;
  active: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (volume: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2 px-4 py-3 rounded-xl bg-card border border-border">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <div
          className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${
            active ? "bg-primary" : "bg-muted"
          }`}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-primary-foreground shadow transition-transform duration-200 ${
              active ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </div>
      </button>

      {active && (
        <div className="flex items-center gap-3">
          <VolumeX className="w-4 h-4 text-muted-foreground" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
          />
          <Volume2 className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground w-8 text-center">
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}

export default SettingsScreen;
