

# Plano: Centralizar tabs + Remover imagem de fundo + Melhorias no relatório

## 1. Centralizar tabs na página de experiência (`ExperienciaDetalhe.tsx`)
- Linha 170: trocar `justify-start` por `justify-center` no `TabsList`

## 2. Remover imagem de fundo que não combina (`ExperienciaDetalhe.tsx`)
- Verificar se há algum background aplicado no hero/container e simplificar
- Se a imagem de capa está renderizando como hero gigante sem qualidade, reduzir o aspect ratio ou ajustar

## 3. Adicionar campo "Link de pagamento manual" na proposta (`AdminProposta.tsx`)
- Novo campo de texto para colar link externo (PIX, PagSeguro, etc.)
- Salvar em `payment_links` (campo jsonb que já existe na tabela `proposals`)
- Exibir esse link na página pública da proposta (`PropostaPublica.tsx`) como alternativa ao Stripe

## 4. Incluir "Guatá (operação própria)" no relatório por agência (`AdminRelatorioAgencias.tsx`)
- Adicionar uma linha para propostas com `agency_id = null`
- Mostrar receita e demandas operadas diretamente pela Guatá

## Arquivos a editar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/ExperienciaDetalhe.tsx` | Centralizar tabs |
| `src/pages/admin/AdminProposta.tsx` | Campo link de pagamento manual |
| `src/pages/PropostaPublica.tsx` | Exibir link de pagamento manual |
| `src/pages/admin/AdminRelatorioAgencias.tsx` | Linha "Guatá" no relatório |

Migração SQL: nenhuma (usa campo `payment_links` jsonb existente).

