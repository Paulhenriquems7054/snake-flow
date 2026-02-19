import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

function getInitialLanguage(): "en" | "pt" {
  try {
    if (typeof window === "undefined") return "pt";
    const raw = window.localStorage?.getItem("snake-flow-settings");
    if (!raw) return "pt";
    const parsed = JSON.parse(raw);
    return parsed?.language === "pt" || parsed?.language === "en" ? parsed.language : "pt";
  } catch {
    return "pt";
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          "Score": "Score",
          "Phase": "Phase",
          "PAUSED": "PAUSED",
          "RESUME": "RESUME",
          "SAVED": "SAVED",
          "GAME OVER": "GAME OVER",
          "PLAY AGAIN": "PLAY AGAIN",
          "MENU": "MENU",
          "Settings": "Settings",
          "Record": "Record",
          "Credits": "Credits",
          "System": "System",
          "Light": "Light",
          "Dark": "Dark",
          "Easy": "Easy",
          "Medium": "Medium",
          "Hard": "Hard",
          "Slow speed, gentle progression": "Slow speed, gentle progression",
          "Balanced speed and progression": "Balanced speed and progression",
          "Fast speed, aggressive progression": "Fast speed, aggressive progression",
          "Auto (by phase)": "Auto (by phase)",
          "Changes every 3 phases": "Changes every 3 phases",
          "Audio": "Audio",
          "Language": "Language",
          "Portuguese": "Portuguese",
          "English": "English",
          "Music": "Music",
          "Sound Effects": "Sound Effects",
          "Game size (zoom)": "Game size (zoom)",
          "Game Theme": "Game Theme",
          "Invalid audio file. Max 10MB. Supported: mp3, ogg, wav, m4a, aac.": "Invalid audio file. Max 10MB. Supported: mp3, ogg, wav, m4a, aac.",
          "Increase zoom": "Increase zoom",
          "Decrease zoom": "Decrease zoom",
          "Version": "Version",
          "Oops! Page not found": "Oops! Page not found",
          "Return to Home": "Return to Home",
          "Increase to make the snake/fruit/grid bigger. Applies next match.": "Increase to make the snake/fruit/grid bigger. Applies next match.",
          "Vibration": "Vibration",
          "App Theme": "App Theme",
          "Difficulty": "Difficulty",
          "Training Mode": "Training Mode",
          "No game over, walls wrap around. Perfect for practice.": "No game over, walls wrap around. Perfect for practice.",
          "On": "On",
          "Off": "Off",
          "Back": "Back",
          "Continue": "Continue",
          "New Game": "New Game",
          "Exit": "Exit",
          "Best Score": "Best Score",
          "Max Phase": "Max Phase",
          "Achieved Difficulty": "Achieved Difficulty",
          "Developed by": "Developed by",
          "Sound effects by": "Sound effects by",
          "Music by": "Music by",
          "Thanks for playing!": "Thanks for playing!",
          "Custom Audio (session)": "Custom Audio (session)",
          "Background Music": "Background Music",
          "Eat Effect": "Eat Effect",
          "Phase Change Effect": "Phase Change Effect",
          "Game Over Effect": "Game Over Effect",
          "Custom file": "Custom file",
          "Default": "Default",
          "Upload": "Upload",
          "Clear": "Clear",
          "Restore defaults": "Restore defaults"
        }
      },
      pt: {
        translation: {
          "Score": "Pontuação",
          "Phase": "Fase",
          "PAUSED": "PAUSADO",
          "RESUME": "RETOMAR",
          "SAVED": "SALVO",
          "GAME OVER": "FIM DE JOGO",
          "PLAY AGAIN": "JOGAR NOVAMENTE",
          "MENU": "MENU",
          "Settings": "Configurações",
          "Record": "Recorde",
          "Credits": "Créditos",
          "System": "Sistema",
          "Light": "Claro",
          "Dark": "Escuro",
          "Easy": "Fácil",
          "Medium": "Médio",
          "Hard": "Difícil",
          "Slow speed, gentle progression": "Velocidade lenta, progressão suave",
          "Balanced speed and progression": "Velocidade e progressão equilibradas",
          "Fast speed, aggressive progression": "Velocidade rápida, progressão agressiva",
          "Auto (by phase)": "Auto (por fase)",
          "Changes every 3 phases": "Muda a cada 3 fases",
          "Audio": "Áudio",
          "Language": "Idioma",
          "Portuguese": "Português",
          "English": "Inglês",
          "Music": "Música",
          "Sound Effects": "Efeitos Sonoros",
          "Game size (zoom)": "Tamanho do jogo (zoom)",
          "Game Theme": "Tema do jogo",
          "Invalid audio file. Max 10MB. Supported: mp3, ogg, wav, m4a, aac.": "Arquivo de áudio inválido. Máx 10MB. Suporte: mp3, ogg, wav, m4a, aac.",
          "Increase zoom": "Aumentar zoom",
          "Decrease zoom": "Diminuir zoom",
          "Version": "Versão",
          "Oops! Page not found": "Ops! Página não encontrada",
          "Return to Home": "Voltar para o início",
          "Increase to make the snake/fruit/grid bigger. Applies next match.": "Aumente para deixar a cobra/fruta/grade maiores. Aplica na próxima partida.",
          "Vibration": "Vibração",
          "App Theme": "Tema do Aplicativo",
          "Difficulty": "Dificuldade",
          "Training Mode": "Modo de Treinamento",
          "No game over, walls wrap around. Perfect for practice.": "Sem fim de jogo; as paredes dão a volta. Perfeito para treinar.",
          "On": "Ligado",
          "Off": "Desligado",
          "Back": "Voltar",
          "Continue": "Continuar",
          "New Game": "Novo Jogo",
          "Exit": "Sair",
          "Best Score": "Melhor Pontuação",
          "Max Phase": "Fase Máxima",
          "Achieved Difficulty": "Dificuldade Alcançada",
          "Developed by": "Desenvolvido por",
          "Sound effects by": "Efeitos sonoros por",
          "Music by": "Música por",
          "Thanks for playing!": "Obrigado por jogar!",
          "Custom Audio (session)": "Áudio Personalizado (sessão)",
          "Background Music": "Música de Fundo",
          "Eat Effect": "Efeito de Comer",
          "Phase Change Effect": "Efeito de Mudança de Fase",
          "Game Over Effect": "Efeito de Fim de Jogo",
          "Custom file": "Arquivo personalizado",
          "Default": "Padrão",
          "Upload": "Enviar",
          "Clear": "Limpar",
          "Restore defaults": "Restaurar padrões"
        }
      }
    },
    lng: getInitialLanguage(), // Idioma inicial (sync) para evitar "flash" em inglês
    fallbackLng: "en",

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
