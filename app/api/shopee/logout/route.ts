import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/', request.url))
  response.cookies.set('shopee_session', '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 })
  return response
}
