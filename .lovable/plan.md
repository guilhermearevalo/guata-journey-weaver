
# Diagnóstico Completo - Estado Atual do Projeto (Remix)

## Status Geral

O projeto está na **Fase 2 (parcialmente concluída)** do roadmap de desenvolvimento. As correções de triggers e roles foram aplicadas com sucesso, e o sistema de autenticação está funcional.

---

## Dados Atuais no Banco

| Tabela | Registros | Status |
|--------|-----------|--------|
| `profiles` | 3 | admin, consultor, parceiro demo |
| `user_roles` | 3 | Roles corretos atribuídos |
| `experiences` | 5 | Publicadas e visíveis |
| `travel_requests` | 3 | Em diferentes status (pending, in_analysis, proposal_sent) |
| `partner_agencies` | 1 | Cadastrada |
| `cms_pages` | 5 | Todas publicadas (sobre, faq, termos, privacidade, contato) |

---

## Funcionalidades Implementadas (OK)

### Sistema de Autenticação
- Login/Cadastro funcionando
- Trigger `on_auth_user_created` recriado no banco
- Roles atribuídos corretamente (admin, consultant, partner)
- Redirecionamento pós-login baseado em role

### Área Administrativa (/admin)
- Dashboard com estatísticas
- Kanban de demandas (drag-and-drop)
- Gestão de experiências (CRUD)
- Gestão de parceiros (aprovar/desativar)
- Gestão de clientes (listagem)
- Gestão de equipe (listagem)
- CMS para páginas institucionais

### Área Pública
- Home com experiências em destaque
- Catálogo de experiências com filtros
- Página de detalhe de experiência
- Páginas CMS (Sobre, FAQ, Termos, Privacidade, Contato)
- Formulário "Seja Parceiro"
- Formulário de viagem personalizada

### Segurança (RLS)
- Policies configuradas para todas as tabelas
- Isolamento de dados por role
- Funções `has_role()` e `is_staff()` funcionando

---

## Funcionalidades Pendentes (A Fazer)

### Fase 3 - Portal do Parceiro (Não Iniciada)
Páginas que NÃO EXISTEM e precisam ser criadas:
1. `/partner` - Dashboard do parceiro
2. `/partner/demandas` - Listagem de demandas atribuídas
3. `/partner/proposta/:id` - Criação/edição de propostas
4. `/partner/experiencias` - Experiências que o parceiro opera

### Fase 4 - Área do Cliente (Não Iniciada)
Páginas que NÃO EXISTEM e precisam ser criadas:
1. `/minha-conta` - Dashboard do cliente
2. `/minha-conta/viagens` - Listagem de viagens/solicitações
3. `/minha-conta/mensagens` - Comunicação com consultor
4. `/minha-conta/perfil` - Edição de dados pessoais

### Funcionalidades Técnicas Pendentes
1. **Upload de imagens** - Storage bucket não configurado
2. **Leaked password protection** - Desabilitado (warning do linter)
3. **Cliente demo** - O usuário `cliente@guata.test` não existe (apenas admin, consultor, parceiro)
4. **Associação agência-parceiro** - A tabela `partner_users` está vazia (parceiro não está vinculado a uma agência)

---

## Problemas Identificados que Precisam Correção

### 1. Usuário Cliente Demo Não Existe
O botão "Cliente" no login de demonstração tentará criar um usuário mas não terá associação correta.

### 2. Parceiro Sem Agência Vinculada
O usuário `parceiro@guata.test` existe com role `partner`, mas não está vinculado a nenhuma agência na tabela `partner_users`. Isso impedirá que ele veja demandas atribuídas.

### 3. Rotas Inexistentes
O código referencia `/partner` e `/minha-conta` mas essas páginas não existem, resultando em 404.

---

## Plano de Continuidade Recomendado

### Etapa 1: Correções Imediatas
1. Criar associação do parceiro demo com a agência existente
2. Verificar se usuário cliente demo funciona corretamente
3. Habilitar leaked password protection

### Etapa 2: Portal do Parceiro (Fase 3)
Criar estrutura de páginas:
```
src/pages/partner/
├── PartnerLayout.tsx (layout com sidebar)
├── PartnerDashboard.tsx (estatísticas e ações rápidas)
├── PartnerDemandas.tsx (listagem de demandas atribuídas)
├── PartnerProposta.tsx (criar/editar proposta)
└── PartnerExperiencias.tsx (experiências que opera)
```

### Etapa 3: Área do Cliente (Fase 4)
Criar estrutura de páginas:
```
src/pages/cliente/
├── ClienteLayout.tsx (layout com menu)
├── ClienteDashboard.tsx (minhas viagens)
├── ClienteViagem.tsx (detalhe de viagem)
├── ClienteMensagens.tsx (chat com consultor)
└── ClientePerfil.tsx (dados pessoais)
```

### Etapa 4: Upload de Imagens
1. Criar bucket `images` no storage
2. Configurar policies de upload/acesso
3. Implementar componente de upload
4. Integrar com formulário de experiências

---

## Resumo do Estado

| Fase | Nome | Status |
|------|------|--------|
| 1 | Infraestrutura/CMS | Concluída |
| 2 | Dashboards Admin | Concluída |
| 3 | Portal de Parceiros | Não Iniciada |
| 4 | Área do Cliente | Não Iniciada |
| 5 | Upload de Imagens | Não Iniciada |

---

## Próxima Ação Sugerida

Recomendo iniciar pela **Etapa 1 (Correções Imediatas)** para garantir que o ambiente de teste funcione corretamente, e depois prosseguir para a **Fase 3 (Portal do Parceiro)**.

Deseja que eu:
1. **Corrija os dados do parceiro** (vincular à agência existente)?
2. **Inicie a construção do Portal do Parceiro**?
3. **Comece pela Área do Cliente**?
4. **Implemente o sistema de upload de imagens**?
