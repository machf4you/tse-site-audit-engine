const axios = require('./server/node_modules/axios');
const cheerio = require('./server/node_modules/cheerio');

// --- Helper Functions from App.jsx ---
const isAltMissingOrGeneric = (alt) => {
  const altClean = (alt || "").trim().toLowerCase();
  if (!altClean || altClean.length < 3) return true;
  const genericWords = ["image", "photo", "pic", "img", "webp", "jpg", "png", "placeholder", "untitled"];
  if (genericWords.includes(altClean)) return true;
  if (/^[0-9\-_]+$/.test(altClean)) return true;
  return false;
};

const getPageSEOScore = (pageUrl) => {
  const url = pageUrl;
  
  // 1. Homepage
  if (url === "/") return 0;
  
  // 7. Elementor/Library Pages
  if (url.includes("elementor_library") || url.includes("template") || url.includes("library")) {
    return 6;
  }
  
  // 6. Legal/System Pages
  const legalKeywords = [
    "privacy", "terms", "cookie", "sitemap", "disclaimer", "legal", "complaints", "conditions"
  ];
  if (legalKeywords.some(kw => url.includes(kw))) {
    return 5;
  }
  
  // 2. Core Service Pages
  const coreKeywords = [
    "installation", "refurbishment", "fitters", "renovations", "renovation-cost",
    "seo-services", "seo-consultant", "local-seo", "ecommerce-seo", "technical-seo",
    "paid-search", "migration", "specialist", "developer", "google-business-profile-seo",
    "seo-audit", "fractional-seo", "ppc", "design", "audit"
  ];
  
  // Helper check to make sure it's not a location landing page
  const isLocation = (url.includes("renovation-") && (
    url.includes("sidcup") || url.includes("welling") || url.includes("bexleyheath") || 
    url.includes("erith") || url.includes("dartford") || url.includes("belvedere") || 
    url.includes("abbey-wood")
  )) || url.includes("seo-london") || url.includes("seo-bournemouth") || 
       url.includes("seo-exeter") || url.includes("seo-oxford") || url.includes("seo-reading");
        
  if (!isLocation && coreKeywords.some(kw => url.includes(kw))) {
    return 1;
  }
  
  // 3. Location Pages
  if (isLocation) return 2;
  
  // 4. Commercial/Support Pages
  const commercialKeywords = [
    "contact", "thank-you", "gallery", "about", "case-studies", "domain-services",
    "affordable-seo", "builder-seo", "clinic-seo", "dentist-seo", "law-firm-seo", "shopify-seo",
    "domain", "prices", "faqs", "estate-agents", "areas", "about-us"
  ];
  if (commercialKeywords.some(kw => url.includes(kw))) {
    return 3;
  }
  
  // 5. Blog/Content Pages (default catch-all for remaining informational/post pages)
  return 4;
};

