import crypto from 'node:crypto'
import type { ShopeeSession } from './session'

export type ShopeeConfig = {
  partnerId: string
  partnerKey: string
  redirectUrl: string
  host: string
}

export function getConfig(): ShopeeConfig {
  const partnerId = process.env.SHOPEE_PARTNER_ID || ''
  const partnerKey = process.env.SHOPEE_PARTNER_KEY || ''
  const redirectUrl = process.env.SHOPEE_REDIRECT_URL || ''
  const host = process.env.SHOPEE_AUTH_HOST || 'https://partner.shopeemobile.com'
  if (!partnerId || !partnerKey || !redirectUrl) throw new Error('missing_config')
  return { partnerId, partnerKey, redirectUrl, host }
}

function hmac(key: string, input: string) {
  return crypto.createHmac('sha256', key).update(input).digest('hex')
}

export function buildAuthUrl(config: ShopeeConfig) {
  const path = '/api/v2/shop/auth_partner'
  const timestamp = Math.floor(Date.now() / 1000)
  const sign = hmac(config.partnerKey, `${config.partnerId}${path}${timestamp}`)
  const url = new URL(path, config.host)
  url.searchParams.set('partner_id', config.partnerId)
  url.searchParams.set('timestamp', String(timestamp))
  url.searchParams.set('sign', sign)
  url.searchParams.set('redirect', config.redirectUrl)
  return url.toString()
}

export async function exchangeCode(config: ShopeeConfig, code: string, shopId: number) {
  const path = '/api/v2/auth/token/get_access_token'
  const timestamp = Math.floor(Date.now() / 1000)
  const sign = hmac(config.partnerKey, `${config.partnerId}${path}${timestamp}`)
  const url = new URL(path, config.host)
  url.searchParams.set('partner_id', config.partnerId)
  url.searchParams.set('timestamp', String(timestamp))
  url.searchParams.set('sign', sign)

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ code, shop_id: shopId, partner_id: Number(config.partnerId) })
  })

  const data = await response.json()
  if (!response.ok || data.error || !data.access_token) {
    console.error('Shopee token error', data)
    throw new Error('token_exchange_failed')
  }

  return {
    accessToken: String(data.access_token),
    refreshToken: String(data.refresh_token || ''),
    expiresIn: Number(data.expire_in || 14400)
  }
}

type ShopeeRequestOptions = {
  method?: 'GET' | 'POST'
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
}

export async function shopeeRequest<T = any>(
  session: ShopeeSession,
  path: string,
  options: ShopeeRequestOptions = {}
): Promise<T> {
  const config = getConfig()
  const timestamp = Math.floor(Date.now() / 1000)
  const base = `${config.partnerId}${path}${timestamp}${session.accessToken}${session.shopId}`
  const sign = hmac(config.partnerKey, base)
  const url = new URL(path, config.host)

  url.searchParams.set('partner_id', config.partnerId)
  url.searchParams.set('timestamp', String(timestamp))
  url.searchParams.set('access_token', session.accessToken)
  url.searchParams.set('shop_id', String(session.shopId))
  url.searchParams.set('sign', sign)

  for (const [key, value] of Object.entries(options.query || {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    cache: 'no-store',
    headers: options.method === 'POST' ? { 'content-type': 'application/json' } : undefined,
    body: options.method === 'POST' ? JSON.stringify(options.body ?? {}) : undefined
  })

  const data = await response.json()
  if (!response.ok || data?.error) {
    console.error('Shopee API error', path, data)
    const message = data?.message || data?.error || `http_${response.status}`
    throw new Error(String(message))
  }
  return data as T
}

export function getItemList(session: ShopeeSession, offset = 0, pageSize = 50, status = 'NORMAL') {
  return shopeeRequest(session, '/api/v2/product/get_item_list', {
    query: { offset, page_size: pageSize, item_status: status }
  })
}

export function getItemBaseInfo(session: ShopeeSession, itemIds: number[]) {
  return shopeeRequest(session, '/api/v2/product/get_item_base_info', {
    query: { item_id_list: itemIds.join(',') }
  })
}

export function getModelList(session: ShopeeSession, itemId: number) {
  return shopeeRequest(session, '/api/v2/product/get_model_list', { query: { item_id: itemId } })
}

export function getLogisticsChannels(session: ShopeeSession) {
  return shopeeRequest(session, '/api/v2/logistics/get_channel_list')
}

export function updateItem(session: ShopeeSession, body: unknown) {
  return shopeeRequest(session, '/api/v2/product/update_item', { method: 'POST', body })
}

export function updatePrice(session: ShopeeSession, body: unknown) {
  return shopeeRequest(session, '/api/v2/product/update_price', { method: 'POST', body })
}

export function updateStock(session: ShopeeSession, body: unknown) {
  return shopeeRequest(session, '/api/v2/product/update_stock', { method: 'POST', body })
}

export function unlistItem(session: ShopeeSession, itemId: number, unlist = true) {
  return shopeeRequest(session, '/api/v2/product/unlist_item', {
    method: 'POST',
    body: { item_list: [{ item_id: itemId, unlist }] }
  })
}
