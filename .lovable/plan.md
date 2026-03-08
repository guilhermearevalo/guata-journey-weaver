

# Plano: Melhorar visual do texto do Hero

## Problema
O texto "Experiências Únicas" usa `text-gradient` (gradiente teal→brown) que fica quase invisível sobre a imagem de fundo escura. O overlay `from-secondary/80 via-secondary/60` (marrom escuro) compete com as cores do gradiente do texto, tornando tudo ilegível.

## Solucao

### 1. Texto "Experiências Únicas" — trocar gradiente por cor solida e clara
- Remover a classe `text-gradient` do span
- Usar uma cor clara e vibrante que contraste bem: **branco com destaque dourado/cream** ou **teal claro** (`text-guata-teal-light` / cor clara custom)
- Adicionar `text-shadow` sutil para destacar ainda mais sobre qualquer fundo

### 2. Overlay mais suave
- Ajustar o overlay para `from-black/60 via-black/40 to-background` — preto com transparencia garante contraste universal sem "sujar" as cores do texto

### 3. Subtitulo mais legivel
- Trocar `text-white/80` para `text-white/90` no paragrafo descritivo

### Arquivo a modificar
- `src/components/home/HeroSection.tsx` — classes do h1, span e overlay
- `src/index.css` — opcional, adicionar utilidade de text-shadow

