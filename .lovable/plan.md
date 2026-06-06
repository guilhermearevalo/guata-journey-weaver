# Plano: Roteiro encantador, exclusão de propostas, edição de imagens e PDF

Quatro melhorias, todas focadas em deixar a experiência profissional e atrativa para o cliente final.

## 1. Excluir propostas/roteiros (nos dois lugares)

Hoje não existe nenhum botão para excluir uma proposta criada. Vou adicionar:

- **Na lista de demandas (Kanban):** botão "Excluir proposta" no detalhe da demanda (`RequestDetailDialog`), com diálogo de confirmação ("Tem certeza? Esta ação não pode ser desfeita").
- **No planejador de roteiro:** botão de excluir no cabeçalho do `ItineraryPlanner`, também com confirmação. Após excluir, redireciona de volta para a lista.
- A exclusão remove a proposta e os dados associados (roteiro, dossiê, documentos de viagem vinculados). A demanda em si continua existindo — só a proposta/roteiro é apagada, permitindo recriar.

## 2. Roteiro do cliente redesenhado — estilo "Revista de Viagem"

A página pública do roteiro (`RoteiroPublico` em `/roteiro/:token`) será transformada numa experiência editorial premium, usando a identidade Guatá (Playfair Display, teal/marrom, dourado de destaque):

- **Capa imersiva:** foto grande em destaque, título em serifada, selo "Roteiro Exclusivo", datas e número de viajantes com ícones elegantes, logo da agência.
- **Resumo da viagem:** faixa com destino, duração, investimento total e contagem de dias, em cards refinados.
- **Timeline dia a dia mais bonita:** cada dia como um "capítulo" com número grande, título do dia, e atividades em cards com foto, horário, categoria (badges com cor suave), descrição legível e botão "Ver rota". Espaçamento generoso e sombras suaves.
- **Animações sutis** (fade/slide ao rolar) para dar sensação premium sem pesar.
- **Seções do dossiê** (aéreo, hospedagem, seguro, etc.) com o mesmo padrão visual.
- **Abertura ao clicar:** garantir que o link do roteiro abre direto numa página completa e navegável (já abre, mas o visual atual é fraco) — o foco é torná-la encantadora.
- O modo impressão/PDF continua funcionando.

> Observação: como você pediu "a melhor opção", segui o estilo Revista (elegante). Se ao ver pronto quiser testar o "Moderno clean" ou "Aventura imersivo", ajusto depois.

## 3. Edição de imagens das atividades (cortar + ajustar foco)

No `ActivityFormDialog`, ao enviar/colar uma imagem, adicionar:

- **Cropper (cortar e enquadrar):** ferramenta para recortar, dar zoom e girar a foto antes de salvar, com proporção fixa adequada ao card do roteiro (paisagem). Usarei a biblioteca `react-easy-crop`.
- **Ajuste de foco:** controle de ponto focal (qual parte da foto fica centralizada) para quando não quiser cortar.
- A imagem final recortada é reenviada ao storage e salva na atividade.

## 4. PDF da "Política de Prestação de Serviços" aparecendo para todos

O PDF está salvo e acessível publicamente (já testei: responde corretamente). O problema é que o embed atual (`<object>/<iframe>`) **não renderiza em muitos navegadores, principalmente no celular** — por isso "não aparece para as pessoas".

Solução no `LegalPageLayout` (modo PDF):

- Card de destaque com ícone de documento, título e dois botões claros: **"Abrir documento"** e **"Baixar PDF"**.
- Visualizador embutido como complemento (para desktop), mas com fallback elegante e mensagem + botões quando o navegador não conseguir exibir inline.
- Garante que, em qualquer dispositivo, o cliente sempre consegue acessar o documento.

## Detalhes técnicos
- **Dependência nova:** `react-easy-crop` para o recorte de imagem.
- **Banco:** exclusão de proposta usa `DELETE` em `proposals` (RLS já permite staff/parceiro). Verifico se há documentos de viagem vinculados para limpar referências.
- **Arquivos principais a alterar:** `src/pages/RoteiroPublico.tsx` (redesign), `src/components/itinerary/ItineraryPlanner.tsx` (botão excluir), `src/components/admin/RequestDetailDialog.tsx` (botão excluir), `src/components/itinerary/ActivityFormDialog.tsx` (cropper + foco), `src/components/cms/LegalPageLayout.tsx` (PDF), e possivelmente um novo componente `ImageCropper`.
- Tudo usando tokens semânticos do design system (sem cores hardcoded).
