-- ========== 20260126052543_87929e16-45d9-4aac-84bd-230e61bbbf29.sql ==========
-- 1. Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('client', 'consultant', 'manager', 'admin', 'partner');

-- 2. Create enum for travel request status
CREATE TYPE public.request_status AS ENUM ('pending', 'in_analysis', 'proposal_sent', 'approved', 'in_operation', 'completed', 'cancelled');

-- 3. Create enum for experience type
CREATE TYPE public.experience_type AS ENUM ('package', 'excursion', 'custom', 'thematic');

-- 4. Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create user_roles table (SECURITY: roles stored separately)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'client',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 6. Create partner_agencies table
CREATE TABLE public.partner_agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cnpj TEXT,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    address TEXT,
    logo_url TEXT,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Create partner_users linking table
CREATE TABLE public.partner_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    agency_id UUID REFERENCES public.partner_agencies(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, agency_id)
);

-- 8. Create experiences table
CREATE TABLE public.experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    short_description TEXT,
    destination TEXT NOT NULL,
    experience_type experience_type NOT NULL DEFAULT 'package',
    price DECIMAL(10,2),
    duration_days INTEGER,
    max_participants INTEGER,
    inclusions TEXT[],
    exclusions TEXT[],
    itinerary JSONB DEFAULT '[]',
    images TEXT[] DEFAULT '{}',
    cover_image TEXT,
    target_audience TEXT,
    departure_dates JSONB DEFAULT '[]',
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    operator_agency_id UUID REFERENCES public.partner_agencies(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Create travel_requests table (demandas)
CREATE TABLE public.travel_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    destination TEXT,
    travel_dates JSONB,
    travelers_count INTEGER DEFAULT 1,
    budget_range TEXT,
    preferences JSONB DEFAULT '{}',
    special_requests TEXT,
    status request_status NOT NULL DEFAULT 'pending',
    assigned_consultant_id UUID REFERENCES auth.users(id),
    assigned_agency_id UUID REFERENCES public.partner_agencies(id),
    internal_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. Create proposals table
CREATE TABLE public.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.travel_requests(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    agency_id UUID REFERENCES public.partner_agencies(id),
    title TEXT NOT NULL,
    description TEXT,
    total_price DECIMAL(10,2),
    itinerary JSONB DEFAULT '[]',
    inclusions TEXT[],
    documents TEXT[] DEFAULT '{}',
    is_approved BOOLEAN DEFAULT false,
    client_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 11. Create messages table (comunicaÃ§Ã£o interna)
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.travel_requests(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    channel TEXT DEFAULT 'platform',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 12. Create bookings table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    experience_id UUID REFERENCES public.experiences(id) ON DELETE SET NULL,
    request_id UUID REFERENCES public.travel_requests(id) ON DELETE SET NULL,
    proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    travelers_count INTEGER DEFAULT 1,
    travel_date DATE,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'pending',
    vouchers TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 13. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 14. Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- 15. Create function to check if user is staff (consultant, manager, or admin)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role IN ('consultant', 'manager', 'admin')
    )
$$;

-- 16. Create function to get user's partner agency
CREATE OR REPLACE FUNCTION public.get_user_agency(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT agency_id
    FROM public.partner_users
    WHERE user_id = _user_id
    LIMIT 1
$$;

-- 17. Profiles policies
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

-- 18. User roles policies (only admins can manage)
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 19. Experiences policies
CREATE POLICY "Anyone can view published experiences"
ON public.experiences FOR SELECT
TO anon, authenticated
USING (is_published = true);

CREATE POLICY "Staff can view all experiences"
ON public.experiences FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage experiences"
ON public.experiences FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()));

-- 20. Travel requests policies
CREATE POLICY "Clients can view own requests"
ON public.travel_requests FOR SELECT
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Clients can create requests"
ON public.travel_requests FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid());

CREATE POLICY "Staff can view all requests"
ON public.travel_requests FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage requests"
ON public.travel_requests FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Partners can view assigned requests"
ON public.travel_requests FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'partner') 
    AND assigned_agency_id = public.get_user_agency(auth.uid())
);

-- 21. Allow anonymous travel request creation
CREATE POLICY "Anyone can create travel request"
ON public.travel_requests FOR INSERT
TO anon
WITH CHECK (true);

-- 22. Proposals policies
CREATE POLICY "Clients can view proposals for their requests"
ON public.proposals FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.travel_requests tr
        WHERE tr.id = request_id AND tr.client_id = auth.uid()
    )
);

CREATE POLICY "Staff can manage all proposals"
ON public.proposals FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Partners can manage their proposals"
ON public.proposals FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'partner') 
    AND agency_id = public.get_user_agency(auth.uid())
);

-- 23. Messages policies
CREATE POLICY "Users can view their messages"
ON public.messages FOR SELECT
TO authenticated
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Staff can view request messages"
ON public.messages FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

-- 24. Bookings policies
CREATE POLICY "Clients can view own bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Staff can manage all bookings"
ON public.bookings FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()));

-- 25. Partner agencies policies
CREATE POLICY "Staff can view all agencies"
ON public.partner_agencies FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can manage agencies"
ON public.partner_agencies FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can view own agency"
ON public.partner_agencies FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'partner') 
    AND id = public.get_user_agency(auth.uid())
);

