# App Gap Finder

Finds the top trending apps on **Google Play**, reads their unhappy (1–3★) reviews,
groups the complaints into themes, and suggests how a better version of each app could win.

**Cost: $0.** No database, no server, no API key.

- Reviews are fetched with the open-source [`google-play-scraper`](https://github.com/facundoolano/google-play-scraper).
- Complaints are classified with free keyword rules (`src/themes.js`), so no AI is required.
- Only small summaries are saved, as JSON files in `docs/data/`. Raw reviews are never stored.
- The website (`docs/index.html`) is a static page, so it can be hosted free on GitHub Pages.
- A GitHub Actions job (`.github/workflows/weekly-report.yml`) refreshes the data every Monday, for free.

## Run it

```bash
npm install
npm start                                     # Productivity, top 20 apps
node src/run.js FINANCE EDUCATION --apps 30   # any categories you want
npm run report                                # the 4 default categories
```

To list all category names, run `node src/run.js NOPE`.

## View the reports

```bash
npx serve docs      # then open the URL it prints
```

To put it online for free: in GitHub, open **Settings → Pages**, choose the **Deploy from a branch** source,
pick your branch, and set the folder to **/docs**.

## How the "opportunity score" works

Popular app (many installs) × many unhappy recent reviews × low star rating = big opportunity.
Apps with very few reviews get a lower score, because there isn't enough evidence.

## Improving it

- Add keywords or new complaint themes in `src/themes.js`.
- Optional later step: send each app's complaints to a cheap AI model for smarter summaries
  (it costs a few cents per run).

## Be fair

Use the reports to build **your own** app that solves the same problem better.
Don't copy another app's name, logo, design or code.
