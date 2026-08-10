export default function Home({ searchParams }: { searchParams?: { error?: string } }) {
  const error = searchParams?.error
  const configured = Boolean(process.env.SHOPEE_PARTNER_ID && process.env.SHOPEE_PARTNER_KEY && process.env.SHOPEE_REDIRECT_URL)

  return (
    <main className="page">
      <section className="card">
        <div className="logo">S</div>
        <h1 className="title">Conecte sua conta Shopee</h1>
        <p className="subtitle">
          Faça a autorização pela Shopee Open Platform. Seu usuário e sua senha nunca são digitados neste site.
        </p>

        {error && <div className="status error">Não foi possível concluir a conexão: {error}.</div>}
        {!configured && <div className="status error">As credenciais da Shopee ainda não foram configuradas na Vercel.</div>}

        <div style={{ marginTop: 26 }}>
          <a href={configured ? '/api/shopee/auth' : '#'} className="btn" aria-disabled={!configured}>
            Entrar com Shopee
          </a>
        </div>

        <div className="box">
          <strong>Conexão segura</strong><br />
          Ao clicar, você será redirecionado para a página oficial da Shopee para autorizar o acesso à loja.
        </div>
        <div className="footer">Shopee Open Platform • Integração independente</div>
      </section>
    </main>
  )
}
