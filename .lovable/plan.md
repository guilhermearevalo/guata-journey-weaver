
# Status Atual e Plano de Implementação Completo - Guatá Travel Experience

---

## Status do Projeto

### O Que Ja Funciona (Fase 1 + Parte da Fase 2)

| Componente | Status | Observacoes |
|------------|--------|-------------|
| Site Publico (Home, Header, Footer) | Completo | Funcional |
| Autenticacao (Login, Cadastro, Recuperar Senha) | Completo | Demo login funcionando |
| Sistema de Roles (admin, consultant, partner, client) | Completo | RLS configurado |
| Paginas CMS (Sobre, FAQ, Contato, Termos, Privacidade) | Completo | Conteudo via banco |
| Pagina Seja Parceiro (/seja-parceiro) | Completo | Formulario salva no banco |
| Listagem de Experiencias (/experiencias) | Parcial | Lista funciona, falta detalhe |
| Listagem de Excursoes (/excursoes) | Parcial | Lista funciona, falta detalhe |
| Listagem de Pacotes (/pacotes) | Parcial | Lista funciona, falta detalhe |
| Viagem Personalizada (/viagem-personalizada) | Completo | Formulario envia para travel_requests |
| Admin Dashboard | Completo | Metricas reais do banco |
| Admin Kanban de Demandas | Completo | Drag-and-drop funcionando |
| Admin CRUD Experiencias | Completo | Criar, editar, excluir |
| Admin CMS Editor | Completo | Editar paginas institucionais |
| Dados de Exemplo no Banco | Completo | 5 experiencias, 3 demandas, 1 agencia |

### O Que Esta Faltando

| Componente | Prioridade | Fase |
|------------|------------|------|
| Pagina de Detalhe da Experiencia | Alta | 2 |
| Botao "Ver Detalhes" nas listagens (link funcional) | Alta | 2 |
| Admin Gestao de Clientes | Media | 2 |
| Admin Gestao de Equipe | Media | 2 |
| Admin Gestao de Parceiros (aprovacao) | Media | 2 |
| Portal do Parceiro | Alta | 3 |
| Area do Cliente | Media | 4 |
| Upload de Imagens (Storage) | Media | 2 |
| Notificacoes/Mensagens | Baixa | 4 |

---

## O Que Cada Pagina Faz (Guia de Funcionalidades)

### Site Publico

| Pagina | Rota | Funcionalidade |
|--------|------|----------------|
| Home | `/` | Hero + Experiencias em destaque + CTA viagem personalizada + Depoimentos |
| Experiencias | `/experiencias` | Listagem de todas as experiencias publicadas com filtros e busca |
| Excursoes | `/excursoes` | Listagem filtrada por tipo "excursion" |
| Pacotes | `/pacotes` | Listagem filtrada por tipo "package" |
| Detalhe Experiencia | `/experiencias/:id` | **FALTA** - Ver detalhes, itinerario, inclusoes, reservar |
| Viagem Personalizada | `/viagem-personalizada` | Formulario para solicitar viagem sob medida |
| Seja Parceiro | `/seja-parceiro` | Explicacao do modelo + formulario de cadastro de agencias |
| Sobre | `/sobre` | Historia e valores (conteudo via CMS) |
| FAQ | `/faq` | Perguntas frequentes (conteudo via CMS) |
| Contato | `/contato` | Formulario de contato + informacoes |
| Termos | `/termos` | Termos de uso (conteudo via CMS) |
| Privacidade | `/privacidade` | Politica de privacidade (conteudo via CMS) |
| Login | `/login` | Autenticacao + demo logins |
| Cadastro | `/cadastro` | Registro de novos usuarios |

### Painel Administrativo (Staff)