-- 26. Partner users policies
CREATE POLICY "Admins can manage partner users"
ON public.partner_users FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 27. Create trigger for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email
    );
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'client');
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 28. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 29. Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_agencies_updated_at
BEFORE UPDATE ON public.partner_agencies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_experiences_updated_at
BEFORE UPDATE ON public.experiences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_travel_requests_updated_at
BEFORE UPDATE ON public.travel_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at
BEFORE UPDATE ON public.proposals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ========== 20260126052559_727bd423-6315-4fde-92c2-d8c255f60057.sql ==========
-- Fix 1: Set search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Fix 2: Replace the permissive anonymous insert policy with a more specific one
DROP POLICY IF EXISTS "Anyone can create travel request" ON public.travel_requests;

CREATE POLICY "Anonymous can create travel request with required fields"
ON public.travel_requests FOR INSERT
TO anon
WITH CHECK (
    client_name IS NOT NULL 
    AND client_email IS NOT NULL 
    AND client_id IS NULL
);


-- ========== 20260127024401_e6662da0-0ef0-421f-a866-c12074957eba.sql ==========
-- Enum para status de pÃ¡gina
CREATE TYPE public.page_status AS ENUM ('draft', 'published', 'hidden');

-- Tabela de pÃ¡ginas CMS
CREATE TABLE public.cms_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    meta_description TEXT,
    status public.page_status DEFAULT 'draft',
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ãndice para busca por slug
CREATE INDEX idx_cms_pages_slug ON public.cms_pages(slug);
CREATE INDEX idx_cms_pages_status ON public.cms_pages(status);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_cms_pages_updated_at
    BEFORE UPDATE ON public.cms_pages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

-- PolÃ­ticas RLS: PÃºblico lÃª pÃ¡ginas publicadas
CREATE POLICY "Anyone can view published pages"
ON public.cms_pages FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- Staff pode gerenciar todas as pÃ¡ginas
CREATE POLICY "Staff can manage all pages"
ON public.cms_pages FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()));

-- Inserir conteÃºdo inicial das pÃ¡ginas
INSERT INTO public.cms_pages (slug, title, content, meta_description, status) VALUES
('sobre', 'Sobre a GuatÃ¡', '{
  "hero": {
    "title": "Sobre a GuatÃ¡",
    "subtitle": "ConheÃ§a nossa histÃ³ria e missÃ£o"
  },
  "sections": [
    {
      "title": "Nossa HistÃ³ria",
      "content": "A GuatÃ¡ nasceu da paixÃ£o por viagens autÃªnticas e experiÃªncias transformadoras. Nosso nome vem do tupi-guarani e significa \"andar\", \"caminhar\" â€“ representando nossa essÃªncia de guiar viajantes por jornadas Ãºnicas pelo Brasil e pelo mundo."
    },
    {
      "title": "Nossa MissÃ£o",
      "content": "Conectamos viajantes a experiÃªncias cuidadosamente selecionadas, priorizando autenticidade, sustentabilidade e imersÃ£o cultural. Cada roteiro Ã© pensado para criar memÃ³rias inesquecÃ­veis."
    },
    {
      "title": "Nossos Valores",
      "content": "â€¢ Curadoria cuidadosa: Selecionamos apenas experiÃªncias que realmente fazem a diferenÃ§a\nâ€¢ Atendimento personalizado: Cada viajante Ã© Ãºnico e merece atenÃ§Ã£o especial\nâ€¢ Sustentabilidade: Promovemos turismo responsÃ¡vel e consciente\nâ€¢ Parcerias locais: Valorizamos operadores e guias locais"
    }
  ]
}', 'ConheÃ§a a GuatÃ¡ Travel Experience - sua agÃªncia de viagens personalizadas', 'published'),

('faq', 'Perguntas Frequentes', '{
  "hero": {
    "title": "Perguntas Frequentes",
    "subtitle": "Tire suas dÃºvidas sobre nossos serviÃ§os"
  },
  "items": [
    {
      "question": "Como funciona o processo de viagem personalizada?",
      "answer": "VocÃª preenche nosso formulÃ¡rio com suas preferÃªncias e um consultor entra em contato para entender melhor suas expectativas. Criamos um roteiro exclusivo e, apÃ³s sua aprovaÃ§Ã£o, cuidamos de toda a operaÃ§Ã£o."
    },
    {
      "question": "Qual a diferenÃ§a entre pacotes e excursÃµes?",
      "answer": "Pacotes sÃ£o roteiros prÃ©-definidos com datas flexÃ­veis, ideais para quem quer praticidade. ExcursÃµes sÃ£o viagens em grupo com datas fixas e preÃ§os mais acessÃ­veis."
    },
    {
      "question": "VocÃªs trabalham com quais destinos?",
      "answer": "Trabalhamos com destinos nacionais e internacionais, sempre com foco em experiÃªncias autÃªnticas e imersÃ£o cultural."
    },
    {
      "question": "Como funciona o pagamento?",
      "answer": "Oferecemos diversas formas de pagamento, incluindo parcelamento no cartÃ£o e condiÃ§Ãµes especiais para pagamento Ã  vista. Os detalhes sÃ£o apresentados na proposta."
    },
    {
      "question": "Posso alterar meu roteiro depois de confirmado?",
      "answer": "Sim, dentro das polÃ­ticas de cada fornecedor. Nossos consultores trabalham para acomodar mudanÃ§as sempre que possÃ­vel."
    }
  ]
}', 'Perguntas frequentes sobre viagens, pacotes e serviÃ§os da GuatÃ¡', 'published'),

