# VN Crypto Tax Estimator — Design

**Date:** 2026-08-09
**Status:** Approved (pending implementation)
**Route:** `/vn-tax-crypto-tools`

## Purpose

A client-only tool that ingests a Binance Order/Trade History CSV export and estimates the Vietnam personal income tax (PIT) owed under the current pilot crypto tax framework. Output: per-sell-row tax, bucketed totals, audit trail of every parsed row.

## Regulation (primary source verified)

Source of truth: **Circular No. 32/2026/TT-BTC** (Bộ Tài chính / Ministry of Finance), official English translation read in full from ssc.gov.vn. Root authority: **Resolution 05/2025/NQ-CP** (9 Sep 2025), 5-year pilot of the crypto asset market.

Verbatim governing text — Article 5:

> Individual investors (regardless of whether they are residents or non-residents) who transfer crypto assets through a crypto asset service provider are subject to personal income tax at a rate of **0.1% on the transfer price for each transaction**.

Confirmed facts:

| Fact | Source |
|---|---|
| Individual PIT rate = 0.1% | Art. 5, TT 32/2026/TT-BTC |
| Base = transfer price per transaction (gross, not gains) | Art. 5 |
| Applies to resident + non-resident individuals | Art. 5 |
| VAT exempt on crypto transfer/trading | Art. 3.1 |
| Domestic corp CIT = 20% on net (sell − cost − expenses) | Art. 4.1 |
| Foreign corp CIT = 0.1% on gross transfer revenue | Art. 4.3 |
| Effective 27 Mar 2026; lasts the pilot period | Art. 7.1 |

## Assumptions and confidence caveats

The Circular leaves several questions unresolved. The tool commits to a defensible reading for each and surfaces it in the UI disclaimer — not silently.

1. **"Through a crypto asset service provider."** The 0.1% rate is written for transfers *through licensed VN providers*. Binance is not yet a VN-licensed provider under the pilot. The tool computes the 0.1% anyway as the only quantified interim rule and flags this caveat loudly.
2. **"Transfer price" = gross sale value** (quote-currency proceeds), by analogy to VN securities transfer tax (0.1% of gross transaction value).
3. **Buys not taxed.** "Transfer" is read as disposal/sale; buys are acquisitions. Only SELL legs bear 0.1%.
4. **Crypto-to-crypto and wallet-to-wallet** — Circular silent. Out of scope. Tool handles only exchange fills from the CSV.
5. **Pre-27 Mar 2026 trades** — Circular not retroactive. Pre-effective-date sells go to a separate "grey-zone" bucket with $0 tax and a warning. The pre-pilot legal position was ambiguous.
6. **Non-VND quotes** (USDT, EUR, etc.) — tax shown in the quote currency. FX to VND is the user's responsibility (out of scope; may add later).

## Scope

**In scope:**
- Paste or drop a Binance Order History / Trade History CSV.
- Parse, validate, classify rows (BUY / SELL / skipped).
- Compute 0.1% PIT on each SELL dated on/after 27 Mar 2026.
- Bucket pre-effective-date sells separately.
- Show totals, per-row tax, and skipped-row audit.
- Always-visible disclaimer.

**Out of scope:**
- FX conversion to VND.
- FIFO / cost-basis / gains (tax base is transfer value, not gains).
- Crypto-to-crypto, wallet-to-wallet, staking, airdrops, futures, P2P.
- Persistence, accounts, server-side processing.
- CIT computation (individuals only).
- Tax filing / form generation.

## Architecture

Fully client-side. No API route, no DB, no server fetch. No new dependencies (Zod already in tree). Trade data never leaves the browser.

```
app/vn-tax-crypto-tools/
  page.tsx                      metadata + Suspense wrapper
components/
  vn-tax-calculator.tsx         main client component (UI + state)
lib/vn-tax/
  constants.ts                  EFFECTIVE_DATE, PIT_RATE, Binance column maps
  schema.ts                     Zod schemas + inferred types
  parse-binance-csv.ts          CSV string → { trades, skipped }
  compute-tax.ts                ParsedTrade[] → TaxResult (pure)
  format.ts                     currency / date formatting helpers
  parse-binance-csv.test.ts     unit tests
  compute-tax.test.ts           unit tests
```

