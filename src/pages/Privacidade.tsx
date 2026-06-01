import { useCmsPage } from '@/hooks/useCmsPage';
import CmsPageSkeleton from '@/components/cms/CmsPageSkeleton';
import LegalPageLayout from '@/components/cms/LegalPageLayout';

// Conteúdo padrão (Política de Privacidade = referente à AGÊNCIA / tratamento de dados)
const defaultContent = {
  hero: {
    title: 'Política de Privacidade',
    subtitle: 'Como a agência coleta, utiliza e protege os seus dados pessoais.',
  },
  sections: [
    {
      title: '1. Quem somos',
      content:
        'A Guatá Travel Experience, juntamente com suas agências parceiras, é responsável pelo tratamento dos dados pessoais coletados durante o atendimento e a operação das viagens, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).',
    },
    {
      title: '2. Dados que coletamos',
      content:
        'Coletamos informações fornecidas diretamente por você, como nome, e-mail, telefone, documentos necessários para reservas e preferências de viagem, além de dados de navegação para melhorar a sua experiência no site.',
    },
    {
      title: '3. Como utilizamos seus dados',
      content:
        'Utilizamos seus dados para elaborar roteiros e propostas, processar reservas e pagamentos, manter contato durante o planejamento da viagem, cumprir obrigações legais e aprimorar nossos serviços.',
    },
    {
      title: '4. Compartilhamento com parceiros',
      content:
        'Para operar a sua viagem, podemos compartilhar dados necessários com agências e fornecedores parceiros (hospedagem, transporte, passeios). O compartilhamento ocorre apenas na medida necessária para a prestação do serviço contratado.',
    },
    {
      title: '5. Armazenamento e segurança',
      content:
        'Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou uso indevido. Os dados são mantidos apenas pelo tempo necessário às finalidades informadas ou conforme exigido por lei.',
    },
    {
      title: '6. Seus direitos',
      content:
        'Você pode, a qualquer momento, solicitar acesso, correção, portabilidade ou exclusão dos seus dados, bem como revogar consentimentos. Para exercer seus direitos, entre em contato com nossa equipe pelos canais de atendimento.',
    },
    {
      title: '7. Cookies',
      content:
        'Utilizamos cookies para garantir o funcionamento do site, lembrar preferências e analisar o uso da plataforma. Você pode gerenciar os cookies nas configurações do seu navegador.',
    },
    {
      title: '8. Contato e atualizações',
      content:
        'Em caso de dúvidas sobre esta Política ou sobre o tratamento dos seus dados, fale com a nossa equipe. Esta Política pode ser atualizada periodicamente, e a versão vigente estará sempre disponível nesta página.',
    },
  ],
};

const Privacidade = () => {
  const { data: page, isLoading } = useCmsPage('privacidade');

  const content = page?.content || defaultContent;
  const { hero, sections } = content;
  const pdfUrl = (content as { pdf_url?: string }).pdf_url;

  if (isLoading) {
    return <CmsPageSkeleton />;
  }

  return (
    <LegalPageLayout
      title={hero?.title || 'Política de Privacidade'}
      subtitle={hero?.subtitle || 'Como a agência coleta, utiliza e protege os seus dados pessoais.'}
      badge="Privacidade da agência"
      updatedAt="Junho de 2026"
      sections={sections || defaultContent.sections}
      pdfUrl={pdfUrl}
    />
  );
};

export default Privacidade;
