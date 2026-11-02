import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { MapPin, MessageCircle, Phone, User, Sparkles } from 'lucide-react';

const KEY = 'guata-lead-shown';

const copy = {
  pt: { eyebrow: 'Consultoria gratuita', msg: 'Conte o que você imagina: datas, quantas pessoas, estilo da viagem…', note: 'Respondemos em até 1 dia útil pelo WhatsApp.' },
  en: { eyebrow: 'Free consultation', msg: 'Tell us what you have in mind: dates, travelers, trip style…', note: 'We reply within 1 business day on WhatsApp.' },
  es: { eyebrow: 'Asesoría gratuita', msg: 'Cuéntanos lo que imaginas: fechas, personas, estilo de viaje…', note: 'Respondemos en hasta 1 día hábil por WhatsApp.' },
};

/** Opens once per visitor session when they try to leave (desktop) or after 40s browsing. */
export function LeadCapturePopup() {
  const { t, lang } = useI18n();
  const c = copy[(lang as keyof typeof copy)] ?? copy.pt;
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dest, setDest] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(KEY)) return;
    const show = () => {
      if (sessionStorage.getItem(KEY)) return;
      sessionStorage.setItem(KEY, '1');
      setOpen(true);
    };
    const onLeave = (e: MouseEvent) => { if (e.clientY <= 0) show(); };
    const timer = window.setTimeout(show, 40000);
    document.addEventListener('mouseleave', onLeave);
    return () => { clearTimeout(timer); document.removeEventListener('mouseleave', onLeave); };
  }, []);

  const openWhatsAppFallback = async () => {
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'whatsapp_config').maybeSingle();
    const num = String((data?.value as any)?.number ?? '').replace(/\D/g, '');
    const text = `Olá! Sou ${name.trim()} (${phone.trim()}).${dest.trim() ? ` Destino: ${dest.trim()}.` : ''}${message.trim() ? ` ${message.trim()}` : ''}`;
    if (num) window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || phone.replace(/\D/g, '').length < 8) return;
    setSending(true);
    const { error } = await (supabase as any).from('site_leads').insert({
      name: name.trim().slice(0, 120),
      phone: phone.trim().slice(0, 30),
      destination: dest.trim().slice(0, 200) || null,
      message: message.trim().slice(0, 1000) || null,
      source: 'popup',
      lang,
      page: pathname.slice(0, 300),
    });
    setSending(false);
    if (error) {
      // Don't lose the lead: send it straight to WhatsApp instead.
      await openWhatsAppFallback();
    }
    toast.success(t('leadThanks'));
    setOpen(false);
  };

  const field = 'relative';
  const icon = 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
        <div className="bg-primary text-primary-foreground px-7 pt-7 pb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> {c.eyebrow}
          </span>
          <DialogTitle className="font-display text-3xl mt-3 leading-tight">{t('leadTitle')}</DialogTitle>
          <DialogDescription className="text-primary-foreground/80 mt-2">{t('leadSub')}</DialogDescription>
        </div>
        <form onSubmit={submit} className="space-y-3 px-7 py-6">
          <div className={field}><User className={icon} />
            <Input className="pl-9 h-11" required maxLength={120} placeholder={t('leadName')} value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className={field}><Phone className={icon} />
              <Input className="pl-9 h-11" required type="tel" maxLength={30} placeholder={t('leadPhone')} value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div className={field}><MapPin className={icon} />
              <Input className="pl-9 h-11" maxLength={200} placeholder={t('leadDest')} value={dest} onChange={(e) => setDest(e.target.value)} /></div>
          </div>
          <Textarea rows={3} maxLength={1000} placeholder={c.msg} value={message} onChange={(e) => setMessage(e.target.value)} className="resize-none" />
          <Button type="submit" size="lg" className="w-full gap-2" disabled={sending}>
            <MessageCircle className="h-4 w-4" /> {t('leadSend')}
          </Button>
          <p className="text-center text-xs text-muted-foreground">{c.note}</p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
