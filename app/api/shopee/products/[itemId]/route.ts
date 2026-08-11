import { NextRequest, NextResponse } from 'next/server'
import { getShopeeSession } from '../../../../../lib/session'
import {
  getItemBaseInfo,
  getLogisticsChannels,
  getModelList,
  unlistItem,
  updateItem,
  updatePrice,
  updateStock
} from '../../../../../lib/shopee'

export const dynamic = 'force-dynamic'

function itemIdFrom(params: { itemId: string }) {
  const itemId = Number(params.itemId)
  if (!Number.isFinite(itemId)) throw new Error('invalid_item_id')
  return itemId
}

export async function GET(_request: NextRequest, { params }: { params: { itemId: string } }) {
  try {
    const session = await getShopeeSession()
    const itemId = itemIdFrom(params)

    const [base, models, logistics] = await Promise.all([
      getItemBaseInfo(session, [itemId]),
      getModelList(session, itemId).catch(error => ({ error: error instanceof Error ? error.message : 'model_error' })),
      getLogisticsChannels(session).catch(error => ({ error: error instanceof Error ? error.message : 'logistics_error' }))
    ])

    const item = (base as any)?.response?.item_list?.[0] || (base as any)?.response?.item?.[0] || null
    return NextResponse.json({ item, models, logistics })
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'unknown_error'
    return NextResponse.json({ error: message }, { status: message === 'not_authenticated' ? 401 : 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { itemId: string } }) {
  try {
    const session = await getShopeeSession()
    const itemId = itemIdFrom(params)
    const payload = await request.json()
    const result: Record<string, unknown> = {}

    if (payload.base) {
      result.base = await updateItem(session, { item_id: itemId, ...payload.base })
    }
    if (payload.price) {
      result.price = await updatePrice(session, { item_id: itemId, ...payload.price })
    }
    if (payload.stock) {
      result.stock = await updateStock(session, { item_id: itemId, ...payload.stock })
    }
    if (typeof payload.unlist === 'boolean') {
      result.unlist = await unlistItem(session, itemId, payload.unlist)
    }

    return NextResponse.json({ ok: true, result })
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'unknown_error'
    return NextResponse.json({ error: message }, { status: message === 'not_authenticated' ? 401 : 500 })
  }
}
