const fs = require('fs');
const path = require('path');
const { initDb, getSites, saveAllSites } = require('./db');

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

  // 2. Clean database using db.js methods
  try {
    console.log("=== INITIALIZING DATABASE ===");
    await initDb();
    
    console.log("=== FETCHING SITES ===");
    const sites = await getSites();
    console.log("Found site IDs in DB:", sites.map(s => s.id));
    
    const hf4youSites = sites.filter(s => s.url.trim().toLowerCase().includes('hf4you.co.uk'));
    if (hf4youSites.length > 1) {
      console.log(`Found ${hf4youSites.length} HF4You sites. Pruning duplicates...`);
      const keepSite = hf4youSites[0];
      const cleanedSites = sites.filter(s => !s.url.trim().toLowerCase().includes('hf4you.co.uk') || s.id === keepSite.id);
      
      console.log("Saving cleaned sites list:", cleanedSites.map(s => s.id));
      await saveAllSites(cleanedSites);
      console.log("Database successfully cleaned via saveAllSites!");
    } else {
      console.log("No duplicate HF4You sites found in database.");
    }
  } catch (err) {
    console.error("Database error during cleanup:", err.message);
  }
})();
