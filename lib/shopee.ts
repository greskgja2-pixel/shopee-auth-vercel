import crypto from 'node:crypto'

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
    body: JSON.stringify({
      code,
      shop_id: shopId,
      partner_id: Number(config.partnerId)
    })
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
