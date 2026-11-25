# AnyMusicPlayer Telegram bot

Type a song name and the bot plays a 30-second preview inside Telegram,
with buttons for the full song on YouTube and Apple Music.

- **Cost: $0.** Runs on Cloudflare Workers' free plan. No server, no database.
- Music search: Apple's free iTunes Search API (no key needed).

## Commands

| You type | Bot does |
|---|---|
| `/start` or `/help` | Shows how to use it |
| `/play teddy afro` | Plays the best match + shows 4 other matches as buttons |
| `teddy afro` (private chat only) | Same as `/play` |

## Setup (about 10 minutes, works from a phone)

### 1. Create the bot in Telegram
1. Open **@BotFather** in Telegram and send `/newbot`.
2. Name: `AnyMusicPlayer`
3. Username: must end in `bot`, e.g. `AnyMusicPlayerBot` (try another if it's taken).
4. BotFather gives you a **token**. Keep it secret: don't paste it in chats or GitHub.

### 2. Create the free Cloudflare Worker
1. Sign up at **dash.cloudflare.com** (free, no card needed).
2. Go to **Workers & Pages → Create → Create Worker**. Name it `anymusicplayer` and click **Deploy**.
3. Click **Edit code**, delete everything, paste all of `worker.js` from this folder, and click **Deploy**.

### 3. Add the secrets
In the Worker, open **Settings → Variables and Secrets** and add two entries, both as type **Secret**:

| Name | Value |
|---|---|
| `BOT_TOKEN` | the token from BotFather |
| `WEBHOOK_SECRET` | any random text you make up, letters and numbers only, e.g. `music9x7k2q` |

### 4. Connect the bot
Open this in your browser (use your own worker address and secret):

```
https://anymusicplayer.<your-name>.workers.dev/setup?secret=<WEBHOOK_SECRET>
```

When it says **"✅ Bot is connected!"**, open your bot in Telegram and send `/start`.

## Using it in a group
Add the bot to the group and use `/play song name`. In groups it ignores normal chat messages.

## Why not full songs from YouTube?
Downloading YouTube audio breaks YouTube's terms and music copyright, which gets
Telegram bots banned. YouTube also blocks downloads from cloud servers. So the
bot plays a legal preview and links to the full song instead.
