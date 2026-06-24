import { useCmsPage } from '@/hooks/useCmsPage';
import CmsPageSkeleton from '@/components/cms/CmsPageSkeleton';
import LegalPageLayout from '@/components/cms/LegalPageLayout';

const defaultContent = {
  hero: {
    title: 'Política de Prestação de Serviços da Guatá Viagens e Turismo',
    subtitle:
      'Condições gerais para contratação e prestação de serviços turísticos pela agência.',
  },
  sections: [
    {
      title: 'Documento oficial',
      content:
        'O documento completo da Política de Prestação de Serviços está disponível em PDF nesta página. Caso o PDF ainda não tenha sido publicado, entre em contato conosco para solicitar uma cópia.',
    },
  ],
};

const PoliticaServicos = () => {
  const { data: page, isLoading } = useCmsPage('politica-servicos');

  const content = page?.content || defaultContent;
  const { hero, sections } = content;
  const pdfUrl = (content as { pdf_url?: string }).pdf_url;

  if (isLoading) {
    return <CmsPageSkeleton />;
  }

  return (
    <LegalPageLayout
      title={
        hero?.title ||
        'Política de Prestação de Serviços da Guatá Viagens e Turismo'
      }
      subtitle={
        hero?.subtitle ||
        'Condições gerais para contratação e prestação de serviços turísticos pela agência.'
      }
      badge="Política da agência"
      updatedAt="Junho de 2026"
      sections={sections || defaultContent.sections}
      pdfUrl={pdfUrl}
    />
  );
};

export default PoliticaServicos;
