// import { createClient } from '@supabase/supabase-js';
// import puppeteer from 'puppeteer';
// import 'dotenv/config';

// // 1. Database Connection
// import pg from 'pg';
// const { Client } = pg;

// const client = new Client({
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false }
// });

// async function runScraper() {
//   console.log("🚀 Starting Nightly Scraper Engine v2 (Puppeteer)...");
//   await client.connect();

//   // Launch Invisible Google Chrome
//   console.log("🌐 Launching headless browser...");
//   const browser = await puppeteer.launch({ 
//     headless: true,
//     // These arguments help bypass basic bot-protections
//     args: ['--no-sandbox', '--disable-setuid-sandbox']
//   });

//   const page = await browser.newPage();

//   // Set a real user-agent so Samsung thinks this is a real person on a Windows PC
//   await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

//   // Target Configuration
//   const targetUrl = 'https://www.samsung.com/in/smartphones/galaxy-s25/buy/';

//   try {
//     console.log(`🕵️ Navigating to: ${targetUrl}`);
//     // Wait until the network is relatively quiet
//     await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });

//     console.log("⏳ Waiting 5 seconds for Samsung's dynamic prices to render...");
//     // Explicitly wait 5 seconds to ensure React/Vue finishes drawing the price tags
//     await new Promise(resolve => setTimeout(resolve, 5000));

//     console.log("🧠 Analyzing all visible page text for pricing data...");

//     // Extract EVERYTHING the user can see on the screen as raw text
//     const pageText = await page.evaluate(() => document.body.innerText);

//     // TRICK: Websites often use invisible spaces, newlines, or spans to break up numbers.
//     // We will violently strip ALL spaces, commas, tabs, and newlines to compress the text first.
//     const compressedText = pageText.replace(/[\s,]/g, "");

//     // REGEX: Hunt for the Rupee symbol followed immediately by numbers
//     const priceRegex = /₹([0-9]+)(\.[0-9]{1,2})?/g;
//     const matches = compressedText.match(priceRegex);

//     if (!matches) {
//         throw new Error("Could not find any Rupee symbols on the page after compression.");
//     }

//     // Clean up the found matches (remove ₹) and convert to numbers
//     const extractedPrices = matches.map(priceString => {
//         return parseFloat(priceString.replace(/[^0-9.]/g, ""));
//     });

//     console.log(`🔎 Raw prices found by bot: ${extractedPrices.join(', ')}`);

//     // We only want the full retail price, not the cheap monthly EMI plans (e.g., ignore anything under ₹10,000)
//     // We also set an upper limit of ₹300,000 to ignore accidental massive numbers like phone numbers.
//     const validRetailPrices = extractedPrices.filter(price => price > 10000 && price < 300000);

//     if (validRetailPrices.length === 0) {
//         throw new Error("Found prices, but none look like the full retail price.");
//     }

//     // THE HEURISTIC UPGRADE:
//     // Instead of grabbing the absolute highest price on the page (which grabs the 1TB/512GB variant),
//     // we find the MOST FREQUENT price. The selected variant's price is usually repeated 
//     // in the header, the main box, the summary, and the "What's in the box" section!

//     const priceCounts = validRetailPrices.reduce((acc, price) => {
//         acc[price] = (acc[price] || 0) + 1;
//         return acc;
//     }, {});

//     let finalPrice = 0;
//     let maxOccurrences = 0;

//     for (const [price, count] of Object.entries(priceCounts)) {
//         if (count > maxOccurrences) {
//             maxOccurrences = count;
//             finalPrice = parseFloat(price);
//         }
//     }

//     console.log(`📊 Price frequency analysis:`, priceCounts);
//     console.log(`✅ Success! Found the currently selected Retail Price: ₹${finalPrice} (Appeared ${maxOccurrences} times)`);

//     // (Next Step: We will write the code here to INSERT this price into Supabase)

