'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  BadgeDollarSign,
  BarChart3,
  Box,
  Calculator,
  Check,
  ChevronDown,
  ClipboardCopy,
  Package,
  Percent,
  Share2,
  ShoppingBag,
  Target,
  TrendingUp,
} from 'lucide-react'
import styles from './calculator.module.css'

type Mode = 'margin' | 'price' | 'profit'
type SellerType = 'cnpj' | 'cpf'

type FormState = {
  sellerType: SellerType
  productCost: string
  packagingCost: string
  isKit: boolean
  kitQty: string
  mode: Mode
  marginTarget: string
  salePrice: string
  profitTarget: string
  taxRate: string
  roasDesired: string
  marketPrice: string
  monthlySales: string
  commissionRate: string
  fixedFee: string
  marketingRate: string
  couponCost: string
}

const initialState: FormState = {
  sellerType: 'cnpj',
  productCost: '4,50',
  packagingCost: '0,20',
  isKit: false,
  kitQty: '2',
  mode: 'margin',
  marginTarget: '20',
  salePrice: '14,50',
  profitTarget: '2,90',
  taxRate: '',
  roasDesired: '',
  marketPrice: '',
  monthlySales: '',
  commissionRate: '20',
  fixedFee: '4,00',
  marketingRate: '',
  couponCost: '',
}

const STORAGE_KEY = 'shopee-price-calculator-v1'

