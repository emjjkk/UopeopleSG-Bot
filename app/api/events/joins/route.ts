import { NextRequest, NextResponse } from "next/server";

const CHANNEL_ID = '812056538650378311';
const BOT_TOKEN = process.env.NEXT_PUBLIC_DISCORD_TOKEN!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, userId } = body;

    if (!username || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const resp = await fetch(
      `https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bot ${BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `**🎉 Welcome <@${userId}> to the server!** Glad to have you here, ${username}! Feel free to introuduce yourself here in <#812056538650378311> and then get yourself your preferred roles at <#812097807212216361>.`,
        }),
      }
    );

    if (!resp.ok) {
      const err = await resp.text();
      console.error("Discord API error:", err);
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Handler error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}