//   } catch (error) {
//     console.error(`❌ Error scraping: ${error.message}`);
//     // Take a full-page screenshot to see exactly what went wrong
//     await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
//     console.log("📸 Saved a fresh 'error-screenshot.png' for debugging.");
//   } finally {
//     await browser.close();
//     await client.end();
//     console.log("🏁 Scraper finished. Shutting down.");
//   }
// }

// runScraper();















// import { createClient } from '@supabase/supabase-js';
// import puppeteer from 'puppeteer';
// import 'dotenv/config';

// // 1. Database Connection
// import pg from 'pg';
// const { Client } = pg;

// const client = new Client({
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false }
// });

// async function runScraper() {
//   console.log("🚀 Starting Nightly Scraper Engine v2 (Amazon version)...");
//   await client.connect();

//   // Launch Invisible Google Chrome
//   console.log("🌐 Launching headless browser...");
//   const browser = await puppeteer.launch({ 
//     headless: true,
//     // These arguments help bypass basic bot-protections
//     args: [
//         '--no-sandbox', 
//         '--disable-setuid-sandbox',
//         '--disable-blink-features=AutomationControlled' // Helps hide that this is a bot
//     ]
//   });

//   const page = await browser.newPage();

//   // Set a real user-agent so Amazon thinks this is a real person
//   await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

//   // Target Configuration: Amazon uses ASINs (Amazon Standard Identification Numbers).
//   // Every color and storage variant gets its own unique URL, making scraping incredibly easy!
//   // E.g., B0CS32P5K4 is a specific Samsung Galaxy S24 variant on Amazon India.
//   const targetUrl = 'https://www.flipkart.com/samsung-galaxy-s25-5g-icyblue-256-gb/p/itm3c1e495903acc?pid=MOBH8K8UA9ZHYYXG&marketplace=FLIPKART&lid=LSTMOBH8K8UA9ZHYYXGV6QC3G&pageUID=1781728677624';

//   try {
//     console.log(`🕵️ Navigating to Amazon: ${targetUrl}`);
//     // domcontentloaded is safer for Amazon, as networkidle2 can hang forever on tracking pixels
//     await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

//     console.log("⏳ Waiting for Amazon's price element...");

//     // Amazon consistently uses the class 'a-price-whole' for the main retail price
//     const priceSelector = '.a-price-whole';
//     // const priceSelector = '._1psv1ze0'; // Flipkart's price selector
//     //  v1zwn20 _1psv1zeb9 _1psv1ze0 v1zwn21m

//     await page.waitForSelector(priceSelector, { timeout: 15000 });

//     // Extract the text inside the element
//     const rawPrice = await page.$eval(priceSelector, el => el.innerText);

//     // Clean the text (Remove commas and invisible characters)
//     const finalPrice = parseFloat(rawPrice.replace(/[^0-9]/g, ""));

//     console.log(`✅ Success! Found the Amazon Retail Price: ₹${finalPrice}`);

//     // (Next Step: We will write the code here to INSERT this price into Supabase)

//   } catch (error) {
//     console.error(`❌ Error scraping: ${error.message}`);
//     // Take a full-page screenshot to see exactly what went wrong
//     await page.screenshot({ path: 'amazon-error-screenshot.png', fullPage: true });
//     console.log("📸 Saved 'amazon-error-screenshot.png' for debugging. (Amazon sometimes blocks bots with CAPTCHAs!)");
//   } finally {
//     await browser.close();
//     await client.end();
//     console.log("🏁 Scraper finished. Shutting down.");
//   }
// }

// runScraper();