('termos', 'Termos de Uso', '{
  "hero": {
    "title": "Termos de Uso",
    "subtitle": "CondiÃ§Ãµes gerais de uso da plataforma"
  },
  "sections": [
    {
      "title": "1. AceitaÃ§Ã£o dos Termos",
      "content": "Ao acessar e utilizar os serviÃ§os da GuatÃ¡ Travel Experience, vocÃª concorda com estes termos de uso. Se nÃ£o concordar com qualquer parte destes termos, nÃ£o utilize nossos serviÃ§os."
    },
    {
      "title": "2. ServiÃ§os Oferecidos",
      "content": "A GuatÃ¡ atua como intermediÃ¡ria entre viajantes e operadores de turismo, oferecendo curadoria de experiÃªncias, pacotes de viagem e excursÃµes. Os serviÃ§os finais sÃ£o prestados por parceiros homologados."
    },
    {
      "title": "3. Responsabilidades",
      "content": "O viajante Ã© responsÃ¡vel por fornecer informaÃ§Ãµes corretas, possuir documentaÃ§Ã£o vÃ¡lida e seguir as orientaÃ§Ãµes de cada destino. A GuatÃ¡ nÃ£o se responsabiliza por eventos de forÃ§a maior ou decisÃµes de terceiros."
    },
    {
      "title": "4. PolÃ­tica de Cancelamento",
      "content": "Cancelamentos estÃ£o sujeitos Ã s polÃ­ticas especÃ­ficas de cada pacote ou experiÃªncia, que serÃ£o informadas antes da confirmaÃ§Ã£o. Taxas administrativas podem ser aplicadas."
    },
    {
      "title": "5. AlteraÃ§Ãµes nos Termos",
      "content": "Reservamos o direito de modificar estes termos a qualquer momento. AlteraÃ§Ãµes significativas serÃ£o comunicadas por e-mail ou no site."
    }
  ]
}', 'Termos de uso da plataforma GuatÃ¡ Travel Experience', 'published'),

('privacidade', 'PolÃ­tica de Privacidade', '{
  "hero": {
    "title": "PolÃ­tica de Privacidade",
    "subtitle": "Como tratamos seus dados pessoais"
  },
  "sections": [
    {
      "title": "1. Dados Coletados",
      "content": "Coletamos dados fornecidos por vocÃª (nome, e-mail, telefone, preferÃªncias de viagem) e dados de navegaÃ§Ã£o (cookies, pÃ¡ginas visitadas). Essas informaÃ§Ãµes sÃ£o essenciais para personalizar sua experiÃªncia."
    },
    {
      "title": "2. Uso dos Dados",
      "content": "Seus dados sÃ£o utilizados para: processar solicitaÃ§Ãµes de viagem, enviar propostas personalizadas, comunicar atualizaÃ§Ãµes importantes e melhorar nossos serviÃ§os."
    },
    {
      "title": "3. Compartilhamento",
      "content": "Compartilhamos dados apenas com parceiros operadores quando necessÃ¡rio para a execuÃ§Ã£o da viagem. Nunca vendemos suas informaÃ§Ãµes para terceiros."
    },
    {
      "title": "4. SeguranÃ§a",
      "content": "Utilizamos criptografia e prÃ¡ticas de seguranÃ§a modernas para proteger seus dados. O acesso Ã s informaÃ§Ãµes Ã© restrito a colaboradores autorizados."
    },
    {
      "title": "5. Seus Direitos",
      "content": "VocÃª pode solicitar acesso, correÃ§Ã£o ou exclusÃ£o de seus dados a qualquer momento. Entre em contato conosco para exercer seus direitos conforme a LGPD."
    }
  ]
}', 'PolÃ­tica de privacidade e proteÃ§Ã£o de dados da GuatÃ¡', 'published'),

('contato', 'Contato', '{
  "hero": {
    "title": "Entre em Contato",
    "subtitle": "Estamos aqui para ajudar vocÃª a planejar sua prÃ³xima aventura"
  },
  "info": {
    "email": "contato@guata.com.br",
    "phone": "(11) 99999-9999",
    "whatsapp": "5511999999999",
    "address": "SÃ£o Paulo, SP - Brasil",
    "hours": "Segunda a Sexta, 9h Ã s 18h"
  }
}', 'Entre em contato com a GuatÃ¡ Travel Experience', 'published');


-- ========== 20260128145256_db688151-e486-4026-a40e-e0840f8c3f9c.sql ==========
-- Create a function to update demo account roles
-- This will be called to set proper roles for test accounts
CREATE OR REPLACE FUNCTION public.update_demo_roles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update admin@guata.test to admin role
    UPDATE public.user_roles 
    SET role = 'admin' 
    WHERE user_id = (
        SELECT id FROM auth.users WHERE email = 'admin@guata.test' LIMIT 1
    );

    -- Update consultor@guata.test to consultant role
    UPDATE public.user_roles 
    SET role = 'consultant' 
    WHERE user_id = (
        SELECT id FROM auth.users WHERE email = 'consultor@guata.test' LIMIT 1
    );

    -- Update parceiro@guata.test to partner role
    UPDATE public.user_roles 
    SET role = 'partner' 
    WHERE user_id = (
        SELECT id FROM auth.users WHERE email = 'parceiro@guata.test' LIMIT 1
    );

    -- cliente@guata.test keeps the default 'client' role
END;
$$;

-- Grant execute permission to authenticated users (so the function can be called)
GRANT EXECUTE ON FUNCTION public.update_demo_roles() TO authenticated;