## Tax engine

Pure functions, no DOM access, fully unit-testable.

### Constants

```ts
// lib/vn-tax/constants.ts
export const PIT_RATE = 0.001;                                    // 0.1%
export const CIRCULAR_32_EFFECTIVE = new Date("2026-03-27T00:00:00+07:00"); // ICT
export type Side = "BUY" | "SELL";
```

### Schema

```ts
// lib/vn-tax/schema.ts
import { z } from "zod";

export const ParsedTrade = z.object({
  date: z.date(),
  pair: z.string(),                  // e.g. "BTCUSDT"
  base: z.string(),                  // "BTC"
  quote: z.string(),                 // "USDT"
  side: z.enum(["BUY", "SELL"]),
  grossValue: z.number().positive(), // Total column, quote currency
});
export type ParsedTrade = z.infer<typeof ParsedTrade>;

export interface SkippedRow {
  rowIndex: number;
  raw: Record<string, string>;
  reason: string;
}
```

### Compute

```ts
// lib/vn-tax/compute-tax.ts
export interface TaxedTrade {
  date: Date;
  pair: string;
  base: string;
  quote: string;
  grossValue: number;
  tax: number;                       // grossValue * 0.001
}

export interface TaxResult {
  taxable: TaxedTrade[];             // SELL on/after EFFECTIVE
  greyZone: ParsedTrade[];           // SELL before EFFECTIVE — $0 tax, flagged
  buys: ParsedTrade[];               // BUY rows — not taxed, shown for audit
  totalsByQuote: Record<string, {
    grossProceeds: number;
    tax: number;
    count: number;
  }>;
  totals: {
    taxableSellCount: number;
    greyZoneCount: number;
    buyCount: number;
  };
}

export function computeTax(trades: ParsedTrade[]): TaxResult;
```

Logic: partition by side and date. Each taxable sell contributes `grossValue * PIT_RATE`. Group totals by quote currency. No gains, no lot matching.

## CSV parser

### Supported Binance export formats

```
Order History (English):
  Date(UTC), Pair, Type, Side, Average Price, Price, Executed, Amount, Total, status

Trade History (English):
  Date(UTC), Pair, Type, Order Amount, Average Price, Filled Amount, Total, status
```

### Detection

Read first non-empty line. Split on comma. Match against known header sets (exact, after trim). Unknown → all rows skipped with reason `"unrecognized CSV format — expected Binance Order History or Trade History"`.

Trade History has no `Side` column — `Type` contains the string `buy` or `sell` (case-insensitive substring match). Parser derives `Side` from `Type` for that variant. A row whose `Type` matches neither → skipped with reason `"unrecognized side"`.

### Per-row validation

Zod transform per row:
- `Date(UTC)` → `new Date(value + "Z")`. Invalid → skip, reason `"invalid date"`.
- `Side` (or derived from `Type`) → `BUY | SELL`. Other → skip, reason `"unrecognized side"`.
- `Total` → `Number(value)`. NaN / ≤ 0 → skip, reason `"invalid total"`.
- `Pair` → regex `^([A-Z0-9]+)(USDT|USD|BTC|ETH|BNB|EUR|VND|FDUSD|USDC)$` to split base/quote. No match → skip, reason `"unrecognized pair"`.

Rows failing any check land in `SkippedRow[]` with the specific reason. Never silently coerce.

### Input handling

Accept input two ways:
1. Paste into `<textarea>`.
2. Drag-and-drop or file-picker `.csv` → `FileReader.readAsText`.

Both feed the same parse function with the raw string.

## UI

Single client component, three vertical zones. Terminal aesthetic consistent with `app/crypto/`.

### Zone 1 — Header + disclaimer

Always visible. Disclaimer cannot be dismissed.

> **Estimate only — not tax advice.** Computed under Circular 32/2026/TT-BTC Art. 5 (0.1% PIT on transfer price), the interim securities-analog rule from Resolution 05/2025/NQ-CP. This rate is written for transfers through *licensed* VN crypto asset service providers; Binance may not yet qualify, so actual liability may differ. Only sells dated on/after 27 Mar 2026 are counted; earlier sells fall in a pre-pilot grey zone. Verify with a VN tax advisor before filing.

