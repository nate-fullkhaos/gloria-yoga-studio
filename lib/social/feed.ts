export const YOUTUBE_CHANNEL_ID = 'UCRjgz3WPPDZcc9aqEXEF5FA'
export const YOUTUBE_HANDLE = '@psyyogshala'

export type SocialNetwork = 'youtube' | 'instagram' | 'facebook'

export type SocialPost = {
  id: string
  network: SocialNetwork
  title: string
  url: string
  image: string
  publishedAt: string | null
  views?: number
  isShort?: boolean
}

export type SocialProfile = {
  network: SocialNetwork
  handle: string
  label: string
  url: string
  image: string
}

export type SocialFeed = {
  updatedAt: string
  posts: SocialPost[]
  profiles: SocialProfile[]
  sources: {
    youtube: boolean
    instagram: boolean
  }
}

const FALLBACK_POSTS: SocialPost[] = [
  {
    id: 'yt-3NIUflHCSdo',
    network: 'youtube',
    title: 'Forward Bending Group Class @psyyogshala',
    url: 'https://www.youtube.com/watch?v=3NIUflHCSdo',
    image: 'https://i.ytimg.com/vi/3NIUflHCSdo/hqdefault.jpg',
    publishedAt: '2026-09-03T20:21:15+00:00',
    isShort: false,
  },
  {
    id: 'yt-fU8hYW1vKMM',
    network: 'youtube',
    title: 'Sunrise Flow @psyyogshala',
    url: 'https://www.youtube.com/shorts/fU8hYW1vKMM',
    image: 'https://i.ytimg.com/vi/fU8hYW1vKMM/hqdefault.jpg',
    publishedAt: '2026-09-03T18:49:52+00:00',
    isShort: true,
  },
  {
    id: 'yt-Bov1tFa6zSg',
    network: 'youtube',
    title: 'Deep in Practice — adjustments and demonstration',
    url: 'https://www.youtube.com/shorts/Bov1tFa6zSg',
    image: 'https://i.ytimg.com/vi/Bov1tFa6zSg/hqdefault.jpg',
    publishedAt: '2026-09-03T18:40:29+00:00',
    isShort: true,
  },
]

const PROFILES: SocialProfile[] = [
  {
    network: 'instagram',
    handle: '@psyyogshala',
    label: 'Studio on Instagram',
    url: 'https://www.instagram.com/psyyogshala/',
    image: '/Images/studio-hero-community.jpg',
  },
  {
    network: 'instagram',
    handle: '@psyyogi',
    label: 'Gloria on Instagram',
    url: 'https://www.instagram.com/psyyogi/',
    image: '/Images/instructor.png',
  },
  {
    network: 'facebook',
    handle: 'psyyogshala',
    label: 'Studio on Facebook',
    url: 'https://www.facebook.com/psyyogshala',
    image: '/Images/studio-hero-room.jpg',
  },
  {
    network: 'youtube',
    handle: '@psyyogshala',
    label: 'YouTube channel',
    url: 'https://www.youtube.com/@psyyogshala',
    image: '/Images/hero3.jpg',
  },
]

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function matchGroup(source: string, pattern: RegExp) {
  const match = source.match(pattern)
  return match?.[1] ? decodeXml(match[1]) : ''
}

function parseYoutubeRss(xml: string): SocialPost[] {
  return xml
    .split('<entry>')
    .slice(1)
    .flatMap((entry) => {
      const videoId = matchGroup(entry, /<yt:videoId>([^<]+)<\/yt:videoId>/)
      if (!videoId) return []
      const title = matchGroup(entry, /<media:title>([^<]*)<\/media:title>/) || matchGroup(entry, /<title>([^<]*)<\/title>/)
      const link = matchGroup(entry, /<link rel="alternate" href="([^"]+)"/)
      const publishedAt = matchGroup(entry, /<published>([^<]+)<\/published>/) || null
      const thumbnail = matchGroup(entry, /<media:thumbnail url="([^"]+)"/)
      const viewsRaw = matchGroup(entry, /<media:statistics views="([^"]+)"/)
      const views = viewsRaw ? Number(viewsRaw) : undefined
      const url = link || `https://www.youtube.com/watch?v=${videoId}`

      const post: SocialPost = {
        id: `yt-${videoId}`,
        network: 'youtube',
        title: title || 'PsyYogshala on YouTube',
        url,
        image: thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        publishedAt,
        views: Number.isFinite(views) ? views : undefined,
        isShort: /\/shorts\//.test(url),
      }
      return [post]
    })
}

type InstagramMedia = {
  id: string
  caption?: string
  media_url?: string
  permalink?: string
  thumbnail_url?: string
  timestamp?: string
  media_type?: string
}

async function fetchInstagramPosts(): Promise<SocialPost[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  if (!token) return []

  const fields = 'id,caption,media_url,permalink,thumbnail_url,timestamp,media_type'
  const response = await fetch(
    `https://graph.instagram.com/me/media?fields=${fields}&limit=8&access_token=${encodeURIComponent(token)}`,
  )

  if (!response.ok) return []

  const payload = (await response.json()) as { data?: InstagramMedia[] }
  return (payload.data ?? []).flatMap((item) => {
    const image = item.thumbnail_url || item.media_url
    if (!image || !item.permalink) return []
    const caption = (item.caption || 'Practice from PsyYogshala').split('\n')[0]
    const post: SocialPost = {
      id: `ig-${item.id}`,
      network: 'instagram',
      title: caption.slice(0, 90),
      url: item.permalink,
      image,
      publishedAt: item.timestamp ?? null,
    }
    return [post]
  })
}

async function fetchYoutubePosts(): Promise<SocialPost[]> {
  const channelId = process.env.YOUTUBE_CHANNEL_ID || YOUTUBE_CHANNEL_ID
  const response = await fetch(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
    {
      headers: { Accept: 'application/atom+xml,application/xml,text/xml' },
    },
  )
  if (!response.ok) return []
  const xml = await response.text()
  return parseYoutubeRss(xml)
}

export async function getSocialFeed(): Promise<SocialFeed> {
  const [youtubeLive, instagram] = await Promise.all([
    fetchYoutubePosts().catch(() => [] as SocialPost[]),
    fetchInstagramPosts().catch(() => [] as SocialPost[]),
  ])

  const youtube = youtubeLive.length ? youtubeLive : FALLBACK_POSTS
  const posts = [...instagram, ...youtube].sort((a, b) => {
    const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0
    const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0
    return bTime - aTime
  })

  return {
    updatedAt: new Date().toISOString(),
    posts,
    profiles: PROFILES,
    sources: {
      youtube: youtube.length > 0,
      instagram: instagram.length > 0,
    },
  }
}