/**
 * price-extractor.js
 *
 * Drop-in replacement/enhancement for the extraction layer in index.js.
 * Implements FIVE independent strategies in priority order so that if
 * Flipkart changes its DOM, obfuscates class names, or lazy-loads the price,
 * at least one strategy still succeeds.
 *
 * Strategies (executed in order):
 *  S1 — CSS selector waterfall  (fast, first-choice)
 *  S2 — JSON-LD structured data (schema.org/Product — most reliable long-term)
 *  S3 — Meta / OpenGraph tags   (og:price:amount — lightweight fallback)
 *  S4 — Regex text scan         (walks every text node for ₹ pattern)
 *  S5 — aria-label / data-price (accessibility attributes, surprisingly stable)
 *
 * Each strategy is isolated in its own function so it can be unit-tested
 * independently against a mock HTML fixture.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─── Selector catalogue ───────────────────────────────────────────────────────
// Kept as an ordered array: most-specific → least-specific.
// Add NEW selectors to the TOP so they are tried first.

const PRICE_SELECTORS = [
  // ── 2025+ class names (obfuscated but observed in the wild) ──
  'div.Nx9bqj.CxhGGd',
  'div.Nx9bqj',
  '.yRaY8j',                       // discount-block sibling (current offer price)
  '.hl05eU .Nx9bqj',               // price inside product summary block
  '.CEmiEU .Nx9bqj',
  'div.v1zwn21m',
  'div.v1zwn20', 
  'div._1psv1zeb9', 
  'div._1psv1ze0',

  // ── 2023-2024 class names ──
  'div._30jeq3._16Jk6d',           // final/discounted price
  'div._30jeq3',                    // base price container
  '._16Jk6d',                      // alternate final-price class

  // ── Older layouts (still alive on some category pages) ──
  'div._25b18c ._30jeq3',
  'div._3qQ9m1 ._30jeq3',
  'div._1vC4OE._3qQ9m1',

  // ── MRP / original price (absolute last resort) ──
  'div._3I9_wc._2p6lqe',
  'div._3I9_wc',

  // ── Semantic / attribute-based (resilient to class-name churn) ──
  '[data-testid="price"]',
  '[data-price]',
  '[itemprop="price"]',
  'span[class*="price" i]',
  'div[class*="price" i]',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INR_PATTERN = /₹\s?[\d,]+(?:\.\d{1,2})?/;

/**
 * Converts a raw price string into { value: string, currency: string }.
 * Exported so it can be unit-tested without a browser.
 */
function sanitizePrice(raw) {
  if (!raw) return null;
  const map = { '₹': 'INR', '$': 'USD', '€': 'EUR', '£': 'GBP' };
  const trimmed = raw.trim();
  let currency = 'INR';
  for (const [sym, code] of Object.entries(map)) {
    if (trimmed.includes(sym)) { currency = code; break; }
  }
  const numeric = trimmed.replace(/[^\d.]/g, '');
  return numeric ? { value: numeric, currency } : null;
}

// ─── Strategy S1: CSS selector waterfall ──────────────────────────────────────

/**
 * Tries every selector in PRICE_SELECTORS.
 * Returns the first non-empty innerText, or null.
 *
 * Runs INSIDE the browser via page.evaluate() — keep it serialisable.
 */
async function strategyCSS(page, customSelector = null) {
  const selectors = customSelector
    ? [customSelector, ...PRICE_SELECTORS]
    : PRICE_SELECTORS;

  for (const sel of selectors) {
    try {
      // 2-second micro-wait per selector to handle late rendering
      await page.waitForSelector(sel, { timeout: 2_000 });
      const text = await page.$eval(sel, (el) => el.innerText.trim());
      if (text && INR_PATTERN.test(text)) {
        return { raw: text, strategy: `S1:css(${sel})` };
      }
    } catch { /* selector absent — try next */ }
  }
  return null;
}

// ─── Strategy S2: JSON-LD structured data ─────────────────────────────────────

/**
 * Flipkart injects schema.org/Product JSON-LD into <script> tags.
 * This is the MOST resilient strategy — class names rotate but schema rarely
 * changes because it powers Google Shopping and SEO.
 *
 * Parsed entirely inside page.evaluate() → no DOM selector needed.
 */
