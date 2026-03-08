import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface KanbanFiltersProps {
  agencyId: string;
  paymentStatus: string;
  onAgencyChange: (v: string) => void;
  onPaymentStatusChange: (v: string) => void;
  onClear: () => void;
}

export function KanbanFilters({ agencyId, paymentStatus, onAgencyChange, onPaymentStatusChange, onClear }: KanbanFiltersProps) {
  const { data: agencies } = useQuery({
    queryKey: ['agencies-filter'],
    queryFn: async () => {
      const { data, error } = await supabase.from('partner_agencies').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
  });

  const hasFilters = agencyId !== 'all' || paymentStatus !== 'all';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={agencyId} onValueChange={onAgencyChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Agência" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as agências</SelectItem>
          <SelectItem value="none">Sem agência</SelectItem>
          {agencies?.map(a => (
            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={paymentStatus} onValueChange={onPaymentStatusChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Pagamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos pagamentos</SelectItem>
          <SelectItem value="pending">Pendente</SelectItem>
          <SelectItem value="partial">Parcial</SelectItem>
          <SelectItem value="paid">Pago</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="mr-1 h-3 w-3" /> Limpar
        </Button>
      )}
    </div>
  );
}
