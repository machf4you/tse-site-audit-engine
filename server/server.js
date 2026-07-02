const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: './.env' });
const OpenAI = require('openai');
const axios = require('axios');
const cheerio = require('cheerio');
const {
  initDb,
  getSites,
  saveSite,
  saveAllSites,
  getPagesData,
  savePageConfig,
  saveAllPagesForSite,
  getArchitectureNotes,
  saveArchitectureNotes
} = require('./db');

// Initialize database connection and tables
initDb().then(() => {
  console.log("Database initialization routine completed.");
}).catch(err => {
  console.error("Database initialization failed:", err.message);
});

console.log("API KEY LOADED:", process.env.OPENAI_API_KEY ? "YES (hidden)" : "NO");

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function scrapeWebsite(url) {
  try {
    let targetUrl = url;
    if (!targetUrl.startsWith('http')) {
      targetUrl = 'https://' + targetUrl;
    }
    const { data } = await axios.get(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    $('script, style, noscript, iframe, img, svg, nav, menu, header, footer').remove();
    
    const title = $('title').text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    
    const h1s = [];
    $('h1').each((i, el) => h1s.push($(el).text().trim()));
    
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 800);
    const httpsStatus = targetUrl.startsWith('https') ? 'Valid' : 'Invalid';
    const h1Count = h1s.length;
    
    return `WEBSITE CONTENT:\n* Title: ${title || 'not found'}\n* Meta: ${metaDesc || 'not found'}\n* H1: ${h1s.length > 0 ? h1s.join(' | ') : 'not found'}\n* H1 Count: ${h1Count}\n* HTTPS: ${httpsStatus}\n* Text: ${bodyText}`;
  } catch (err) {
    console.error(`Failed to scrape ${url}:`, err.message);
    const httpsStatus = err.message.includes('certificate') || err.message.includes('SSL') ? 'Invalid (SSL Error)' : 'Unknown';
    return `[Failed to scrape website: ${err.message}. HTTPS: ${httpsStatus}]`;
  }
}

app.post('/api/audit', async (req, res) => {
  console.log('Incoming request body:', req.body);

  if (!req.body.messages && req.body.systemInstruction && req.body.userPrompt) {
    req.body.messages = [
      { role: 'system', content: req.body.systemInstruction },
      { role: 'user', content: req.body.userPrompt }
    ];
  }

  if (req.body.scrapeUrl) {
    console.log(`Scraping URL: ${req.body.scrapeUrl}`);
    const scrapedData = await scrapeWebsite(req.body.scrapeUrl);
    
    const userMessageIndex = req.body.messages.findIndex(m => m.role === 'user');
    if (userMessageIndex !== -1) {
      req.body.messages[userMessageIndex].content += `\n\n${scrapedData}`;
    }
  }

  console.log('Prompt being sent:', req.body.messages);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: req.body.messages,
      temperature: 0.4
    });

    const signature = "\n\n— Mac\nThe Search Equation\nthesearchequation.com";
    const finalAudit = response.choices[0].message.content.trim() + signature;

    res.json({
      result: finalAudit
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
});

// GET Connected Websites
app.get('/api/sites', async (req, res) => {
  console.log('GET /api/sites requested');
  try {
    const sites = await getSites();
    res.json(sites);
  } catch (err) {
    console.error('GET /api/sites error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Save Connected Websites
app.post('/api/sites', async (req, res) => {
  console.log('POST /api/sites called with sites count:', req.body.sites ? req.body.sites.length : (Array.isArray(req.body) ? req.body.length : 'unknown'));
  try {
    const body = req.body;
    if (Array.isArray(body)) {
      await saveAllSites(body);
    } else if (body.sites && Array.isArray(body.sites)) {
      await saveAllSites(body.sites);
    } else if (body.site) {
      await saveSite(body.site);
    } else {
      await saveSite(body);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/sites error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET Page Configurations
app.get('/api/pages-data', async (req, res) => {
  console.log('GET /api/pages-data requested');
  try {
    const pagesData = await getPagesData();
    res.json(pagesData);
  } catch (err) {
    console.error('GET /api/pages-data error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Save Page Configurations
app.post('/api/pages-data/save', async (req, res) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  console.log(`[${timestamp}] ${method} /api/pages-data/save received`);
  try {
    const { siteId, page, pages } = req.body;
    let siteIdLogged = siteId || 'N/A (Bulk)';
    let pagesCount = 0;
    let executed = true;

    if (siteId) {
      if (pages && Array.isArray(pages)) {
        pagesCount = pages.length;
        console.log(`[${timestamp}] Executing saveAllPagesForSite for Site ID: ${siteId}, Pages: ${pagesCount}`);
        await saveAllPagesForSite(siteId, pages);
      } else if (page) {
        pagesCount = 1;
        console.log(`[${timestamp}] Executing savePageConfig for Site ID: ${siteId}, Page URL: ${page.pageUrl}`);
        await savePageConfig(siteId, page);
      } else {
        executed = false;
        console.log(`[${timestamp}] Save skipped: Missing page or pages data`);
        return res.status(400).json({ error: "Missing page or pages data" });
      }
    } else {
      const pagesData = req.body.pagesData || req.body;
      const siteIds = Object.keys(pagesData);
      siteIdLogged = siteIds.join(', ');
      for (const sId of siteIds) {
        const sPages = pagesData[sId];
        if (Array.isArray(sPages)) {
          pagesCount += sPages.length;
          console.log(`[${timestamp}] Executing saveAllPagesForSite for Site ID: ${sId}, Pages: ${sPages.length}`);
          await saveAllPagesForSite(sId, sPages);
        }
      }
    }
    console.log(`[${timestamp}] Request completed: Method=${method}, Sites=${siteIdLogged}, Total Pages=${pagesCount}, Executed=${executed}`);
    res.json({ success: true });
  } catch (err) {
    console.error(`[${timestamp}] POST /api/pages-data/save error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET Architecture Notes
app.get('/api/architecture-notes', async (req, res) => {
  try {
    const content = await getArchitectureNotes();
    res.json({ content });
  } catch (err) {
    console.error("GET /api/architecture-notes error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Save Architecture Notes
app.post('/api/architecture-notes', async (req, res) => {
  try {
    const { content } = req.body;
    await saveArchitectureNotes(content);
    res.json({ success: true });
  } catch (err) {
    console.error("POST /api/architecture-notes error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
