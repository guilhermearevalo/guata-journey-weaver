import { useNavigate } from 'react-router-dom';
import { Bus, HelpCircle, Plane, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROTEIRO_SOB_MEDIDA_LABEL } from '@/lib/onerTravel';

interface TravelIntentTriageProps {
  onSelectRoteiro: () => void;
}

const OPTIONS = [
  {
    id: 'passagens',
    icon: Plane,
    title: 'Passagem ou hotel',
    description: 'Comprar agora com preço na hora na nossa loja.',
    primary: true,
  },
  {
    id: 'roteiro',
    icon: Sparkles,
    title: ROTEIRO_SOB_MEDIDA_LABEL,
    description: 'Pacote ou viagem montada pela nossa equipe de consultores.',
    primary: false,
  },
  {
    id: 'excursoes',
    icon: Bus,
    title: 'Excursão em grupo',
    description: 'Saídas programadas com guia e grupo.',
    primary: false,
  },
  {
    id: 'ajuda',
    icon: HelpCircle,
    title: 'Não sei, quero ajuda',
    description: 'Conte o que você imagina e orientamos o melhor caminho.',
    primary: false,
  },
] as const;

export function TravelIntentTriage({ onSelectRoteiro }: TravelIntentTriageProps) {
  const navigate = useNavigate();

  const handleSelect = (id: (typeof OPTIONS)[number]['id']) => {
    if (id === 'passagens') {
      navigate('/passagens');
      return;
    }
    if (id === 'excursoes') {
      navigate('/excursoes');
      return;
    }
    onSelectRoteiro();
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle className="font-display text-2xl">O que você está buscando?</CardTitle>
        <CardDescription>
          Escolha abaixo para ir direto ao lugar certo — passagem avulsa não precisa de roteiro
          personalizado.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((option) => (
          <Button
            key={option.id}
            type="button"
            variant={option.primary ? 'default' : 'outline'}
            className="h-auto flex-col items-start gap-2 whitespace-normal px-4 py-4 text-left"
            onClick={() => handleSelect(option.id)}
          >
            <span className="flex items-center gap-2 font-semibold">
              <option.icon className="h-4 w-4 shrink-0" />
              {option.title}
            </span>
            <span className="text-xs font-normal opacity-90">{option.description}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
