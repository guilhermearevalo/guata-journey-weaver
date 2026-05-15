# Plano de ajustes

## 1. Upload de mídias em Viagens Realizadas

No formulário do admin (`AdminViagensRealizadas.tsx`), trocar os campos só-URL por uploads reais para o bucket `site-assets`:

- **Imagem de capa**: botão "Enviar imagem" (mantém URL como alternativa).
- **Galeria de fotos**: múltiplos uploads, miniaturas com remover/reordenar. Salvo na coluna `gallery` (já existe).
- **Vídeo curto**: upload único (MP4/WEBM, máx. 30MB). Nova coluna `video_url` em `completed_trips`.
- Na página pública `ViagensRealizadas.tsx`, ao clicar no card abrir um lightbox/modal mostrando galeria + vídeo + descrição completa.

## 2. Editor de Contato e Localização (só Guatá)

Criar dois cards novos em `AdminConfiguracoes.tsx` salvando em `site_settings`:

- **Contato Guatá** (key `contact_info`): endereço, telefone, WhatsApp, email, Instagram, Facebook, YouTube.
- **Localização no mapa** (key `agency_location`): endereço completo + latitude/longitude (campos de texto). Usaremos um iframe do Google Maps gerado a partir das coordenadas (sem API key).

Consumir esses settings em:
- `PublicFooter.tsx` (substitui os valores hardcoded de endereço, telefone, email, redes).
- `Contato.tsx` (mesmos dados + bloco do mapa via iframe).

## 3. Excursões: aérea ou rodoviária

- Adicionar campo `transport_type` em `experiences` quando `experience_type = 'excursion'` — valores: `aerea`, `rodoviaria`, `mista`.
- No cadastro de excursão: select "Tipo de transporte" + campos extras quando rodoviária (cidade de embarque, paradas, horário de saída).
- Na página `/excursoes`: badge visível ("✈ Aérea" / "🚌 Rodoviária") + filtro por tipo.
- Destacar na home/menu o diferencial "Também vendemos passagens rodoviárias" (texto curto na seção de excursões).

## 4. Visibilidade do "Criar conta"

Hoje o cadastro existe em `/cadastro` mas o usuário não percebe. Ajustes:

- No `PublicHeader.tsx`: ao lado do botão "Entrar", adicionar botão secundário "Criar conta".
- Na página `/login`: adicionar bloco visível abaixo do form: "Ainda não tem conta? Cadastre-se grátis para acompanhar sua viagem" com link.
- Texto curto explicando o que o cliente ganha ao criar conta (acompanhar pedido, mensagens, documentos).

## Detalhes técnicos

- Migração SQL:
  - `ALTER TABLE completed_trips ADD COLUMN video_url text;`
  - `ALTER TABLE experiences ADD COLUMN transport_type text;` + `departure_city text`, `stops jsonb DEFAULT '[]'`.
- Bucket `site-assets` já é público — reutilizar.
- `site_settings` já tem RLS correta (staff escreve, todos leem).
- Sem mudanças em RLS de `experiences` ou `completed_trips`.

## Fora do escopo (não vou mexer)

- Localização individual de cada agência parceira (você pediu só Guatá).
- Mudanças na área do cliente `/minha-conta` (você disse que está ok).
