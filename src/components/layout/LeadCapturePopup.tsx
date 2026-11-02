import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';

const KEY = 'guata-lead-shown';

/** Opens once per visitor session when they try to leave (desktop) or after 40s browsing. */
export function LeadCapturePopup() {
  const { t, lang } = useI18n();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dest, setDest] = useState('');
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || phone.replace(/\D/g, '').length < 8) return;
    setSending(true);
    const { error } = await supabase.from('site_leads').insert({
      name: name.trim().slice(0, 120),
      phone: phone.trim().slice(0, 30),
      destination: dest.trim().slice(0, 200) || null,
      source: 'popup',
      lang,
      page: pathname.slice(0, 300),
    });
    setSending(false);
    if (error) { toast.error('Erro ao enviar. Tente pelo WhatsApp.'); return; }
    toast.success(t('leadThanks'));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{t('leadTitle')}</DialogTitle>
          <DialogDescription>{t('leadSub')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input required maxLength={120} placeholder={t('leadName')} value={name} onChange={(e) => setName(e.target.value)} />
          <Input required type="tel" maxLength={30} placeholder={t('leadPhone')} value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input maxLength={200} placeholder={t('leadDest')} value={dest} onChange={(e) => setDest(e.target.value)} />
          <Button type="submit" className="w-full" disabled={sending}>{t('leadSend')}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
