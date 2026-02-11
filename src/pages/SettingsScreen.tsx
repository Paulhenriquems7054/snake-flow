import { useNavigate } from "react-router-dom";
import { ArrowLeft, Volume2, VolumeX, Sun, Moon, Monitor, Smartphone, Gamepad2 } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import type { AppTheme, Difficulty } from "@/types/game";

const SettingsScreen = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();

  const appThemes: { value: AppTheme; label: string; icon: typeof Sun }[] = [
    { value: "system", label: "System", icon: Monitor },
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ];

  const difficulties: { value: Difficulty; label: string; desc: string }[] = [
    { value: "easy", label: "Easy", desc: "Slow speed, gentle progression" },
    { value: "medium", label: "Medium", desc: "Balanced speed and progression" },
    { value: "hard", label: "Hard", desc: "Fast speed, aggressive progression" },
  ];

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <button onClick={() => navigate("/menu")} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-game text-lg tracking-wider text-foreground">Settings</h1>
      </div>

      <div className="flex flex-col gap-6 p-5 max-w-md mx-auto w-full animate-fade-in">
        {/* Audio */}
        <Section title="🔊 Audio">
          <ToggleRow
            label="Music"
            icon={settings.musicOn ? Volume2 : VolumeX}
            active={settings.musicOn}
            onToggle={() => updateSettings({ musicOn: !settings.musicOn })}
          />
          <ToggleRow
            label="Sound Effects"
            icon={settings.soundEffectsOn ? Volume2 : VolumeX}
            active={settings.soundEffectsOn}
            onToggle={() => updateSettings({ soundEffectsOn: !settings.soundEffectsOn })}
          />
        </Section>

        {/* App Theme */}
        <Section title="🌗 App Theme">
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
              <p className="text-sm font-medium text-foreground">Auto (by phase)</p>
              <p className="text-xs text-muted-foreground">Changes every 3 phases</p>
            </div>
          </div>
        </Section>

        {/* Vibration */}
        <Section title="📳 Vibration">
          <ToggleRow
            label="Vibration"
            icon={Smartphone}
            active={settings.vibrationOn}
            onToggle={() => updateSettings({ vibrationOn: !settings.vibrationOn })}
          />
        </Section>

        {/* Training Mode */}
        <Section title="🎓 Training Mode">
          <ToggleRow
            label="Training Mode"
            icon={Gamepad2}
            active={settings.trainingMode}
            onToggle={() => updateSettings({ trainingMode: !settings.trainingMode })}
          />
          <p className="text-xs text-muted-foreground px-1">No game over, walls wrap around. Perfect for practice.</p>
        </Section>

        {/* Difficulty */}
        <Section title="🎚 Difficulty">
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

export default SettingsScreen;
