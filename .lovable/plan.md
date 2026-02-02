

# Plano: Continuação da Fase 2 + Página "Seja Parceiro"

---

## O Que é a Guatá Travel Experience

A **Guatá Travel Experience** é uma **plataforma de curadoria turística** que funciona como um hub inteligente conectando três pilares:

```text
+-------------------+     +-------------------+     +-------------------+
|     VIAJANTES     |     |   EQUIPE GUATÁ    |     |    AGÊNCIAS       |
|    (Clientes)     |<--->|   (Consultores)   |<--->|   PARCEIRAS       |
+-------------------+     +-------------------+     +-------------------+
        |                         |                         |
        v                         v                         v
   Buscam viagens          Fazem curadoria          Operam viagens
   personalizadas          e atendimento            específicas
```

### Como Funciona o Modelo de Negócio

1. **Cliente** acessa o site e encontra experiências prontas OU solicita uma viagem personalizada
2. **Equipe Guatá** (consultores) recebe a demanda e analisa as necessidades
3. A equipe pode:
   - Criar uma proposta interna (operada pela Guatá)
   - **Encaminhar para uma Agência Parceira** especializada naquele destino/tipo de viagem
4. **Agência Parceira** recebe a demanda, elabora proposta e opera a viagem
5. Guatá recebe comissão pela intermediação

### O Papel das Agências Parceiras

| Aspecto | Descrição |
|---------|-----------|
| **Quem são** | Operadoras turísticas especializadas em destinos/nichos específicos |
| **Como participam** | Cadastram-se na plataforma e recebem demandas compatíveis com sua expertise |
| **Benefícios** | Acesso a clientes qualificados, sem custo de marketing próprio |
| **Comissão** | Guatá retém um percentual (configurável) sobre cada venda fechada |

---

## O Que Está Faltando

Você identificou corretamente: **não existe uma página pública explicando como agências podem se tornar parceiras**. Isso é essencial para:

1. Atrair novas agências para o ecossistema
2. Explicar os benefícios e o processo de parceria
3. Coletar cadastros de agências interessadas

---

## Plano de Implementação

### PARTE 1: Página "Seja Parceiro" (Nova)

Criar uma página institucional acessível pelo público que:
- Explica o modelo de parceria da Guatá
- Lista os benefícios para agências
- Mostra o fluxo de trabalho
- Possui formulário de cadastro para agências interessadas

**Rota:** `/seja-parceiro`

**Estrutura da Página:**

```text
+---------------------------------------+
|            SEJA PARCEIRO              |
|  "Faça parte da rede Guatá e receba   |
|   clientes qualificados"              |
+---------------------------------------+
|                                       |
|  [BENEFÍCIOS]                         |
|  - Clientes pré-qualificados          |
|  - Sem investimento em marketing      |
|  - Painel exclusivo de gestão         |
|  - Suporte da equipe Guatá            |
|                                       |
+---------------------------------------+
|                                       |
|  [COMO FUNCIONA]                      |
|  1. Você se cadastra                  |
|  2. Validamos sua agência             |
|  3. Recebe demandas do seu nicho      |
|  4. Envia propostas                   |
|  5. Opera e recebe                    |
|                                       |
+---------------------------------------+
|                                       |
|  [FORMULÁRIO DE CADASTRO]             |
|  Nome da agência, CNPJ, Especialidade |
|  Responsável, Email, Telefone         |
|                                       |
|  [ENVIAR SOLICITAÇÃO]                 |
|                                       |
+---------------------------------------+
```

### PARTE 2: Dados de Exemplo no Banco

Popular o banco com dados de teste para que o sistema funcione:

| Tabela | Quantidade | Descrição |
|--------|------------|-----------|
| `experiences` | 5 | Pacotes de viagem variados |
| `travel_requests` | 3 | Solicitações em diferentes status |
| `partner_agencies` | 1 | Agência parceira de exemplo |

### PARTE 3: Kanban de Demandas (Admin)

Implementar o pipeline visual para gestão de solicitações:

**Colunas do Kanban:**
```text
| Pendente | Em Análise | Proposta Enviada | Aprovada | Em Operação | Concluída |
|    (3)   |    (2)     |       (1)        |   (0)    |     (0)     |    (0)    |
```

- Cards arrastáveis entre colunas
- Visualização rápida de cliente, destino e data
- Clique para ver detalhes completos
- Atribuir a consultor ou agência parceira

### PARTE 4: CRUD de Experiências (Admin)

Gestão completa do catálogo de viagens:

