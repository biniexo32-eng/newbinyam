// Usage: node src/run.js [CATEGORY ...] [--search "words"] [--apps 20] [--reviews 300]
// Examples:
//   node src/run.js PRODUCTIVITY HEALTH_AND_FITNESS --apps 15
//   node src/run.js --search "learn amharic" --apps 15
import fs from 'node:fs';
import { gplay, requestOptions, sleep } from './play.js';
import { analyzeApp } from './analyze.js';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? Number(args.splice(i, 2)[1]) : def;
};
const NUM_APPS = opt('--apps', 20);
const NUM_REVIEWS = opt('--reviews', 300);
const searches = [];
for (let i; (i = args.indexOf('--search')) >= 0; ) searches.push(args.splice(i, 2)[1]);
const categories = args.length || searches.length ? args : ['PRODUCTIVITY'];

for (const cat of categories) {
  if (!gplay.category[cat]) {
    console.error(`Unknown category "${cat}". Options:\n` + Object.keys(gplay.category).join(', '));
    process.exit(1);
  }
}

async function fetchLowStarReviews(appId) {
  const low = [];
  let token;
  let sampled = 0;
  while (sampled < NUM_REVIEWS) {
    const res = await gplay.reviews({
      appId, sort: gplay.sort.NEWEST, num: 150, paginate: true, nextPaginationToken: token, requestOptions,
    });
    sampled += res.data.length;
    // Only keep what we need (text + stars). Raw reviews are never saved to disk.
    for (const r of res.data) if (r.score <= 3 && r.text) low.push({ score: r.score, text: r.text });
    token = res.nextPaginationToken;
    if (!token || !res.data.length) break;
    await sleep(800); // be polite to Google Play
  }
  return { low, sampled };
}

const index = fs.existsSync('docs/data/index.json') ? JSON.parse(fs.readFileSync('docs/data/index.json', 'utf8')) : { categories: {} };

// Each "group" is either a Play category (top free chart) or a search phrase.
const groups = [
  ...categories.map((cat) => ({
    key: cat,
    label: `top ${NUM_APPS} free apps`,
    fetch: () => gplay.list({ category: gplay.category[cat], collection: gplay.collection.TOP_FREE, num: NUM_APPS, fullDetail: true, requestOptions }),
  })),
  ...searches.map((term) => ({
    key: 'SEARCH_' + term.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
    label: `search "${term}"`,
    fetch: () => gplay.search({ term, num: NUM_APPS, fullDetail: true, requestOptions }),
  })),
];

for (const { key: cat, label, fetch } of groups) {
  console.log(`\n== ${cat}: ${label}`);
  const list = await fetch();

  const reports = [];
  for (const app of list) {
    try {
      const { low, sampled } = await fetchLowStarReviews(app.appId);
      const report = analyzeApp({ ...app, sampled }, low);
      reports.push(report);
      console.log(`  ✓ ${app.title.padEnd(40).slice(0, 40)} ${String(low.length).padStart(4)} low-star / ${sampled}  score ${report.opportunityScore}`);
    } catch (e) {
      console.log(`  ✗ ${app.title}: ${e.message}`);
    }
    await sleep(800);
  }

  reports.sort((a, b) => b.opportunityScore - a.opportunityScore);
  const out = { category: cat, generatedAt: new Date().toISOString(), apps: reports };
  fs.writeFileSync(`docs/data/${cat}.json`, JSON.stringify(out, null, 1));
  index.categories[cat] = { generatedAt: out.generatedAt, apps: reports.length };
  console.log(`  → saved docs/data/${cat}.json`);
}

fs.writeFileSync('docs/data/index.json', JSON.stringify(index, null, 1));
