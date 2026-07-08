import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Users, MapPin, DollarSign, Route, ListChecks } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { getServiceType, SERVICE_TYPE_SHORT, isConsultancy } from '@/lib/serviceType';

interface KanbanCardProps {
  request: Tables<'travel_requests'>;
  hasProposal?: boolean;
  checklist?: { done: number; total: number };
  onDragStart: (e: React.DragEvent, requestId: string) => void;
  onClick: () => void;
}

export function KanbanCard({ request, hasProposal, checklist, onDragStart, onClick }: KanbanCardProps) {
  const travelDates = request.travel_dates as { start?: string; end?: string } | null;
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } catch {
      return null;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card 
      className="cursor-grab bg-card hover:shadow-md transition-shadow active:cursor-grabbing"
      draggable
      onDragStart={(e) => onDragStart(e, request.id)}
      onClick={onClick}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {getInitials(request.client_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm leading-tight">{request.client_name}</p>
              <p className="text-xs text-muted-foreground">{request.client_email}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {request.destination && (
          <div className="flex items-center gap-1.5 text-sm">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">{request.destination}</span>
          </div>
        )}
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {travelDates?.start && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(travelDates.start)}</span>
            </div>
          )}
          {request.travelers_count && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{request.travelers_count}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            variant={isConsultancy(request) ? 'secondary' : 'outline'}
            className="text-xs font-normal"
          >
            {SERVICE_TYPE_SHORT[getServiceType(request)]}
          </Badge>
          {request.budget_range && (
            <Badge variant="secondary" className="text-xs font-normal">
              <DollarSign className="h-3 w-3 mr-1" />
              {request.budget_range}
            </Badge>
          )}
          {hasProposal && (
            <Badge variant="outline" className="text-xs font-normal text-primary">
              <Route className="h-3 w-3 mr-1" />
              Roteiro
            </Badge>
          )}
          {checklist && checklist.total > 0 && (
            <Badge
              variant="outline"
              className={`text-xs font-normal ${checklist.done === checklist.total ? 'text-green-600 border-green-600/40' : 'text-muted-foreground'}`}
            >
              <ListChecks className="h-3 w-3 mr-1" />
              {checklist.done}/{checklist.total}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