function n(value: string) {
  const normalized = String(value || '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(value) ? value : 0)
}

function pct(value: number) {
  return `${(Number.isFinite(value) ? value : 0).toFixed(1).replace('.', ',')}%`
}

export default function CalculatorPage() {
  const [form, setForm] = useState<FormState>(initialState)
  const [feesOpen, setFeesOpen] = useState(false)
  const [marketingOpen, setMarketingOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setForm({ ...initialState, ...JSON.parse(raw) })
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
      setSaved(true)
      const timer = setTimeout(() => setSaved(false), 900)
      return () => clearTimeout(timer)
    } catch {}
  }, [form])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const calc = useMemo(() => {
    const qty = form.isKit ? Math.max(1, Math.floor(n(form.kitQty))) : 1
    const productCost = n(form.productCost) * qty
    const packaging = n(form.packagingCost)
    const commissionRate = n(form.commissionRate) / 100
    const taxRate = n(form.taxRate) / 100
    const marketingRate = n(form.marketingRate) / 100
    const variableRate = commissionRate + taxRate + marketingRate
    const fixedFee = n(form.fixedFee)
    const couponCost = n(form.couponCost)
    const fixedBase = productCost + packaging + fixedFee + couponCost

    let price = 0
    let invalidTarget = false
    if (form.mode === 'margin') {
      const margin = n(form.marginTarget) / 100
      const denominator = 1 - variableRate - margin
      if (denominator <= 0.001) invalidTarget = true
      price = denominator > 0.001 ? fixedBase / denominator : 0
    } else if (form.mode === 'profit') {
      const denominator = 1 - variableRate
      if (denominator <= 0.001) invalidTarget = true
      price = denominator > 0.001 ? (fixedBase + n(form.profitTarget)) / denominator : 0
    } else {
      price = n(form.salePrice)
    }

    const commission = price * commissionRate
    const tax = price * taxRate
    const marketing = price * marketingRate
    const shopeeFees = commission + fixedFee
    const totalCosts = productCost + packaging + commission + fixedFee + tax + marketing + couponCost
    const profit = price - totalCosts
    const margin = price > 0 ? (profit / price) * 100 : 0
    const breakEvenRoas = profit > 0 ? price / profit : 0
    const suggestedRoas = breakEvenRoas > 0 ? Math.max(2, breakEvenRoas * 1.25) : 0
    const requestedRoas = n(form.roasDesired)
    const effectiveRoas = requestedRoas > 0 ? requestedRoas : suggestedRoas
    const adSpendPerSale = effectiveRoas > 0 ? price / effectiveRoas : 0
    const profitAfterAds = profit - adSpendPerSale
    const monthlySales = Math.max(0, Math.floor(n(form.monthlySales)))
    const monthlyRevenue = price * monthlySales
    const monthlyProfit = profit * monthlySales
    const monthlyProfitAfterAds = profitAfterAds * monthlySales
    const marketPrice = n(form.marketPrice)
    const marketDiff = marketPrice > 0 ? ((price - marketPrice) / marketPrice) * 100 : 0

    return {
      qty,
      productCost,
      packaging,
      commissionRate,
      commission,
      fixedFee,
      tax,
      marketing,
      couponCost,
      shopeeFees,
      totalCosts,
      price,
      profit,
      margin,
      breakEvenRoas,
      suggestedRoas,
      effectiveRoas,
      adSpendPerSale,
      profitAfterAds,
      monthlySales,
      monthlyRevenue,
      monthlyProfit,
      monthlyProfitAfterAds,
      marketPrice,
      marketDiff,
      invalidTarget,
    }
  }, [form])

  const donut = useMemo(() => {
    const slices = [
      { label: 'Produto', value: Math.max(calc.productCost, 0), color: '#4b5563' },
      { label: 'Embalagem', value: Math.max(calc.packaging, 0), color: '#9ca3af' },
      { label: 'Comissão', value: Math.max(calc.commission, 0), color: '#cbd5e1' },
      { label: 'Taxa fixa', value: Math.max(calc.fixedFee, 0), color: '#e5e7eb' },
      { label: 'Impostos/marketing', value: Math.max(calc.tax + calc.marketing + calc.couponCost, 0), color: '#f3f4f6' },
      { label: calc.profit >= 0 ? 'Lucro líquido' : 'Prejuízo', value: Math.max(Math.abs(calc.profit), 0), color: calc.profit >= 0 ? '#16a34a' : '#dc2626' },
    ]
    const total = slices.reduce((sum, s) => sum + s.value, 0) || 1
    let cursor = 0
    const stops = slices.map(s => {
      const start = cursor
      cursor += (s.value / total) * 100
      return `${s.color} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`
    })
    return { background: `conic-gradient(${stops.join(',')})`, slices }
  }, [calc])

  const copySummary = async () => {
    const text = [
      'CALCULADORA DE PREÇO SHOPEE',
      `Tipo de vendedor: ${form.sellerType.toUpperCase()}`,
      `Preço sugerido: ${brl(calc.price)}`,
      `Custo do produto: ${brl(calc.productCost)}`,
      `Embalagem: ${brl(calc.packaging)}`,
      `Taxas Shopee: ${brl(calc.shopeeFees)}`,
      `Impostos/marketing: ${brl(calc.tax + calc.marketing + calc.couponCost)}`,
      `Lucro líquido antes de Ads: ${brl(calc.profit)} (${pct(calc.margin)})`,
      `ROAS de equilíbrio: ${calc.breakEvenRoas ? calc.breakEvenRoas.toFixed(2).replace('.', ',') + 'x' : '—'}`,
      `ROAS sugerido: ${calc.suggestedRoas ? calc.suggestedRoas.toFixed(2).replace('.', ',') + 'x' : '—'}`,
      form.roasDesired ? `ROAS informado: ${calc.effectiveRoas.toFixed(2).replace('.', ',')}x` : '',
      form.roasDesired ? `Lucro estimado após Ads: ${brl(calc.profitAfterAds)}` : '',
    ].filter(Boolean).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {}
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.eyebrow}>Ferramentas</span>
            <h1><Calculator size={30} /> Calculadora de Preço Shopee</h1>
            <p>Descubra o preço de venda, lucro líquido e ROAS necessário sem perder sua margem.</p>
          </div>
          <nav className={styles.nav}>
            <Link href="/products">Produtos</Link>
            <Link href="/ads">Shopee ADS</Link>
            <Link href="/strategies">Estratégias</Link>
            <Link className={styles.activeNav} href="/calculator">Calculadora</Link>
          </nav>
        </header>

        <div className={styles.mainGrid}>
          <section className={styles.card}>
            <div className={styles.greenHead}>
              <div><BadgeDollarSign size={25} /><strong>Dados do Produto</strong></div>
              <span>Taxas configuráveis 2026</span>
            </div>

            <div className={styles.body}>
              <div className={styles.sectionTitle}><span className={styles.dot} /> Campos obrigatórios</div>
              <label className={styles.label}>Tipo de Vendedor</label>
              <div className={styles.segmented}>
                <button className={form.sellerType === 'cnpj' ? styles.selected : ''} onClick={() => update('sellerType', 'cnpj')}>CNPJ</button>
                <button className={form.sellerType === 'cpf' ? styles.selected : ''} onClick={() => update('sellerType', 'cpf')}>CPF</button>
              </div>

              <div className={styles.twoCols}>
                <Field icon={<Box size={15} />} label="Custo do Produto unitário (R$)" value={form.productCost} onChange={v => update('productCost', v)} required />
                <Field icon={<Package size={15} />} label="Custo da Embalagem (R$)" value={form.packagingCost} onChange={v => update('packagingCost', v)} required />
              </div>

              <label className={styles.checkRow}>
                <input type="checkbox" checked={form.isKit} onChange={e => update('isKit', e.target.checked)} />
                <Package size={17} />
                <span>Este anúncio é um kit com múltiplos produtos?</span>
              </label>
              {form.isKit && (
                <div className={styles.kitBox}>
                  <Field label="Quantidade de produtos no kit" value={form.kitQty} onChange={v => update('kitQty', v)} />
                  <small>O custo do produto será multiplicado por {calc.qty}.</small>
                </div>
              )}

              <label className={styles.label}>Como você quer calcular o preço?</label>
              <div className={styles.modeGrid}>
                <ModeButton active={form.mode === 'margin'} onClick={() => update('mode', 'margin')} icon={<TrendingUp />} title="Margem de Lucro" subtitle="Define o lucro (%)" />
                <ModeButton active={form.mode === 'price'} onClick={() => update('mode', 'price')} icon={<BadgeDollarSign />} title="Preço de Venda" subtitle="Define o preço (R$)" />
                <ModeButton active={form.mode === 'profit'} onClick={() => update('mode', 'profit')} icon={<Target />} title="Lucro Desejado" subtitle="Define o lucro (R$)" />
              </div>

              {form.mode === 'margin' && <Field icon={<Percent size={15} />} label="Margem de Lucro Desejada (%)" value={form.marginTarget} onChange={v => update('marginTarget', v)} required />}
              {form.mode === 'price' && <Field icon={<BadgeDollarSign size={15} />} label="Preço de Venda desejado (R$)" value={form.salePrice} onChange={v => update('salePrice', v)} required />}
              {form.mode === 'profit' && <Field icon={<Target size={15} />} label="Lucro Desejado por venda (R$)" value={form.profitTarget} onChange={v => update('profitTarget', v)} required />}

              {calc.invalidTarget && <div className={styles.errorBox}>A soma de margem + taxas percentuais ficou igual ou acima de 100%. Reduza algum percentual.</div>}

              <div className={styles.divider} />
              <div className={styles.sectionTitle}><span className={styles.mutedDot} /> Outras configurações</div>
              <div className={styles.twoCols}>
                <Field icon={<Percent size={15} />} label="Imposto (%)" value={form.taxRate} onChange={v => update('taxRate', v)} placeholder="Ex: 5" note="Salvo automaticamente" />
                <Field icon={<Target size={15} />} label="ROAS Desejado (Shopee Ads)" value={form.roasDesired} onChange={v => update('roasDesired', v)} placeholder="Ex: 10 ou deixe em branco" note={`Sugestão atual: ${calc.suggestedRoas ? calc.suggestedRoas.toFixed(2).replace('.', ',') + 'x' : '—'}`} />
                <Field icon={<Target size={15} />} label="Preço Médio do Mercado (R$)" value={form.marketPrice} onChange={v => update('marketPrice', v)} placeholder="Ex: 52,90" />
                <Field icon={<TrendingUp size={15} />} label="Vendas Estimadas deste anúncio p/ mês" value={form.monthlySales} onChange={v => update('monthlySales', v)} placeholder="Ex: 100" />
              </div>

              <button className={styles.accordionButton} onClick={() => setFeesOpen(v => !v)}>
                <span><Calculator size={17} /> Configuração de Taxas Shopee</span><ChevronDown className={feesOpen ? styles.rotate : ''} size={18} />
              </button>
              {feesOpen && (
                <div className={styles.accordionPanel}>
                  <p>O preset inicial usa <strong>20% de comissão + R$ 4,00 de taxa fixa</strong>, exatamente como no exemplo visual enviado. Ajuste estes valores sempre que sua conta/categoria tiver regras diferentes.</p>
                  <div className={styles.twoCols}>
                    <Field label="Comissão Shopee (%)" value={form.commissionRate} onChange={v => update('commissionRate', v)} />
                    <Field label="Taxa fixa por pedido (R$)" value={form.fixedFee} onChange={v => update('fixedFee', v)} />
                  </div>
                </div>
              )}

              <button className={styles.accordionButton} onClick={() => setMarketingOpen(v => !v)}>
                <span><ShoppingBag size={17} /> Central de Marketing (Opcional)</span><ChevronDown className={marketingOpen ? styles.rotate : ''} size={18} />
              </button>
              {marketingOpen && (
                <div className={styles.accordionPanel}>
                  <div className={styles.twoCols}>
                    <Field label="Comissão extra / marketing (%)" value={form.marketingRate} onChange={v => update('marketingRate', v)} placeholder="Ex: 3" />
                    <Field label="Custo de cupom por venda (R$)" value={form.couponCost} onChange={v => update('couponCost', v)} placeholder="Ex: 1,50" />
                  </div>
                </div>
              )}

              <div className={styles.autoSave}>{saved ? <><Check size={14} /> Dados salvos</> : 'Seus dados ficam salvos neste navegador'}</div>
            </div>

            <button className={styles.calculateButton} onClick={() => document.getElementById('resultado')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              <Calculator size={18} /> CALCULAR PREÇO
            </button>
          </section>

          <div className={styles.rightCol}>
            <section className={styles.card} id="resultado">
              <div className={styles.greenHead}><div><Calculator size={22} /><strong>Resultado do Cálculo</strong></div></div>
              <div className={styles.body}>
                <div className={styles.heroResult}>
                  <span>PREÇO PARA CADASTRAR NA SHOPEE</span>
                  <strong>{brl(calc.price)}</strong>
                  <em className={calc.profit >= 0 ? styles.profitBadge : styles.lossBadge}>
                    {calc.profit >= 0 ? 'Lucro Real' : 'Prejuízo'}: {brl(calc.profit)} ({pct(calc.margin)})
                  </em>
                </div>

                <h3 className={styles.costTitle}><BadgeDollarSign size={17} /> Detalhamento de Custos e Taxas</h3>
                <CostLine label={form.isKit ? `Custo do Produto (${calc.qty} un.)` : 'Custo do Produto'} value={calc.productCost} />
                <CostLine label="Custo da Embalagem" value={calc.packaging} />
                <button className={styles.feeLine} onClick={() => setFeesOpen(v => !v)}>
                  <span>Taxas da Shopee</span><strong>{brl(calc.shopeeFees)}</strong><ChevronDown size={16} />
                </button>
                {feesOpen && (
                  <div className={styles.feeDetails}>
                    <CostLine label={`Comissão (${pct(calc.commissionRate * 100)})`} value={calc.commission} compact />
                    <CostLine label="Taxa fixa" value={calc.fixedFee} compact />
                    {calc.tax > 0 && <CostLine label="Impostos" value={calc.tax} compact />}
                    {calc.marketing > 0 && <CostLine label="Marketing extra" value={calc.marketing} compact />}
                    {calc.couponCost > 0 && <CostLine label="Cupom por venda" value={calc.couponCost} compact />}
                  </div>
                )}

                <div className={styles.totalRow}><span>Total de Custos + Taxas</span><strong>{brl(calc.totalCosts)}</strong></div>
                <div className={styles.profitRow}><span>Lucro Líquido</span><strong className={calc.profit >= 0 ? styles.greenText : styles.redText}>{brl(calc.profit)}</strong></div>

                <div className={styles.metricsGrid}>
                  <Metric label="ROAS de equilíbrio" value={calc.breakEvenRoas ? `${calc.breakEvenRoas.toFixed(2).replace('.', ',')}x` : '—'} />
                  <Metric label="ROAS sugerido" value={calc.suggestedRoas ? `${calc.suggestedRoas.toFixed(2).replace('.', ',')}x` : '—'} />
                  <Metric label="Gasto Ads/venda" value={calc.effectiveRoas ? brl(calc.adSpendPerSale) : '—'} />
                  <Metric label="Lucro após Ads" value={calc.effectiveRoas ? brl(calc.profitAfterAds) : '—'} good={calc.profitAfterAds >= 0} />
                </div>

                {calc.marketPrice > 0 && (
                  <div className={styles.marketBox}>
                    <Target size={18} />
                    <div><strong>Comparação com o mercado</strong><span>Seu preço está {Math.abs(calc.marketDiff).toFixed(1).replace('.', ',')}% {calc.marketDiff > 0 ? 'acima' : 'abaixo'} da média informada ({brl(calc.marketPrice)}).</span></div>
                  </div>
                )}

                {calc.monthlySales > 0 && (
                  <div className={styles.monthBox}>
                    <strong>Projeção mensal ({calc.monthlySales} vendas)</strong>
                    <span>Faturamento: {brl(calc.monthlyRevenue)}</span>
                    <span>Lucro antes de Ads: {brl(calc.monthlyProfit)}</span>
                    <span>Lucro após Ads: {brl(calc.monthlyProfitAfterAds)}</span>
                  </div>
                )}
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.chartHead}><BarChart3 size={21} /><strong>Distribuição de Custos</strong></div>
              <div className={styles.chartBody}>
                <div className={styles.donut} style={{ background: donut.background }}><div /></div>
                <div className={styles.legend}>
                  {donut.slices.filter(s => s.value > 0.001).map(s => (
                    <span key={s.label}><i style={{ background: s.color }} />{s.label}</span>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        <section className={`${styles.card} ${styles.shareCard}`}>
          <div className={styles.greenHead}><div><Share2 size={20} /><strong>Compartilhar Resultado</strong></div></div>
          <div className={styles.shareBody}>
            <p>Copie seu cálculo de preços formatado para compartilhar ou guardar.</p>
            <button onClick={copySummary}><ClipboardCopy size={17} /> {copied ? 'Resumo copiado!' : 'Copiar Resumo Completo'}</button>
          </div>
        </section>
      </div>
    </main>
  )
}

function Field({ label, value, onChange, placeholder, note, icon, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; note?: string; icon?: React.ReactNode; required?: boolean }) {
  return (
    <label className={styles.field}>
      <span>{icon}{label}{required && <b>*</b>}</span>
      <input value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} inputMode="decimal" />
      {note && <small>{note}</small>}
    </label>
  )
}

function ModeButton({ active, onClick, icon, title, subtitle }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; subtitle: string }) {
  return <button className={`${styles.modeButton} ${active ? styles.modeActive : ''}`} onClick={onClick}>{icon}<strong>{title}</strong><span>{subtitle}</span></button>
}

function CostLine({ label, value, compact = false }: { label: string; value: number; compact?: boolean }) {
  return <div className={`${styles.costLine} ${compact ? styles.compact : ''}`}><span>{label}</span><strong>{brl(value)}</strong></div>
}

function Metric({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return <div className={styles.metric}><span>{label}</span><strong className={good === undefined ? '' : good ? styles.greenText : styles.redText}>{value}</strong></div>
}
