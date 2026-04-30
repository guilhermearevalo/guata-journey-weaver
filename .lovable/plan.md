Entendi. Dá para transformar o roteiro personalizado para ficar bem mais parecido com esse exemplo: um material visual, com texto explicativo, imagem, botão de rota no Google Maps e marca da agência/Guatá no topo e rodapé.

# Plano pro roteiro personalizado visual

## 1. Como vai funcionar no dia a dia

Cada atividade do roteiro vai poder ter:

- Título da parada/atividade
- Texto descritivo mais rico
- Imagem ilustrativa
- Link de rota no Google Maps
- Custo estimado, se quiser mostrar
- Período: manhã, tarde ou noite

Exemplo no roteiro público:

```text
[Logo Guatá ou logo da agência]
Roteiro personalizado para Gramado
Dia 1 de 5

[Imagem da atividade]
Café colonial em Gramado
Texto explicando a experiência, recomendações, horários e observações.
[Botão: Ver rota no Google Maps]
```

Assim o cliente recebe um roteiro mais bonito, parecido com um guia de viagem, e não apenas uma lista simples.

## 2. Botão “Rota até aqui” com Google Maps

No cadastro/edição da atividade do roteiro, vou adicionar um campo:

- “Link da rota no Google Maps”

A equipe pode colar ali um link do Google Maps, por exemplo uma rota, endereço ou localização. No roteiro público aparecerá um botão:

- “Rota até aqui”
- “Abrir no Google Maps”

Isso evita uma integração complexa agora e já funciona bem no WhatsApp/celular do cliente.

## 3. Logo da agência no roteiro personalizado

Sim, dá para colocar a logo da agência da mesma forma.

A regra será:

- Se a proposta/roteiro estiver vinculada a uma agência parceira com logo cadastrada, mostrar a logo da agência no roteiro.
- Se não tiver agência ou não tiver logo, mostrar a marca Guatá.
- No rodapé também pode aparecer algo como “Roteiro preparado por Guatá” ou “Roteiro preparado por [Nome da Agência]”.

Isso mantém o material mais profissional para agência parceira e para operação própria.

## 4. Editar logo e imagem de fundo da agência no admin

No admin de Parceiros, vou incluir edição dos campos visuais da agência:

- Logo da agência
- Imagem de fundo/capa da agência

Como o banco já tem `logo_url`, vou usar esse campo para a logo. Para imagem de fundo/capa, vou adicionar um novo campo no banco, por exemplo `cover_image_url`.

No detalhe da agência no admin, será possível editar esses links. Depois, esses dados serão usados no roteiro público.

## 5. Melhorar visual do roteiro público

Vou redesenhar a página pública do roteiro (`/roteiro/:token`) para ficar mais premium e parecida com material enviado para cliente:

- Fundo claro, com textura/sensação editorial mais limpa
- Cabeçalho com logo
- Capa visual opcional, usando imagem da agência ou do destino quando disponível
- Cards por dia mais elegantes
- Atividades com imagem maior
- Texto com melhor leitura
- Botão de rota destacado
- Rodapé com logo/marca
- Impressão/PDF mais bonito usando o botão “Imprimir”

## 6. Melhorar o formulário da atividade

No planejador do roteiro, o modal de atividade passará a ter:

- Campo de imagem, que já existe
- Novo campo de link do Google Maps
- Descrição maior para texto estilo guia
- Indicação de que a imagem pode ser usada para deixar o roteiro mais comercial

## 7. Ajuste técnico

Arquivos principais a alterar:

| Arquivo | Mudança |
|---|---|
| `src/components/itinerary/ActivityFormDialog.tsx` | Adicionar campo de rota Google Maps |
| `src/components/itinerary/ItineraryPlanner.tsx` | Salvar/exibir `maps_url` na atividade |
| `src/pages/RoteiroPublico.tsx` | Novo layout visual com logo, imagem, texto e rota |
| `src/pages/admin/AdminParceiros.tsx` | Editar logo e imagem de capa da agência |
| Banco de dados | Adicionar `cover_image_url` em `partner_agencies` |

## 8. Sobre imagem por upload

Nesta primeira melhoria, posso usar campo por URL, que é mais rápido e mantém o fluxo atual do sistema. Depois podemos evoluir para upload direto de imagem no admin, se você quiser que a equipe envie arquivos sem precisar colar URL.

# Resultado esperado

Depois disso, o roteiro personalizado vira um material de venda/atendimento mais bonito, com cara de guia personalizado:

- Cliente vê textos bem formatados
- Cliente vê fotos
- Cliente clica em rota no Google Maps
- Cliente vê a logo da agência ou da Guatá
- Admin consegue controlar imagem/logo da agência
- Serve tanto para operação própria quanto para agência parceira