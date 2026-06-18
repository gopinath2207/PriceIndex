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
    { name: "iPhone 15 (128GB, Black)", url: "https://www.flipkart.com/samsung-galaxy-a17-5g-black-128-gb/p/itm9b0b7e6d52859?pid=MOBHGVECKP8QYMCD&marketplace=FLIPKART&lid=LSTMOBHGVECKP8QYMCDLXBLWL&pageUID=1781766082657", currency: "INR" },
    { name: "Galaxy S24 (Base Model)", url: "https://www.amazon.in/Samsung-Smartphone-Silverblue-Snapdragon-ProVisual/dp/B0DSBTKP5Q", currency: "INR" }
];

async function runScraper() {
  console.log("🚀 Starting Master Scraper Engine (Smart Adapters)...");
  await client.connect();

  const browser = await puppeteer.launch({ 
    headless: true,
    args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled' // Helps bypass Amazon's bot detection
    ]
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 }); // Full desktop view
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // Loop through every product
  for (const product of trackingList) {
      console.log(`\n🕵️ Checking: ${product.name}`);
      
      try {
          await page.goto(product.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
          let finalPrice = null;

          // ==========================================
          // 🛒 AMAZON ADAPTER (UI Selector Strategy)
          // ==========================================
          if (product.url.includes('amazon')) {
              console.log("   ↳ Detected Amazon: Deploying UI Selector Strategy...");
              const priceSelector = '.a-price-whole';
              
              await page.waitForSelector(priceSelector, { timeout: 15000 });
              const rawPrice = await page.$eval(priceSelector, el => el.innerText);
              
              finalPrice = parseFloat(rawPrice.replace(/[^0-9]/g, ""));
          } 
          
          // ==========================================
          // 🛍️ FLIPKART ADAPTER (JSON-LD SEO Strategy)
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
          
          // ==========================================
          // ⚠️ UNKNOWN RETAILER FALLBACK
          // ==========================================
          else {
              throw new Error("No adapter built for this website domain.");
          }

          // Validation & Logging
          if (!finalPrice) throw new Error("Could not extract a valid price.");

          console.log(`✅ Success! Price extracted: ${product.currency} ${finalPrice}`);

          // Example Database Insert (Uncomment when your database tables are ready)
          /*
          const query = `
              INSERT INTO prices (product_name, local_price, last_checked) 
              VALUES ($1, $2, NOW())
          `;
          await client.query(query, [product.name, finalPrice]);
          */
          console.log(`💾 Prepared to save ${product.name} price to database.`);

      } catch (error) {
          console.error(`❌ Failed to check ${product.name}: ${error.message}`);
          // Save a screenshot using the product name so you can debug specific failures
          const safeName = product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          await page.screenshot({ path: `error-${safeName}.png` });
      }
  }

  await browser.close();
  await client.end();
  console.log("\n🏁 All products checked. Scraper shutting down.");
}

runScraper();