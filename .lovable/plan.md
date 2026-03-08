
# Plano: Plataforma Guatá - Status de Implementação

## ✅ Fase 1 - Funcionalidades Base
- Upload de imagem do hero com carrossel (imagens + vídeo)
- Links de pagamento (PIX e Cartão) nas propostas
- Planejador de roteiro com IA (cliente, admin, parceiro)
- Status de pagamento (pendente, parcial, pago)

## ✅ Fase 2 - Controle Financeiro e Visibilidade
- Relatório por Agência (`/admin/relatorio-agencias`): vendas, receita, comissões
- Dashboard Financeiro (`/admin/financeiro`): resumo de pagamentos pendentes/pagos
- Filtros no Kanban: por agência e status de pagamento
- Admin/consultor pode criar propostas diretamente (`/admin/proposta/:id`)

## ✅ Fase 3 - Segurança e Acesso
- Parceiros agora visualizam contato completo do cliente (email/telefone) para operar a viagem

## 🔄 Fase 4 - Pagamentos com Stripe + Fallback Manual
- ✅ Stripe habilitado na plataforma
- 🔜 Edge function `create-checkout` para Stripe Checkout Session
- 🔜 Edge function `stripe-webhook` para atualização automática de status
- 🔜 UI da proposta pública com botão Stripe + fallback links manuais

## 🔜 Próximas Fases
- Log de auditoria (quem mudou o que, quando)
- Notificações in-app ou por email
- Filtro por consultor responsável no Kanban
