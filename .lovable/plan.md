

# Plano: Vídeo de fundo no Hero Section

## Situação atual

O hero já **suporta vídeos** no carrossel — a estrutura `Slide` tem `type: 'image' | 'video'` e o código renderiza `<video>` quando o tipo é `video`. O admin (`AdminConfiguracoes`) também já permite upload de slides com tipo vídeo.

**Ou seja: a funcionalidade já existe.** Para ter um vídeo de fundo, basta adicionar um slide do tipo "video" nas configurações do admin (`/admin/configuracoes`).

## O que pode ser melhorado

Atualmente, quando há **apenas um slide** (caso comum), ele funciona bem. Mas podemos melhorar a experiência do vídeo de fundo:

### Mudanças no `src/components/home/HeroSection.tsx`

1. **Melhorar o `<video>` de fundo** — adicionar atributos para performance e visual:
   - `preload="auto"` para carregamento mais rápido
   - `poster` com imagem fallback enquanto o vídeo carrega
   - Garantir que o vídeo ocupe 100% da área sem distorção (`object-cover` + `object-position: center`)

2. **Fallback visual** — mostrar a imagem padrão enquanto o vídeo ainda não carregou (estado de loading)

3. **Overlay ajustado para vídeo** — o gradiente atual (`from-black/40`) funciona bem, manter para legibilidade do texto sobre o vídeo

### Nenhuma mudança em banco de dados

A estrutura já suporta vídeos. O admin pode fazer upload de `.mp4` ou colar uma URL de vídeo.

### Arquivo a editar
| Arquivo | Ação |
|---------|------|
| `src/components/home/HeroSection.tsx` | Melhorar renderização do `<video>` com preload, poster e loading state |

