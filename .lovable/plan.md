

# Plano de Desenvolvimento - Próximas Fases
## Guatá Travel Experience - Hub de Curadoria Turística

---

## Estado Atual do Projeto

### O que já está pronto:
- Site público com páginas institucionais (Sobre, FAQ, Termos, Privacidade, Contato)
- Catálogo de experiências conectado ao banco de dados
- Formulário de viagem personalizada funcionando
- Sistema de autenticação (Login/Cadastro)
- Banco de dados completo com RLS

### O que falta implementar:
- CMS interno para editar conteúdo das páginas
- Dashboard administrativo completo
- Portal de parceiros
- Área do cliente

---

## Fase 1: CMS Interno (Edição de Conteúdo)

Criar um sistema de gerenciamento de conteúdo para que você possa editar todas as páginas sem mexer em código.

### Nova tabela: `cms_pages`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| slug | TEXT | URL da página (ex: "faq", "sobre") |
| title | TEXT | Título da página |
| content | JSONB | Conteúdo estruturado da página |
| meta_description | TEXT | Descrição para SEO |
| status | ENUM | draft, published, hidden |
| author_id | UUID | Quem criou/editou |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última modificação |

### Estrutura do conteúdo (JSONB)

Para FAQ:
```json
{
  "hero": {
    "title": "Perguntas Frequentes",
    "subtitle": "Tire suas dúvidas..."
  },
  "items": [
    { "question": "Como funciona?", "answer": "..." }
  ]
}
```

Para páginas de texto (Sobre, Termos, Privacidade):
```json
{
  "hero": {
    "title": "Sobre a Guatá",
    "subtitle": "..."
  },
  "sections": [
    { "title": "Nossa História", "content": "..." }
  ]
}
```

### Componentes de edição no Dashboard Admin

- Editor de texto rico para parágrafos
- Adicionar/remover/reordenar seções
- Gerenciar itens de FAQ (perguntas e respostas)
- Preview antes de publicar
- Histórico de alterações

---

## Fase 2: Dashboard Administrativo

O coração da operação Guatá, acessível apenas para Consultores, Gestores e Admins.

### Estrutura de Rotas

```text
/admin                     → Visão geral (métricas)
/admin/demandas            → Pipeline de demandas (Kanban)
/admin/demandas/:id        → Detalhes de uma demanda
/admin/experiencias        → Gestão de pacotes/excursões
/admin/experiencias/nova   → Criar experiência
/admin/experiencias/:id    → Editar experiência
/admin/clientes            → Lista de clientes
/admin/clientes/:id        → Perfil do cliente
/admin/parceiros           → Gestão de agências parceiras
/admin/equipe              → Gestão de consultores (só admin)
/admin/cms                 → Edição de páginas do site
/admin/configuracoes       → Configurações gerais
```

### Componentes Principais

1. **Sidebar com menu lateral**
   - Logo Guatá
   - Navegação por seções
   - Indicador de notificações

2. **Dashboard Home**
   - Cards de métricas (demandas pendentes, conversões, faturamento)
   - Gráficos de performance
   - Tarefas urgentes

3. **Pipeline de Demandas (Kanban)**
   - Colunas: Pendente → Em Análise → Proposta Enviada → Aprovado → Em Operação → Concluído
   - Drag and drop para mover cards
   - Filtros por consultor, período, status
   - Busca por cliente

4. **Detalhes da Demanda**
   - Informações do cliente
   - Timeline de interações
   - Anexar arquivos
   - Criar proposta
   - Atribuir a consultor ou parceiro
   - Notas internas

5. **Gestão de Experiências**
   - Listagem com filtros (tipo, status, operador)
   - CRUD completo
   - Upload de imagens (galeria)
   - Editor de itinerário
   - Definir operador, comissão, status

6. **CMS de Páginas**
   - Lista de páginas editáveis
   - Editor visual para cada tipo de página
   - Preview e publicação

---

## Fase 3: Portal de Parceiros

Dashboard limitado para agências parceiras.

### Estrutura de Rotas

