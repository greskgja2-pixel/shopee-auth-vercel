'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowLeft, Lightbulb, Save, ShieldCheck, Target } from 'lucide-react'
import styles from './meta.module.css'

const decisions = [
  { tone: 'bad', icon: '●', situation: 'Ruim', condition: 'Lucro furou ou gastou sem retorno', action: 'ROAS sobe +5x' },
  { tone: 'warn', icon: '●', situation: 'Alerta', condition: 'Volume bom, mas lucro abaixo do mínimo', action: 'ROAS sobe +5x' },
  { tone: 'info', icon: '●', situation: 'Eficiente', condition: 'ROAS muito alto, volume baixo (Ads tímido)', action: 'ROAS desce −5x' },
  { tone: 'info', icon: '●', situation: 'Baixo volume', condition: 'Lucrativo, mas vendendo pouco', action: 'ROAS desce −5x' },
  { tone: 'ok', icon: '●', situation: 'OK', condition: 'Dentro da meta e lucrativo', action: 'ROAS mantém' },
  { tone: 'waiting', icon: '⌛', situation: 'Aguardando', condition: 'Ciclo ainda não terminou', action: 'Nenhuma — espera o ciclo' },
  { tone: 'muted', icon: '⏭', situation: 'Ignorado', condition: 'Estratégia pausada ou sem campanha', action: 'Nenhuma' },
]

