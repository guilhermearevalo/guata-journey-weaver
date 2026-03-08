

# Plano: Reordenacao mais intuitiva de atividades

## Problema
As setas sobem/descem 1 posicao por vez, o que e lento e confuso quando ha muitas atividades.

## Solucao
Substituir as setas por um **campo de posicao numerica** (ex: "1", "2", "3") ao lado de cada atividade. O usuario clica no numero, digita a nova posicao, e a atividade e movida automaticamente para aquele lugar (as outras se ajustam).

Alem disso, manter as setas mas torna-las mais claras visualmente (com tooltip "Mover para cima" / "Mover para baixo") e desabilitar quando ja esta no topo/final.

## Alteracoes

### `ItineraryPlanner.tsx`
- Adicionar um badge clicavel com o numero da posicao (1, 2, 3...) antes do nome da atividade
- Ao clicar, abre um pequeno popover com input numerico para definir a nova posicao
- Funcao `moveActivityToPosition(dayIdx, fromIdx, toIdx)` que remove e reinsere na posicao correta
- Manter setas com tooltips claros como alternativa rapida

Nenhum arquivo novo, nenhuma migration. Apenas modificacao do `ItineraryPlanner.tsx`.

