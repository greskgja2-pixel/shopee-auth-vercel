'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AlarmClock, Archive, ArrowLeft, BarChart3, LockKeyhole, Package, Scissors, ShieldCheck, Tag, TrendingUp } from 'lucide-react'
import { adsSafety, analyseHours, discountStrategy, lossCut, money, rankChampions, smartStock, type HourMetric, type ProductMetric } from '@/lib/strategy-engine'
import styles from './strategy.module.css'

type Slug = 'horario-campeao' | 'horario-produto' | 'descontos' | 'produtos-campeoes' | 'corte-prejuizo' | 'estoque-inteligente' | 'ads-seguro'

const meta: Record<Slug, { title: string; description: string; icon: typeof AlarmClock }> = {
  'horario-campeao': { title: 'Horário Campeão', description: 'Encontre os horários em que sua loja gera mais pedidos, lucro e retorno de ADS. A estratégia separa horários para escalar, manter e reduzir investimento.', icon: AlarmClock },
  'horario-produto': { title: 'Horário Campeão do Produto', description: 'Analisa um produto isoladamente para descobrir quando ele vende melhor e quando o anúncio está gastando sem retorno.', icon: Package },
  descontos: { title: 'Descontos Inteligentes', description: 'Simule descontos sem destruir sua margem. O sistema calcula o desconto máximo seguro, lucro restante e ROAS mínimo depois da promoção.', icon: Tag },
  'produtos-campeoes': { title: 'Produtos Campeões', description: 'Cria um ranking de produtos usando lucro, ROAS, conversão, crescimento e estoque para indicar onde vale escalar investimento.', icon: TrendingUp },
  'corte-prejuizo': { title: 'Corte de Prejuízo', description: 'Detecta quando um anúncio está consumindo margem demais e recomenda aumentar ROAS, reduzir gasto ou pausar a campanha.', icon: Scissors },
  'estoque-inteligente': { title: 'Estoque Inteligente', description: 'Cruza estoque, velocidade de venda e prazo de reposição para evitar anunciar forte um produto que está prestes a acabar.', icon: Archive },
  'ads-seguro': { title: 'ADS Seguro', description: 'Protege seu caixa com limites de orçamento, prejuízo máximo diário e ROAS mínimo. A estratégia define quando manter, limitar ou pausar ADS.', icon: LockKeyhole },
}

const defaultHours: HourMetric[] = [
  { hour: 0, orders: 1, revenue: 42, adSpend: 8, variableCost: 18 },
  { hour: 3, orders: 0, revenue: 0, adSpend: 4, variableCost: 0 },
  { hour: 6, orders: 2, revenue: 78, adSpend: 7, variableCost: 30 },
  { hour: 9, orders: 5, revenue: 210, adSpend: 14, variableCost: 75 },
  { hour: 12, orders: 7, revenue: 298, adSpend: 18, variableCost: 103 },
  { hour: 15, orders: 4, revenue: 164, adSpend: 15, variableCost: 62 },
  { hour: 18, orders: 8, revenue: 356, adSpend: 21, variableCost: 124 },
  { hour: 21, orders: 6, revenue: 272, adSpend: 19, variableCost: 94 },
]

const defaultProducts: ProductMetric[] = [
  { name: 'Kit Colorir Anime', revenue: 1850, profit: 620, adSpend: 120, orders: 58, conversion: 4.8, growth: 26, stock: 86 },
  { name: 'Kit Festa Homem-Aranha', revenue: 1320, profit: 390, adSpend: 108, orders: 34, conversion: 3.6, growth: 18, stock: 44 },
  { name: 'Livro Faces Femininas', revenue: 890, profit: 265, adSpend: 72, orders: 31, conversion: 4.1, growth: 9, stock: 73 },
  { name: 'Livro Terror Adulto', revenue: 380, profit: 48, adSpend: 84, orders: 11, conversion: 1.7, growth: -12, stock: 28 },
  { name: 'Kit Festa K-Pop', revenue: 240, profit: -22, adSpend: 66, orders: 6, conversion: 1.2, growth: -8, stock: 51 },
]

