
# Status do Projeto e Logins de Teste - Guatá Travel Experience

---

## O Que Entendo Sobre a Agência

A **Guatá Travel Experience** é um hub de curadoria turística que conecta:

1. **Viajantes** (clientes) que buscam experiências autênticas e personalizadas
2. **Equipe interna** (consultores, gestores, administradores) que gerencia atendimentos e curadoria
3. **Agências parceiras** que operam determinadas viagens sob coordenação da Guatá

O diferencial é o **atendimento humano qualificado** - não é apenas uma loja online de pacotes, mas um serviço de consultoria que entende as necessidades do cliente e monta roteiros personalizados.

### Fluxo Principal:
```text
Cliente solicita viagem → Equipe analisa → Cria proposta (ou encaminha a parceiro) → Cliente aprova → Operação → Conclusão
```

---

## O Que Já Foi Implementado

### Site Público
| Componente | Status | Descrição |
|------------|--------|-----------|
| Página inicial | Concluído | Hero, experiências em destaque, CTA |
| Catálogo de experiências | Concluído | Conectado ao banco, filtros por tipo |
| Páginas institucionais | Concluído | Sobre, FAQ, Termos, Privacidade, Contato |
| Formulário de viagem personalizada | Concluído | Envia dados para o banco |
| Login e Cadastro | Concluído | Supabase Auth funcionando |

### CMS Interno (Fase 1)
| Componente | Status | Descrição |
|------------|--------|-----------|
| Tabela cms_pages | Concluído | Com RLS e dados iniciais |
| Hook useCmsPage | Concluído | Busca conteúdo dinâmico |
| Editor de páginas | Concluído | Edita FAQs, seções de texto, contato |
| Páginas dinâmicas | Concluído | Sobre, FAQ, Termos etc. buscam do banco |

### Banco de Dados
| Tabela | Status | Descrição |
|--------|--------|-----------|
| profiles | Criada | Perfis de usuário |
| user_roles | Criada | Controle de permissões (vazia no momento) |
| experiences | Criada | Catálogo de viagens (vazia) |
| travel_requests | Criada | Solicitações de viagem (vazia) |
| proposals | Criada | Propostas comerciais |
| bookings | Criada | Reservas |
| messages | Criada | Comunicação interna |
| partner_agencies | Criada | Agências parceiras |
| partner_users | Criada | Vínculo parceiro-usuário |
| cms_pages | Criada | Conteúdo das páginas (5 registros) |

### Sistema de Permissões
| Componente | Status |
|------------|--------|
| Funções RLS (has_role, is_staff) | Implementado |
| Hook useUserRole | Implementado |
| Componente ProtectedRoute | Implementado |
| AdminLayout com proteção | Implementado |

---

## O Que Falta Implementar

### Fase 2: Dashboard Administrativo (Próximo)
- Kanban para gestão de demandas
- CRUD completo de experiências
- Gestão de clientes
- Gestão de parceiros
- Gestão de equipe (admins)
- Métricas e gráficos

### Fase 3: Portal de Parceiros
- Dashboard limitado para agências
- Visualização de demandas atribuídas
- Envio de propostas
- Upload de documentos

### Fase 4: Área do Cliente
- Minha conta
- Acompanhamento de solicitações
- Histórico de viagens
- Mensagens com a equipe

---

## Plano: Criar Login de Teste

Para você testar o sistema agora, preciso fazer o seguinte:

### Passo 1: Criar Usuário de Teste no Banco

Você precisa primeiro criar uma conta pelo site (página `/cadastro`), e depois eu vou:
1. Buscar o ID do seu usuário na tabela `profiles`
2. Inserir um registro na tabela `user_roles` com role `admin`

**OU** posso criar um sistema de "login de demonstração" com botões rápidos.

### Passo 2: Implementar Botões de Login de Demonstração

Adicionar na página de Login botões para entrar rapidamente como diferentes perfis:

```text
┌─────────────────────────────────────┐
│         Login de Demonstração       │
├─────────────────────────────────────┤
│  [Entrar como Admin]                │
│  [Entrar como Consultor]            │
│  [Entrar como Parceiro]             │
│  [Entrar como Cliente]              │
└─────────────────────────────────────┘
```

Cada botão faz login com credenciais pré-definidas (usuários de teste que serão criados no banco).

---

## Alterações Necessárias

### 1. Criar Usuários de Teste no Banco

Executar migration SQL para criar usuários de demonstração:

```sql
-- Usuário Admin de teste
-- Email: admin@guata.test / Senha: teste123

-- Usuário Consultor de teste  
-- Email: consultor@guata.test / Senha: teste123

-- Usuário Parceiro de teste
-- Email: parceiro@guata.test / Senha: teste123

-- Usuário Cliente de teste
-- Email: cliente@guata.test / Senha: teste123
```

### 2. Atualizar Página de Login

Arquivo: `src/pages/Login.tsx`

Adicionar seção de "Login Rápido para Demonstração" com 4 botões que preenchem automaticamente email e senha e submetem o formulário.

### 3. Dados de Exemplo (Opcional mas Recomendado)

Para você ver o sistema funcionando de verdade, adicionar:
- 3-5 experiências de exemplo
- 2-3 solicitações de viagem de teste
- 1 agência parceira

---

## Resumo dos Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar usuários de teste com roles |
| `src/pages/Login.tsx` | Adicionar botões de login rápido |
| Migration SQL (opcional) | Dados de exemplo |

---

## Seção Técnica

### Criação de Usuários via SQL

Não é possível criar usuários diretamente via SQL no Supabase Auth. A alternativa é:

**Opção A - Manual (Mais Simples):**
1. Você cria 4 contas pelo site com emails de teste
2. Eu adiciono os roles correspondentes no banco

**Opção B - Automática (Login de Teste):**
1. Implementar botões que fazem login com credenciais fixas
2. Você cria as 4 contas uma vez pelo cadastro
3. Os botões apenas preenchem e submetem

### Estrutura do Botão de Login Rápido

```tsx
const demoAccounts = [
  { label: 'Admin', email: 'admin@guata.test', role: 'admin' },
  { label: 'Consultor', email: 'consultor@guata.test', role: 'consultant' },
  { label: 'Parceiro', email: 'parceiro@guata.test', role: 'partner' },
  { label: 'Cliente', email: 'cliente@guata.test', role: 'client' },
];

// Cada botão preenche o formulário e submete
const handleDemoLogin = (account) => {
  setEmail(account.email);
  setPassword('teste123');
  // Submit form
};
```

### Configuração de Auto-confirm

Para os logins de teste funcionarem sem confirmação de email, o Supabase precisa ter auto-confirm habilitado (já está configurado neste projeto).

---

## Próxima Ação Recomendada

1. **Primeiro:** Você cria uma conta no site com seu email real
2. **Depois:** Eu adiciono o role `admin` para esse usuário
3. **Resultado:** Você acessa `/admin` com sua conta

**OU**

1. Eu implemento os botões de demo + você cria 4 contas de teste
2. Você pode testar todos os perfis rapidamente

Qual opção você prefere?