function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function MetaPorVendaPage() {
  const [price, setPrice] = useState('22,90')
  const [cost, setCost] = useState('7,00')
  const [commission, setCommission] = useState('20')
  const [fixedFee, setFixedFee] = useState('4,00')
  const [desiredProfit, setDesiredProfit] = useState('5,00')
  const [monthlyGoal, setMonthlyGoal] = useState('100')
  const [cycleDays, setCycleDays] = useState('7')
  const [profitTolerance, setProfitTolerance] = useState('10')
  const [salesTolerance, setSalesTolerance] = useState('10')
  const [spendTolerance, setSpendTolerance] = useState('10')
  const [saved, setSaved] = useState(false)

  const calc = useMemo(() => {
    const parse = (v: string) => Number(v.replace('.', '').replace(',', '.')) || 0
    const p = parse(price)
    const c = parse(cost)
    const pct = parse(commission) / 100
    const fee = parse(fixedFee)
    const profit = parse(desiredProfit)
    const commissionValue = p * pct
    const beforeAds = p - commissionValue - fee - c
    const maxSpend = Math.max(0, beforeAds - profit)
    const minRoas = maxSpend > 0 ? p / maxSpend : 0
    return { p, c, commissionValue, fee, profit, beforeAds, maxSpend, minRoas }
  }, [price, cost, commission, fixedFee, desiredProfit])

  function saveStrategy() {
    const payload = {
      price, cost, commission, fixedFee, desiredProfit, monthlyGoal, cycleDays,
      tolerances: { profit: profitTolerance, sales: salesTolerance, spend: spendTolerance },
      calculated: calc,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem('strategy-meta-por-venda', JSON.stringify(payload))
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <Link className={styles.back} href="/strategies"><ArrowLeft size={15} /> Estratégias</Link>

        <header className={styles.hero}>
          <h1><Target size={28} /> Meta por Venda</h1>
          <p>Defina, por produto, quantas unidades quer vender no mês e o lucro mínimo por venda. O sistema calcula o gasto máximo em Ads por venda e o ROAS mínimo necessário — e só sugere ajustes, nunca bloqueia orçamento.</p>
        </header>

        <section className={styles.infoBox}>
          <div className={styles.infoTitle}><Lightbulb size={17} /> Como Funciona</div>
          <div className={styles.infoBody}>
            <p><strong>Resumo:</strong> você define, por produto, a meta mensal de vendas e o lucro mínimo por venda. O sistema calcula automaticamente o gasto máximo com Ads e o ROAS mínimo necessário.</p>

            <h3>Fluxo:</h3>
            <ol>
              <li>Configure meta mensal, lucro mínimo e ciclo de avaliação</li>
              <li>Simule para ver os números calculados</li>
              <li>Salve a estratégia — o ROAS alvo poderá ser aplicado à campanha Shopee quando a permissão de Ads estiver conectada</li>
              <li>O robô monitora a cada ciclo e sugere ajustes de ROAS automaticamente</li>
            </ol>

            <h3>Exemplo prático:</h3>
            <div className={styles.example}>
              <p>Produto a <strong>R$ 22,90</strong>, custo da matéria-prima <strong>R$ 7,00</strong>, lucro desejado <strong>R$ 5,00/venda</strong>.</p>
              <p>→ Comissão Shopee (20%) = R$ 4,58 · Taxa fixa = R$ 4,00</p>
              <p>→ Lucro antes do Ads = 22,90 − 4,58 − 4,00 − 7,00 = <strong>R$ 7,32</strong></p>
              <p>→ Gasto máximo por venda = 7,32 − 5,00 = <strong>R$ 2,32</strong></p>
              <p>→ ROAS mínimo = 22,90 ÷ 2,32 = <strong>9,87x</strong></p>
              <small>Com margem apertada, o ROAS precisa ser alto — o robô será mais rígido para proteger seu lucro.</small>
            </div>

            <h3>Tabela de decisões do robô:</h3>
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th>Situação</th><th>Condição</th><th>Ação</th></tr></thead>
                <tbody>
                  {decisions.map(row => (
                    <tr key={row.situation}>
                      <td><span className={`${styles.status} ${styles[row.tone]}`}>{row.icon} {row.situation}</span></td>
                      <td>{row.condition}</td>
                      <td>{row.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3>Margem de tolerância:</h3>
            <div className={styles.toleranceText}>
              <p>Você define 3 tolerâncias (padrão 10% cada):</p>
              <p>• <strong>Lucro</strong> — se o ROAS real estiver até X% abaixo do mínimo, o robô ainda considera aceitável.</p>
              <p>• <strong>Vendas</strong> — se as vendas estiverem até X% abaixo da meta do ciclo, o robô ainda considera que bateu a meta.</p>
              <p>• <strong>Gasto</strong> — margem de flexibilidade sobre o gasto máximo permitido.</p>
              <small>Quanto menor a %, mais rígido o robô. Com 0%, qualquer desvio já gera ajuste.</small>
            </div>

            <p className={styles.security}><ShieldCheck size={17} /><span><strong>Segurança:</strong> o ROAS nunca desce abaixo do mínimo calculado. Se você alterar o ROAS manualmente na Shopee, a automação deve pausar para não sobrescrever sua decisão.</span></p>
          </div>
        </section>

        <section className={styles.configBox}>
          <div className={styles.configHeader}>
            <div><span>Configuração</span><h2>Simule sua Meta por Venda</h2><p>Os cálculos abaixo funcionam agora. A aplicação automática na Shopee dependerá da permissão da API de Ads.</p></div>
            <button onClick={saveStrategy}><Save size={16} /> Salvar estratégia</button>
          </div>

          {saved && <div className={styles.saved}>✓ Estratégia salva neste navegador.</div>}

          <div className={styles.grid}>
            <label><span>Preço do produto (R$)</span><input value={price} onChange={e => setPrice(e.target.value)} /></label>
            <label><span>Custo do produto (R$)</span><input value={cost} onChange={e => setCost(e.target.value)} /></label>
            <label><span>Comissão Shopee (%)</span><input value={commission} onChange={e => setCommission(e.target.value)} /></label>
            <label><span>Taxas fixas (R$)</span><input value={fixedFee} onChange={e => setFixedFee(e.target.value)} /></label>
            <label><span>Lucro mínimo por venda (R$)</span><input value={desiredProfit} onChange={e => setDesiredProfit(e.target.value)} /></label>
            <label><span>Meta de vendas no mês</span><input value={monthlyGoal} onChange={e => setMonthlyGoal(e.target.value)} /></label>
            <label><span>Ciclo de avaliação (dias)</span><input value={cycleDays} onChange={e => setCycleDays(e.target.value)} /></label>
          </div>

          <div className={styles.results}>
            <div><span>Comissão estimada</span><strong>{money(calc.commissionValue)}</strong></div>
            <div><span>Lucro antes do Ads</span><strong>{money(calc.beforeAds)}</strong></div>
            <div><span>Gasto máximo por venda</span><strong>{money(calc.maxSpend)}</strong></div>
            <div className={styles.highlight}><span>ROAS mínimo</span><strong>{calc.minRoas ? `${calc.minRoas.toFixed(2).replace('.', ',')}x` : '—'}</strong></div>
          </div>

          <h3 className={styles.toleranceTitle}>Tolerâncias do robô</h3>
          <div className={styles.toleranceGrid}>
            <label><span>Lucro (%)</span><input value={profitTolerance} onChange={e => setProfitTolerance(e.target.value)} /></label>
            <label><span>Vendas (%)</span><input value={salesTolerance} onChange={e => setSalesTolerance(e.target.value)} /></label>
            <label><span>Gasto (%)</span><input value={spendTolerance} onChange={e => setSpendTolerance(e.target.value)} /></label>
          </div>
        </section>
      </div>
    </main>
  )
}
