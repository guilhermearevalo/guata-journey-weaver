# Plano: roteiro mais impactante, link corrigido, admin mais legível e PDF em Política/Termos

## 1. Corrigir link do roteiro/proposta ("não encontrado")

**Causa raiz:** a página pública (`RoteiroPublico` e `PropostaPublica`) busca a proposta com um join obrigatório à tabela `travel_requests` (`travel_requests!inner(...)`). A proposta tem permissão de leitura pública (via `share_token`), mas a `travel_requests` **não** tem nenhuma regra que permita visitante anônimo ler. Resultado: o join é bloqueado e a linha inteira some → "Roteiro não encontrado".

**Correção:** adicionar uma política de leitura na `travel_requests` que libere apenas as solicitações ligadas a uma proposta com link compartilhável ativo. Nada além disso fica exposto.

```text
Política nova (SELECT, anon + authenticated):
  permitir ler travel_requests quando existir uma proposal
  com mesmo request_id, share_token preenchido e share_enabled = true
```

## 2. Roteiro mais bonito e "com vida" + imagem por seção

### 2a. Imagem por seção (Bagagem, Seguro, Hospedagem, etc.)
- Ampliar o tipo `Dossier` (`src/lib/dossier.ts`) com campos de imagem por seção (ex.: `accommodation_image`, `transfer_image`, `documentation_image`, `baggage_image`, `insurance_image`, `exchange_image`, e imagem do bloco Aéreo).
- No `DossierEditor.tsx`: dentro de cada seção do acordeão, adicionar botão "Enviar imagem" (mesmo padrão do upload de capa, salvando no bucket público `site-assets`), com preview e botão de remover.
- Como já é JSONB, **não precisa de migração** para isso.

### 2b. Redesign visual do roteiro público (`RoteiroPublico.tsx`)
Transformar o layout atual (genérico) em um documento estilo "revista de viagem", usando os tokens da marca (Teal/Brown, Playfair/Inter):
- **Capa**: imagem maior com sobreposição em gradiente, título em Playfair, destino/datas/viajantes em destaque sobre a foto.
- **Timeline dos dias**: marcadores e linha em teal, cartões com mais respiro, foto da atividade com cantos arredondados e leve sombra, categorias com as cores já existentes.
- **Seções do dossiê**: cada seção (Aéreo, Hospedagem, Transfer, Documentações, Bagagem, Seguro, Câmbio) vira um bloco com faixa de título colorida + ícone + a imagem enviada exibida de forma elegante ao lado/acima do texto.
- Animações suaves de entrada (fade/slide já existentes no CSS).
- Mantém tudo opcional: seção sem conteúdo continua não aparecendo.

## 3. Cor do painel admin (mais legível)

Hoje a sidebar usa tons marrons escuros (`--sidebar-*`), o que dificulta a leitura. Vou trocar para um esquema claro e neutro com destaque em **teal** (a cor mais "navegável" da marca), mantendo o marrom como cor secundária pontual:
- Ajustar as variáveis `--sidebar-*` em `src/index.css` para fundo claro, texto escuro e item ativo em teal suave.
- Item ativo/hover com contraste claro, ícones e textos bem legíveis.
- Sem mudar a identidade do site público — só o ambiente administrativo.

## 4. Política de Privacidade e Termos com PDF embutido

Objetivo: o admin envia um PDF e ele aparece **embutido** na página, pronto para leitura ao abrir (sem precisar rolar/baixar).

- **Upload no CMS** (`AdminCMSEditor.tsx`): para as páginas `privacidade` e `termos`, adicionar um campo "PDF da página" (upload para bucket público `site-assets`), salvando a URL dentro do `content` (ex.: `content.pdf_url`).
- **Exibição** (`Privacidade.tsx` e `Termos.tsx`): se houver `pdf_url`, renderizar o PDF embutido (visualizador em tela cheia via `<object>`/`<iframe>`) logo no topo, já visível ao abrir. Se não houver PDF, mantém o conteúdo de texto atual (fallback).
- Como `content` é JSONB, **não precisa de migração**.

## Detalhes técnicos
- **Migração necessária:** apenas a política de RLS da `travel_requests` (item 1).
- **Storage:** reutiliza o bucket público existente `site-assets` para imagens de seção e PDFs.
- **Sem mudanças** em pagamentos, comissões ou fluxos existentes.
- Arquivos afetados: `src/lib/dossier.ts`, `src/components/itinerary/DossierEditor.tsx`, `src/pages/RoteiroPublico.tsx`, `src/index.css`, `src/pages/admin/AdminCMSEditor.tsx`, `src/pages/Privacidade.tsx`, `src/pages/Termos.tsx`, e uma migração de RLS.

## Observação
Para as imagens de exemplo (mala, seguro, etc.), você poderá enviá-las pelo editor de cada seção — assim cada agência usa as próprias fotos. Se preferir, posso também já incluir imagens ilustrativas padrão como ponto de partida.
