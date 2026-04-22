export const metadata = {
  title: 'Política de Privacidade | CRM Futuros Anúncios',
};

export default function PrivacidadePage() {
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px', fontFamily: 'sans-serif', lineHeight: 1.7, color: '#1a1a1a' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Política de Privacidade</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>Última atualização: 22 de abril de 2026</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>1. Quem somos</h2>
      <p>
        A <strong>Futuros Anúncios</strong> (NIF a confirmar) é uma agência de marketing digital com sede em Portugal.
        Esta Política de Privacidade aplica-se ao CRM interno utilizado pela equipa e às integrações com plataformas
        como Instagram, WhatsApp e Email.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>2. Dados que recolhemos</h2>
      <p>No âmbito da utilização do CRM e das suas integrações, podemos recolher:</p>
      <ul>
        <li>Nome e informações de contacto (email, telefone) de clientes e potenciais clientes;</li>
        <li>Mensagens trocadas via Instagram Direct, WhatsApp ou Email, no contexto de relações comerciais;</li>
        <li>Informações sobre empresas (morada, NIF, redes sociais) para fins de prospeção comercial.</li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>3. Como utilizamos os dados</h2>
      <p>Os dados são utilizados exclusivamente para:</p>
      <ul>
        <li>Gestão de relações comerciais e acompanhamento de oportunidades de negócio;</li>
        <li>Comunicação com clientes e potenciais clientes no âmbito de serviços contratados ou propostos;</li>
        <li>Cumprimento de obrigações legais e contratuais.</li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>4. Partilha de dados</h2>
      <p>
        Não vendemos, alugamos nem partilhamos dados pessoais com terceiros para fins de marketing.
        Os dados podem ser partilhados com prestadores de serviços tecnológicos (como Supabase, Vercel e Meta)
        apenas na medida necessária para o funcionamento da plataforma.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>5. Retenção de dados</h2>
      <p>
        Os dados são conservados pelo período necessário à prossecução das finalidades descritas,
        ou enquanto existir uma relação comercial ativa, salvo obrigação legal de conservação por período superior.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>6. Direitos dos titulares</h2>
      <p>
        Ao abrigo do RGPD, os titulares de dados têm direito de acesso, retificação, apagamento, portabilidade
        e oposição ao tratamento dos seus dados. Para exercer estes direitos, contacte-nos através do email:
        <strong> geral@futurosanuncios.com</strong>
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>7. Integração com Meta (Instagram)</h2>
      <p>
        A Futuros Anúncios utiliza a API oficial do Instagram (Meta Platforms) para receber e responder a mensagens
        diretas recebidas na conta @futurosanuncios. As mensagens são processadas internamente e não são partilhadas
        com terceiros. A utilização está em conformidade com as{' '}
        <a href="https://developers.facebook.com/terms/" style={{ color: '#2563eb' }}>Políticas da Plataforma Meta</a>.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32 }}>8. Contacto</h2>
      <p>
        Para questões relacionadas com privacidade, contacte:<br />
        <strong>Futuros Anúncios</strong><br />
        Email: geral@futurosanuncios.com<br />
        Website: <a href="https://futurosanuncios.com" style={{ color: '#2563eb' }}>futurosanuncios.com</a>
      </p>
    </main>
  );
}
