'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

type AdRow = {
  id: number
  name: string
  budget: string
  targetRoas: string
  diagnosis: 'Bom' | 'Razoável' | '-'
  diagnosisText?: string
  spend: string
  spendDelta?: string
  sales: string
  salesDelta?: string
  roas: string
  roasDelta?: string
  impressions: string
  impressionsDelta?: string
  ctr: string
  ctrDelta?: string
  status: 'Em andamento' | 'Encerrado' | 'Programado' | 'Pausado'
  protection: boolean
  period?: string
}

const rows: AdRow[] = [
  { id: 1, name: 'Livro de Colorir Infantil Animes 200 Desenhos A4 Kit Pintura Escolar Folhas Soltas ou...', budget: 'Ilimitado', targetRoas: '24.0', diagnosis: 'Razoável', diagnosisText: 'Maximize as Vendas 10%', spend: 'R$22,03', spendDelta: '+77,9%', sales: 'R$374,88', salesDelta: '+89,4%', roas: '17,02', roasDelta: '+6,4%', impressions: '7.1k', impressionsDelta: '+18,1%', ctr: '5,01%', ctrDelta: '-10,8%', status: 'Em andamento', protection: true },
  { id: 2, name: 'Kit Festa Homem-Aranha Personalizado com Decoração e Topo de Bolo [2]', budget: 'Ilimitado', targetRoas: '17.5', diagnosis: 'Razoável', diagnosisText: 'Maximize as Vendas 10%', spend: 'R$25,02', spendDelta: '+25,8%', sales: 'R$296,89', salesDelta: '+22,2%', roas: '11,87', roasDelta: '-2,9%', impressions: '12.9k', impressionsDelta: '+16,8%', ctr: '2,88%', ctrDelta: '+30,0%', status: 'Em andamento', protection: true },
  { id: 3, name: 'Kit para Colorir Infantil 100 Desenhos Animes A4 | Folhas Soltas ou Encadernado [5]', budget: 'Ilimitado', targetRoas: '24.3', diagnosis: 'Bom', spend: 'R$13,76', spendDelta: '+132,2%', sales: 'R$217,84', salesDelta: '+147,7%', roas: '15,83', roasDelta: '+6,7%', impressions: '4.8k', impressionsDelta: '+33,4%', ctr: '4,36%', ctrDelta: '+31,0%', status: 'Em andamento', protection: true },
  { id: 4, name: 'Caderno de Colorir One Piece 40 Desenhos A4 Anime Livro de Colorir Infantil e Adulto', budget: 'Ilimitado', targetRoas: '19.6', diagnosis: 'Razoável', diagnosisText: 'Maximize as Vendas 10%', spend: 'R$13,10', spendDelta: '+324,5%', sales: 'R$104,36', salesDelta: '+338,7%', roas: '7,96', roasDelta: '+3,3%', impressions: '5.3k', impressionsDelta: '+141,6%', ctr: '3,36%', ctrDelta: '-13,3%', status: 'Em andamento', protection: true },
  { id: 5, name: 'Kit Festa K-Pop Demon Hunter Personalizado com Decoração e Topo de Bolo [2]', budget: 'Ilimitado', targetRoas: '25.0', diagnosis: 'Bom', spend: 'R$3,82', sales: 'R$0,00', roas: '0,00', impressions: '935', ctr: '1,82%', status: 'Em andamento', protection: true },
  { id: 6, name: 'Livro de Colorir Terror Adulto 40 Desenhos Capa Dura Papel 180g com Acetato', budget: 'R$10,00', targetRoas: '10.0', diagnosis: '-', spend: 'R$0,00', sales: 'R$0,00', roas: '0,00', impressions: '0', ctr: '0%', status: 'Encerrado', protection: false, period: '20/07/2026 - 27/07/2026' },
  { id: 7, name: 'Livro de Colorir Gótico Adulto 40 Desenhos Capa Dura Papel 180g com Acetato', budget: 'R$10,00', targetRoas: '10.0', diagnosis: '-', spend: 'R$0,00', sales: 'R$0,00', roas: '0,00', impressions: '0', ctr: '0%', status: 'Encerrado', protection: false, period: '20/07/2026 - 27/07/2026' },
  { id: 8, name: 'Livro de Colorir Fantasia 40 Ilustrações Capa Dura com Acetato', budget: 'R$10,00', targetRoas: '10.0', diagnosis: '-', spend: 'R$0,00', sales: 'R$0,00', roas: '0,00', impressions: '0', ctr: '0%', status: 'Encerrado', protection: false, period: '20/07/2026 - 27/07/2026' },
  { id: 9, name: 'Livro de Colorir Era Antiga e Fantasia Medieval 40 Desenhos Capa Dura Papel 180g', budget: 'R$10,00', targetRoas: '10.0', diagnosis: '-', spend: 'R$0,00', sales: 'R$0,00', roas: '0,00', impressions: '0', ctr: '0%', status: 'Encerrado', protection: false, period: '20/07/2026 - 27/07/2026' },
  { id: 10, name: 'Livro de Colorir Adulto 40 ou 80 Desenhos Fantasia Medieval e Era Antiga Anti-estresse', budget: 'R$15,00', targetRoas: '9.3', diagnosis: '-', spend: 'R$0,00', sales: 'R$0,00', roas: '0,00', impressions: '0', ctr: '0%', status: 'Encerrado', protection: false, period: '25/05/2026 - 27/07/2026' }
]

