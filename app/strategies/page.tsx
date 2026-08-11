'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  AlarmClock,
  Archive,
  ChevronRight,
  LockKeyhole,
  Package,
  Scissors,
  ShieldCheck,
  Tag,
  Target,
  TrendingUp,
} from 'lucide-react'
import styles from './strategies.module.css'

type StrategyKey = 'store-hours' | 'product-hours' | 'sale-goal' | 'discounts'

type Strategy = {
  key: string
  title: string
  description: string
  available: boolean
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
}

const strategies: Strategy[] = [
  {
    key: 'store-hours',
    title: 'Horário Campeão',
    description: 'Descubra os horários que mais vendem e direcione seu ADS para onde realmente dá lucro.',
    available: true,
    icon: AlarmClock,
  },
  {
    key: 'product-hours',
    title: 'Horário Campeão do Produto',
    description: 'Escolha um produto e veja em quais horários ele vende mais e gera mais lucro.',
    available: true,
    icon: Package,
  },
  {
    key: 'sale-goal',
    title: 'Meta por Venda',
    description: 'Defina, por produto, a meta de vendas no mês e o lucro mínimo por venda. O sistema calcula o gasto máximo em Ads e o ROAS mínimo necessário.',
    available: true,
    icon: Target,
  },
  {
    key: 'discounts',
    title: 'Descontos',
    description: 'Gerencie suas promoções e descontos por produto. Edite preços em % ou R$, individualmente ou em massa.',
    available: true,
    icon: Tag,
  },
  {
    key: 'winners',
    title: 'Produtos Campeões',
    description: 'Encontre produtos com maior lucro e potencial de escala.',
    available: false,
    icon: TrendingUp,
  },
  {
    key: 'cut-loss',
    title: 'Corte de Prejuízo',
    description: 'Identifique produtos que vendem, mas dão pouco ou nenhum lucro.',
    available: false,
    icon: Scissors,
  },
  {
    key: 'smart-stock',
    title: 'Estoque Inteligente',
    description: 'Evite anunciar produtos com estoque crítico.',
    available: false,
    icon: Archive,
  },
  {
    key: 'safe-ads',
    title: 'ADS Seguro',
    description: 'Controle limites de gasto e proteja seu lucro.',
    available: false,
    icon: LockKeyhole,
  },
]

const activeCopy: Record<StrategyKey, { title: string; text: string }> = {
  'store-hours': {
    title: 'Analisar horário campeão da loja',
    text: 'Defina o período que deseja analisar. Quando os dados reais estiverem conectados, o sistema cruza pedidos, faturamento e investimento em ADS por hora.',
  },
  'product-hours': {
    title: 'Analisar horário campeão de um produto',
    text: 'Escolha um produto e um período. A análise será feita considerando vendas, lucro e desempenho de mídia do item selecionado.',
  },
  'sale-goal': {
    title: 'Definir meta por venda',
    text: 'Informe meta mensal e lucro mínimo por venda para calcular o gasto máximo aceitável em ADS e o ROAS mínimo recomendado.',
  },
  discounts: {
    title: 'Planejar descontos',
    text: 'Simule desconto em percentual ou valor fixo antes de aplicar mudanças em massa nos produtos.',
  },
}