async function strategyJSONLD(page) {
  const raw = await page.evaluate(() => {
    const scripts = Array.from(
      document.querySelectorAll('script[type="application/ld+json"]')
    );
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        // Handle single object OR array
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          // schema.org/Product may nest offers
          const offers = item.offers ?? item['@graph']?.find(n => n['@type'] === 'Offer');
          if (offers) {
            const price = offers.price ?? offers.lowPrice;
            if (price) return String(price);
          }
          if (item['@type'] === 'Product') {
            const price = item.offers?.price ?? item.price;
            if (price) return String(price);
          }
        }
      } catch { /* malformed JSON-LD — skip */ }
    }
    return null;
  });

  return raw ? { raw: `₹${raw}`, strategy: 'S2:json-ld' } : null;
}

// ─── Strategy S3: Meta / OpenGraph tags ───────────────────────────────────────

/**
 * Checks <meta property="product:price:amount"> and
 * <meta name="twitter:data1"> etc. — lightweight and fast.
 */
async function strategyMeta(page) {
  const raw = await page.evaluate(() => {
    const candidates = [
      'meta[property="product:price:amount"]',
      'meta[property="og:price:amount"]',
      'meta[name="twitter:data1"]',
      'meta[itemprop="price"]',
    ];
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      const val = el?.getAttribute('content') ?? el?.getAttribute('value');
      if (val && /\d/.test(val)) return val;
    }
    return null;
  });

  return raw ? { raw: `₹${raw}`, strategy: 'S3:meta' } : null;
}

// ─── Strategy S4: Regex text scan ─────────────────────────────────────────────

/**
 * Walks ALL text nodes in the rendered document and returns the first string
 * that matches the INR currency pattern.
 * Slow but virtually immune to class-name obfuscation.
 *
 * Excludes <script>, <style>, and <noscript> nodes to avoid false positives.
 */
async function strategyTextScan(page) {
  const raw = await page.evaluate(() => {
    const INR = /₹\s?[\d,]+(?:\.\d{1,2})?/;
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const tag = node.parentElement?.tagName?.toUpperCase();
          if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(tag)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent.trim();
      const match = text.match(INR);
      if (match) return match[0];
    }
    return null;
  });

  return raw ? { raw, strategy: 'S4:text-scan' } : null;
}

// ─── Strategy S5: ARIA / data attributes ──────────────────────────────────────

/**
 * Some Flipkart components set aria-label="Price: ₹1,299" or
 * data-price="1299" for accessibility / analytics.
 * These attributes survive class-name rotations.
 */
async function strategyAriaData(page) {
  const raw = await page.evaluate(() => {
    // aria-label patterns
    const ariaEls = document.querySelectorAll('[aria-label*="₹"]');
    for (const el of ariaEls) {
      const m = el.getAttribute('aria-label').match(/₹\s?[\d,]+/);
      if (m) return m[0];
    }

    // data-price / data-selling-price
    const dataEls = document.querySelectorAll('[data-price],[data-selling-price],[data-sp]');
    for (const el of dataEls) {
      const val = el.dataset.price ?? el.dataset.sellingPrice ?? el.dataset.sp;
      if (val && /^\d+$/.test(val)) return `₹${val}`;
    }

    return null;
  });

  return raw ? { raw, strategy: 'S5:aria-data' } : null;
}

// ─── Multi-strategy orchestrator ──────────────────────────────────────────────

/**
 * Runs all five strategies in order, returns the first successful result.
 *
 * @param {import('puppeteer').Page} page
 * @param {object} [opts]
 * @param {string}   [opts.customSelector]  Extra selector to try first in S1.
 * @param {boolean}  [opts.verbose]         Log each strategy attempt.
 * @returns {Promise<{ raw: string, strategy: string, value: string, currency: string } | null>}
 */
async function extractPriceMultiStrategy(page, opts = {}) {
  const { customSelector = null, verbose = false } = opts;

  const strategies = [
    () => strategyCSS(page, customSelector),
    () => strategyJSONLD(page),
    () => strategyMeta(page),
    () => strategyTextScan(page),
    () => strategyAriaData(page),
  ];

  for (const strategy of strategies) {
    try {
      const result = await strategy();
      if (result) {
        const sanitized = sanitizePrice(result.raw);
        if (sanitized) {
          if (verbose) console.log(`  [extractor] ✓ ${result.strategy} → ${result.raw}`);
          return { ...result, ...sanitized };
        }
      }
    } catch (err) {
      if (verbose) console.warn(`  [extractor] strategy error: ${err.message}`);
    }
  }

  return null; // all strategies exhausted
}