const runPageAudit = (pageUrl, targetPhrase, pageTitle, data) => {
  const tp = (targetPhrase || "").trim().toLowerCase();

  // 1. Title Tag
  const titleMatch = tp ? data.title.toLowerCase().includes(tp) : false;
  const titleLengthOk = data.title.length >= 30 && data.title.length <= 65;
  const titleOccurrences = tp ? (data.title.toLowerCase().split(tp).length - 1) : 0;
  const titleOverOptimized = titleOccurrences > 1;

  let titleErrors = [];
  if (!titleMatch) {
    titleErrors.push(`Add target phrase "${targetPhrase || "keyword"}" to title tag`);
  }
  if (!titleLengthOk) {
    titleErrors.push(data.title.length > 65 
      ? `shorten to under 65 characters (currently ${data.title.length} characters)`
      : `lengthen to at least 30 characters (currently ${data.title.length} characters)`
    );
  }
  if (titleOverOptimized) {
    titleErrors.push("remove duplicate target phrase to avoid keyword stuffing");
  }

  let titleStatus = "Pass";
  let titleAction = "";
  if (titleErrors.length > 0) {
    titleStatus = "Fail";
    if (!titleMatch) {
      titleAction = titleErrors[0];
      if (titleErrors.length > 1) {
        titleAction += " and " + titleErrors.slice(1).join(", ");
      }
    } else {
      const firstErr = titleErrors[0];
      titleAction = firstErr.charAt(0).toUpperCase() + firstErr.slice(1);
      if (titleErrors.length > 1) {
        titleAction += " and " + titleErrors.slice(1).join(", ");
      }
    }
  }

  // 2. Meta Description
  const descMatch = tp ? data.description.toLowerCase().includes(tp) : false;
  const descLengthOk = data.description.length >= 110 && data.description.length <= 160;
  const descOccurrences = tp ? (data.description.toLowerCase().split(tp).length - 1) : 0;
  const descOverOptimized = descOccurrences > 1;

  let descErrors = [];
  if (!descMatch) {
    descErrors.push(`Add target phrase "${targetPhrase || "keyword"}" to meta description`);
  }
  if (!descLengthOk) {
    descErrors.push(data.description.length > 160
      ? `shorten to under 160 characters (currently ${data.description.length} characters)`
      : `lengthen to at least 110 characters (currently ${data.description.length} characters)`
    );
  }
  if (descOverOptimized) {
    descErrors.push("remove duplicate target phrase to avoid keyword stuffing");
  }

  let descStatus = "Pass";
  let descAction = "";
  if (descErrors.length > 0) {
    descStatus = "Fail";
    if (!descMatch) {
      descAction = descErrors[0];
      if (descErrors.length > 1) {
        descAction += " and " + descErrors.slice(1).join(", ");
      }
    } else {
      const firstErr = descErrors[0];
      descAction = firstErr.charAt(0).toUpperCase() + firstErr.slice(1);
      if (descErrors.length > 1) {
        descAction += " and " + descErrors.slice(1).join(", ");
      }
    }
  }

  // 3. H1
  const normalizedH1 = data.h1.replace(/\s+/g, " ");
  const h1Match = tp ? normalizedH1.toLowerCase().includes(tp) : false;
  const h1LengthOk = normalizedH1.length >= 10 && normalizedH1.length <= 70;
  const h1IsDuplicateOfTitle = normalizedH1.toLowerCase() === data.title.toLowerCase();

  let h1Errors = [];
  if (!h1Match) {
    h1Errors.push(`Add target phrase "${targetPhrase || "keyword"}" to H1 heading`);
  }
  if (!h1LengthOk) {
    h1Errors.push(normalizedH1.length > 70
      ? `shorten to under 70 characters (currently ${normalizedH1.length} characters)`
      : `lengthen to at least 10 characters (currently ${normalizedH1.length} characters)`
    );
  }
  if (h1IsDuplicateOfTitle) {
    h1Errors.push("make H1 heading unique (currently identical to Title Tag)");
  }

  let h1Status = "Pass";
  let h1Action = "";
  if (h1Errors.length > 0) {
    h1Status = "Fail";
    if (!h1Match) {
      h1Action = h1Errors[0];
      if (h1Errors.length > 1) {
        h1Action += " and " + h1Errors.slice(1).join(", ");
      }
    } else {
      const firstErr = h1Errors[0];
      h1Action = firstErr.charAt(0).toUpperCase() + firstErr.slice(1);
      if (h1Errors.length > 1) {
        h1Action += " and " + h1Errors.slice(1).join(", ");
      }
    }
  }

  // 4. H2 Count
  const h2Match = tp ? data.h2List.some(h2 => h2.replace(/\s+/g, " ").toLowerCase().includes(tp)) : false;
  const h2Status = data.h2Count > 0 ? "Pass" : "Fail";
  const h2Action = h2Status === "Fail" ? "Add H2 headings to the page structure" : "";
  const h2Recommendation = (h2Status === "Pass" && !h2Match) 
    ? `Add target phrase "${targetPhrase || "keyword"}" to at least one H2 heading` 
    : "";

  // 5. Word Count
  const wordMatch = tp ? data.plainText.toLowerCase().includes(tp) : false;
  const wordStatus = data.wordCount >= 500 ? "Pass" : "Fail";
  const wordAction = wordStatus === "Fail" ? `Increase content length to at least 500 words (currently ${data.wordCount} words)` : "";
  const wordRecommendation = (wordStatus === "Pass" && !wordMatch) 
    ? `Mention target phrase "${targetPhrase || "keyword"}" in the body content to strengthen keyword relevance` 
    : "";

  // 6. Internal Link Count
  const linkMatch = tp ? data.incomingAnchors.some(anchorObj => anchorObj.anchor.toLowerCase().includes(tp)) : false;
  const linkStatus = data.internalLinkCount >= 3 ? "Pass" : "Fail";
  const linkAction = linkStatus === "Fail" ? `Increase incoming internal links to this page (currently ${data.internalLinkCount} links, minimum 3 required)` : "";
  const linkRecommendation = (linkStatus === "Pass" && !linkMatch) 
    ? `Optimize inbound internal links with target phrase "${targetPhrase || "keyword"}" as anchor text` 
    : "";

  // 7. Image Count
  const imgMatch = tp ? data.images.some(img => 
    img.alt.toLowerCase().includes(tp) || img.url.toLowerCase().includes(tp)
  ) : false;
  const imgStatus = data.imageCount > 0 ? "Pass" : "Fail";
  const imgAction = imgStatus === "Fail" ? "Add relevant images to the page content" : "";
  const imgRecommendation = (imgStatus === "Pass" && !imgMatch) 
    ? `Optimize image alt tags or filenames with target phrase "${targetPhrase || "keyword"}"` 
    : "";

  // 8. Images Missing Alt Text
  const invalidAltsCount = data.images.filter(img => {
    const alt = (img.alt || "").trim().toLowerCase();
    if (!alt || alt.length < 3) return true;
    const genericWords = ["image", "photo", "pic", "img", "webp", "jpg", "png", "placeholder", "untitled"];
    if (genericWords.includes(alt) || alt.match(/^[0-9\-_]+$/)) return true;
    return false;
  }).length;
  const missingAltStatus = invalidAltsCount === 0 ? "Pass" : "Fail";
  const missingAltAction = missingAltStatus === "Fail" ? `Add meaningful alt tags to ${invalidAltsCount} image${invalidAltsCount === 1 ? '' : 's'} missing them` : "";

  return [
    {
      item: "Title Tag",
      current: data.title,
      present: titleMatch ? "Yes" : "No",
      status: titleStatus,
      action: titleAction,
      recommendation: ""
    },
    {
      item: "Meta Description",
      current: data.description,
      present: descMatch ? "Yes" : "No",
      status: descStatus,
      action: descAction,
      recommendation: ""
    },
    {
      item: "H1",
      current: data.h1.replace(/\n/g, " "),
      present: h1Match ? "Yes" : "No",
      status: h1Status,
      action: h1Action,
      recommendation: ""
    },
    {
      item: "H2 Count",
      current: `${data.h2Count} H2 headings`,
      present: h2Match ? "Yes" : "No",
      status: h2Status,
      action: h2Action,
      recommendation: h2Recommendation
    },
    {
      item: "Word Count",
      current: `${data.wordCount} words`,
      present: wordMatch ? "Yes" : "No",
      status: wordStatus,
      action: wordAction,
      recommendation: wordRecommendation
    },
    {
      item: "Internal Link Count",
      current: `${data.internalLinkCount} incoming internal links`,
      present: linkMatch ? "Yes" : "No",
      status: linkStatus,
      action: linkAction,
      recommendation: linkRecommendation
    },
    {
      item: "Image Count",
      current: `${data.imageCount} images`,
      present: imgMatch ? "Yes" : "No",
      status: imgStatus,
      action: imgAction,
      recommendation: imgRecommendation
    },
    {
      item: "Images Missing Alt Text",
      current: `${invalidAltsCount} images with missing/generic alt text`,
      present: "N/A",
      status: missingAltStatus,
      action: missingAltAction,
      recommendation: ""
    }
  ];
};

