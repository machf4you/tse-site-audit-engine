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

function getPageSEOScore(pageUrl) {
  const url = pageUrl;
  if (url === "/") return 0;
  if (url.includes("elementor_library") || url.includes("template") || url.includes("library")) {
    return 6;
  }
  const legalKeywords = [
    "privacy", "terms", "cookie", "sitemap", "disclaimer", "legal", "complaints", "conditions"
  ];
  if (legalKeywords.some(kw => url.includes(kw))) {
    return 5;
  }
  const coreKeywords = [
    "installation", "refurbishment", "fitters", "renovations", "renovation-cost",
    "seo-services", "seo-consultant", "local-seo", "ecommerce-seo", "technical-seo",
    "paid-search", "migration", "specialist", "developer", "google-business-profile-seo",
    "seo-audit", "fractional-seo", "ppc", "design", "audit"
  ];
  const isLocation = (url.includes("renovation-") && (
    url.includes("sidcup") || url.includes("welling") || url.includes("bexleyheath") || 
    url.includes("erith") || url.includes("dartford") || url.includes("belvedere") || 
    url.includes("abbey-wood")
  )) || url.includes("seo-london") || url.includes("seo-bournemouth") || 
       url.includes("seo-exeter") || url.includes("seo-oxford") || url.includes("seo-reading");
  if (!isLocation && coreKeywords.some(kw => url.includes(kw))) {
    return 1;
  }
  if (isLocation) return 2;
  const commercialKeywords = [
    "contact", "thank-you", "gallery", "about", "case-studies", "domain-services",
    "affordable-seo", "builder-seo", "clinic-seo", "dentist-seo", "law-firm-seo", "shopify-seo",
    "domain", "prices", "faqs", "estate-agents", "areas", "about-us"
  ];
  if (commercialKeywords.some(kw => url.includes(kw))) {
    return 3;
  }
  return 4;
}

function getPageAuditorAssignedType(pageUrl) {
  const score = getPageSEOScore(pageUrl);
  switch (score) {
    case 0: return "Hub";
    case 1:
    case 2: return "Landing";
    case 3: return "Supporting";
    case 4: return "Topical";
    default: return "Excluded";
  }
}

