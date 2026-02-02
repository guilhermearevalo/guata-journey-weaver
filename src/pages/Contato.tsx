import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCmsPage } from '@/hooks/useCmsPage';
import CmsPageSkeleton from '@/components/cms/CmsPageSkeleton';

// Conteúdo padrão caso o CMS esteja vazio
const defaultContent = {
  hero: {
    title: 'Entre em Contato',
    subtitle: 'Estamos aqui para ajudar você a planejar sua próxima aventura',
  },
  info: {
    email: 'contato@guata.com.br',
    phone: '(11) 99999-9999',
    whatsapp: '5511999999999',
    address: 'São Paulo, SP - Brasil',
    hours: 'Segunda a Sexta: 9h às 18h',
  },
};

const Contato = () => {
  const { toast } = useToast();
  const { data: page, isLoading } = useCmsPage('contato');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: 'Mensagem enviada!',
      description: 'Retornaremos seu contato em breve.',
    });

    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    });
    setIsSubmitting(false);
  };

  // Usa dados do CMS ou fallback para conteúdo padrão
  const content = page?.content || defaultContent;
  const { hero, info } = content;

  if (isLoading) {
    return <CmsPageSkeleton />;
  }

  const contactInfo = [
    {
      icon: Mail,
      title: 'E-mail',
      value: info?.email || 'contato@guata.com.br',
      href: `mailto:${info?.email || 'contato@guata.com.br'}`,
    },
    {
      icon: Phone,
      title: 'WhatsApp',
      value: info?.phone || '(11) 99999-9999',
      href: `https://wa.me/${info?.whatsapp || '5511999999999'}`,
    },
    {
      icon: MapPin,
      title: 'Localização',
      value: info?.address || 'São Paulo, SP',
      href: null,
    },
    {
      icon: Clock,
      title: 'Horário',
      value: info?.hours || 'Seg-Sex: 9h às 18h',
      href: null,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            {hero?.title || 'Entre em Contato'}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {hero?.subtitle || 'Estamos aqui para ajudar você a planejar sua próxima aventura'}
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Contact Form */}
          <div>
            <h2 className="font-display text-2xl font-bold mb-6">
              Envie sua Mensagem
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto *</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="Qual o motivo do contato?"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem *</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Como podemos ajudar você?"
                />
              </div>

              <Button type="submit" size="lg" disabled={isSubmitting} className="w-full gap-2">
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
              </Button>
            </form>
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="font-display text-2xl font-bold mb-6">
              Informações de Contato
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {contactInfo.map((item) => (
                <Card key={item.title} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-start gap-4 p-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      {item.href ? (
                        <a 
                          href={item.href}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          target={item.href.startsWith('http') ? '_blank' : undefined}
                          rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-muted-foreground">{item.value}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Map placeholder */}
            <div className="mt-8 aspect-video overflow-hidden rounded-xl bg-muted">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d467689.9161420024!2d-46.87529453125!3d-23.68199745!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce448183a461d1%3A0x9ba94b08ff335bae!2zU8OjbyBQYXVsbywgU1A!5e0!3m2!1spt-BR!2sbr!4v1706000000000!5m2!1spt-BR!2sbr"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização Guatá"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contato;
