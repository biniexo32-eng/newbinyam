// Free, offline complaint classifier. Each theme = keywords to look for in a review.
// Add or tweak keywords here to improve results; no AI or API key needed.
export const THEMES = {
  ads: {
    label: 'Too many ads',
    fix: 'Few or no ads (or a one-time "remove ads" purchase)',
    words: ['ads', 'ad after', 'ad every', 'an ad ', 'commercials', 'pop up', 'popup', 'pop-up', 'remove ads'],
  },
  pricing: {
    label: 'Paywall / subscription too expensive',
    fix: 'Generous free tier, fair one-time price instead of forced subscription',
    words: ['subscription', 'paywall', 'premium', 'expensive', 'pay ', 'paid', 'money', 'price', 'charge', 'refund', 'trial', 'pro version'],
  },
  crashes: {
    label: 'Crashes & bugs',
    fix: 'Rock-solid stability as the #1 selling point',
    words: ['crash', 'bug', 'glitch', 'freez', 'not working', "doesn't work", 'doesnt work', 'stopped working', 'broken', 'error', 'force close', 'keeps closing'],
  },
  performance: {
    label: 'Slow / heavy / battery drain',
    fix: 'Lightweight, fast app that works on cheap phones',
    words: ['slow', 'lag', 'loading', 'takes forever', 'battery', 'storage', 'heavy', 'too big', 'memory'],
  },
  account: {
    label: 'Login / account problems',
    fix: 'Works without an account, or simple one-tap login',
    words: ['login', 'log in', 'sign in', 'signin', 'account', 'password', 'verification', 'otp', 'locked out', 'banned'],
  },
  dataLoss: {
    label: 'Lost data / sync issues',
    fix: 'Reliable local storage + easy backup/export',
    words: ['lost', 'deleted', 'sync', 'backup', 'disappeared', 'gone', 'restore', 'export'],
  },
  updates: {
    label: 'New update made it worse',
    fix: 'Keep the features users loved in the old version',
    words: ['update', 'new version', 'old version', 'used to', 'previous version', 'bring back'],
  },
  ux: {
    label: 'Confusing / cluttered design',
    fix: 'Clean, simple interface that does one thing well',
    words: ['confusing', 'complicated', 'hard to use', 'cluttered', 'interface', 'ui', 'design', 'navigate', 'not intuitive', 'annoying'],
  },
  privacy: {
    label: 'Privacy / permissions worries',
    fix: 'Privacy-first: minimal permissions, no tracking, works offline',
    words: ['privacy', 'permission', 'data collection', 'tracks me', 'tracking me', 'tracking my', 'spy', 'spyware', 'personal data', 'my location', 'my contacts', 'scam', 'sells data', 'selling data'],
  },
  notifications: {
    label: 'Spammy notifications',
    fix: 'Quiet by default, fully controllable notifications',
    words: ['notification', 'spam', 'emails', 'reminder'],
  },
  support: {
    label: 'Bad customer support',
    fix: 'Fast, human support and a public roadmap',
    words: ['support', 'customer service', 'no response', 'never respond', 'contact', 'help center'],
  },
  offline: {
    label: 'Needs internet / no offline mode',
    fix: 'Full offline mode',
    words: ['offline', 'internet', 'wifi', 'connection', 'network'],
  },
  // Themes that matter most for learning / education apps
  audio: {
    label: 'No audio / bad pronunciation',
    fix: 'Native-speaker audio for every letter, word and sentence',
    words: ['audio', 'pronunciation', 'pronounce', 'sound', 'voice', 'speaker', 'hear', 'listen'],
  },
  accuracy: {
    label: 'Wrong translations / mistakes',
    fix: 'Content checked by native speakers',
    words: ['wrong', 'incorrect', 'mistake', 'not accurate', 'inaccurate', 'translation', 'misspel', 'typo'],
  },
  depth: {
    label: 'Too basic / not enough lessons',
    fix: 'A full path from letters to real conversations',
    words: ['too basic', 'only basic', 'not enough', 'more lessons', 'more words', 'limited', 'few words', 'beginner', 'repetitive'],
  },
};

// Phrases that usually introduce a feature request.
export const WISH_PATTERNS = [
  /please add[^.!?]*/i,
  /i wish[^.!?]*/i,
  /would be (nice|great|better|awesome)[^.!?]*/i,
  /(it )?should (have|add|allow|let)[^.!?]*/i,
  /(need|needs) (a|an|to|more)[^.!?]*/i,
  /add (a|an|the) option[^.!?]*/i,
  /why (can't|cant|doesn't|doesnt|isn't|isnt)[^.!?]*/i,
];

// Each keyword must start at a word boundary ("ads" matches "ads" but not "loads").
const esc = (w) => w.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const MATCHERS = Object.fromEntries(
  Object.entries(THEMES).map(([k, t]) => [k, t.words.map((w) => new RegExp('\\b' + esc(w) + (/\s$/.test(w) || w.length <= 3 ? '\\b' : ''), 'i'))])
);

export function classify(text) {
  return Object.keys(MATCHERS).filter((k) => MATCHERS[k].some((re) => re.test(text)));
}

export function extractWishes(text) {
  const out = [];
  for (const re of WISH_PATTERNS) {
    const m = text.match(re);
    if (m && m[0].length > 15 && m[0].length < 160) out.push(m[0].trim());
  }
  return out;
}
