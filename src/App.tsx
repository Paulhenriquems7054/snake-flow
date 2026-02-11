import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SettingsProvider } from "@/contexts/SettingsContext";
import SplashScreen from "./pages/SplashScreen";
import MenuScreen from "./pages/MenuScreen";
import SettingsScreen from "./pages/SettingsScreen";
import RecordScreen from "./pages/RecordScreen";
import CreditsScreen from "./pages/CreditsScreen";
import GameScreen from "./pages/GameScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SettingsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/menu" element={<MenuScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/record" element={<RecordScreen />} />
            <Route path="/credits" element={<CreditsScreen />} />
            <Route path="/game" element={<GameScreen />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
