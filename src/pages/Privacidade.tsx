import { useCmsPage } from '@/hooks/useCmsPage';
import CmsPageSkeleton from '@/components/cms/CmsPageSkeleton';

// Conteúdo padrão caso o CMS esteja vazio
const defaultContent = {
  hero: {
    title: 'Política de Privacidade',
    subtitle: 'Como tratamos e protegemos seus dados pessoais',
  },
  sections: [
    { title: '1. Dados Coletados', content: 'Coletamos informações que você nos fornece diretamente, como nome, e-mail, telefone e preferências de viagem.' },
    { title: '2. Uso das Informações', content: 'Utilizamos seus dados para processar suas solicitações, personalizar sua experiência e melhorar nossos serviços.' },
    { title: '3. Segurança', content: 'Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado.' },
  ],
};

const Privacidade = () => {
  const { data: page, isLoading } = useCmsPage('privacidade');

  // Usa dados do CMS ou fallback para conteúdo padrão
  const content = page?.content || defaultContent;
  const { hero, sections } = content;

  if (isLoading) {
    return <CmsPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            {hero?.title || 'Política de Privacidade'}
          </h1>
          <p className="mx-auto mt-4 text-muted-foreground">
            {hero?.subtitle || 'Como tratamos seus dados pessoais'}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-16">
        <div className="prose prose-lg mx-auto max-w-3xl dark:prose-invert">
          {sections?.map((section, index) => (
            <div key={index}>
              <h2>{section.title}</h2>
              <p className="whitespace-pre-line">{section.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Privacidade;
