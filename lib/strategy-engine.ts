export type HourMetric = { hour: number; orders: number; revenue: number; adSpend: number; variableCost?: number }
export type ProductMetric = { name: string; revenue: number; profit: number; adSpend: number; orders: number; conversion: number; growth: number; stock: number }

export function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(value) ? value : 0)
}

export function analyseHours(rows: HourMetric[]) {
  const scored = rows.map(row => {
    const cost = row.variableCost || 0
    const profit = row.revenue - row.adSpend - cost
    const roas = row.adSpend > 0 ? row.revenue / row.adSpend : row.revenue > 0 ? 99 : 0
    const score = Math.max(0, profit) * 0.45 + row.orders * 2.2 + Math.min(roas, 20) * 1.8
    return { ...row, profit, roas, score }
  })
  const sorted = [...scored].sort((a, b) => b.score - a.score)
  const top = sorted.slice(0, Math.max(1, Math.ceil(sorted.length * 0.25))).map(x => x.hour)
  const weak = sorted.slice(-Math.max(1, Math.ceil(sorted.length * 0.2))).map(x => x.hour)
  return { scored, top, weak }
}

export function saleGoal(input: { price: number; cost: number; commissionPct: number; fixedFee: number; minimumProfit: number; monthlyGoal: number }) {
  const commission = input.price * (input.commissionPct / 100)
  const profitBeforeAds = input.price - input.cost - commission - input.fixedFee
  const maxAdSpendPerSale = Math.max(0, profitBeforeAds - input.minimumProfit)
  const minimumRoas = maxAdSpendPerSale > 0 ? input.price / maxAdSpendPerSale : Infinity
  const monthlyMaxAdSpend = maxAdSpendPerSale * input.monthlyGoal
  const projectedMinimumProfit = input.minimumProfit * input.monthlyGoal
  return { commission, profitBeforeAds, maxAdSpendPerSale, minimumRoas, monthlyMaxAdSpend, projectedMinimumProfit }
}

export function discountStrategy(input: { price: number; cost: number; commissionPct: number; fixedFee: number; minimumProfit: number; discountPct: number }) {
  const salePrice = Math.max(0, input.price * (1 - input.discountPct / 100))
  const commission = salePrice * (input.commissionPct / 100)
  const profitBeforeAds = salePrice - input.cost - input.fixedFee - commission
  const maxAdSpendPerSale = Math.max(0, profitBeforeAds - input.minimumProfit)
  const breakEvenRoas = maxAdSpendPerSale > 0 ? salePrice / maxAdSpendPerSale : Infinity
  const absoluteDiscount = input.price - salePrice
  const safe = profitBeforeAds >= input.minimumProfit
  const maxSafeDiscountValue = Math.max(0, input.price - ((input.cost + input.fixedFee + input.minimumProfit) / Math.max(0.01, 1 - input.commissionPct / 100)))
  const maxSafeDiscountPct = input.price > 0 ? (maxSafeDiscountValue / input.price) * 100 : 0
  return { salePrice, commission, profitBeforeAds, maxAdSpendPerSale, breakEvenRoas, absoluteDiscount, safe, maxSafeDiscountPct }
}

export function rankChampions(rows: ProductMetric[]) {
  const normalized = rows.map(row => {
    const roas = row.adSpend > 0 ? row.revenue / row.adSpend : row.revenue > 0 ? 20 : 0
    const profitMargin = row.revenue > 0 ? (row.profit / row.revenue) * 100 : 0
    const score = Math.max(0, profitMargin) * 1.2 + Math.min(roas, 20) * 2 + Math.max(0, row.conversion) * 2.2 + Math.max(-20, Math.min(row.growth, 100)) * 0.25 + Math.min(row.stock, 100) * 0.08
    let action = 'Manter'
    if (score >= 65 && row.profit > 0 && row.stock > 10) action = 'Escalar ADS'
    else if (score >= 45 && row.profit > 0) action = 'Otimizar e testar'
    else if (row.profit <= 0) action = 'Corrigir margem'
    return { ...row, roas, profitMargin, score, action }
  })
  return [...normalized].sort((a, b) => b.score - a.score)
}

