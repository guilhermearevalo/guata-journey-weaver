import { FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface CmsPageNotFoundProps {
  slug?: string;
}

const CmsPageNotFound = ({ slug }: CmsPageNotFoundProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center px-4">
        <FileX className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">
          Página não encontrada
        </h1>
        <p className="text-muted-foreground mb-6">
          {slug 
            ? `A página "${slug}" não existe ou não está publicada.`
            : 'A página solicitada não existe ou não está publicada.'
          }
        </p>
        <Button asChild>
          <Link to="/">Voltar para o início</Link>
        </Button>
      </div>
    </div>
  );
};

export default CmsPageNotFound;
