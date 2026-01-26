const Termos = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            Termos de Uso
          </h1>
          <p className="mx-auto mt-4 text-muted-foreground">
            Última atualização: Janeiro de 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-16">
        <div className="prose prose-lg mx-auto max-w-3xl dark:prose-invert">
          <h2>1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e utilizar o site e os serviços da Guatá Travel Experience, 
            você concorda em cumprir e estar vinculado a estes Termos de Uso. 
            Se você não concordar com qualquer parte destes termos, não deverá 
            utilizar nossos serviços.
          </p>

          <h2>2. Descrição dos Serviços</h2>
          <p>
            A Guatá Travel Experience oferece serviços de curadoria turística, 
            incluindo planejamento de viagens, pacotes turísticos, excursões e 
            roteiros personalizados. Atuamos como intermediários entre você e 
            os prestadores de serviços (hotéis, companhias aéreas, operadoras locais, etc.).
          </p>

          <h2>3. Reservas e Pagamentos</h2>
          <p>
            As reservas só são confirmadas após o recebimento do pagamento inicial 
            estipulado na proposta. Os valores, formas de pagamento e políticas de 
            cancelamento serão detalhados em cada proposta comercial enviada.
          </p>

          <h2>4. Cancelamentos e Reembolsos</h2>
          <p>
            As políticas de cancelamento variam de acordo com cada fornecedor 
            (hotéis, companhias aéreas, operadoras). Em caso de cancelamento 
            por parte do cliente, poderão ser aplicadas multas conforme 
            estabelecido na proposta comercial.
          </p>

          <h2>5. Responsabilidades</h2>
          <p>
            A Guatá Travel Experience atua como intermediária e não se 
            responsabiliza por alterações, cancelamentos ou problemas causados 
            por terceiros (companhias aéreas, hotéis, eventos climáticos, etc.). 
            Recomendamos sempre a contratação de seguro viagem.
          </p>

          <h2>6. Documentação</h2>
          <p>
            É responsabilidade do viajante providenciar toda a documentação 
            necessária para a viagem (passaporte, vistos, vacinas, etc.). 
            A Guatá pode orientar sobre os requisitos, mas não se responsabiliza 
            por problemas decorrentes de documentação inadequada.
          </p>

          <h2>7. Uso do Site</h2>
          <p>
            Você concorda em utilizar o site apenas para fins legais e de acordo 
            com estes termos. É proibido utilizar o site de forma que possa 
            danificar, desabilitar ou prejudicar o funcionamento do mesmo.
          </p>

          <h2>8. Propriedade Intelectual</h2>
          <p>
            Todo o conteúdo do site (textos, imagens, logos, design) é de 
            propriedade da Guatá Travel Experience ou de seus licenciadores. 
            É proibida a reprodução sem autorização prévia.
          </p>

          <h2>9. Alterações nos Termos</h2>
          <p>
            Reservamo-nos o direito de modificar estes termos a qualquer momento. 
            As alterações entram em vigor imediatamente após a publicação no site. 
            O uso continuado dos serviços após alterações constitui aceitação 
            dos novos termos.
          </p>

          <h2>10. Contato</h2>
          <p>
            Para dúvidas sobre estes Termos de Uso, entre em contato através 
            da nossa <a href="/contato" className="text-primary hover:underline">página de contato</a>.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Termos;
