const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let pool = null;
let useDb = false;

// Path for fallback file persistence
const fallbackFilePath = path.join(__dirname, 'db_backup.json');

// Read exporter-data.json
const exporterDataPath = path.join(__dirname, '../src/exporter-data.json');
let exporterData = {};
try {
  exporterData = JSON.parse(fs.readFileSync(exporterDataPath, 'utf8'));
} catch (err) {
  console.error("Failed to load exporter-data.json:", err.message);
}

// Helper to load fallback JSON data
function loadFallback() {
  if (fs.existsSync(fallbackFilePath)) {
    try {
      return JSON.parse(fs.readFileSync(fallbackFilePath, 'utf8'));
    } catch (err) {
      console.error("Error reading fallback JSON file:", err.message);
    }
  }
  
  // Default seed fallback structure
  const buPages = (exporterData["bathroom-upgrades"]?.pages || []).map(p => {
    // Default target phrases
    if (p.pageUrl === "/") {
      return { ...p, targetPhrase: "bathroom upgrades", status: "Configured" };
    } else if (p.pageUrl === "/bathroom-renovations/") {
      return { ...p, targetPhrase: "bathroom renovations", status: "Configured" };
    } else if (p.pageUrl === "/bathroom-installation/") {
      return { ...p, targetPhrase: "bathroom installation", status: "Configured" };
    }
    return p;
  });

  const tsePages = exporterData["the-search-equation"]?.pages || [];

  const initialSites = [
    {
      id: "bathroom-upgrades",
      name: "Bathroom Upgrades",
      url: exporterData["bathroom-upgrades"]?.site_url || "https://bathroomupgrades.co.uk",
      status: "Connected",
      lastAudit: "16 May 2026",
      tasks: []
    },
    {
      id: "the-search-equation",
      name: "The Search Equation",
      url: exporterData["the-search-equation"]?.site_url || "https://thesearchequation.com",
      status: "Connected",
      lastAudit: null,
      tasks: []
    }
  ];

  const defaultData = {
    sites: initialSites,
    pagesData: {
      "bathroom-upgrades": buPages,
      "the-search-equation": tsePages
    }
  };

  saveFallback(defaultData);
  return defaultData;
}

function saveFallback(data) {
  try {
    fs.writeFileSync(fallbackFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing fallback JSON file:", err.message);
  }
}

// Configure PostgreSQL connection pool
const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
  pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('sslmode=require') || databaseUrl.includes('neon') || databaseUrl.includes('supabase')
      ? { rejectUnauthorized: false }
      : false
  });
  useDb = true;
} else {
  console.warn("DATABASE_URL environment variable is not defined. Using local file fallback (db_backup.json).");
}

async function initDb() {
  if (!useDb) {
    loadFallback();
    return;
  }

  try {
    const client = await pool.connect();
    console.log("Connected to PostgreSQL database successfully.");
    client.release();

    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS websites (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Connected',
        last_audit VARCHAR(100),
        tasks JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS page_configurations (
        site_id VARCHAR(100) REFERENCES websites(id) ON DELETE CASCADE,
        page_url TEXT NOT NULL,
        page_title TEXT NOT NULL,
        target_phrase VARCHAR(255) DEFAULT '',
        parent_page TEXT DEFAULT '/',
        assigned_type VARCHAR(100) DEFAULT 'Supporting Page',
        status VARCHAR(100) NOT NULL DEFAULT 'Unconfigured',
        last_modified_date VARCHAR(100),
        crawl_data JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (site_id, page_url)
      );
    `);

    // Seed database if empty
    const { rows } = await pool.query("SELECT COUNT(*) FROM websites");
    if (parseInt(rows[0].count, 10) === 0) {
      console.log("PostgreSQL database is empty. Seeding initial data...");
      const defaultData = loadFallback();
      
      for (const site of defaultData.sites) {
        await pool.query(
          `INSERT INTO websites (id, name, url, status, last_audit, tasks)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [site.id, site.name, site.url, site.status, site.lastAudit, JSON.stringify(site.tasks || [])]
        );

        const pages = defaultData.pagesData[site.id] || [];
        for (const page of pages) {
          await pool.query(
            `INSERT INTO page_configurations 
             (site_id, page_url, page_title, target_phrase, parent_page, assigned_type, status, last_modified_date, crawl_data)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (site_id, page_url) DO NOTHING`,
            [
              site.id,
              page.pageUrl,
              page.pageTitle || "",
              page.targetPhrase || "",
              page.parentPage || "/",
              page.assignedType || "Supporting Page",
              page.status || "Unconfigured",
              page.lastModifiedDate || "",
              JSON.stringify(page.crawlData || {})
            ]
          );
        }
      }
      console.log("Seeding completed successfully.");
    }
  } catch (err) {
    console.error("Failed to initialize PostgreSQL database. Falling back to local file. Error:", err.message);
    useDb = false;
    loadFallback();
  }
}