// ─── Puppeteer waiting strategies ─────────────────────────────────────────────

/**
 * WAIT STRATEGY A — waitForSelector with generous timeout.
 * Best for pages that render the price synchronously after navigation.
 */
async function waitForPriceElementA(page, timeout = 15_000) {
  for (const sel of PRICE_SELECTORS.slice(0, 5)) { // only top-priority selectors
    try {
      await page.waitForSelector(sel, { timeout });
      return sel; // return the selector that appeared
    } catch { /* not this one */ }
  }
  return null;
}

/**
 * WAIT STRATEGY B — waitForFunction (polls JS expression).
 * Handles cases where the price is injected by a React/Vue re-render
 * AFTER DOMContentLoaded, so waitForSelector fires too early.
 *
 * Polls every 300 ms until a text node matching ₹ appears,
 * or until the timeout is reached.
 */
async function waitForPriceElementB(page, timeout = 15_000) {
  return page.waitForFunction(
    () => {
      const INR = /₹\s?[\d,]+/;
      return Array.from(document.querySelectorAll('div, span'))
        .some(el => INR.test(el.innerText ?? ''));
    },
    { polling: 300, timeout }
  );
}

/**
 * WAIT STRATEGY C — MutationObserver via page.exposeFunction.
 * Fires as soon as the price node is inserted into the DOM.
 * Most efficient for SPAs that hydrate asynchronously.
 *
 * Returns a Promise that resolves with the price text, or rejects on timeout.
 */
async function waitForPriceViaMutationObserver(page, timeout = 15_000) {
  // Expose a Node.js callback into the browser context
  await page.exposeFunction('__priceFound__', (text) => text);

  return Promise.race([
    page.evaluate(() => {
      return new Promise((resolve) => {
        const INR = /₹\s?[\d,]+/;

        // Check if already present before setting up observer
        const existing = Array.from(document.querySelectorAll('div, span'))
          .find(el => INR.test(el.innerText ?? ''));
        if (existing) { resolve(existing.innerText); return; }

        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
              const text = node.textContent ?? '';
              if (INR.test(text)) {
                observer.disconnect();
                resolve(text.match(INR)[0]);
                return;
              }
            }
          }
        });

        observer.observe(document.body, { childList: true, subtree: true });
      });
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('MutationObserver timed out')), timeout)
    ),
  ]);
}

// ─── Retry + backoff ──────────────────────────────────────────────────────────

/**
 * Wraps any async extraction call with exponential-backoff retry.
 *
 * @param {() => Promise<T>} fn         The extraction call to retry.
 * @param {object}           [opts]
 * @param {number}             [opts.retries=3]     Max attempts.
 * @param {number}             [opts.baseDelayMs=1500]
 * @param {number}             [opts.maxDelayMs=15000]
 * @param {(err, attempt) => void} [opts.onRetry]  Called before each retry.
 * @returns {Promise<T>}
 */
async function withRetryBackoff(fn, opts = {}) {
  const {
    retries = 3,
    baseDelayMs = 1_500,
    maxDelayMs = 15_000,
    onRetry = (err, attempt) =>
      console.warn(`  [retry] attempt ${attempt} failed: ${err.message}`),
  } = opts;

  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === retries) break;
      onRetry(err, attempt);
      // Exponential backoff with jitter: delay = min(base * 2^(n-1) + jitter, max)
      const jitter = Math.random() * 500;
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1) + jitter, maxDelayMs);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// ─── Error logger with page-state capture ─────────────────────────────────────

