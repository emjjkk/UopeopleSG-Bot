// app/api/purge/route.ts
import { NextResponse } from "next/server";

const DISCORD_API = "https://discord.com/api/v10";

async function deleteBatch(channelId: string) {
  // Get the latest 100 messages
  const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages?limit=100`, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch messages: ${err}`);
  }

  const messages = await res.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return 0; // Channel empty
  }

  // Delete messages one by one (bulk delete only works for <14d old messages)
  for (const msg of messages) {
    try {
      await fetch(`${DISCORD_API}/channels/${channelId}/messages/${msg.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
      });
    } catch {
      // ignore failures (pinned, already deleted, too old, etc.)
    }
  }

  return messages.length;
}

async function purgeChannel(channelId: string) {
  let totalDeleted = 0;

  // Keep looping until no messages left
  while (true) {
    const deleted = await deleteBatch(channelId);
    totalDeleted += deleted;
    if (deleted === 0) break; // stop when channel is empty
  }

  return totalDeleted;
}

export async function POST(req: Request) {
  try {
    const { channel_id } = await req.json();

    if (!channel_id) {
      return NextResponse.json({ error: "channel_id is required" }, { status: 400 });
    }

    const count = await purgeChannel(channel_id);
    return NextResponse.json({ success: true, total_deleted: count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
