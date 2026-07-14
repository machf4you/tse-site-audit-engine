const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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

  console.log("Connecting to database using Pool...");
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log("=== CLEANING DATABASE ===");
    const { rows: sites } = await pool.query('SELECT * FROM websites');
    const hf4youSites = sites.filter(s => s.url.trim().toLowerCase().includes('hf4you.co.uk'));
    
    if (hf4youSites.length > 1) {
      // Keep the first one, delete the rest
      const keepSite = hf4youSites[0];
      const deleteSites = hf4youSites.slice(1);
      
      for (const ds of deleteSites) {
        console.log(`Deleting duplicate site row: ${ds.id} (${ds.url})`);
        await pool.query('DELETE FROM websites WHERE id = $1', [ds.id]);
      }
      console.log(`Database cleaned: kept only ${keepSite.id}`);
    } else {
      console.log("No duplicate HF4You sites found in database.");
    }
  } catch (err) {
    console.error("Database error during cleanup:", err.message);
  } finally {
    await pool.end();
  }
})();
