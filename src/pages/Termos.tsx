import { useCmsPage } from '@/hooks/useCmsPage';
import CmsPageSkeleton from '@/components/cms/CmsPageSkeleton';
import LegalPageLayout from '@/components/cms/LegalPageLayout';

// Conteúdo padrão (Termos de Uso = referente ao SITE / plataforma)
const defaultContent = {
  hero: {
    title: 'Termos de Uso',
    subtitle: 'Condições para utilização do site e da plataforma Guatá.',
  },
  sections: [
    {
      title: '1. Aceitação dos Termos',
      content:
        'Ao acessar e utilizar o site da Guatá Travel Experience, você concorda integralmente com estes Termos de Uso. Caso não concorde, recomendamos que não utilize a plataforma.',
    },
    {
      title: '2. Sobre a Plataforma',
      content:
        'A Guatá é uma plataforma que conecta viajantes a agências e operadores parceiros. Atuamos como intermediadores: as experiências, pacotes e roteiros são operados pelas agências parceiras, enquanto a Guatá facilita a descoberta, a comunicação e o acompanhamento das solicitações.',
    },
    {
      title: '3. Cadastro e Conta de Usuário',
      content:
        'Para utilizar determinados recursos, é necessário criar uma conta com informações verídicas e atualizadas. Você é responsável por manter a confidencialidade das suas credenciais e por todas as atividades realizadas na sua conta.',
    },
    {
      title: '4. Solicitações e Roteiros',
      content:
        'O envio de uma solicitação de viagem não constitui contrato ou reserva confirmada. As propostas e roteiros enviados estão sujeitos à disponibilidade e à confirmação das agências parceiras responsáveis pela operação.',
    },
    {
      title: '5. Reservas e Pagamentos',
      content:
        'Quando aplicável, pagamentos podem ser processados por meios seguros disponibilizados na plataforma. Os valores, condições de cancelamento e políticas de reembolso são definidos pela agência operadora de cada experiência.',
    },
    {
      title: '6. Responsabilidades',
      content:
        'A Guatá empenha-se para apresentar informações corretas e parceiros confiáveis, mas não se responsabiliza por falhas na operação realizada por terceiros. Eventuais divergências sobre serviços prestados devem ser tratadas com a agência responsável, com o nosso apoio na mediação.',
    },
    {
      title: '7. Propriedade Intelectual',
      content:
        'Todo o conteúdo do site — marca, textos, imagens e layout — pertence à Guatá ou aos seus parceiros, sendo vedada a reprodução sem autorização prévia.',
    },
    {
      title: '8. Alterações dos Termos',
      content:
        'Estes Termos podem ser atualizados a qualquer momento. A versão vigente estará sempre disponível nesta página, e o uso contínuo do site após alterações implica concordância com as novas condições.',
    },
  ],
};

const Termos = () => {
  const { data: page, isLoading } = useCmsPage('termos');

  const content = page?.content || defaultContent;
  const { hero, sections } = content;
  const pdfUrl = (content as { pdf_url?: string }).pdf_url;

  if (isLoading) {
    return <CmsPageSkeleton />;
  }

  return (
    <LegalPageLayout
      title={hero?.title || 'Termos de Uso'}
      subtitle={hero?.subtitle || 'Condições para utilização do site e da plataforma Guatá.'}
      badge="Termos do site"
      updatedAt="Junho de 2026"
      sections={sections || defaultContent.sections}
      pdfUrl={pdfUrl}
    />
  );
};

export default Termos;
