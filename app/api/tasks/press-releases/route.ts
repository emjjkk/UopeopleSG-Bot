// app/api/press-releases/route.ts
import { NextResponse } from "next/server"

const CHANNEL_ID = '1339221565354545216'
const BOT_TOKEN = process.env.NEXT_PUBLIC_DISCORD_TOKEN!

async function getLatestPress() {
  const res = await fetch("https://www.uopeople.edu/about/worldwide-recognition/press/")
  const html = await res.text()

  // Grab first press release link + title + image
  const linkMatch = html.match(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/)
  const imgMatch = html.match(/<img[^>]+src="([^"]+)"/)

  if (!linkMatch) return null
  return {
    url: linkMatch[1].startsWith("http") ? linkMatch[1] : `https://www.uopeople.edu${linkMatch[1]}`,
    title: linkMatch[2].trim(),
    image: imgMatch ? imgMatch[1] : null
  }
}

async function postToDiscord(press: { url: string; title: string; image: string | null }) {
  await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      embeds: [
        {
          title: press.title,
          url: press.url,
          image: press.image ? { url: press.image } : undefined,
          color: 0x0099ff
        }
      ]
    })
  })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lastUrl = searchParams.get("lastUrl")

  const latest = await getLatestPress()
  if (!latest) return NextResponse.json({ error: "No press release found" })

  if (latest.url !== lastUrl) {
    await postToDiscord(latest)
    return NextResponse.json({ posted: true, latestUrl: latest.url, data: latest })
  }

  return NextResponse.json({ posted: false, latestUrl: lastUrl })
}
