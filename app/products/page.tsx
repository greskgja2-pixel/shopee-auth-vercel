'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type Product = {
  item_id: number
  item_name?: string
  item_sku?: string
  item_status?: string
  image?: { image_url_list?: string[] }
  price_info?: Array<{ original_price?: number; current_price?: number }>
  stock_info_v2?: { summary_info?: { total_available_stock?: number } }
  sales?: number
}

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('NORMAL')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/shopee/products?status=${encodeURIComponent(status)}`, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao carregar produtos')
      setItems(data.items || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [status])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(item =>
      String(item.item_name || '').toLowerCase().includes(q) ||
      String(item.item_sku || '').toLowerCase().includes(q) ||
      String(item.item_id).includes(q)
    )
  }, [items, search])

  return (
    <main className="adminShell">
      <header className="topbar">
        <div>
          <div className="eyebrow">Shopee Seller Connector</div>
          <h1 className="adminTitle">Meus produtos</h1>
        </div>
        <div className="topActions">
          <button className="outlineButton" onClick={load}>Atualizar lista</button>
          <Link className="primaryButton compact" href="/dashboard">Conta conectada</Link>
        </div>
      </header>

      <section className="toolbarPanel">
        <input className="searchInput" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, SKU ou Item ID" />
        <select className="selectInput" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="NORMAL">Ativos</option>
          <option value="UNLIST">Desativados</option>
          <option value="BANNED">Bloqueados</option>
          <option value="DELETED">Excluídos</option>
        </select>
      </section>

      {error && <div className="notice errorNotice">{error}</div>}
      {loading ? (
        <div className="emptyPanel">Carregando seus anúncios da Shopee…</div>
      ) : filtered.length === 0 ? (
        <div className="emptyPanel">Nenhum produto encontrado.</div>
      ) : (
        <section className="productGrid">
          {filtered.map(item => {
            const image = item.image?.image_url_list?.[0]
            const price = item.price_info?.[0]?.current_price ?? item.price_info?.[0]?.original_price
            const stock = item.stock_info_v2?.summary_info?.total_available_stock
            return (
              <Link key={item.item_id} href={`/products/${item.item_id}`} className="productCard">
                <div className="productThumb">{image ? <img src={image} alt="" /> : <span>Sem imagem</span>}</div>
                <div className="productBody">
                  <div className="productName">{item.item_name || `Produto ${item.item_id}`}</div>
                  <div className="productMeta">Item ID {item.item_id}{item.item_sku ? ` • SKU ${item.item_sku}` : ''}</div>
                  <div className="metricRow">
                    <span>{price != null ? `R$ ${Number(price).toFixed(2).replace('.', ',')}` : 'Preço —'}</span>
                    <span>Estoque {stock ?? '—'}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </section>
      )}
    </main>
  )
}
