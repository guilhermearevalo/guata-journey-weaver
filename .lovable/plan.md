

# Plano: Melhorias no Hero, Pagamentos e Visibilidade do Roteiro

## 1. Corrigir Upload da Imagem do Hero

**Problema encontrado:** O upload salva a URL com aspas duplas extras no banco (`"\"https://...\""`), causando falha ao exibir a imagem. O `JSON.stringify()` esta sendo usado desnecessariamente ao salvar a URL.

**Correcao:**
- Em `AdminConfiguracoes.tsx`: salvar o valor como objeto JSON direto (`{ url: publicUrl }`) ao inves de `JSON.stringify(publicUrl)`
- Em `HeroSection.tsx`: ajustar a leitura para extrair a URL corretamente do objeto

---

## 2. Suporte a Multiplas Imagens e Video no Hero

**O que muda:**
- A `site_settings` passara a guardar um array de midias em vez de uma unica URL: `{ slides: [{ type: "image"|"video", url: "..." }] }`
- O admin podera adicionar varias imagens e ate um video de fundo
- O `HeroSection.tsx` vira um **carrossel automatico** (usando Embla Carousel, ja instalado) que alterna entre as midias
- Videos serao exibidos em loop, sem som, como fundo (tag `<video>` com `autoplay`, `muted`, `loop`)

**Paginas afetadas:**
- `AdminConfiguracoes.tsx` - interface de gerenciamento de slides (adicionar, remover, reordenar)
- `HeroSection.tsx` - renderizar carrossel com imagens e videos

**Limitacoes:**
- Videos devem ser curtos (ate ~30MB) para nao impactar o carregamento
- Formatos aceitos: MP4, WEBM para video; JPG, PNG, WEBP para imagem

---

## 3. Diferencas entre os Logins

Atualmente existem 4 tipos de acesso. O plano nao muda essa estrutura, mas aqui esta o resumo claro:

| Login | Rota | O que ve |
|-------|------|----------|
| **Admin** | `/admin` | Dashboard completo, demandas, experiencias, clientes, parceiros, equipe, CMS, configuracoes |
| **Consultor** | `/admin` | Mesmo painel do admin, EXCETO gerenciamento de equipe (so admin ve) |
| **Parceiro** | `/partner` | Dashboard proprio, demandas atribuidas, criar/editar propostas com links de pagamento |
| **Cliente** | `/minha-conta` | Dashboard de viagens, detalhes + propostas, mensagens com consultor, perfil, planejador de roteiro |

Nenhuma alteracao de codigo necessaria aqui - apenas esclarecimento.

---

## 4. Links de Pagamento - Como Funciona

**Fluxo atual (ja implementado):**
1. Parceiro/Admin cria uma proposta e cola os links de PIX e cartao de credito (links externos como PagSeguro, Mercado Pago, etc.)
2. Cliente aprova a proposta
3. Apos aprovacao, botoes "Pagar com PIX" e "Pagar com Cartao" aparecem na tela da viagem do cliente
4. Ao clicar, o link externo abre em nova aba para o pagamento ser feito fora da plataforma

**Onde aparece:**
- **Para o Parceiro/Admin:** campos de link na tela de criacao/edicao da proposta (`/partner/proposta/:id`)
- **Para o Cliente:** botoes de pagamento na tela de detalhe da viagem (`/minha-conta/viagem/:id`), apenas apos aprovacao

**Melhoria proposta - Rastreamento de pagamento:**
- Adicionar um campo `payment_status` na proposta com opcoes: "pendente", "parcial", "pago"
- O parceiro/admin pode atualizar manualmente o status de pagamento
- O cliente ve o status atualizado na sua area (badge "Pagamento Pendente" / "Pago")
- Isso permite rastrear se o pagamento foi feito mesmo sendo externo

---

## 5. Roteiro com IA - Onde Aparece

**Atualmente:** o planejador de roteiro so aparece para o **Cliente** na rota `/minha-conta/viagem/:id/roteiro`, apos ter uma proposta aprovada.

**Melhoria proposta - Acesso para Staff e Parceiro:**
- Adicionar acesso ao roteiro tambem no painel admin/parceiro
- O consultor/admin podera ver e editar o roteiro do cliente em `/admin/demandas` (detalhes da demanda)
- O parceiro podera ver o roteiro ao acessar a proposta que criou
- Isso permite que todos os envolvidos colaborem no planejamento

**Visao por role:**

| Role | Pode ver roteiro? | Pode editar? | Pode usar IA? |
|------|-------------------|--------------|---------------|
| Cliente | Sim | Sim | Sim |
| Consultor/Admin | Sim (novo) | Sim (novo) | Sim (novo) |
| Parceiro | Sim (novo) | Sim (novo) | Sim (novo) |

---

## Resumo das Alteracoes Tecnicas

### Arquivos a criar:
- Nenhum arquivo novo necessario

### Arquivos a modificar:
- `AdminConfiguracoes.tsx` - interface de slides multiplos com suporte a video
- `HeroSection.tsx` - carrossel de imagens/videos
- `proposals` tabela - adicionar coluna `payment_status` (migration SQL)
- `PartnerProposta.tsx` - campo para atualizar status de pagamento
- `ClienteViagem.tsx` - exibir status de pagamento
- `AdminDemandas.tsx` ou `RequestDetailDialog.tsx` - link para visualizar roteiro

### Migration SQL necessaria:
- Adicionar `payment_status TEXT DEFAULT 'pending'` na tabela `proposals`

### Ordem de implementacao:
1. Corrigir bug do upload do hero (rapido)
2. Expandir para multiplas imagens + video
3. Adicionar rastreamento de pagamento
4. Dar acesso ao roteiro para staff e parceiro