const chartImpressions = [1,2,5,9,8,8,1,2,3,5,6,5,5,2,4,6,7,8,7,2,4,6,7,11,6,2,3,8,11,13,5,2,1,2,7,9,6,3,2,4,5,6,11,2]
const chartRoas = [1,9,2,5,1,1,1,1,1,1,1,1,1,1,6,1,13,1,1,5,3,1,1,4,2,1,1,4,5,1,1,1,1,11,2,1,1,1,1,1,1,4,3,1]

function points(values: number[], width = 1000, height = 150) {
  const max = Math.max(...values, 1)
  return values.map((v, i) => `${(i / (values.length - 1)) * width},${height - (v / max) * (height - 12)}`).join(' ')
}

function deltaClass(value?: string) {
  if (!value) return ''
  return value.trim().startsWith('-') ? 'delta negative' : 'delta positive'
}

export default function AdsPage() {
  const [status, setStatus] = useState('Tudo')
  const [search, setSearch] = useState('')
  const [campaignType, setCampaignType] = useState('Todos os Tipos')
  const [diagnosis, setDiagnosis] = useState('Todos os diagnósticos')
  const [activeTab, setActiveTab] = useState('Todos os Anúncios de Produtos')
  const [roasProtection, setRoasProtection] = useState(false)

  const filtered = useMemo(() => rows.filter(row => {
    const byStatus = status === 'Tudo' || row.status === status
    const bySearch = !search.trim() || row.name.toLowerCase().includes(search.toLowerCase()) || String(row.id).includes(search.trim())
    const byDiagnosis = diagnosis === 'Todos os diagnósticos' || row.diagnosis === diagnosis
    const byProtection = !roasProtection || row.protection
    return byStatus && bySearch && byDiagnosis && byProtection
  }), [status, search, diagnosis, roasProtection])

  function exportCsv() {
    const header = ['Anúncio','Orçamento Diário','ROAS Alvo','Diagnóstico','Investimento','Vendas','ROAS','Impressões','CTR','Status']
    const csv = [header, ...filtered.map(row => [row.name,row.budget,row.targetRoas,row.diagnosis,row.spend,row.sales,row.roas,row.impressions,row.ctr,row.status])]
      .map(row => row.map(cell => `"${String(cell).replaceAll('"','""')}"`).join(';')).join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'shopee-ads.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="adminShell adsShell">
      <header className="topbar">
        <div>
          <div className="eyebrow">Shopee Seller Connector</div>
          <h1 className="adminTitle">Shopee ADS</h1>
        </div>
        <div className="topActions">
          <Link className="outlineButton" href="/products">Produtos</Link>
          <Link className="primaryButton compact" href="/dashboard">Conta conectada</Link>
        </div>
      </header>

      <nav className="mainModuleNav">
        <Link href="/products">Produtos</Link>
        <Link href="/ads" className="active">Shopee ADS</Link>
      </nav>

      <div className="adsReferenceNotice"><strong>Prévia baseada no print enviado.</strong> A estrutura está pronta; os números serão substituídos pelos dados reais quando a integração da Shopee Ads estiver disponível para o app.</div>

      <section className="adsPanel">
        <div className="adsTabs">
          {['Todos os Anúncios de Produtos','Anúncios de Produtos','Anúncios de Novos Produtos','Anúncios da Loja'].map(tab => (
            <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>

        <div className="adsSectionHeader">
          <h2>Desempenho de Anúncios de Produtos</h2>
          <div className="adsHeaderActions">
            <button className="adsControl">▣ Última semana (GMT-3)</button>
            <button className="adsControl" onClick={exportCsv}>Exportar dados ↓</button>
            <button className="adsControl">☰</button>
            <button className="adsControl ghost">Mais métricas⌄</button>
          </div>
        </div>

        <div className="adsKpiGrid">
          <div className="adsKpi activeBlue"><span>Impressões</span><strong>31k</strong></div>
          <div className="adsKpi"><span>Cliques</span><strong>1.1k</strong></div>
          <div className="adsKpi"><span>CTR</span><strong>3,65%</strong></div>
          <div className="adsKpi"><span>Pedidos</span><strong>35</strong></div>
          <div className="adsKpi"><span>Itens vendidos</span><strong>36</strong></div>
          <div className="adsKpi"><span>Vendas</span><strong>R$993,97</strong></div>
          <div className="adsKpi"><span>Investimento</span><strong>R$77,73</strong></div>
          <div className="adsKpi activeOrange"><span>ROAS</span><strong>12,79</strong></div>
        </div>

        <div className="adsChartWrap">
          <div className="chartLegend"><span><i className="dot blue" /> Impressões</span><span><i className="dot orange" /> ROAS</span></div>
          <svg className="adsChart" viewBox="0 0 1000 170" preserveAspectRatio="none" aria-label="Gráfico de Impressões e ROAS">
            {[25,55,85,115,145].map(y => <line key={y} x1="0" x2="1000" y1={y} y2={y} className="gridLine" />)}
            <polyline points={points(chartImpressions,1000,160)} className="impressionLine" />
            <polyline points={points(chartRoas,1000,160)} className="roasLine" />
          </svg>
          <div className="chartDates"><span>04/08 00:00</span><span>05/08 00:00</span><span>06/08 00:00</span><span>07/08 00:00</span><span>08/08 00:00</span><span>09/08 00:00</span><span>10/08 00:00</span></div>
        </div>
      </section>

      <section className="adsPanel adsListPanel">
        <h2>Lista de todos os anúncios</h2>
        <div className="adsModeTabs"><button className="active">Anúncios em grupo e anúncios individuais ⓘ</button><button>GMV Max da Loja ⓘ</button><span className="tinyAlert">●</span></div>

        <div className="adsFilterRow statusRow">
          <span>Status do Anúncio</span>
          {['Tudo','Programado','Em andamento','Pausado','Encerrado'].map(option => <button key={option} className={status === option ? 'pill active' : 'pill'} onClick={() => setStatus(option)}>{option}</button>)}
          <button className="pill">Excluído</button>
          <label className="adsCheckbox"><input type="checkbox" checked={roasProtection} onChange={e => setRoasProtection(e.target.checked)} /> Mostrar Campanhas na Proteção ROAS</label>
        </div>

        <div className="adsFilterGrid">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar Nome da Campanha, Nome do Item, ID do Item" />
          <select value={campaignType} onChange={e => setCampaignType(e.target.value)}><option>Todos os Tipos</option><option>GMV Max</option><option>Anúncio de Produto</option></select>
          <select value={diagnosis} onChange={e => setDiagnosis(e.target.value)}><option>Todos os diagnósticos</option><option>Bom</option><option>Razoável</option><option>-</option></select>
          <button className="adsControl">⌄ Selecione Métricas</button>
        </div>

        <div className="adsTableWrap">
          <table className="adsTable">
            <thead><tr><th><input type="checkbox" /></th><th>Info do Anúncio</th><th>Orçamento Diário</th><th>ROAS Alvo</th><th>Diagnóstico de Anúncios ⓘ</th><th>Investimento ⓘ</th><th>Vendas ⓘ</th><th>ROAS ⓘ</th><th>Impressões ⓘ</th><th>CTR ⓘ</th></tr></thead>
            <tbody>
              {filtered.map((row, index) => (
                <tr key={row.id}>
                  <td><input type="checkbox" /></td>
                  <td>
                    <div className="adInfoCell">
                      <div className={`adThumb thumb${(index % 5) + 1}`}>{row.id}</div>
                      <div><strong>{row.name}</strong><small>Anúncio de Produto - GMV Max - Meta de ROAS</small>{row.period && <small>{row.period}</small>}<div className={row.status === 'Em andamento' ? 'adStatus running' : 'adStatus ended'}>● {row.status}</div>{row.protection && <span className="protectionBadge">♢ Proteção ROAS</span>}</div>
                    </div>
                  </td>
                  <td>{row.budget}</td><td>{row.targetRoas}</td>
                  <td><span className={row.diagnosis === 'Bom' ? 'diag good' : row.diagnosis === 'Razoável' ? 'diag fair' : 'diag'}>{row.diagnosis}</span>{row.diagnosisText && <><small className="diagText">{row.diagnosisText}</small><button className="optimizeLink">Otimizar</button></>}</td>
                  <td><div>{row.spend}</div>{row.spendDelta && <small className={deltaClass(row.spendDelta)}>{row.spendDelta}</small>}</td>
                  <td><div>{row.sales}</div>{row.salesDelta && <small className={deltaClass(row.salesDelta)}>{row.salesDelta}</small>}</td>
                  <td><div>{row.roas}</div>{row.roasDelta && <small className={deltaClass(row.roasDelta)}>{row.roasDelta}</small>}</td>
                  <td><div>{row.impressions}</div>{row.impressionsDelta && <small className={deltaClass(row.impressionsDelta)}>{row.impressionsDelta}</small>}</td>
                  <td><div>{row.ctr}</div>{row.ctrDelta && <small className={deltaClass(row.ctrDelta)}>{row.ctrDelta}</small>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
