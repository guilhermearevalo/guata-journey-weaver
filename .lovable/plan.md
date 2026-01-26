
# Plano de Correções - Guatá Travel Experience

## Resumo das Correções Necessárias

Com base na análise do código, identifiquei os seguintes problemas que serão corrigidos:

---

## 1. Substituição da Logo

**Problema:** A logo atual tem fundo, precisa ser substituída pela versão sem fundo.

**Solução:**
- Copiar a nova logo para `src/assets/logo-guata.png`
- A logo será usada automaticamente em todos os componentes que já a importam (Header e Footer)

---

## 2. Correção dos Links 404

**Problema:** Várias páginas do menu e rodapé não existem.

**Páginas faltando:**

| Rota | Descrição |
|------|-----------|
| `/excursoes` | Catálogo de excursões |
| `/pacotes` | Catálogo de pacotes |
| `/sobre` | Página institucional |
| `/faq` | Perguntas frequentes |
| `/termos` | Termos de uso |
| `/privacidade` | Política de privacidade |
| `/contato` | Formulário de contato |

**Solução:**
Criar páginas básicas com conteúdo placeholder para todas as rotas, mantendo a consistência visual:

- **Excursões e Pacotes:** Reutilizar o componente de catálogo de experiências com filtros apropriados
- **Sobre, FAQ, Termos, Privacidade, Contato:** Criar páginas informativas com estrutura básica

**Arquivos a criar:**
```text
src/pages/Excursoes.tsx
src/pages/Pacotes.tsx  
src/pages/Sobre.tsx
src/pages/FAQ.tsx
src/pages/Termos.tsx
src/pages/Privacidade.tsx
src/pages/Contato.tsx
```

**Atualização do App.tsx:**
Adicionar todas as novas rotas dentro do PublicLayout

---

## 3. Melhoria no Contraste de Cores

**Problema:** Na seção Hero da página inicial, o texto não tem contraste suficiente para leitura.

**Análise técnica:**
- O fundo usa `bg-secondary/80` (marrom escuro com opacidade)
- O texto usa `text-secondary-foreground` (cor clara) e `text-muted-foreground` (cinza)
- O `text-muted-foreground` sobre o overlay escuro fica com baixa legibilidade

**Solução:**
Ajustar as cores do Hero Section para garantir contraste adequado:

```text
Antes: text-muted-foreground (cinza médio - difícil de ler)
Depois: text-white/90 ou text-secondary-foreground/90 (branco com leve transparência)
```

**Mudanças específicas no HeroSection.tsx:**
- Linha 33: `text-primary` para `text-white` (texto de boas-vindas)
- Linha 37: `text-secondary-foreground` para `text-white` (título principal)
- Linha 42: `text-muted-foreground` para `text-white/80` (descrição)
- Linha 106: `text-muted-foreground` para `text-white/70` (destinos populares)

---

## 4. Conexão com Banco de Dados

**Status: Já conectado**

O Lovable Cloud já está ativo com as seguintes tabelas configuradas:
- `profiles` - Perfis de usuário
- `user_roles` - Níveis de acesso (client, consultant, manager, admin, partner)
- `experiences` - Catálogo de experiências/viagens
- `travel_requests` - Solicitações de viagem personalizada
- `proposals` - Propostas das agências
- `bookings` - Reservas
- `messages` - Comunicação interna
- `partner_agencies` - Agências parceiras

As políticas de segurança (RLS) já estão implementadas para cada tabela.

---

## 5. Próximos Passos do Projeto

De acordo com o plano inicial, os próximos desenvolvimentos são:

### Fase Atual - Correções (Este Plano)
- Substituir logo
- Criar páginas faltando
- Melhorar contraste de cores

### Próxima Fase - Dashboard Administrativo
- Painel central com métricas
- Gestão de demandas (Kanban)
- Gestão de clientes
- Gestão de experiências

### Fase Seguinte - Portal de Parceiros
- Dashboard limitado para agências
- Recebimento de briefings
- Envio de propostas

### Fase Final - Área do Cliente
- Minha conta
- Histórico de viagens
- Acompanhamento de solicitações
- Mensagens

---

## Resumo das Mudanças

| Arquivo | Ação |
|---------|------|
| `src/assets/logo-guata.png` | Substituir pela nova logo sem fundo |
| `src/pages/Excursoes.tsx` | Criar (catálogo filtrado) |
| `src/pages/Pacotes.tsx` | Criar (catálogo filtrado) |
| `src/pages/Sobre.tsx` | Criar (página institucional) |
| `src/pages/FAQ.tsx` | Criar (perguntas frequentes) |
| `src/pages/Termos.tsx` | Criar (termos de uso) |
| `src/pages/Privacidade.tsx` | Criar (política de privacidade) |
| `src/pages/Contato.tsx` | Criar (formulário de contato) |
| `src/components/home/HeroSection.tsx` | Melhorar contraste de cores |
| `src/App.tsx` | Adicionar novas rotas |

---

## Seção Técnica

### Estrutura das Novas Páginas

Cada página seguirá o padrão:
```tsx
const NomePagina = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="font-display text-4xl font-bold">Título</h1>
      <p className="text-muted-foreground">Conteúdo...</p>
    </div>
  );
};
```

### Cores Corrigidas (HSL)

```css
/* Texto sobre fundo escuro */
--hero-title: 0 0% 100%        /* Branco puro */
--hero-description: 0 0% 100% / 80%  /* Branco 80% */
--hero-label: 0 0% 100% / 70%  /* Branco 70% */
```

### Rotas Adicionais no App.tsx

```tsx
<Route path="/excursoes" element={<Excursoes />} />
<Route path="/pacotes" element={<Pacotes />} />
<Route path="/sobre" element={<Sobre />} />
<Route path="/faq" element={<FAQ />} />
<Route path="/termos" element={<Termos />} />
<Route path="/privacidade" element={<Privacidade />} />
<Route path="/contato" element={<Contato />} />
```
