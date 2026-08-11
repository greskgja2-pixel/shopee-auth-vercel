import { NextRequest, NextResponse } from 'next/server'
import { getShopeeSession } from '../../../../lib/session'
import { getItemBaseInfo, getItemList } from '../../../../lib/shopee'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getShopeeSession()
    const { searchParams } = new URL(request.url)
    const offset = Number(searchParams.get('offset') || 0)
    const pageSize = Math.min(Number(searchParams.get('page_size') || 50), 100)
    const status = searchParams.get('status') || 'NORMAL'

    const list: any = await getItemList(session, offset, pageSize, status)
    const rows = list?.response?.item || list?.response?.item_list || []
    const ids = rows.map((row: any) => Number(row.item_id)).filter(Number.isFinite)

    let items: any[] = []
    if (ids.length) {
      const base: any = await getItemBaseInfo(session, ids)
      items = base?.response?.item_list || base?.response?.item || []
    }

    return NextResponse.json({
      items,
      offset,
      pageSize,
      hasNextPage: Boolean(list?.response?.has_next_page),
      nextOffset: list?.response?.next_offset ?? offset + rows.length
    })
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'unknown_error'
    return NextResponse.json({ error: message }, { status: message === 'not_authenticated' ? 401 : 500 })
  }
}
