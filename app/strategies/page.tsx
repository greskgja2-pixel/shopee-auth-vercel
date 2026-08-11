'use client'

import Link from 'next/link'
import { AlarmClock, Archive, ChevronRight, LockKeyhole, Package, Scissors, Tag, Target, TrendingUp, type LucideIcon } from 'lucide-react'
import styles from './strategies.module.css'

type Strategy = { title: string; description: string; icon: LucideIcon; href: string; badge?: string }

const strategies: Strategy[] = [
  { title: 'Horário Campeão', description: 'Descubra os horários que mais vendem e direcione seu ADS para onde realmente dá lucro.', icon: AlarmClock, href: '/strategies/horario-campeao' },
  { title: 'Horário Campeão do Produto', description: 'Escolha um produto e veja em quais horários ele vende mais e gera mais lucro.', icon: Package, href: '/strategies/horario-produto' },
  { title: 'Meta por Venda', description: 'Defina meta mensal e lucro mínimo por venda. O sistema calcula gasto máximo em ADS e ROAS mínimo.', icon: Target, href: '/strategies/meta-por-venda', badge: 'Automação de ROAS' },
  { title: 'Descontos Inteligentes', description: 'Simule promoções sem destruir sua margem e descubra o desconto máximo seguro.', icon: Tag, href: '/strategies/descontos' },
  { title: 'Produtos Campeões', description: 'Encontre produtos com maior lucro, melhor ROAS e potencial real de escala.', icon: TrendingUp, href: '/strategies/produtos-campeoes' },
  { title: 'Corte de Prejuízo', description: 'Identifique produtos que vendem, mas dão pouco lucro, e campanhas que estão drenando margem.', icon: Scissors, href: '/strategies/corte-prejuizo' },
  { title: 'Estoque Inteligente', description: 'Evite anunciar forte produtos com estoque crítico e receba recomendação de reposição.', icon: Archive, href: '/strategies/estoque-inteligente' },
  { title: 'ADS Seguro', description: 'Controle limites de gasto, prejuízo diário e ROAS mínimo para proteger seu caixa.', icon: LockKeyhole, href: '/strategies/ads-seguro' },
]

export default function StrategiesPage() {
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div>
          <div className={styles.eyebrow}>Shopee Seller Connector</div>
          <h1 className={styles.pageTitle}>Estratégias</h1>
          <p className={styles.subtitle}>Ferramentas prontas para transformar dados da loja em decisões de preço, estoque, lucro e ADS.</p>
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
            <article key={strategy.href} className={styles.card}>
              <div className={styles.iconWrap}><Icon size={34} strokeWidth={2.1}/></div>
              <h2>{strategy.title}</h2>
              <p>{strategy.description}</p>
              <div className={styles.cardFooter}>
                <span className={styles.available}>✓ Disponível{strategy.badge ? ` · ${strategy.badge}` : ''}</span>
                <Link className={styles.openButton} href={strategy.href}>Abrir estratégia <ChevronRight size={17}/></Link>
              </div>
            </article>
          )
        })}
      </section>
    </main>
  )
}
