import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

const CreditsScreen = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <button onClick={() => navigate("/menu")} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-game text-lg tracking-wider text-foreground">{t("Credits")}</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 p-6 animate-fade-in">
        <span className="text-5xl animate-snake-move">🐍</span>
        <div className="text-center space-y-3">
          <h2 className="font-game text-2xl neon-text tracking-wider">SNAKE FLOW</h2>
          <div className="space-y-1 text-muted-foreground text-sm">
            <p>{t("Developed by")} PHM</p>
            <p className="font-semibold text-foreground">Version 1.0.0</p>
            <p>2026</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditsScreen;
