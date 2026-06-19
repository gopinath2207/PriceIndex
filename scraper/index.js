// import puppeteer from 'puppeteer-extra';
// import StealthPlugin from 'puppeteer-extra-plugin-stealth';
// import pg from 'pg';
// import 'dotenv/config';

// // 1. Activate the Stealth Plugin to bypass Amazon Bot Detection
// puppeteer.use(StealthPlugin());

// const { Client } = pg;

// // Connect to your Supabase PostgreSQL database
// const client = new Client({
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false }
// });

// const trackingList = [
//     { name: "iPhone 15 (128GB, Black) - IN", country: "IN", currency: "INR", url: "https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4" },
    
//     // Samsung Galaxy Smartphone Links
//     { 
//       name: "Samsung Galaxy - IN", 
//       country: "IN", 
//       currency: "INR", 
//       url: "https://www.amazon.in/Samsung-Smartphone-Whitesilver-Snapdragon-ProVisual/dp/B0DSKL9MQ8/" 
//     },
//     { 
//       name: "Samsung Galaxy - US", 
//       country: "US", 
//       currency: "USD", 
//       url: "https://www.amazon.com/Samsung-Unlocked-Smartphone-Charging-Warranty/dp/B0G4SW3XXP/" 
//     },
//     { 
//       name: "Samsung Galaxy - UK", 
//       country: "UK", 
//       currency: "GBP", 
//       url: "https://www.amazon.co.uk/Samsung-Privacy-Snapdragon-Extended-Warranty/dp/B0G53Y45YN/" 
//     }
// ];

// async function runScraper() {
//   console.log("🚀 Starting Master Scraper Engine (Stealth Mode Activated)...");
//   await client.connect();

//   // Launch Invisible Google Chrome (Now powered by Stealth Plugin)
//   const browser = await puppeteer.launch({ 
//     headless: true, // You can temporarily set this to false to watch the bot work!
//     args: [
//         '--no-sandbox', 
//         '--disable-setuid-sandbox',
//         '--window-size=1920,1080'
//     ]
//   });
  
//   const page = await browser.newPage();
//   await page.setViewport({ width: 1920, height: 1080 });
  
//   // Set a very standard Windows Chrome User Agent
//   await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

//   for (const product of trackingList) {
//       console.log(`\n🕵️ Checking: ${product.name} in ${product.country}`);
      
//       try {
//           // --- GEOLOCATION SPOOFING ---
//           let locale = 'en-US';
//           if (product.country === 'IN') locale = 'en-IN';
//           if (product.country === 'UK') locale = 'en-GB';
//           if (product.country === 'AE') locale = 'en-AE';

//           await page.setExtraHTTPHeaders({
//               'Accept-Language': `${locale},en;q=0.9`
//           });

//           // Wait a random amount of time between 1 and 3 seconds to act more "human" between requests
//           await new Promise(r => setTimeout(r, Math.random() * 2000 + 1000));

//           await page.goto(product.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
//           let finalPrice = null;

//           // ==========================================
//           // 🛒 AMAZON ADAPTER
//           // ==========================================
//           if (product.url.includes('amazon')) {
//               console.log("   ↳ Detected Amazon: Deploying UI Selector Strategy...");
              
//               const pageText = await page.evaluate(() => document.body.innerText);
//               if (pageText.includes("Type the characters you see in this image")) {
//                   throw new Error("Amazon blocked the bot with a CAPTCHA. (Stealth may need updating)");
//               }
//               if (pageText.includes("Sorry! We couldn't find that page") || pageText.includes("Dogs of Amazon")) {
//                   throw new Error("Invalid URL/ASIN for this country (404 Page).");
//               }

//               const priceSelectors = [
//                   '.a-price-whole',
//                   '.a-color-price',
//                   '#priceblock_ourprice',
//                   'span.a-price span.a-offscreen' // Added fallback for hidden prices
//               ];

//               for (const selector of priceSelectors) {
//                   try {
//                       await page.waitForSelector(selector, { timeout: 8000 });
//                       const rawPrice = await page.$eval(selector, el => el.innerText || el.textContent);
                      
//                       if (rawPrice && /[0-9]/.test(rawPrice)) {
//                           finalPrice = parseFloat(rawPrice.replace(/[^0-9.]/g, ""));
//                           console.log(`   ↳ Found price using selector: ${selector}`);
//                           break; 
//                       }
//                   } catch (e) {}
//               }
//           } 
//           // ==========================================
//           // 🛍️ FLIPKART ADAPTER
//           // ==========================================
//           else if (product.url.includes('flipkart')) {
//               console.log("   ↳ Detected Flipkart: Deploying JSON-LD SEO Strategy...");
              