### Zone 2 — Input

`<textarea>` for CSV paste, plus drop zone + file picker. Buttons: `Load sample`, `Clear`. On valid parse → results render below.

### Zone 3 — Results

Summary cards:
- **Total tax** (sum across quote currencies, with per-currency breakdown below)
- **# taxable sells** (on/after effective date)
- **# grey-zone trades** (pre-effective-date sells)
- **# skipped rows** (parse failures)

Tables:
- **Taxable trades** — date, pair, gross value, tax. Sortable by date desc (default).
- **Grey-zone trades** — collapsed by default. Same columns + `$0 tax` + warning icon.
- **Skipped rows** — collapsed. row index, raw cells, reason.

### Empty / error states

- Empty input: prompt text, no results.
- Unrecognized format: error banner naming the expected formats, no partial result.
- All rows skipped: results render with zero counts and the skipped table auto-expanded.

## Data flow

```
paste/drop CSV → raw string
  → parseBinanceCsv(raw): { trades: ParsedTrade[]; skipped: SkippedRow[] }
    → computeTax(trades): TaxResult
      → useMemo'd render
```

`useState` for raw input; `useMemo` for parse + compute. No persistence, no localStorage, cleared on unmount.

## Edge cases

| Case | Handling |
|---|---|
| Mixed quote currencies (BTCUSDT + BTCEUR) | Totals grouped per quote currency. Card shows per-quote breakdown. Warn if mixed. |
| Non-VND quote (USDT etc.) | Tax shown in quote currency; FX to VND is the user's job. |
| Sell dated before 27 Mar 2026 | greyZone bucket, $0 tax, warning row. |
| BUY rows | Stored, shown in audit table, not taxed. |
| Duplicate paste | Idempotent — same CSV → same result. |
| Malformed CSV (unclosed quote) | Parser throws → error banner, no partial result. |
| Empty / whitespace input | Empty state, prompt to paste. |
| `Total` ≤ 0 or NaN | Skip with reason. |
| Very large CSV (10k+ rows) | Memoized; no perf concern at this scale. |
| Unknown quote ticker in pair | Skip row with reason `"unrecognized pair"`. |

## Testing

Pure core fully unit-tested with `tsx --test`, matching the existing `test:services` pattern.

`lib/vn-tax/parse-binance-csv.test.ts`:
- Order History variant — valid rows parse.
- Trade History variant — side derived from Type.
- Both header variants in one paste — second treated as data rows, flagged skipped.
- Malformed date / negative Total / unknown pair / unknown side → skipped with correct reason.
- Empty input → empty result.
- Unrecognized headers → all rows skipped, single reason.

`lib/vn-tax/compute-tax.test.ts`:
- Sell on effective date → taxable.
- Sell day before effective → greyZone.
- BUY only → empty taxable, all in buys.
- Mixed quotes → per-quote totals correct.
- All-skipped input → zero totals.

Add npm script `"test:tax": "tsx --test lib/vn-tax/**/*.test.ts"`.

## Non-goals / future

- FX lookup to convert non-VND tax to VND.
- Support for other exchanges (OKX, Bybit).
- CIT path for business traders.
- Filing-form PDF generation.

## Sources

- Circular No. 32/2026/TT-BTC (official English translation), ssc.gov.vn — https://ssc.gov.vn (Art. 3, 4, 5, 7)
- Resolution 05/2025/NQ-CP (9 Sep 2025), Government of Vietnam
- Baker McKenzie — Vietnam Launches Pilot Tax Framework for Crypto Asset Transactions — https://www.bakermckenzie.com/en/insight/publications/2026/05/vietnam-launches-pilot-tax-framework-for-crypto-asset-transactions
- LuatVietnam — Government resolves to facilitate crypto asset market operation — https://english.luatvietnam.vn/legal-updates/government-resolves-to-facilitate-crypto-asset-market-operation-892-104216-article.html
- Vietnam News — MoF proposes 0.1% PIT — https://vietnamnews.vn/economy/1765422/ministry-proposes-0-1-per-cent-tax-on-crypto-assets-trading.html