-- ========== 20260202004433_33169db2-8808-458c-bf98-29cc6938ad09.sql ==========
-- 1. Criar trigger que estÃ¡ faltando
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Melhorar funÃ§Ã£o update_demo_roles com UPSERT
CREATE OR REPLACE FUNCTION public.update_demo_roles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Garantir profiles
    INSERT INTO public.profiles (user_id, full_name, email)
    SELECT id, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), email
    FROM auth.users WHERE email LIKE '%@guata.test'
    ON CONFLICT (user_id) DO NOTHING;

    -- Garantir roles com valores default
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'client' FROM auth.users WHERE email LIKE '%@guata.test'
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Atualizar para roles corretos
    UPDATE public.user_roles SET role = 'admin' 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@guata.test');
    
    UPDATE public.user_roles SET role = 'consultant' 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'consultor@guata.test');
    
    UPDATE public.user_roles SET role = 'partner' 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'parceiro@guata.test');
END;
$$;


-- ========== 20260203120321_ac3c6dab-8684-4a49-89d2-66bfb3486577.sql ==========
-- Atualizar funÃ§Ã£o update_demo_roles para incluir cliente e vincular parceiro Ã  agÃªncia
CREATE OR REPLACE FUNCTION public.update_demo_roles()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_partner_id UUID;
    v_agency_id UUID;
BEGIN
    -- Garantir profiles para todos os usuÃ¡rios demo
    INSERT INTO public.profiles (user_id, full_name, email)
    SELECT id, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), email
    FROM auth.users WHERE email LIKE '%@guata.test'
    ON CONFLICT (user_id) DO NOTHING;

    -- Garantir roles com valores default
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'client' FROM auth.users WHERE email LIKE '%@guata.test'
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Atualizar para roles corretos
    UPDATE public.user_roles SET role = 'admin' 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@guata.test');
    
    UPDATE public.user_roles SET role = 'consultant' 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'consultor@guata.test');
    
    UPDATE public.user_roles SET role = 'partner' 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'parceiro@guata.test');
    
    -- Cliente demo mantÃ©m role 'client' (default)
    
    -- Vincular parceiro Ã  primeira agÃªncia disponÃ­vel (se nÃ£o estiver vinculado)
    SELECT id INTO v_partner_id FROM auth.users WHERE email = 'parceiro@guata.test';
    SELECT id INTO v_agency_id FROM partner_agencies LIMIT 1;
    
    IF v_partner_id IS NOT NULL AND v_agency_id IS NOT NULL THEN
        INSERT INTO public.partner_users (user_id, agency_id)
        VALUES (v_partner_id, v_agency_id)
        ON CONFLICT DO NOTHING;
    END IF;
END;
$function$;

-- Adicionar constraint unique em partner_users para evitar duplicatas
ALTER TABLE public.partner_users ADD CONSTRAINT partner_users_user_id_key UNIQUE (user_id);


-- ========== 20260301171945_81730550-3a66-468c-92ed-36e8458fb5f2.sql ==========

-- 1. Create site_settings table
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage site settings"
  ON public.site_settings FOR ALL
  USING (is_staff(auth.uid()));

-- 2. Bucket site-assets — crie via Dashboard/API (docs/MIGRAR_STORAGE.md)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true);

-- Storage RLS policies
CREATE POLICY "Anyone can view site assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-assets');

CREATE POLICY "Staff can upload site assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site-assets' AND is_staff(auth.uid()));

CREATE POLICY "Staff can update site assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'site-assets' AND is_staff(auth.uid()));

CREATE POLICY "Staff can delete site assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site-assets' AND is_staff(auth.uid()));

-- 3. Add payment_links column to proposals
ALTER TABLE public.proposals ADD COLUMN payment_links JSONB DEFAULT '{}'::jsonb;

-- 4. Insert default hero image setting
INSERT INTO public.site_settings (key, value) VALUES ('hero_image_url', '"https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop"');



-- ========== 20260303003404_88a61f45-faac-4557-bc08-3d43b20cc86e.sql ==========
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';


-- ========== 20260308153856_2a75f238-5aea-4a6f-b51e-8cafda715c88.sql ==========
ALTER TABLE public.proposals ADD COLUMN share_token TEXT UNIQUE;

-- Allow public access to proposals via share_token (no auth required)
CREATE POLICY "Anyone can view proposals by share_token"
ON public.proposals
FOR SELECT
TO anon, authenticated
USING (share_token IS NOT NULL AND share_token = current_setting('request.headers', true)::json->>'x-share-token');



-- ========== 20260308153911_fcda5aa3-21c9-495b-b2cf-af330e3347c9.sql ==========
DROP POLICY IF EXISTS "Anyone can view proposals by share_token" ON public.proposals;

CREATE POLICY "Anyone can view shared proposals"
ON public.proposals
FOR SELECT
TO anon, authenticated
USING (share_token IS NOT NULL);


-- ========== 20260308161323_dd8b3a90-c0ba-4187-b40c-30ce9ff422ce.sql ==========
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS documents_checklist jsonb DEFAULT '[]'::jsonb;


-- ========== 20260308174222_e191fda8-261b-49dd-b159-edde8a60f22d.sql ==========

-- RLS: Partners can update status of assigned requests
CREATE POLICY "Partners can update assigned request status"
ON public.travel_requests
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'partner'::app_role) 
  AND assigned_agency_id = get_user_agency(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'partner'::app_role) 
  AND assigned_agency_id = get_user_agency(auth.uid())
);

