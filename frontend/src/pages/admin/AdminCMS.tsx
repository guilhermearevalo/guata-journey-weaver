import { useState } from 'react';
import { useCmsPages, CmsPage } from '@/hooks/useCmsPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Eye, EyeOff, Pencil, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminCMS = () => {
  const { data: pages, isLoading } = useCmsPages();

  const statusConfig = {
    published: { label: 'Publicada', variant: 'default' as const, icon: Eye },
    draft: { label: 'Rascunho', variant: 'secondary' as const, icon: EyeOff },
    hidden: { label: 'Oculta', variant: 'outline' as const, icon: EyeOff },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Gerenciador de Conteúdo</h1>
          <p className="text-muted-foreground">
            Edite as páginas institucionais do site
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pages?.filter((page) => page.slug !== 'privacidade').map((page) => {
            const status = statusConfig[page.status];
            const StatusIcon = status.icon;

            return (
              <Card key={page.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{page.title}</CardTitle>
                  </div>
                  <Badge variant={status.variant} className="gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p>URL: /{page.slug}</p>
                    <p>
                      Atualizado:{' '}
                      {format(new Date(page.updated_at), "dd 'de' MMM, yyyy", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" className="flex-1 gap-1">
                      <Link to={`/admin/cms/${page.slug}`}>
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/${page.slug}`} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminCMS;
