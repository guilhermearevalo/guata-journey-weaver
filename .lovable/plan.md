

# Plano: Corrigir ícone do WhatsApp + GitHub e Backend

## 1. Corrigir o ícone SVG do WhatsApp

O SVG atual está com o path incompleto/incorreto — mostra apenas o contorno do círculo sem o telefone característico do WhatsApp. Vou substituir por um SVG correto e reconhecível do ícone do WhatsApp (telefone dentro do balão de chat).

### Arquivo: `src/components/layout/WhatsAppButton.tsx`
- Substituir o `<svg>` atual por um SVG correto do WhatsApp com o ícone do telefone visível

## 2. GitHub e Backend

Para conectar o GitHub ao seu projeto Lovable:
- Vá em **Settings → GitHub → Connect project** no editor do Lovable
- Autorize o Lovable GitHub App e selecione sua conta/organização
- Clique em "Create Repository" para gerar o repositório

Para acessar o backend (banco de dados, tabelas, funções):

<lov-actions>
  <lov-open-backend>Abrir Backend</lov-open-backend>
</lov-actions>

Lá você pode visualizar tabelas, dados, usuários e funções. Se precisar de acesso mais avançado via outra ferramenta, o repositório GitHub terá todo o código incluindo as migrations do banco de dados.

