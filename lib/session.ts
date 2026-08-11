import { createHash } from 'node:crypto'
import { cookies } from 'next/headers'
import { jwtDecrypt } from 'jose'

export type ShopeeSession = {
  shopId: number
  accessToken: string
  refreshToken?: string
  expiresAt?: number
}

function sessionKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('missing_session_secret')
  return createHash('sha256').update(secret).digest()
}

export async function getShopeeSession(): Promise<ShopeeSession> {
  const token = cookies().get('shopee_session')?.value
  if (!token) throw new Error('not_authenticated')

  const { payload } = await jwtDecrypt(token, sessionKey())
  const shopId = Number(payload.shopId)
  const accessToken = String(payload.accessToken || '')
  if (!Number.isFinite(shopId) || !accessToken) throw new Error('invalid_session')

  return {
    shopId,
    accessToken,
    refreshToken: payload.refreshToken ? String(payload.refreshToken) : undefined,
    expiresAt: payload.expiresAt ? Number(payload.expiresAt) : undefined
  }
}