-- RLS: Partners can view own experiences
CREATE POLICY "Partners can view own experiences"
ON public.experiences FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'partner'::app_role) 
  AND operator_agency_id = get_user_agency(auth.uid())
);

-- RLS: Partners can insert own experiences (always unpublished)
CREATE POLICY "Partners can insert own experiences"
ON public.experiences FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'partner'::app_role) 
  AND operator_agency_id = get_user_agency(auth.uid())
  AND is_published = false
);

-- RLS: Partners can update own unpublished experiences
CREATE POLICY "Partners can update own unpublished experiences"
ON public.experiences FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'partner'::app_role) 
  AND operator_agency_id = get_user_agency(auth.uid())
  AND is_published = false
)
WITH CHECK (
  has_role(auth.uid(), 'partner'::app_role) 
  AND operator_agency_id = get_user_agency(auth.uid())
  AND is_published = false
);



-- ========== 20260308180641_d1e0dcbb-038d-4123-80a6-d73f5001c8d3.sql ==========

-- Campo para definir quem paga taxa Stripe
ALTER TABLE partner_agencies 
  ADD COLUMN stripe_fee_bearer text DEFAULT 'guata';

-- Tabela de registro de repasses/comissÃµes
CREATE TABLE commission_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE,
  agency_id uuid REFERENCES partner_agencies(id) ON DELETE CASCADE NOT NULL,
  gross_amount numeric NOT NULL,
  stripe_fee numeric DEFAULT 0,
  guata_commission numeric NOT NULL,
  partner_amount numeric NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  paid_at timestamptz,
  paid_by uuid,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE commission_payments ENABLE ROW LEVEL SECURITY;

-- Admin gerencia tudo
CREATE POLICY "Admins can manage commission payments"
  ON commission_payments FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Staff pode visualizar
CREATE POLICY "Staff can view commission payments"
  ON commission_payments FOR SELECT
  TO authenticated
  USING (is_staff(auth.uid()));

-- Parceiro vÃª apenas os seus
CREATE POLICY "Partners can view own commission payments"
  ON commission_payments FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'partner'::app_role) AND agency_id = get_user_agency(auth.uid()));



-- ========== 20260308182337_5565de3d-b264-4930-be70-e1cf18e3382f.sql ==========
ALTER TABLE proposals ADD COLUMN payment_enabled boolean DEFAULT false, ADD COLUMN access_code text;


-- ========== 20260308183629_24462528-b262-4971-bef8-b5fde16931b9.sql ==========

-- 1. RLS para cadastro de parceiro (anon + authenticated)
CREATE POLICY "Anyone can apply as partner"
ON public.partner_agencies FOR INSERT
TO anon, authenticated
WITH CHECK (is_active = false);

-- 2. Novas colunas para dados completos do formulÃ¡rio
ALTER TABLE public.partner_agencies
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS responsible_name text,
  ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS regions text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS description text;



-- ========== 20260310023953_838365e7-7a7d-4517-9e1e-74d7df7c3b83.sql ==========

CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_location text,
  client_photo_url text,
  rating integer DEFAULT 5,
  text text NOT NULL,
  trip_name text,
  status text DEFAULT 'pending',
  client_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved testimonials" ON public.testimonials
  FOR SELECT TO anon, authenticated USING (status = 'approved');

CREATE POLICY "Authenticated users can submit testimonials" ON public.testimonials
  FOR INSERT TO authenticated WITH CHECK (client_id = auth.uid());

CREATE POLICY "Staff can manage testimonials" ON public.testimonials
  FOR ALL TO authenticated USING (is_staff(auth.uid()));

-- Bucket testimonials — crie via Dashboard/API (docs/MIGRAR_STORAGE.md)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('testimonials', 'testimonials', true);

CREATE POLICY "Anyone can view testimonial photos" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'testimonials');

CREATE POLICY "Authenticated users can upload testimonial photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'testimonials');

CREATE POLICY "Staff can delete testimonial photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'testimonials' AND is_staff(auth.uid()));



-- ========== 20260311144648_b6885f19-f9d2-4441-a7ba-9443c208136c.sql ==========

CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'active');

CREATE POLICY "Staff can view all subscribers" ON newsletter_subscribers
  FOR SELECT TO authenticated USING (is_staff(auth.uid()));

CREATE POLICY "Staff can manage subscribers" ON newsletter_subscribers
  FOR ALL TO authenticated USING (is_staff(auth.uid()));



-- ========== 20260408131921_a66cbe6a-f16a-4c39-b115-287040eeadd6.sql ==========

-- 1. Itinerary Templates table
CREATE TABLE public.itinerary_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  destination TEXT,
  duration_days INTEGER,
  itinerary JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID,
  agency_id UUID REFERENCES public.partner_agencies(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.itinerary_templates ENABLE ROW LEVEL SECURITY;

-- Staff can manage all templates
CREATE POLICY "Staff can manage all templates"
  ON public.itinerary_templates FOR ALL
  TO authenticated
  USING (is_staff(auth.uid()));

-- Partners can manage own agency templates
CREATE POLICY "Partners can manage own templates"
  ON public.itinerary_templates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'partner') AND agency_id = get_user_agency(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'partner') AND agency_id = get_user_agency(auth.uid()));

-- 2. Add is_external flag to partner_agencies for agencies that don't use the platform
ALTER TABLE public.partner_agencies ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT false;

-- 3. Add external_notes to travel_requests for tracking comms with external agencies
ALTER TABLE public.travel_requests ADD COLUMN IF NOT EXISTS external_notes TEXT;