/**
 * Captures a full diagnostic snapshot when extraction fails.
 * Writes:
 *   debug/error_<timestamp>.json  — structured error log
 *   debug/screenshot_<timestamp>.png — visual of what Puppeteer saw
 *   debug/dom_<timestamp>.html    — full rendered HTML
 *
 * @param {import('puppeteer').Page} page
 * @param {object} context   Arbitrary fields merged into the log entry.
 */
async function captureErrorState(page, context = {}) {
  const ts = Date.now();
  const debugDir = path.join(process.cwd(), 'debug');
  fs.mkdirSync(debugDir, { recursive: true });

  const screenshotPath = path.join(debugDir, `screenshot_${ts}.png`);
  const htmlPath = path.join(debugDir, `dom_${ts}.html`);
  const logPath = path.join(debugDir, `error_${ts}.json`);

  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const html = await page.content();
    fs.writeFileSync(htmlPath, html, 'utf8');

    // Collect which selectors WERE found on the page (helps diagnose new class names)
    const foundSelectors = await page.evaluate((selectors) => {
      return selectors.filter((sel) => {
        try { return !!document.querySelector(sel); } catch { return false; }
      });
    }, PRICE_SELECTORS);

    // Grab window.__INITIAL_STATE__ / window.__redux_store__ if present (common in React SPAs)
    const storeData = await page.evaluate(() => {
      try {
        const s = window.__INITIAL_STATE__ ?? window.__redux_store__?.getState?.();
        return s ? JSON.stringify(s).slice(0, 2000) : null; // cap at 2 KB
      } catch { return null; }
    });

    const log = {
      timestamp: new Date(ts).toISOString(),
      url: page.url(),
      pageTitle: await page.title(),
      foundSelectors,   // selectors that existed but may not have had price text
      storeDataSnippet: storeData,
      screenshotPath,
      htmlPath,
      ...context,
    };

    fs.writeFileSync(logPath, JSON.stringify(log, null, 2), 'utf8');
    console.error(`  [error-capture] Snapshot written → ${debugDir}/`);
    return log;
  } catch (captureErr) {
    console.error(`  [error-capture] Capture itself failed: ${captureErr.message}`);
    return null;
  }
}

// ─── User-agent pool ──────────────────────────────────────────────────────────

const USER_AGENTS = [
  // Chrome on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  // Chrome on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  // Firefox on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  // Edge on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
  // Safari on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
];

/** Returns a random user-agent string from the pool. */
function randomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ─── Rate limiter ─────────────────────────────────────────────────────────────

/**
 * A simple token-bucket rate limiter.
 * Ensures at most `maxPerWindow` calls are made per `windowMs`.
 *
 * Usage:
 *   const limiter = createRateLimiter({ maxPerWindow: 10, windowMs: 60_000 });
 *   await limiter.wait();  // call before each request
 */
function createRateLimiter({ maxPerWindow = 10, windowMs = 60_000 } = {}) {
  const timestamps = [];

  return {
    async wait() {
      const now = Date.now();
      // Evict timestamps outside the rolling window
      while (timestamps.length && timestamps[0] < now - windowMs) {
        timestamps.shift();
      }
      if (timestamps.length >= maxPerWindow) {
        const oldest = timestamps[0];
        const waitFor = windowMs - (now - oldest) + 50; // +50 ms safety margin
        console.log(`  [rate-limit] ${timestamps.length}/${maxPerWindow} — waiting ${waitFor}ms`);
        await new Promise((r) => setTimeout(r, waitFor));
      }
      timestamps.push(Date.now());
    },
  };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  // Strategies
  extractPriceMultiStrategy,
  strategyCSS,
  strategyJSONLD,
  strategyMeta,
  strategyTextScan,
  strategyAriaData,
  // Waiting
  waitForPriceElementA,
  waitForPriceElementB,
  waitForPriceViaMutationObserver,
  // Utilities
  withRetryBackoff,
  captureErrorState,
  sanitizePrice,
  randomUserAgent,
  createRateLimiter,
  PRICE_SELECTORS,
};