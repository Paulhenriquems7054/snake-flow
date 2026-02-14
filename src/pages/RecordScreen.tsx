import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Flag, Gauge } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "react-i18next";

const RecordScreen = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { record } = useSettings();

  const stats = [
    { label: t("Best Score"), value: record.highScore, icon: Trophy, color: "text-primary" },
    { label: t("Max Phase"), value: record.maxPhase, icon: Flag, color: "text-accent" },
    { label: t("Achieved Difficulty"), value: t(record.difficulty.charAt(0).toUpperCase() + record.difficulty.slice(1)), icon: Gauge, color: "text-neon-green" },
  ];

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <button onClick={() => navigate("/menu")} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-game text-lg tracking-wider text-foreground">{t("Record")}</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 animate-fade-in">
        <Trophy className="w-16 h-16 text-primary animate-pulse-neon" />

        <div className="flex flex-col gap-4 w-full max-w-xs">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 px-5 py-4 rounded-xl bg-card border border-border"
            >
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="font-game text-xl text-foreground">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecordScreen;
