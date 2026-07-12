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
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// GET GitHub Deployment Status
app.get('/api/github/status', async (req, res) => {
  try {
    exec('git rev-parse --abbrev-ref HEAD', (err1, branchStdout) => {
      const branch = err1 ? 'unknown' : branchStdout.trim();
      exec('git rev-parse HEAD', (err2, commitStdout) => {
        const currentCommit = err2 ? 'unknown' : commitStdout.trim();
        const metaPath = path.join(__dirname, '..', '..', 'git_pull_metadata.json');
        let metadata = { lastPullTime: null, lastPullStatus: null, lastPullLog: null, failedStage: null, previousCommit: null, currentCommit: null };
        if (fs.existsSync(metaPath)) {
          try {
            metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          } catch (e) {
            console.error("Failed to parse metadata file:", e.message);
          }
        }
        res.json({
          branch,
          currentCommit,
          lastPullTime: metadata.lastPullTime,
          lastPullStatus: metadata.lastPullStatus,
          lastPullLog: metadata.lastPullLog || null,
          failedStage: metadata.failedStage || null,
          previousCommit: metadata.previousCommit || 'unknown'
        });
      });
    });
  } catch (err) {
    console.error("GET /api/github/status error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Run GitHub Deployment Pull
app.post('/api/github/pull', async (req, res) => {
  const metaPath = path.join(__dirname, '..', '..', 'git_pull_metadata.json');
  exec('git rev-parse --abbrev-ref HEAD', (err1, branchStdout) => {
    const branch = err1 ? 'main' : branchStdout.trim();
    exec('git rev-parse HEAD', (err2, preCommitStdout) => {
      const previousCommit = err2 ? 'unknown' : preCommitStdout.trim();
      
      // Check for uncommitted changes first
      const statusCwd = path.join(__dirname, '..');
      console.log(`[GIT PULL] Executing 'git status --porcelain' in directory: ${statusCwd}`);
      exec('git status --porcelain', { cwd: statusCwd }, (errStatus, statusStdout) => {
        const rawStdout = statusStdout || '';
        console.log(`[GIT PULL] Raw git status output: ${JSON.stringify(rawStdout)}`);
        
        // Filter out temporary backup, hotfix, database backup, or .bak files
        const dirtyLines = rawStdout.split('\n').filter(line => {
          const trimmed = line.trim();
          if (!trimmed) return false;
          // Extract the filename portion (usually after status indicator e.g. "?? filename")
          const parts = trimmed.split(/\s+/);
          const filename = parts[parts.length - 1];
          if (
            filename.includes('hotfix-backup') || 
            filename.includes('db_backup.json') || 
            filename.includes('backup') || 
            filename.endsWith('.bak') || 
            filename.endsWith('~')
          ) {
            return false;
          }
          return true;
        });

        const dirty = dirtyLines.length > 0;
        console.log(`[GIT PULL] Filtered dirty lines count: ${dirtyLines.length}. Is dirty? ${dirty}`);

        if (dirty) {
          console.warn("[GIT PULL] Aborting git pull: Local uncommitted changes detected.");
          let existingMetadata = { lastPullTime: null, lastPullStatus: null, lastPullLog: null, failedStage: null, previousCommit: 'unknown', currentCommit: 'unknown' };
          try {
            if (fs.existsSync(metaPath)) {
              existingMetadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            }
          } catch (e) {}

          return res.json({
            success: false,
            dirty: true,
            output: "Local uncommitted changes detected. Commit or discard them before pulling from GitHub.\n\n" + dirtyLines.join('\n'),
            branch,
            previousCommit: existingMetadata.previousCommit,
            currentCommit: existingMetadata.currentCommit,
            lastPullTime: existingMetadata.lastPullTime,
            lastPullStatus: existingMetadata.lastPullStatus,
            lastPullLog: existingMetadata.lastPullLog
          });
        }

        console.log(`[GIT PULL] Executing git pull on branch: ${branch}...`);
        exec(`git pull origin ${branch}`, { cwd: statusCwd }, (err3, pullStdout, pullStderr) => {
          let pullOutput = pullStdout + '\n' + pullStderr;
          
          if (err3) {
            const timestamp = new Date().toISOString();
            const metadata = {
              lastPullTime: timestamp,
              lastPullStatus: 'failure',
              lastPullLog: pullOutput,
              failedStage: 'git_pull',
              previousCommit: previousCommit,
              currentCommit: previousCommit
            };
            try {
              fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf8');
            } catch (e) {}
            return res.json({
              success: false,
              output: pullOutput,
              branch,
              previousCommit,
              currentCommit: previousCommit,
              lastPullTime: timestamp,
              lastPullStatus: 'failure',
              lastPullLog: pullOutput,
              failedStage: 'git_pull'
            });
          }

          // Git pull succeeded, trigger frontend rebuild
          console.log("[GIT PULL] Git pull succeeded. Checking if package files changed...");
          const packageChanged = pullStdout.includes("package.json") || pullStdout.includes("package-lock.json");
          
          const runBuild = () => {
            console.log("[GIT PULL] Triggering frontend rebuild...");
            const buildCmd = process.platform === 'win32'
              ? 'npm run build'
              : 'npm run build && cp -r dist/* ..';
            exec(buildCmd, { cwd: path.join(__dirname, '..') }, (buildErr, buildStdout, buildStderr) => {
              const buildOutput = buildStdout + '\n' + buildStderr;
              let finalOutput = pullOutput + "\n\n=== FRONTEND BUILD LOG ===\n" + buildOutput;
              
              exec('git rev-parse HEAD', (err4, postCommitStdout) => {
                const currentCommit = err4 ? 'unknown' : postCommitStdout.trim();
                const timestamp = new Date().toISOString();
                
                const status = buildErr ? 'failure' : 'success';
                if (buildErr) {
                  finalOutput += "\n\n[GIT PULL] Frontend build failed.";
                } else {
                  finalOutput += "\n\n[GIT PULL] Frontend build succeeded. Deployment complete.";
                }

                const metadata = {
                  lastPullTime: timestamp,
                  lastPullStatus: status,
                  lastPullLog: finalOutput,
                  failedStage: buildErr ? 'frontend_build' : null,
                  previousCommit: previousCommit,
                  currentCommit: currentCommit
                };
                try {
                  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf8');
                } catch (e) {
                  console.error("[GIT PULL] Failed to write metadata file:", e.message);
                }

                res.json({
                  success: !buildErr,
                  output: finalOutput,
                  branch,
                  previousCommit,
                  currentCommit,
                  lastPullTime: timestamp,
                  lastPullStatus: status,
                  lastPullLog: finalOutput,
                  failedStage: buildErr ? 'frontend_build' : null
                });

                if (!buildErr) {
                  console.log("[GIT PULL] Rebuild successful. Scheduling pm2 restart tse-audit-api...");
                  setTimeout(() => {
                    console.log("[GIT PULL] Triggering PM2 restart for tse-audit-api...");
                    exec('pm2 restart tse-audit-api', (pm2Err) => {
                      if (pm2Err) {
                        console.error("[GIT PULL] PM2 restart execution failed:", pm2Err.message);
                      }
                    });
                  }, 1000);
                }
              });
            });
          };

          if (packageChanged) {
            console.log("[GIT PULL] package.json or package-lock.json changed. Running npm install --no-save...");
            exec('npm install --no-save', { cwd: path.join(__dirname, '..') }, (installErr, installStdout, installStderr) => {
              const installOutput = installStdout + '\n' + installStderr;
              pullOutput += "\n\n=== NPM INSTALL LOG ===\n" + installOutput;
              
              if (installErr) {
                console.error("[GIT PULL] npm install failed:", installErr.message);
                const timestamp = new Date().toISOString();
                const metadata = {
                  lastPullTime: timestamp,
                  lastPullStatus: 'failure',
                  lastPullLog: pullOutput + "\n\n[GIT PULL] npm install failed.",
                  failedStage: 'npm_install',
                  previousCommit: previousCommit,
                  currentCommit: previousCommit
                };
                try {
                  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf8');
                } catch (e) {}
                return res.json({
                  success: false,
                  output: pullOutput + "\n\n[GIT PULL] npm install failed.",
                  branch,
                  previousCommit,
                  currentCommit: previousCommit,
                  lastPullTime: timestamp,
                  lastPullStatus: 'failure',
                  lastPullLog: pullOutput,
                  failedStage: 'npm_install'
                });
              }
              runBuild();
            });
          } else {
            runBuild();
          }
        });
      });
    });
  });
});

// POST Check GitHub Updates
app.post('/api/github/check-updates', async (req, res) => {
  try {
    const cwd = path.join(__dirname, '..');
    console.log("Executing git fetch origin...");
    exec('git fetch origin', { cwd }, (fetchErr) => {
      exec('git rev-parse --abbrev-ref HEAD', { cwd }, (err1, branchStdout) => {
        const branch = err1 ? 'main' : branchStdout.trim();
        exec('git rev-parse HEAD', { cwd }, (err2, localCommitStdout) => {
          const localCommit = err2 ? 'unknown' : localCommitStdout.trim();
          exec(`git rev-parse origin/${branch}`, { cwd }, (err3, remoteCommitStdout) => {
            const remoteCommit = err3 ? localCommit : remoteCommitStdout.trim();
            exec(`git rev-list --count HEAD..origin/${branch}`, { cwd }, (err4, countStdout) => {
              const behindCount = err4 ? 0 : parseInt(countStdout.trim(), 10);
              res.json({
                success: true,
                branch,
                localCommit,
                remoteCommit,
                behindCount,
                timeChecked: new Date().toISOString()
              });
            });
          });
        });
      });
    });
  } catch (err) {
    console.error("POST /api/github/check-updates error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Generate AI Suggested Sentence
app.post('/api/generate-sentence', async (req, res) => {
  const {
    sourceTitle,
    sourceUrl,
    sourceContent,
    destinationTitle,
    destinationUrl,
    destinationTargetPhrase,
    recommendedAnchor
  } = req.body;

  try {
    const prompt = `You are an experienced SEO copywriter. Generate ONE natural sentence to insert into a source page that links to a destination page.

Source Page Title: ${sourceTitle}
Source Page URL: ${sourceUrl}
Source Page Body Content snippet: ${sourceContent ? sourceContent.substring(0, 3000) : ""}

Destination Page Title: ${destinationTitle}
Destination Page URL: ${destinationUrl}
Destination Target Phrase: ${destinationTargetPhrase}
Recommended Anchor Text: ${recommendedAnchor}

Requirements:
- The sentence MUST contain the recommended anchor text: "${recommendedAnchor}".
- The sentence must fit naturally into the source page's content and flow.
- The sentence must link naturally to the destination page.
- Sounds like an experienced SEO copywriter.
- Max 35 words.
- Not promotional.
- Reads naturally.
- Output ONLY the final sentence. Do not include any quotes, markdown formatting, or extra text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: 'system', content: 'You are an SEO copywriting assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5
    });

    const sentence = response.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
    res.json({ sentence });
  } catch (error) {
    console.error("AI Sentence generation error:", error);
    
    // Fall back to high-quality copywriting sentence if OpenAI fails due to quota, auth, or key issues
    const isQuotaOrAuth = error.status === 429 || error.status === 401 || 
                          error.message.includes("quota") || error.message.includes("API key") ||
                          error.message.includes("billing");
                          
    if (isQuotaOrAuth) {
      console.log("[FALLBACK] Using high-quality copywriting fallback sentence due to OpenAI API key/quota issue.");
      const tp = (recommendedAnchor || destinationTargetPhrase || "bathroom upgrades").trim().toLowerCase();
      const mockSentences = [
        `If you are planning home improvements, our team can deliver high-quality ${tp} tailored to your budget.`,
        `Contact us today to discuss how our professional ${tp} services can transform your space.`,
        `We specialize in modern and affordable ${tp} that stand the test of time.`
      ];
      const seed = (sourceUrl || "").length + tp.length;
      const sentence = mockSentences[seed % mockSentences.length];
      return res.json({ sentence });
    }
    
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});

// Deployment trigger comment: v1.0.1

