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
import RoteiroPublico from "./pages/RoteiroPublico";
import PropostaPublica from "./pages/PropostaPublica";

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
import AdminRelatorioAgencias from "./pages/admin/AdminRelatorioAgencias";
import AdminFinanceiro from "./pages/admin/AdminFinanceiro";
import AdminProposta from "./pages/admin/AdminProposta";
import AdminRoteiro from "./pages/admin/AdminRoteiro";
import AdminAjuda from "./pages/admin/AdminAjuda";

// Partner imports
import PartnerLayout from "./pages/partner/PartnerLayout";
import PartnerDashboard from "./pages/partner/PartnerDashboard";
import PartnerDemandas from "./pages/partner/PartnerDemandas";
import PartnerProposta from "./pages/partner/PartnerProposta";
import PartnerExperiencias from "./pages/partner/PartnerExperiencias";
import PartnerRoteiro from "./pages/partner/PartnerRoteiro";
import PartnerAjuda from "./pages/partner/PartnerAjuda";
import PartnerFinanceiro from "./pages/partner/PartnerFinanceiro";

// Cliente imports
import { ProtectedClienteRoute } from "./components/cliente/ProtectedClienteRoute";
import ClienteLayout from "./pages/cliente/ClienteLayout";
import ClienteDashboard from "./pages/cliente/ClienteDashboard";
import ClienteViagens from "./pages/cliente/ClienteViagens";
import ClienteViagem from "./pages/cliente/ClienteViagem";
import ClienteMensagens from "./pages/cliente/ClienteMensagens";
import ClientePerfil from "./pages/cliente/ClientePerfil";
import ClienteRoteiro from "./pages/cliente/ClienteRoteiro";

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
              <Route path="demandas/:id/roteiro" element={<AdminRoteiro />} />
              <Route path="relatorio-agencias" element={<AdminRelatorioAgencias />} />
              <Route path="financeiro" element={<AdminFinanceiro />} />
              <Route path="proposta/:id" element={<AdminProposta />} />
              <Route path="ajuda" element={<AdminAjuda />} />
            </Route>
            
            {/* Partner routes */}
            <Route path="/partner" element={<PartnerLayout />}>
              <Route index element={<PartnerDashboard />} />
              <Route path="demandas" element={<PartnerDemandas />} />
              <Route path="proposta/:id" element={<PartnerProposta />} />
              <Route path="proposta/:id/roteiro" element={<PartnerRoteiro />} />
              <Route path="experiencias" element={<PartnerExperiencias />} />
              <Route path="financeiro" element={<PartnerFinanceiro />} />
              <Route path="ajuda" element={<PartnerAjuda />} />
            </Route>
            
            {/* Cliente routes */}
            <Route element={<ProtectedClienteRoute><ClienteLayout /></ProtectedClienteRoute>}>
              <Route path="/minha-conta" element={<ClienteDashboard />} />
              <Route path="/minha-conta/viagens" element={<ClienteViagens />} />
              <Route path="/minha-conta/viagem/:id" element={<ClienteViagem />} />
              <Route path="/minha-conta/viagem/:id/roteiro" element={<ClienteRoteiro />} />
              <Route path="/minha-conta/mensagens" element={<ClienteMensagens />} />
              <Route path="/minha-conta/perfil" element={<ClientePerfil />} />
            </Route>
            
            {/* Public share links */}
            <Route path="/roteiro/:token" element={<RoteiroPublico />} />
            <Route path="/proposta/:token" element={<PropostaPublica />} />
            
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
