import { NextResponse } from "next/server"
import * as cheerio from "cheerio"

const CHANNEL_ID = "1420661886906662922"
const BOT_TOKEN = process.env.NEXT_PUBLIC_DISCORD_TOKEN!

async function getLatestPress() {
  const res = await fetch("https://www.uopeople.edu/about/worldwide-recognition/press-releases/")
  const html = await res.text()
  const $ = cheerio.load(html)
  const first = $(".fl-post-grid-post").first()
  const title = first.find(".fl-post-title a").text().trim()
  let url = first.find(".fl-post-title a").attr("href") || ""
  
  if (url && !url.startsWith("http")) {
    url = `https://www.uopeople.edu${url}`
  }
  
  if (!title || !url) return null

  // 🔎 Step 2: fetch the article page to get its featured image and full content
  let image: string | null = null
  let content: string | null = null
  
  try {
    const articleRes = await fetch(url)
    const articleHtml = await articleRes.text()
    const $$ = cheerio.load(articleHtml)
    
    // Try common featured image selectors
    image =
      $$("meta[property='og:image']").attr("content") || // best option
      $$(".fl-post-content img").first().attr("src") ||
      null
    
    if (image && !image.startsWith("http")) {
      image = `https://www.uopeople.edu${image}`
    }

    // Extract article content from .fl-rich-text div
    const contentDiv = $$(".fl-rich-text")
    if (contentDiv.length > 0) {
      // Get all paragraph text and join with line breaks
      const paragraphs: string[] = []
      contentDiv.find("p").each((i, el) => {
        const text = $$(el).text().trim()
        if (text) {
          paragraphs.push(text)
        }
      })
      content = paragraphs.join("\n\n")
    }
    
  } catch (e) {
    console.error("Failed to fetch article content:", e)
  }

  return { url, title, image, content }
}

async function postToDiscord(press: { url: string; title: string; image: string | null; content: string | null }) {
  // Discord embed description has a 4096 character limit
  const MAX_DESCRIPTION_LENGTH = 4000 // Leave some room for the title formatting
  
  let description = `## ${press.title}`
  
  if (press.content) {
    // Add content with some formatting
    let articleContent = press.content
    
    // Truncate if too long
    if (articleContent.length > MAX_DESCRIPTION_LENGTH - description.length - 10) {
      articleContent = articleContent.substring(0, MAX_DESCRIPTION_LENGTH - description.length - 13) + "..."
    }
    
    description += `\n\n${articleContent}`
  }

  await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      embeds: [
        {
          title: "New press release from University of the People",
          url: press.url,
          description: description,
          thumbnail: press.image ? { url: press.image } : undefined,
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
