import type { SourceId } from "@/lib/types";

// sourceId → registrable domains owned/operated by that source.
// Used for citation in-degree: when one source's summary mentions another's domain.
const homeSourceDomainTable: Record<SourceId, string[]> = {
  arxiv: ["arxiv.org"],
  "hacker-news": ["news.ycombinator.com", "ycombinator.com"],
  github: ["github.com"],
  "stack-overflow": ["stackoverflow.com", "stackexchange.com"],
  dev: ["dev.to"],
  "indie-hackers": ["indiehackers.com"],
  "eu-regulation": ["digital-strategy.ec.europa.eu", "ec.europa.eu"],
  "us-regulation": ["federalregister.gov"],
  "vietnam-regulation": ["vietnamlaw.gov.vn"],
  baochinhphu: ["baochinhphu.vn", "chinhphu.vn", "bcp.cdnchinhphu.vn"],
  congbobanan: ["congbobanan.toaan.gov.vn", "toaan.gov.vn"],
  "world-bank": ["worldbank.org", "data.worldbank.org"],
  openalex: ["openalex.org"],
  "hugging-face": ["huggingface.co"],
  "microsoft-research": ["microsoft.com/en-us/research", "research.microsoft.com"],
  "google-ai": ["blog.google", "deepmind.google", "ai.google"],
  "mit-sloan": ["sloanreview.mit.edu"],
  "social-media-today": ["socialmediatoday.com"],
  wikimedia: ["wikimediafoundation.org", "wikimedia.org", "wikipedia.org"],
  "creative-commons": ["creativecommons.org"],
  "open-knowledge-foundation": ["okfn.org", "blog.okfn.org"],
  openstreetmap: ["openstreetmap.org", "blog.openstreetmap.org"],
  "internet-archive": ["archive.org", "blog.archive.org"],
  "learning-equality": ["learningequality.org"],
  carpentries: ["carpentries.org"],
  "public-knowledge-project": ["pkp.sfu.ca"],
  "center-for-open-science": ["cos.io"],
  numfocus: ["numfocus.org"],
  "open-source-ecology": ["opensourceecology.org"],
  "open-education-global": ["oeglobal.org"],
  oapen: ["library.oapen.org", "directory.doabooks.org"],
  "open-food-facts": ["openfoodfacts.org", "blog.openfoodfacts.org"],
  apereo: ["apereo.org"],
  posit: ["posit.co", "rstudio.com"],
  moodle: ["moodle.com", "moodle.org"],
  h5p: ["h5p.org"],
  "canvas-lms": ["instructure.com", "canvaslms.com"],
  overleaf: ["overleaf.com"],
  pensoft: ["pensoft.net"],
  frontiers: ["frontiersin.org"],
  automattic: ["automattic.com", "wordpress.com", "tumblr.com", "woocommerce.com"],
  proton: ["proton.me", "protonmail.com", "protonvpn.com"],
  plausible: ["plausible.io"],
  matomo: ["matomo.org"],
  mastodon: ["joinmastodon.org", "mastodon.social"],
  bluesky: ["bsky.app", "blueskyweb.org"],
  hashnode: ["hashnode.com"],
  discord: ["discord.com"],
};

// Build sourceId → domains map with normalized hosts (strip www.).
const normalizeHost = (raw: string): string => raw.toLowerCase().replace(/^www\./, "").trim();

export const homeSourceDomains: Map<string, Set<string>> = new Map(
  Object.entries(homeSourceDomainTable).map(([sourceId, domains]) => [
    sourceId,
    new Set(domains.map(normalizeHost)),
  ]),
);

