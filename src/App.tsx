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
import RecuperarSenha from "./pages/RecuperarSenha";
import Experiencias from "./pages/Experiencias";
import ExperienciaDetalhe from "./pages/ExperienciaDetalhe";
import Excursoes from "./pages/Excursoes";
import Pacotes from "./pages/Pacotes";
import ViagemPersonalizada from "./pages/ViagemPersonalizada";
import Sobre from "./pages/Sobre";
import FAQ from "./pages/FAQ";
import Termos from "./pages/Termos";
import Privacidade from "./pages/Privacidade";
import Contato from "./pages/Contato";
import SejaParceiro from "./pages/SejaParceiro";
import NotFound from "./pages/NotFound";

// Admin imports
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCMS from "./pages/admin/AdminCMS";
import AdminCMSEditor from "./pages/admin/AdminCMSEditor";
import AdminDemandas from "./pages/admin/AdminDemandas";
import AdminExperiencias from "./pages/admin/AdminExperiencias";
import AdminClientes from "./pages/admin/AdminClientes";
import AdminParceiros from "./pages/admin/AdminParceiros";
import AdminEquipe from "./pages/admin/AdminEquipe";
import AdminConfiguracoes from "./pages/admin/AdminConfiguracoes";

// Partner imports
import PartnerLayout from "./pages/partner/PartnerLayout";
import PartnerDashboard from "./pages/partner/PartnerDashboard";
import PartnerDemandas from "./pages/partner/PartnerDemandas";
import PartnerProposta from "./pages/partner/PartnerProposta";
import PartnerExperiencias from "./pages/partner/PartnerExperiencias";

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
              <Route path="/experiencias/:id" element={<ExperienciaDetalhe />} />
              <Route path="/excursoes" element={<Excursoes />} />
              <Route path="/pacotes" element={<Pacotes />} />
              <Route path="/viagem-personalizada" element={<ViagemPersonalizada />} />
              <Route path="/sobre" element={<Sobre />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/termos" element={<Termos />} />
              <Route path="/privacidade" element={<Privacidade />} />
              <Route path="/contato" element={<Contato />} />
              <Route path="/seja-parceiro" element={<SejaParceiro />} />
            </Route>
            
            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="demandas" element={<AdminDemandas />} />
              <Route path="experiencias" element={<AdminExperiencias />} />
              <Route path="clientes" element={<AdminClientes />} />
              <Route path="parceiros" element={<AdminParceiros />} />
              <Route path="equipe" element={<AdminEquipe />} />
              <Route path="configuracoes" element={<AdminConfiguracoes />} />
              <Route path="cms" element={<AdminCMS />} />
              <Route path="cms/:slug" element={<AdminCMSEditor />} />
            </Route>
            
            {/* Partner routes */}
            <Route path="/partner" element={<PartnerLayout />}>
              <Route index element={<PartnerDashboard />} />
              <Route path="demandas" element={<PartnerDemandas />} />
              <Route path="proposta/:id" element={<PartnerProposta />} />
              <Route path="experiencias" element={<PartnerExperiencias />} />
            </Route>
            
            {/* Auth routes without public layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
