const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Delete any process environment variables that node-postgres might fall back to
delete process.env.PGUSER;
delete process.env.PGPASSWORD;
delete process.env.PGHOST;
delete process.env.PGPORT;
delete process.env.PGDATABASE;

const envPath = path.join(__dirname, '.env');
let databaseUrl = null;
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/DATABASE_URL\s*=\s*(.+)/);
  if (match) {
    databaseUrl = match[1].trim();
  }
}

const fallbackFilePath = path.join(__dirname, 'db_backup.json');

(async () => {
  // 1. Clean fallback backup JSON file if it exists
  if (fs.existsSync(fallbackFilePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(fallbackFilePath, 'utf8'));
      if (data && Array.isArray(data.sites)) {
        console.log("=== CLEANING BACKUP JSON ===");
        const hf4youSites = data.sites.filter(s => s.url.trim().toLowerCase().includes('hf4you.co.uk'));
        if (hf4youSites.length > 1) {
          const keepSite = hf4youSites[0];
          data.sites = data.sites.filter(s => !s.url.trim().toLowerCase().includes('hf4you.co.uk') || s.id === keepSite.id);
          
          // Clean up pagesData for deleted site IDs
          const newPagesData = {};
          data.sites.forEach(s => {
            if (data.pagesData && data.pagesData[s.id]) {
              newPagesData[s.id] = data.pagesData[s.id];
            }
          });
          data.pagesData = newPagesData;
          
          fs.writeFileSync(fallbackFilePath, JSON.stringify(data, null, 2), 'utf8');
          console.log(`Cleaned db_backup.json: kept only ${keepSite.id}`);
        } else {
          console.log("No duplicates in db_backup.json.");
        }
      }
    } catch (e) {
      console.error("Failed to clean backup JSON:", e.message);
    }
  }

  // 2. Clean Supabase database
  if (!databaseUrl) {
    console.log("DATABASE_URL env variable not defined or not found in server/.env. Supabase cleanup skipped.");
    return;
  }

  let clientOptions = {};
  try {
    const params = url.parse(databaseUrl);
    const auth = params.auth.split(':');
    clientOptions = {
      user: auth[0],
      password: auth[1],
      host: params.hostname,
      port: params.port,
      database: params.pathname.split('/')[1],
      ssl: {
        rejectUnauthorized: false
      }
    };
    console.log("Connecting with parsed client options. Explicit User:", clientOptions.user);
  } catch (e) {
    console.error("Failed to parse DATABASE_URL, falling back to connectionString:", e.message);
    clientOptions = {
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      }
    };
  }

  const client = new Client(clientOptions);

  try {
    await client.connect();
    console.log("=== CLEANING DATABASE ===");
    const { rows: sites } = await client.query('SELECT * FROM websites');
    const hf4youSites = sites.filter(s => s.url.trim().toLowerCase().includes('hf4you.co.uk'));
    
    if (hf4youSites.length > 1) {
      // Keep the first one, delete the rest
      const keepSite = hf4youSites[0];
      const deleteSites = hf4youSites.slice(1);
      
      for (const ds of deleteSites) {
        console.log(`Deleting duplicate site row: ${ds.id} (${ds.url})`);
        await client.query('DELETE FROM websites WHERE id = $1', [ds.id]);
      }
      console.log(`Database cleaned: kept only ${keepSite.id}`);
    } else {
      console.log("No duplicate HF4You sites found in database.");
    }
  } catch (err) {
    console.error("Database error during cleanup:", err.message);
  } finally {
    await client.end();
  }
})();
