import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Instagram, Facebook, Youtube, Send, Loader2, CheckCircle, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import logo from '@/assets/logo-guata.png';

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: email.trim().toLowerCase() });

    setLoading(false);

    if (error) {
      if (error.code === '23505') {
        toast.info('Este email já está cadastrado!');
      } else {
        toast.error('Erro ao cadastrar. Tente novamente.');
      }
      return;
    }

    setSubscribed(true);
    setEmail('');
    toast.success('Cadastrado com sucesso!');
  };

  if (subscribed) {
    return (
      <div className="flex items-center justify-center gap-2 text-primary">
        <CheckCircle className="h-5 w-5" />
        <span className="text-sm font-medium">Obrigado por se inscrever!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubscribe} className="flex gap-2">
      <Input
        type="email"
        placeholder="Seu melhor email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/50"
      />
      <Button type="submit" size="sm" disabled={loading} className="shrink-0 gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Assinar
      </Button>
    </form>
  );
}

export function PublicFooter() {
  const { data: cadasturConfig } = useQuery({
    queryKey: ['site-setting', 'cadastur_config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'cadastur_config')
        .maybeSingle();
      if (error) throw error;
      return data?.value as unknown as { number?: string } | null;
    },
  });

  const cadasturNumber = cadasturConfig?.number || '64.677.632/0001-77';

  return (
    <footer className="border-t bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4">
            <img src={logo} alt="Guatá Travel Experience" className="h-16 w-auto brightness-0 invert" />
            <p className="text-sm text-secondary-foreground/80">
              Experiências de viagem únicas e personalizadas. 
              Descubra o Brasil e o mundo com quem entende de curadoria turística.
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-foreground/70 transition-colors hover:text-primary"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-foreground/70 transition-colors hover:text-primary"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-foreground/70 transition-colors hover:text-primary"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 font-display text-lg font-semibold">Navegação</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/experiencias" className="text-secondary-foreground/80 hover:text-primary">
                  Experiências
                </Link>
              </li>
              <li>
                <Link to="/excursoes" className="text-secondary-foreground/80 hover:text-primary">
                  Excursões
                </Link>
              </li>
              <li>
                <Link to="/pacotes" className="text-secondary-foreground/80 hover:text-primary">
                  Pacotes
                </Link>
              </li>
              <li>
                <Link to="/viagem-personalizada" className="text-secondary-foreground/80 hover:text-primary">
                  Viagem Personalizada
                </Link>
              </li>
              <li>
                <Link to="/sobre" className="text-secondary-foreground/80 hover:text-primary">
                  Sobre Nós
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-4 font-display text-lg font-semibold">Suporte</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/faq" className="text-secondary-foreground/80 hover:text-primary">
                  Perguntas Frequentes
                </Link>
              </li>
              <li>
                <Link to="/termos" className="text-secondary-foreground/80 hover:text-primary">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/privacidade" className="text-secondary-foreground/80 hover:text-primary">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link to="/contato" className="text-secondary-foreground/80 hover:text-primary">
                  Fale Conosco
                </Link>
              </li>
              <li>
                <Link to="/seja-parceiro" className="text-secondary-foreground/80 hover:text-primary">
                  Seja Parceiro
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 font-display text-lg font-semibold">Contato</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-secondary-foreground/80">
                  São Paulo, SP - Brasil
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a href="tel:+5511999999999" className="text-secondary-foreground/80 hover:text-primary">
                  (11) 99999-9999
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a href="mailto:contato@guata.travel" className="text-secondary-foreground/80 hover:text-primary">
                  contato@guata.travel
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 border-t border-secondary-foreground/10 pt-8">
          <div className="mx-auto max-w-md text-center">
            <h4 className="font-display text-lg font-semibold mb-2">Receba nossas novidades</h4>
            <p className="text-sm text-secondary-foreground/70 mb-4">
              Cadastre-se para receber ofertas exclusivas e inspirações de viagem.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-8 border-t border-secondary-foreground/10 pt-8 flex flex-col items-center gap-4 text-sm text-secondary-foreground/60">
          <a
            href="https://cadastur.turismo.gov.br"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-secondary-foreground/70 hover:text-primary transition-colors"
          >
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span>Agência regularizada pelo Ministério do Turismo — Cadastur Nº {cadasturNumber}</span>
          </a>
          <p>© {new Date().getFullYear()} Guatá Travel Experience. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