```text
/parceiro                  → Dashboard do parceiro
/parceiro/demandas         → Demandas atribuídas
/parceiro/demandas/:id     → Detalhes e envio de proposta
/parceiro/propostas        → Propostas enviadas
/parceiro/perfil           → Dados da agência
```

### Funcionalidades

1. **Dashboard**
   - Quantidade de demandas pendentes
   - Propostas aprovadas
   - Métricas de performance

2. **Lista de Demandas Atribuídas**
   - Apenas demandas designadas pela Guatá
   - Sem acesso a dados de outros parceiros

3. **Detalhes e Proposta**
   - Briefing completo da viagem
   - Formulário para enviar proposta
   - Upload de documentos
   - Atualização de status

---

## Fase 4: Área do Cliente

Ambiente para clientes acompanharem suas viagens.

### Estrutura de Rotas

```text
/minha-conta               → Dashboard do cliente
/minha-conta/solicitacoes  → Minhas solicitações
/minha-conta/solicitacoes/:id → Detalhes e propostas
/minha-conta/viagens       → Histórico de viagens
/minha-conta/mensagens     → Chat com a equipe
/minha-conta/perfil        → Dados pessoais
```

### Funcionalidades

1. **Dashboard do Cliente**
   - Status das solicitações ativas
   - Próximas viagens
   - Documentos para download

2. **Acompanhamento de Solicitações**
   - Timeline visual do processo
   - Propostas recebidas
   - Aceitar/Recusar proposta

3. **Mensagens**
   - Chat simples com a equipe
   - Histórico de conversas

---

## Níveis de Acesso (RLS já implementado)

| Perfil | Acesso |
|--------|--------|
| Cliente | Próprios dados, solicitações e mensagens |
| Consultor | Atendimentos atribuídos, todas experiências |
| Gestor | Tudo exceto configurações de equipe |
| Admin | Acesso total, incluindo gestão de roles |
| Parceiro | Apenas demandas atribuídas à sua agência |

---

## Ordem de Implementação Sugerida

### Próximo Passo Imediato (Fase 1 - CMS)
1. Criar tabela `cms_pages` no banco de dados
2. Migrar conteúdo atual (FAQ, Sobre, Termos, Privacidade) para o banco
3. Adaptar componentes de página para buscar dados do banco
4. Criar tela de edição no dashboard admin

### Depois (Fases 2-4)
1. Dashboard admin com métricas e Kanban
2. Gestão de experiências
3. Portal de parceiros
4. Área do cliente

---

## Seção Técnica

### Nova Migration para CMS

```sql
-- Enum para status de página
CREATE TYPE public.page_status AS ENUM ('draft', 'published', 'hidden');

-- Tabela de páginas CMS
CREATE TABLE public.cms_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    meta_description TEXT,
    status page_status DEFAULT 'draft',
    author_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Público lê páginas publicadas, Staff gerencia
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published pages"
ON public.cms_pages FOR SELECT
TO anon, authenticated
USING (status = 'published');

CREATE POLICY "Staff can manage pages"
ON public.cms_pages FOR ALL
TO authenticated
USING (public.is_staff(auth.uid()));
```

### Estrutura de Componentes Admin

```text
src/
  components/
    admin/
      AdminSidebar.tsx
      AdminHeader.tsx
      DashboardMetrics.tsx
      KanbanBoard.tsx
      ExperienceForm.tsx
      CMSEditor.tsx
  pages/
    admin/
      AdminDashboard.tsx
      AdminDemandas.tsx
      AdminExperiencias.tsx
      AdminCMS.tsx
      ...
```

### Proteção de Rotas

Criar componente `ProtectedRoute` que verifica:
- Se usuário está logado
- Se tem o role necessário
- Redireciona para login ou página de erro se não tiver acesso

---

## Resumo dos Entregáveis por Fase

| Fase | Entregáveis |
|------|-------------|
| 1 - CMS | Tabela cms_pages, editor de páginas, FAQ/Sobre/Termos editáveis |
| 2 - Admin | Dashboard completo, Kanban, gestão de experiências, CMS integrado |
| 3 - Parceiros | Portal com demandas, envio de propostas, documentos |
| 4 - Cliente | Minha conta, acompanhamento, mensagens, histórico |

