/**
 * test.js — minimal test suite for flipkart-price-scraper
 *
 * Run with: npm test
 * No external test framework required — uses Node's built-in assert.
 */

'use strict';

const assert = require('assert');
const {
    sanitizePrice,
    buildSearchUrl,
} = require('./price-extractor');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✅  ${name}`);
        passed++;
    } catch (err) {
        console.error(`  ❌  ${name}`);
        console.error(`     ${err.message}`);
        failed++;
    }
}

console.log('\n── sanitizePrice ────────────────────────────────────');

test('parses standard INR price', () => {
    const r = sanitizePrice('₹1,299');
    assert.strictEqual(r.value, '1299');
    assert.strictEqual(r.currency, 'INR');
});

test('parses INR price with space after symbol', () => {
    const r = sanitizePrice('₹ 34,999');
    assert.strictEqual(r.value, '34999');
    assert.strictEqual(r.currency, 'INR');
});

test('parses USD price', () => {
    const r = sanitizePrice('$199.99');
    assert.strictEqual(r.value, '199.99');
    assert.strictEqual(r.currency, 'USD');
});

test('parses EUR price', () => {
    const r = sanitizePrice('€ 89');
    assert.strictEqual(r.value, '89');
    assert.strictEqual(r.currency, 'EUR');
});

test('returns null for empty string', () => {
    assert.strictEqual(sanitizePrice(''), null);
});

test('returns null for null input', () => {
    assert.strictEqual(sanitizePrice(null), null);
});

test('handles price without currency symbol', () => {
    const r = sanitizePrice('2500');
    assert.strictEqual(r.value, '2500');
    assert.strictEqual(r.currency, 'INR'); // default
});

console.log('\n── buildSearchUrl ───────────────────────────────────');

test('encodes a simple query', () => {
    const url = buildSearchUrl('boAt Airdopes 141');
    assert.ok(url.includes('flipkart.com/search?q='));
    assert.ok(url.includes('bo%C3%A2t') || url.includes('bo%C3%82t') || url.includes('boAt') || url.includes('bo%'));
    // Ensure special chars are encoded (space → %20 or +)
    assert.ok(!url.includes(' '));
});

test('encodes special characters', () => {
    const url = buildSearchUrl('iPhone 15 Pro & Max');
    assert.ok(!url.includes(' '));
    assert.ok(!url.includes('&') || url.includes('%26'));
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n── Results: ${passed} passed, ${failed} failed ─────────────────`);

if (failed > 0) {
    process.exit(1);
}