-- ========== 20260430025811_9551d2b6-7e76-4c7d-adbc-6fb847236adc.sql ==========
CREATE TABLE IF NOT EXISTS public.travel_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL,
  request_id UUID NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  document_type TEXT NOT NULL DEFAULT 'vault',
  status TEXT NOT NULL DEFAULT 'pending',
  file_url TEXT,
  file_path TEXT,
  notes TEXT,
  visible_in_public BOOLEAN NOT NULL DEFAULT true,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT travel_documents_category_check CHECK (category IN ('personal', 'voucher', 'ticket', 'insurance', 'reservation', 'payment', 'other')),
  CONSTRAINT travel_documents_type_check CHECK (document_type IN ('checklist', 'vault')),
  CONSTRAINT travel_documents_status_check CHECK (status IN ('pending', 'received', 'verified', 'sent')),
  CONSTRAINT travel_documents_title_length CHECK (char_length(title) BETWEEN 1 AND 160),
  CONSTRAINT travel_documents_notes_length CHECK (notes IS NULL OR char_length(notes) <= 1000)
);

ALTER TABLE public.travel_documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_travel_documents_proposal_id ON public.travel_documents(proposal_id);
CREATE INDEX IF NOT EXISTS idx_travel_documents_request_id ON public.travel_documents(request_id);
CREATE INDEX IF NOT EXISTS idx_travel_documents_public ON public.travel_documents(proposal_id, visible_in_public) WHERE visible_in_public = true;

CREATE TRIGGER update_travel_documents_updated_at
BEFORE UPDATE ON public.travel_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Staff can manage all travel documents"
ON public.travel_documents
FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Partners can manage documents for own proposals"
ON public.travel_documents
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'partner'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = travel_documents.proposal_id
      AND p.agency_id = public.get_user_agency(auth.uid())
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'partner'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = travel_documents.proposal_id
      AND p.agency_id = public.get_user_agency(auth.uid())
  )
);

CREATE POLICY "Clients can view documents for own requests"
ON public.travel_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.travel_requests tr
    WHERE tr.id = travel_documents.request_id
      AND tr.client_id = auth.uid()
  )
);

CREATE POLICY "Clients can upload personal documents for own requests"
ON public.travel_documents
FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND document_type = 'vault'
  AND category = 'personal'
  AND status = 'pending'
  AND visible_in_public = false
  AND EXISTS (
    SELECT 1 FROM public.travel_requests tr
    WHERE tr.id = travel_documents.request_id
      AND tr.client_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view public shared travel documents"
ON public.travel_documents
FOR SELECT
TO anon, authenticated
USING (
  visible_in_public = true
  AND file_url IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = travel_documents.proposal_id
      AND p.share_token IS NOT NULL
  )
);

-- Bucket travel-documents — crie via Dashboard/API (docs/MIGRAR_STORAGE.md)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('travel-documents', 'travel-documents', false)
-- ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Staff can manage travel document files"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'travel-documents' AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id = 'travel-documents' AND public.is_staff(auth.uid()));

CREATE POLICY "Partners can manage agency travel document files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'travel-documents'
  AND public.has_role(auth.uid(), 'partner'::app_role)
)
WITH CHECK (
  bucket_id = 'travel-documents'
  AND public.has_role(auth.uid(), 'partner'::app_role)
);

CREATE POLICY "Clients can upload own travel document files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'travel-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Clients can view own travel document files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'travel-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can view travel document files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'travel-documents');


-- ========== 20260430025831_7494e3ce-5839-4d6d-83d9-7f1775ca2320.sql ==========
DROP POLICY IF EXISTS "Authenticated users can view travel document files" ON storage.objects;

CREATE POLICY "Clients can view files for own travel documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'travel-documents'
  AND EXISTS (
    SELECT 1
    FROM public.travel_documents td
    JOIN public.travel_requests tr ON tr.id = td.request_id
    WHERE td.file_path = storage.objects.name
      AND tr.client_id = auth.uid()
  )
);

CREATE POLICY "Partners can view agency travel document files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'travel-documents'
  AND public.has_role(auth.uid(), 'partner'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.travel_documents td
    JOIN public.proposals p ON p.id = td.proposal_id
    WHERE td.file_path = storage.objects.name
      AND p.agency_id = public.get_user_agency(auth.uid())
  )
);

CREATE POLICY "Public can view shared travel document files"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'travel-documents'
  AND EXISTS (
    SELECT 1
    FROM public.travel_documents td
    JOIN public.proposals p ON p.id = td.proposal_id
    WHERE td.file_path = storage.objects.name
      AND td.visible_in_public = true
      AND p.share_token IS NOT NULL
  )
);


-- ========== 20260430120000_add_partner_agency_cover_image.sql ==========
ALTER TABLE public.partner_agencies
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

CREATE OR REPLACE VIEW public.partner_agency_branding AS
SELECT id, name, logo_url, cover_image_url
FROM public.partner_agencies
WHERE is_active = true;

GRANT SELECT ON public.partner_agency_branding TO anon, authenticated;



-- ========== 20260512160034_2201385a-9314-4e35-bb42-2b759b02d5d7.sql ==========
CREATE TABLE public.completed_trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  cover_image TEXT,
  gallery TEXT[] DEFAULT '{}'::text[],
  trip_month INTEGER,
  trip_year INTEGER,
  agency_id UUID REFERENCES public.partner_agencies(id) ON DELETE SET NULL,
  client_quote TEXT,
  client_name TEXT,
  client_photo TEXT,
  description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.completed_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published completed trips"
