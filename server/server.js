const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: './.env' });
const OpenAI = require('openai');
const axios = require('axios');
const cheerio = require('cheerio');

console.log("API KEY LOADED:", process.env.OPENAI_API_KEY ? "YES (hidden)" : "NO");

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

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

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
