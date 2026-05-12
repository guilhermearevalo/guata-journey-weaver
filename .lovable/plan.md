## Posicionamento da Guatá

Vou ajustar a comunicação para refletir: **agência receptiva nascida em Mato Grosso do Sul, mas que organiza viagens para o Brasil e o mundo**. Aplicação:

- Hero: subtítulo passa a citar "do Pantanal ao mundo" (ou similar).
- Página "Sobre": parágrafo de origem em MS + atuação nacional/internacional.
- Footer / SEO: meta description ajustada.

## 1. Home – Hero (com imagem do carro)

Vou gerar **3 direções de design** via design directions e você escolhe uma. O escopo coberto pelas 3 opções:

- Tipografia mais impactante (Playfair display em escala maior).
- Camadas visuais (gradientes editoriais, glass, badges de confiança Cadastur).
- Busca + chips rápidos repensados.
- Prova social inline (ex: "+500 viagens realizadas", estrelas).
- Botões CTA com hierarquia clara.

A imagem de fundo permanece (você disse que não é a imagem em si).

## 2. Seção "Como funciona"

Hoje só existe em `SejaParceiro.tsx`. Vou:

- **Criar uma nova seção "Como funciona" na home**, entre o Hero e Experiências em Destaque, explicando a jornada do cliente em 4 passos (Conte sua viagem → Receba proposta → Aprove e pague → Viaje com suporte).
- **Refazer também a versão da página SejaParceiro** com o mesmo padrão visual.
- Vou gerar **3 direções de design** para essa seção (timeline, cards com mockup, ilustrações) e você escolhe.

## 3. Pacotes vira Pacotes + Viagens Realizadas

Na página `/pacotes`:

- Adicionar **abas (Tabs)** no topo: "Pacotes disponíveis" | "Viagens realizadas".
- A aba "Viagens realizadas" mostra um portfólio: foto de capa, destino, mês/ano, ag\u00eancia respons\u00e1vel, depoimento curto, sem preço, com CTA "Quero algo parecido" (leva para viagem personalizada).
- Admin ganha CRUD simples para registrar essas viagens.

Tecnicamente: nova tabela `completed_trips` (id, title, destination, cover_image, gallery, month, year, agency_id, client_quote, client_name, is_published) com RLS (público lê publicadas; staff/parceiro gerencia as próprias).

## 4. Cadastro de agências parceiras + acesso

Já existe a tela `/admin/parceiros` com botão "Convidar parceiro" que cria usuário e mostra senha temporária uma vez. Vou:

- **Documentar/reorganizar** o painel para ficar óbvio onde clicar.
- Adicionar opção **"Enviar convite por e-mail"** (parceiro define a própria senha) ao lado de "Gerar senha temporária".
- Histórico: badge "Acesso criado" na linha da ag\u00eancia para você saber quem já tem login.
- Para **rever a senha depois**: explicar na UI que ela só aparece uma vez; se perder, basta clicar em "Resetar senha" → gera nova senha temporária.

Onde você acessa: **Admin → Parceiros → linha da ag\u00eancia → menu "..." → Convidar parceiro / Resetar senha**.

## 5. Login: adicionar "Criar conta"

A página `/login` hoje só faz signin. Vou adicionar **abas "Entrar" | "Criar conta"** para clientes finais. Parceiros e equipe continuam sendo criados pelo admin (não aparecem botão de auto-cadastro). O link "Criar conta" também aparece abaixo do formulário.

## 6. Scroll no formulário "Compartilhe seu depoimento"

O `DialogContent` do depoimento não tem altura máxima nem scroll. Vou aplicar `max-h-[90vh] overflow-y-auto` (mesmo padrão usado no `ActivityFormDialog`).

## Detalhes técnicos

| Item | Arquivos / mudança |
|---|---|
| Hero | `src/components/home/HeroSection.tsx` (após escolha do design) |
| Como funciona (home) | novo `src/components/home/HowItWorks.tsx` + import em `Index.tsx` |
| Como funciona (parceiro) | `src/pages/SejaParceiro.tsx` |
| Pacotes + portfólio | `src/pages/Pacotes.tsx`, novo `src/pages/admin/AdminViagensRealizadas.tsx`, migration tabela `completed_trips` |
| Convite parceiro | `src/pages/admin/AdminParceiros.tsx` + edge function `invite-partner` (já existe; adicionar modo "email_invite") |
| Login signup | `src/pages/Login.tsx` (Tabs Entrar/Criar conta) |
| Scroll depoimento | `src/components/home/TestimonialsSection.tsx` |
| Posicionamento MS→Brasil | `HeroSection.tsx`, `Sobre.tsx`, `index.html` meta |

## Próximo passo após aprovação

1. Gero **3 direções visuais para o Hero** → você escolhe.
2. Gero **3 direções visuais para "Como funciona"** → você escolhe.
3. Implemento tudo (itens 3 a 6 já são objetivos, sem precisar escolher visual).