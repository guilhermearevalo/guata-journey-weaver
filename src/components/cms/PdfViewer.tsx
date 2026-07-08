import { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2 } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfViewerProps {
  url: string;
  title: string;
}

export function PdfViewer({ url, title }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [width, setWidth] = useState<number>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width;
      if (nextWidth) setWidth(Math.floor(nextWidth));
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const onLoadSuccess = useCallback(({ numPages: total }: { numPages: number }) => {
    setNumPages(total);
    setError(null);
  }, []);

  const onLoadError = useCallback(() => {
    setError('Não foi possível carregar o PDF aqui. Use os botões acima para abrir ou baixar.');
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      {error ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{error}</p>
      ) : (
        <Document
          file={{ url }}
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
          loading={
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Carregando PDF" />
            </div>
          }
          error={
            <p className="py-10 text-center text-sm text-muted-foreground">
              Não foi possível carregar o PDF. Use os botões acima para abrir ou baixar.
            </p>
          }
        >
          <div className="flex flex-col items-center gap-4">
            {Array.from({ length: numPages }, (_, index) => (
              <Page
                key={`page-${index + 1}`}
                pageNumber={index + 1}
                width={width}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="overflow-hidden rounded-lg border bg-white shadow-sm"
                aria-label={`${title} — página ${index + 1} de ${numPages}`}
              />
            ))}
          </div>
        </Document>
      )}
    </div>
  );
}
