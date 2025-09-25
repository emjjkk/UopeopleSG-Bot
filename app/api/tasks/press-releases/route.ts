import { NextResponse } from "next/server"
import * as cheerio from "cheerio"

const CHANNEL_ID = "1339221565354545216"
const BOT_TOKEN = process.env.NEXT_PUBLIC_DISCORD_TOKEN!

async function getLatestPress() {
  const res = await fetch("https://www.uopeople.edu/about/worldwide-recognition/press-releases/")
  const html = await res.text()
  const $ = cheerio.load(html)

  // Select the first press release block
  const first = $(".fl-post-grid-post").first()

  // Title + link
  const title = first.find(".fl-post-title a").text().trim()
  let url = first.find(".fl-post-title a").attr("href") || ""
  if (url && !url.startsWith("http")) {
    url = `https://www.uopeople.edu${url}`
  }

  // Image
  let image = first.find(".fl-post-image img").attr("src") || null
  if (image && !image.startsWith("http")) {
    image = `https://www.uopeople.edu${image}`
  }

  if (!title || !url) return null

  return { url, title, image }
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
          color: 0xaa00ff
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