| Pagina | Rota | Funcionalidade |
|--------|------|----------------|
| Dashboard | `/admin` | Metricas gerais, acoes rapidas, ultimas demandas |
| Demandas | `/admin/demandas` | Kanban com pipeline de solicitacoes (drag-and-drop) |
| Experiencias | `/admin/experiencias` | CRUD completo de pacotes/excursoes |
| Clientes | `/admin/clientes` | **PLACEHOLDER** - Listar usuarios com role "client" |
| Parceiros | `/admin/parceiros` | **PLACEHOLDER** - Aprovar agencias, gerenciar parceiros |
| Equipe | `/admin/equipe` | **PLACEHOLDER** - Gerenciar consultores e gestores |
| CMS | `/admin/cms` | Listar paginas editaveis |
| CMS Editor | `/admin/cms/:slug` | Editar conteudo de uma pagina |
| Configuracoes | `/admin/configuracoes` | **PLACEHOLDER** - Configuracoes gerais |

---

## Plano de Implementacao (Ordem de Execucao)

### ETAPA 1: Pagina de Detalhe da Experiencia (Prioridade Alta)

Criar a pagina que mostra todos os detalhes de uma experiencia especifica.

**Arquivo:** `src/pages/ExperienciaDetalhe.tsx`

**Rota:** `/experiencias/:id`

**Funcionalidades:**
- Imagem de capa grande
- Titulo, destino, preco, duracao
- Descricao completa
- Itinerario dia-a-dia
- Lista de inclusoes e exclusoes
- Datas de saida disponiveis
- Botao "Reservar" ou "Solicitar Informacoes"
- Galeria de imagens
- Experiencias relacionadas

**Estrutura Visual:**
```text
+------------------------------------------+
|        [IMAGEM DE CAPA GRANDE]           |
|  Badge: Pacote | Excursao                |
+------------------------------------------+
|                                          |
|  TITULO DA EXPERIENCIA                   |
|  Destino | 5 dias | Ate 12 pessoas       |
|                                          |
|  A partir de R$ 8.500,00                 |
|  [BOTAO: SOLICITAR RESERVA]              |
|                                          |
+------------------------------------------+
|                                          |
|  [TAB: Descricao | Itinerario | Inclui]  |
|                                          |
|  Descricao completa da experiencia...    |
|                                          |
+------------------------------------------+
|                                          |
|  ITINERARIO                              |
|  Dia 1: Chegada - Descricao...           |
|  Dia 2: Passeios - Descricao...          |
|  ...                                     |
|                                          |
+------------------------------------------+
|                                          |
|  O QUE INCLUI        O QUE NAO INCLUI    |
|  - Hospedagem        - Passagem aerea    |
|  - Cafe da manha     - Refeicoes extras  |
|  - Guia local        - Seguro viagem     |
|                                          |
+------------------------------------------+
|                                          |
|  EXPERIENCIAS RELACIONADAS               |
|  [Card] [Card] [Card]                    |
|                                          |
+------------------------------------------+
```

### ETAPA 2: Corrigir Links nas Listagens

Atualizar os botoes "Ver Detalhes" em:
- `src/pages/Excursoes.tsx`
- `src/pages/Pacotes.tsx`

Para que apontem corretamente para `/experiencias/:id`

### ETAPA 3: Admin - Gestao de Clientes

**Arquivo:** `src/pages/admin/AdminClientes.tsx`

**Funcionalidades:**
- Listar todos os usuarios com role "client"
- Buscar por nome/email
- Ver perfil do cliente
- Historico de solicitacoes do cliente
- Exportar lista (futuro)

### ETAPA 4: Admin - Gestao de Parceiros

**Arquivo:** `src/pages/admin/AdminParceiros.tsx`

**Funcionalidades:**
- Listar agencias parceiras (ativas e pendentes)
- Aprovar/rejeitar solicitacoes de parceria
- Editar dados da agencia
- Ver demandas atribuidas a agencia
- Ativar/desativar parceiro

### ETAPA 5: Admin - Gestao de Equipe

**Arquivo:** `src/pages/admin/AdminEquipe.tsx`

**Funcionalidades:**
- Listar consultores e gestores
- Atribuir roles (promover/rebaixar)
- Ver demandas atribuidas ao consultor
- Metricas de desempenho (futuro)

---

