import { createHash } from 'node:crypto'
import { cookies } from 'next/headers'
import { jwtDecrypt } from 'jose'
import { redirect } from 'next/navigation'

function key() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('missing_session_secret')
  return createHash('sha256').update(secret).digest()
}

export default async function Dashboard() {
  const token = cookies().get('shopee_session')?.value
  if (!token) redirect('/')

  try {
    const { payload } = await jwtDecrypt(token, key())
    const shopId = String(payload.shopId || '—')
    const expiresAt = Number(payload.expiresAt || 0)

    return (
      <main className="page">
        <section className="card">
          <div className="logo">✓</div>
          <h1 className="title">Conta conectada</h1>
          <p className="subtitle">A autorização da sua loja Shopee foi concluída com sucesso.</p>

          <div className="status success">Conexão ativa</div>
          <div className="box">
            <div className="row"><span className="label">Shop ID</span><span className="value">{shopId}</span></div>
            <div className="row"><span className="label">Token válido até</span><span className="value">{expiresAt ? new Date(expiresAt).toLocaleString('pt-BR') : '—'}</span></div>
          </div>

          <form method="post" action="/api/shopee/logout" style={{ marginTop: 22 }}>
            <button className="btn secondary" type="submit">Desconectar</button>
          </form>
          <div className="footer">Tokens criptografados em sessão HTTP-only</div>
        </section>
      </main>
    )
  } catch {
    redirect('/')
  }
}
