

# Plano: Cadastur editável no Admin + Logo na página Sobre

## Situação atual
O número do Cadastur, validade, descrição e imagem do certificado estão **hardcoded** no código (`Sobre.tsx` e `PublicFooter.tsx`). Para alterar qualquer dado, é preciso editar código.

## O que será feito

### 1. Nova seção no Admin Configurações
Adicionar uma seção "Cadastur / Credenciais" em `AdminConfiguracoes.tsx` com campos editáveis:
- **Número do Cadastur** (texto) — ex: "64.677.632/0001-77"
- **Validade** (texto) — ex: "27/01/2026 a 27/01/2028"
- **Descrição** (textarea) — texto explicativo
- **Imagem do certificado** (upload) — substitui o PNG atual
- **Logo da agência para página Sobre** (upload) — exibida ao lado do certificado

Dados salvos em `site_settings` com key `cadastur_config`.

### 2. Sobre.tsx — Buscar dados do banco
- Carregar `cadastur_config` do `site_settings`
- Usar os dados dinâmicos (número, validade, imagem, descrição)
- Exibir logo da agência ao lado do certificado (se configurada)
- Manter fallback hardcoded caso não exista configuração

### 3. PublicFooter.tsx — Buscar dados do banco
- Carregar `cadastur_config` para exibir número dinâmico no rodapé
- Fallback para o número atual se não configurado

### Sobre a logo na página Sobre
Não ficaria com muita informação. A logo ficaria bem posicionada **acima ou ao lado** do certificado Cadastur, reforçando a identidade visual da marca na seção de credenciais. É um padrão comum em sites de agências.

## Arquivos a editar

| Arquivo | Ação |
|---------|------|
| `src/pages/admin/AdminConfiguracoes.tsx` | Adicionar seção "Cadastur / Credenciais" com formulário |
| `src/pages/Sobre.tsx` | Buscar dados do `site_settings` em vez de hardcoded |
| `src/components/layout/PublicFooter.tsx` | Buscar número do Cadastur do `site_settings` |

Nenhuma migração SQL necessária — usa a tabela `site_settings` existente.