function num(v: string) { return Number(String(v).replace(',', '.')) || 0 }
function pct(v: number) { return `${v.toFixed(1).replace('.', ',')}%` }
function roasText(v: number) { return Number.isFinite(v) ? `${v.toFixed(2).replace('.', ',')}x` : 'Sem margem' }
function statusClass(value: string) {
  const x = value.toLowerCase()
  if (x.includes('crítico') || x.includes('bloqueio') || x.includes('prejuízo')) return `${styles.tag} ${styles.tagBad}`
  if (x.includes('atenção') || x.includes('repor') || x.includes('risco') || x.includes('limite')) return `${styles.tag} ${styles.tagWarn}`
  return `${styles.tag} ${styles.tagGood}`
}

export default function StrategyDetailPage({ params }: { params: { slug: string } }) {
  const slug = params.slug as Slug
  const config = meta[slug]
  const [saved, setSaved] = useState(false)
  const [hours, setHours] = useState<HourMetric[]>(defaultHours)
  const [productName, setProductName] = useState('Meu produto')
  const [discount, setDiscount] = useState({ price: '29,90', cost: '9,50', commission: '20', fee: '4', profit: '5', discount: '10' })
  const [products, setProducts] = useState<ProductMetric[]>(defaultProducts)
  const [loss, setLoss] = useState({ revenue: '350', cost: '180', adSpend: '95', orders: '10', roasTarget: '10', minProfit: '5' })
  const [stock, setStock] = useState({ stock: '42', daily: '4', lead: '7', safety: '4' })
  const [safeAds, setSafeAds] = useState({ budget: '50', spend: '34', revenue: '290', minRoas: '7', maxLoss: '25', cost: '150' })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`strategy:${slug}`)
      if (!raw) return
      const data = JSON.parse(raw)
      if (data.hours) setHours(data.hours)
      if (data.productName) setProductName(data.productName)
      if (data.discount) setDiscount(data.discount)
      if (data.products) setProducts(data.products)
      if (data.loss) setLoss(data.loss)
      if (data.stock) setStock(data.stock)
      if (data.safeAds) setSafeAds(data.safeAds)
    } catch {}
  }, [slug])

  const hourResult = useMemo(() => analyseHours(hours), [hours])
  const discountResult = useMemo(() => discountStrategy({ price: num(discount.price), cost: num(discount.cost), commissionPct: num(discount.commission), fixedFee: num(discount.fee), minimumProfit: num(discount.profit), discountPct: num(discount.discount) }), [discount])
  const champions = useMemo(() => rankChampions(products), [products])
  const lossResult = useMemo(() => lossCut({ revenue: num(loss.revenue), cost: num(loss.cost), adSpend: num(loss.adSpend), orders: num(loss.orders), currentRoasTarget: num(loss.roasTarget), minimumProfitPerOrder: num(loss.minProfit) }), [loss])
  const stockResult = useMemo(() => smartStock({ stock: num(stock.stock), avgDailySales: num(stock.daily), leadTimeDays: num(stock.lead), safetyDays: num(stock.safety) }), [stock])
  const adsResult = useMemo(() => adsSafety({ dailyBudget: num(safeAds.budget), spendToday: num(safeAds.spend), revenueToday: num(safeAds.revenue), minimumRoas: num(safeAds.minRoas), maxLossDay: num(safeAds.maxLoss), productCostToday: num(safeAds.cost) }), [safeAds])

  if (!config) return <main className={styles.page}><div className={styles.wrap}><Link className={styles.back} href="/strategies"><ArrowLeft size={15}/> Estratégias</Link><div className={styles.panel}><div className={styles.empty}>Estratégia não encontrada.</div></div></div></main>
  const Icon = config.icon

  function save() {
    const data = { hours, productName, discount, products, loss, stock, safeAds, savedAt: new Date().toISOString() }
    localStorage.setItem(`strategy:${slug}`, JSON.stringify(data))
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  function updateHour(index: number, key: keyof HourMetric, value: string) {
    setHours(prev => prev.map((row, i) => i === index ? { ...row, [key]: num(value) } : row))
  }

  function updateProduct(index: number, key: keyof ProductMetric, value: string) {
    setProducts(prev => prev.map((row, i) => i === index ? { ...row, [key]: key === 'name' ? value : num(value) } as ProductMetric : row))
  }

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <Link className={styles.back} href="/strategies"><ArrowLeft size={15}/> Estratégias</Link>
        <header className={styles.hero}>
          <div><h1><Icon size={30}/> {config.title}</h1><p>{config.description}</p></div>
          <span className={styles.badge}>✓ Estratégia pronta</span>
        </header>

        {(slug === 'horario-campeao' || slug === 'horario-produto') && (
          <section className={styles.panel}>
            <div className={styles.panelHeader}><div><h2>{slug === 'horario-produto' ? 'Mapa de horário do produto' : 'Mapa de horário da loja'}</h2><p>Edite os dados ou, futuramente, deixe a Shopee preencher automaticamente. A pontuação favorece lucro, pedidos e ROAS ao mesmo tempo.</p></div><button className={styles.saveButton} onClick={save}>Salvar estratégia</button></div>
            <div className={styles.body}>
              {slug === 'horario-produto' && <div className={`${styles.grid} ${styles.grid2}`}><label className={styles.label}><span>Produto analisado</span><input value={productName} onChange={e => setProductName(e.target.value)}/></label><div className={styles.recommendation}><Package size={20}/><div><strong>Análise isolada</strong><p>Os horários abaixo serão considerados apenas para {productName || 'este produto'}.</p></div></div></div>}
              <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Faixa</th><th>Pedidos</th><th>Faturamento</th><th>ADS</th><th>Custos</th><th>Lucro</th><th>ROAS</th><th>Decisão</th></tr></thead><tbody>{hourResult.scored.map((row, i) => { const champion = hourResult.top.includes(row.hour); const weak = hourResult.weak.includes(row.hour); return <tr key={row.hour}><td><strong>{String(row.hour).padStart(2,'0')}:00–{String((row.hour+3)%24).padStart(2,'0')}:00</strong></td><td><input value={row.orders} onChange={e=>updateHour(i,'orders',e.target.value)}/></td><td><input value={row.revenue} onChange={e=>updateHour(i,'revenue',e.target.value)}/></td><td><input value={row.adSpend} onChange={e=>updateHour(i,'adSpend',e.target.value)}/></td><td><input value={row.variableCost || 0} onChange={e=>updateHour(i,'variableCost',e.target.value)}/></td><td>{money(row.profit)}</td><td>{roasText(row.roas)}</td><td>{champion ? <span className={`${styles.tag} ${styles.tagGood}`}>Escalar +15%</span> : weak ? <span className={`${styles.tag} ${styles.tagBad}`}>Reduzir 30%</span> : <span className={`${styles.tag} ${styles.tagWarn}`}>Manter</span>}</td></tr>})}</tbody></table></div>
              <div className={styles.bars}>{hourResult.scored.map(row => <div key={row.hour} className={styles.bar} style={{height:`${Math.max(8, Math.min(125, row.score))}px`}}><em>{String(row.hour).padStart(2,'0')}h</em></div>)}</div>
              <div className={styles.recommendation}><BarChart3 size={21}/><div><strong>Regra automática</strong><p>Horários no top 25% recebem recomendação de +15% de intensidade. Os 20% mais fracos recebem redução de 30%. O restante mantém a configuração atual. Nenhuma mudança real será aplicada sem a integração de ADS.</p></div></div>
              {saved && <span className={styles.saved}>✓ Estratégia salva neste navegador</span>}
            </div>
          </section>
        )}

        {slug === 'descontos' && (
          <section className={styles.panel}>
            <div className={styles.panelHeader}><div><h2>Simulador de desconto seguro</h2><p>O desconto só é considerado saudável quando ainda sobra o lucro mínimo que você definiu.</p></div><button className={styles.saveButton} onClick={save}>Salvar estratégia</button></div>
            <div className={styles.body}>
              <div className={styles.grid}><label className={styles.label}><span>Preço normal (R$)</span><input value={discount.price} onChange={e=>setDiscount({...discount,price:e.target.value})}/></label><label className={styles.label}><span>Custo do produto (R$)</span><input value={discount.cost} onChange={e=>setDiscount({...discount,cost:e.target.value})}/></label><label className={styles.label}><span>Comissão Shopee (%)</span><input value={discount.commission} onChange={e=>setDiscount({...discount,commission:e.target.value})}/></label><label className={styles.label}><span>Taxas fixas (R$)</span><input value={discount.fee} onChange={e=>setDiscount({...discount,fee:e.target.value})}/></label><label className={styles.label}><span>Lucro mínimo desejado</span><input value={discount.profit} onChange={e=>setDiscount({...discount,profit:e.target.value})}/></label><label className={styles.label}><span>Desconto que quer testar (%)</span><input value={discount.discount} onChange={e=>setDiscount({...discount,discount:e.target.value})}/></label></div>
              <div className={styles.results}><div className={styles.result}><span>Preço promocional</span><strong>{money(discountResult.salePrice)}</strong></div><div className={styles.result}><span>Lucro antes do ADS</span><strong>{money(discountResult.profitBeforeAds)}</strong></div><div className={styles.result}><span>Máx. gasto ADS/venda</span><strong>{money(discountResult.maxAdSpendPerSale)}</strong></div><div className={`${styles.result} ${discountResult.safe ? styles.good : styles.bad}`}><span>Desconto máximo seguro</span><strong>{pct(discountResult.maxSafeDiscountPct)}</strong></div></div>
              <div className={styles.recommendation}><ShieldCheck size={21}/><div><strong>{discountResult.safe ? 'Desconto aprovado pela estratégia' : 'Desconto perigoso'}</strong><p>{discountResult.safe ? `Com ${discount.discount}% de desconto ainda sobra margem. Se usar ADS, tente manter ROAS em pelo menos ${roasText(discountResult.breakEvenRoas)}.` : `Esse desconto derruba o lucro abaixo do mínimo. Limite sugerido: ${pct(discountResult.maxSafeDiscountPct)}.`}</p></div></div>
            </div>
          </section>
        )}

        {slug === 'produtos-campeoes' && (
          <section className={styles.panel}>
            <div className={styles.panelHeader}><div><h2>Ranking de potencial de escala</h2><p>Pontuação própria: margem 30%, ROAS 25%, conversão 20%, crescimento 15% e estoque 10% aproximadamente. Produtos sem lucro nunca recebem ordem de escala.</p></div><button className={styles.saveButton} onClick={save}>Salvar estratégia</button></div>
            <div className={styles.body}>
              <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Produto</th><th>Faturamento</th><th>Lucro</th><th>ADS</th><th>Conversão %</th><th>Crescimento %</th><th>Estoque</th><th>Score</th><th>Ação</th></tr></thead><tbody>{champions.map(row => { const original = products.findIndex(p=>p.name===row.name); return <tr key={row.name}><td><input style={{width:180}} value={row.name} onChange={e=>updateProduct(original,'name',e.target.value)}/></td><td><input value={row.revenue} onChange={e=>updateProduct(original,'revenue',e.target.value)}/></td><td><input value={row.profit} onChange={e=>updateProduct(original,'profit',e.target.value)}/></td><td><input value={row.adSpend} onChange={e=>updateProduct(original,'adSpend',e.target.value)}/></td><td><input value={row.conversion} onChange={e=>updateProduct(original,'conversion',e.target.value)}/></td><td><input value={row.growth} onChange={e=>updateProduct(original,'growth',e.target.value)}/></td><td><input value={row.stock} onChange={e=>updateProduct(original,'stock',e.target.value)}/></td><td><strong>{row.score.toFixed(0)}</strong></td><td><span className={row.action==='Escalar ADS'?`${styles.tag} ${styles.tagGood}`:row.action==='Corrigir margem'?`${styles.tag} ${styles.tagBad}`:`${styles.tag} ${styles.tagWarn}`}>{row.action}</span></td></tr>})}</tbody></table></div>
              <div className={styles.recommendation}><TrendingUp size={21}/><div><strong>Regra de escala</strong><p>Score ≥ 65 + lucro positivo + estoque acima de 10 = escalar ADS. Score 45–64 = otimizar e testar. Produto no prejuízo = corrigir margem antes de investir mais.</p></div></div>
            </div>
          </section>
        )}

        {slug === 'corte-prejuizo' && (
          <section className={styles.panel}>
            <div className={styles.panelHeader}><div><h2>Proteção contra gasto improdutivo</h2><p>A regra compara faturamento, custos, ADS, pedidos e lucro mínimo desejado por pedido.</p></div><button className={styles.saveButton} onClick={save}>Salvar estratégia</button></div>
            <div className={styles.body}><div className={styles.grid}><label className={styles.label}><span>Faturamento do ciclo</span><input value={loss.revenue} onChange={e=>setLoss({...loss,revenue:e.target.value})}/></label><label className={styles.label}><span>Custos dos produtos</span><input value={loss.cost} onChange={e=>setLoss({...loss,cost:e.target.value})}/></label><label className={styles.label}><span>Gasto em ADS</span><input value={loss.adSpend} onChange={e=>setLoss({...loss,adSpend:e.target.value})}/></label><label className={styles.label}><span>Pedidos</span><input value={loss.orders} onChange={e=>setLoss({...loss,orders:e.target.value})}/></label><label className={styles.label}><span>ROAS alvo atual</span><input value={loss.roasTarget} onChange={e=>setLoss({...loss,roasTarget:e.target.value})}/></label><label className={styles.label}><span>Lucro mínimo por pedido</span><input value={loss.minProfit} onChange={e=>setLoss({...loss,minProfit:e.target.value})}/></label></div>
              <div className={styles.results}><div className={`${styles.result} ${lossResult.profit<0?styles.bad:styles.good}`}><span>Lucro do ciclo</span><strong>{money(lossResult.profit)}</strong></div><div className={styles.result}><span>Lucro por pedido</span><strong>{money(lossResult.profitPerOrder)}</strong></div><div className={styles.result}><span>ROAS real</span><strong>{roasText(lossResult.realRoas)}</strong></div><div className={styles.highlight+' '+styles.result}><span>ROAS sugerido</span><strong>{lossResult.suggestedRoas.toFixed(1)}x</strong></div></div>
              <div className={styles.recommendation}><Scissors size={21}/><div><strong>{lossResult.action}</strong><p>Se houver gasto e zero pedidos, a regra manda pausar. Se o lucro ficar negativo, sobe ROAS em +5x. Se ainda houver lucro, mas abaixo da meta, sobe +3x.</p></div></div>
            </div>
          </section>
        )}

        {slug === 'estoque-inteligente' && (
          <section className={styles.panel}>
            <div className={styles.panelHeader}><div><h2>Controle de cobertura e reposição</h2><p>Calcula quantos dias o estoque aguenta e decide se o ADS pode continuar, deve reduzir ou precisa pausar.</p></div><button className={styles.saveButton} onClick={save}>Salvar estratégia</button></div>
            <div className={styles.body}><div className={styles.grid}><label className={styles.label}><span>Estoque atual</span><input value={stock.stock} onChange={e=>setStock({...stock,stock:e.target.value})}/></label><label className={styles.label}><span>Venda média por dia</span><input value={stock.daily} onChange={e=>setStock({...stock,daily:e.target.value})}/></label><label className={styles.label}><span>Prazo para repor (dias)</span><input value={stock.lead} onChange={e=>setStock({...stock,lead:e.target.value})}/></label><label className={styles.label}><span>Estoque de segurança (dias)</span><input value={stock.safety} onChange={e=>setStock({...stock,safety:e.target.value})}/></label></div>
              <div className={styles.results}><div className={styles.result}><span>Dias de estoque</span><strong>{stockResult.daysOfStock>=900?'Sem giro':stockResult.daysOfStock.toFixed(1)}</strong></div><div className={styles.result}><span>Ponto de reposição</span><strong>{stockResult.reorderPoint} un.</strong></div><div className={styles.result}><span>Pedido sugerido</span><strong>{stockResult.suggestedOrder} un.</strong></div><div className={styles.result}><span>Status</span><strong><span className={statusClass(stockResult.status)}>{stockResult.status}</span></strong></div></div>
              <div className={styles.recommendation}><Archive size={21}/><div><strong>{stockResult.adAction}</strong><p>Se o estoque cair abaixo do ponto de reposição, o sistema reduz a agressividade do ADS para evitar ruptura. Em nível crítico, recomenda pausar ou limitar investimento.</p></div></div>
            </div>
          </section>
        )}

        {slug === 'ads-seguro' && (
          <section className={styles.panel}>
            <div className={styles.panelHeader}><div><h2>Firewall financeiro para ADS</h2><p>Use limites absolutos para impedir que uma campanha ruim consuma o caixa do dia.</p></div><button className={styles.saveButton} onClick={save}>Salvar estratégia</button></div>
            <div className={styles.body}><div className={styles.grid}><label className={styles.label}><span>Orçamento diário</span><input value={safeAds.budget} onChange={e=>setSafeAds({...safeAds,budget:e.target.value})}/></label><label className={styles.label}><span>Gasto hoje</span><input value={safeAds.spend} onChange={e=>setSafeAds({...safeAds,spend:e.target.value})}/></label><label className={styles.label}><span>Faturamento hoje</span><input value={safeAds.revenue} onChange={e=>setSafeAds({...safeAds,revenue:e.target.value})}/></label><label className={styles.label}><span>Custos dos produtos hoje</span><input value={safeAds.cost} onChange={e=>setSafeAds({...safeAds,cost:e.target.value})}/></label><label className={styles.label}><span>ROAS mínimo</span><input value={safeAds.minRoas} onChange={e=>setSafeAds({...safeAds,minRoas:e.target.value})}/></label><label className={styles.label}><span>Prejuízo máximo no dia</span><input value={safeAds.maxLoss} onChange={e=>setSafeAds({...safeAds,maxLoss:e.target.value})}/></label></div>
              <div className={styles.results}><div className={styles.result}><span>Orçamento usado</span><strong>{pct(adsResult.budgetUsedPct)}</strong></div><div className={styles.result}><span>ROAS atual</span><strong>{roasText(adsResult.roas)}</strong></div><div className={`${styles.result} ${adsResult.grossAfterAds<0?styles.bad:styles.good}`}><span>Resultado após ADS</span><strong>{money(adsResult.grossAfterAds)}</strong></div><div className={styles.result}><span>Status</span><strong><span className={statusClass(adsResult.status)}>{adsResult.status}</span></strong></div></div>
              <div className={styles.rules}><div className={styles.rule}><strong>Prejuízo máximo atingido</strong><span>Pausa ADS até a próxima revisão.</span></div><div className={styles.rule}><strong>70% do orçamento + ROAS ruim</strong><span>Reduz gasto e sobe ROAS alvo.</span></div><div className={styles.rule}><strong>100% do orçamento + ROAS abaixo da meta</strong><span>Não permite orçamento adicional.</span></div><div className={styles.rule}><strong>ROAS 25% acima da meta</strong><span>Pode liberar até 15% a mais, se ainda houver orçamento.</span></div></div>
              <div className={styles.recommendation}><LockKeyhole size={21}/><div><strong>{adsResult.action}</strong><p>Essa é a ação atual calculada pela sua configuração. Quando conectarmos a API de ADS, ela pode virar alerta ou automação controlada.</p></div></div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
