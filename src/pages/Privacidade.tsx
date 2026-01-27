import { useCmsPage } from '@/hooks/useCmsPage';
import CmsPageSkeleton from '@/components/cms/CmsPageSkeleton';
import CmsPageNotFound from '@/components/cms/CmsPageNotFound';

const Privacidade = () => {
  const { data: page, isLoading, error } = useCmsPage('privacidade');

  if (isLoading) {
    return <CmsPageSkeleton />;
  }

  if (error || !page) {
    return <CmsPageNotFound slug="privacidade" />;
  }

  const { hero, sections } = page.content;

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