export default function StrategiesPage() {
  const [active, setActive] = useState<StrategyKey | null>(null)
  const [goal, setGoal] = useState('100')
  const [profit, setProfit] = useState('10')
  const [discountType, setDiscountType] = useState('percent')
  const [discountValue, setDiscountValue] = useState('10')

  const saleMath = useMemo(() => {
    const monthlyGoal = Number(goal.replace(',', '.')) || 0
    const profitPerSale = Number(profit.replace(',', '.')) || 0
    return {
      projectedProfit: monthlyGoal * profitPerSale,
      maxAdSpend: monthlyGoal * Math.max(0, profitPerSale * 0.35),
    }
  }, [goal, profit])

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div>
          <div className={styles.eyebrow}>Shopee Seller Connector</div>
          <h1 className={styles.pageTitle}>Estratégias</h1>
          <p className={styles.subtitle}>Use dados reais da sua loja para tomar decisões mais inteligentes.</p>
        </div>
        <Link href="/dashboard" className={styles.accountButton}>Conta conectada</Link>
      </header>

      <nav className={styles.moduleNav} aria-label="Navegação principal">
        <Link href="/products">Produtos</Link>
        <Link href="/ads">Shopee ADS</Link>
        <Link href="/strategies" className={styles.activeNav}>Estratégias</Link>
      </nav>

      <section className={styles.grid}>
        {strategies.map(strategy => {
          const Icon = strategy.icon
          return (
            <article key={strategy.key} className={`${styles.card} ${!strategy.available ? styles.disabledCard : ''}`}>
              <div className={styles.iconWrap}><Icon size={34} strokeWidth={2.1} /></div>
              <h2>{strategy.title}</h2>
              <p>{strategy.description}</p>

              <div className={styles.cardFooter}>
                {strategy.available ? (
                  <>
                    <span className={styles.available}>✓ Disponível</span>
                    <button className={styles.openButton} onClick={() => setActive(strategy.key as StrategyKey)}>
                      Abrir estratégia <ChevronRight size={17} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className={styles.coming}>Em breve</span>
                    <button className={styles.disabledButton} disabled>Em breve</button>
                  </>
                )}
              </div>
            </article>
          )
        })}
      </section>

      {active && (
        <section className={styles.workspace}>
          <div className={styles.workspaceHeader}>
            <div>
              <span className={styles.workspaceTag}>Estratégia ativa</span>
              <h2>{activeCopy[active].title}</h2>
              <p>{activeCopy[active].text}</p>
            </div>
            <button className={styles.closeButton} onClick={() => setActive(null)}>Fechar</button>
          </div>

          {(active === 'store-hours' || active === 'product-hours') && (
            <div className={styles.formGrid}>
              {active === 'product-hours' && (
                <label>
                  <span>Produto</span>
                  <input placeholder="Nome, SKU ou Item ID" />
                </label>
              )}
              <label>
                <span>Período inicial</span>
                <input type="date" />
              </label>
              <label>
                <span>Período final</span>
                <input type="date" />
              </label>
              <label>
                <span>Métrica principal</span>
                <select defaultValue="lucro">
                  <option value="lucro">Lucro</option>
                  <option value="vendas">Vendas</option>
                  <option value="roas">ROAS</option>
                  <option value="pedidos">Pedidos</option>
                </select>
              </label>
              <div className={styles.actionBox}>
                <ShieldCheck size={22} />
                <div><strong>Análise segura</strong><span>Nenhuma alteração será feita na Shopee sem confirmação.</span></div>
              </div>
            </div>
          )}

          {active === 'sale-goal' && (
            <div className={styles.goalLayout}>
              <div className={styles.formGrid}>
                <label><span>Meta de vendas no mês</span><input value={goal} onChange={e => setGoal(e.target.value)} inputMode="numeric" /></label>
                <label><span>Lucro mínimo por venda (R$)</span><input value={profit} onChange={e => setProfit(e.target.value)} inputMode="decimal" /></label>
              </div>
              <div className={styles.resultGrid}>
                <div><span>Lucro projetado</span><strong>R$ {saleMath.projectedProfit.toFixed(2).replace('.', ',')}</strong></div>
                <div><span>Limite estimado para ADS</span><strong>R$ {saleMath.maxAdSpend.toFixed(2).replace('.', ',')}</strong></div>
              </div>
            </div>
          )}

          {active === 'discounts' && (
            <div className={styles.formGrid}>
              <label><span>Aplicar em</span><select><option>Produto individual</option><option>Produtos selecionados</option><option>Todos os produtos</option></select></label>
              <label><span>Tipo de desconto</span><select value={discountType} onChange={e => setDiscountType(e.target.value)}><option value="percent">Percentual (%)</option><option value="fixed">Valor fixo (R$)</option></select></label>
              <label><span>{discountType === 'percent' ? 'Desconto (%)' : 'Desconto (R$)'}</span><input value={discountValue} onChange={e => setDiscountValue(e.target.value)} inputMode="decimal" /></label>
              <div className={styles.actionBox}><Tag size={22} /><div><strong>Modo simulação</strong><span>Primeiro visualize o impacto. Aplicação real poderá exigir confirmação.</span></div></div>
            </div>
          )}
        </section>
      )}
    </main>
  )
}
