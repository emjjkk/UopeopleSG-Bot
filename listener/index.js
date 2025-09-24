import { Client, GatewayIntentBits, ActivityType  } from "discord.js";
import fetch from "node-fetch";

const client = new Client({intents: [GatewayIntentBits.GuildMembers]});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  client.user?.setPresence({
    status: 'online', // 'online', 'idle', 'dnd', 'invisible'
    activities: [
      {
        name: 'UoPeople Study Group',
        type: ActivityType.Watching, // Playing, Listening, Watching, Competing
      },
    ],
  });
});

client.on("guildMemberAdd", async (member) => {
  console.log(`👤 New member joined: ${member.user.tag}`);

  try {
    await fetch("https://uopeople-sg-bot.vercel.app/api/events/joins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guildId: member.guild.id,
        userId: member.id,
        username: member.user.username,
        joinedAt: member.joinedAt
      }),
    });
    console.log("📡 Event forwarded!");
  } catch (err) {
    console.error("❌ Failed to forward event:", err);
  }
});

client.login(process.env.DISCORD_TOKEN);
