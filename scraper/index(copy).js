import puppeteer from 'puppeteer';
import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;

// Connect to your Supabase PostgreSQL database
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const trackingList = [
    // 📱 iPhone 15 Example (Flipkart is only in India)
    { name: "iPhone 15 (128GB, Black) - IN", country: "IN", currency: "INR", url: "https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4" },
    
    // 🎧 Apple AirPods Pro 2 (Global ASIN Test)
    // AirPods use the EXACT SAME ASIN (B0BDHWDR12) globally and are rarely region-blocked.
    // This makes them perfect for testing your international scraper without getting 404 errors!
    { 
      name: "Samsung galaxy s25 ultra - IN", 
      country: "IN", 
      currency: "INR", 
      url: "https://www.amazon.in/Samsung-Smartphone-Silverblue-Snapdragon-ProVisual/dp/B0DSKNKCYX/" 
    },
    { 
      name: "Samsung galaxy s25 ultra- US", 
      country: "US", 
      currency: "USD", 
      url: "https://www.amazon.com/Samsung-Smartphone-Unlocked-Processor-Manufacturer/dp/B0DP3GQ4QY" 
    },
    { 
      name: "Samsung galaxy s25 ultra - UK", 
      country: "UK", 
      currency: "GBP", 
      url: "https://www.amazon.co.uk/Samsung-Privacy-Snapdragon-Extended-Warranty/dp/B0G53WJPY7/" 
    }
];

async function runScraper() {
  console.log("🚀 Starting Master Scraper Engine (Smart Adapters)...");
  await client.connect();

  const browser = await puppeteer.launch({ 
    headless: true,
    args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled'
    ]
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  for (const product of trackingList) {
      console.log(`\n🕵️ Checking: ${product.name} in ${product.country}`);
      
      try {
          // --- GEOLOCATION SPOOFING ---
          let locale = 'en-US';
          if (product.country === 'IN') locale = 'en-IN';
          if (product.country === 'UK') locale = 'en-GB';
          if (product.country === 'AE') locale = 'en-AE';

          await page.setExtraHTTPHeaders({
              'Accept-Language': `${locale},en;q=0.9`
          });

          await page.goto(product.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
          let finalPrice = null;

          // ==========================================
          // 🛒 AMAZON ADAPTER
          // ==========================================
          if (product.url.includes('amazon')) {
              console.log("   ↳ Detected Amazon: Deploying UI Selector Strategy...");
              
              const pageText = await page.evaluate(() => document.body.innerText);
              if (pageText.includes("Type the characters you see in this image")) {
                  throw new Error("Amazon blocked the bot with a CAPTCHA.");
              }
              if (pageText.includes("Sorry! We couldn't find that page") || pageText.includes("Dogs of Amazon")) {
                  throw new Error("Invalid URL/ASIN for this country (404 Page). Did you use a regional link?");
              }

              const priceSelectors = [
                  '.a-price-whole',
                  '.a-color-price',
                  '#priceblock_ourprice',
                  '.a-price .a-offscreen'
              ];

              for (const selector of priceSelectors) {
                  try {
                      await page.waitForSelector(selector, { timeout: 5000 });
                      const rawPrice = await page.$eval(selector, el => el.innerText || el.textContent);
                      
                      if (rawPrice && /[0-9]/.test(rawPrice)) {
                          finalPrice = parseFloat(rawPrice.replace(/[^0-9.]/g, ""));
                          console.log(`   ↳ Found price using selector: ${selector}`);
                          break; 
                      }
                  } catch (e) {}
              }
          } 
          // ==========================================
          // 🛍️ FLIPKART ADAPTER
          // ==========================================
          else if (product.url.includes('flipkart')) {
              console.log("   ↳ Detected Flipkart: Deploying JSON-LD SEO Strategy...");
              
              const productData = await page.evaluate(() => {
                  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
                  for (let script of scripts) {
                      try {
                          const data = JSON.parse(script.innerText);
                          let item = Array.isArray(data) ? data.find(d => d['@type'] === 'Product') : data;
                          if (item && item['@type'] === 'Product') return item;
                      } catch (e) {} 
                  }
                  return null;
              });

              if (!productData) throw new Error("No SEO JSON-LD found on Flipkart page.");

              let offers = productData.offers || (Array.isArray(productData) ? productData[0].offers : null);
              if (offers) {
                  if (Array.isArray(offers) && offers.length > 0) finalPrice = offers[0].price;
                  else if (offers.price) finalPrice = offers.price;
              }
          } 
          else {
              throw new Error("No adapter built for this website domain.");
          }

          if (!finalPrice) throw new Error("Could not extract a valid price.");
          console.log(`✅ Success! Price extracted: ${product.currency} ${finalPrice}`);

      } catch (error) {
          console.error(`❌ Failed to check ${product.name}: ${error.message}`);
          const safeName = product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          await page.screenshot({ path: `error-${safeName}.png` });
      }
  }

  await browser.close();
  await client.end();
  console.log("\n🏁 All products checked. Scraper shutting down.");
}

runScraper();