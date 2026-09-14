import { NextResponse } from 'next/server'
import { getSocialFeed } from '@/lib/social/feed'

export const runtime = 'nodejs'
export const revalidate = 600

export async function GET() {
  const feed = await getSocialFeed()
  return NextResponse.json(feed, {
    headers: {
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
    },
  })
}
