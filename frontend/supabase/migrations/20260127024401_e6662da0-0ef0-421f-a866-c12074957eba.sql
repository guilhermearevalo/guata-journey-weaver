-- Enum para status de página
CREATE TYPE public.page_status AS ENUM ('draft', 'published', 'hidden');

-- Tabela de páginas CMS
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

-- Índice para busca por slug
CREATE INDEX idx_cms_pages_slug ON public.cms_pages(slug);
CREATE INDEX idx_cms_pages_status ON public.cms_pages(status);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_cms_pages_updated_at
    BEFORE UPDATE ON public.cms_pages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Público lê páginas publicadas
CREATE POLICY "Anyone can view published pages"
ON public.cms_pages FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- Staff pode gerenciar todas as páginas
CREATE POLICY "Staff can manage all pages"
ON public.cms_pages FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()));

-- Inserir conteúdo inicial das páginas
INSERT INTO public.cms_pages (slug, title, content, meta_description, status) VALUES
('sobre', 'Sobre a Guatá', '{
  "hero": {
    "title": "Sobre a Guatá",
    "subtitle": "Conheça nossa história e missão"
  },
  "sections": [
    {
      "title": "Nossa História",
      "content": "A Guatá nasceu da paixão por viagens autênticas e experiências transformadoras. Nosso nome vem do tupi-guarani e significa \"andar\", \"caminhar\" – representando nossa essência de guiar viajantes por jornadas únicas pelo Brasil e pelo mundo."
    },
    {
      "title": "Nossa Missão",
      "content": "Conectamos viajantes a experiências cuidadosamente selecionadas, priorizando autenticidade, sustentabilidade e imersão cultural. Cada roteiro é pensado para criar memórias inesquecíveis."
    },
    {
      "title": "Nossos Valores",
      "content": "• Curadoria cuidadosa: Selecionamos apenas experiências que realmente fazem a diferença\n• Atendimento personalizado: Cada viajante é único e merece atenção especial\n• Sustentabilidade: Promovemos turismo responsável e consciente\n• Parcerias locais: Valorizamos operadores e guias locais"
    }
  ]
}', 'Conheça a Guatá Travel Experience - sua agência de viagens personalizadas', 'published'),

('faq', 'Perguntas Frequentes', '{
  "hero": {
    "title": "Perguntas Frequentes",
    "subtitle": "Tire suas dúvidas sobre nossos serviços"
  },
  "items": [
    {
      "question": "Como funciona o processo de viagem personalizada?",
      "answer": "Você preenche nosso formulário com suas preferências e um consultor entra em contato para entender melhor suas expectativas. Criamos um roteiro exclusivo e, após sua aprovação, cuidamos de toda a operação."
    },
    {
      "question": "Qual a diferença entre pacotes e excursões?",
      "answer": "Pacotes são roteiros pré-definidos com datas flexíveis, ideais para quem quer praticidade. Excursões são viagens em grupo com datas fixas e preços mais acessíveis."
    },
    {
      "question": "Vocês trabalham com quais destinos?",
      "answer": "Trabalhamos com destinos nacionais e internacionais, sempre com foco em experiências autênticas e imersão cultural."
    },
    {
      "question": "Como funciona o pagamento?",
      "answer": "Oferecemos diversas formas de pagamento, incluindo parcelamento no cartão e condições especiais para pagamento à vista. Os detalhes são apresentados na proposta."
    },
    {
      "question": "Posso alterar meu roteiro depois de confirmado?",
      "answer": "Sim, dentro das políticas de cada fornecedor. Nossos consultores trabalham para acomodar mudanças sempre que possível."
    }
  ]
}', 'Perguntas frequentes sobre viagens, pacotes e serviços da Guatá', 'published'),

('termos', 'Termos de Uso', '{
  "hero": {
    "title": "Termos de Uso",
    "subtitle": "Condições gerais de uso da plataforma"
  },
  "sections": [
    {
      "title": "1. Aceitação dos Termos",
      "content": "Ao acessar e utilizar os serviços da Guatá Travel Experience, você concorda com estes termos de uso. Se não concordar com qualquer parte destes termos, não utilize nossos serviços."
    },
    {
      "title": "2. Serviços Oferecidos",
      "content": "A Guatá atua como intermediária entre viajantes e operadores de turismo, oferecendo curadoria de experiências, pacotes de viagem e excursões. Os serviços finais são prestados por parceiros homologados."
    },
    {
      "title": "3. Responsabilidades",
      "content": "O viajante é responsável por fornecer informações corretas, possuir documentação válida e seguir as orientações de cada destino. A Guatá não se responsabiliza por eventos de força maior ou decisões de terceiros."
    },
    {
      "title": "4. Política de Cancelamento",
      "content": "Cancelamentos estão sujeitos às políticas específicas de cada pacote ou experiência, que serão informadas antes da confirmação. Taxas administrativas podem ser aplicadas."
    },
    {
      "title": "5. Alterações nos Termos",
      "content": "Reservamos o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas por e-mail ou no site."
    }
  ]
}', 'Termos de uso da plataforma Guatá Travel Experience', 'published'),

('privacidade', 'Política de Privacidade', '{
  "hero": {
    "title": "Política de Privacidade",
    "subtitle": "Como tratamos seus dados pessoais"
  },
  "sections": [
    {
      "title": "1. Dados Coletados",
      "content": "Coletamos dados fornecidos por você (nome, e-mail, telefone, preferências de viagem) e dados de navegação (cookies, páginas visitadas). Essas informações são essenciais para personalizar sua experiência."
    },
    {
      "title": "2. Uso dos Dados",
      "content": "Seus dados são utilizados para: processar solicitações de viagem, enviar propostas personalizadas, comunicar atualizações importantes e melhorar nossos serviços."
    },
    {
      "title": "3. Compartilhamento",
      "content": "Compartilhamos dados apenas com parceiros operadores quando necessário para a execução da viagem. Nunca vendemos suas informações para terceiros."
    },
    {
      "title": "4. Segurança",
      "content": "Utilizamos criptografia e práticas de segurança modernas para proteger seus dados. O acesso às informações é restrito a colaboradores autorizados."
    },
    {
      "title": "5. Seus Direitos",
      "content": "Você pode solicitar acesso, correção ou exclusão de seus dados a qualquer momento. Entre em contato conosco para exercer seus direitos conforme a LGPD."
    }
  ]
}', 'Política de privacidade e proteção de dados da Guatá', 'published'),

('contato', 'Contato', '{
  "hero": {
    "title": "Entre em Contato",
    "subtitle": "Estamos aqui para ajudar você a planejar sua próxima aventura"
  },
  "info": {
    "email": "contato@guata.com.br",
    "phone": "(11) 99999-9999",
    "whatsapp": "5511999999999",
    "address": "São Paulo, SP - Brasil",
    "hours": "Segunda a Sexta, 9h às 18h"
  }
}', 'Entre em contato com a Guatá Travel Experience', 'published');