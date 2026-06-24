import { useCmsPage } from '@/hooks/useCmsPage';
import CmsPageSkeleton from '@/components/cms/CmsPageSkeleton';
import LegalPageLayout from '@/components/cms/LegalPageLayout';

const defaultContent = {
  hero: {
    title: 'Termos de Uso e Política de Privacidade',
    subtitle:
      'Condições para utilização do site e como a agência trata os seus dados pessoais.',
  },
  sections: [
    {
      title: '1. Aceitação dos Termos',
      content:
        'Ao acessar e utilizar o site da Guatá Viagens e Turismo, você concorda integralmente com estes Termos de Uso e com a Política de Privacidade abaixo. Caso não concorde, recomendamos que não utilize a plataforma.',
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
    {
      title: 'Política de Privacidade',
      content:
        'A partir desta seção, descrevemos como a Guatá Viagens e Turismo e suas agências parceiras coletam, utilizam e protegem os seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).',
    },
    {
      title: '1. Quem somos',
      content:
        'A Guatá Viagens e Turismo, juntamente com suas agências parceiras, é responsável pelo tratamento dos dados pessoais coletados durante o atendimento e a operação das viagens.',
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
      title={hero?.title || 'Termos de Uso e Política de Privacidade'}
      subtitle={
        hero?.subtitle ||
        'Condições para utilização do site e como a agência trata os seus dados pessoais.'
      }
      badge="Termos do site"
      updatedAt="Junho de 2026"
      sections={sections || defaultContent.sections}
      pdfUrl={pdfUrl}
    />
  );
};

export default Termos;