- **Listar:** Tabela com filtros (tipo, publicado, destaque)
- **Criar:** Formulário com campos: título, descrição, preço, imagens, itinerário
- **Editar:** Mesmos campos, dados pré-carregados
- **Excluir:** Confirmação antes de remover

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/pages/SejaParceiro.tsx` | Criar | Página pública para agências |
| `src/App.tsx` | Modificar | Adicionar rota /seja-parceiro |
| `src/components/layout/PublicFooter.tsx` | Modificar | Link para Seja Parceiro |
| `src/pages/admin/AdminDemandas.tsx` | Reescrever | Kanban completo |
| `src/pages/admin/AdminExperiencias.tsx` | Reescrever | CRUD completo |
| `src/components/admin/KanbanBoard.tsx` | Criar | Componente do Kanban |
| `src/components/admin/KanbanColumn.tsx` | Criar | Coluna individual |
| `src/components/admin/KanbanCard.tsx` | Criar | Card de demanda |
| `src/components/admin/ExperienceForm.tsx` | Criar | Formulário de experiência |
| **SQL** | Inserir | Dados de exemplo |

---

## Seção Técnica

### Estrutura do Formulário de Parceiro

```typescript
interface PartnerApplicationForm {
  agencyName: string;
  cnpj: string;
  responsibleName: string;
  email: string;
  phone: string;
  website?: string;
  specialties: string[]; // ['aventura', 'praia', 'internacional']
  regions: string[];      // ['nordeste', 'sul', 'europa']
  description: string;    // Breve descrição da agência
}
```

**Fluxo de Dados:**
1. Formulário enviado para tabela `partner_applications` (nova) ou `partner_agencies` com status pendente
2. Admin aprova no painel → atualiza status para ativo
3. Admin cria conta de usuário para a agência com role `partner`
4. Agência recebe credenciais e acessa seu painel

### Componente Kanban (AdminDemandas)

```typescript
// Colunas baseadas no enum request_status
const columns: KanbanColumn[] = [
  { id: 'pending', title: 'Pendente', color: 'amber' },
  { id: 'in_analysis', title: 'Em Análise', color: 'blue' },
  { id: 'proposal_sent', title: 'Proposta Enviada', color: 'purple' },
  { id: 'approved', title: 'Aprovada', color: 'green' },
  { id: 'in_operation', title: 'Em Operação', color: 'orange' },
  { id: 'completed', title: 'Concluída', color: 'gray' },
];

// Cada card mostra:
interface DemandCard {
  id: string;
  clientName: string;
  destination: string;
  travelDate: string;
  budget: string;
  assignedTo?: string; // Consultor ou agência
}
```

### CRUD de Experiências

```typescript
// Estrutura do formulário
interface ExperienceFormData {
  title: string;
  destination: string;
  shortDescription: string;
  description: string;
  experienceType: 'package' | 'excursion';
  price: number;
  durationDays: number;
  maxParticipants: number;
  inclusions: string[];
  exclusions: string[];
  coverImage: string;
  images: string[];
  itinerary: ItineraryDay[];
  isPublished: boolean;
  isFeatured: boolean;
}
```

### Dados de Exemplo (SQL)

```sql
-- 1 Agência Parceira
INSERT INTO partner_agencies (name, cnpj, contact_email, ...)
VALUES ('Nordeste Aventuras', '12.345.678/0001-90', 'contato@nordesteaventuras.com', ...);

-- 5 Experiências
INSERT INTO experiences (title, destination, price, experience_type, ...)
VALUES 
  ('Fernando de Noronha', 'PE', 8500, 'package', ...),
  ('Jalapão Radical', 'TO', 4200, 'excursion', ...),
  ('Chapada Diamantina', 'BA', 3800, 'package', ...),
  ('Lençóis Maranhenses', 'MA', 4500, 'package', ...),
  ('Bonito Completo', 'MS', 5200, 'package', ...);

-- 3 Demandas
INSERT INTO travel_requests (client_name, destination, status, ...)
VALUES 
  ('Maria Silva', 'Fernando de Noronha', 'pending', ...),
  ('João Santos', 'Europa', 'in_analysis', ...),
  ('Ana Costa', 'Nordeste', 'proposal_sent', ...);
```

---

## Ordem de Execução

1. **Dados de exemplo** → Popular banco para testes visuais
2. **Página Seja Parceiro** → Atrair agências + link no footer
3. **Kanban de Demandas** → Gestão operacional das solicitações
4. **CRUD de Experiências** → Gestão do catálogo

---

## Resultado Esperado

Após a implementação:

- Site público terá página explicando parcerias (`/seja-parceiro`)
- Footer terá link para nova página
- Banco terá dados para testar o sistema
- Admin terá Kanban funcional para gestão de demandas
- Admin poderá criar/editar/excluir experiências do catálogo

