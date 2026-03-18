

# Plano: Melhorar o Hero Section (mais vivo e chamativo)

Inspirado na referência (Donatti), vou tornar o hero mais impactante mantendo toda a funcionalidade existente (carrossel, busca, destinos populares). Nada será removido.

## Mudanças no `src/components/home/HeroSection.tsx`

1. **Título mais impactante e emocional**
   - De: "Descubra o Mundo com / Experiências Únicas"
   - Para: "Realize sua próxima **aventura** com a **Guatá**" — com "aventura" e "Guatá" em destaque colorido (teal), texto maior e mais bold

2. **Subtítulo mais direto e comercial**
   - De: texto longo sobre curadoria
   - Para: "Os melhores destinos com atendimento personalizado + Suporte no WhatsApp"

3. **Barra de busca simplificada**
   - Manter apenas o campo de destino + botão Buscar (como na referência)
   - Abaixo: chips de filtro rápido ("All Inclusive", "Nacional", "Internacional", "Aventura")
   - Remover campos de data e viajantes do hero (ficam na página de experiências)

4. **CTAs abaixo da busca**
   - Botão primário "Ver Experiências →" 
   - Botão outline "Falar no WhatsApp" (linka pro WhatsApp configurado)

5. **Prova social**
   - Indicador com avatares + "X pessoas visualizando agora" (número simulado ou baseado em dados reais futuramente)

6. **Overlay mais leve**
   - Gradiente mais suave (menos escuro) para a imagem de fundo ficar mais viva

## Arquivo a editar
| Arquivo | Ação |
|---------|------|
| `src/components/home/HeroSection.tsx` | Redesign do conteúdo e layout |

Nenhuma mudança em banco de dados, rotas ou outros componentes.

