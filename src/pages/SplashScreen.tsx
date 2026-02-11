import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const SplashScreen = () => {
  const [visible, setVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => navigate("/menu"), 400);
    }, 1800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center game-bg transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="animate-scale-in flex flex-col items-center gap-4">
        <div className="text-6xl animate-snake-move">🐍</div>
        <h1 className="font-game text-4xl font-bold neon-text tracking-widest">
          SNAKE FLOW
        </h1>
        <div className="w-32 h-1 rounded-full bg-primary/50 overflow-hidden mt-4">
          <div className="h-full bg-primary animate-pulse rounded-full" style={{ width: "100%" }} />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
