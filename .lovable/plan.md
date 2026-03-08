

# Plano: Reordenacao de Atividades + Central de Ajuda (Passo a Passo)

## Respondendo suas perguntas

### "De onde vem as sugestoes da IA?"
A IA ja esta funcionando. Usa o **Lovable AI** (modelo Google Gemini) atraves de uma funcao backend (`itinerary-ai`). A chave de API (`LOVABLE_API_KEY`) ja esta configurada automaticamente. **Nao precisa de nenhuma API externa adicional.** Quando voce clica em "Gerar Roteiro com IA" ou "Sugerir mais", o sistema chama essa funcao que retorna atividades estruturadas.

### "Da para mudar a posicao das atividades?"
Hoje NAO. As atividades sao ordenadas automaticamente por periodo (manha > tarde > noite). Vou adicionar **drag-and-drop** para reordenar atividades dentro de cada dia e tambem mover entre dias.

### "Passo a passo para dono da agencia e parceiro?"
Otima ideia. Vou criar um modulo **"Central de Ajuda"** no menu lateral (admin e parceiro) com guias passo a passo interativos.

---

## O que vou implementar

### A. Reordenacao de atividades (drag-and-drop)
- Adicionar botoes de seta (cima/baixo) em cada atividade para reordenar dentro do dia
- Abordagem simples e confiavel sem biblioteca extra de drag-and-drop
- A ordem manual substitui a ordenacao automatica por periodo

### B. Central de Ajuda / Passo a Passo
- Nova pagina `/admin/ajuda` e `/partner/ajuda`
- Adicionar item "Ajuda" no menu lateral do admin e do parceiro (icone HelpCircle)
- Conteudo organizado em accordion/cards:
  - **Para o Admin:** Como criar demanda manual, como atribuir agencia parceira, como criar proposta, como usar o roteiro com IA, como compartilhar proposta/roteiro, como gerenciar documentos
  - **Para o Parceiro:** Como visualizar demandas, como criar proposta, como usar o planejador de roteiro, como compartilhar com o cliente

---

## Alteracoes tecnicas

### Arquivos a criar
- `src/pages/admin/AdminAjuda.tsx` — pagina de ajuda do admin
- `src/pages/partner/PartnerAjuda.tsx` — pagina de ajuda do parceiro

### Arquivos a modificar
- `ItineraryPlanner.tsx` — adicionar botoes de mover atividade (cima/baixo), remover ordenacao automatica por time_slot
- `AdminSidebar.tsx` — adicionar item "Ajuda" no menu
- `PartnerSidebar.tsx` — adicionar item "Ajuda" no menu
- `App.tsx` — adicionar rotas `/admin/ajuda` e `/partner/ajuda`

### Nenhuma migration necessaria

