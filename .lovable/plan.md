## Ajustes solicitados

### 1. Hero (Home)
- **"J" cortando em "do seu jeito"**: o problema vem do `leading-[1.05]` muito apertado combinado com a fonte serif itálica em tamanho grande (md:7xl/lg:8xl) — descenders são cortados. Vou aumentar o `leading` para ~1.15 nessa linha e adicionar `pb-2` para dar espaço ao descender do "j".
- **Subtítulo redundante**: removo o parágrafo "Receptivo nascido em Mato Grosso do Sul..." do Hero (ele continua/aparece na página Sobre e implicitamente no badge "Cadastur · Receptivo MS"). O Hero fica mais limpo: badge + título + busca + CTAs.
- **Botão "Falar no WhatsApp" transparente demais**: troco de `bg-white/15` (com hover white/30) para um verde sólido WhatsApp (`bg-[#25D366] hover:bg-[#20BA56] text-white`), sem `backdrop-blur`, mantendo o ícone. Fica legível e on-brand.

### 2. Página Viagens Realizadas
- **Caixa "Histórico real..." + busca "Buscar destinos"**: o layout atual (caixa pontilhada bege ao lado do input solto) parece improvisado. Vou reorganizar:
  - Remover a caixinha tracejada.
  - Mover a frase "Histórico real de viagens organizadas pela Guatá e agências parceiras" para **dentro do header verde** (logo abaixo do subtítulo "Inspire-se em experiências reais...") ou substituir o subtítulo redundante por ela.
  - Colocar o campo de busca **centralizado, abaixo do header**, em estilo card com sombra suave (mesmo padrão do Hero da home: input grande + ícone + arredondado), em vez de um input cru à direita.

### 3. Revisão SEO
- O `index.html` ainda está com placeholders Lovable: `<title>Lovable App</title>`, `<meta description>Lovable Generated Project</meta>`, `og:title=Lovable App`, autor "Lovable". Vou:
  - Atualizar `<title>` para algo como "Guatá Viagens — Receptivo do Pantanal ao mundo" (<60 chars).
  - `<meta description>` para descrição real da agência (<160 chars).
  - `og:title`, `og:description`, `twitter:title`, `twitter:description` consistentes.
  - Adicionar `<link rel="canonical" href="https://guata-journey-weaver.lovable.app/">`.
  - Adicionar `lang="pt-BR"` no `<html>`.
  - Adicionar JSON-LD Organization (nome, url, logo, áreas de atuação).
- Não vou rodar scanner agora (o `seo_chat` retornou vazio); a revisão é pelos critérios padrão (title, description, canonical, lang, JSON-LD, H1 único — já existe na home).

## Arquivos a editar
- `src/components/home/HeroSection.tsx` — leading do h1, remover parágrafo, estilo do botão WhatsApp.
- `src/pages/ViagensRealizadas.tsx` — reorganizar header + busca.
- `index.html` — title, description, canonical, lang, JSON-LD, OG/Twitter.

## Confirmar antes de implementar
1. Pode confirmar o **título do Hero permanecer só "Do Pantanal ao mundo, do seu jeito."** sem o parágrafo de apoio?
2. Para o botão WhatsApp, prefere **verde sólido WhatsApp (#25D366)** ou **outline branco bem mais opaco** mantendo o estilo atual?
3. Para a página Viagens Realizadas, prefere a frase "Histórico real..." **substituindo** o subtítulo atual ou **abaixo** dele?
