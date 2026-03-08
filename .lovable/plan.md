

# Plano: Botão flutuante do WhatsApp + configuração no admin

## O que será feito

1. **Botão flutuante do WhatsApp** — um ícone fixo no canto inferior direito de todas as páginas públicas. Ao clicar, abre o `wa.me/{numero}` com uma mensagem padrão.

2. **Configuração no Admin** — um novo card em `AdminConfiguracoes.tsx` onde o admin pode:
   - Inserir/editar o número do WhatsApp
   - Ativar/desativar o botão
   - Definir a mensagem padrão (ex: "Olá! Gostaria de mais informações...")

3. **Armazenamento** — usar `site_settings` com chave `whatsapp_config` (JSON: `{ enabled, number, message }`). Nenhuma migration necessária.

## Alterações

### Novo arquivo: `src/components/layout/WhatsAppButton.tsx`
- Componente flutuante fixo (bottom-right) com ícone do WhatsApp (SVG verde)
- Busca config de `site_settings` key `whatsapp_config`
- Se `enabled=true` e número preenchido, renderiza o botão
- Link abre `https://wa.me/{numero}?text={mensagem}`

### `src/components/layout/PublicLayout.tsx`
- Importar e renderizar `<WhatsAppButton />` ao lado do conteúdo

### `src/pages/admin/AdminConfiguracoes.tsx`
- Novo card "WhatsApp" com:
  - Switch para ativar/desativar
  - Input para número (com máscara brasileira)
  - Input para mensagem padrão
  - Botão salvar