export function lossCut(input: { revenue: number; cost: number; adSpend: number; orders: number; currentRoasTarget: number; minimumProfitPerOrder: number }) {
  const profit = input.revenue - input.cost - input.adSpend
  const profitPerOrder = input.orders > 0 ? profit / input.orders : profit
  const realRoas = input.adSpend > 0 ? input.revenue / input.adSpend : 0
  let action = 'Manter campanha'
  let suggestedRoas = input.currentRoasTarget
  if (input.adSpend > 0 && input.orders === 0) { action = 'Pausar ADS e revisar anúncio'; suggestedRoas = input.currentRoasTarget + 5 }
  else if (profit < 0) { action = 'Subir ROAS e reduzir gasto'; suggestedRoas = input.currentRoasTarget + 5 }
  else if (profitPerOrder < input.minimumProfitPerOrder) { action = 'Subir ROAS em 3x'; suggestedRoas = input.currentRoasTarget + 3 }
  else if (profitPerOrder >= input.minimumProfitPerOrder * 1.6 && realRoas > input.currentRoasTarget * 1.25) { action = 'Pode reduzir ROAS em 2x para buscar volume'; suggestedRoas = Math.max(1, input.currentRoasTarget - 2) }
  return { profit, profitPerOrder, realRoas, suggestedRoas, action }
}

export function smartStock(input: { stock: number; avgDailySales: number; leadTimeDays: number; safetyDays: number }) {
  const daily = Math.max(0, input.avgDailySales)
  const daysOfStock = daily > 0 ? input.stock / daily : 999
  const reorderPoint = Math.ceil(daily * (input.leadTimeDays + input.safetyDays))
  const suggestedOrder = Math.max(0, Math.ceil(daily * (input.leadTimeDays + input.safetyDays + 14) - input.stock))
  let status = 'Saudável'
  let adAction = 'ADS normal'
  if (daysOfStock <= Math.max(2, input.leadTimeDays * 0.4)) { status = 'Crítico'; adAction = 'Pausar ou limitar ADS' }
  else if (input.stock <= reorderPoint) { status = 'Repor agora'; adAction = 'Reduzir ADS em 30%' }
  else if (daysOfStock <= input.leadTimeDays + input.safetyDays + 5) { status = 'Atenção'; adAction = 'Não escalar ADS' }
  return { daysOfStock, reorderPoint, suggestedOrder, status, adAction }
}

export function adsSafety(input: { dailyBudget: number; spendToday: number; revenueToday: number; minimumRoas: number; maxLossDay: number; productCostToday: number }) {
  const roas = input.spendToday > 0 ? input.revenueToday / input.spendToday : 0
  const grossAfterAds = input.revenueToday - input.productCostToday - input.spendToday
  const loss = Math.max(0, -grossAfterAds)
  const budgetUsedPct = input.dailyBudget > 0 ? (input.spendToday / input.dailyBudget) * 100 : 0
  let status = 'Seguro'
  let action = 'Manter campanha'
  if (loss >= input.maxLossDay) { status = 'Bloqueio de segurança'; action = 'Pausar ADS até próxima revisão' }
  else if (budgetUsedPct >= 100 && roas < input.minimumRoas) { status = 'Limite atingido'; action = 'Não liberar gasto extra' }
  else if (input.spendToday >= input.dailyBudget * 0.7 && roas < input.minimumRoas * 0.8) { status = 'Risco alto'; action = 'Reduzir gasto e subir ROAS alvo' }
  else if (roas >= input.minimumRoas * 1.25 && budgetUsedPct < 80) { status = 'Oportunidade'; action = 'Pode liberar até 15% mais orçamento' }
  return { roas, grossAfterAds, loss, budgetUsedPct, status, action }
}
