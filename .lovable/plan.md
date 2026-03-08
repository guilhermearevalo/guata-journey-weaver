

# Plano: Buscador completo, estado vazio bonito e controle de secoes no admin

## 3 problemas identificados

### 1. Campo "Quando" sumiu no mobile
O campo de data no hero tem `hidden md:block` — so aparece em telas maiores. Vou torna-lo visivel em todas as telas e transformar num input `type="date"` funcional (hoje e apenas texto placeholder).

### 2. Busca sem resultados — estado vazio feio
Quando a pessoa busca e nao encontra, aparece apenas um texto simples. Vou criar um **estado vazio bonito** que:
- Mostra uma ilustracao/icone atraente
- Diz "Nao encontramos experiencias para [destino]"
- Oferece um botao **"Solicitar Viagem Personalizada"** que redireciona para `/viagem-personalizada` ja com o destino pre-preenchido via query param
- Na pagina ViagemPersonalizada, ler o query param `destino` e preencher automaticamente o campo

### 3. Ativar/desativar secoes da home e menu no admin
Criar toggles no AdminConfiguracoes para controlar visibilidade de:
- **Experiencias em Destaque** (FeaturedExperiences)
- **Sua Viagem dos Sonhos** (CustomTravelCTA)
- **O que Nossos Viajantes Dizem** (TestimonialsSection)

Quando desativado:
- A secao some da pagina inicial
- Os links correspondentes somem do menu (ex: desativar "Experiencias em Destaque" pode ocultar o link "Experiencias" do header)

Armazenar no `site_settings` com chave `homepage_sections` (JSON com flags booleanas).

---

## Alteracoes tecnicas

### Arquivos a modificar

**`HeroSection.tsx`**
- Remover `hidden` dos campos "Quando" e "Viajantes" no mobile (tornar responsivo com layout empilhado)
- Trocar inputs de texto por `type="date"` para "Quando" e `type="number"` para "Viajantes"
- Passar todos os campos (destino, data, viajantes) como query params na busca

**`Experiencias.tsx`**
- Redesenhar o estado vazio (0 resultados) com card bonito, icone, e botao CTA para viagem personalizada
- Passar destino buscado como query param: `/viagem-personalizada?destino=X`

**`ViagemPersonalizada.tsx`**
- Ler `searchParams` e pre-preencher campo `destination` com o valor de `?destino=`

**`AdminConfiguracoes.tsx`**
- Adicionar card "Secoes da Pagina Inicial" com Switch toggles para cada secao
- Salvar em `site_settings` key `homepage_sections`

**`Index.tsx`**
- Buscar `homepage_sections` do site_settings
- Renderizar condicionalmente cada secao

**`PublicHeader.tsx`**
- Buscar `homepage_sections` e ocultar links do menu conforme secoes desativadas (ex: se "Experiencias em Destaque" desativado, ocultar link "Experiencias")

### Nenhuma migration necessaria
Usa tabela `site_settings` existente.

