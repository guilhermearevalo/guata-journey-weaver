## Objetivo

Hoje o roteiro do site é uma lista simples de atividades por dia. As imagens que você enviou mostram um **dossiê de viagem** — elegante, dividido em seções, com capa do destino, fotos e dicas. Vamos elevar o roteiro do site a esse nível, **sem obrigar reservas**.

## Recomendação de estrutura (respondendo suas dúvidas)

**Como ficar apresentável e fácil de entender para o cliente?**
O roteiro vira um documento com seções claras, na ordem das imagens, cada uma com ícone e título destacado:

```text
[ CAPA: nome do destino + datas + viajantes ]
   Roteiro dia a dia   (sempre presente)
   ── Dia 1 · título do dia
        foto + descrição + dicas (restaurantes, horários)
   ── Dia 2 ...
[ seções opcionais — só aparecem se preenchidas ]
   Aéreo (voo de ida / interno / volta)
   Hospedagem
   Transfer
   Documentações
   Bagagem
   Seguro viagem
   Comunicação e câmbio
```

**Reservas — qual a melhor opção?**
A melhor para o seu caso é **tudo opcional por seção**. Assim:
- Se o cliente quer **só o roteiro personalizado** (sem reservas), você preenche apenas o dia a dia → o roteiro fica completo e bonito, sem blocos vazios.
- Se o cliente **já fez (ou você fez) as reservas**, você preenche Aéreo/Hospedagem/Transfer → essas seções aparecem automaticamente.

Nada é obrigatório e nenhuma seção vazia aparece para o cliente. Isso resolve exatamente o cenário "talvez ele não queira reservas, mas se tiver eu coloco".

## O que será feito

### 1. Banco de dados
- Adicionar uma coluna `dossier` (JSONB) na tabela `proposals` para guardar as seções extras opcionais:
  - `flights` (voo de ida / interno / volta), `accommodation`, `transfer`, `documentation`, `baggage`, `insurance`, `exchange`, `cover_image`, `day_titles/day_notes`.
- O dia a dia continua no campo `itinerary` que já existe.

### 2. Planejador (admin / consultor / parceiro)
- No `ItineraryPlanner`, abas/accordion para preencher as seções opcionais (cada uma com um botão "Adicionar seção" e podendo remover).
- Cada dia ganha **título** (ex: "Dia 09/03 — Chegada em Roma") e fotos por **upload manual** (já implementado).
- A IA continua gerando o **dia a dia** (atividades, horários, descrições) — mantemos a função `itinerary-ai` atual.

### 3. Roteiro público (`RoteiroPublico.tsx`) — redesign elegante
- Capa com imagem do destino + nome em destaque (estilo das imagens "ROMA").
- Tipografia Playfair (títulos) + Inter (corpo), paleta Teal/Brown.
- Dia a dia com foto, título do dia, descrição e dicas bem espaçadas.
- Seções opcionais renderizadas só quando preenchidas, com cabeçalho de seção (ícone + faixa colorida).
- Mantém impressão/PDF e o botão liga/desliga do link que já existe.

### 4. IA
- Mantemos a IA atual via Lovable AI (sem custo de chave para você) para **gerar o dia a dia**, que foi o que você escolheu.
- Não vamos gerar imagens por IA agora — as fotos serão por upload manual, como você pediu.

## Fora do escopo (por enquanto)
- Geração automática de imagens das atrações por IA.
- Preenchimento automático de documentações/bagagem/seguro por IA.
- Integração de reservas com sistemas externos.

## Detalhes técnicos
- Migração: `ALTER TABLE proposals ADD COLUMN dossier jsonb DEFAULT '{}'::jsonb;` (sem novas RLS, herda as policies de `proposals`).
- Tipos da seção definidos no front (interface `Dossier`), salvos junto da proposta.
- Reuso do upload para `site-assets` já existente para capa e fotos das seções.