ON public.completed_trips FOR SELECT
USING (is_published = true);

CREATE POLICY "Staff can manage completed trips"
ON public.completed_trips FOR ALL
TO authenticated
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "Partners can manage own agency completed trips"
ON public.completed_trips FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'partner'::app_role) AND agency_id = get_user_agency(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'partner'::app_role) AND agency_id = get_user_agency(auth.uid()));

CREATE TRIGGER update_completed_trips_updated_at
BEFORE UPDATE ON public.completed_trips
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_completed_trips_published ON public.completed_trips(is_published, display_order DESC, created_at DESC);


-- ========== 20260515032204_0ef0a3d0-7a47-44f0-b15e-8784ec56d449.sql ==========
ALTER TABLE public.completed_trips ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS transport_type text;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS departure_city text;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS stops jsonb DEFAULT '[]'::jsonb;


-- ========== 20260517035203_b8a64e47-ae26-43c3-9706-3c77adf1a2bd.sql ==========
-- 1. proposals: switch para desativar link pÃºblico
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS share_enabled boolean NOT NULL DEFAULT true;

-- 2. commission_payments: campos extras para vendas externas
ALTER TABLE public.commission_payments
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'platform',
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS destination text,
  ADD COLUMN IF NOT EXISTS sale_date date,
  ADD COLUMN IF NOT EXISTS settlement_id uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- 3. monthly_settlements: fechamento mensal por agÃªncia
CREATE TABLE IF NOT EXISTS public.monthly_settlements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id uuid NOT NULL,
  period_year int NOT NULL,
  period_month int NOT NULL,
  total_commission numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  due_date date,
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agency_id, period_year, period_month)
);

ALTER TABLE public.monthly_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage settlements"
  ON public.monthly_settlements FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff view settlements"
  ON public.monthly_settlements FOR SELECT TO authenticated
  USING (is_staff(auth.uid()));

CREATE POLICY "Partners view own settlements"
  ON public.monthly_settlements FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'partner'::app_role) AND agency_id = get_user_agency(auth.uid()));

CREATE TRIGGER settlements_updated_at
  BEFORE UPDATE ON public.monthly_settlements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Vendas externas de parceiros: RPC server-side (migration 20260617011706)
-- Parceiros informam só o valor bruto; comissão e repasse são calculados no servidor.
CREATE OR REPLACE FUNCTION public.partner_insert_external_sale(
  _gross_amount numeric,
  _client_name text DEFAULT NULL,
  _destination text DEFAULT NULL,
  _sale_date date DEFAULT CURRENT_DATE,
  _notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency uuid;
  v_rate numeric := 10.00;
  v_commission numeric;
  v_partner numeric;
  v_id uuid;
BEGIN
  IF NOT has_role(auth.uid(), 'partner') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _gross_amount IS NULL OR _gross_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid gross amount';
  END IF;

  v_agency := get_user_agency(auth.uid());
  IF v_agency IS NULL THEN
    RAISE EXCEPTION 'Partner is not linked to an agency';
  END IF;

  SELECT COALESCE(commission_rate, 10.00) INTO v_rate
  FROM partner_agencies WHERE id = v_agency;
  v_rate := COALESCE(v_rate, 10.00);

  v_commission := round(_gross_amount * v_rate / 100.0, 2);
  v_partner := _gross_amount - v_commission;

  INSERT INTO public.commission_payments (
    agency_id, proposal_id, gross_amount, guata_commission, partner_amount,
    stripe_fee, status, source, sale_date, client_name, destination, notes, created_by
  ) VALUES (
    v_agency, NULL, _gross_amount, v_commission, v_partner,
    0, 'pending', 'external', _sale_date, _client_name, _destination, _notes, auth.uid()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.partner_insert_external_sale(numeric, text, text, date, text) TO authenticated;

CREATE POLICY "Partners update own pending notes"
  ON public.commission_payments FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'partner'::app_role)
    AND agency_id = get_user_agency(auth.uid())
    AND source = 'external'
    AND status = 'pending'
  );

-- 5. Trigger: ao marcar proposta como paga, gerar commission_payment automaticamente
CREATE OR REPLACE FUNCTION public.generate_commission_on_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate numeric := 10.00;
  v_gross numeric;
  v_commission numeric;
  v_partner numeric;
