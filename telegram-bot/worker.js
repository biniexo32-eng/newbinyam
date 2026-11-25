// AnyMusicPlayer Telegram bot — runs free on Cloudflare Workers. No database.
// Settings (Cloudflare → Worker → Settings → Variables and Secrets):
//   BOT_TOKEN       secret, from @BotFather
//   WEBHOOK_SECRET  secret, any random text you make up (letters, numbers, _ or -)

const MAX_RESULTS = 5;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // One-time setup: open https://<your-worker>.workers.dev/setup?secret=<WEBHOOK_SECRET>
    if (url.pathname === '/setup') {
      if (url.searchParams.get('secret') !== env.WEBHOOK_SECRET) return new Response('Wrong secret', { status: 403 });
      const hook = await tg(env, 'setWebhook', {
        url: `${url.origin}/webhook`,
        secret_token: env.WEBHOOK_SECRET,
        allowed_updates: ['message', 'callback_query'],
      });
      await tg(env, 'setMyCommands', {
        commands: [
          { command: 'play', description: 'Play a song: /play song name' },
          { command: 'help', description: 'How to use the bot' },
        ],
      });
      return new Response(hook.ok ? '✅ Bot is connected! Open Telegram and send /start to your bot.' : '❌ ' + JSON.stringify(hook));
    }

    if (url.pathname === '/webhook' && request.method === 'POST') {
      if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.WEBHOOK_SECRET) {
        return new Response('Forbidden', { status: 403 });
      }
      const update = await request.json();
      try {
        await handleUpdate(update, env);
      } catch (e) {
        console.error(e);
      }
      return new Response('ok'); // always 200 so Telegram doesn't retry forever
    }

    return new Response('AnyMusicPlayer bot is running.');
  },
};

export async function handleUpdate(update, env) {
  if (update.callback_query) return handleButton(update.callback_query, env);

  const msg = update.message;
  if (!msg || !msg.text) return;
  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const isPrivate = msg.chat.type === 'private';

  if (/^\/(start|help)(@\w+)?$/i.test(text)) {
    return send(env, chatId,
      '🎵 <b>AnyMusicPlayer</b>\n\n' +
      'Send me a song name and I will play a preview.\n\n' +
      'Example:\n<code>/play aster aweke</code>\n\n' +
      'In private chat you can also just type the song name.');
  }

  let query = null;
  const m = text.match(/^\/play(?:@\w+)?\s*(.*)$/is);
  if (m) query = m[1].trim();
  else if (isPrivate && !text.startsWith('/')) query = text;
  if (query === null) return;
  if (!query) return send(env, chatId, 'Type the song name after /play, for example:\n<code>/play teddy afro</code>');

  await tg(env, 'sendChatAction', { chat_id: chatId, action: 'upload_voice' });
  const songs = await searchSongs(query);
  if (!songs.length) return send(env, chatId, `😕 No songs found for "<b>${esc(query)}</b>". Check the spelling or add the artist name.`);

  await playSong(env, chatId, songs[0], songs.slice(1));
}

async function handleButton(cb, env) {
  const chatId = cb.message?.chat?.id;
  const [kind, id] = (cb.data || '').split(':');
  if (kind === 'p' && chatId) {
    await tg(env, 'answerCallbackQuery', { callback_query_id: cb.id, text: '▶️ Loading…' });
    const song = await lookupSong(id);
    if (song) return playSong(env, chatId, song, []);
    return send(env, chatId, '😕 That song is not available any more.');
  }
  return tg(env, 'answerCallbackQuery', { callback_query_id: cb.id });
}

async function playSong(env, chatId, song, others) {
  const youtube = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(`${song.artist} ${song.title}`);
  const keyboard = [
    [{ text: '▶️ Full song on YouTube', url: youtube }],
    ...(song.appleUrl ? [[{ text: '🎵 Apple Music', url: song.appleUrl }]] : []),
    ...others.map((s) => [{ text: `🔁 ${s.artist} – ${s.title}`.slice(0, 60), callback_data: `p:${s.id}` }]),
  ];
  const caption = `🎧 <b>${esc(song.title)}</b>\n👤 ${esc(song.artist)}` +
    (song.album ? `\n💿 ${esc(song.album)}` : '') + '\n\n<i>30-second preview</i>';

  if (song.preview) {
    const r = await tg(env, 'sendAudio', {
      chat_id: chatId, audio: song.preview, title: song.title, performer: song.artist,
      caption, parse_mode: 'HTML', reply_markup: { inline_keyboard: keyboard },
    });
    if (r.ok) return r;
  }
  // No preview (or Telegram couldn't fetch it): send the info with buttons instead.
  return send(env, chatId, caption.replace('<i>30-second preview</i>', '<i>No preview for this song. Tap below to listen.</i>'), keyboard);
}

// ---- Music search (Apple iTunes Search API: free, no key) ----

export function toSong(r) {
  return {
    id: r.trackId, title: r.trackName, artist: r.artistName, album: r.collectionName,
    preview: r.previewUrl, appleUrl: r.trackViewUrl,
  };
}

export async function searchSongs(query) {
  const u = `https://itunes.apple.com/search?media=music&entity=song&limit=${MAX_RESULTS}&term=` + encodeURIComponent(query);
  const res = await fetch(u);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).filter((r) => r.trackId && r.trackName).map(toSong);
}

async function lookupSong(id) {
  if (!/^\d+$/.test(id || '')) return null;
  const res = await fetch('https://itunes.apple.com/lookup?id=' + id);
  if (!res.ok) return null;
  const r = (await res.json()).results?.[0];
  return r ? toSong(r) : null;
}

// ---- Telegram helpers ----

async function tg(env, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  return res.json();
}

function send(env, chatId, text, keyboard) {
  return tg(env, 'sendMessage', {
    chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true,
    ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
  });
}

function esc(s) {
  return String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
