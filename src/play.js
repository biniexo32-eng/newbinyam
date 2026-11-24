// Thin wrapper around google-play-scraper that also works behind an HTTPS proxy.
import gplay from 'google-play-scraper';
import { HttpsProxyAgent } from 'hpagent';
import fs from 'node:fs';

const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const caPath = process.env.NODE_EXTRA_CA_CERTS || '/root/.ccr/ca-bundle.crt';
const agent = proxy
  ? { https: new HttpsProxyAgent({ proxy, ca: fs.existsSync(caPath) ? fs.readFileSync(caPath) : undefined }) }
  : undefined;

export const requestOptions = agent ? { agent } : {};
export { gplay };

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
