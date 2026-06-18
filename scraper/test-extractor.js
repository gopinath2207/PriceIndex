/**
 * test-extractor.js — wraps all top-level awaits in a main() async function
 * to stay CommonJS-compatible with Node 22.
 */
'use strict';

const assert    = require('assert');
const puppeteer = require('puppeteer');
const {
  sanitizePrice,
  strategyCSS,
  strategyJSONLD,
  strategyMeta,
  strategyTextScan,
  strategyAriaData,
  extractPriceMultiStrategy,
  withRetryBackoff,
  createRateLimiter,
  randomUserAgent,
} = require('./price-extractor');

// ─── Test runner ──────────────────────────────────────────────────────────────

let passed = 0, failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌  ${name}\n     ${err.message}`);
    failed++;
  }
}

// ─── HTML fixtures ────────────────────────────────────────────────────────────

const HTML_CSS_PRICE = `<html><body>
  <div class="Nx9bqj CxhGGd">₹1,299</div>
</body></html>`;

const HTML_JSONLD_PRICE = `<html><head>
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Product","name":"boAt Airdopes 141",
   "offers":{"@type":"Offer","price":"1299","priceCurrency":"INR"}}
  </script>
</head><body><p>Product page</p></body></html>`;

const HTML_META_PRICE = `<html><head>
  <meta property="product:price:amount" content="34999" />
</head><body><p>Product page</p></body></html>`;

const HTML_TEXT_PRICE = `<html><body>
  <div>
    <span class="xyz_a1b2">Buy Now</span>
    <span class="xyz_c3d4">₹4,999</span>
    <span class="xyz_e5f6">Free delivery</span>
  </div>
</body></html>`;

const HTML_ARIA_PRICE = `<html><body>
  <button aria-label="Add to cart ₹799 for boAt Bassheads">Add to Cart</button>
</body></html>`;

const HTML_DATA_ATTR_PRICE = `<html><body>
  <div data-price="2999" class="atc-widget">Add to Cart</div>
</body></html>`;

const HTML_NO_PRICE = `<html><body>
  <div class="product-page"><p>Product unavailable</p></div>
