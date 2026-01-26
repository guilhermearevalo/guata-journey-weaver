import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { PublicLayout } from "@/components/layout/PublicLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Experiencias from "./pages/Experiencias";
import Excursoes from "./pages/Excursoes";
import Pacotes from "./pages/Pacotes";
import ViagemPersonalizada from "./pages/ViagemPersonalizada";
import Sobre from "./pages/Sobre";
import FAQ from "./pages/FAQ";
import Termos from "./pages/Termos";
import Privacidade from "./pages/Privacidade";
import Contato from "./pages/Contato";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes with layout */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/experiencias" element={<Experiencias />} />
              <Route path="/excursoes" element={<Excursoes />} />
              <Route path="/pacotes" element={<Pacotes />} />
              <Route path="/viagem-personalizada" element={<ViagemPersonalizada />} />
              <Route path="/sobre" element={<Sobre />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/termos" element={<Termos />} />
              <Route path="/privacidade" element={<Privacidade />} />
              <Route path="/contato" element={<Contato />} />
            </Route>
            
            {/* Auth routes without public layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
