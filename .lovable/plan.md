

# Plano: 3 Novas Funcionalidades

## 1. Upload de Imagem do Hero (Admin)

Permitir que o admin troque a imagem de fundo da pagina inicial fazendo upload do computador.

**O que sera feito:**
- Criar um bucket de storage chamado `site-assets` para guardar imagens do site
- Adicionar uma secao em **Configuracoes do Admin** para trocar a imagem do hero
- O componente HeroSection vai buscar a imagem do banco (tabela `cms_pages` ou uma nova tabela `site_settings`) ao inves de usar URL fixa do Unsplash
- Upload com preview e botao de salvar

**Paginas afetadas:**
- `AdminConfiguracoes.tsx` - adicionar secao de upload do hero
- `HeroSection.tsx` - buscar imagem dinamica do banco
- Migration SQL para criar bucket e tabela `site_settings`

---

## 2. Link de Pagamento (PIX e Cartao)

Adicionar campos na proposta para que o consultor/admin possa inserir links de pagamento (PIX, cartao) que o cliente vera na area dele.

**O que sera feito:**
- Adicionar colunas `payment_links` (jsonb) na tabela `proposals` para guardar links de PIX e cartao
- No painel admin/parceiro, ao editar proposta, ter campos para colar o link do PIX e link de pagamento por cartao
- Na area do cliente (`ClienteViagem.tsx`), mostrar botoes "Pagar com PIX" e "Pagar com Cartao" que abrem os links em nova aba
- Icones visuais de QR code PIX e cartao de credito

**Paginas afetadas:**
- `PartnerProposta.tsx` - campos para links de pagamento
- `ClienteViagem.tsx` - botoes de pagamento visiveis ao cliente
- Migration SQL para adicionar coluna `payment_links`

---

## 3. Planejador de Roteiro com IA (Timeline)

Interface visual de timeline dia-a-dia onde a IA ajuda a montar o roteiro. NAO e um chatbot - e uma linha do tempo editavel.

**O que sera feito:**
- Nova pagina `/minha-conta/viagem/:id/roteiro` com interface de timeline
- Cada dia mostra atividades em cards na timeline vertical
- Botao "Sugerir com IA" que analisa destino, preferencias e dias e gera sugestoes de atividades
- O usuario pode editar, reordenar, adicionar e remover atividades de cada dia
- A IA pode sugerir alternativas para um dia especifico ("O que mais posso fazer nesse dia?")
- Os gastos estimados aparecem por dia e total
- Edge function `itinerary-ai` que usa Lovable AI para gerar sugestoes

**Componentes novos:**
- `ItineraryTimeline.tsx` - timeline visual com dias e atividades
- `ItineraryDayCard.tsx` - card de um dia com lista de atividades
- `ItineraryActivityCard.tsx` - card individual de atividade (editavel)
- `ClienteRoteiro.tsx` - pagina principal do planejador

**Como funciona a timeline:**
- Coluna vertical com cada dia representado como um no
- Cada dia expande para mostrar atividades (manha, tarde, noite)
- Cada atividade mostra: nome, descricao curta, gasto estimado, icone de categoria
- Botao "Pedir sugestao da IA" por dia ou para o roteiro inteiro
- A IA retorna sugestoes estruturadas que aparecem como cards "sugeridos" que o usuario aceita ou descarta

**Dados:**
- Coluna `itinerary` (jsonb) ja existe na tabela `proposals` - sera usada para salvar o roteiro
- Formato: `[{day: 1, activities: [{name, description, category, estimated_cost, time_slot}]}]`

---

## Detalhes Tecnicos

### Storage (Bucket)
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true);
-- RLS: staff pode fazer upload, qualquer um pode ver
```

### Tabela site_settings
```sql
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- Guardar hero_image_url, etc.
```

### Coluna payment_links em proposals
```sql
ALTER TABLE proposals ADD COLUMN payment_links JSONB DEFAULT '{}';
-- Formato: {"pix": "https://...", "card": "https://..."}
```

### Edge Function itinerary-ai
- Recebe: destino, numero de dias, preferencias, atividades ja adicionadas
- Retorna: sugestoes estruturadas via tool calling (Lovable AI)
- Modelo: `google/gemini-3-flash-preview`

### Ordem de implementacao
1. Storage bucket + upload do hero (mais simples, resultado visual imediato)
2. Links de pagamento nas propostas
3. Planejador de roteiro com IA (mais complexo)

