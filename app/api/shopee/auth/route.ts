import { NextResponse } from 'next/server'
import { buildAuthUrl, getConfig } from '@/lib/shopee'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const config = getConfig()
    return NextResponse.redirect(buildAuthUrl(config))
  } catch (error) {
    console.error(error)
    return NextResponse.redirect(new URL('/?error=missing_config', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
  }
}