## Secao Tecnica

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/ExperienciaDetalhe.tsx` | Pagina de detalhe da experiencia |
| `src/components/experience/ExperienceGallery.tsx` | Galeria de imagens |
| `src/components/experience/ExperienceItinerary.tsx` | Componente de itinerario |
| `src/components/experience/ExperienceInclusions.tsx` | Lista de inclusoes/exclusoes |
| `src/components/experience/BookingForm.tsx` | Modal/form de reserva |

### Arquivos a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `src/App.tsx` | Adicionar rota `/experiencias/:id` |
| `src/pages/Excursoes.tsx` | Link do botao para detalhe |
| `src/pages/Pacotes.tsx` | Link do botao para detalhe |
| `src/pages/admin/AdminClientes.tsx` | Implementar listagem |
| `src/pages/admin/AdminParceiros.tsx` | Implementar gestao |
| `src/pages/admin/AdminEquipe.tsx` | Implementar gestao |

### Estrutura da Pagina de Detalhe

```typescript
// src/pages/ExperienciaDetalhe.tsx
interface ExperienceDetailProps {
  id: string;
}

// Dados carregados do banco
const experience = {
  id: string;
  title: string;
  destination: string;
  description: string;
  short_description: string;
  price: number;
  duration_days: number;
  max_participants: number;
  cover_image: string;
  images: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: Array<{
    day: number;
    title: string;
    description: string;
  }>;
  departure_dates: Array<{
    date: string;
    available_spots: number;
  }>;
  experience_type: 'package' | 'excursion';
  is_featured: boolean;
};
```

### Query para Carregar Experiencia

```typescript
const { data: experience, isLoading } = useQuery({
  queryKey: ['experience', id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('experiences')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single();
    
    if (error) throw error;
    return data;
  },
});
```

### Modal de Reserva

O botao "Solicitar Reserva" abrira um modal que:
1. Coleta nome, email, telefone
2. Permite selecionar data de saida (se houver)
3. Informa numero de viajantes
4. Cria um registro em `travel_requests` vinculado a `experience_id`

```typescript
const handleBooking = async (formData) => {
  await supabase.from('travel_requests').insert({
    client_name: formData.name,
    client_email: formData.email,
    client_phone: formData.phone,
    client_id: user?.id || null,
    destination: experience.destination,
    travel_dates: { start: formData.date },
    travelers_count: formData.travelers,
    preferences: { experience_id: experience.id },
    status: 'pending',
  });
};
```

---

## Fluxo Completo da Plataforma

```text
CLIENTE                     GUATA                       PARCEIRO
   |                          |                            |
   |-- Acessa site ---------->|                            |
   |                          |                            |
   |-- Ve experiencia ------->|                            |
   |                          |                            |
   |-- Solicita reserva ----->|                            |
   |                          |                            |
   |                          |-- Demanda no Kanban        |
   |                          |   (status: pendente)       |
   |                          |                            |
   |                          |-- Consultor analisa        |
   |                          |   (status: em_analise)     |
   |                          |                            |
   |                          |-- Atribui a parceiro ----->|
   |                          |                            |
   |                          |                            |-- Recebe demanda
   |                          |                            |
   |                          |                            |-- Elabora proposta
   |                          |                            |
   |                          |<-- Proposta enviada -------|
   |                          |   (status: proposta_enviada)
   |                          |                            |
   |<-- Recebe proposta ------|                            |
   |                          |                            |
   |-- Aprova --------------->|                            |
   |                          |   (status: aprovada)       |
   |                          |                            |
   |                          |-- Viagem em operacao ----->|
   |                          |   (status: em_operacao)    |
   |                          |                            |
   |<-- Viagem realizada -----|<---------------------------|
   |                          |   (status: concluida)      |
   |                          |                            |
```

---

## Resultado Apos Implementacao

1. Cliente pode clicar em qualquer experiencia e ver todos os detalhes
2. Cliente pode solicitar reserva diretamente da pagina de detalhe
3. Admin pode gerenciar clientes, ver historico de cada um
4. Admin pode aprovar agencias parceiras que se cadastraram
5. Admin pode gerenciar a equipe interna (consultores/gestores)
6. Fluxo completo de demanda funcional do inicio ao fim

---

## Ordem de Execucao Recomendada

1. Pagina de Detalhe da Experiencia (mais critico para UX)
2. Corrigir links dos botoes nas listagens
3. Admin Gestao de Parceiros (para aprovar agencias)
4. Admin Gestao de Clientes
5. Admin Gestao de Equipe

