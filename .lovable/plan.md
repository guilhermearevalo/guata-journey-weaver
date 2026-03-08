

# Plano: Edição Manual de Atividades + Checklist de Documentos

## O que falta hoje

1. **Não dá para adicionar uma atividade manualmente** — só via IA ("Sugerir mais") ou "Gerar Roteiro com IA". Não tem botão "Adicionar Atividade" para o agente digitar nome, descrição, horário, custo.
2. **Não dá para editar uma atividade existente** — se a IA sugeriu algo errado, a única opção é deletar e esperar outra sugestão.
3. **Não existe checklist de documentos** — o agente não pode listar documentos necessários (passaporte, visto, seguro viagem, etc.) nem o cliente pode marcar como "conferido".

---

## O que vou implementar

### A. Botão "Adicionar Atividade" manual em cada dia
- Botão `+` dentro de cada card de dia no `ItineraryPlanner.tsx`
- Abre um Dialog com formulário: nome, descrição, categoria (select), período (manhã/tarde/noite), custo estimado
- Salva direto no array de atividades daquele dia

### B. Edição inline de atividades existentes
- Botão de editar (ícone lápis) ao lado do botão de excluir em cada atividade
- Abre o mesmo Dialog preenchido com os dados atuais
- Permite alterar qualquer campo e salvar

### C. Checklist de Documentos da Viagem
- Adicionar um campo `documents_checklist` (jsonb) na tabela `proposals` via migration
- Estrutura: `[{ name: "Passaporte", checked: boolean, notes?: string }]`
- No `ItineraryPlanner.tsx`, adicionar uma seção "Documentos Necessários" abaixo do roteiro
- Admin/consultor/parceiro podem adicionar itens ao checklist (ex: "Passaporte válido", "Visto americano", "Seguro viagem")
- Cliente pode marcar/desmarcar os itens como conferidos (checkbox)
- Visível também no link público (`RoteiroPublico.tsx`) como lista somente leitura

---

## Alterações técnicas

### Migration SQL
```sql
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS documents_checklist jsonb DEFAULT '[]'::jsonb;
```

### Arquivo a criar
- `src/components/itinerary/ActivityFormDialog.tsx` — Dialog com form para adicionar/editar atividade
- `src/components/itinerary/DocumentsChecklist.tsx` — Seção de checklist de documentos

### Arquivos a modificar
- `ItineraryPlanner.tsx` — Adicionar botão "+" em cada dia, botão editar em cada atividade, incluir `ActivityFormDialog` e `DocumentsChecklist`
- `RoteiroPublico.tsx` — Mostrar a seção de documentos (somente leitura)

