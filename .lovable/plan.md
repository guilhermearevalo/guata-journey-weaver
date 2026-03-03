
# Plano: 3 Novas Funcionalidades (IMPLEMENTADO)

## ✅ 1. Upload de Imagem do Hero (Admin)
- Bucket `site-assets` criado
- Tabela `site_settings` criada
- AdminConfiguracoes com upload funcional
- HeroSection busca imagem dinâmica do banco

## ✅ 2. Link de Pagamento (PIX e Cartão)
- Coluna `payment_links` (jsonb) adicionada em `proposals`
- PartnerProposta com campos para PIX e cartão
- ClienteViagem com botões de pagamento

## ✅ 3. Planejador de Roteiro com IA (Timeline)
- Edge function `itinerary-ai` usando Lovable AI (gemini-3-flash-preview)
- Página ClienteRoteiro com timeline visual dia a dia
- Sugestões por IA com aceitar/descartar
- Custos estimados por dia e total
- Rota: `/minha-conta/viagem/:id/roteiro`
