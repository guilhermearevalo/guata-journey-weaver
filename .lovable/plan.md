

# Explicacao Completa da Plataforma Guata + Gaps Identificados

## Como Funciona Hoje (Resumo do Fluxo)

```text
CLIENTE solicita viagem → DEMANDA criada (Kanban)
       ↓
ADMIN/CONSULTOR analisa → atribui a uma AGENCIA PARCEIRA
       ↓
PARCEIRO cria PROPOSTA (preço, inclusões, links de pagamento)
       ↓
CLIENTE aprova proposta → vê botões de pagamento + acessa ROTEIRO COM IA
       ↓
PARCEIRO/CONSULTOR marca pagamento como "pago"
       ↓
Demanda avança no Kanban: Em Operação → Concluída
```

---

## Diferenca entre os Roles (O que CADA UM faz)

### ADMIN (voce, dono da Guata)
- Ve TUDO: dashboard com metricas, todas as demandas no Kanban, todos os clientes
- Gerencia agencias parceiras (cadastra, ativa, desativa)
- Gerencia equipe interna (adiciona consultores, gestores)
- Configura o site (imagem do hero, CMS, paginas)
- Pode criar/editar experiencias no catalogo
- Atribui demandas a agencias parceiras
- Acessa roteiro de qualquer viagem

### CONSULTOR (funcionario da Guata)
- Mesmo acesso do admin EXCETO: nao gerencia equipe
- Analisa demandas, atribui a parceiros
- Acompanha propostas e pagamentos
- Conversa com clientes por mensagens

### PARCEIRO (agencia externa que voce contrata para operar a viagem)
- Ve APENAS as demandas atribuidas a sua agencia
- NAO ve dados de contato direto do cliente (telefone/email ficam protegidos - **POREM: isso ainda nao esta implementado no codigo, o parceiro ve tudo**)
- Cria propostas com preco, itinerario, links de pagamento
- Marca status do pagamento
- Acessa roteiro da viagem

### CLIENTE (viajante)
- Ve suas proprias viagens e propostas
- Aprova/rejeita propostas
- Acessa links de pagamento (PIX/Cartao)
- Planeja roteiro com IA
- Envia mensagens ao consultor

---

## Onde esta cada funcionalidade

| Funcionalidade | Rota | Status |
|---|---|---|
| Upload imagem hero | `/admin/configuracoes` | Implementado (com bug no JSON.stringify) |
| Links de pagamento | `/partner/proposta/:id` (criar) + `/minha-conta/viagem/:id` (ver) | Implementado |
| Planejador de roteiro IA | `/minha-conta/viagem/:id/roteiro` + `/admin/demandas/:id/roteiro` + `/partner/proposta/:id/roteiro` | Implementado |
| Status de pagamento | `/partner/proposta/:id` (alterar) + `/minha-conta/viagem/:id` (ver badge) | Implementado |

---

## GAPS E DEFICIENCIAS IDENTIFICADOS

### 1. Nao da para saber QUAL agencia vendeu o que
**Problema:** O dashboard do admin mostra total de demandas, mas nao mostra:
- Quantas vendas cada agencia fez
- Valor total vendido por agencia
- Comissao devida a cada agencia
- Relatorio financeiro

**Solucao proposta:** Criar uma tela de **Relatorio por Agencia** no admin com:
- Filtro por agencia e periodo
- Total de demandas atribuidas/concluidas por agencia
- Valor total das propostas aprovadas
- Calculo automatico da comissao (ja existe `commission_rate` na tabela `partner_agencies`)

### 2. Falta controle financeiro centralizado
**Problema:** Nao existe um painel financeiro. O admin nao consegue ver:
- Total de receita do mes
- Pagamentos pendentes vs pagos
- Quais clientes devem
- Historico de pagamentos

**Solucao proposta:** Dashboard financeiro com cards de resumo e lista de propostas com status de pagamento.

### 3. Parceiro ve dados do cliente que nao deveria
**Problema:** A RLS permite que o parceiro veja `client_name`, `client_email`, `client_phone` da demanda. O conceito original era que a Guata intermediaria a comunicacao.

**Solucao proposta:** Ocultar email/telefone do cliente na interface do parceiro (pode ser feito no front-end ou com uma view restrita).

### 4. Nao existe sistema de notificacoes
**Problema:** Ninguem e avisado quando:
- Uma nova demanda chega
- Uma proposta e enviada
- Um pagamento muda de status
- O roteiro e atualizado

### 5. Falta historico de acoes / log de auditoria
**Problema:** Nao da para saber quem mudou o status de uma demanda, quem editou uma proposta, etc.

### 6. O Kanban nao tem filtro por agencia
**Problema:** O admin ve todas as demandas misturadas. Nao filtra por agencia atribuida, consultor responsavel, ou periodo.

### 7. Falta tela de criacao de proposta pelo admin/consultor
**Problema:** So o parceiro pode criar propostas hoje. O admin/consultor deveria tambem poder criar propostas diretamente (para viagens que a Guata opera sem parceiro).

---

## Plano de Implementacao (Priorizado)

### Fase 1 - Correcoes urgentes
1. **Corrigir bug do upload do hero** (JSON.stringify duplo)
2. **Implementar carrossel de multiplas imagens/video** no hero

### Fase 2 - Controle financeiro e visibilidade
3. **Relatorio por agencia** - tela no admin mostrando vendas, valores e comissoes por agencia
4. **Dashboard financeiro** - resumo de pagamentos pendentes/pagos, receita por periodo
5. **Filtros no Kanban** - por agencia, consultor, periodo, status de pagamento

### Fase 3 - Seguranca e governanca
6. **Ocultar dados do cliente** para parceiros na interface
7. **Log de auditoria** basico (quem mudou o que, quando)

### Fase 4 - Experiencia
8. **Notificacoes** (email ou in-app) para eventos importantes
9. **Admin/consultor poder criar propostas** diretamente (sem parceiro)

Posso implementar na ordem acima, comecando pela correcao do hero + relatorio por agencia, que sao os mais criticos para voce ter controle da operacao. Quer que eu siga nessa ordem?

