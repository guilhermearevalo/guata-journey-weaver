import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageBubble } from '@/components/cliente/MessageBubble';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageCircle, Plane } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ClienteMensagens() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get client's travel requests
  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['client-requests-for-messages', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('travel_requests')
        .select('id, destination, status, assigned_consultant_id')
        .eq('client_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get messages for selected request
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['client-messages', selectedRequestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('request_id', selectedRequestId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedRequestId,
  });

  // Mark messages as read
  useEffect(() => {
    if (selectedRequestId && user?.id && messages?.length) {
      const unreadIds = messages
        .filter(m => m.recipient_id === user.id && !m.is_read)
        .map(m => m.id);
      
      if (unreadIds.length > 0) {
        supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadIds)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['client-unread-messages'] });
          });
      }
    }
  }, [selectedRequestId, messages, user?.id, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async () => {
      const selectedRequest = requests?.find(r => r.id === selectedRequestId);
      const { error } = await supabase.from('messages').insert({
        request_id: selectedRequestId,
        sender_id: user!.id,
        recipient_id: selectedRequest?.assigned_consultant_id || null,
        content: newMessage.trim(),
        channel: 'platform',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['client-messages', selectedRequestId] });
    },
    onError: () => {
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage.mutate();
    }
  };

  // Auto-select first request
  useEffect(() => {
    if (requests?.length && !selectedRequestId) {
      setSelectedRequestId(requests[0].id);
    }
  }, [requests, selectedRequestId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mensagens</h2>
        <p className="text-muted-foreground">
          Converse com nossos consultores sobre suas viagens
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conversas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {requestsLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : requests?.length ? (
              <div className="divide-y">
                {requests.map(request => (
                  <button
                    key={request.id}
                    onClick={() => setSelectedRequestId(request.id)}
                    className={`w-full p-4 text-left transition-colors hover:bg-muted/50 ${
                      selectedRequestId === request.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Plane className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate font-medium">
                          {request.destination || 'Destino não definido'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Viagem
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhuma conversa disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2">
          {selectedRequestId ? (
            <>
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-base">
                  {requests?.find(r => r.id === selectedRequestId)?.destination || 'Conversa'}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex h-[500px] flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                  {messagesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-16 w-3/4" />
                      ))}
                    </div>
                  ) : messages?.length ? (
                    <div className="space-y-4">
                      {messages.map(message => (
                        <MessageBubble
                          key={message.id}
                          content={message.content}
                          createdAt={message.created_at}
                          isOwn={message.sender_id === user?.id}
                        />
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <MessageCircle className="mb-4 h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        Nenhuma mensagem ainda
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Envie uma mensagem para iniciar a conversa
                      </p>
                    </div>
                  )}
                </ScrollArea>
                <form onSubmit={handleSend} className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sendMessage.isPending}
                    />
                    <Button type="submit" disabled={!newMessage.trim() || sendMessage.isPending}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex h-[500px] items-center justify-center">
              <div className="text-center">
                <MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  Selecione uma conversa para ver as mensagens
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