const pageTypeLabels = [
  "Homepage",
  "Core Service Page",
  "Location Page",
  "Commercial/Support Page",
  "Blog/Content Page",
  "Legal/System Page",
  "Elementor/Library Page"
];

// --- Scraping & Auditing execution ---
async function main() {
  const url = "https://www.thesearchequation.com/seo-services/";
  const phrase = "seo services";
  console.log(`Auditing live page: ${url} against phrase "${phrase}"...\n`);
  
  try {
    const { data: html } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000
    });
    
    const $ = cheerio.load(html);
    
    // Title & Meta
    const title = $('title').text().trim();
    const description = $('meta[name="description"]').attr('content') || '';
    
    // Headings
    const h1 = $('h1').first().text().trim() || 'No H1 found';
    const h2List = [];
    $('h2').each((i, el) => {
      const txt = $(el).text().trim();
      if (txt) h2List.push(txt);
    });
    
    // Visible text & Word count
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
    
    // Internal link count (pointing to searchequation)
    let internalLinkCount = 0;
    $('a').each((i, el) => {
      const href = $(el).attr('href') || '';
      if (href.startsWith('/') || href.includes('thesearchequation.com')) {
        internalLinkCount++;
      }
    });
    
    // Images & Alt texts
    const images = [];
    $('img').each((i, el) => {
      const src = $(el).attr('src') || '';
      const alt = $(el).attr('alt') || '';
      if (src) {
        images.push({ url: src, alt });
      }
    });
    
    const crawlData = {
      title,
      description,
      h1,
      h2Count: h2List.length,
      h2List,
      wordCount,
      plainText: bodyText,
      internalLinkCount,
      incomingAnchors: [],
      imageCount: images.length,
      images
    };
    
    // 1. Detected Page Type
    const typeScore = getPageSEOScore("/seo-services/");
    const pageType = pageTypeLabels[typeScore];
    
    // 2. Run Audit checks
    const checks = runPageAudit("/seo-services/", phrase, title, crawlData);
    
    // 3. Count passed checks
    const passedCount = checks.filter(c => c.status === "Pass").length;
    
    console.log(`========================================`);
    console.log(`DETECTED PAGE TYPE: ${pageType}`);
    console.log(`AUDIT SCORE: ${passedCount} / 8 Passed`);
    console.log(`========================================\n`);
    
    console.log(`RULE CHECKS:`);
    checks.forEach(c => {
      console.log(`- [${c.status.toUpperCase()}] ${c.item}:`);
      console.log(`  Current Value: ${c.current}`);
      if (c.action) console.log(`  Issue/Action:  ${c.action}`);
      if (c.recommendation) console.log(`  Recommendation: ${c.recommendation}`);
    });
    
  } catch (err) {
    console.error("Scraping failed:", err.message);
  }
}

main();