BEGIN
  IF NEW.payment_status = 'paid' AND COALESCE(OLD.payment_status,'') <> 'paid' THEN
    -- sÃ³ gera se nÃ£o existir ainda
    IF EXISTS (SELECT 1 FROM commission_payments WHERE proposal_id = NEW.id) THEN
      RETURN NEW;
    END IF;
    -- sÃ³ faz sentido para propostas vinculadas a agÃªncia parceira
    IF NEW.agency_id IS NULL THEN
      RETURN NEW;
    END IF;
    SELECT commission_rate INTO v_rate FROM partner_agencies WHERE id = NEW.agency_id;
    v_rate := COALESCE(v_rate, 10.00);
    v_gross := COALESCE(NEW.total_price, 0);
    v_commission := round(v_gross * v_rate / 100.0, 2);
    v_partner := v_gross - v_commission;
    INSERT INTO commission_payments (
      agency_id, proposal_id, gross_amount, guata_commission, partner_amount,
      stripe_fee, status, source, sale_date
    ) VALUES (
      NEW.agency_id, NEW.id, v_gross, v_commission, v_partner,
      0, 'pending', 'platform', CURRENT_DATE
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS proposals_generate_commission ON public.proposals;
CREATE TRIGGER proposals_generate_commission
  AFTER UPDATE OF payment_status ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.generate_commission_on_paid();


-- ========== 20260528190000_create_partner_access_rpc.sql ==========
-- RPC: criar acesso de parceiro (substitui edge function invite-partner)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.create_partner_access(
  p_agency_id UUID,
  p_email TEXT,
  p_full_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_email TEXT := lower(trim(p_email));
  v_password TEXT;
  v_encrypted_pw TEXT;
  v_chars TEXT := 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
  i INT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  IF p_agency_id IS NULL OR v_email IS NULL OR v_email = '' OR p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RAISE EXCEPTION 'agency_id, email e nome sÃ£o obrigatÃ³rios';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    RAISE EXCEPTION 'Este email jÃ¡ possui conta';
  END IF;

  v_password := '';
  FOR i IN 1..12 LOOP
    v_password := v_password || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
  END LOOP;
  v_encrypted_pw := crypt(v_password, gen_salt('bf'));

  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    v_encrypted_pw,
    NOW(),
    jsonb_build_object('full_name', trim(p_full_name)),
    NOW(),
    NOW()
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email',
    v_email,
    NOW(),
    NOW(),
    NOW()
  );

  UPDATE public.user_roles
  SET role = 'partner'::app_role
  WHERE user_id = v_user_id;

  INSERT INTO public.partner_users (user_id, agency_id)
  VALUES (v_user_id, p_agency_id)
  ON CONFLICT (user_id) DO UPDATE SET agency_id = EXCLUDED.agency_id;

  UPDATE public.partner_agencies
  SET is_active = true
  WHERE id = p_agency_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', v_email,
    'temporary_password', v_password
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_partner_access(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_partner_access(UUID, TEXT, TEXT) TO authenticated;



-- ========== 20260529144741_f63e62f5-fd82-4496-8501-6f051184e0db.sql ==========
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS dossier jsonb NOT NULL DEFAULT '{}'::jsonb;


-- ========== 20260531023656_0a6a9e03-64a6-4bad-a318-3cc5f0205fa4.sql ==========
CREATE POLICY "Anyone can view requests of shared proposals"
ON public.travel_requests
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.request_id = travel_requests.id
      AND p.share_token IS NOT NULL
      AND p.share_enabled = true
  )
);


-- ========== 20260601033328_b12a6fb4-072b-4d72-a1df-8200ce3c259c.sql ==========
-- ReforÃ§o: polÃ­tica explÃ­cita de INSERT para staff em travel_requests
-- (a polÃ­tica ALL jÃ¡ cobre, mas tornamos o INSERT inequÃ­voco)
DROP POLICY IF EXISTS "Staff can insert requests" ON public.travel_requests;
CREATE POLICY "Staff can insert requests"
ON public.travel_requests
FOR INSERT
TO authenticated
WITH CHECK (is_staff(auth.uid()));


-- ========== 20260601120000_legal_pages_restructure.sql ==========
-- Reorganiza pÃ¡ginas legais: privacidade embutida em termos, nova polÃ­tica de serviÃ§os

UPDATE public.cms_pages
SET
  status = 'hidden',
  updated_at = now()
WHERE slug = 'privacidade';

UPDATE public.cms_pages
SET
  title = 'Termos de Uso e PolÃ­tica de Privacidade',
  meta_description = 'Termos de uso do site e polÃ­tica de privacidade da GuatÃ¡ Travel Experience.',
  updated_at = now()
WHERE slug = 'termos';

INSERT INTO public.cms_pages (slug, title, content, meta_description, status)
VALUES (
  'politica-servicos',
  'PolÃ­tica de PrestaÃ§Ã£o de ServiÃ§os da GuatÃ¡ Viagens e Turismo',
  '{
    "hero": {
      "title": "PolÃ­tica de PrestaÃ§Ã£o de ServiÃ§os da GuatÃ¡ Viagens e Turismo",
      "subtitle": "CondiÃ§Ãµes gerais para contrataÃ§Ã£o e prestaÃ§Ã£o de serviÃ§os turÃ­sticos pela agÃªncia."
    },
    "sections": [
      {
        "title": "Documento oficial",
        "content": "O documento completo da PolÃ­tica de PrestaÃ§Ã£o de ServiÃ§os estÃ¡ disponÃ­vel em PDF nesta pÃ¡gina. Caso o PDF ainda nÃ£o tenha sido publicado, entre em contato conosco para solicitar uma cÃ³pia."
      }
    ]
  }'::jsonb,
  'PolÃ­tica de prestaÃ§Ã£o de serviÃ§os turÃ­sticos da GuatÃ¡ Viagens e Turismo.',
  'published'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  meta_description = EXCLUDED.meta_description,
  status = EXCLUDED.status,
  updated_at = now();



-- ========== 20260601130000_ensure_site_assets_bucket.sql ==========
-- Bucket site-assets — crie via Dashboard/API (docs/MIGRAR_STORAGE.md)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('site-assets', 'site-assets', true)
-- ON CONFLICT (id) DO UPDATE SET public = true;
SELECT 1;


-- ========== 20260617011706_partner_realtime_security.sql ==========
DROP POLICY IF EXISTS "Partners insert external sales" ON public.commission_payments;

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny realtime broadcast and presence" ON realtime.messages;
CREATE POLICY "Deny realtime broadcast and presence"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (false);