// Terminal sourceId → domains (single homepage each). Built from sourceDefinitions at module load.
const terminalDomainEntries: Array<[string, string[]]> = [
  ["eia", ["eia.gov"]],
  ["federal-register-bis", ["federalregister.gov"]],
  ["nist-chips", ["nist.gov"]],
  ["federal-reserve", ["federalreserve.gov"]],
  ["nsf", ["nsf.gov"]],
  ["vietnam-government", ["baochinhphu.vn"]],
  ["vietnam-science-technology", ["mst.gov.vn"]],
  ["evn", ["evn.com.vn"]],
  ["moit", ["moit.gov.vn"]],
  ["ndrc-notices", ["ndrc.gov.cn"]],
  ["nea", ["nea.gov.cn"]],
  ["miit", ["miit.gov.cn"]],
  ["scmp", ["scmp.com"]],
  ["technode", ["technode.com"]],
  ["vnexpress", ["vnexpress.net"]],
  ["vietnamplus", ["vietnamplus.vn", "vietnamplus.com.vn"]],
  ["vir", ["vir.com.vn"]],
  ["vneconomy", ["vneconomy.vn"]],
  ["nikkei-asia", ["asia.nikkei.com", "nikkei.com"]],
  ["bloomberg", ["bloomberg.com"]],
  ["wsj", ["wsj.com"]],
  ["ieee-spectrum", ["spectrum.ieee.org", "ieee.org"]],
];

export const terminalSourceDomains: Map<string, Set<string>> = new Map(
  terminalDomainEntries.map(([sourceId, domains]) => [sourceId, new Set(domains.map(normalizeHost))]),
);

// Crypto terminal sourceId → domains.
const cryptoDomainEntries: Array<[string, string[]]> = [
  ["coindesk", ["coindesk.com"]],
  ["cointelegraph", ["cointelegraph.com"]],
  ["cointelegraph-markets", ["cointelegraph.com"]],
  ["bitcointalk-launches", ["bitcointalk.org"]],
  ["airdrops-io", ["airdrops.io"]],
  ["coingecko-trending", ["coingecko.com"]],
  ["solana", ["solana.com"]],
  ["sui", ["sui.io"]],
  ["sei", ["sei.io", "blog.sei.io"]],
  ["blast", ["blast.io", "blog.blast.io"]],
  ["coingecko-markets", ["coingecko.com"]],
  ["defillama-chains", ["defillama.com", "llama.fi"]],
  ["defillama-protocols", ["defillama.com", "llama.fi"]],
  ["bitcoin-magazine", ["bitcoinmagazine.com"]],
  ["bitmex", ["bitmex.com", "blog.bitmex.com"]],
  ["monero", ["getmonero.org"]],
  ["monero-observer", ["monero.observer"]],
  ["cardano-iohk", ["iohk.io", "input-output.io"]],
  ["cardano-org", ["cardano.org"]],
  ["celestia", ["celestia.org", "blog.celestia.org"]],
  ["movement", ["movementnetwork.xyz", "movementlabs.xyz"]],
  ["the-defiant", ["thedefiant.io"]],
  ["blockworks", ["blockworks.co"]],
  ["decrypt", ["decrypt.co"]],
  ["cryptoslate", ["cryptoslate.com"]],
  ["dappradar", ["dappradar.com"]],
  ["matter-labs", ["matter-labs.io", "blog.matter-labs.io", "zksync.io"]],
];

export const cryptoSourceDomains: Map<string, Set<string>> = new Map(
  cryptoDomainEntries.map(([sourceId, domains]) => [sourceId, new Set(domains.map(normalizeHost))]),
);

// Extract registrable host from a URL string. Public-suffix-light: strip www.,
// keep last two labels (covers .com/.org/.vn/.cn). For two-letter TLDs + country
// second level (co.uk, com.vn, com.cn) keep three labels.
export function registrableDomain(url: string): string | null {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
  const labels = host.split(".");
  if (labels.length <= 2) return host;
  const tld = labels.at(-1) ?? "";
  const sld = labels.at(-2) ?? "";
  const twoPartTlds = new Set(["uk", "vn", "cn", "jp", "kr", "au", "nz", "br", "za", "in"]);
  if (twoPartTlds.has(tld) && ["co", "com", "org", "net", "gov", "ac", "edu"].includes(sld)) {
    return labels.slice(-3).join(".");
  }
  return labels.slice(-2).join(".");
}

// Match a domain string against a sourceId's known domain set.
export function domainToSourceId(domain: string, sourceDomains: Map<string, Set<string>>): string | null {
  const normalized = domain.toLowerCase().replace(/^www\./, "");
  for (const [sourceId, domains] of sourceDomains) {
    if (domains.has(normalized)) return sourceId;
    // Also match if normalized ends with ".<sourceDomain>" (subdomain of a known source).
    for (const d of domains) {
      if (normalized.endsWith(`.${d}`)) return sourceId;
    }
  }
  return null;
}