async function getSites() {
  if (useDb) {
    try {
      const { rows } = await pool.query("SELECT id, name, url, status, last_audit AS \"lastAudit\", tasks FROM websites ORDER BY created_at ASC");
      return rows.map(r => ({
        id: r.id,
        name: r.name,
        url: r.url,
        status: r.status,
        lastAudit: r.lastAudit,
        tasks: typeof r.tasks === 'string' ? JSON.parse(r.tasks) : (r.tasks || [])
      }));
    } catch (err) {
      console.error("Database query sites failed, using fallback:", err.message);
    }
  }
  return loadFallback().sites;
}

async function saveSite(site) {
  if (useDb) {
    try {
      await pool.query(
        `INSERT INTO websites (id, name, url, status, last_audit, tasks)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE 
         SET name = EXCLUDED.name, url = EXCLUDED.url, status = EXCLUDED.status, last_audit = EXCLUDED.last_audit, tasks = EXCLUDED.tasks, updated_at = NOW()`,
        [site.id, site.name, site.url, site.status, site.lastAudit, JSON.stringify(site.tasks || [])]
      );
      return;
    } catch (err) {
      console.error("Database save site failed, using fallback:", err.message);
    }
  }
  const data = loadFallback();
  const index = data.sites.findIndex(s => s.id === site.id);
  if (index !== -1) {
    data.sites[index] = site;
  } else {
    data.sites.push(site);
  }
  saveFallback(data);
}

async function saveAllSites(sites) {
  if (useDb) {
    try {
      for (const site of sites) {
        await saveSite(site);
      }
      return;
    } catch (err) {
      console.error("Database save all sites failed:", err.message);
    }
  }
  const data = loadFallback();
  data.sites = sites;
  saveFallback(data);
}

async function getPagesData() {
  if (useDb) {
    try {
      const { rows } = await pool.query("SELECT site_id, page_url, page_title, target_phrase, parent_page, assigned_type, status, last_modified_date, crawl_data FROM page_configurations");
      const pagesData = {};
      rows.forEach(r => {
        if (!pagesData[r.site_id]) {
          pagesData[r.site_id] = [];
        }
        pagesData[r.site_id].push({
          pageUrl: r.page_url,
          pageTitle: r.page_title,
          targetPhrase: r.target_phrase || "",
          parentPage: r.parent_page || "/",
          assignedType: r.assigned_type || "Supporting Page",
          status: r.status,
          lastModifiedDate: r.last_modified_date || "",
          crawlData: typeof r.crawl_data === 'string' ? JSON.parse(r.crawl_data) : (r.crawl_data || {})
        });
      });
      return pagesData;
    } catch (err) {
      console.error("Database query pagesData failed, using fallback:", err.message);
    }
  }
  return loadFallback().pagesData;
}

async function savePageConfig(siteId, page) {
  if (useDb) {
    try {
      await pool.query(
        `INSERT INTO page_configurations 
         (site_id, page_url, page_title, target_phrase, parent_page, assigned_type, status, last_modified_date, crawl_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (site_id, page_url) DO UPDATE 
         SET page_title = EXCLUDED.page_title, target_phrase = EXCLUDED.target_phrase, parent_page = EXCLUDED.parent_page, 
             assigned_type = EXCLUDED.assigned_type, status = EXCLUDED.status, last_modified_date = EXCLUDED.last_modified_date, 
             crawl_data = EXCLUDED.crawl_data, updated_at = NOW()`,
        [
          siteId,
          page.pageUrl,
          page.pageTitle || "",
          page.targetPhrase || "",
          page.parentPage || "/",
          page.assignedType || "Supporting Page",
          page.status || "Unconfigured",
          page.lastModifiedDate || "",
          JSON.stringify(page.crawlData || {})
        ]
      );
      return;
    } catch (err) {
      console.error("Database save page failed:", err.message);
    }
  }
  const data = loadFallback();
  if (!data.pagesData[siteId]) {
    data.pagesData[siteId] = [];
  }
  const index = data.pagesData[siteId].findIndex(p => p.pageUrl === page.pageUrl);
  if (index !== -1) {
    data.pagesData[siteId][index] = page;
  } else {
    data.pagesData[siteId].push(page);
  }
  saveFallback(data);
}

async function saveAllPagesForSite(siteId, pages) {
  if (useDb) {
    try {
      const currentUrls = pages.map(p => p.pageUrl);
      if (currentUrls.length > 0) {
        await pool.query("DELETE FROM page_configurations WHERE site_id = $1 AND page_url NOT IN (" + currentUrls.map((_, i) => `$${i + 2}`).join(',') + ")", [siteId, ...currentUrls]);
      } else {
        await pool.query("DELETE FROM page_configurations WHERE site_id = $1", [siteId]);
      }
      
      for (const page of pages) {
        await savePageConfig(siteId, page);
      }
      return;
    } catch (err) {
      console.error("Database save all pages failed:", err.message);
    }
  }
  const data = loadFallback();
  data.pagesData[siteId] = pages;
  saveFallback(data);
}

module.exports = {
  initDb,
  getSites,
  saveSite,
  saveAllSites,
  getPagesData,
  savePageConfig,
  saveAllPagesForSite
};
