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
        return { ...p, targetPhrase: "bathroom upgrades", status: "Configured", proposedPageTitle: p.pageTitle };
      } else if (p.pageUrl === "/bathroom-renovations/") {
        return { ...p, targetPhrase: "bathroom renovations", status: "Configured", proposedPageTitle: p.pageTitle };
      } else if (p.pageUrl === "/bathroom-installation/") {
        return { ...p, targetPhrase: "bathroom installation", status: "Configured", proposedPageTitle: p.pageTitle };
      }
      return { ...p, proposedPageTitle: p.proposedPageTitle || p.pageTitle || "" };
    });

    const tsePages = exporterData["the-search-equation"]?.pages || [];

    const initialSites = [
      {
        id: "bathroom-upgrades",
        name: "Bathroom Upgrades",
        url: exporterData["bathroom-upgrades"]?.site_url || "https://bathroomupgrades.co.uk",
        status: "Connected",
        lastAudit: "16 May 2026",
        tasks: [],
        portfolio: "Other",
        platform: "WordPress"
      },
      {
        id: "the-search-equation",
        name: "The Search Equation",
        url: exporterData["the-search-equation"]?.site_url || "https://thesearchequation.com",
        status: "Connected",
        lastAudit: null,
        tasks: [],
        portfolio: "TSE",
        platform: "WordPress"
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
    if (loadedData.sites) {
      loadedData.sites = loadedData.sites.map(site => {
        let siteChanged = false;
        if (!site.portfolio) {
          site.portfolio = site.id === "the-search-equation" ? "TSE" : "Other";
          siteChanged = true;
        }
        if (site.portfolio === "Smoking Chili") {
          site.portfolio = "Chili";
          siteChanged = true;
        }
        if (!site.platform) {
          site.platform = "WordPress";
          siteChanged = true;
        }
        if (siteChanged) changed = true;
        return site;
      });
    }
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
        portfolio VARCHAR(100) DEFAULT 'Other',
        platform VARCHAR(100) DEFAULT 'Other',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migrate existing table if needed
    await pool.query("ALTER TABLE websites ADD COLUMN IF NOT EXISTS wp_username VARCHAR(255)");
    await pool.query("ALTER TABLE websites ADD COLUMN IF NOT EXISTS wp_password VARCHAR(255)");
    await pool.query("ALTER TABLE websites ADD COLUMN IF NOT EXISTS portfolio VARCHAR(100) DEFAULT 'Other'");
    await pool.query("ALTER TABLE websites ADD COLUMN IF NOT EXISTS platform VARCHAR(100) DEFAULT 'Other'");

    // Update existing records with sensible defaults if they are NULL
    await pool.query("UPDATE websites SET portfolio = 'TSE' WHERE id = 'the-search-equation' AND (portfolio IS NULL OR portfolio = 'Other')");
    await pool.query("UPDATE websites SET portfolio = 'Other' WHERE id = 'bathroom-upgrades' AND portfolio IS NULL");
    await pool.query("UPDATE websites SET platform = 'WordPress' WHERE id IN ('the-search-equation', 'bathroom-upgrades') AND platform IS NULL");
    
    // Standardize 'Smoking Chili' to 'Chili'
    await pool.query("UPDATE websites SET portfolio = 'Chili' WHERE portfolio = 'Smoking Chili'");

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

    // Migration: Add proposed_page_title column if it doesn't exist
    await pool.query(`
      ALTER TABLE page_configurations 
      ADD COLUMN IF NOT EXISTS proposed_page_title TEXT
    `);

    // Migration: Add priority column if it doesn't exist
    await pool.query(`
      ALTER TABLE page_configurations 
      ADD COLUMN IF NOT EXISTS priority INTEGER
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
          `INSERT INTO websites (id, name, url, status, last_audit, tasks, wp_username, wp_password, portfolio, platform)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            site.id,
            site.name,
            site.url,
            site.status,
            site.lastAudit,
            JSON.stringify(site.tasks || []),
            creds?.username || "",
            creds?.password || "",
            site.portfolio || "Other",
            site.platform || "Other"
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
               wp_password = CASE 
                 WHEN wp_password = 'Bathroom@2025#' THEN $3
                 ELSE COALESCE(NULLIF(wp_password, ''), $3)
               END
           WHERE id = $1 AND (wp_username IS NULL OR wp_username = '' OR wp_password IS NULL OR wp_password = '' OR wp_password = 'Bathroom@2025#')`,
          [site.id, creds.username, creds.password]
        );
      }
    }
    console.log("Self-healing credentials migration completed.");

    // Self-healing migration: Restore specific Bathroom Upgrades page configurations from db_backup.json
    console.log("Running self-healing migration to restore original W2 page configurations from db_backup.json...");
    try {
      const backupPath = path.join(__dirname, 'db_backup.json');
      if (fs.existsSync(backupPath)) {
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        const backupPages = backupData.pagesData?.["bathroom-upgrades"] || [];
        const pagesToRestore = ["/", "/bathroom-fitters/", "/bathroom-installation/", "/bathroom-refurbishment/", "/bathroom-renovations/"];
        
        for (const p of backupPages) {
          if (pagesToRestore.includes(p.pageUrl)) {
            // Check if page exists in db
            const { rows } = await pool.query(
              "SELECT status FROM page_configurations WHERE site_id = 'bathroom-upgrades' AND page_url = $1",
              [p.pageUrl]
            );

            if (rows.length > 0) {
              console.log(`Restoring configuration for page ${p.pageUrl} from backup...`);
              await pool.query(
                `UPDATE page_configurations 
                 SET target_phrase = $2,
                     assigned_type = $3,
                     parent_page = $4,
                     status = $5,
                     updated_at = NOW()
                 WHERE site_id = 'bathroom-upgrades' AND page_url = $1`,
                [
                  p.pageUrl,
                  p.targetPhrase || "",
                  p.assignedType || "Supporting Page",
                  p.parentPage || "/",
                  p.status || "Unconfigured"
                ]
              );
            } else {
              console.log(`Inserting configuration for page ${p.pageUrl} from backup...`);
              await pool.query(
                `INSERT INTO page_configurations 
                 (site_id, page_url, page_title, target_phrase, parent_page, assigned_type, status, last_modified_date, crawl_data)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                  'bathroom-upgrades',
                  p.pageUrl,
                  p.pageTitle || "",
                  p.targetPhrase || "",
                  p.parentPage || "/",
                  p.assignedType || "Supporting Page",
                  p.status || "Unconfigured",
                  p.lastModifiedDate || "",
                  JSON.stringify(p.crawlData || {})
                ]
              );
            }
          }
        }
        console.log("W2 page configurations restoration completed successfully.");
      }
    } catch (err) {
      console.error("Failed to restore W2 page configurations from backup:", err.message);
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
      const { rows } = await pool.query("SELECT id, name, url, status, last_audit AS \"lastAudit\", tasks, wp_username, wp_password, portfolio, platform FROM websites ORDER BY created_at ASC");
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
        },
        portfolio: r.portfolio || "Other",
        platform: r.platform || "Other"
      }));
    } catch (err) {
      console.error("Database query sites failed, using fallback:", err.message);
    }
  }
  return loadFallback().sites.map(site => ({
    ...site,
    portfolio: site.portfolio || "Other",
    platform: site.platform || "Other"
  }));
}

