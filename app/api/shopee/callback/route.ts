import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { EncryptJWT } from 'jose'
import { exchangeCode, getConfig } from '../../../../lib/shopee'

export const dynamic = 'force-dynamic'

function secretKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('missing_session_secret')
  return createHash('sha256').update(secret).digest()
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const shopRaw = url.searchParams.get('shop_id') || url.searchParams.get('main_account_id')
  const providerError = url.searchParams.get('error')

  if (providerError) return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(providerError)}`, request.url))
  if (!code || !shopRaw) return NextResponse.redirect(new URL('/?error=invalid_callback', request.url))

  const shopId = Number(shopRaw)
  if (!Number.isFinite(shopId)) return NextResponse.redirect(new URL('/?error=invalid_shop_id', request.url))

  try {
    const config = getConfig()
    const token = await exchangeCode(config, code, shopId)
    const expiresAt = Date.now() + token.expiresIn * 1000

    const session = await new EncryptJWT({
      shopId,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresAt
    })
      .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .encrypt(secretKey())

    const response = NextResponse.redirect(new URL('/dashboard', request.url))
    response.cookies.set('shopee_session', session, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    })
    return response
  } catch (error) {
    console.error(error)
    return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url))
  }
}
