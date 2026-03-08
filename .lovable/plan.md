

# Plano: Fluxo de Proposta para Clientes Externos + IA Planejadora Visivel

## Respondendo suas duvidas

### 1. "Como a proposta sera enviada se a pessoa nao tem login?"

**Hoje:** quando alguem preenche o formulario de viagem personalizada SEM estar logado, a demanda e criada com `client_id = null`. A proposta fica salva no sistema, mas **o cliente nao tem como acessar** porque nao tem conta.

**O que falta:** um mecanismo para enviar a proposta ao cliente externo. Opcoes:
- **Link publico da proposta** (similar ao link do roteiro que ja existe) - o admin copia e envia por WhatsApp/email/Instagram
- Quando o cliente clica no link, ve a proposta com botoes de pagamento, SEM precisar de login

### 2. "Cade a IA planejadora?"

O componente existe, mas so aparece apos uma proposta ser **aprovada**. O problema e que:
- Para clientes sem login, nao ha como aprovar
- Mesmo para clientes logados, o botao fica escondido dentro da viagem

**Proposta:** A IA planejadora deveria ser acessivel para o **admin/consultor** direto no Kanban, independente de aprovacao. Assim voce pode usar a IA para planejar o roteiro antes mesmo de enviar a proposta.

### 3. "Como lidar com clientes que vieram do Facebook/Instagram?"

O admin cadastra a demanda manualmente no Kanban (ou recebe pelo formulario), cria a proposta, gera o roteiro com IA, e **envia o link publico** por WhatsApp/DM. O cliente nao precisa de login para ver.

---

## O que vou implementar

### A. Link publico da proposta (para clientes sem login)
- Reutilizar o `share_token` que ja existe na tabela `proposals`
- Criar uma pagina publica `/proposta/:token` que mostra:
  - Titulo, descricao, inclusoes, preco
  - Botoes de pagamento (PIX/Cartao)
  - Link para o roteiro (se existir)
- O admin clica "Compartilhar Proposta" e copia o link para enviar ao cliente

### B. IA planejadora acessivel antes da aprovacao
- Remover a restricao que exige `is_approved = true` no `ItineraryPlanner.tsx`
- Permitir que admin/consultor acesse o roteiro assim que criar a proposta (qualquer status)
- Adicionar botao "Planejar Roteiro com IA" direto na tela de criacao de proposta (`AdminProposta.tsx`)

### C. Cadastro manual de demanda pelo admin
- Adicionar botao "Nova Demanda" no Kanban para o admin registrar clientes que vieram de fora do site (Facebook, Instagram, indicacao)
- Formulario simples: nome, email/telefone, destino, datas, orcamento

---

## Alteracoes tecnicas

### Arquivo a criar:
- `src/pages/PropostaPublica.tsx` - pagina publica da proposta (sem login)

### Arquivos a modificar:
- `App.tsx` - adicionar rota `/proposta/:token`
- `AdminProposta.tsx` - botao "Compartilhar Proposta" + botao "Planejar Roteiro" sempre visivel
- `ItineraryPlanner.tsx` - remover filtro `is_approved = true`, buscar qualquer proposta da demanda
- `KanbanBoard.tsx` - botao "Nova Demanda" para cadastro manual
- `PropostaPublica.tsx` (novo) - visualizacao publica da proposta + links de pagamento

### Nenhuma migration necessaria
O `share_token` ja existe na tabela `proposals`. A proposta publica usa a mesma RLS policy "Anyone can view shared proposals".

### Ordem:
1. Criar pagina publica da proposta
2. Botao de compartilhar na tela do admin
3. Liberar IA planejadora antes da aprovacao
4. Formulario de nova demanda manual no Kanban