async function saveSite(site) {
  if (useDb) {
    try {
      await pool.query(
        `INSERT INTO websites (id, name, url, status, last_audit, tasks, wp_username, wp_password, portfolio, platform)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE 
         SET name = EXCLUDED.name, 
             url = EXCLUDED.url, 
             status = EXCLUDED.status, 
             last_audit = EXCLUDED.last_audit, 
             tasks = EXCLUDED.tasks,
             wp_username = EXCLUDED.wp_username,
             wp_password = EXCLUDED.wp_password,
             portfolio = EXCLUDED.portfolio,
             platform = EXCLUDED.platform,
             updated_at = NOW()`,
        [
          site.id, 
          site.name, 
          site.url, 
          site.status, 
          site.lastAudit, 
          JSON.stringify(site.tasks || []),
          site.credentials?.username || "",
          site.credentials?.password || "",
          site.portfolio || "Other",
          site.platform || "Other"
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
    data.sites[index] = {
      ...data.sites[index],
      ...site
    };
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
      const { rows: siteRows } = await pool.query('SELECT id, platform FROM websites');
      const sitePlatforms = {};
      siteRows.forEach(s => {
        sitePlatforms[s.id] = s.platform;
      });

      const { rows } = await pool.query(`
        SELECT 
          pc.site_id, 
          pc.page_url, 
          pc.page_title, 
          pc.proposed_page_title,
          pc.target_phrase, 
          pc.parent_page, 
          pc.assigned_type as page_config_assigned_type, 
          pc.status, 
          pc.last_modified_date, 
          pc.crawl_data,
          pc.priority,
          c.assigned_type as page_auditor_assigned_type
        FROM page_configurations pc
        LEFT JOIN page_classifications c ON pc.site_id = c.site_id AND pc.page_url = c.page_url
      `);
      const pagesData = {};
      rows.forEach(r => {
        if (!pagesData[r.site_id]) {
          pagesData[r.site_id] = [];
        }
        
        const crawlData = typeof r.crawl_data === 'string' ? JSON.parse(r.crawl_data) : (r.crawl_data || {});
        const wpPostId = crawlData.wpPostId || null;
        const platform = sitePlatforms[r.site_id] || "WordPress";

        // Determine assignedType prioritizing page_classifications (Page Auditor) 
        // then page_configurations (WordPress import/user override), falling back to calculated type
        let assignedType = r.page_auditor_assigned_type || r.page_config_assigned_type || getPageAuditorAssignedType(r.page_url);
        
        // Heal database corruption: If the database value got corrupted to "Excluded" by the previous bug,
        // restore the page to its calculated type, unless it was classified as "Excluded" by the Page Auditor.
        if (assignedType === "Excluded" && !r.page_auditor_assigned_type && getPageAuditorAssignedType(r.page_url) !== "Excluded") {
          assignedType = getPageAuditorAssignedType(r.page_url);
        }

        // Apply automatic Magento classification rules
        if (platform === "Magento") {
          const pageUrl = r.page_url;
          if (pageUrl === "/" || pageUrl === "") {
            assignedType = "Hub Page";
          } else if (wpPostId && String(wpPostId).startsWith("category-")) {
            assignedType = "Landing Page";
          } else if (wpPostId && String(wpPostId).startsWith("cms-")) {
            assignedType = "Topical Page";
          }
        }

        let calculatedPriority = r.priority;
        if (calculatedPriority === null || calculatedPriority === undefined) {
          const lower = assignedType.toLowerCase();
          if (lower.includes("hub")) calculatedPriority = 1;
          else if (lower.includes("landing")) calculatedPriority = 2;
          else if (lower.includes("supporting")) calculatedPriority = 3;
          else if (lower.includes("topical")) calculatedPriority = 4;
          else calculatedPriority = 3;
        }

        pagesData[r.site_id].push({
          pageUrl: r.page_url,
          pageTitle: r.page_title,
          proposedPageTitle: r.proposed_page_title || r.page_title || "",
          targetPhrase: r.target_phrase || "",
          parentPage: r.parent_page || "/",
          assignedType: assignedType,
          status: r.status,
          priority: calculatedPriority,
          lastModifiedDate: r.last_modified_date || "",
          wpPostId: wpPostId,
          crawlData: crawlData
        });
      });
      return pagesData;
    } catch (err) {
      console.error("Database query pagesData failed, using fallback:", err.message);
    }
  }

  const loadedFallback = loadFallback();
  const fallbackData = loadedFallback.pagesData;
  const fallbackSites = loadedFallback.sites || [];
  const sitePlatforms = {};
  fallbackSites.forEach(s => {
    sitePlatforms[s.id] = s.platform;
  });

  for (const siteId of Object.keys(fallbackData)) {
    const platform = sitePlatforms[siteId] || "WordPress";
    fallbackData[siteId] = fallbackData[siteId].map(p => {
      let assignedType = p.assignedType;
      const wpPostId = p.wpPostId || (p.crawlData && p.crawlData.wpPostId);

      if (platform === "Magento") {
        const pageUrl = p.pageUrl;
        if (pageUrl === "/" || pageUrl === "") {
          assignedType = "Hub Page";
        } else if (wpPostId && String(wpPostId).startsWith("category-")) {
          assignedType = "Landing Page";
        } else if (wpPostId && String(wpPostId).startsWith("cms-")) {
          assignedType = "Topical Page";
        }
      }

      let calculatedPriority = p.priority;
      if (calculatedPriority === null || calculatedPriority === undefined) {
        const lower = (assignedType || "").toLowerCase();
        if (lower.includes("hub")) calculatedPriority = 1;
        else if (lower.includes("landing")) calculatedPriority = 2;
        else if (lower.includes("supporting")) calculatedPriority = 3;
        else if (lower.includes("topical")) calculatedPriority = 4;
        else calculatedPriority = 3;
      }
      return {
        ...p,
        assignedType,
        wpPostId,
        priority: calculatedPriority
      };
    });
  }
  return fallbackData;
}

async function savePageConfig(siteId, page) {
  const validTypes = ["Hub", "Landing", "Supporting", "Topical", "Excluded", "Hub Page", "Landing Page", "Supporting Page", "Topical Page", "Primary Landing Page"];
  const type = validTypes.includes(page.assignedType)
    ? page.assignedType
    : getPageAuditorAssignedType(page.pageUrl);

  if (useDb) {
    try {
      await pool.query(
        `INSERT INTO page_configurations 
          (site_id, page_url, page_title, proposed_page_title, target_phrase, parent_page, assigned_type, status, last_modified_date, crawl_data, priority)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (site_id, page_url) DO UPDATE 
          SET page_title = EXCLUDED.page_title, 
              proposed_page_title = EXCLUDED.proposed_page_title,
              target_phrase = EXCLUDED.target_phrase, parent_page = EXCLUDED.parent_page, 
              assigned_type = EXCLUDED.assigned_type, status = EXCLUDED.status, last_modified_date = EXCLUDED.last_modified_date, 
              crawl_data = EXCLUDED.crawl_data, priority = EXCLUDED.priority, updated_at = NOW()`,
        [
          siteId,
          page.pageUrl,
          page.pageTitle || "",
          page.proposedPageTitle || page.pageTitle || "",
          page.targetPhrase || "",
          page.parentPage || "/",
          type,
          page.status || "Unconfigured",
          page.lastModifiedDate || "",
          JSON.stringify(page.crawlData || {}),
          page.priority || null
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
  const mappedPage = {
    ...page,
    proposedPageTitle: page.proposedPageTitle || page.pageTitle || ""
  };
  if (index !== -1) {
    data.pagesData[siteId][index] = mappedPage;
  } else {
    data.pagesData[siteId].push(mappedPage);
  }
  saveFallback(data);
}

async function saveAllPagesForSite(siteId, pages) {
  console.log(`[DB] saveAllPagesForSite called for siteId: ${siteId} with ${pages ? pages.length : 0} pages`);
  const validTypes = ["Hub", "Landing", "Supporting", "Topical", "Excluded", "Hub Page", "Landing Page", "Supporting Page", "Topical Page"];

  if (useDb) {
    try {
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
  if (!data.pagesData[siteId]) {
    data.pagesData[siteId] = [];
  }
  const pagesMap = new Map(data.pagesData[siteId].map(p => [p.pageUrl, p]));
  pages.forEach(p => {
    const type = validTypes.includes(p.assignedType)
      ? p.assignedType
      : getPageAuditorAssignedType(p.pageUrl);
    pagesMap.set(p.pageUrl, { 
      ...p, 
      assignedType: type,
      proposedPageTitle: p.proposedPageTitle || p.pageTitle || ""
    });
  });
  data.pagesData[siteId] = Array.from(pagesMap.values());
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

module.exports = {
  initDb,
  getSites,
  saveSite,
  saveAllSites,
  getPagesData,
  savePageConfig,
  saveAllPagesForSite,
  getArchitectureNotes,
  saveArchitectureNotes
};