</body></html>`;

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {

  // ── T1: sanitizePrice (pure, no browser) ────────────────────────────────────
  console.log('\n── T1: sanitizePrice ────────────────────────────────────');

  await test('INR with comma', () => {
    const r = sanitizePrice('₹1,299');
    assert.strictEqual(r.value, '1299');
    assert.strictEqual(r.currency, 'INR');
  });
  await test('INR with space after symbol', () => {
    const r = sanitizePrice('₹ 34,999');
    assert.strictEqual(r.value, '34999');
    assert.strictEqual(r.currency, 'INR');
  });
  await test('USD price', () => {
    assert.strictEqual(sanitizePrice('$199.99').currency, 'USD');
  });
  await test('null input → null', () => assert.strictEqual(sanitizePrice(null), null));
  await test('empty string → null', () => assert.strictEqual(sanitizePrice(''), null));
  await test('whitespace-only → null', () => assert.strictEqual(sanitizePrice('   '), null));
  await test('price with trailing text "₹1,299 onwards"', () => {
    assert.strictEqual(sanitizePrice('₹1,299 onwards').value, '1299');
  });
  await test('₹0 → value "0", not null', () => {
    const r = sanitizePrice('₹0');
    assert.notStrictEqual(r, null);
    assert.strictEqual(r.value, '0');
  });

  // ── Browser tests ────────────────────────────────────────────────────────────
  console.log('\n── Setting up headless browser… ─────────────────────────');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const pageFrom = async (html) => {
    const p = await browser.newPage();
    await p.setContent(html, { waitUntil: 'domcontentloaded' });
    return p;
  };
  console.log('  Browser ready.\n');

  // ── T2: strategyCSS ─────────────────────────────────────────────────────────
  console.log('── T2: strategyCSS ──────────────────────────────────────');

  await test('finds price via Nx9bqj class', async () => {
    const p = await pageFrom(HTML_CSS_PRICE);
    const r = await strategyCSS(p);
    assert.ok(r && r.raw.includes('1,299'), `Got: ${r?.raw}`);
    assert.ok(r.strategy.startsWith('S1:css'));
    await p.close();
  });
  await test('returns null when no selector matches', async () => {
    const p = await pageFrom(HTML_NO_PRICE);
    assert.strictEqual(await strategyCSS(p), null);
    await p.close();
  });
  await test('custom selector takes priority', async () => {
    const p = await pageFrom('<html><body><span class="my-price">₹999</span></body></html>');
    const r = await strategyCSS(p, 'span.my-price');
    assert.ok(r && r.raw.includes('999'));
    await p.close();
  });

  // ── T3: strategyJSONLD ──────────────────────────────────────────────────────
  console.log('\n── T3: strategyJSONLD ───────────────────────────────────');

  await test('extracts from schema.org/Product JSON-LD', async () => {
    const p = await pageFrom(HTML_JSONLD_PRICE);
    const r = await strategyJSONLD(p);
    assert.ok(r && r.raw.includes('1299'));
    assert.strictEqual(r.strategy, 'S2:json-ld');
    await p.close();
  });
  await test('handles malformed JSON-LD gracefully', async () => {
    const p = await pageFrom(`<html><head>
      <script type="application/ld+json">{ INVALID }</script>
    </head><body></body></html>`);
    assert.strictEqual(await strategyJSONLD(p), null);
    await p.close();
  });

  // ── T4: strategyMeta ────────────────────────────────────────────────────────
  console.log('\n── T4: strategyMeta ─────────────────────────────────────');

  await test('extracts from product:price:amount meta tag', async () => {
    const p = await pageFrom(HTML_META_PRICE);
    const r = await strategyMeta(p);
    assert.ok(r && r.raw.includes('34999'));
    assert.strictEqual(r.strategy, 'S3:meta');
    await p.close();
  });
  await test('returns null when no meta price tags', async () => {
    const p = await pageFrom(HTML_NO_PRICE);
    assert.strictEqual(await strategyMeta(p), null);
    await p.close();
  });

  // ── T5: strategyTextScan ────────────────────────────────────────────────────
  console.log('\n── T5: strategyTextScan ─────────────────────────────────');

  await test('finds ₹ price in fully obfuscated class markup', async () => {
    const p = await pageFrom(HTML_TEXT_PRICE);
    const r = await strategyTextScan(p);
    assert.ok(r && r.raw.includes('₹'));
    assert.strictEqual(r.strategy, 'S4:text-scan');
    await p.close();
  });
  await test('returns null for no-price page', async () => {
    const p = await pageFrom(HTML_NO_PRICE);
    assert.strictEqual(await strategyTextScan(p), null);
    await p.close();
  });

  // ── T6: strategyAriaData ────────────────────────────────────────────────────
  console.log('\n── T6: strategyAriaData ─────────────────────────────────');

  await test('extracts from aria-label attribute', async () => {
    const p = await pageFrom(HTML_ARIA_PRICE);
    const r = await strategyAriaData(p);
    assert.ok(r && r.raw.includes('₹799'));
    assert.strictEqual(r.strategy, 'S5:aria-data');
    await p.close();
  });
  await test('extracts from data-price attribute', async () => {
    const p = await pageFrom(HTML_DATA_ATTR_PRICE);
    const r = await strategyAriaData(p);
    assert.ok(r && r.raw.includes('2999'));
    await p.close();
  });

  // ── T7: extractPriceMultiStrategy orchestrator ──────────────────────────────
  console.log('\n── T7: extractPriceMultiStrategy ────────────────────────');

  await test('uses S1 (CSS) when present', async () => {
    const p = await pageFrom(HTML_CSS_PRICE);
    const r = await extractPriceMultiStrategy(p);
    assert.ok(r && r.strategy.startsWith('S1'));
    await p.close();
  });
  await test('falls back to S2 (JSON-LD) when no CSS match', async () => {
    const p = await pageFrom(HTML_JSONLD_PRICE);
    const r = await extractPriceMultiStrategy(p);
    assert.ok(r && r.strategy.startsWith('S2'), `Got: ${r?.strategy}`);
    await p.close();
  });
  await test('falls back to S3 (meta)', async () => {
    const p = await pageFrom(HTML_META_PRICE);
    const r = await extractPriceMultiStrategy(p);
    assert.ok(r && r.strategy.startsWith('S3'), `Got: ${r?.strategy}`);
    await p.close();
  });
  await test('falls back to S4 (text-scan) for obfuscated markup', async () => {
    const p = await pageFrom(HTML_TEXT_PRICE);
    const r = await extractPriceMultiStrategy(p);
    assert.ok(r && r.strategy.startsWith('S4'), `Got: ${r?.strategy}`);
    await p.close();
  });
  await test('returns null for page with no price at all', async () => {
    const p = await pageFrom(HTML_NO_PRICE);
    const r = await extractPriceMultiStrategy(p);
    assert.strictEqual(r, null);
    await p.close();
  });
  await test('result has required fields: raw, strategy, value, currency', async () => {
    const p = await pageFrom(HTML_CSS_PRICE);
    const r = await extractPriceMultiStrategy(p);
    assert.ok(r && r.raw && r.strategy && r.value && r.currency);
    await p.close();
  });

  await browser.close();

  // ── T8: withRetryBackoff (no browser) ───────────────────────────────────────
  console.log('\n── T8: withRetryBackoff ─────────────────────────────────');

  await test('resolves on first try', async () => {
    const res = await withRetryBackoff(async () => 'ok', { retries: 3, baseDelayMs: 10 });
    assert.strictEqual(res, 'ok');
  });
  await test('retries and eventually succeeds', async () => {
    let calls = 0;
    const res = await withRetryBackoff(async () => {
      if (++calls < 3) throw new Error('transient');
      return 'done';
    }, { retries: 3, baseDelayMs: 10 });
    assert.strictEqual(res, 'done');
    assert.strictEqual(calls, 3);
  });
  await test('throws after exhausting retries', async () => {
    await assert.rejects(
      () => withRetryBackoff(async () => { throw new Error('always fails'); },
        { retries: 2, baseDelayMs: 10 }),
      /always fails/
    );
  });

  // ── T9: utilities ────────────────────────────────────────────────────────────
  console.log('\n── T9: Utilities ────────────────────────────────────────');

  await test('randomUserAgent returns a non-empty string', () => {
    const ua = randomUserAgent();
    assert.ok(typeof ua === 'string' && ua.length > 20);
  });
  await test('rate limiter allows calls within window without delay', async () => {
    const limiter = createRateLimiter({ maxPerWindow: 5, windowMs: 2_000 });
    const start   = Date.now();
    for (let i = 0; i < 5; i++) await limiter.wait();
    assert.ok(Date.now() - start < 500, 'Should have finished in < 500ms');
  });

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(56));
  console.log(`  Results: ${passed} passed  ${failed} failed`);
  console.log('─'.repeat(56));
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => { console.error('[fatal]', err); process.exit(1); });