const Privacidade = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            Política de Privacidade
          </h1>
          <p className="mx-auto mt-4 text-muted-foreground">
            Última atualização: Janeiro de 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-16">
        <div className="prose prose-lg mx-auto max-w-3xl dark:prose-invert">
          <h2>1. Introdução</h2>
          <p>
            A Guatá Travel Experience está comprometida com a proteção da sua 
            privacidade. Esta política descreve como coletamos, usamos, armazenamos 
            e protegemos suas informações pessoais, em conformidade com a Lei Geral 
            de Proteção de Dados (LGPD).
          </p>

          <h2>2. Dados que Coletamos</h2>
          <p>Podemos coletar os seguintes tipos de informações:</p>
          <ul>
            <li><strong>Dados de identificação:</strong> nome, CPF, RG, data de nascimento</li>
            <li><strong>Dados de contato:</strong> e-mail, telefone, endereço</li>
            <li><strong>Dados de viagem:</strong> preferências, histórico de viagens, passaporte</li>
            <li><strong>Dados de pagamento:</strong> informações de cartão de crédito (processadas por terceiros seguros)</li>
            <li><strong>Dados de navegação:</strong> cookies, endereço IP, dados de uso do site</li>
          </ul>

          <h2>3. Como Usamos seus Dados</h2>
          <p>Utilizamos suas informações para:</p>
          <ul>
            <li>Processar solicitações e reservas de viagens</li>
            <li>Entrar em contato sobre suas solicitações</li>
            <li>Enviar informações sobre viagens contratadas</li>
            <li>Melhorar nossos serviços e experiência do usuário</li>
            <li>Enviar comunicações de marketing (mediante consentimento)</li>
            <li>Cumprir obrigações legais</li>
          </ul>

          <h2>4. Compartilhamento de Dados</h2>
          <p>
            Seus dados podem ser compartilhados com:
          </p>
          <ul>
            <li>Fornecedores de serviços turísticos (hotéis, companhias aéreas, etc.)</li>
            <li>Parceiros de pagamento e antifraude</li>
            <li>Autoridades governamentais, quando exigido por lei</li>
          </ul>
          <p>
            Não vendemos suas informações pessoais a terceiros.
          </p>

          <h2>5. Armazenamento e Segurança</h2>
          <p>
            Seus dados são armazenados em servidores seguros com criptografia. 
            Implementamos medidas técnicas e organizacionais para proteger suas 
            informações contra acesso não autorizado, perda ou destruição.
          </p>

          <h2>6. Seus Direitos</h2>
          <p>De acordo com a LGPD, você tem direito a:</p>
          <ul>
            <li>Confirmar a existência de tratamento de dados</li>
            <li>Acessar seus dados pessoais</li>
            <li>Corrigir dados incompletos ou desatualizados</li>
            <li>Solicitar a eliminação de dados desnecessários</li>
            <li>Revogar consentimento a qualquer momento</li>
            <li>Solicitar a portabilidade dos dados</li>
          </ul>

          <h2>7. Cookies</h2>
          <p>
            Utilizamos cookies para melhorar sua experiência de navegação. 
            Você pode configurar seu navegador para recusar cookies, mas 
            isso pode afetar algumas funcionalidades do site.
          </p>

          <h2>8. Retenção de Dados</h2>
          <p>
            Mantemos seus dados pelo tempo necessário para cumprir as finalidades 
            descritas nesta política ou conforme exigido por lei. Dados de viagens 
            são mantidos por pelo menos 5 anos para fins fiscais e legais.
          </p>

          <h2>9. Alterações nesta Política</h2>
          <p>
            Podemos atualizar esta política periodicamente. Notificaremos sobre 
            mudanças significativas através do site ou por e-mail.
          </p>

          <h2>10. Contato do Encarregado (DPO)</h2>
          <p>
            Para exercer seus direitos ou esclarecer dúvidas sobre esta política, 
            entre em contato através da nossa{' '}
            <a href="/contato" className="text-primary hover:underline">
              página de contato
            </a>.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Privacidade;