//               const productData = await page.evaluate(() => {
//                   const scripts = document.querySelectorAll('script[type="application/ld+json"]');
//                   for (let script of scripts) {
//                       try {
//                           const data = JSON.parse(script.innerText);
//                           let item = Array.isArray(data) ? data.find(d => d['@type'] === 'Product') : data;
//                           if (item && item['@type'] === 'Product') return item;
//                       } catch (e) {} 
//                   }
//                   return null;
//               });

//               if (!productData) throw new Error("No SEO JSON-LD found on Flipkart page.");

//               let offers = productData.offers || (Array.isArray(productData) ? productData[0].offers : null);
//               if (offers) {
//                   if (Array.isArray(offers) && offers.length > 0) finalPrice = offers[0].price;
//                   else if (offers.price) finalPrice = offers.price;
//               }
//           } 
//           else {
//               throw new Error("No adapter built for this website domain.");
//           }

//           if (!finalPrice) throw new Error("Could not extract a valid price.");
//           console.log(`✅ Success! Price extracted: ${product.currency} ${finalPrice}`);

//       } catch (error) {
//           console.error(`❌ Failed to check ${product.name}: ${error.message}`);
//           const safeName = product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
//           await page.screenshot({ path: `error-${safeName}.png` });
//       }
//   }

//   await browser.close();
//   await client.end();
//   console.log("\n🏁 All products checked. Scraper shutting down.");
// }

// runScraper();


import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import pg from 'pg';
import 'dotenv/config';

// 1. Activate the Stealth Plugin to bypass Amazon Bot Detection
puppeteer.use(StealthPlugin());

const { Client } = pg;

// Connect to your Supabase PostgreSQL database
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const trackingList = [
    { name: "iPhone 15 (128GB, Black) - IN", country: "IN", currency: "INR", url: "https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4" },
    
    // Samsung Galaxy Smartphone Links
    { 
      name: "Samsung Galaxy - IN", 
      country: "IN", 
      currency: "INR", 
      url: "https://www.amazon.in/Samsung-Smartphone-Whitesilver-Snapdragon-ProVisual/dp/B0DSKL9MQ8/" 
    },
    { 
      name: "Samsung Galaxy - US", 
      country: "US", 
      currency: "USD", 
      url: "https://www.amazon.com/SAMSUNG-Smartphone-Unlocked-Android-Titanium/dp/B0CMZCQ142/" 
    },
    { 
      name: "Samsung Galaxy - UK", 
      country: "UK", 
      currency: "GBP", 
      url: "https://www.amazon.co.uk/Samsung-Smartphone-Titanium-Version-Extended/dp/B0CQMJB964/" 
    }
];

async function runScraper() {
  console.log("🚀 Starting Master Scraper Engine (Stealth Mode Activated)...");
  await client.connect();

  // Launch Invisible Google Chrome (Now powered by Stealth Plugin)
  const browser = await puppeteer.launch({ 
    headless: true, // You can temporarily set this to false to watch the bot work!
    args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--window-size=1920,1080'
    ]
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Set a very standard Windows Chrome User Agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

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

          // Wait a random amount of time between 1 and 3 seconds to act more "human" between requests
          await new Promise(r => setTimeout(r, Math.random() * 2000 + 1000));

          await page.goto(product.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
          let finalPrice = null;

          // ==========================================
          // 🛒 AMAZON ADAPTER
          // ==========================================
          if (product.url.includes('amazon')) {
              console.log("   ↳ Detected Amazon: Deploying UI Selector Strategy...");
              
              const pageText = await page.evaluate(() => document.body.innerText);
              if (pageText.includes("Type the characters you see in this image")) {
                  throw new Error("Amazon blocked the bot with a CAPTCHA. (Stealth may need updating)");
              }
              if (pageText.includes("Sorry! We couldn't find that page") || pageText.includes("Dogs of Amazon")) {
                  throw new Error("Invalid URL/ASIN for this country (404 Page).");
              }

              // FIX: We moved the 'a-offscreen' class to the very top! 
              // This contains the clean, screen-reader text (e.g., "$1,137.11") 
              // so the decimal point isn't lost when we convert it to a number.
              const priceSelectors = [
                  'span.a-price span.a-offscreen', 
                  '.a-price-whole',
                  '.a-color-price',
                  '#priceblock_ourprice'
              ];

              for (const selector of priceSelectors) {
                  try {
                      await page.waitForSelector(selector, { timeout: 8000 });
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