// Helper to load fallback JSON data
function loadFallback() {
  let loadedData = null;
  if (fs.existsSync(fallbackFilePath)) {
    try {
      loadedData = JSON.parse(fs.readFileSync(fallbackFilePath, 'utf8'));
    } catch (err) {
      console.error("Error reading fallback JSON file:", err.message);
    }
  }
  
  if (!loadedData) {
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

    loadedData = {
      sites: initialSites,
      pagesData: {
        "bathroom-upgrades": buPages,
        "the-search-equation": tsePages
      }
    };
    saveFallback(loadedData);
  }

  // Ensure all pages have their Page Auditor assigned type mirrored
  if (loadedData && loadedData.pagesData) {
    let changed = false;
    Object.keys(loadedData.pagesData).forEach(siteId => {
      loadedData.pagesData[siteId] = loadedData.pagesData[siteId].map(p => {
        const calculatedType = getPageAuditorAssignedType(p.pageUrl);
        if (p.assignedType !== calculatedType) {
          changed = true;
          return { ...p, assignedType: calculatedType };
        }
        return p;
      });
    });
    if (changed) {
      saveFallback(loadedData);
    }
  }

  return loadedData;
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
        wp_username VARCHAR(255),
        wp_password VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migrate existing table if needed
    await pool.query("ALTER TABLE websites ADD COLUMN IF NOT EXISTS wp_username VARCHAR(255)");
    await pool.query("ALTER TABLE websites ADD COLUMN IF NOT EXISTS wp_password VARCHAR(255)");

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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS page_classifications (
        site_id VARCHAR(100) REFERENCES websites(id) ON DELETE CASCADE,
        page_url TEXT NOT NULL,
        page_title TEXT NOT NULL,
        assigned_type VARCHAR(100) NOT NULL,
        detected_type VARCHAR(100) NOT NULL,
        seo_score INTEGER NOT NULL,
        last_audited TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (site_id, page_url)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS architecture_notes (
        id VARCHAR(100) PRIMARY KEY,
        content TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Load config fallback credentials
    const credentialsPath = path.join(__dirname, 'fallback_credentials.json');
    let fallbackCredentials = {};
    if (fs.existsSync(credentialsPath)) {
      try {
        fallbackCredentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      } catch (err) {
        console.error("Error reading fallback_credentials.json:", err.message);
      }
    }

    // Seed database if empty
    const { rows } = await pool.query("SELECT COUNT(*) FROM websites");
    if (parseInt(rows[0].count, 10) === 0) {
      console.log("PostgreSQL database is empty. Seeding initial data...");
      const defaultData = loadFallback();
      
      for (const site of defaultData.sites) {
        const creds = fallbackCredentials[site.id] || site.credentials;
        await pool.query(
          `INSERT INTO websites (id, name, url, status, last_audit, tasks, wp_username, wp_password)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            site.id,
            site.name,
            site.url,
            site.status,
            site.lastAudit,
            JSON.stringify(site.tasks || []),
            creds?.username || "",
            creds?.password || ""
          ]
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

      console.log("Seeding default architecture notes...");
      const initialNotesPath = path.join(__dirname, 'architecture_notes.txt');
      const initialNotes = fs.readFileSync(initialNotesPath, 'utf8');
      await pool.query(
        `INSERT INTO architecture_notes (id, content) VALUES ('default', $1)
         ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content`,
        [initialNotes]
      );

      console.log("Seeding completed successfully.");
    }

    // Self-healing migration for existing databases:
    // Update blank/empty credentials from fallback file or config data
    console.log("Running self-healing migration for website credentials...");
    const currentFallback = loadFallback();
    for (const site of currentFallback.sites) {
      const creds = fallbackCredentials[site.id] || site.credentials;
      if (creds?.username && creds?.password) {
        await pool.query(
          `UPDATE websites 
           SET wp_username = COALESCE(NULLIF(wp_username, ''), $2),
               wp_password = COALESCE(NULLIF(wp_password, ''), $3)
           WHERE id = $1 AND (wp_username IS NULL OR wp_username = '' OR wp_password IS NULL OR wp_password = '')`,
          [site.id, creds.username, creds.password]
        );
      }
    }
    console.log("Self-healing credentials migration completed.");
  } catch (err) {
    console.error("Failed to initialize PostgreSQL database. Falling back to local file. Error:", err.message);
    useDb = false;
    loadFallback();
  }
}

async function getSites() {
  if (useDb) {
    try {
      const { rows } = await pool.query("SELECT id, name, url, status, last_audit AS \"lastAudit\", tasks, wp_username, wp_password FROM websites ORDER BY created_at ASC");
      return rows.map(r => ({
        id: r.id,
        name: r.name,
        url: r.url,
        status: r.status,
        lastAudit: r.lastAudit,
        tasks: typeof r.tasks === 'string' ? JSON.parse(r.tasks) : (r.tasks || []),
        credentials: {
          username: r.wp_username || "",
          password: r.wp_password || ""
        }
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
        `INSERT INTO websites (id, name, url, status, last_audit, tasks, wp_username, wp_password)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE 
         SET name = EXCLUDED.name, 
             url = EXCLUDED.url, 
             status = EXCLUDED.status, 
             last_audit = EXCLUDED.last_audit, 
             tasks = EXCLUDED.tasks,
             wp_username = EXCLUDED.wp_username,
             wp_password = EXCLUDED.wp_password,
             updated_at = NOW()`,
        [
          site.id, 
          site.name, 
          site.url, 
          site.status, 
          site.lastAudit, 
          JSON.stringify(site.tasks || []),
          site.credentials?.username || "",
          site.credentials?.password || ""
        ]
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
      const { rows } = await pool.query(`
        SELECT 
          pc.site_id, 
          pc.page_url, 
          pc.page_title, 
          pc.target_phrase, 
          pc.parent_page, 
          pc.assigned_type as page_config_assigned_type,
          pc.status, 
          pc.last_modified_date, 
          pc.crawl_data,
          c.assigned_type as page_auditor_assigned_type
        FROM page_configurations pc
        LEFT JOIN page_classifications c ON pc.site_id = c.site_id AND pc.page_url = c.page_url
      `);
      const pagesData = {};
      rows.forEach(r => {
        if (!pagesData[r.site_id]) {
          pagesData[r.site_id] = [];
        }
        // Determine assignedType prioritizing page_classifications (Page Auditor) 
        // then page_configurations (WordPress import/user override), falling back to calculated type
        let assignedType = r.page_auditor_assigned_type || r.page_config_assigned_type || getPageAuditorAssignedType(r.page_url);
        
        // Heal database corruption: If the database value got corrupted to "Excluded" by the previous bug,
        // restore the page to its calculated type, unless it was actually classified as "Excluded" by the Page Auditor
        // or matches one of the explicit exclusion rules (e.g. calculated type is Excluded).
        if (assignedType === "Excluded" && !r.page_auditor_assigned_type && getPageAuditorAssignedType(r.page_url) !== "Excluded") {
          assignedType = getPageAuditorAssignedType(r.page_url);
        }

        pagesData[r.site_id].push({
          pageUrl: r.page_url,
          pageTitle: r.page_title,
          targetPhrase: r.target_phrase || "",
          parentPage: r.parent_page || "/",
          assignedType: assignedType,
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
  const validTypes = ["Hub", "Landing", "Supporting", "Topical", "Excluded", "Hub Page", "Landing Page", "Supporting Page", "Topical Page"];
  const type = validTypes.includes(page.assignedType)
    ? page.assignedType
    : getPageAuditorAssignedType(page.pageUrl);

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
          type,
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
  console.log(`[DB] saveAllPagesForSite called for siteId: ${siteId} with ${pages ? pages.length : 0} pages`);
  const validTypes = ["Hub", "Landing", "Supporting", "Topical", "Excluded", "Hub Page", "Landing Page", "Supporting Page", "Topical Page"];

  if (useDb) {
    try {
      const currentUrls = pages.map(p => p.pageUrl);
      if (currentUrls.length > 0) {
        await pool.query("DELETE FROM page_configurations WHERE site_id = $1 AND page_url NOT IN (" + currentUrls.map((_, i) => `$${i + 2}`).join(',') + ")", [siteId, ...currentUrls]);
      } else {
        await pool.query("DELETE FROM page_configurations WHERE site_id = $1", [siteId]);
      }
      
      for (const page of pages) {
        if (!validTypes.includes(page.assignedType)) {
          page.assignedType = getPageAuditorAssignedType(page.pageUrl);
        }
        await savePageConfig(siteId, page);
      }
      return;
    } catch (err) {
      console.error("Database save all pages failed:", err.message);
    }
  }
  const data = loadFallback();
  const classifiedPages = pages.map(p => {
    const type = validTypes.includes(p.assignedType)
      ? p.assignedType
      : getPageAuditorAssignedType(p.pageUrl);
    return { ...p, assignedType: type };
  });
  data.pagesData[siteId] = classifiedPages;
  saveFallback(data);
}

async function getArchitectureNotes() {
  if (useDb) {
    try {
      const { rows } = await pool.query("SELECT content FROM architecture_notes WHERE id = 'default'");
      if (rows.length > 0) {
        return rows[0].content;
      }
    } catch (err) {
      console.error("Database query architecture_notes failed:", err.message);
    }
  }
  const notesPath = path.join(__dirname, 'architecture_notes.txt');
  if (fs.existsSync(notesPath)) {
    return fs.readFileSync(notesPath, 'utf8');
  }
  return "";
}

async function saveArchitectureNotes(content) {
  if (useDb) {
    try {
      await pool.query(
        `INSERT INTO architecture_notes (id, content, updated_at)
         VALUES ('default', $1, NOW())
         ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()`,
        [content]
      );
      return;
    } catch (err) {
      console.error("Database save architecture_notes failed:", err.message);
    }
  }
  const notesPath = path.join(__dirname, 'architecture_notes.txt');
  fs.writeFileSync(notesPath, content, 'utf8');
}

async function getDiagnostics() {
  let dbSites = [];
  let dbError = null;
  if (useDb) {
    try {
      const { rows } = await pool.query("SELECT * FROM websites");
      dbSites = rows;
    } catch (err) {
      dbError = err.message;
    }
  }
  let fallbackData = null;
  if (fs.existsSync(fallbackFilePath)) {
    try {
      fallbackData = JSON.parse(fs.readFileSync(fallbackFilePath, 'utf8'));
    } catch (e) {
      fallbackData = { error: e.message };
    }
  }
  return {
    useDb,
    databaseUrlDefined: !!process.env.DATABASE_URL,
    fallbackExists: fs.existsSync(fallbackFilePath),
    fallbackPath: fallbackFilePath,
    dbError,
    dbSitesCount: dbSites.length,
    dbSites: dbSites.map(s => ({
      id: s.id,
      name: s.name,
      wp_username: s.wp_username,
      wp_password: s.wp_password ? (s.wp_password.substring(0, 3) + "...") : null
    })),
    fallbackSites: fallbackData ? (fallbackData.sites || []).map(s => ({
      id: s.id,
      name: s.name,
      credentials: s.credentials
    })) : null
  };
}

module.exports = {
  initDb,
  getSites,
  saveSite,
  saveAllSites,
  getPagesData,
  savePageConfig,
  saveAllPagesForSite,
  getArchitectureNotes,
  saveArchitectureNotes,
  getDiagnostics
};
