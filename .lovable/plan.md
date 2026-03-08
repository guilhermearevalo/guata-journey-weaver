

# Plano: Exportacao do Roteiro + Compartilhamento + Melhorias de Visibilidade

## Suas perguntas respondidas

### Como o roteiro aparece ao cliente?
Hoje o roteiro aparece APENAS dentro da plataforma, na rota `/minha-conta/viagem/:id/roteiro`. E uma timeline vertical interativa onde o cliente ve dia a dia as atividades. **Nao existe exportacao em PDF nem link compartilhavel.** Isso precisa ser adicionado.

### Pode compartilhar fora do site?
Hoje NAO. Vou adicionar:
1. **Exportar PDF** - botao que gera um PDF bonito do roteiro para imprimir ou enviar por WhatsApp/email
2. **Link publico compartilhavel** - uma URL publica (sem login) tipo `/roteiro/:token` que qualquer pessoa pode acessar para ver o roteiro

### Sobre a IA planejadora - onde esta?
O componente existe (`ItineraryPlanner.tsx`) e as rotas estao configuradas:
- Cliente: `/minha-conta/viagem/:id/roteiro`
- Admin: `/admin/demandas/:id/roteiro`
- Parceiro: `/partner/proposta/:id/roteiro`

**Porem**, o roteiro so aparece quando existe uma **proposta aprovada** para aquela demanda. Se voce nao ve, provavelmente:
- Nao criou uma proposta para a demanda, OU
- A proposta nao foi aprovada pelo cliente

O botao "Planejar Roteiro" aparece em `ClienteViagem.tsx` somente apos o cliente aprovar uma proposta.

### Sobre passar demanda para agencia parceira
Sim, o fluxo ja funciona assim:
1. Cliente solicita viagem personalizada
2. Demanda cai no Kanban do admin
3. Admin atribui a demanda a uma agencia parceira (`assigned_agency_id`)
4. Parceiro ve a demanda e cria a proposta
5. Cliente aprova e acessa roteiro/pagamento

---

## O que vou implementar

### 1. Exportar roteiro em PDF
- Botao "Exportar PDF" no `ItineraryPlanner.tsx`
- Gera um PDF formatado com: destino, datas, atividades por dia, custos estimados, logo da Guata
- Usa a biblioteca `jspdf` (precisa instalar) ou gera via impressao do navegador (`window.print()` com CSS de impressao)
- Disponivel para todos os roles (cliente, admin, parceiro)

### 2. Link publico compartilhavel
- Criar uma rota publica `/roteiro/:shareToken`
- Ao clicar "Compartilhar", gera um token unico salvo na proposta (`share_token` na tabela `proposals`)
- Qualquer pessoa com o link pode ver o roteiro (somente leitura, sem edicao, sem IA)
- Util para o cliente enviar para amigos/familia

### 3. Tornar o acesso ao roteiro mais visivel
- No Kanban (admin), adicionar icone/link direto para o roteiro quando a proposta esta aprovada
- No `RequestDetailDialog`, tornar o botao "Ver Roteiro" mais proeminente
- No painel do parceiro, adicionar botao de roteiro na lista de demandas

---

## Alteracoes tecnicas

### Migration SQL:
- Adicionar `share_token TEXT UNIQUE` na tabela `proposals`

### Arquivos a modificar:
- `ItineraryPlanner.tsx` - adicionar botoes "Exportar PDF" e "Compartilhar Link"
- `App.tsx` - adicionar rota publica `/roteiro/:token`

### Arquivo a criar:
- `src/pages/RoteiroPublico.tsx` - pagina publica de visualizacao do roteiro (somente leitura)

### RLS:
- Adicionar policy SELECT na `proposals` para acesso via `share_token` (sem autenticacao)

### Ordem:
1. Migration para `share_token`
2. Botao de exportar PDF (via `window.print()` com CSS dedicado, sem dependencia extra)
3. Gerar e copiar link compartilhavel
4. Pagina publica do roteiro
5. Melhorar visibilidade dos links de acesso ao roteiro nos paineis

