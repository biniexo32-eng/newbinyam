// Turns a list of low-star reviews into a small "opportunity report" for one app.
import { THEMES, classify, extractWishes } from './themes.js';

export function analyzeApp(app, reviews) {
  const counts = {};
  const examples = {};
  const wishes = [];

  for (const r of reviews) {
    const text = r.text || '';
    for (const k of classify(text)) {
      counts[k] = (counts[k] || 0) + 1;
      (examples[k] ||= []);
      // keep a couple of short, readable quotes per theme
      if (examples[k].length < 2 && text.length > 30 && text.length < 260) examples[k].push(text);
    }
    wishes.push(...extractWishes(text));
  }

  const total = reviews.length || 1;
  const painPoints = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, n]) => ({
      theme: k,
      label: THEMES[k].label,
      mentions: n,
      share: Math.round((n / total) * 100),
      fix: THEMES[k].fix,
      quotes: examples[k] || [],
    }));

  // Opportunity score: popular app + lots of unhappy users = big opportunity.
  const installs = app.minInstalls || 0;
  const unhappyShare = reviews.length / Math.max(1, app.sampled || reviews.length);
  const confidence = Math.min(1, (app.sampled || 0) / 100); // few reviews = less trustworthy
  const score = Math.round(Math.log10(installs + 10) * 10 * (0.5 + unhappyShare) * (5.2 - (app.score || 4)) * confidence);

  return {
    appId: app.appId,
    title: app.title,
    developer: app.developer,
    icon: app.icon,
    url: app.url,
    rating: app.score ? Number(app.score.toFixed(2)) : null,
    installs: app.installs || null,
    free: app.free,
    reviewsSampled: app.sampled || 0,
    lowStarReviews: reviews.length,
    opportunityScore: score,
    painPoints,
    featureRequests: [...new Set(wishes)].slice(0, 8),
    pitch: painPoints.length
      ? `A ${app.genre || 'similar'} app like ${app.title}, but: ` + painPoints.slice(0, 3).map((p) => p.fix.toLowerCase()).join('; ') + '.'
      : 'Not enough complaints found — users seem happy.',
  };
}
