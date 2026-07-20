import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckSquare, Play, CheckCircle, RefreshCw, ArrowLeft, 
  ExternalLink, User, Check, Server, AlertCircle, Award, ChevronRight, ChevronDown, Globe, FileText, Link, Clock, Brain,
  Lock, AlertTriangle, Sliders, Database, Target, TrendingUp, Sparkles, Inbox,
  Home, MessageSquare, Download, Search, Network, Megaphone, Bell, HelpCircle, Activity, Plus, Rocket, Code, Calendar, LayoutGrid, List, LogOut
} from 'lucide-react';
import './App.css';
import { ConnectionManager } from "./connectionProviders";
import exporterData from './exporter-data.json';
import LocalPageAuditorApp from './page-auditor/App';
import { useSortableTable } from './hooks/useSortableTable';

const RemotePageAuditorApp = React.lazy(() => import('page_auditor/App'));

class PageAuditorApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = { useLocal: false };
  }

  static getDerivedStateFromError() {
    return { useLocal: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("Failed to load Remote Page Auditor, falling back to local:", error);
  }

  render() {
    if (this.state.useLocal) {
      return <LocalPageAuditorApp />;
    }
    return (
      <React.Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Remote Page Auditor...</div>}>
        <RemotePageAuditorApp />
      </React.Suspense>
    );
  }
}

const getPageSEOScore = (pageOrUrl) => {
  const url = typeof pageOrUrl === 'string' ? pageOrUrl : (pageOrUrl ? pageOrUrl.pageUrl : "");
  if (!url) return 4;
  
  if (url.includes("thank-you") || url.includes("confirmation")) {
    return 5;
  }
  
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
};

function isMagentoExcludedPage(url, title) {
  // Magento page classification exclusions
  const normUrl = (url || "").toLowerCase();
  const slug = normUrl.replace(/^\/+/, "");
  const normTitle = (title || "").toLowerCase();

  const exactSlugs = [
    'about-us', 'about',
    'contact', 'contact-us',
    'delivery', 'delivery-information', 'delivery-info', 'shipping',
    'finance',
    'privacy-policy', 'privacy', 'privacy-policy-cookie-restriction-mode',
    'cookie-policy', 'cookies', 'cookie',
    'terms-and-conditions', 'terms-of-use', 'terms',
    'returns', 'returns-policy',
    'refund', 'refund-policy', 'refunds',
    'gdpr', 'accessibility',
    'sitemap', 'html-sitemap',
    'no-route', '404',
    'login', 'account', 'customer', 'customer-account', 'register',
    'checkout', 'cart', 'basket', 'checkout-cart'
  ];

  if (exactSlugs.includes(slug)) return true;

  const exactTitles = [
    'about us', 'about',
    'contact us', 'contact',
    'delivery information', 'delivery info', 'delivery', 'shipping',
    'finance',
    'privacy policy', 'cookie policy', 'cookies',
    'terms & conditions', 'terms and conditions', 'terms of use',
    'returns policy', 'returns',
    'refund policy', 'refunds',
    'gdpr', 'accessibility',
    'sitemap', 'html sitemap',
    'page not found', '404',
    'login', 'my account', 'register',
    'checkout', 'shopping cart', 'basket'
  ];

  if (exactTitles.some(t => normTitle === t || normTitle.startsWith(t + ' -') || normTitle.startsWith(t + ' |'))) {
    return true;
  }

  const urlSubstrings = [
    'customer/account',
    'checkout/cart',
    '/search',
    'no-route'
  ];
  if (urlSubstrings.some(sub => normUrl.includes(sub))) {
    return true;
  }

  return false;
}

const getPageAuditorAssignedType = (pageOrUrl) => {
  const url = typeof pageOrUrl === 'string' ? pageOrUrl : (pageOrUrl ? pageOrUrl.pageUrl : "");
  const score = getPageSEOScore(url);
  switch (score) {
    case 0: return "Hub";
    case 1:
    case 2: return "Landing";
    case 3: return "Supporting";
    case 4: return "Topical";
    default: return "Excluded";
  }
};

const getPriorityFromAssignedType = (type) => {
  const t = (type || "").toLowerCase().trim();
  if (t === "hub" || t === "hub page" || t === "hub pages" || t === "homepage") return 1;
  if (t === "landing" || t === "landing page" || t === "landing pages" || t === "primary landing page") return 2;
  if (t === "supporting" || t === "supporting page" || t === "supporting pages") return 3;
  if (t === "topical" || t === "topical page" || t === "topical pages") return 4;
  return 3;
};

const runPageAudit = (pageUrl, targetPhrase, pageTitle, siteId, livePageObj) => {
  let foundPage = livePageObj || null;
  
  if (!foundPage) {
    const targetSiteId = siteId || "bathroom-upgrades";
    const site = exporterData[targetSiteId];
    if (site && site.pages) {
      foundPage = site.pages.find(p => p.pageUrl === pageUrl);
    }
    
    if (!foundPage) {
      for (const sId in exporterData) {
        const s = exporterData[sId];
        const p = s.pages.find(page => page.pageUrl === pageUrl);
        if (p) {
          foundPage = p;
          break;
        }
      }
    }
  }

  const crawl = (foundPage && foundPage.crawlData) ? foundPage.crawlData : {};
  const data = {
    url: pageUrl,
    title: (foundPage && foundPage.pageTitle) ? foundPage.pageTitle : (crawl.title || pageTitle || "Page Title"),
    description: crawl.metaDescription || crawl.description || "Expert services across South East London. Call us today for a free quote.",
    h1: crawl.h1 || pageTitle || "Page Title",
    h2Count: typeof crawl.h2Count === 'number' ? crawl.h2Count : 4,
    h2List: crawl.h2List || ["Our Services", "Complete Renovations", "Get a Quote", "Contact Us"],
    wordCount: typeof crawl.wordCount === 'number' ? crawl.wordCount : (typeof crawl.word_count === 'number' ? crawl.word_count : 480),
    plainText: crawl.plainText || ((pageTitle || "Page Title") + " services. We provide high quality upgrades."),
    internalLinkCount: typeof crawl.internalLinkCount === 'number' ? crawl.internalLinkCount : 1,
    incomingAnchors: crawl.incomingAnchors || [],
    imageCount: typeof crawl.imageCount === 'number' ? crawl.imageCount : 1,
    images: crawl.images || [{ url: "/wp-content/uploads/dummy.webp", alt: "Bathroom Image" }],
    imagesMissingAltText: typeof crawl.imagesMissingAltText === 'number' ? crawl.imagesMissingAltText : 1
  };

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
  const getContextualLinksCount = (incomingAnchors) => {
    if (!incomingAnchors) return 0;
    const mergedMap = {};
    incomingAnchors.forEach(item => {
      const rawAnchor = (item.anchor || "").trim();
      if (!rawAnchor) return;
      const key = rawAnchor.toLowerCase();
      const count = parseInt(item.count, 10) || 0;
      if (mergedMap[key]) {
        mergedMap[key] += count;
      } else {
        mergedMap[key] = count;
      }
    });
    let contextualCount = 0;
    Object.entries(mergedMap).forEach(([normKey, count]) => {
      for (let c = 0; c < count; c++) {
        let linkType = "Contextual";
        if (normKey === "home" || normKey === "homepage" || normKey === "navigation") {
          linkType = "Navigation";
        } else if (normKey === "contact" || normKey === "about" || normKey === "gallery") {
          linkType = "Navigation";
        } else if (c % 5 === 1) {
          linkType = "Footer";
        } else if (c % 5 === 2) {
          linkType = "Sidebar";
        } else if (c % 5 === 3) {
          linkType = "Breadcrumb";
        } else if (c % 5 === 4) {
          linkType = "Related Content";
        }
        if (linkType === "Contextual") {
          contextualCount++;
        }
      }
    });
    return contextualCount;
  };

  const contextualLinkCount = getContextualLinksCount(data.incomingAnchors);

  const linkMatch = tp ? data.incomingAnchors.some(anchorObj => anchorObj.anchor.toLowerCase().includes(tp)) : false;
  const linkStatus = contextualLinkCount >= 3 ? "Pass" : "Fail";
  const linkAction = linkStatus === "Fail" ? `Current Internal Links: ${contextualLinkCount}\nMinimum Required to Pass Audit: 3` : "";
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
      current: `${contextualLinkCount} incoming internal links`,
      present: linkMatch ? "Yes" : "No",
      status: linkStatus,
      action: linkAction,
      recommendation: linkRecommendation,
      incomingAnchors: data.incomingAnchors
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

const FINDINGS_MAP = {
  "Missing/Optimizable Title Tag": {
    taskSource: "Page Auditor",
    issueType: "Missing/Optimizable Title Tag",
    verificationMethod: "Page Auditor checks title tag for target phrase",
    whyItMatters: "The title tag is the most critical on-page SEO element. Including the target phrase near the beginning is a primary ranking signal.",
    currentVersion: "Bathroom Installation South East London | Professional Bathroom Fitters",
    requiredVersion: "Title tag containing the target phrase.",
    taskTitle: "Add Target Phrase to Title Tag"
  },
  "Missing/Optimizable Meta Description": {
    taskSource: "Page Auditor",
    issueType: "Missing/Optimizable Meta Description",
    verificationMethod: "Page Auditor checks description for target phrase",
    whyItMatters: "Meta descriptions define search engine snippets. Lacking the target phrase reduces relevance matching in search results.",
    currentVersion: "Expert services across South East London...",
    requiredVersion: "Meta description containing target phrase.",
    taskTitle: "Add Target Phrase to Meta Description"
  },
  "Missing/Optimizable H1": {
    taskSource: "Page Auditor",
    issueType: "Missing/Optimizable H1",
    verificationMethod: "Page Auditor checks H1 for target phrase",
    whyItMatters: "The H1 header represents the page's main topic. Missing the target phrase weakens topical relevance signals.",
    currentVersion: "Professional Bathroom Installation",
    requiredVersion: "H1 heading containing target phrase.",
    taskTitle: "Add Target Phrase to H1 Heading"
  },
  "Missing/Optimizable H2 Count": {
    taskSource: "Page Auditor",
    issueType: "Missing/Optimizable H2 Count",
    verificationMethod: "Page Auditor checks H2 headings for target phrase",
    whyItMatters: "Subheadings organize content structure. Having the target phrase in at least one H2 reinforces keyword relevance.",
    currentVersion: "H2 headings present but missing target phrase.",
    requiredVersion: "At least one H2 heading containing target phrase.",
    taskTitle: "Add Target Phrase to H2 Headings"
  },
  "Missing/Optimizable Word Count": {
    taskSource: "Page Auditor",
    issueType: "Missing/Optimizable Word Count",
    verificationMethod: "Page Auditor checks word count and content keywords",
    whyItMatters: "Search engines favor comprehensive content. Short pages (under 500 words) or those lacking keyword mentions struggle to rank.",
    currentVersion: "Thin text content or missing target phrase.",
    requiredVersion: "Comprehensive text content over 500 words containing target phrase.",
    taskTitle: "Add Target Phrase to Body Content"
  },
  "Missing/Optimizable Internal Link Count": {
    taskSource: "Page Auditor",
    issueType: "Missing/Optimizable Internal Link Count",
    verificationMethod: "Page Auditor checks incoming internal link anchor texts",
    whyItMatters: "Internal links pass authority and semantic signals. Linking with the target phrase as anchor text establishes keyword topical authority.",
    currentVersion: "Insufficient incoming links or unoptimized anchor texts.",
    requiredVersion: "At least 3 incoming internal links optimized with the target phrase.",
    taskTitle: "Optimize Inbound Internal Link Anchors"
  },
  "Missing/Optimizable Image Count": {
    taskSource: "Page Auditor",
    issueType: "Missing/Optimizable Image Count",
    verificationMethod: "Page Auditor checks image filenames and alt tags",
    whyItMatters: "Images improve engagement. Filenames and alt tags containing the target phrase rank in Image Search and boost page relevance.",
    currentVersion: "Images present but missing target phrase in filenames/alt text.",
    requiredVersion: "Images optimized with target phrase in alt text or filename.",
    taskTitle: "Optimize Image Alt Text and Filename"
  },
  "Missing/Optimizable Images Missing Alt Text": {
    taskSource: "Page Auditor",
    issueType: "Missing/Optimizable Images Missing Alt Text",
    verificationMethod: "Page Auditor checks for empty or missing alt tags",
    whyItMatters: "Alt tags provide accessibility for screen readers and search crawlers. Every image should have descriptive alt text.",
    currentVersion: "Images found without alt tags.",
    requiredVersion: "All images must have alt tags.",
    taskTitle: "Add Alt Tags to Images"
  }
};

const generateFindingsForPage = (page, siteUrl, siteId) => {
  const relUrl = page.pageUrl;
  const target = page.targetPhrase || "";
  const title = page.pageTitle || "";

  if (!target || page.status !== "Configured" || isPageExcluded(page)) return []; // Only configured non-excluded pages are audited

  const auditResults = runPageAudit(relUrl, target, title, siteId, page);
  const findings = [];

  auditResults.forEach(res => {
    if (res.status === "Fail") {
      let priority = "Medium";
      if (res.item === "Title Tag" || res.item === "H1" || res.item === "Images Missing Alt Text") {
        priority = "High";
      } else if (res.item === "Meta Description" || res.item === "Internal Link Count") {
        priority = "Medium";
      } else {
        priority = "Low";
      }

      findings.push({
        findingId: `f-${siteId}-${encodeURIComponent(relUrl)}-${res.item.toLowerCase().replace(/[^a-z0-9]+/g, "")}`,
        pageUrl: relUrl,
        pageTitle: title,
        targetPhrase: target,
        findingType: `Missing/Optimizable ${res.item}`,
        findingDescription: res.action,
        priority: priority
      });
    }
  });

  return findings;
};

const evaluateRulesForPage = (page, siteUrl, siteId) => {
  const relUrl = page.pageUrl;
  const target = page.targetPhrase || "";
  const title = page.pageTitle || "";

  const results = [];
  if (!target || page.status !== "Configured" || isPageExcluded(page)) {
    const checks = [
      "Title Tag", "Meta Description", "H1", "H2 Count", 
      "Word Count", "Internal Link Count", "Image Count", "Images Missing Alt Text"
    ];
    return checks.map(c => ({
      ruleName: c,
      description: `Verify ${c}`,
      passed: "Skipped",
      statusText: `${c} Skipped`,
      details: "Skipped: Target phrase is unconfigured."
    }));
  }

  const auditResults = runPageAudit(relUrl, target, title, siteId, page);
  return auditResults.map(res => ({
    ruleName: res.item,
    description: `Evaluate ${res.item}`,
    passed: res.status === "Pass" ? "Passed" : "Failed",
    statusText: res.status === "Pass" 
      ? (res.recommendation ? `${res.item} Passed with Recommendations` : `${res.item} Check OK`)
      : `${res.item} Check Failed`,
    details: res.status === "Pass" 
      ? (res.recommendation ? `Recommendation: ${res.recommendation}` : `Passed: ${res.current} meets all requirements.`)
      : `Failed: ${res.action}`
  }));
};

const getFindingsAndTasksForSite = (siteId, pages, siteUrl, siteName) => {
  const generatedFindings = [];
  const generatedTasks = [];
  pages.forEach(page => {
    if (page.status === "Configured") {
      const pageFindings = generateFindingsForPage(page, siteUrl, siteId);
      pageFindings.forEach((finding, idx) => {
        generatedFindings.push(finding);
        const mapTemplate = {
          taskSource: "Page Auditor",
          issueType: "Content Audit",
          verificationMethod: "Page Auditor verifies page structure",
          whyItMatters: "General on-page SEO improvement.",
          currentVersion: "Standard",
          requiredVersion: "Optimized",
          taskTitle: finding.findingType
        };
        const nextTaskId = `t-${siteId}-${idx + 1}`;
        
        let keywordVal = finding.targetPhrase || "None";
        let currentVal = mapTemplate.currentVersion;
        let requiredVal = mapTemplate.requiredVersion;
        let whyItMattersVal = mapTemplate.whyItMatters;
        
        if (finding.findingType === "Missing H1 Phrase") {
          currentVal = "Professional Services";
          requiredVal = `${finding.targetPhrase} in London`;
        }
        
        generatedTasks.push({
          taskId: nextTaskId,
          id: nextTaskId,
          wpPostId: page.wpPostId,
          website: siteName,
          pageUrl: siteUrl + finding.pageUrl,
          pageTitle: finding.pageTitle,
          targetPhrase: keywordVal,
          keyword: keywordVal,
          taskSource: mapTemplate.taskSource,
          source: mapTemplate.taskSource,
          issueType: mapTemplate.issueType,
          issueDescription: finding.findingDescription,
          issueFound: finding.findingDescription,
          priority: finding.priority,
          status: "Open",
          state: "backlog",
          assignedTo: null,
          assignee: null,
          verificationMethod: mapTemplate.verificationMethod,
          successCheck: "Page Auditor will verify automatically.",
          createdDate: new Date().toISOString().split('T')[0],
          completedDate: null,
          taskTitle: mapTemplate.taskTitle,
          currentVersion: currentVal,
          requiredVersion: requiredVal,
          whyItMatters: whyItMattersVal
        });
      });
    }
  });

  return { findings: generatedFindings, tasks: generatedTasks };
};

const getPageType = (page) => {
  if (!page) return "Excluded";
  const type = page.assignedType || "Excluded";
  const lower = type.toLowerCase();
  if (lower === "hub" || lower === "hub page") return "Hub Page";
  if (lower === "landing" || lower === "landing page" || lower === "primary landing page") return "Landing Page";
  if (lower === "supporting" || lower === "supporting page") return "Supporting Page";
  if (lower === "topical" || lower === "topical page") return "Topical Page";
  return type;
};

const paramsTemp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const viewParamTemp = paramsTemp ? paramsTemp.get('view') : null;
const isAutomationViewTemp = ['results', 'detail', 'edit', 'tasklist'].includes(viewParamTemp);
const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function fetchThroughProxy(url, options = {}) {
  if (url.startsWith("/") || url.includes(window.location.host) || url.startsWith("http://localhost:3001") || url.startsWith("/api") || url.startsWith(API_BASE)) {
    return fetch(url, options);
  }

  const proxyUrl = `${API_BASE}/platform-proxy`;
  return fetch(proxyUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url: url,
      method: options.method || "GET",
      headers: options.headers || {},
      data: options.body || null
    })
  });
}

// Excluded CTA anchors for the internal link engine
const EXCLUDED_CTA_ANCHORS = [
  "learn more",
  "read more",
  "find out more",
  "view more",
  "see more",
  "discover more",
  "click here"
];

const rebuildInternalLinksData = async (finalPages, site, cleanUrl, siteId) => {
  // 1. Initialize link fields to 0/empty for all pages
  const updatedPages = finalPages.map(p => {
    const crawl = p.crawlData ? { ...p.crawlData } : {};
    crawl.internalLinkCount = 0;
    crawl.incomingAnchors = [];
    return {
      ...p,
      crawlData: crawl
    };
  });

  // 2. Fetch HTML for pages that don't have a stored snapshot
  const htmlResults = await Promise.all(
    updatedPages.map(async (p) => {
      if (p.crawlData?.htmlSnapshot) {
        return { pageUrl: p.pageUrl, html: p.crawlData.htmlSnapshot };
      }
      
      const absoluteUrl = site.url.trim().replace(/\/+$/, "") + p.pageUrl;
      try {
        const res = await fetchThroughProxy(absoluteUrl);
        if (res.ok) {
          const html = await res.text();
          return { pageUrl: p.pageUrl, html };
        }
      } catch (e) {
        console.error(`Failed to fetch HTML for ${absoluteUrl}:`, e);
      }
      return { pageUrl: p.pageUrl, html: "" };
    })
  );

  // Create a map of pageUrl -> html
  const htmlMap = {};
  htmlResults.forEach(r => {
    htmlMap[r.pageUrl] = r.html;
  });

  // 3. Parse rendered HTML using DOMParser to rebuild the incoming internal links dataset
  updatedPages.forEach(srcPage => {
    const html = htmlMap[srcPage.pageUrl] || "";
    if (!html) return;

    // Save the html snapshot to crawlData so we have it stored
    srcPage.crawlData.htmlSnapshot = html;

    // Parse HTML using DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    // Extract plainText and update it
    try {
      const scripts = doc.querySelectorAll("script, style");
      scripts.forEach(s => s.remove());
      const text = (doc.body ? doc.body.textContent : doc.textContent).replace(/\s+/g, ' ').trim();
      srcPage.crawlData.plainText = text;
    } catch (e) {
      console.error("Failed to extract plainText during rebuild:", e);
    }

    if (srcPage.assignedType === "Excluded") return;

    const getPrimaryContentContainer = (d) => {
      const selectors = [
        '.entry-content',
        '.post-content',
        '.elementor-widget-theme-post-content',
        'article',
        'main',
        'body > div.elementor'
      ];
      for (let i = 0; i < selectors.length; i++) {
        const elms = d.querySelectorAll(selectors[i]);
        if (elms.length > 0) {
          if (elms.length === 1) return elms[0];
          let bestCandidate = elms[0];
          let bestScore = -1;
          elms.forEach(el => {
            const textLength = el.textContent ? el.textContent.trim().length : 0;
            const pCount = el.querySelectorAll('p').length;
            const score = textLength + pCount * 100;
            if (score > bestScore) {
              bestScore = score;
              bestCandidate = el;
            }
          });
          return bestCandidate;
        }
      }
      return null;
    };

    const container = getPrimaryContentContainer(doc);
    if (!container) return;

    const anchors = container.querySelectorAll("a");

    anchors.forEach(a => {
      const href = a.getAttribute("href");
      if (!href) return;

      const relativeHref = getRelativeUrl(href, cleanUrl);
      const anchorText = a.textContent.replace(/<[^>]*>/g, "").trim();
      
      if (!anchorText) return;

      const normAnchor = anchorText.toLowerCase().trim();
      if (EXCLUDED_CTA_ANCHORS.includes(normAnchor)) return;

      // Find matching destination page
      const destPage = updatedPages.find(p => getRelativeUrl(p.pageUrl, cleanUrl) === getRelativeUrl(relativeHref, cleanUrl));
      if (destPage) {
        if (destPage.assignedType === "Excluded") return;
        const normAnchor = anchorText.toLowerCase();
        const existingAnchor = destPage.crawlData.incomingAnchors.find(a => 
          (a.anchorText || a.anchor || "").toLowerCase().trim() === normAnchor &&
          a.sourcePageUrl === srcPage.pageUrl
        );
        if (!existingAnchor) {
          destPage.crawlData.incomingAnchors.push({ anchor: anchorText, count: 1, sourcePageUrl: srcPage.pageUrl });
          destPage.crawlData.internalLinkCount = (destPage.crawlData.internalLinkCount || 0) + 1;
        }
      }
    });
  });

  // 4. Re-run all Page Audits using the updated data
  return updatedPages.map(page => {
    const newAuditResults = runPageAudit(
      page.pageUrl,
      page.targetPhrase,
      page.pageTitle,
      siteId,
      page
    );
    return {
      ...page,
      latestAudit: {
        timestamp: new Date().toISOString(),
        results: newAuditResults
      }
    };
  });
};

const BU_PAGES = exporterData["bathroom-upgrades"].pages.map(p => {
  let mapped = { ...p, assignedType: p.assignedType || getPageAuditorAssignedType(p) };
  if (isAutomationViewTemp) {
    if (p.pageUrl === "/") {
      mapped = { ...mapped, targetPhrase: "bathroom upgrades", status: "Configured" };
    } else if (p.pageUrl === "/bathroom-renovations/") {
      mapped = { ...mapped, targetPhrase: "bathroom renovations", status: "Configured" };
    } else if (p.pageUrl === "/bathroom-installation/") {
      mapped = { ...mapped, targetPhrase: "bathroom installation", status: "Configured" };
    }
  }
  const lower = (mapped.assignedType || "").toLowerCase();
  const calculatedPriority = lower.includes("hub") ? 1
                           : lower.includes("landing") ? 2
                           : lower.includes("supporting") ? 3
                           : lower.includes("topical") ? 4
                           : 3;
  mapped = { ...mapped, priority: calculatedPriority };
  return mapped;
});

const BU_URL = exporterData["bathroom-upgrades"].site_url;
const BU_NAME = exporterData["bathroom-upgrades"].site_name;

const initialBUData = isAutomationViewTemp 
  ? getFindingsAndTasksForSite("bathroom-upgrades", BU_PAGES, BU_URL, BU_NAME)
  : { findings: [], tasks: [] };

const INITIAL_SITES = [
  {
    id: "bathroom-upgrades",
    name: "Bathroom Upgrades",
    url: BU_URL,
    status: "Setup Required",
    lastAudit: isAutomationViewTemp ? "16 May 2026" : null,
    tasks: initialBUData.tasks,
    elementorEnabled: true
  },
  {
    id: "the-search-equation",
    name: "The Search Equation",
    url: exporterData["the-search-equation"].site_url,
    status: "Setup Required",
    lastAudit: null,
    tasks: []
  }
];

const INITIAL_PAGES_DATA = {
  "bathroom-upgrades": BU_PAGES,
  "the-search-equation": exporterData["the-search-equation"].pages.map(p => ({
    ...p,
    assignedType: getPageAuditorAssignedType(p)
  }))
};

// Workflow indicator stepper
const WorkflowStepper = ({ currentView }) => {
  const steps = [
    { label: "Connected Website", views: ["CONNECTED_SITES"] },
    { label: "Website Management", views: ["WEBSITES_CONFIG", "WEBSITES_PAGE_MGMT", "WEBSITES_INTERNAL_LINKING", "WEBSITES_SITE_ANALYSIS", "WEBSITES_COMING_SOON", "AUDIT_CONFIG"] },
    { label: "Audit", views: ["AUDIT_RUNNING", "AUDIT_RESULTS"] },
    { label: "Work Actions", views: ["TASK_FOCUS", "EDIT"] }
  ];

  // Find active step index based on currentView
  const activeIndex = steps.findIndex(step => step.views.includes(currentView));
  
  return (
    <div className="workflow-stepper" style={{ maxWidth: '900px' }}>
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isCompleted = index < activeIndex;
        return (
          <React.Fragment key={index}>
            <div className={`stepper-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
              <div className="stepper-bubble">
                {isCompleted ? "✓" : index + 1}
              </div>
              <span className="stepper-label">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`stepper-connector ${index < activeIndex ? 'completed' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};




const isPageExcluded = (page) => {
  if (!page) return false;
  return page.assignedType === "Excluded";
};



const getRelativeUrl = (url, siteUrl) => {
  let rel = "/";
  if (!url) {
    rel = "/";
  } else if (url.startsWith("/")) {
    rel = url;
  } else {
    try {
      const parsed = new URL(url);
      rel = parsed.pathname;
    } catch (e) {
      if (siteUrl) {
        let cleanSite = siteUrl.trim().replace(/\/+$/, "");
        rel = url.replace(cleanSite, "");
        if (!rel.startsWith("/")) rel = "/" + rel;
      } else {
        rel = url;
      }
    }
  }
  if (rel) {
    rel = rel.trim();
    const hasExtension = /\.[a-z0-9]+$/i.test(rel);
    if (!hasExtension) {
      rel = rel.replace(/\/+$/, "");
      if (rel === "") {
        rel = "/";
      } else {
        if (!rel.startsWith("/")) rel = "/" + rel;
        rel = rel + "/";
      }
    } else {
      if (!rel.startsWith("/")) rel = "/" + rel;
    }
  } else {
    rel = "/";
  }
  if (rel === "//" || rel === "" || rel === "///") {
    rel = "/";
  } else if (rel.startsWith("//")) {
    rel = rel.replace(/^\/+/, "/");
  }
  return rel;
};

const renderHighlightedContext = (contextText, anchorText) => {
  if (!contextText || !anchorText) return contextText;
  
  const lowerContext = contextText.toLowerCase();
  const lowerAnchor = anchorText.toLowerCase().trim();
  
  if (!lowerAnchor) return contextText;
  
  const idx = lowerContext.indexOf(lowerAnchor);
  if (idx === -1) {
    return contextText;
  }
  
  const before = contextText.slice(0, idx);
  const matched = contextText.slice(idx, idx + anchorText.length);
  const after = contextText.slice(idx + anchorText.length);
  
  return (
    <>
      {before}
      <span style={{ color: '#facc15', fontWeight: 'bold' }}>{matched}</span>
      {after}
    </>
  );
};

const makeHtmlSentence = (sentence, anchorText, absoluteDestUrl) => {
  if (!sentence || !anchorText) return sentence;
  const escapedAnchor = anchorText.replace(/[-\/\\^$\*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escapedAnchor})`, 'i');
  if (regex.test(sentence)) {
    return sentence.replace(regex, `<a href="${absoluteDestUrl}">$1</a>`);
  } else {
    return sentence + ` <a href="${absoluteDestUrl}">${anchorText}</a>`;
  }
};

const copySentenceHtml = (sentence, successCallback) => {
  const plainText = sentence.replace(/<[^>]*>/g, "");
  if (navigator.clipboard && window.ClipboardItem) {
    const htmlBlob = new Blob([sentence], { type: 'text/html' });
    const textBlob = new Blob([plainText], { type: 'text/plain' });
    const item = new ClipboardItem({
      'text/html': htmlBlob,
      'text/plain': textBlob
    });
    navigator.clipboard.write([item])
      .then(() => {
        if (successCallback) successCallback();
      })
      .catch(err => {
        console.error("Rich clipboard copy failed, falling back:", err);
        navigator.clipboard.writeText(plainText)
          .then(() => {
            if (successCallback) successCallback();
          });
      });
  } else {
    navigator.clipboard.writeText(plainText)
      .then(() => {
        if (successCallback) successCallback();
      });
  }
};

const getComparisonContent = (task, pageObj) => {
  const issue = task.taskTitle || "";
  const targetPhrase = task.targetPhrase || pageObj?.targetPhrase || "keyword";
  const capitalizedTarget = targetPhrase.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // Try to find direct audited value from latest audit results if available
  let auditedCurrent = "";
  if (pageObj?.latestAudit?.results) {
    let auditItemName = "";
    if (issue.toLowerCase().includes("title tag") || issue.toLowerCase().includes("meta title")) {
      auditItemName = "Title Tag";
    } else if (issue.toLowerCase().includes("meta description")) {
      auditItemName = "Meta Description";
    } else if (issue.toLowerCase().includes("h1")) {
      auditItemName = "H1";
    } else if (issue.toLowerCase().includes("h2 count")) {
      auditItemName = "H2 Count";
    } else if (issue.toLowerCase().includes("word count")) {
      auditItemName = "Word Count";
    } else if (issue.toLowerCase().includes("internal link count")) {
      auditItemName = "Internal Link Count";
    } else if (issue.toLowerCase().includes("image count")) {
      auditItemName = "Image Count";
    } else if (issue.toLowerCase().includes("images missing alt text")) {
      auditItemName = "Images Missing Alt Text";
    }

    if (auditItemName) {
      const match = pageObj.latestAudit.results.find(r => r.item === auditItemName);
      if (match) {
        auditedCurrent = match.current;
      }
    }
  }

  if (issue.toLowerCase().includes("title tag") || issue.toLowerCase().includes("meta title")) {
    const current = auditedCurrent || pageObj?.pageTitle || pageObj?.crawlData?.title || "";
    
    let required = current;
    const titleMatch = current.toLowerCase().includes(targetPhrase.toLowerCase());
    const titleLengthOk = current.length >= 30 && current.length <= 65;
    
    if (!current || !titleMatch || !titleLengthOk) {
      if (current) {
        if (!titleMatch) {
          let baseTitle = current.includes("|") ? current.split("|").slice(1).join("|").trim() : current;
          if (!baseTitle) baseTitle = current;
          required = `${capitalizedTarget} | ${baseTitle}`;
        } else {
          if (current.length > 65) {
            let baseTitle = current.split("|")[0].trim();
            if (baseTitle.length > 65) {
              baseTitle = baseTitle.slice(0, 62) + "...";
            }
            required = baseTitle;
          } else {
            required = `${current} | Professional Services`;
          }
        }
      } else {
        required = `${capitalizedTarget} | Professional Services`;
      }
      
      if (required.length > 65) {
        required = required.slice(0, 65);
      }
      if (required.length < 30) {
        required = `${required} | South East London`;
        if (required.length > 65) {
          required = required.slice(0, 65);
        }
      }
    }
    
    return { current: current || "No title tag found.", required };
  }
  
  if (issue.toLowerCase().includes("meta description")) {
    const current = auditedCurrent || pageObj?.crawlData?.metaDescription || pageObj?.crawlData?.description || "";
    const required = `Looking for professional ${targetPhrase} in South East London? We provide high-quality, reliable solutions tailored to your needs. Get your free quote today!`;
    return { current: current || "No meta description found.", required };
  }
  
  if (issue.toLowerCase().includes("h1")) {
    const current = pageObj?.crawlData?.h1 || "";
    const required = capitalizedTarget;
    return { current: current || "No H1 heading found.", required };
  }
  
  if (issue.toLowerCase().includes("h2 count")) {
    const h2List = pageObj?.crawlData?.h2List || [];
    const current = h2List.length > 0 
      ? h2List.map(h => `- ${h}`).join("\n") 
      : "No H2 headings found on this page.";
    const required = h2List.length > 0
      ? `${h2List.map((h, idx) => idx === 0 ? `- ${capitalizedTarget} & ${h}` : `- ${h}`).join("\n")}`
      : `- Professional ${capitalizedTarget}\n- Our Services\n- Why Choose Us`;
    return { current, required };
  }
  
  if (issue.toLowerCase().includes("word count")) {
    const wordCount = pageObj?.crawlData?.wordCount || 0;
    const current = `Word count: ${wordCount} words.\n\nContent:\n${pageObj?.crawlData?.plainText || ""}`;
    const required = `Word count: 500+ words.\n\nRecommended additions:\nAdd a detailed section about ${targetPhrase} services, including benefits, pricing factors, and service process to increase content depth and naturally integrate the target phrase "${targetPhrase}".`;
    return { current: current || "No content found.", required };
  }
  
  if (issue.toLowerCase().includes("internal link count")) {
    const current = `Current internal link count: ${pageObj?.crawlData?.internalLinkCount || 0}`;
    const required = `At least 3 incoming internal links optimized with the target phrase "${targetPhrase}" as the anchor text.`;
    return { current, required };
  }
  
  if (issue.toLowerCase().includes("image count")) {
    const current = `Current image count: ${pageObj?.crawlData?.imageCount || 0}`;
    const required = `Optimize image filenames (e.g. ${targetPhrase.toLowerCase().replace(/\s+/g, "-")}.jpg) and add target phrase "${targetPhrase}" into image alt text attributes.`;
    return { current, required };
  }
  
  if (issue.toLowerCase().includes("images missing alt text")) {
    const current = `Images missing alt text count: ${pageObj?.crawlData?.imagesMissingAltText || 0}`;
    const required = `Provide descriptive alt text for all images on the page to improve accessibility and image SEO.`;
    return { current, required };
  }

  return {
    current: task.currentVersion || "",
    required: task.requiredVersion || ""
  };
};

const matchFindingType = (fType, tTitle) => {
  if (!fType || !tTitle) return false;
  const f = fType.toLowerCase().replace("title tag", "meta title");
  const t = tTitle.toLowerCase().replace("title tag", "meta title");
  return f === t;
};

export default function App() {
  console.log("[TSE BUILD TEST 2026-07-02 11:02]");
  const [sites, setSites] = useState(() => {
    if (isAutomationViewTemp) {
      return INITIAL_SITES;
    }
    const saved = typeof window !== 'undefined' ? localStorage.getItem("tse_sites_data") : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(s => {
            if (!s.credentials?.username || !s.credentials?.password) {
              return { ...s, status: "Setup Required" };
            }
            return s;
          });
        }
      } catch (e) {
        console.error("Failed to parse saved sites data:", e);
      }
    }
    return INITIAL_SITES;
  });

  const [pagesData, setPagesData] = useState(() => {
    if (isAutomationViewTemp) {
      return INITIAL_PAGES_DATA;
    }
    const saved = typeof window !== 'undefined' ? localStorage.getItem("tse_pages_data") : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved pages data:", e);
      }
    }
    return INITIAL_PAGES_DATA;
  });

  const [globalExternalLinks, setGlobalExternalLinks] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem("tse_global_external_links") : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved global external links:", e);
      }
    }
    return [
      { id: "gen-1", linkName: "Crunchbase", sourceUrl: "https://www.crunchbase.com/" },
      { id: "gen-2", linkName: "OpenStreetMap", sourceUrl: "https://www.openstreetmap.org/" }
    ];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("tse_global_external_links", JSON.stringify(globalExternalLinks));
    }
  }, [globalExternalLinks]);

  const [newGlobalLinkName, setNewGlobalLinkName] = useState("");
  const [newGlobalSourceUrl, setNewGlobalSourceUrl] = useState("");
  const [globalLinkSearch, setGlobalLinkSearch] = useState("");

  const handleCSVImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/);
      const newLinks = [];
      let headerPassed = false;
      let nameIndex = 0;
      let urlIndex = 1;

      lines.forEach((line) => {
        if (!line.trim()) return;
        
        // Simple comma split that handles double quotes
        const parts = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parts.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        parts.push(current.trim());

        if (parts.length < 2) return;

        if (!headerPassed) {
          const first = parts[0].toLowerCase();
          const second = parts[1].toLowerCase();
          if (first.includes("name") || first.includes("title") || second.includes("url") || second.includes("link") || second.includes("href")) {
            if (first.includes("url") || first.includes("link") || first.includes("href")) {
              nameIndex = 1;
              urlIndex = 0;
            } else {
              nameIndex = 0;
              urlIndex = 1;
            }
            headerPassed = true;
            return;
          }
          headerPassed = true;
        }

        const name = parts[nameIndex]?.replace(/^"|"$/g, '').trim();
        const url = parts[urlIndex]?.replace(/^"|"$/g, '').trim();

        if (name && url) {
          newLinks.push({
            id: `global-ext-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            linkName: name,
            sourceUrl: url
          });
        }
      });

      if (newLinks.length > 0) {
        setGlobalExternalLinks(prev => [...prev, ...newLinks]);
        showNotification(`Successfully imported ${newLinks.length} global external links.`);
      } else {
        showNotification("No valid links found in CSV. Expected headers: Link Name, Source URL.");
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  const [isAutomation, setIsAutomation] = useState(isAutomationViewTemp);
  const [isImporting, setIsImporting] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isBackHovered, setIsBackHovered] = useState(false);
  const [isW3BackHovered, setIsW3BackHovered] = useState(false);
  const [isW4BackHovered, setIsW4BackHovered] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [editingSentenceKey, setEditingSentenceKey] = useState(null);
  const [editingSentenceText, setEditingSentenceText] = useState("");
  const [editingAnchorKey, setEditingAnchorKey] = useState(null);
  const [editingAnchorText, setEditingAnchorText] = useState("");
  const [editedAnchors, setEditedAnchors] = useState({});
  const [generatedSentences, setGeneratedSentences] = useState({});
  const [isGenerating, setIsGenerating] = useState({});
  const [inputTargetPhrase, setInputTargetPhrase] = useState("");
  const [inputPageUrl, setInputPageUrl] = useState("");
  const [inputPageTitle, setInputPageTitle] = useState("");
  const [inputProposedPageTitle, setInputProposedPageTitle] = useState("");
  const [inputPageType, setInputPageType] = useState("Supporting Page");
  const [inputParentPage, setInputParentPage] = useState("");
  const [modalMode, setModalMode] = useState("edit"); // edit, add
  const [currentFilter, setCurrentFilter] = useState("all"); // all, configured, unconfigured, planned
  const [comingSoonModule, setComingSoonModule] = useState("");
  const [selectedPageUrl, setSelectedPageUrl] = useState(null);
  const [selectedLinkPageUrl, setSelectedLinkPageUrl] = useState(null);
  const [reviewPageUrl, setReviewPageUrl] = useState("");
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [reviewPageId, setReviewPageId] = useState(null);
  const [singleAuditPageId, setSingleAuditPageId] = useState(null);

  
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const initialPagesDataRef = React.useRef(null);
  const initialSitesRef = React.useRef(null);
  
  // Parse query parameters for screenshot capturing / navigation testing
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const viewParam = params ? params.get('view') : null;
  const instantParam = params ? params.get('instant') === 'true' : false;
  const findingParam = params ? params.get('findingId') : null;
  
   const rawSavedView = typeof window !== 'undefined' ? localStorage.getItem("tse_current_view") : null;
   const savedView = rawSavedView === "WEBSITES" ? "CONNECTED_SITES" : rawSavedView;
   const initialTaskId = (viewParam === 'detail' || viewParam === 'edit') ? INITIAL_SITES[0].tasks[0].id : null;

   let resolvedView = savedView || ((viewParam === 'detail') ? 'TASK_FOCUS' : 
                       (viewParam === 'edit') ? 'EDIT' : 
                       (viewParam === 'tasklist') ? 'CONNECTED_SITES' : 
                       (viewParam === 'config_manage') ? 'WEBSITES_CONFIG' :
                       (viewParam === 'config') ? 'AUDIT_CONFIG' :
                       (viewParam === 'running') ? 'AUDIT_RUNNING' :
                       (viewParam === 'results') ? 'AUDIT_RESULTS' :
                       (viewParam === 'settings' || viewParam === 'architecture') ? 'SETTINGS' :
                       'CONNECTED_SITES');

   // Graceful fallback for invalid W4 states on startup
   if ((resolvedView === "TASK_FOCUS" || resolvedView === "EDIT") && !initialTaskId) {
     resolvedView = "CONNECTED_SITES";
   }

   const initialView = resolvedView;
   const savedSiteId = typeof window !== 'undefined' ? localStorage.getItem("tse_selected_site_id") : null;
   const initialSiteId = savedSiteId || ((viewParam === 'dashboard') ? null : 
                         (viewParam === 'config' || viewParam === 'running' || viewParam === 'results' || viewParam === 'config_manage') ? 'bathroom-upgrades' : 
                         INITIAL_SITES[0].id);
 
   const [currentView, setCurrentView] = useState(initialView);
   const [selectedSiteId, setSelectedSiteId] = useState(initialSiteId);
   
   // Platform App selection (Milestone M005)
   const savedApp = typeof window !== 'undefined' ? localStorage.getItem("tse_active_app") : null;
   const initialApp = savedApp || "DASHBOARD";
   const [activeApp, setActiveApp] = useState(initialApp);

   useEffect(() => {
     if (activeApp) {
       localStorage.setItem("tse_active_app", activeApp);
     }
   }, [activeApp]);

   useEffect(() => {
     if (currentView) {
       localStorage.setItem("tse_current_view", currentView);
     }
   }, [currentView]);

   useEffect(() => {
       if (selectedSiteId) {
         localStorage.setItem("tse_selected_site_id", selectedSiteId);
         const site = sites.find(s => s.id === selectedSiteId);
         if (site) {
           setSitePortfolio(site.portfolio || "Other");
           setSitePlatform(site.platform || "Other");
           setSiteElementorEnabled(!!site.elementorEnabled);
         }
       }
     }, [selectedSiteId, sites]);

    useEffect(() => {
      let faviconUrl = "/favicon.svg";
      
      if (activeApp === "PAGE_AUDITOR") {
        faviconUrl = "/favicon-page-auditor.svg";
      } else if (activeApp === "LEAD_GENERATOR") {
        faviconUrl = "/favicon-lead-finder.svg";
      } else if (activeApp === "WEBSITE_MANAGEMENT") {
        if (currentView === "WEBSITES_INTERNAL_LINKING") {
          faviconUrl = "/favicon-internal-linking.svg";
        } else {
          faviconUrl = "/favicon-website-management.svg";
        }
      }
      
      const link = document.querySelector("link[rel*='icon']");
      if (link) {
        link.href = faviconUrl;
        if (faviconUrl.endsWith('.svg')) {
          link.setAttribute('type', 'image/svg+xml');
        } else {
          link.setAttribute('type', 'image/png');
        }
      }
    }, [activeApp, currentView]);
  const [selectedAnalysisSiteId, setSelectedAnalysisSiteId] = useState(null);
  const [activeModule, setActiveModule] = useState(null);
  const [expandedLinkRows, setExpandedLinkRows] = useState({});
  const [expandedSourceRows, setExpandedSourceRows] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    Homepage: true,
    HubPages: true,
    LandingPages: true,
    SupportingPages: true,
    TopicalPages: true,
    UnassignedPages: true
  });
  const [selectedTaskId, setSelectedTaskId] = useState(initialTaskId);
  
  const [isExternalLinkModalOpen, setIsExternalLinkModalOpen] = useState(false);
  const [editingExternalLinkId, setEditingExternalLinkId] = useState(null);
  const [extLinkName, setExtLinkName] = useState("");
  const [extSourceUrl, setExtSourceUrl] = useState("");
  const [extTargetUrl, setExtTargetUrl] = useState("");
  const [extLinkType, setExtLinkType] = useState("Backlink");
  const [extStatus, setExtStatus] = useState("Pending");
  const [extIndexed, setExtIndexed] = useState("Unknown");
  const [extDateAdded, setExtDateAdded] = useState("");
  const [extLastChecked, setExtLastChecked] = useState("Never");
  const [extNotes, setExtNotes] = useState("");
  const [isCheckingIndexStatus, setIsCheckingIndexStatus] = useState(false);
  const [extSortKey, setExtSortKey] = useState(null);
  const [extSortDir, setExtSortDir] = useState(null);
  const [extLinkTab, setExtLinkTab] = useState('single');
  const [csvPreviewRows, setCsvPreviewRows] = useState([]);
  const [csvSummary, setCsvSummary] = useState(null);
  const [importCompleted, setImportCompleted] = useState(false);
  
  const selectedSiteRaw = sites.find(s => s.id === selectedSiteId) || null;
  const selectedSite = selectedSiteRaw ? {
    ...selectedSiteRaw,
    tasks: selectedSiteRaw.tasks.map(t => {
      const sitePages = pagesData[selectedSiteRaw.id] || [];
      const relUrl = getRelativeUrl(t.pageUrl, selectedSiteRaw.url);
      const isMagento = selectedSiteRaw.platform === "Magento";
      const pageObj = isMagento && t.wpPostId
        ? sitePages.find(p => p.wpPostId === t.wpPostId)
        : sitePages.find(p => p.pageUrl === relUrl);
      let derivedState = t.state || "backlog";
      if (pageObj && pageObj.latestAudit && pageObj.latestAudit.results) {
        const findings = generateFindingsForPage(pageObj, selectedSiteRaw.url, selectedSiteRaw.id);
        const hasIssue = findings.some(f => matchFindingType(f.findingType, t.taskTitle));
        derivedState = hasIssue ? "backlog" : "completed";
      }
      return { ...t, state: derivedState };
    })
  } : null;

  const getEnrichedTask = (task) => {
    if (!task || !selectedSite) return task;
    const sitePages = pagesData[selectedSite.id] || [];
    const relUrl = getRelativeUrl(task.pageUrl, selectedSite.url);
    const isMagento = selectedSite.platform === "Magento";
    const pageObj = isMagento && task.wpPostId
      ? sitePages.find(p => p.wpPostId === task.wpPostId)
      : sitePages.find(p => p.pageUrl === relUrl);
    
    // Derive task state dynamically from audit results
    let derivedState = task.state || "backlog";
    if (pageObj && pageObj.latestAudit && pageObj.latestAudit.results) {
      const findings = generateFindingsForPage(pageObj, selectedSite.url, selectedSite.id);
      const hasIssue = findings.some(f => matchFindingType(f.findingType, task.taskTitle));
      derivedState = hasIssue ? "backlog" : "completed";
    }
    
    const { current, required } = getComparisonContent(task, pageObj);
    console.log("[DIAGNOSTIC] taskTitle:", task.taskTitle, "pageUrl:", task.pageUrl, "relUrl:", relUrl, "pageObj:", !!pageObj, "current:", current, "required:", required, "derivedState:", derivedState);
    return {
      ...task,
      state: derivedState,
      currentVersion: derivedState === "completed" ? (task.currentVersion || current) : current,
      requiredVersion: required
    };
  };

  const rawActiveTask = selectedSite ? selectedSite.tasks.find(t => t.id === selectedTaskId) : null;
  const activeTask = getEnrichedTask(rawActiveTask);
  
  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };
  

  
  // Page Auditor Edit State
  const defaultTask = INITIAL_SITES[0]?.tasks?.[0] || { id: "t-default", currentVersion: "", keyword: "" };
  const [editingContent, setEditingContent] = useState(viewParam === 'edit' ? defaultTask.currentVersion : "");
  const [verificationStatus, setVerificationStatus] = useState("idle"); // idle, loading, success, fail
  const [verificationError, setVerificationError] = useState("");
  const [notification, setNotification] = useState("");
  
  const hasInitializedEditorRef = useRef(false);
  useEffect(() => {
    if (isInitialLoadComplete && viewParam === 'edit' && activeTask && !hasInitializedEditorRef.current) {
      setEditingContent(activeTask.currentVersion);
      hasInitializedEditorRef.current = true;
    }
  }, [isInitialLoadComplete, viewParam, activeTask]);
  
  // Audit run states
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditLogs, setAuditLogs] = useState([]);
  const [singleAuditPageUrl, setSingleAuditPageUrl] = useState(null);
  const [showExcluded, setShowExcluded] = useState(false);
  const [resultsTab, setResultsTab] = useState("findings"); // findings, evaluations

  // Custom workflow states
  const [analysisReturnView, setAnalysisReturnView] = useState(null);
  const [isAddWebsiteModalOpen, setIsAddWebsiteModalOpen] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [newSiteUsername, setNewSiteUsername] = useState("");
  const [newSitePassword, setNewSitePassword] = useState("");
  const [connectionTestStatus, setConnectionTestStatus] = useState("idle"); // "idle", "testing", "success", "failed"
  const [connectionTestMessage, setConnectionTestMessage] = useState("");
  const [w6ConnectionStatus, setW6ConnectionStatus] = useState("idle"); // "idle", "testing", "success", "failed"
  const [w6ConnectionMessage, setW6ConnectionMessage] = useState("");
  const [isEditWebsiteModalOpen, setIsEditWebsiteModalOpen] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState(null);
  const [editSiteName, setEditSiteName] = useState("");
  const [editSiteUrl, setEditSiteUrl] = useState("");
  const [editSitePortfolio, setEditSitePortfolio] = useState("TSE");
  const [editSitePlatform, setEditSitePlatform] = useState("WordPress");
  const [editSiteApiUrl, setEditSiteApiUrl] = useState("");
  const [editSiteUsername, setEditSiteUsername] = useState("");
  const [editSitePassword, setEditSitePassword] = useState("");


  
  // Onboarding site classification (Milestone M004)
  const [newSitePortfolio, setNewSitePortfolio] = useState("TSE");
  const [newSitePlatform, setNewSitePlatform] = useState("WordPress");
  const [newSiteElementorEnabled, setNewSiteElementorEnabled] = useState(false);
  const [editSiteElementorEnabled, setEditSiteElementorEnabled] = useState(false);
  const [siteElementorEnabled, setSiteElementorEnabled] = useState(false);
  
  // Platform App selection (Milestone M005 - Moved to top-level state)

  // Portfolio and Platform states (Milestone M003)
  const [sitePortfolio, setSitePortfolio] = useState("Other");
  const [sitePlatform, setSitePlatform] = useState("Other");
  const [portfolioFilter, setPortfolioFilter] = useState("All");
  const [platformFilter, setPlatformFilter] = useState("All");

  const handleAuditSinglePage = (pageUrl, wpPostId) => {
    setSingleAuditPageUrl(pageUrl);
    setSingleAuditPageId(wpPostId || null);
    setCurrentView("AUDIT_RUNNING");
  };

  const handleTestConnection = async () => {
    let cleanUrl = newSiteUrl.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "https://" + cleanUrl;
    }
    cleanUrl = cleanUrl.replace(/\/+$/, "");

    setConnectionTestStatus("testing");
    setConnectionTestMessage("");

    const provider = ConnectionManager.getProvider(newSitePlatform);
    const credentials = {
      username: newSiteUsername.trim(),
      password: newSitePassword.trim()
    };

    const result = await provider.testCredentials(cleanUrl, credentials);
    if (result.success) {
      setConnectionTestStatus("success");
      setConnectionTestMessage("✅ Connection Successful");
    } else {
      setConnectionTestStatus("failed");
      setConnectionTestMessage(`❌ Connection Failed: ${result.message}`);
    }
  };

  const handleW6TestConnection = async (site) => {
    if (!site) return;
    
    let cleanUrl = site.url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "https://" + cleanUrl;
    }
    cleanUrl = cleanUrl.replace(/\/+$/, "");
    
    const platform = site.platform || "WordPress";

    if (platform !== "Magento" && (!site.credentials?.username || !site.credentials?.password)) {
      setW6ConnectionStatus("failed");
      setW6ConnectionMessage("❌ Connection Failed: API Credentials are not configured for this website.");
      showNotification("Connection Failed: Credentials not configured.");
      return;
    }
    if (platform === "Magento" && !site.credentials?.password) {
      setW6ConnectionStatus("failed");
      setW6ConnectionMessage("❌ Connection Failed: Access Token is not configured for this website.");
      showNotification("Connection Failed: Token not configured.");
      return;
    }

    setW6ConnectionStatus("testing");
    setW6ConnectionMessage(platform === "Magento" ? "Testing Magento API connection..." : "Testing WordPress API connection...");

    const provider = ConnectionManager.getProvider(platform);
    const credentials = {
      username: (site.credentials?.username || "").trim(),
      password: (site.credentials?.password || "").trim()
    };

    const result = await provider.testCredentials(cleanUrl, credentials);
    if (result.success) {
      setW6ConnectionStatus("success");
      setW6ConnectionMessage("✅ Connection Successful");
      showNotification(platform === "Magento" ? "Magento connection verified successfully!" : "WordPress connection verified successfully!");
      setSites(prev => prev.map(s => s.id === site.id ? { ...s, status: "Connected" } : s));
    } else {
      setW6ConnectionStatus("failed");
      setW6ConnectionMessage(`❌ Connection Failed: ${result.message}`);
      showNotification("Connection Failed: Credentials or network issue.");
      setSites(prev => prev.map(s => s.id === site.id ? { ...s, status: "Disconnected" } : s));
    }
  };

  const handleOpenEditWebsiteModal = (site) => {
    setEditingSiteId(site.id);
    setEditSiteName(site.name || "");
    setEditSiteUrl(site.url || "");
    setEditSitePortfolio(site.portfolio || "TSE");
    setEditSitePlatform(site.platform || "WordPress");
    const defaultApiUrl = (site.platform === "Magento") 
      ? `${site.url}/rest/` 
      : `${site.url}/wp-json/`;
    setEditSiteApiUrl(site.apiUrl || defaultApiUrl);
    setEditSiteUsername(site.credentials?.username || "");
    setEditSitePassword(site.credentials?.password || "");
    setEditSiteElementorEnabled(!!site.elementorEnabled);
    setIsEditWebsiteModalOpen(true);
  };

  const handleSaveEditWebsite = () => {
    if (!editingSiteId) return;
    
    let cleanUrl = editSiteUrl.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "https://" + cleanUrl;
    }
    cleanUrl = cleanUrl.replace(/\/+$/, "");

    let cleanApiUrl = editSiteApiUrl.trim();
    if (cleanApiUrl) {
      if (!/^https?:\/\//i.test(cleanApiUrl)) {
        cleanApiUrl = "https://" + cleanApiUrl;
      }
      cleanApiUrl = cleanApiUrl.replace(/\/+$/, "");
    } else {
      cleanApiUrl = editSitePlatform === "Magento" ? `${cleanUrl}/rest` : `${cleanUrl}/wp-json`;
    }

    setSites(prev => prev.map(s => {
      if (s.id === editingSiteId) {
        const hasCredentials = editSitePlatform === "Magento"
          ? !!editSitePassword.trim()
          : !!(editSiteUsername.trim() && editSitePassword.trim());
        return {
          ...s,
          name: editSiteName.trim(),
          url: cleanUrl,
          apiUrl: cleanApiUrl,
          portfolio: editSitePortfolio,
          platform: editSitePlatform,
          elementorEnabled: editSitePlatform === "WordPress" ? editSiteElementorEnabled : false,
          status: hasCredentials ? "Connected" : "Setup Required",
          credentials: {
            username: editSiteUsername.trim(),
            password: editSitePassword.trim()
          }
        };
      }
      return s;
    }));

    showNotification("Website changes saved successfully!");
    setIsEditWebsiteModalOpen(false);
  };

  const handleSaveExternalLink = () => {
    if (!extLinkName.trim() || !extSourceUrl.trim() || !extTargetUrl.trim()) {
      alert("Link Name, Source URL, and Published URL are required!");
      return;
    }

    setSites(prevSites => prevSites.map(s => {
      if (s.id === selectedSiteId) {
        const currentLinks = s.externalLinks || [];
        let updatedLinks;
        const currentDate = new Date().toISOString().split('T')[0];
        if (editingExternalLinkId) {
          updatedLinks = currentLinks.map(l => l.id === editingExternalLinkId ? {
            ...l,
            linkName: extLinkName.trim(),
            sourceUrl: extSourceUrl.trim(),
            targetUrl: extTargetUrl.trim(),
            linkType: extLinkType,
            status: extStatus,
            indexed: extIndexed,
            dateAdded: extDateAdded || currentDate,
            lastChecked: extLastChecked,
            notes: extNotes.trim()
          } : l);
        } else {
          const newLink = {
            id: `ext-lnk-${Date.now()}`,
            linkName: extLinkName.trim(),
            sourceUrl: extSourceUrl.trim(),
            targetUrl: extTargetUrl.trim(),
            linkType: extLinkType,
            status: extStatus,
            indexed: extIndexed,
            dateAdded: extDateAdded || currentDate,
            lastChecked: extLastChecked,
            notes: extNotes.trim()
          };
          updatedLinks = [...currentLinks, newLink];
        }
        return { ...s, externalLinks: updatedLinks };
      }
      return s;
    }));

    setIsExternalLinkModalOpen(false);
    showNotification("External link saved successfully!");
  };

  const handleDeleteExternalLink = (siteId, linkId) => {
    if (window.confirm("Are you sure you want to delete this external link?")) {
      setSites(prevSites => prevSites.map(s => {
        if (s.id === siteId) {
          const updatedLinks = (s.externalLinks || []).filter(l => l.id !== linkId);
          return { ...s, externalLinks: updatedLinks };
        }
        return s;
      }));
      showNotification("External link deleted successfully!");
      setIsExternalLinkModalOpen(false);
    }
  };

  const handleCheckIndexingStatus = async () => {
    const site = sites.find(s => s.id === selectedSiteId);
    if (!site) return;

    const externalLinks = site.externalLinks || [];
    // Only send links to IndexChecker where the Published URL (targetUrl) is populated
    const linksToCheck = externalLinks.filter(l => l.targetUrl && l.targetUrl.trim() !== "");

    if (linksToCheck.length === 0) {
      showNotification("No external links with a populated Published URL found to check.");
      return;
    }

    setIsCheckingIndexStatus(true);
    showNotification("Checking indexing status...");

    try {
      const urls = linksToCheck.map(l => l.sourceUrl).filter(Boolean);
      let projectId = site.indexCheckerProjectId;

      if (!projectId) {
        const syncResponse = await fetch(`${API_BASE}/index-checker/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siteId: site.id,
            siteName: site.siteName || site.name || `site-${site.id}`,
            urls: urls,
            existingProjectId: null
          })
        });

        if (!syncResponse.ok) {
          const errData = await syncResponse.json();
          throw new Error(errData.error || "Failed to create IndexChecker project.");
        }

        const syncData = await syncResponse.json();
        projectId = syncData.projectId;
        if (!projectId) {
          throw new Error("No project ID was returned from the server.");
        }

        // Save project ID against the website
        setSites(prev => prev.map(s => s.id === site.id ? { ...s, indexCheckerProjectId: projectId } : s));
      }

      // Fetch project details
      const detailsResponse = await fetch(`${API_BASE}/index-checker/details?projectId=${projectId}`);
      if (!detailsResponse.ok) {
        const errData = await detailsResponse.json();
        throw new Error(errData.error || "Failed to fetch project details.");
      }

      const detailsData = await detailsResponse.json();
      const urlStatusMap = detailsData.urls || {};
      const currentDate = new Date().toISOString().split('T')[0];

      setSites(prev => prev.map(s => {
        if (s.id === site.id) {
          const updatedLinks = (s.externalLinks || []).map(link => {
            // Only update the Indexed, Last Checked and Notes columns for the links that were actually checked
            const isChecked = link.targetUrl && link.targetUrl.trim() !== "";
            if (!isChecked) {
              return link;
            }

            const statusVal = urlStatusMap[link.sourceUrl];
            if (statusVal !== undefined) {
              let indexed = "Unknown";
              if (statusVal === 1 || statusVal === "1") {
                indexed = "Indexed";
              } else if (statusVal === 0 || statusVal === "0") {
                indexed = "Not Indexed";
              } else if (statusVal === -1 || statusVal === "-1") {
                indexed = "Pending";
              } else {
                indexed = "Error";
              }
              return {
                ...link,
                indexed: indexed,
                lastChecked: currentDate
              };
            }
            return link;
          });
          return { ...s, externalLinks: updatedLinks };
        }
        return s;
      }));

      showNotification("Indexing status updated successfully!");
    } catch (err) {
      console.error("[IndexChecker] Check error:", err);
      showNotification(`Failed to check indexing status: ${err.message}`);
    } finally {
      setIsCheckingIndexStatus(false);
    }
  };

  const handleSort = (key) => {
    if (extSortKey !== key) {
      setExtSortKey(key);
      setExtSortDir('asc');
    } else {
      if (extSortDir === 'asc') {
        setExtSortDir('desc');
      } else if (extSortDir === 'desc') {
        setExtSortKey(null);
        setExtSortDir(null);
      } else {
        setExtSortDir('asc');
      }
    }
  };

  const getSortedExternalLinks = (links) => {
    const defaultSorted = [...links].sort((a, b) => (a.linkName || '').localeCompare(b.linkName || ''));
    if (!extSortKey || !extSortDir) {
      return defaultSorted;
    }

    return [...links].sort((a, b) => {
      let valA = a[extSortKey] || '';
      let valB = b[extSortKey] || '';

      // Normalize Yes/No mapping for legacy indexed values to match display
      if (extSortKey === 'indexed') {
        if (valA === 'Yes') valA = 'Indexed';
        if (valA === 'No') valA = 'Not Indexed';
        if (valB === 'Yes') valB = 'Indexed';
        if (valB === 'No') valB = 'Not Indexed';
        
        // Remove "Unknown" as a displayed value once a link has been checked.
        const hasBeenCheckedA = a.lastChecked && a.lastChecked !== "Never";
        if (valA === "Unknown" && hasBeenCheckedA) {
          if (a.notes && a.notes.toLowerCase().includes('pending')) {
            valA = "Pending";
          } else {
            valA = "Error";
          }
        }
        const hasBeenCheckedB = b.lastChecked && b.lastChecked !== "Never";
        if (valB === "Unknown" && hasBeenCheckedB) {
          if (b.notes && b.notes.toLowerCase().includes('pending')) {
            valB = "Pending";
          } else {
            valB = "Error";
          }
        }
      }

      // Handle dates specifically
      if (extSortKey === 'dateAdded' || extSortKey === 'lastChecked') {
        const isNeverA = !valA || valA === 'Never' || valA === 'Never Checked';
        const isNeverB = !valB || valB === 'Never' || valB === 'Never Checked';
        if (isNeverA && isNeverB) return 0;
        if (isNeverA) return extSortDir === 'asc' ? -1 : 1;
        if (isNeverB) return extSortDir === 'asc' ? 1 : -1;
        
        const dateA = new Date(valA);
        const dateB = new Date(valB);
        return extSortDir === 'asc' ? dateA - dateB : dateB - dateA;
      }

      // Fallback to string comparison
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      
      if (strA < strB) return extSortDir === 'asc' ? -1 : 1;
      if (strA > strB) return extSortDir === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const downloadCsvTemplate = () => {
    const headers = "Name,Source URL,Published URL\n";
    const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "external_links_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const parsed = parseCSV(text);
      if (parsed.error) {
        showNotification(parsed.error);
        return;
      }

      const site = sites.find(s => s.id === selectedSiteId);
      const currentLinks = site ? (site.externalLinks || []) : [];
      const processed = processCsvRows(parsed.rows, currentLinks);
      setCsvPreviewRows(processed);
      setImportCompleted(false);
      setCsvSummary(null);
    };
    reader.readAsText(file);
    // Reset file input value so same file can be uploaded again if needed
    e.target.value = '';
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length === 0) return { error: "CSV file is empty" };
    
    const headers = lines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    if (headers.length < 2 || headers[0].toLowerCase() !== "name" || headers[1].toLowerCase() !== "source url") {
      return { error: "Invalid CSV headers. Columns must be exactly: Name, Source URL, Published URL" };
    }
    
    const parsedRows = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^["']|["']$/g, ''));
      
      parsedRows.push({
        name: cells[0] || '',
        sourceUrl: cells[1] || '',
        publishedUrl: cells[2] || ''
      });
    }
    return { rows: parsedRows };
  };

  const isValidURL = (str) => {
    try {
      const url = new URL(str);
      if (url.protocol !== "http:" && url.protocol !== "https:") return false;
      const host = url.hostname;
      if (!host.includes('.') || host.startsWith('.') || host.endsWith('.')) {
        return false;
      }
      return true;
    } catch (_) {
      return false;
    }
  };

  const processCsvRows = (rows, currentLinks) => {
    const existingMap = new Map();
    currentLinks.forEach(link => {
      existingMap.set((link.sourceUrl || '').trim().toLowerCase(), link);
    });

    return rows.map(row => {
      const name = row.name.trim();
      const sourceUrl = row.sourceUrl.trim();
      const publishedUrl = row.publishedUrl.trim();

      let status = "Ready";
      let errorMsg = "";

      if (!name) {
        status = "Invalid";
        errorMsg = "Name is required";
      } else if (!sourceUrl) {
        status = "Invalid";
        errorMsg = "Source URL is required";
      } else if (!isValidURL(sourceUrl)) {
        status = "Invalid";
        errorMsg = "Invalid Source URL format";
      } else if (publishedUrl && !isValidURL(publishedUrl)) {
        status = "Invalid";
        errorMsg = "Invalid Published URL format";
      } else {
        const existing = existingMap.get(sourceUrl.toLowerCase());
        if (existing) {
          const existingPubUrl = (existing.targetUrl || '').trim();
          if (!existingPubUrl && publishedUrl) {
            status = "Update Existing";
          } else {
            status = "Duplicate";
          }
        }
      }

      return {
        name,
        sourceUrl,
        publishedUrl,
        status,
        errorMsg
      };
    });
  };

  const handleConfirmBulkImport = () => {
    const site = sites.find(s => s.id === selectedSiteId);
    if (!site) return;

    const currentLinks = site.externalLinks || [];
    let newRecordsCount = 0;
    let existingRecordsUpdatedCount = 0;
    let duplicatesSkippedCount = 0;
    let invalidRowsRejectedCount = 0;

    const updatedLinks = [...currentLinks];
    const timestamp = new Date().getTime();

    csvPreviewRows.forEach((row, i) => {
      if (row.status === "Invalid") {
        invalidRowsRejectedCount++;
      } else if (row.status === "Duplicate") {
        duplicatesSkippedCount++;
      } else if (row.status === "Update Existing") {
        const idx = updatedLinks.findIndex(l => (l.sourceUrl || '').trim().toLowerCase() === row.sourceUrl.toLowerCase());
        if (idx !== -1) {
          updatedLinks[idx] = {
            ...updatedLinks[idx],
            targetUrl: row.publishedUrl
          };
          existingRecordsUpdatedCount++;
        }
      } else if (row.status === "Ready") {
        const newLink = {
          id: `ext-lnk-${timestamp}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          linkName: row.name,
          sourceUrl: row.sourceUrl,
          targetUrl: row.publishedUrl,
          linkType: "Backlink",
          status: "Pending",
          indexed: "Unknown",
          dateAdded: new Date().toISOString().split('T')[0],
          lastChecked: "Never",
          notes: ""
        };
        updatedLinks.push(newLink);
        newRecordsCount++;
      }
    });

    setSites(prev => prev.map(s => s.id === site.id ? { ...s, externalLinks: updatedLinks } : s));

    setCsvSummary({
      newCount: newRecordsCount,
      updatedCount: existingRecordsUpdatedCount,
      skippedCount: duplicatesSkippedCount,
      rejectedCount: invalidRowsRejectedCount
    });
    setImportCompleted(true);
    showNotification("Bulk import completed successfully!");
  };

  const starterPackUrls = [
    "https://www.crunchbase.com/",
    "https://www.openstreetmap.org/",
    "https://www.geonames.org/",
    "https://www.wikidata.org/",
    "https://www.apsense.com/",
    "https://www.freeindex.co.uk/",
    "https://writeupcafe.com/",
    "https://www.yell.com/",
    "https://www.lacartes.com/",
    "https://www.thomsonlocal.com/",
    "https://sites.google.com/",
    "https://medium.com/",
    "https://www.openpr.com/",
    "https://www.prlog.org/",
    "https://seeklogo.com/",
    "https://www.storeboard.com/",
    "https://www.brownbook.net/",
    "https://realtytimes.com/",
    "https://www.linkcentre.com/",
    "https://www.bedesworld.co.uk/"
  ];

  const getStarterPackLinkName = (url) => {
    try {
      let hostname = new URL(url).hostname;
      hostname = hostname.replace("www.", "");
      let parts = hostname.split('.');
      let name = parts[0];
      if (name === "sites" && parts[1] === "google") {
        return "Google Sites";
      }
      return name.charAt(0).toUpperCase() + name.slice(1);
    } catch (e) {
      return "Starter Link";
    }
  };

  const handleImportStarterPack = () => {
    setSites(prevSites => prevSites.map(s => {
      if (s.id === selectedSiteId) {
        const currentLinks = s.externalLinks || [];
        const existingUrls = new Set(currentLinks.map(l => l.sourceUrl.toLowerCase().replace(/\/+$/, "")));
        
        const newLinksToAdd = [];
        starterPackUrls.forEach(url => {
          const normalizedUrl = url.toLowerCase().replace(/\/+$/, "");
          if (!existingUrls.has(normalizedUrl)) {
            newLinksToAdd.push({
              id: `ext-lnk-starter-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              linkName: getStarterPackLinkName(url),
              sourceUrl: url,
              targetUrl: "",
              linkType: "Starter Pack",
              status: "Pending",
              indexed: "Unknown",
              dateAdded: new Date().toISOString().split('T')[0],
              lastChecked: "",
              notes: ""
            });
          }
        });

        if (newLinksToAdd.length === 0) {
          showNotification("Starter pack already imported or all links exist.");
          return s;
        }

        const updatedLinks = [...currentLinks, ...newLinksToAdd].sort((a, b) => a.linkName.localeCompare(b.linkName));
        showNotification(`Imported ${newLinksToAdd.length} starter backlink(s)!`);
        return { ...s, externalLinks: updatedLinks };
      }
      return s;
    }));
  };

  const handleDeleteWebsite = () => {
    if (!editingSiteId) return;
    const site = sites.find(s => s.id === editingSiteId);
    if (!site) return;

    const confirmed = window.confirm(`Are you sure you want to delete the website "${site.name}"? This action cannot be undone.`);
    if (confirmed) {
      setSites(prev => prev.filter(s => s.id !== editingSiteId));
      showNotification(`Website "${site.name}" has been deleted.`);
      setIsEditWebsiteModalOpen(false);
      if (selectedSiteId === editingSiteId) {
        setSelectedSiteId(null);
        setCurrentView("CONNECTED_SITES");
      }
    }
  };
;
;

  const handleGenerateSentence = async (destPage, rec, srcPage, key, anchorText) => {
    setIsGenerating(prev => ({ ...prev, [key]: true }));

    try {
      const response = await fetch('/api/generate-sentence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourceTitle: rec.sourceTitle,
          sourceUrl: rec.sourceUrl,
          sourceContent: srcPage?.crawlData?.bodyContent || srcPage?.crawlData?.plain_text || "",
          destinationTitle: destPage.pageTitle,
          destinationUrl: destPage.pageUrl,
          destinationTargetPhrase: destPage.targetPhrase,
          recommendedAnchor: anchorText
        })
      });

      if (!response.ok) {
        let errMsg = `Server returned status: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (e) {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      if (data.sentence) {
        const baseSiteUrl = selectedSite.url.replace(/\/+$/, "");
        const relativeDestUrl = destPage.pageUrl.startsWith("/") ? destPage.pageUrl : "/" + destPage.pageUrl;
        const absoluteDestUrl = baseSiteUrl + relativeDestUrl;
        const htmlSentence = makeHtmlSentence(data.sentence, anchorText, absoluteDestUrl);
        
        setGeneratedSentences(prev => ({ ...prev, [key]: htmlSentence }));
        showNotification("Suggested sentence generated!");
      } else {
        throw new Error(data.error || "Failed to generate sentence.");
      }
    } catch (err) {
      console.error(err);
      alert(`Error generating sentence: ${err.message}`);
    } finally {
      setIsGenerating(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSyncWebsitePages = async (siteId, siteUrl, username, password, passedPlatform) => {
    let cleanUrl = siteUrl.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "https://" + cleanUrl;
    }
    cleanUrl = cleanUrl.replace(/\/+$/, "");

    const site = sites.find(s => s.id === siteId);
    const platform = passedPlatform || (site ? (site.platform || "WordPress") : "WordPress");

    try {
      const provider = ConnectionManager.getProvider(platform);
      const parsedRecords = await provider.getPages(cleanUrl, { username, password });

      const prevPages = pagesData[siteId] || [];
      const syncedUrls = new Set();

      const uniqueRecords = [];
      const seenUrls = new Set();
      parsedRecords.forEach(record => {
        const pageUrl = getRelativeUrl(record.url, cleanUrl);
        if (!seenUrls.has(pageUrl)) {
          seenUrls.add(pageUrl);
          uniqueRecords.push(record);
        }
      });

      const formattedPages = uniqueRecords.map(record => {
        const pageUrl = getRelativeUrl(record.url, cleanUrl);
        syncedUrls.add(pageUrl);

        let assignedType = undefined;
        if (platform === "Magento") {
          if (pageUrl === "/" || pageUrl === "") {
            assignedType = "Hub Page";
          } else if (record.id && String(record.id).startsWith("category-")) {
            assignedType = "Landing Page";
          } else if (record.id && String(record.id).startsWith("cms-")) {
            assignedType = "Topical Page";
          }
        }

        let pageType = assignedType || getPageAuditorAssignedType(pageUrl);
        if (pageUrl === "/") {
          pageType = "Hub";
        }
        const pagePriority = getPriorityFromAssignedType(pageType);

        const existingPage = platform === "Magento"
          ? prevPages.find(p => p.wpPostId === record.id)
          : prevPages.find(p => p.pageUrl === pageUrl);
        if (existingPage) {
          return {
            ...existingPage,
            wpPostId: record.id,
            pageTitle: record.title,
            lastModifiedDate: record.modifiedAt,
            assignedType: pageType,
            priority: pagePriority,
            crawlData: {
              ...existingPage.crawlData,
              wpPostId: record.id,
              h1: record.h1,
              wordCount: record.wordCount,
              metaDescription: record.metaDescription,
              bodyContent: record.bodyContent
            }
          };
        } else {
          return {
            pageUrl: pageUrl,
            wpPostId: record.id,
            pageTitle: record.title,
            targetPhrase: record.focusKeywords?.[0] || "",
            parentPage: record.parent ? String(record.parent) : "/",
            assignedType: pageType,
            priority: pagePriority,
            status: "Unconfigured",
            lastModifiedDate: record.modifiedAt,
            crawlData: {
              wpPostId: record.id,
              h1: record.h1,
              wordCount: record.wordCount,
              metaDescription: record.metaDescription,
              bodyContent: record.bodyContent
            }
          };
        }
      });

      // Preserve planned pages that are not yet live
      const plannedPages = prevPages.filter(p => p.status === "Planned" && !syncedUrls.has(p.pageUrl));
      const finalPages = [...formattedPages, ...plannedPages];

      const updatedPagesWithAudits = await rebuildInternalLinksData(finalPages, site, cleanUrl, siteId);

      const saveResponse = await fetch(`${API_BASE}/pages-data/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, pages: updatedPagesWithAudits })
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save pages to the database backend.");
      }

      setPagesData(prev => ({
        ...prev,
        [siteId]: updatedPagesWithAudits
      }));

      showNotification(`Successfully synchronized ${formattedPages.length} pages from ${platform}.`);
      return true;
    } catch (err) {
      console.error("Sync error:", err);
      showNotification(`Sync Failed: ${err.message}`);
      return false;
    }
  };

  const handleSaveWebsite = async () => {
    if (connectionTestStatus !== "success") return;

    let cleanUrl = newSiteUrl.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "https://" + cleanUrl;
    }
    cleanUrl = cleanUrl.replace(/\/+$/, "");

    // Check if website URL already exists (case-insensitively, trailing slash ignored)
    const existingSite = sites.find(s => s.url.trim().toLowerCase().replace(/\/+$/, "") === cleanUrl.toLowerCase());

    let finalId = "";
    let finalName = newSiteName.trim();
    let finalPlatform = newSitePlatform;
    let finalUsername = newSiteUsername.trim();
    let finalPassword = newSitePassword.trim();

    if (existingSite) {
      finalId = existingSite.id;
      const updatedSite = {
        ...existingSite,
        name: finalName || existingSite.name,
        credentials: {
          username: finalUsername,
          password: finalPassword
        },
        portfolio: newSitePortfolio,
        platform: finalPlatform,
        elementorEnabled: newSiteElementorEnabled
      };

      setSites(prev => prev.map(s => s.id === existingSite.id ? updatedSite : s));
      setPagesData(prev => {
        if (prev[existingSite.id]) {
          return prev; // Preserve existing pages and configuration
        }
        return {
          ...prev,
          [existingSite.id]: []
        };
      });
      showNotification(`Website "${updatedSite.name}" updated successfully!`);
    } else {
      const cleanId = finalName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      let tempId = cleanId;
      let suffix = 1;
      while (sites.some(s => s.id === tempId)) {
        tempId = `${cleanId}-${suffix}`;
        suffix++;
      }
      finalId = tempId;

      const newSite = {
        id: finalId,
        name: finalName,
        url: cleanUrl,
        status: "Connected",
        lastAudit: null,
        tasks: [],
        credentials: {
          username: finalUsername,
          password: finalPassword
        },
        portfolio: newSitePortfolio,
        platform: finalPlatform,
        elementorEnabled: newSiteElementorEnabled
      };

      setSites(prev => [...prev, newSite]);
      setPagesData(prev => ({
        ...prev,
        [finalId]: []
      }));
      showNotification(`Website "${newSite.name}" connected successfully!`);
    }

    setIsAddWebsiteModalOpen(false);
    setNewSiteName("");
    setNewSiteUrl("");
    setNewSiteUsername("");
    setNewSitePassword("");
    setNewSitePortfolio("TSE");
    setNewSitePlatform("WordPress");
    setConnectionTestStatus("idle");
    setConnectionTestMessage("");
    setNewSiteElementorEnabled(false);

    await handleSyncWebsitePages(finalId, cleanUrl, finalUsername, finalPassword, finalPlatform);
  };

  // Load sites and page configurations from PostgreSQL database on mount
  useEffect(() => {
    let active = true;
    const fetchDatabaseData = async () => {
      let loadedSites = sites;
      let loadedPages = pagesData;
      try {
        const sitesRes = await fetch(`${API_BASE}/sites`);
        if (!sitesRes.ok) throw new Error("Failed to fetch sites from database");
        const sitesJson = await sitesRes.json();

        const pagesRes = await fetch(`${API_BASE}/pages-data`);
        if (!pagesRes.ok) throw new Error("Failed to fetch pages configurations from database");
        const pagesJson = await pagesRes.json();
        console.log("[DIAGNOSTIC] Raw database pagesJson fetched:", pagesJson);

        if (active) {
          // Merge database sites with local sites (database takes precedence)
          setSites(prevSites => {
            const dbSiteIds = new Set(sitesJson.map(s => s.id));
            const merged = sitesJson.map(dbSite => dbSite);
            prevSites.forEach(localSite => {
              if (!dbSiteIds.has(localSite.id)) {
                merged.push(localSite);
              }
            });
            loadedSites = merged;
            initialSitesRef.current = merged;
            return merged;
          });

          // Merge database page configurations with local configurations (database takes precedence)
          setPagesData(prevPages => {
            const merged = { ...prevPages };
            Object.keys(pagesJson).forEach(siteId => {
              const dbPagesWithTypes = pagesJson[siteId];

              const siteObj = sitesJson.find(s => s.id === siteId);
              const isMagento = siteObj?.platform === "Magento";
              const keySelector = (p) => (isMagento && p.wpPostId ? p.wpPostId : p.pageUrl);

              if (!merged[siteId]) {
                merged[siteId] = dbPagesWithTypes;
              } else {
                const dbPagesMap = new Map(dbPagesWithTypes.map(p => [keySelector(p), p]));
                const updatedPages = merged[siteId].map(localPage => {
                  const localKey = keySelector(localPage);
                  if (dbPagesMap.has(localKey)) {
                    const dbPage = dbPagesMap.get(localKey);
                    
                    // If local page is configured but database page is not, keep the local configuration
                    const localIsMoreConfigured = (localPage.status === "Configured" || (localPage.targetPhrase && localPage.targetPhrase.trim() !== "")) &&
                                                  (dbPage.status !== "Configured" && (!dbPage.targetPhrase || dbPage.targetPhrase.trim() === ""));
                    
                    if (localIsMoreConfigured) {
                      return {
                        ...dbPage,
                        targetPhrase: localPage.targetPhrase,
                        status: localPage.status,
                        assignedType: localPage.assignedType,
                        priority: localPage.priority,
                        parentPage: localPage.parentPage
                      };
                    }
                    return dbPage;
                  }
                  return localPage;
                });
                const localKeys = new Set(merged[siteId].map(p => keySelector(p)));
                dbPagesWithTypes.forEach(dbPage => {
                  if (!localKeys.has(keySelector(dbPage))) {
                    updatedPages.push(dbPage);
                  }
                });
                merged[siteId] = updatedPages;
              }
            });
            loadedPages = merged;
            console.log("[DIAGNOSTIC] Merged pagesData state object:", merged);
            
            // Set initialPagesDataRef.current to represent exactly what was fetched from the database (without local overrides),
            // so that the automatic sync useEffect can detect the difference and save the local changes to the database.
            const dbSourced = { ...prevPages };
            Object.keys(pagesJson).forEach(siteId => {
              const dbPagesWithTypes = pagesJson[siteId];
              const siteObj = sitesJson.find(s => s.id === siteId);
              const isMagento = siteObj?.platform === "Magento";
              const keySelector = (p) => (isMagento && p.wpPostId ? p.wpPostId : p.pageUrl);

              if (!dbSourced[siteId]) {
                dbSourced[siteId] = dbPagesWithTypes;
              } else {
                const dbPagesMap = new Map(dbPagesWithTypes.map(p => [keySelector(p), p]));
                const updatedPages = dbSourced[siteId].map(localPage => {
                  const localKey = keySelector(localPage);
                  if (dbPagesMap.has(localKey)) {
                    return dbPagesMap.get(localKey);
                  }
                  return localPage;
                });
                const localKeys = new Set(dbSourced[siteId].map(p => keySelector(p)));
                dbPagesWithTypes.forEach(dbPage => {
                  if (!localKeys.has(keySelector(dbPage))) {
                    updatedPages.push(dbPage);
                  }
                });
                dbSourced[siteId] = updatedPages;
              }
            });
            initialPagesDataRef.current = JSON.parse(JSON.stringify(dbSourced));
            return merged;
          });

          console.log("Loaded and merged connected websites and configurations from database.");
        }
      } catch (err) {
        console.warn("Database API load failed. Using offline localStorage fallback. Error:", err.message);
        initialSitesRef.current = loadedSites;
        initialPagesDataRef.current = loadedPages;
      } finally {
        if (active) {
          setIsInitialLoadComplete(true);
        }
      }
    };
    
    if (!isAutomation) {
      fetchDatabaseData();
    } else {
      setIsInitialLoadComplete(true);
    }
    
    return () => {
      active = false;
    };
  }, [isAutomation]);

  useEffect(() => {
    if (!isInitialLoadComplete) return;

    if (!isAutomation) {
      const currentStr = JSON.stringify(pagesData);
      const initialStr = JSON.stringify(initialPagesDataRef.current);
      if (currentStr === initialStr) {
        console.log("Pages data has not changed from database value. Skipping save.");
        return;
      }

      try {
        localStorage.setItem("tse_pages_data", currentStr);
      } catch (e) {
        console.warn("localStorage quota exceeded for pages data:", e.message);
      }
      
      fetch(`${API_BASE}/pages-data/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagesData })
      }).catch(err => {
        console.warn("Failed to sync pagesData to database:", err.message);
      });

      initialPagesDataRef.current = pagesData;
    }
  }, [pagesData, isAutomation, isInitialLoadComplete]);

  useEffect(() => {
    if (!isInitialLoadComplete) return;

    if (!isAutomation) {
      const currentStr = JSON.stringify(sites);
      const initialStr = JSON.stringify(initialSitesRef.current);
      if (currentStr === initialStr) {
        console.log("Sites data has not changed from database value. Skipping save.");
        return;
      }

      try {
        localStorage.setItem("tse_sites_data", currentStr);
      } catch (e) {
        console.warn("localStorage quota exceeded for sites data:", e.message);
      }
      
      fetch(`${API_BASE}/sites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sites })
      }).catch(err => {
        console.warn("Failed to sync sites to database:", err.message);
      });

      initialSitesRef.current = sites;
    }
  }, [sites, isAutomation, isInitialLoadComplete]);

  useEffect(() => {
    // If the user navigates away from the initial deep-linked view, disable automation mode
    // and clear URL query parameters.
    if (currentView !== initialView) {
      setIsAutomation(false);
      if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [currentView, initialView]);

  useEffect(() => {
    if (currentView === "AUDIT_RESULTS" && selectedSiteId) {
      console.log(`[REFRESH] Refreshing pagesData for site ${selectedSiteId} from database...`);
      fetch(`${API_BASE}/pages-data`)
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch pages configurations from database");
          return res.json();
        })
        .then(pagesJson => {
          setPagesData(prevPages => {
            const merged = { ...prevPages };
            Object.keys(pagesJson).forEach(siteId => {
              merged[siteId] = pagesJson[siteId];
            });
            initialPagesDataRef.current = merged;
            return merged;
          });
          console.log("[REFRESH] pagesData refreshed successfully from database.");
        })
        .catch(err => {
          console.warn("[REFRESH] Failed to refresh pagesData:", err.message);
        });
    }
  }, [currentView, selectedSiteId]);

  const [auditFindings, setAuditFindings] = useState(() => {
    const targetSiteId = initialSiteId || "bathroom-upgrades";
    if (targetSiteId === "bathroom-upgrades") {
      return initialBUData.findings;
    }
    return [];
  });
  const [selectedFindingId, setSelectedFindingId] = useState(() => {
    const targetSiteId = initialSiteId || "bathroom-upgrades";
    if (targetSiteId === "bathroom-upgrades" && initialBUData.findings.length > 0) {
      return initialBUData.findings[0].findingId;
    }
    return null;
  });

  // Architecture view state variables
  const [selectedArchTaskId, setSelectedArchTaskId] = useState("t1");
  const [activeSettingsTab, setActiveSettingsTab] = useState("general_settings");
  const [expandedSettingsGroups, setExpandedSettingsGroups] = useState({
    "GENERAL": true,
    "DEVELOPER": true
  });

  const [archNotes, setArchNotes] = useState("");
  const [saveStatus, setSaveStatus] = useState("All changes saved");
  const saveTimeoutRef = useRef(null);

  const [gitStatus, setGitStatus] = useState({
    branch: 'unknown',
    currentCommit: 'unknown',
    lastPullTime: null,
    lastPullStatus: null,
    lastPullLog: null,
    previousCommit: 'unknown'
  });
  const [gitPullLogs, setGitPullLogs] = useState("");
  const [isGitPulling, setIsGitPulling] = useState(false);

  const [latestGithubCommit, setLatestGithubCommit] = useState("unknown");
  const [behindCount, setBehindCount] = useState(null);
  const [timeChecked, setTimeChecked] = useState(null);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  const handleCheckUpdates = async () => {
    setIsCheckingUpdates(true);
    try {
      const res = await fetch(`${API_BASE}/github/check-updates`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setLatestGithubCommit(data.remoteCommit);
        setBehindCount(data.behindCount);
        setTimeChecked(data.timeChecked);
        setGitStatus(prev => ({
          ...prev,
          branch: data.branch,
          currentCommit: data.localCommit
        }));
        showNotification("Checked for updates successfully!");
      } else {
        showNotification("Failed to check for updates.");
      }
    } catch (e) {
      console.error(e);
      showNotification("Network error checking for updates.");
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const fetchGitStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/github/status`);
      if (res.ok) {
        const data = await res.json();
        setGitStatus(data);
        if (data.lastPullLog) {
          setGitPullLogs(data.lastPullLog);
        } else {
          setGitPullLogs("");
        }
      }
    } catch (e) {
      console.error("Failed to fetch git status:", e);
    }
  };

  useEffect(() => {
    if (activeSettingsTab === "github_deployment") {
      fetchGitStatus();
    }
  }, [activeSettingsTab]);

  const handleGitPull = async () => {
    const confirm = window.confirm("Are you sure you want to deploy the latest version? This will pull updates, rebuild the frontend, and restart the backend.");
    if (!confirm) return;

    setIsGitPulling(true);
    setGitPullLogs("Initiating deployment...\n1. Pulling latest code from GitHub...\n2. Rebuilding frontend assets...\n");

    try {
      const response = await fetch(`${API_BASE}/github/pull`, {
        method: "POST"
      });
      const data = await response.json();
      
      let logs = data.output || data.lastPullLog || "No output returned.";
      setGitPullLogs(logs);
      
      if (data.success) {
        setGitPullLogs(prev => prev + "\n\n3. Restarting backend service (tse-audit-api) via PM2...\n4. Waiting for backend health check to pass...\n");
        
        // Start polling health check
        let attempts = 0;
        const maxAttempts = 30;
        const pollInterval = 1500;
        
        const checkHealth = async () => {
          try {
            attempts++;
            const statusRes = await fetch(`${API_BASE}/github/status`);
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              // Check if the current commit matches the latest target commit
              if (statusData.currentCommit === data.currentCommit) {
                setGitPullLogs(prev => prev + `\n[DEPLOY] Backend health check passed on attempt ${attempts}.`);
                setGitPullLogs(prev => prev + "\n\n=== DEPLOYMENT COMPLETE ===");
                showNotification("Deployment completed successfully!");
                setIsGitPulling(false);
                setBehindCount(0);
                setLatestGithubCommit(statusData.currentCommit);
                setGitStatus({
                  branch: statusData.branch,
                  currentCommit: statusData.currentCommit,
                  lastPullTime: statusData.lastPullTime || data.lastPullTime,
                  lastPullStatus: 'success',
                  lastPullLog: data.lastPullLog,
                  previousCommit: statusData.previousCommit || data.previousCommit
                });
                return;
              }
            }
          } catch (e) {
            // Server is restarting/down, ignore error and continue polling
          }
          
          if (attempts < maxAttempts) {
            setTimeout(checkHealth, pollInterval);
          } else {
            setGitPullLogs(prev => prev + "\n\n[DEPLOY] Timeout waiting for backend health check to pass.");
            showNotification("Deployment health check timed out.");
            setIsGitPulling(false);
          }
        };
        
        // Wait 2.5 seconds before first health check to allow PM2 to kill the old process
        setTimeout(checkHealth, 2500);
        
      } else if (data.dirty) {
        showNotification("Local uncommitted changes detected. Commit or discard them before deploying.");
        setIsGitPulling(false);
      } else {
        showNotification("Deployment failed! See logs for details.");
        setIsGitPulling(false);
      }
    } catch (err) {
      console.error(err);
      setGitPullLogs(prev => prev + `\nError during deployment: ${err.message}`);
      showNotification("Network error executing deployment.");
      setIsGitPulling(false);
    }
  };

  useEffect(() => {
    if (activeSettingsTab === "diagnostics") {
      setSaveStatus("Loading...");
      fetch(`${API_BASE}/architecture-notes`)
        .then(res => {
          if (!res.ok) throw new Error("Failed to load");
          return res.json();
        })
        .then(data => {
          setArchNotes(data.content || "");
          setSaveStatus("All changes saved");
        })
        .catch(err => {
          console.error("Failed to load architecture notes:", err);
          setSaveStatus("Failed to load notes");
        });
    }
  }, [activeSettingsTab]);

  const handleArchNotesChange = (e) => {
    const val = e.target.value;
    setArchNotes(val);
    setSaveStatus("Saving changes...");
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      fetch(`${API_BASE}/architecture-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: val })
      })
      .then(res => {
        if (!res.ok) throw new Error("Save failed");
        setSaveStatus("All changes saved");
      })
      .catch(err => {
        console.error("Auto-save failed:", err);
        setSaveStatus("Auto-save failed (retrying on next edit)");
      });
    }, 1000);
  };
  const [simSource, setSimSource] = useState("Search Console");
  const [simSiteId, setSimSiteId] = useState("bathroom-upgrades");
  const [simUrl, setSimUrl] = useState("/search-performance-drop/");
  const [simTitle, setSimTitle] = useState("Search Performance Alert Page");
  const [simPhrase, setSimPhrase] = useState("bathroom renovation design");
  const [simIssueType, setSimIssueType] = useState("CTR Drop Alert");
  const [simDesc, setSimDesc] = useState("Page CTR fell by 22% on target query over past 30 days.");
  const [simPriority, setSimPriority] = useState("High");
  const [simVerification, setSimVerification] = useState("Search Console API verifies impressions recover above threshold");




  const getGroupedPageType = (page) => {
    if (!page) return "Unassigned Pages";
    if (isPageExcluded(page)) return "Excluded";
    if (page.assignedType) {
      if (page.assignedType === "Homepage") return "Homepage";
      if (page.assignedType === "Hub Page" || page.assignedType === "Hub Pages" || page.assignedType === "Hub") return "Hub Pages";
      if (page.assignedType === "Landing Page" || page.assignedType === "Landing Pages" || page.assignedType === "Landing" || page.assignedType === "Primary Landing Page") return "Landing Pages";
      if (page.assignedType === "Supporting Page" || page.assignedType === "Supporting Pages" || page.assignedType === "Supporting") return "Supporting Pages";
      if (page.assignedType === "Topical Page" || page.assignedType === "Topical Pages" || page.assignedType === "Topical") return "Topical Pages";
      return "Unassigned Pages";
    }
    const url = page.pageUrl;
    if (url === "/") return "Homepage";
    const score = getPageSEOScore(page);
    switch (score) {
      case 0: return "Homepage";
      case 1:
      case 2: return "Landing Pages";
      case 3: return "Supporting Pages";
      case 4: return "Topical Pages";
      default: return "Unassigned Pages";
    }
  };

  const buildHierarchyOptions = (sitePages, currentEditingUrl) => {
    const list = [];
    const visited = new Set();

    // Find the Homepage page
    const home = sitePages.find(p => p.pageUrl === "/");
    
    const traverse = (url, depth) => {
      const page = sitePages.find(p => p.pageUrl === url);
      if (!page) return;

      // Cycle prevention: skip the page being edited and its branches
      if (url === currentEditingUrl) return;

      list.push({
        url: url,
        title: page.pageTitle,
        depth: depth
      });
      visited.add(url);

      // Find children of this url
      const children = sitePages.filter(p => {
        if (p.pageUrl === "/") return false;
        const parent = p.parentPage !== undefined ? p.parentPage : "/";
        return parent === url && p.status === "Configured";
      });

      // Sort children alphabetically
      children.sort((a, b) => a.pageTitle.localeCompare(b.pageTitle));

      children.forEach(child => {
        if (!visited.has(child.pageUrl)) {
          traverse(child.pageUrl, depth + 1);
        }
      });
    };

    if (home) {
      traverse("/", 0);
    }

    // Add any configured pages that were not reached by traversal (e.g. orphans or disconnected pages)
    sitePages.forEach(p => {
      if (p.status === "Configured" && !visited.has(p.pageUrl) && p.pageUrl !== currentEditingUrl) {
        list.push({
          url: p.pageUrl,
          title: p.pageTitle,
          depth: p.pageUrl === "/" ? 0 : 1
        });
      }
    });

    return list;
  };

  const sortPagesForSEO = (pages) => {
    return [...pages].sort((a, b) => {
      const scoreA = getPageSEOScore(a);
      const scoreB = getPageSEOScore(b);
      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }
      return a.pageUrl.localeCompare(b.pageUrl);
    });
  };

  // Platform standard sortable table hook instantiation for W3 | Manage Pages table
  const w3Pages = React.useMemo(() => {
    return sortPagesForSEO(pagesData[selectedSiteId] || []);
  }, [pagesData, selectedSiteId]);

  const {
    sortedItems: w3SortedPages,
    sortField: w3SortField,
    sortDirection: w3SortDirection,
    requestSort: handleSortClick,
  } = useSortableTable(w3Pages, null, {
    valueSelectors: {
      page: (p) => (p.pageTitle || p.pageUrl || "").toLowerCase(),
      status: (p) => (isPageExcluded(p) ? "Excluded" : p.status || "Unconfigured").toLowerCase(),
      type: (p) => (p.assignedType || "Supporting Page").toLowerCase(),
      target: (p) => (p.targetPhrase || "").toLowerCase(),
    },
    customSorts: {
      priority: (valA, valB) => {
        const getPrioNum = (p) => {
          if (!p) return 0;
          const match = String(p).match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        };
        return getPrioNum(valA) - getPrioNum(valB);
      }
    }
  });

  useEffect(() => {
    if (currentView === "AUDIT_RUNNING") {
      const sitePages = pagesData[selectedSiteId] || [];
      const site = sites.find(s => s.id === selectedSiteId);
      
      const logs = [
        "[INFO] Connected via TSE Exporter Plugin."
      ];

      // Filter pages depending on whether this is a single page audit or full site audit
      const isMagento = site?.platform === "Magento";
      const pagesToScan = singleAuditPageUrl 
        ? sitePages.filter(p => isMagento && singleAuditPageId ? p.wpPostId === singleAuditPageId : p.pageUrl === singleAuditPageUrl)
        : sitePages;

      pagesToScan.forEach(page => {
        if (page.status === "Configured") {
          logs.push(`[SCAN] Page: ${page.pageUrl} - Index check OK.`);
          const pageFindings = generateFindingsForPage(page, site.url, selectedSiteId);
          if (pageFindings.some(f => f.findingType === "Missing H1 Phrase")) {
            logs.push(`[SCAN] Page: ${page.pageUrl} - H1 keyword mismatch detected.`);
          }
          if (pageFindings.some(f => f.findingType === "Missing FAQ Schema")) {
            logs.push(`[SCAN] Page: ${page.pageUrl} - FAQPage block is missing.`);
          }
          if (pageFindings.some(f => f.findingType === "Missing Meta Description")) {
            logs.push(`[SCAN] Page: ${page.pageUrl} - Thin meta description tag.`);
          }
          if (pageFindings.some(f => f.findingType === "Orphan Page")) {
            logs.push(`[SCAN] Page: ${page.pageUrl} - Orphan page detected.`);
          }
          if (pageFindings.some(f => f.findingType === "Missing Internal Link")) {
            logs.push(`[SCAN] Page: ${page.pageUrl} - Incoming internal link is missing.`);
          }
        } else {
          // Only show exclusion logs for full site audits to prevent logs clutter
          if (!singleAuditPageUrl) {
            logs.push(`[EXCLUDE] Page: ${page.pageUrl} - Status: ${page.status}. Skipping scan.`);
          }
        }
      });

      logs.push("[INFO] Running Page Auditor rule validation...");
      logs.push("[INFO] Audit scan completed. Compiling findings list...");

      if (instantParam) {
        setAuditProgress(60);
        setAuditLogs(logs.slice(0, 10));
        return;
      }

      setAuditProgress(0);
      setAuditLogs(["[INFO] Initializing audit scan engine..."]);
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep += 1;
        setAuditProgress(prev => Math.min(prev + 10, 100));
        
        if (currentStep <= logs.length) {
          setAuditLogs(prev => [...prev, logs[currentStep - 1]]);
        }

        if (currentStep >= logs.length || currentStep >= 15) {
          clearInterval(interval);
          // Transition to Stage 4 (Results)
          setTimeout(() => {
            const site = sites.find(s => s.id === selectedSiteId);
            
            if (singleAuditPageUrl) {
              const targetPage = sitePages.find(p => isMagento && singleAuditPageId ? p.wpPostId === singleAuditPageId : p.pageUrl === singleAuditPageUrl);
              const { findings, tasks: newTasks } = getFindingsAndTasksForSite(selectedSiteId, [targetPage], site.url, site.name);

              setAuditFindings(findings);
              setSelectedFindingId(findings.length > 0 ? findings[0].findingId : null);
              
              const auditResultsForPage = runPageAudit(targetPage.pageUrl, targetPage.targetPhrase, targetPage.pageTitle, selectedSiteId, targetPage);
              setPagesData(prev => ({
                ...prev,
                [selectedSiteId]: (prev[selectedSiteId] || []).map(p => {
                  const isTarget = isMagento && singleAuditPageId ? p.wpPostId === singleAuditPageId : p.pageUrl === singleAuditPageUrl;
                  if (isTarget) {
                    return {
                      ...p,
                      latestAudit: {
                        timestamp: new Date().toISOString(),
                        results: auditResultsForPage
                      }
                    };
                  }
                  return p;
                })
              }));

              setSites(prevSites => prevSites.map(s => {
                if (s.id === selectedSiteId) {
                  // Merge: remove previous tasks for this page path, and append new ones
                  const cleanUrl = s.url + singleAuditPageUrl;
                  const updatedTasks = isMagento && singleAuditPageId
                    ? s.tasks.filter(t => t.wpPostId !== singleAuditPageId)
                    : s.tasks.filter(t => t.pageUrl !== cleanUrl);
                  return {
                    ...s,
                    lastAudit: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                    tasks: [...updatedTasks, ...newTasks]
                  };
                }
                return s;
              }));
              setReviewPageUrl(singleAuditPageUrl);
            } else {
              const { findings, tasks } = getFindingsAndTasksForSite(selectedSiteId, sitePages, site.url, site.name);

              setAuditFindings(findings);
              setSelectedFindingId(findings.length > 0 ? findings[0].findingId : null);

              setPagesData(prev => ({
                ...prev,
                [selectedSiteId]: (prev[selectedSiteId] || []).map(p => {
                  if (p.status === "Configured") {
                    const auditResultsForPage = runPageAudit(p.pageUrl, p.targetPhrase, p.pageTitle, selectedSiteId, p);
                    return {
                      ...p,
                      latestAudit: {
                        timestamp: new Date().toISOString(),
                        results: auditResultsForPage
                      }
                    };
                  }
                  return p;
                })
              }));

              setSites(prevSites => prevSites.map(s => {
                if (s.id === selectedSiteId) {
                  return {
                    ...s,
                    lastAudit: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                    tasks: tasks
                  };
                }
                return s;
              }));
              const firstConfigured = sitePages.find(p => p.status === "Configured");
              setReviewPageUrl(firstConfigured ? firstConfigured.pageUrl : "/bathroom-installation/");
            }

            if (analysisReturnView) {
              setCurrentView(analysisReturnView);
              setAnalysisReturnView(null);
            } else {
              setCurrentView("AUDIT_RESULTS");
            }
          }, 800);
        }
      }, 300);

      return () => clearInterval(interval);
    }
  }, [currentView, selectedSiteId, pagesData, sites, singleAuditPageUrl, analysisReturnView]);

  useEffect(() => {
    // If the view is results, we make sure that findings and tasks are populated for the selected site
    if (viewParam === 'results' && selectedSiteId) {
      const site = sites.find(s => s.id === selectedSiteId);
      if (site) {
        const sitePages = pagesData[selectedSiteId] || [];
        const { findings, tasks } = getFindingsAndTasksForSite(selectedSiteId, sitePages, site.url, site.name);

        setAuditFindings(findings);
        const initialSelectedId = findingParam && findings.some(f => f.findingId === findingParam) 
          ? findingParam 
          : (findings.length > 0 ? findings[0].findingId : null);
        setSelectedFindingId(initialSelectedId);
        setSites(prevSites => prevSites.map(s => {
          if (s.id === selectedSiteId) {
            return {
              ...s,
              lastAudit: s.lastAudit || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              tasks: tasks
            };
          }
          return s;
        }));
        setReviewPageUrl("/bathroom-installation/");
      }
    }
  }, [viewParam, selectedSiteId, pagesData, sites, findingParam]);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4000);
  };

  const getConfigStatusText = (siteId) => {
    if (!pagesData[siteId]) return "Requires Setup";
    const total = pagesData[siteId].length;
    const unconfigured = pagesData[siteId].filter(p => p.status === "Unconfigured").length;
    const configured = pagesData[siteId].filter(p => p.status === "Configured").length;
    if (unconfigured === 0) return "Configured";
    if (configured > 0) return "Partially Configured";
    return "Requires Setup";
  };

  const getConfigStatusColor = (siteId) => {
    if (!pagesData[siteId]) return "#f87171";
    const unconfigured = pagesData[siteId].filter(p => p.status === "Unconfigured").length;
    if (unconfigured === 0) return "#34d399";
    return "#fbbf24";
  };



  const handleOpenConfigModal = (page) => {
    setModalMode("edit");
    setEditingPage(page);
    setInputPageUrl(page.pageUrl);
    setInputPageTitle(page.pageTitle);
    setInputProposedPageTitle(page.proposedPageTitle || page.pageTitle || "");
    setInputTargetPhrase(page.targetPhrase || "");
    
    // Normalize and set inputPageType from page.assignedType
    const importedType = page.assignedType || "";
    let pageTypeVal = "Supporting Page";
    if (importedType) {
      const lower = importedType.toLowerCase();
      if (lower.includes("hub")) {
        pageTypeVal = "Hub Page";
      } else if (lower.includes("primary") || lower.includes("landing")) {
        pageTypeVal = "Landing Page";
      } else if (lower.includes("supporting")) {
        pageTypeVal = "Supporting Page";
      } else if (lower.includes("topical")) {
        pageTypeVal = "Topical Page";
      }
    }
    setInputPageType(pageTypeVal);
    
    // Set parent page input state
    if (page.parentPage !== undefined) {
      setInputParentPage(page.parentPage);
    } else {
      if (page.pageUrl === "/") {
        setInputParentPage("");
      } else {
        setInputParentPage("/"); // Default to Homepage for all pages
      }
    }
    
    setIsConfigModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingPage(null);
    setInputPageUrl("");
    setInputPageTitle("");
    setInputProposedPageTitle("");
    setInputTargetPhrase("");
    setInputPageType("Supporting Page");
    setInputParentPage("/"); // Default to Homepage
    setIsConfigModalOpen(true);
  };

  const handleSavePageConfig = () => {
    if (!selectedSiteId) return;

    if (modalMode === "add") {
      if (!inputPageUrl) {
        showNotification("Page URL is required!");
        return;
      }
      
      let formattedUrl = inputPageUrl.trim();
      if (!formattedUrl.startsWith("/")) formattedUrl = "/" + formattedUrl;
      if (!formattedUrl.endsWith("/")) formattedUrl = formattedUrl + "/";

      setPagesData(prev => {
        // Prevent duplicate URL (only for non-Magento sites since multiple Magento stores can share homepages/pages)
        const isMagento = selectedSite?.platform === "Magento";
        if (!isMagento && prev[selectedSiteId].some(p => p.pageUrl === formattedUrl)) {
          showNotification("Page URL already exists!");
          return prev;
        }

        const calculatedPriority = inputPageType === "Hub Page" ? 1
                                 : inputPageType === "Landing Page" ? 2
                                 : inputPageType === "Supporting Page" ? 3
                                 : inputPageType === "Topical Page" ? 4
                                 : inputPageType === "Excluded" ? 0
                                 : 3;
        const newPage = {
          pageUrl: formattedUrl,
          wpPostId: isMagento ? `magento-manual-${Date.now()}` : undefined,
          pageTitle: inputPageTitle.trim() || "Untitled Page",
          proposedPageTitle: inputProposedPageTitle.trim() || inputPageTitle.trim() || "Untitled Page",
          targetPhrase: inputTargetPhrase.trim(),
          assignedType: inputPageType,
          parentPage: "/",
          status: "Planned",
          priority: calculatedPriority,
          lastModifiedDate: new Date().toISOString().split('T')[0]
        };

        showNotification(`Added planned page ${formattedUrl}`);
        return {
          ...prev,
          [selectedSiteId]: [...prev[selectedSiteId], newPage]
        };
      });
    } else {
      if (!editingPage) return;

      const isMagento = selectedSite?.platform === "Magento";
      setPagesData(prev => {
        const updatedSitePages = prev[selectedSiteId].map(p => {
          const isMatch = isMagento && editingPage.wpPostId
            ? p.wpPostId === editingPage.wpPostId
            : p.pageUrl === editingPage.pageUrl;
          if (isMatch) {
            const hasTarget = !!inputTargetPhrase.trim();
            // If it was Planned, it remains Planned. If it was Configured/Unconfigured, update based on TargetPhrase presence.
            const updatedStatus = p.status === "Planned" ? "Planned" : (hasTarget ? "Configured" : "Unconfigured");
            const calculatedPriority = inputPageType === "Hub Page" ? 1
                                     : inputPageType === "Landing Page" ? 2
                                     : inputPageType === "Supporting Page" ? 3
                                     : inputPageType === "Topical Page" ? 4
                                     : inputPageType === "Excluded" ? 0
                                     : 3;
            return {
              ...p,
              pageTitle: p.pageTitle, // Keep existing imported Page Title
              proposedPageTitle: inputProposedPageTitle.trim() || p.pageTitle,
              targetPhrase: inputTargetPhrase.trim(),
              assignedType: inputPageType,
              parentPage: "/",
              priority: calculatedPriority,
              status: updatedStatus
            };
          }
          return p;
        });
        return {
          ...prev,
          [selectedSiteId]: updatedSitePages
        };
      });
      showNotification(`Updated configuration for ${editingPage.pageUrl}`);
    }
    
    setIsConfigModalOpen(false);
    setEditingPage(null);
  };

  const handleImportPages = async (siteId) => {
    const site = sites.find(s => s.id === siteId);
    if (!site) {
      showNotification("Error: Website not found.");
      return;
    }

    const hasCredentials = !!site.credentials?.username && !!site.credentials?.password;

    if (!hasCredentials) {
      showNotification("Error: Credentials not found. Please reconnect the website to set credentials.");
      return;
    }

    setIsImporting(true);
    showNotification(`Connecting to TSE Exporter for "${site.name}"...`);
    
    const nowStr = new Date().toLocaleString();
    const success = await handleSyncWebsitePages(
      site.id, 
      site.url, 
      site.credentials.username, 
      site.credentials.password,
      site.platform
    );

    setSites(prev => prev.map(s => {
      if (s.id === siteId) {
        return {
          ...s,
          lastSync: nowStr,
          lastSuccessfulSync: success ? nowStr : (s.lastSuccessfulSync || "Never")
        };
      }
      return s;
    }));

    setIsImporting(false);
  };

  const handleRebuildInternalLinks = async (siteId) => {
    if (!siteId) return;
    setIsImporting(true);
    showNotification("Rebuilding internal links dataset...");
    try {
      const site = sites.find(s => s.id === siteId);
      const cleanUrl = site ? site.url.trim().replace(/\/+$/, "") : "";
      const prevPages = pagesData[siteId] || [];

      const updatedPagesWithAudits = await rebuildInternalLinksData(prevPages, site, cleanUrl, siteId);

      // Save updated pages to backend database
      const saveResponse = await fetch(`${API_BASE}/pages-data/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, pages: updatedPagesWithAudits })
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save pages to the database backend.");
      }

      setPagesData(prev => ({
        ...prev,
        [siteId]: updatedPagesWithAudits
      }));

      showNotification("Internal links successfully rebuilt!");
    } catch (err) {
      console.error("Rebuild error:", err);
      showNotification(`Rebuild Failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveWebsiteConfig = () => {
    if (!selectedSiteId) return;
    setSites(prevSites => prevSites.map(s => {
      if (s.id === selectedSiteId) {
        return {
          ...s,
          portfolio: sitePortfolio,
          platform: sitePlatform,
          elementorEnabled: siteElementorEnabled
        };
      }
      return s;
    }));
    showNotification("Website settings saved successfully!");
  };

  const handleExportData = () => {
    try {
      const dataToExport = {
        sites: sites,
        pagesData: pagesData
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "tse_connected_websites_backup.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showNotification("Successfully exported connected websites and configuration.");
    } catch (error) {
      showNotification("Failed to export backup: " + error.message);
    }
  };

  const handleImportData = () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const parsed = JSON.parse(e.target.result);
            if (!parsed.sites || !parsed.pagesData) {
              showNotification("Invalid backup format. Must contain sites and pagesData.");
              return;
            }

            setSites(parsed.sites);
            setPagesData(parsed.pagesData);

            try {
              localStorage.setItem("tse_sites_data", JSON.stringify(parsed.sites));
            } catch (e) {
              console.warn("localStorage quota exceeded for sites data on import:", e.message);
            }
            try {
              localStorage.setItem("tse_pages_data", JSON.stringify(parsed.pagesData));
            } catch (e) {
              console.warn("localStorage quota exceeded for pages data on import:", e.message);
            }

            showNotification("Successfully imported connected websites and configuration.");
          } catch (error) {
            showNotification("Failed to parse backup JSON: " + error.message);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    } catch (error) {
      showNotification("Failed to initiate import: " + error.message);
    }
  };



  const handleStartTask = (taskId) => {
    const rawTask = selectedSite.tasks.find(t => t.id === taskId);
    if (rawTask) {
      const task = getEnrichedTask(rawTask);
      setSelectedTaskId(taskId);
      setEditingContent(task.currentVersion);
      setVerificationStatus("idle");
      setVerificationError("");
      setCurrentView("TASK_FOCUS");
    }
  };

  const handleOpenWordPressEditor = () => {
    if (activeTask) {
      setSites(prevSites => prevSites.map(s => {
        if (s.id === selectedSiteId) {
          const updatedTasks = s.tasks.map(t => {
            if (t.id === activeTask.id) {
              return { ...t, state: "progress", assignee: t.assignee || "Sarah" };
            }
            return t;
          });
          return { ...s, tasks: updatedTasks };
        }
        return s;
      }));
      setEditingContent(activeTask.currentVersion);
      setVerificationStatus("idle");
      setVerificationError("");
      setCurrentView("EDIT");
    }
  };

  const handleFixIssueDirectly = (pageUrl, targetPhrase, failItem, site) => {
    const relUrl = getRelativeUrl(pageUrl, site.url);
    
    if (failItem.item === "Internal Link Count") {
      setExpandedLinkRows({ [relUrl]: true });
      setCurrentView("WEBSITES_INTERNAL_LINKING");
      return;
    }
    
    // Find if task exists
    let existingTask = site.tasks.find(t => {
      const tRel = getRelativeUrl(t.pageUrl, site.url);
      return tRel === relUrl && t.taskTitle.toLowerCase().includes(failItem.item.toLowerCase());
    });

    if (!existingTask) {
      // Create on the fly
      const nextTaskId = `t-${site.id}-dyn-${Date.now()}`;
      const sitePages = pagesData[site.id] || [];
      const pageObj = sitePages.find(p => p.pageUrl === relUrl);

      // Generate a temporary task to evaluate the correct recommendation
      const tempTask = {
        taskTitle: `Missing/Optimizable ${failItem.item === "Title Tag" ? "Meta Title" : failItem.item}`,
        targetPhrase: targetPhrase || "None"
      };
      const { required } = getComparisonContent(tempTask, pageObj);

      const newTask = {
        id: nextTaskId,
        taskId: nextTaskId,
        website: site.name,
        pageUrl: site.url.replace(/\/+$/, "") + relUrl,
        pageTitle: failItem.item,
        targetPhrase: targetPhrase || "None",
        keyword: targetPhrase || "None",
        taskSource: "Page Auditor",
        source: "Page Auditor",
        issueType: "Content Audit",
        issueDescription: failItem.action,
        issueFound: failItem.action,
        priority: failItem.item === "H1" || failItem.item === "Title Tag" ? "High" : "Medium",
        status: "Open",
        state: "progress",
        assignedTo: "Sarah",
        assignee: "Sarah",
        verificationMethod: "Page Auditor verifies page structure",
        successCheck: "Page Auditor will verify automatically.",
        createdDate: new Date().toISOString().split('T')[0],
        completedDate: null,
        taskTitle: `Missing/Optimizable ${failItem.item === "Title Tag" ? "Meta Title" : failItem.item}`,
        currentVersion: failItem.current || "Standard",
        requiredVersion: required || failItem.action || "Optimized",
        whyItMatters: "General on-page SEO improvement."
      };

      const updatedTasks = [...site.tasks, newTask];
      setSites(prev => prev.map(s => s.id === site.id ? { ...s, tasks: updatedTasks } : s));

      setSelectedTaskId(nextTaskId);
      setEditingContent(required || failItem.action || "");
      setVerificationStatus("idle");
      setVerificationError("");
      setCurrentView("EDIT");
    } else {
      // Mark as progress
      setSites(prev => prev.map(s => {
        if (s.id === site.id) {
          const updatedTasks = s.tasks.map(t => {
            if (t.id === existingTask.id) {
              return { ...t, state: "progress", assignee: t.assignee || "Sarah" };
            }
            return t;
          });
          return { ...s, tasks: updatedTasks };
        }
        return s;
      }));

      setSelectedTaskId(existingTask.id);
      
      const sitePages = pagesData[site.id] || [];
      const pageObj = sitePages.find(p => p.pageUrl === relUrl);
      const enriched = getEnrichedTask(existingTask);
      const { required } = getComparisonContent(enriched, pageObj);

      setEditingContent(required || failItem.action || "");
      setVerificationStatus("idle");
      setVerificationError("");
      setCurrentView("EDIT");
    }
  };

  const handleInsertLinkToSourcePage = (destinationPage, rec, sentence) => {
    const sourcePage = rec.srcPageObject;
    if (!sourcePage) {
      showNotification("Source page details are not available.");
      return;
    }

    // 1. Copy sentence to clipboard
    copySentenceHtml(sentence, () => {
      showNotification("Copied internal link sentence to clipboard!");
    });

    // 2. Open correct WordPress page for editing
    let wpPostId = sourcePage.wpPostId;
    if (!wpPostId) {
      const siteExport = exporterData[selectedSite.id];
      if (siteExport && siteExport.pages) {
        const matched = siteExport.pages.find(p => getRelativeUrl(p.pageUrl, selectedSite.url) === getRelativeUrl(sourcePage.pageUrl, selectedSite.url));
        if (matched) {
          wpPostId = matched.wpPostId || matched.id;
        }
      }
    }

    if (wpPostId) {
      const isElementor = !!selectedSite.elementorEnabled;
      const wpBaseUrl = selectedSite.url.replace(/\/+$/, "");
      const editorAction = isElementor ? "elementor" : "edit";
      const editorUrl = `${wpBaseUrl}/wp-admin/post.php?post=${wpPostId}&action=${editorAction}`;
      window.open(editorUrl, '_blank');
    } else {
      showNotification("Could not find WordPress post ID for source page.");
    }

    const currentBody = sourcePage.crawlData?.bodyContent || sourcePage.crawlData?.plainText || "";
    const fullBodyContent = currentBody + (currentBody ? "\n\n" : "") + sentence;
    const nextTaskId = `t-${selectedSite.id}-lnk-ins-${Date.now()}`;

    const newTask = {
      id: nextTaskId,
      taskId: nextTaskId,
      website: selectedSite.name,
      pageUrl: selectedSite.url.replace(/\/+$/, "") + sourcePage.pageUrl,
      pageTitle: sourcePage.pageTitle,
      targetPhrase: destinationPage.targetPhrase || "None",
      keyword: destinationPage.targetPhrase || "None",
      taskSource: "Internal Link Review",
      source: "Internal Link Review",
      issueType: "Internal Linking",
      issueDescription: `Insert internal link to ${destinationPage.pageUrl} with anchor "${rec.recommendedAnchor}"`,
      issueFound: `Missing internal link to ${destinationPage.pageUrl}`,
      priority: "Medium",
      status: "Open",
      state: "progress",
      assignedTo: "Sarah",
      assignee: "Sarah",
      verificationMethod: "Page Auditor verifies link presence",
      successCheck: "Page Auditor verifies link presence",
      createdDate: new Date().toISOString().split('T')[0],
      completedDate: null,
      taskTitle: `Insert internal link to ${destinationPage.pageUrl}`,
      currentVersion: currentBody,
      requiredVersion: fullBodyContent,
      whyItMatters: "Contextual internal links pass SEO value and help indexing.",
      destinationPageUrl: destinationPage.pageUrl
    };

    setSites(prev => prev.map(s => {
      if (s.id === selectedSite.id) {
        const updatedTasks = [...(s.tasks || []), newTask];
        return { ...s, tasks: updatedTasks };
      }
      return s;
    }));

    setSelectedTaskId(nextTaskId);
    setEditingContent(fullBodyContent);
    setVerificationStatus("idle");
    setVerificationError("");
    setCurrentView("EDIT");
  };

  const handleMarkInProgress = (taskId) => {
    setSites(prevSites => prevSites.map(s => {
      if (s.id === selectedSiteId) {
        const updatedTasks = s.tasks.map(t => {
          if (t.id === taskId) {
            return { ...t, state: "progress", assignee: t.assignee || "Sarah" };
          }
          return t;
        });
        return { ...s, tasks: updatedTasks };
      }
      return s;
    }));
    showNotification("Task marked as In Progress.");
  };

  const handleAssignToMe = (taskId) => {
    setSites(prevSites => prevSites.map(s => {
      if (s.id === selectedSiteId) {
        const updatedTasks = s.tasks.map(t => {
          if (t.id === taskId) {
            return { ...t, state: "progress", assignee: "Sarah" };
          }
          return t;
        });
        return { ...s, tasks: updatedTasks };
      }
      return s;
    }));
    showNotification("Task assigned to Sarah and status changed to In Progress.");
  };

  // Auto-paste suggestion for staff
  const handleApplySuggestion = () => {
    if (activeTask) {
      setEditingContent(activeTask.requiredVersion);
      showNotification("Suggested content copied into editor!");
    }
  };

  const handleVerifyChange = async () => {
    if (!activeTask || !selectedSite) return;
    
    setVerificationStatus("loading");
    setVerificationError("");
    
    try {
      const cleanUrl = selectedSite.url.replace(/\/+$/, "");
      const cleanRelativeUrl = getRelativeUrl(activeTask.pageUrl, selectedSite.url);
      const sitePages = pagesData[selectedSite.id] || [];
      const targetPage = sitePages.find(p => p.pageUrl === cleanRelativeUrl);
      
      // 1. Resolve WordPress Post ID (fallback to dynamic fetching if missing from page model)
      let wpPostId = targetPage ? targetPage.wpPostId : null;
      const wpUsername = selectedSite.credentials?.username || "";
      const wpPassword = selectedSite.credentials?.password || "";
      const credentials = window.btoa(wpUsername.trim() + ":" + wpPassword.trim());
      
      if (!wpPostId) {
        console.log("wpPostId not found in page object. Fetching export to resolve ID...");
        const exportEndpoint = `${cleanUrl}/wp-json/tse-site-exporter/v1/export`;
        const res = await fetchThroughProxy(exportEndpoint, {
          headers: { "Authorization": `Basic ${credentials}` }
        });
        if (!res.ok) {
          throw new Error(`WordPress connection check failed: status ${res.status}`);
        }
        const data = await res.json();
        const records = data["full-export.json"] || [];
        const match = records.find(r => getRelativeUrl(r.url, cleanUrl) === cleanRelativeUrl);
        if (match) {
          wpPostId = match.id;
        } else {
          throw new Error(`Could not find matching page for path "${cleanRelativeUrl}" in WordPress export.`);
        }
      }
      
      // 2. Map task title to WordPress field
      let wpField = "";
      const taskTitle = activeTask.taskTitle.toLowerCase();
      if (taskTitle.includes("meta description")) {
        wpField = "meta_description";
      } else if (taskTitle.includes("h1")) {
        wpField = "h1";
      } else if (taskTitle.includes("title tag") || taskTitle.includes("title phrase") || taskTitle.includes("meta title")) {
        wpField = "seo_title";
      } else if (taskTitle.includes("internal link") || taskTitle.includes("body content")) {
        wpField = "body_content";
      } else {
        throw new Error(`Unsupported task type for WordPress update: "${activeTask.taskTitle}"`);
      }
      
      // Only push update to WordPress if NOT an internal link task (which is edited manually by the user)
      if (wpField !== "body_content") {
        console.log(`Pushing update to WordPress: post_id=${wpPostId}, field=${wpField}`);
        
        // 3. Save changes via POST /update-page
        const updateEndpoint = `${cleanUrl}/wp-json/tse-site-exporter/v1/update-page`;
        const updateRes = await fetchThroughProxy(updateEndpoint, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${credentials}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            post_id: wpPostId,
            field: wpField,
            value: editingContent
          })
        });
        
        if (!updateRes.ok) {
          const errData = await updateRes.json().catch(() => ({}));
          throw new Error(errData.message || `WordPress update failed with status ${updateRes.status}`);
        }
      }
      
      // 4. Sync ONLY this page's crawl data from WordPress
      console.log("Fetching updated page export from WordPress...");
      const exportEndpoint = `${cleanUrl}/wp-json/tse-site-exporter/v1/export`;
      const exportRes = await fetchThroughProxy(exportEndpoint, {
        headers: { "Authorization": `Basic ${credentials}` }
      });
      if (!exportRes.ok) {
        throw new Error("Failed to pull updated WordPress export.");
      }
      const exportData = await exportRes.json();
      const records = exportData["full-export.json"] || [];
      const record = records.find(r => getRelativeUrl(r.url, cleanUrl) === cleanRelativeUrl);
      
      if (!record) {
        throw new Error("Could not find the updated page record in WordPress export list.");
      }
      
      // 5. Update only this page's crawlData
      const updatedCrawlData = {
        h1: record.content?.h1 || "",
        wordCount: record.content?.word_count || 0,
        metaDescription: record.seo?.description || "",
        bodyContent: record.content?.body_content || record.content?.plain_text || ""
      };
      
      const updatedPageObj = {
        ...targetPage,
        wpPostId: record.id,
        pageTitle: record.seo?.title || record.content?.h1 || record.slug || "/",
        lastModifiedDate: record.modified_at || "",
        crawlData: updatedCrawlData
      };
      
      // 6. Re-run Page Audit for only this page
      console.log("Re-running Page Audit...");
      const newAuditResults = runPageAudit(
        updatedPageObj.pageUrl,
        updatedPageObj.targetPhrase,
        updatedPageObj.pageTitle,
        selectedSite.id,
        updatedPageObj
      );
      
      const finalizedPageObj = {
        ...updatedPageObj,
        latestAudit: {
          timestamp: new Date().toISOString(),
          results: newAuditResults
        }
      };
      
      let updatedSitePages = sitePages.map(p => p.pageUrl === cleanRelativeUrl ? finalizedPageObj : p);
      
      // If it is an internal link task, also update the destination page's link count and incoming anchors list
      if (wpField === "body_content" && activeTask.destinationPageUrl) {
        const destRelativeUrl = getRelativeUrl(activeTask.destinationPageUrl, selectedSite.url);
        const anchorMatch = activeTask.issueDescription.match(/with anchor "([^"]+)"/);
        const anchorText = anchorMatch ? anchorMatch[1] : (activeTask.targetPhrase || "keyword");
        
        updatedSitePages = updatedSitePages.map(p => {
          if (getRelativeUrl(p.pageUrl, selectedSite.url) === destRelativeUrl) {
            const currentIncomingAnchors = p.crawlData?.incomingAnchors || [];
            const updatedIncomingAnchors = [...currentIncomingAnchors, { anchor: anchorText, count: 1, sourcePageUrl: activeTask.pageUrl }];
            
            const currentLinkCount = typeof p.crawlData?.internalLinkCount === 'number' 
              ? p.crawlData.internalLinkCount 
              : 0;
              
            const updatedCrawl = {
              ...(p.crawlData || {}),
              internalLinkCount: currentLinkCount + 1,
              incomingAnchors: updatedIncomingAnchors
            };
            
            const updatedPage = {
              ...p,
              crawlData: updatedCrawl
            };
            
            const destAuditResults = runPageAudit(
              updatedPage.pageUrl,
              updatedPage.targetPhrase,
              updatedPage.pageTitle,
              selectedSite.id,
              updatedPage
            );
            
            return {
              ...updatedPage,
              latestAudit: {
                timestamp: new Date().toISOString(),
                results: destAuditResults
              }
            };
          }
          return p;
        });
      }
      
      // Save updated pages to database
      await fetch(`${API_BASE}/pages-data/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: selectedSite.id, pages: updatedSitePages })
      });
      
      // Update pagesData state
      setPagesData(prev => ({
        ...prev,
        [selectedSite.id]: updatedSitePages
      }));
      
      // 7. Check if the issue is now resolved
      const findings = generateFindingsForPage(finalizedPageObj, selectedSite.url, selectedSite.id);
      const isIssueStillActive = findings.some(f => matchFindingType(f.findingType, activeTask.taskTitle));
      
      if (!isIssueStillActive) {
        setVerificationStatus("success");
        
        // Update task state statically to completed in the sites state (so it is saved to DB for tasks)
        setSites(prevSites => prevSites.map(s => {
          if (s.id === selectedSite.id) {
            const updatedTasks = s.tasks.map(t => {
              if (t.id === activeTask.id) {
                return { ...t, state: "completed", currentVersion: editingContent };
              }
              return t;
            });
            return { ...s, tasks: updatedTasks };
          }
          return s;
        }));
        
        showNotification("Verification passed! Task complete.");
      } else {
        setVerificationStatus("fail");
        setVerificationError(`Verification Failed. The page content still does not meet the Page Audit requirements for "${activeTask.taskTitle}".`);
        showNotification(`Verification Failed. Issue is still unresolved.`);
        setCurrentView("TASK_FOCUS");
      }
    } catch (err) {
      console.error("Verification failed:", err);
      setVerificationStatus("fail");
      setVerificationError(err.message || "An unexpected error occurred during verification.");
    }
  };

  const handleNextTask = () => {
    if (!selectedSite) return;
    
    // Find next incomplete task in the backlog list for the current website
    const incompleteTasks = selectedSite.tasks.filter(t => t.state !== "completed" && t.id !== selectedTaskId);
    
    if (incompleteTasks.length > 0) {
      // Prioritize High -> Medium -> Low
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      incompleteTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      
      const rawNextTask = incompleteTasks[0];
      const nextTask = getEnrichedTask(rawNextTask);
      setSelectedTaskId(nextTask.id);
      setEditingContent(nextTask.currentVersion);
      setVerificationStatus("idle");
      setVerificationError("");
      setCurrentView("TASK_FOCUS");
    } else {
      // All tasks complete for this site
      showNotification(`All tasks completed for ${selectedSite.name}!`);
      setCurrentView("CONNECTED_SITES");
    }
  };

  // Helper metrics
  const getOpenTasksCount = (site) => {
    return site.tasks.filter(t => t.state !== "completed").length;
  };

  const renderTaskCard = (task) => {
    const isCompleted = task.state === "completed";
    const isInProgress = task.state === "progress";
    
    const sitePages = pagesData[selectedSiteId] || [];
    const relUrl = getRelativeUrl(task.pageUrl, selectedSite?.url);
    const pageObj = sitePages.find(p => p.pageUrl === relUrl);
    const targetPhrase = task.targetPhrase || pageObj?.targetPhrase || "None";

    const assigneeName = task.assignee || "Unassigned";
    const statusText = isCompleted ? "Completed" : isInProgress ? "In Progress" : task.assignee ? "Assigned" : "Unassigned";

    return (
      <div key={task.id} className={`task-card-item ${isCompleted ? 'completed' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-color)', marginBottom: '1rem', transition: 'all 0.2s ease', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', display: 'inline-block', marginBottom: '0.4rem' }}>
              {task.source || "Site Auditor"}
            </span>
            <h4 className="card-task-title" style={{ textDecoration: isCompleted ? 'line-through' : 'none', color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)', fontSize: '1rem', margin: 0, fontWeight: 700 }}>
              {isCompleted ? '✓ ' : isInProgress ? '⌛ ' : '□ '}{task.taskTitle}
            </h4>
          </div>
          <div className="card-item-action">
            {isCompleted ? (
              <span className="score-change-badge change-positive" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>✓ Closed</span>
            ) : (
              <button className="btn-primary btn-sm" onClick={() => handleStartTask(task.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}>
                {isInProgress ? "Resume" : "Start Work"} <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Task Source Tracking Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.5rem', fontSize: '0.8rem' }}>
          <div>
            <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Page URL</span>
            <span style={{ fontFamily: 'monospace', color: '#60a5fa', fontWeight: 600, wordBreak: 'break-all' }}>{relUrl}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Target Phrase</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{targetPhrase}</span>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Issue Found</span>
          <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>{task.issueFound || task.whyItMatters}</span>
        </div>

        {/* Assignment & Status tags */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.5rem', fontSize: '0.8rem' }}>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>Assigned To: </span>
            <strong style={{ color: task.assignee ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{assigneeName}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>Status: </span>
            <span style={{
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.1)' : isInProgress ? 'rgba(251, 191, 36, 0.1)' : task.assignee ? 'rgba(96, 165, 250, 0.1)' : 'rgba(255,255,255,0.05)',
              color: isCompleted ? '#34d399' : isInProgress ? '#fbbf24' : task.assignee ? '#60a5fa' : 'var(--text-secondary)'
            }}>
              {statusText}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Stepper state mapping
  const getStepperStep = () => {
    if (currentView === "TASK_FOCUS") return "fix";
    if (currentView === "EDIT") {
      if (verificationStatus === "success") return "verify";
      return "fix";
    }
    return "website";
  };

  const renderPlatformSidebar = (currentActiveMenu) => {
    return (
      <aside style={{
        width: '280px',
        backgroundColor: '#0c101b',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '2.5rem 1.75rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        height: '100vh',
        position: 'sticky',
        top: 0,
        textAlign: 'left',
        flexShrink: 0
      }}>
        <div>
          {/* Logo Brand */}
          <div 
            onClick={() => setActiveApp("DASHBOARD")}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '2px', 
              cursor: 'pointer',
              marginBottom: '2.5rem'
            }}
          >
            <h1 style={{ 
              fontFamily: 'Outfit, sans-serif', 
              fontSize: '2rem', 
              fontWeight: 900, 
              color: 'var(--text-primary)', 
              margin: 0,
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              TSE
            </h1>
            <span style={{ 
              fontSize: '0.7rem', 
              fontWeight: 800, 
              color: '#34d399', 
              textTransform: 'uppercase', 
              letterSpacing: '0.15em' 
            }}>
              Apps Platform
            </span>
          </div>

          {/* Navigation Menu */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '2.5rem' }}>
            {/* Apps Dashboard */}
            <button
              onClick={() => setActiveApp("DASHBOARD")}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                background: currentActiveMenu === "DASHBOARD" ? 'rgba(16, 185, 129, 0.08)' : 'none',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 14px',
                color: currentActiveMenu === "DASHBOARD" ? '#34d399' : 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (currentActiveMenu !== "DASHBOARD") e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                if (currentActiveMenu !== "DASHBOARD") e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <Home size={18} />
              Apps Dashboard
            </button>

            {/* Website Management */}
            <button
              onClick={() => setActiveApp("WEBSITE_MANAGEMENT")}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                background: currentActiveMenu === "WEBSITE_MANAGEMENT" ? 'rgba(16, 185, 129, 0.08)' : 'none',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 14px',
                color: currentActiveMenu === "WEBSITE_MANAGEMENT" ? '#34d399' : 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (currentActiveMenu !== "WEBSITE_MANAGEMENT") e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                if (currentActiveMenu !== "WEBSITE_MANAGEMENT") e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <Globe size={18} />
              Website Management
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                setActiveApp("WEBSITE_MANAGEMENT");
                setCurrentView("SETTINGS");
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                background: currentActiveMenu === "SETTINGS" ? 'rgba(16, 185, 129, 0.08)' : 'none',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 14px',
                color: currentActiveMenu === "SETTINGS" ? '#34d399' : 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (currentActiveMenu !== "SETTINGS") e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                if (currentActiveMenu !== "SETTINGS") e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <Sliders size={18} />
              Settings
            </button>

            {/* Activity Log */}
            <button
              onClick={() => setActiveApp("ACTIVITY_LOG_PLATFORM")}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                background: currentActiveMenu === "ACTIVITY_LOG" ? 'rgba(16, 185, 129, 0.08)' : 'none',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 14px',
                color: currentActiveMenu === "ACTIVITY_LOG" ? '#34d399' : 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (currentActiveMenu !== "ACTIVITY_LOG") e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                if (currentActiveMenu !== "ACTIVITY_LOG") e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <Activity size={18} />
              Activity Log
            </button>
          </nav>

          {/* Quick Actions */}
          <div style={{ marginBottom: '2rem' }}>
            <span style={{ 
              display: 'block', 
              fontSize: '0.7rem', 
              fontWeight: 800, 
              color: 'rgba(255, 255, 255, 0.3)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em',
              marginBottom: '10px',
              paddingLeft: '14px'
            }}>
              Quick Actions
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                onClick={() => {
                  setActiveApp("WEBSITE_MANAGEMENT");
                  setIsAddWebsiteModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <Plus size={16} />
                Add Website
              </button>
              <button
                onClick={() => {
                  setActiveApp("WEBSITE_MANAGEMENT");
                  setCurrentView("CONNECTED_SITES");
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <Play size={16} />
                Run New Audit
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div>
          {/* Help Card */}
          <div 
            onClick={() => setActiveApp("HELP_PLATFORM")}
            style={{
              backgroundColor: '#07090b',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '12px',
              cursor: 'pointer',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <HelpCircle size={18} style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Need Help?</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>View docs or contact support.</span>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          </div>

          {/* User Profile */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                MM
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Mac McCarthy</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Administrator</span>
              </div>
            </div>
            <ChevronDown size={16} style={{ color: 'var(--text-secondary)' }} />
          </div>
        </div>
      </aside>
    );
  };

  const renderStatsPanel = () => {
    return (
      <div style={{
        backgroundColor: '#0c101b',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '12px',
        padding: '1.25rem 2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '24px',
        marginBottom: '3rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        {/* Stat 1: Total Apps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399'
          }}>
            <LayoutGrid size={20} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Apps</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', lineHeight: 1.2 }}>6</span>
            <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700 }}>All systems</span>
          </div>
        </div>

        {/* Stat 2: Live Apps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '1px solid rgba(255, 255, 255, 0.06)', paddingLeft: '24px', textAlign: 'left' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#60a5fa'
          }}>
            <Rocket size={20} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Live Apps</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', lineHeight: 1.2 }}>3</span>
            <span style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: 700 }}>Ready to use</span>
          </div>
        </div>

        {/* Stat 3: In Development */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '1px solid rgba(255, 255, 255, 0.06)', paddingLeft: '24px', textAlign: 'left' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24'
          }}>
            <Code size={20} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>In Development</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', lineHeight: 1.2 }}>3</span>
            <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 700 }}>Building</span>
          </div>
        </div>

        {/* Stat 4: Last Updated */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '1px solid rgba(255, 255, 255, 0.06)', paddingLeft: '24px', textAlign: 'left' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a78bfa'
          }}>
            <Calendar size={20} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Last Updated</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', lineHeight: 1.2 }}>Today</span>
            <span style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: 700 }}>10:24 AM</span>
          </div>
        </div>
      </div>
    );
  };

  const renderAppCard = ({ name, description, status, version, appId, accentColor, IconComponent, launchUrl }) => {
    const isLive = status === "Live";
    const isDev = status === "Development";
    
    // Accent-specific colors
    const badgeColor = isLive ? accentColor : '#fbbf24';
    const badgeBg = isLive ? `${accentColor}0a` : 'rgba(245, 158, 11, 0.08)';
    const badgeBorder = isLive ? `1px solid ${accentColor}25` : '1px solid rgba(245, 158, 11, 0.2)';
    
    return (
      <div 
        onClick={() => {
          if (launchUrl) {
            window.open(launchUrl, '_blank');
          } else {
            setActiveApp(appId);
          }
        }}
        style={{
          backgroundColor: '#0c101b',
          border: `1px solid rgba(255, 255, 255, 0.06)`,
          borderRadius: '12px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '270px',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          e.currentTarget.style.boxShadow = `0 12px 24px -8px ${accentColor}25, 0 4px 20px rgba(0,0,0,0.2)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
        }}
      >
        <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '1.25rem' }}>
            {/* Icon Wrapper (Increased from 42px to 48px) */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: `${accentColor}10`,
              border: `1px solid ${accentColor}25`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor,
              flexShrink: 0
            }}>
              {/* Increased Lucide Icon size from 20 to 22 */}
              <IconComponent size={22} />
            </div>

            {/* Title & Badge */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexGrow: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                <h3 style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {name}
                </h3>
                <span style={{
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  backgroundColor: badgeBg,
                  color: badgeColor,
                  border: badgeBorder,
                  flexShrink: 0
                }}>
                  {status}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            height: '4.2rem'
          }}>
            {description}
          </p>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          paddingTop: '1.25rem',
          marginTop: 'auto'
        }}>
          <span style={{ fontSize: '0.725rem', color: 'rgba(255, 255, 255, 0.35)', fontFamily: 'monospace' }}>
            {version}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (launchUrl) {
                window.open(launchUrl, '_blank');
              } else {
                setActiveApp(appId);
              }
            }}
            style={{
              backgroundColor: isLive ? accentColor : 'rgba(255,255,255,0.04)',
              color: isLive ? '#ffffff' : 'rgba(255,255,255,0.25)',
              border: isLive ? 'none' : '1px solid rgba(255,255,255,0.05)',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              if (isLive) {
                e.currentTarget.style.filter = 'brightness(1.1)';
              } else {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (isLive) {
                e.currentTarget.style.filter = 'none';
              } else {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.25)';
              }
            }}
          >
            {isLive ? (
              <>
                {launchUrl ? "Launch" : "Open App"}
                <ChevronRight size={14} />
              </>
            ) : "Coming Soon"}
          </button>
        </div>
      </div>
    );
  };

  const renderManagementCard = ({ title, subtitle, items, badge, accentColor, IconComponent, onClick, buttonText = "Open Module" }) => {
    return (
      <div 
        onClick={onClick}
        style={{
          backgroundColor: '#0c101b',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '380px',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          textAlign: 'left'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          e.currentTarget.style.boxShadow = `0 12px 24px -8px ${accentColor}25, 0 4px 20px rgba(0,0,0,0.2)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
        }}
      >
        <div>
          {/* Card Icon & Title Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.25rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: `${accentColor}10`,
              border: `1px solid ${accentColor}25`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor,
              flexShrink: 0
            }}>
              <IconComponent size={20} />
            </div>
            <h3 style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0
            }}>
              {title}
            </h3>
          </div>

          {/* Description */}
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            margin: '0 0 1.5rem 0'
          }}>
            {subtitle}
          </p>

          {/* Checklist Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '2rem' }}>
            {items.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: `${accentColor}12`,
                  border: `1px solid ${accentColor}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: accentColor,
                  flexShrink: 0
                }}>
                  <Check size={10} strokeWidth={3} />
                </div>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer elements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
          <button
            style={{
              width: '100%',
              backgroundColor: accentColor,
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
          >
            {buttonText}
            <ChevronRight size={14} />
          </button>
          <span style={{ 
            fontSize: '0.7rem', 
            fontWeight: 800, 
            color: accentColor, 
            letterSpacing: '0.05em', 
            textTransform: 'uppercase',
            textAlign: 'center',
            marginTop: '4px'
          }}>
            {badge}
          </span>
        </div>
      </div>
    );
  };

  const renderModuleNavigation = (activeModule) => {
    const modules = [
      { id: "W3", label: "W3 | Manage Pages", view: "WEBSITES_PAGE_MGMT" },
      { id: "W4", label: "W4 | Internal Linking", view: "WEBSITES_INTERNAL_LINKING" },
      { id: "W5", label: "W5 | Analysis", view: "WEBSITES_SITE_ANALYSIS" },
      { id: "W6", label: "W6 | Website Settings", view: "SETTINGS" }
    ];

    return (
      <div style={{ 
        display: 'flex', 
        gap: '24px', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)', 
        marginBottom: '2rem', 
        paddingBottom: '0.75rem',
        marginTop: '1rem'
      }}>
        {modules.map((m) => {
          const isActive = m.id === activeModule;
          return (
            <button
              key={m.id}
              onClick={() => setCurrentView(m.view)}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px 0 8px 0',
                fontSize: '0.9rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#10b981' : 'var(--text-secondary)',
                borderBottom: isActive ? '2px solid #10b981' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    );
  };

  const renderPlatformLayout = (activeMenu, contentJSX) => {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#07090e', color: 'var(--text-primary)', width: '100vw' }}>
        {renderPlatformSidebar(activeMenu)}
        <main style={{ flexGrow: 1, height: '100vh', overflowY: 'auto', boxSizing: 'border-box' }}>
          {contentJSX}
        </main>
      </div>
    );
  };

  if (activeApp === "DASHBOARD") {
    return renderPlatformLayout(
      "DASHBOARD",
      <div style={{ padding: '3.5rem 3rem', maxWidth: '1200px', margin: '0 auto', textAlign: 'left' }}>
        {/* Welcome Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Welcome back, Mac 👋
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.4rem', fontWeight: 500 }}>
              Launch and manage your marketing and auditing applications.
            </p>
          </div>
          <button
            className="btn-secondary"
            onClick={() => showNotification("App request submitted successfully!")}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
          >
            <Plus size={16} /> Request New App
          </button>
        </div>

        {/* Stats Row */}
        {renderStatsPanel()}

        {/* Apps Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Your Applications
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Access all your TSE applications from one place.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '6px', fontWeight: 600 }}>View:</span>
            <button style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '6px', borderRadius: '6px', color: '#34d399', cursor: 'pointer', outline: 'none' }}>
              <LayoutGrid size={16} />
            </button>
            <button style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.05)', padding: '6px', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none' }} onClick={() => showNotification("List view coming soon!")}>
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Apps Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          paddingBottom: '2rem'
        }}>
          {renderAppCard({
            name: "Website Management",
            description: "Manage connected websites, crawl pages, run phrase fits, and track SEO audits.",
            status: "Live",
            version: "v1.0.4",
            appId: "WEBSITE_MANAGEMENT",
            accentColor: "#10b981",
            IconComponent: Globe
          })}

          {renderAppCard({
            name: "Lead Generator",
            description: "Find local businesses, extract contact details and prepare websites for the Audit Engine.",
            status: "Live",
            version: "v1.0.0",
            appId: "LEAD_GENERATOR",
            accentColor: "#6366f1",
            IconComponent: Database,
            launchUrl: "http://localhost:5175/"
          })}

          {renderAppCard({
            name: "Chatza",
            description: "Real-time communication and video collaboration client.",
            status: "Live",
            version: "v1.0.0",
            appId: "CHATZA",
            accentColor: "#3b82f6",
            IconComponent: MessageSquare
          })}

          {renderAppCard({
            name: "WP Exporter",
            description: "WordPress site exporter plugin data manager and sync agent.",
            status: "Live",
            version: "v1.0.0",
            appId: "WP_EXPORTER",
            accentColor: "#8b5cf6",
            IconComponent: Download
          })}

          {renderAppCard({
            name: "Page Auditor",
            description: "Intelligent page-level SEO auditing and fitment engine.",
            status: "Live",
            version: "v0.8.0-dev",
            appId: "PAGE_AUDITOR",
            accentColor: "#f59e0b",
            IconComponent: Search
          })}

          {renderAppCard({
            name: "Site Auditor",
            description: "Comprehensive site-wide link, layout, and structure auditor.",
            status: "Development",
            version: "v0.5.0-dev",
            appId: "SITE_AUDITOR",
            accentColor: "#06b6d4",
            IconComponent: Network
          })}

          {renderAppCard({
            name: "Social Automation",
            description: "Automated social media posting, scheduling, and analytics agent.",
            status: "Development",
            version: "v0.1.0-dev",
            appId: "SOCIAL_AUTOMATION",
            accentColor: "#ec4899",
            IconComponent: Megaphone
          })}
        </div>
      </div>
    );
  }

  if (activeApp === "PAGE_AUDITOR") {
    return (
      <div className="hub-container">
        {notification && (
          <div style={{
            position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)",
            backgroundColor: "#10b981", color: "white", padding: "10px 20px",
            borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
            zIndex: 2000, fontWeight: "600", fontSize: "0.9rem", display: "flex",
            alignItems: "center", gap: "8px"
          }}>
            <CheckCircle size={16} /> {notification}
          </div>
        )}
        <header className="hub-header">
          <button 
            onClick={() => setActiveApp("DASHBOARD")}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              padding: '8px 12px',
              transition: 'all 0.2s ease',
              outline: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginRight: '12px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            ← Back to Dashboard
          </button>
          <div className="hub-brand" style={{ cursor: 'pointer' }}>
            <CheckSquare size={22} style={{ color: "var(--accent-color)" }} />
            <span>TSE Page Auditor</span>
          </div>
        </header>
        <main className="hub-main" style={{ padding: '0 2rem' }}>
          <PageAuditorApp />
        </main>
      </div>
    );
  }

  if (activeApp !== "WEBSITE_MANAGEMENT") {
    const getPlaceholderParams = () => {
      switch (activeApp) {
        case "LEAD_GENERATOR":
          return { activeMenu: "DASHBOARD", title: "Lead Generator", accent: "#6366f1", icon: Database, description: "Find local businesses, extract contact details and prepare websites for the Audit Engine.", statusText: "External Link" };
        case "CHATZA":
          return { activeMenu: "DASHBOARD", title: "Chatza", accent: "#3b82f6", icon: MessageSquare, description: "Real-time communication and video collaboration client.", statusText: "Coming Soon" };
        case "WP_EXPORTER":
          return { activeMenu: "DASHBOARD", title: "WP Exporter", accent: "#8b5cf6", icon: Download, description: "WordPress site exporter plugin data manager and sync agent.", statusText: "Coming Soon" };
        case "PAGE_AUDITOR":
          return { activeMenu: "DASHBOARD", title: "Page Auditor", accent: "#f59e0b", icon: Search, description: "Intelligent page-level SEO auditing and fitment engine.", statusText: "Under Development" };
        case "SITE_AUDITOR":
          return { activeMenu: "DASHBOARD", title: "Site Auditor", accent: "#06b6d4", icon: Network, description: "Comprehensive site-wide link, layout, and structure auditor.", statusText: "Under Development" };
        case "SOCIAL_AUTOMATION":
          return { activeMenu: "DASHBOARD", title: "Social Automation", accent: "#ec4899", icon: Megaphone, description: "Automated social media posting, scheduling, and analytics agent.", statusText: "Under Development" };
        case "SETTINGS_PLATFORM":
          return { activeMenu: "SETTINGS", title: "Platform Settings", accent: "#10b981", icon: Sliders, description: "Configure global TSE Apps Platform options and access keys.", statusText: "Settings Portal" };
        case "ACTIVITY_LOG_PLATFORM":
          return { activeMenu: "ACTIVITY_LOG", title: "Platform Activity Log", accent: "#10b981", icon: Activity, description: "Audit trail of user logins, application launches, and system operations.", statusText: "Activity Tracker" };
        case "HELP_PLATFORM":
          return { activeMenu: "DASHBOARD", title: "Help & Documentation", accent: "#10b981", icon: HelpCircle, description: "Search user guides, API definitions, and contact customer support.", statusText: "Support Center" };
        default:
          return { activeMenu: "DASHBOARD", title: "TSE Application", accent: "#10b981", icon: Globe, description: "This application is currently not active on this environment.", statusText: "System Warning" };
      }
    };

    const { activeMenu, title, accent, icon: PlaceholderIcon, description, statusText } = getPlaceholderParams();

    return renderPlatformLayout(
      activeMenu,
      <div style={{
        padding: '6rem 3rem',
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        gap: '24px'
      }}>
        <div style={{
          fontSize: '0.8rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: accent,
          backgroundColor: `${accent}0a`,
          border: `1px solid ${accent}25`,
          padding: '6px 16px',
          borderRadius: '20px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <PlaceholderIcon size={14} />
          {statusText}
        </div>

        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </h2>

        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: 0, lineHeight: 1.6 }}>
          {description}
        </p>

        <button 
          className="btn-secondary" 
          onClick={() => setActiveApp("DASHBOARD")}
          style={{ padding: '12px 28px', fontSize: '0.9rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '1rem' }}
        >
          ← Back to Apps Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="hub-container">
      {/* Toast Notification Banner */}
      {notification && (
        <div style={{
          position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)",
          backgroundColor: "#10b981", color: "white", padding: "10px 20px",
          borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
          zIndex: 2000, fontWeight: "600", fontSize: "0.9rem", display: "flex",
          alignItems: "center", gap: "8px"
        }}>
          <CheckCircle size={16} /> {notification}
        </div>
      )}

      <header className="hub-header">
        <button 
          onClick={() => setActiveApp("DASHBOARD")}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            padding: '8px 12px',
            transition: 'all 0.2s ease',
            outline: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginRight: '12px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          ← Back to Apps
        </button>
        <div className="hub-brand" onClick={() => { setCurrentView("CONNECTED_SITES"); setSelectedTaskId(null); }} style={{ cursor: 'pointer' }}>
          <CheckSquare size={22} style={{ color: "var(--accent-color)" }} />
          <span>TSE Website Management</span>
        </div>

        <div className="hub-navigation" style={{ display: 'flex', gap: '24px', marginLeft: '80px', marginRight: 'auto' }}>
          <button 
            onClick={() => {
              if (
                currentView === "SETTINGS" || 
                currentView === "WEBSITES_CONFIG" || 
                currentView === "WEBSITES_PAGE_MGMT" || 
                currentView === "WEBSITES_INTERNAL_LINKING" ||
                currentView === "WEBSITES_SITE_ANALYSIS" ||
                currentView === "WEBSITES_COMING_SOON" ||
                currentView === "AUDIT_CONFIG" ||
                currentView === "AUDIT_RUNNING" ||
                currentView === "AUDIT_RESULTS"
              ) {
                setCurrentView("CONNECTED_SITES");
              }
            }} 
            style={{
              background: 'none', border: 'none', 
              color: currentView !== "SETTINGS" ? '#10b981' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
              borderBottom: currentView !== "SETTINGS" ? '2px solid #10b981' : '2px solid transparent',
              padding: '8px 4px', transition: 'all 0.2s ease', outline: 'none'
            }}
          >
            Websites
          </button>
          
                    <button 
            onClick={() => {
              setSelectedSiteId(null);
              setCurrentView("SETTINGS");
            }} 
            style={{
              background: 'none', border: 'none', 
              color: currentView === "SETTINGS" ? '#10b981' : '#94a3b8',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
              borderBottom: currentView === "SETTINGS" ? '2px solid #10b981' : '2px solid transparent',
              padding: '8px 4px', transition: 'all 0.2s ease', outline: 'none'
            }}
          >
            Global Settings
          </button>
        </div>
        {/* User profile removed */}
      </header>

      {/* Main Content Area */}
      <main className="hub-main">
        <div className="hub-content">
          


          {/* SITE ANALYSIS SECTION */}
          

          {/* STAGE 1: CONNECTED WEBSITES LIST */}
          {currentView === "CONNECTED_SITES" && (
            <div>
              <div className="column-header-row mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ textAlign: 'left' }}>
                  <h2 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Connected Websites</h2>
                  <div style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'rgba(16, 185, 129, 0.85)',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginTop: '6px',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    W1 | Connected Websites
                  </div>
                  <span className="subtitle" style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>Manage your connected websites.</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Portfolio Filter (Milestone M003) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Portfolio:</span>
                    <select
                      value={portfolioFilter}
                      onChange={(e) => setPortfolioFilter(e.target.value)}
                      style={{
                        backgroundColor: '#07090b',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    >
                      <option value="All">All</option>
                      <option value="TSE">TSE</option>
                      <option value="Chili">Chili</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Platform Filter (Milestone M003) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Platform:</span>
                    <select
                      value={platformFilter}
                      onChange={(e) => setPlatformFilter(e.target.value)}
                      style={{
                        backgroundColor: '#07090b',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    >
                      <option value="All">All</option>
                      <option value="WordPress">WordPress</option>
                      <option value="Magento">Magento</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <button 
                    className="btn-primary" 
                    onClick={() => setIsAddWebsiteModalOpen(true)}
                    style={{ 
                      borderRadius: '20px', 
                      padding: '8px 16px', 
                      backgroundColor: '#10b981', 
                      color: '#ffffff', 
                      fontWeight: 600, 
                      fontSize: '0.85rem',
                      border: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: 'none'
                    }}
                  >
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>+</span> Add Website
                  </button>
                </div>
              </div>

              {(() => {
                const filteredSites = sites.filter(site => {
                  const matchesPortfolio = portfolioFilter === "All" || (site.portfolio || "Other") === portfolioFilter;
                  const matchesPlatform = platformFilter === "All" || (site.platform || "Other") === platformFilter;
                  return matchesPortfolio && matchesPlatform;
                });

                return (
                  <div className="websites-grid">
                    {filteredSites.length > 0 ? (
                      filteredSites.map(site => {
                        const isAudited = site.lastAudit !== null;
                        const sitePages = pagesData[site.id] || [];
                        const totalPages = sitePages.filter(p => !isPageExcluded(p)).length;
                        const configuredPages = sitePages.filter(p => p.status === "Configured" && !isPageExcluded(p)).length;
                        const unconfiguredPages = sitePages.filter(p => p.status === "Unconfigured" && !isPageExcluded(p)).length;
                        const displayTitle = site.name;
                        const isConnected = site.status === "Connected" && (site.platform === "Magento" ? !!site.credentials?.password : (!!site.credentials?.username && !!site.credentials?.password));
                        
                        return (
                          <div 
                            key={site.id} 
                            className="sidebar-site-card"
                            style={{ cursor: isAudited ? 'pointer' : 'default', display: 'flex', flexDirection: 'column' }}
                            onClick={() => {
                              if (isAudited) {
                                setSelectedSiteId(site.id);
                                setCurrentView("WEBSITES_CONFIG");
                              }
                            }}
                          >
                            <div className="site-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                                CONNECTED
                              </span>
                              {site.status === "Connected" ? (
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(52, 211, 153, 0.08)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.15)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  {site.tasks.length} TASKS
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.08)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.15)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  UNCONFIGURED
                                </span>
                              )}
                            </div>
                            <h3 className="site-title" style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0.5rem 0 0.25rem 0', textAlign: 'left', color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                              {displayTitle}
                            </h3>
                            
                            <a 
                              href={site.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="site-url-link"
                              style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', width: 'fit-content' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {site.url} <ExternalLink size={12} />
                            </a>
                {/* Website Health Status (Operational Readiness) */}
                            <div className="site-health-status" style={{ marginTop: '1.25rem', border: '1px solid rgba(255,255,255,0.04)', padding: '1.25rem', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>STATUS</span>
                              </div>
                              
                              {/* Connected */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Connected</span>
                                <span style={{
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                                  color: isConnected ? '#34d399' : '#fbbf24',
                                  border: isConnected ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(245, 158, 11, 0.15)'
                                }}>
                                  {isConnected ? "Connected" : "Setup Required"}
                                </span>
                              </div>

                              {/* Platform API */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{site.platform === "Magento" ? "Magento API" : "WordPress API"}</span>
                                {isConnected ? (
                                  <span style={{
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                    color: '#34d399',
                                    border: '1px solid rgba(16, 185, 129, 0.15)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <Lock size={12} style={{ color: '#fbbf24' }} /> Securely Connected
                                  </span>
                                ) : (
                                  <span style={{
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                                    color: '#fbbf24',
                                    border: '1px solid rgba(245, 158, 11, 0.15)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <AlertTriangle size={12} /> Setup Required
                                  </span>
                                )}
                              </div>

                              {/* Configured */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Configured</span>
                                <span style={{
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                                  color: '#fbbf24',
                                  border: '1px solid rgba(245, 158, 11, 0.15)'
                                }}>
                                  Pages Configured ({configuredPages}/{totalPages})
                                </span>
                              </div>

                              {/* Audited */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Audited</span>
                                {isAudited ? (
                                  <span style={{
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                    color: '#34d399',
                                    border: '1px solid rgba(16, 185, 129, 0.15)'
                                  }}>
                                    Audited ({site.lastAudit || '28 Jun 2026'})
                                  </span>
                                ) : (
                                  <span style={{
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                    color: '#f87171',
                                    border: '1px solid rgba(239, 68, 68, 0.15)'
                                  }}>
                                    Pending Audit
                                  </span>
                                )}
                              </div>

                              {/* Tasks Outstanding */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Tasks Outstanding</span>
                                {isAudited ? (
                                  <span style={{
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                                    color: '#fbbf24',
                                    border: '1px solid rgba(245, 158, 11, 0.15)'
                                  }}>
                                    {site.tasks.filter(t => t.state !== "completed").length} Outstanding
                                  </span>
                                ) : (
                                  <span style={{
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                    color: '#f87171',
                                    border: '1px solid rgba(239, 68, 68, 0.15)'
                                  }}>
                                    Pending Audit
                                  </span>
                                )}
                              </div>
                            </div>

                            <button 
                              className="btn-primary" 
                              style={{ 
                                width: '100%', 
                                justifyContent: 'center', 
                                backgroundColor: '#10b981', 
                                color: '#ffffff', 
                                fontWeight: 600, 
                                padding: '10px 16px', 
                                borderRadius: '6px', 
                                border: 'none', 
                                marginTop: '1.25rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                boxShadow: 'none'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSiteId(site.id);
                                setCurrentView("WEBSITES_CONFIG");
                              }}
                            >
                              Manage Website
                            </button>
                            <button 
                              className="btn-secondary" 
                              style={{ 
                                width: '100%', 
                                justifyContent: 'center', 
                                backgroundColor: 'rgba(255,255,255,0.05)', 
                                color: 'var(--text-primary)', 
                                fontWeight: 600, 
                                padding: '8px 16px', 
                                borderRadius: '6px', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                marginTop: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditWebsiteModal(site);
                              }}
                            >
                              Edit Website
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{
                        gridColumn: '1 / -1',
                        padding: '3rem 2rem',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        backgroundColor: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: 500,
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        No websites match the selected filters.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* STAGE 2: WEBSITE CONFIGURATION MANAGEMENT */}
          {currentView === "WEBSITES_CONFIG" && selectedSiteId && (
            <div>
              {/* Back to websites or Site Analysis */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                <button 
                  className="flex align-center gap-2"
                  onClick={() => setCurrentView("CONNECTED_SITES")}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.35rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    color: 'var(--accent-color)',
                    padding: '8px 16px',
                    marginLeft: '-16px',
                    textDecoration: isBackHovered ? 'underline' : 'none',
                    opacity: isBackHovered ? 0.95 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={() => setIsBackHovered(true)}
                  onMouseLeave={() => setIsBackHovered(false)}
                >
                  ← Back to All Connected Websites
                </button>
              </div>

              {/* Header section */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'rgba(16, 185, 129, 0.85)',
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      W2 | Website Dashboard
                    </div>
                    <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {selectedSite?.name}
                    </h2>
                    <a 
                      href={selectedSite?.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="site-url-link"
                      style={{ display: 'block', fontSize: '0.9rem', marginTop: '0.35rem', textAlign: 'left' }}
                    >
                      {selectedSite?.url} <ExternalLink size={12} />
                    </a>
                  </div>
                  
                  {/* Action Buttons Toolbar */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    
                    {/* Temporarily hidden from UI until workflows are implemented */}
                    {/*
                    <button 
                      className="btn-secondary" 
                      onClick={() => {
                        const page = pagesData[selectedSiteId]?.find(p => p.pageUrl === selectedPageUrl);
                        if (page) {
                          handleOpenConfigModal(page);
                        } else {
                          showNotification("Select a page from the table below to configure.");
                        }
                      }}
                      disabled={!selectedPageUrl}
                      style={{ opacity: selectedPageUrl ? 1 : 0.5, cursor: selectedPageUrl ? 'pointer' : 'not-allowed' }}
                    >
                      Configure Page
                    </button>
                    <button 
                      className="btn-secondary" 
                      onClick={() => {
                        const page = pagesData[selectedSiteId]?.find(p => p.pageUrl === selectedPageUrl);
                        if (page) {
                          handleOpenConfigModal(page);
                        } else {
                          showNotification("Select a page from the table below to edit.");
                        }
                      }}
                      disabled={!selectedPageUrl}
                      style={{ opacity: selectedPageUrl ? 1 : 0.5, cursor: selectedPageUrl ? 'pointer' : 'not-allowed' }}
                    >
                      Edit Configuration
                    </button>
                    */}

                    <button 
                      className="btn-secondary" 
                      onClick={() => handleImportPages(selectedSiteId)}
                      disabled={isImporting}
                      style={{ cursor: isImporting ? 'not-allowed' : 'pointer', opacity: isImporting ? 0.7 : 1 }}
                    >
                      {isImporting ? "Syncing..." : `Sync from ${sites.find(s => s.id === selectedSiteId)?.platform || "WordPress"}`}
                    </button>

                    <button 
                      onClick={() => {
                        const sitePages = pagesData[selectedSiteId] || [];
                        const auditedPages = sitePages.filter(p => p.latestAudit && p.latestAudit.timestamp);
                        if (auditedPages.length > 0) {
                          const sorted = [...auditedPages].sort((a, b) => new Date(b.latestAudit.timestamp).getTime() - new Date(a.latestAudit.timestamp).getTime());
                          setReviewPageUrl(sorted[0].pageUrl);
                        } else {
                          const configured = sitePages.filter(p => p.status === "Configured");
                          if (configured.length > 0) {
                            setReviewPageUrl(configured[0].pageUrl);
                          }
                        }
                        setCurrentView("AUDIT_RESULTS");
                      }}
                      style={{ 
                        backgroundColor: '#f97316', 
                        color: '#ffffff', 
                        border: 'none', 
                        padding: '0.625rem 1.25rem', 
                        borderRadius: 'var(--radius-md)', 
                        fontWeight: 600, 
                        fontSize: '0.875rem',
                        cursor: 'pointer', 
                        transition: 'all 0.2s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(249, 115, 22, 0.15)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#ea580c';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#f97316';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      Latest Audit Results
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => {
                        setSingleAuditPageUrl(null);
                        setCurrentView("AUDIT_CONFIG");
                      }}
                    >
                      Run Audit <Play size={14} />
                    </button>
                  </div>
                </div>
              </div>



              {/* Statistics Row */}
              {(() => {
                const sitePages = pagesData[selectedSiteId] || [];
                const totalPages = sitePages.length;
                const configuredPages = sitePages.filter(p => p.status === "Configured").length;
                const unconfiguredPages = sitePages.filter(p => p.status === "Unconfigured" && !isPageExcluded(p)).length;
                const excludedPages = sitePages.filter(p => isPageExcluded(p)).length;
                const actionRequiredPages = sitePages.filter(p => (p.status === "Configured" || p.status === "Unconfigured") && !isPageExcluded(p)).length;
                const isConnected = selectedSite && selectedSite.status === "Connected";

                return (
                  <div className="stats-cards-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
                    <div className="stat-card" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '12px' }}>
                      <span style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>Website Status</span>
                      <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit', color: isConnected ? '#34d399' : '#f87171', marginTop: '0.5rem' }}>
                        {isConnected ? "Connected" : "Requires Setup"}
                      </span>
                    </div>
                    <div className="stat-card" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '12px' }}>
                      <span style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>Total Pages Found</span>
                      <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--text-primary)', marginTop: '0.5rem' }}>{totalPages}</span>
                    </div>
                    <div className="stat-card" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '12px' }}>
                      <span style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>Configured Pages</span>
                      <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit', color: '#34d399', marginTop: '0.5rem' }}>{configuredPages}</span>
                    </div>
                    <div className="stat-card" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '12px' }}>
                      <span style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>Unconfigured Pages</span>
                      <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit', color: unconfiguredPages > 0 ? '#f87171' : 'var(--text-secondary)', marginTop: '0.5rem' }}>{unconfiguredPages}</span>
                    </div>
                    <div className="stat-card" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '12px' }}>
                      <span style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>Action Required</span>
                      <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit', color: '#fbbf24', marginTop: '0.5rem' }}>{actionRequiredPages}</span>
                    </div>
                    <div className="stat-card" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '12px' }}>
                      <span style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>Excluded Pages</span>
                      <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit', color: '#94a3b8', marginTop: '0.5rem' }}>{excludedPages}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Management Modules Grid */}
              <div style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '2.5rem'
                }}>
                  {renderManagementCard({
                    title: "Manage Pages",
                    subtitle: "Configure pages, targets, priorities and page settings.",
                    items: [
                      "Set target keywords and priorities",
                      "Manage page configuration",
                      "Include / exclude pages",
                      "Bulk actions and exports"
                    ],
                    badge: "W3 | Page Management",
                    accentColor: "#10b981",
                    IconComponent: FileText,
                    onClick: () => setCurrentView("WEBSITES_PAGE_MGMT"),
                    buttonText: "Open Pages"
                  })}

                  {renderManagementCard({
                    title: "Review Links",
                    subtitle: "Review internal linking, orphan pages and AI recommendations.",
                    items: [
                      "Internal link analysis",
                      "Orphan and weak pages",
                      "AI link recommendations",
                      "Link opportunities report"
                    ],
                    badge: "W4 | Internal Linking",
                    accentColor: "#8b5cf6",
                    IconComponent: Link,
                    onClick: () => setCurrentView("WEBSITES_INTERNAL_LINKING"),
                    buttonText: "Open Links"
                  })}

                  {renderManagementCard({
                    title: "Open Analysis",
                    subtitle: "Review audit scores, optimisation opportunities and issues.",
                    items: [
                      "On-page SEO audit",
                      "Technical SEO issues",
                      "Content optimisation",
                      "Performance insights"
                    ],
                    badge: "W5 | Site Analysis",
                    accentColor: "#3b82f6",
                    IconComponent: Activity,
                    onClick: () => setCurrentView("WEBSITES_SITE_ANALYSIS"),
                    buttonText: "View Analysis"
                  })}

                  {renderManagementCard({
                    title: "Website Settings",
                    subtitle: "Manage website options, platform, portfolio and configuration.",
                    items: [
                      "Website classification",
                      "Platform and API settings",
                      "Portfolio management",
                      "General configuration"
                    ],
                    badge: "W6 | Website Settings",
                    accentColor: "#f59e0b",
                    IconComponent: Sliders,
                    onClick: () => setCurrentView("SETTINGS"),
                    buttonText: "Open Settings"
                  })}
                </div>
              </div>

              {/* Overview & Activity Section */}
              <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1.5rem 0', letterSpacing: '0.03em' }}>
                  WEBSITE INTELLIGENCE
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '2.5rem'
                }}>
                  {/* Card 1: Recent Activity */}
                  <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem' }}>
                        <Clock size={16} style={{ color: 'var(--text-secondary)' }} />
                        Recent Activity
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 600, cursor: 'pointer' }}>View All</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { text: "WordPress sync completed", time: "Today, 09:15" },
                        { text: "2 new pages discovered", time: "Today, 09:15" },
                        { text: "Audit completed", time: "Yesterday, 14:32" },
                        { text: "Page configuration updated", time: "Yesterday, 11:05" }
                      ].map((act, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{act.text}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{act.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card 2: Last Audit */}
                  <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '180px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem' }}>
                        <Award size={16} style={{ color: '#10b981' }} />
                        Last Audit
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 600, cursor: 'pointer' }}>View Report</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                        <svg width="64" height="64" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.05)"
                            strokeWidth="3.5"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="3.5"
                            strokeDasharray="78, 100"
                          />
                        </svg>
                        <div style={{
                          position: 'absolute',
                          top: 0, left: 0, right: 0, bottom: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.95rem',
                          fontWeight: 800,
                          color: '#ffffff'
                        }}>
                          78
                          <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '-2px' }}>/100</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Overall Score</span>
                        <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>Good</span>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Audit completed:<br />Yesterday, 14:32</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: AI Recommendations */}
                  <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem' }}>
                        <Brain size={16} style={{ color: '#8b5cf6' }} />
                        AI Recommendations
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 600, cursor: 'pointer' }}>View All</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#8b5cf6' }}>12</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Available</span>
                        </div>
                        <span style={{ display: 'block', fontSize: '0.725rem', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.3 }}>
                          Improve internal linking and technical SEO.
                        </span>
                        <button
                          style={{
                            background: 'none',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            color: '#8b5cf6',
                            fontSize: '0.725rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            outline: 'none'
                          }}
                        >
                          View Recommendations <ChevronRight size={10} />
                        </button>
                      </div>
                      <div style={{ color: '#8b5cf6', opacity: 0.8, flexShrink: 0 }}>
                        <Brain size={40} strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Website Status */}
                  <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '180px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem' }}>
                        <Server size={16} style={{ color: '#10b981' }} />
                        Website Status
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 600, cursor: 'pointer' }}>View Details</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: 800, color: '#10b981', marginBottom: '4px' }}>Success</span>
                        <span style={{ display: 'block', fontSize: '0.725rem', color: 'var(--text-secondary)' }}>Last crawl: Today, 09:15</span>
                        <span style={{ display: 'block', fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Pages crawled: {(() => {
                          const sitePages = pagesData[selectedSiteId] || [];
                          return sitePages.length;
                        })()}</span>
                        <span style={{ display: 'block', fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '2px' }}>New pages found: 2</span>
                      </div>
                      <div style={{ color: '#10b981', flexShrink: 0 }}>
                        <CheckCircle size={38} strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* STAGE 3: W3 PAGE MANAGEMENT (Moved from W2) */}
          {currentView === "WEBSITES_PAGE_MGMT" && selectedSiteId && (() => {
            const sitePages = sortPagesForSEO(pagesData[selectedSiteId] || []);
            const siteName = sites.find(s => s.id === selectedSiteId)?.name;
            const selectedSite = sites.find(s => s.id === selectedSiteId);

            return (
              <div>
                {/* Back to Website Dashboard */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                  <button 
                    onClick={() => setCurrentView("WEBSITES_CONFIG")}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.35rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      color: 'var(--accent-color)',
                      padding: '8px 16px',
                      marginLeft: '-16px',
                      textDecoration: isBackHovered ? 'underline' : 'none',
                      opacity: isBackHovered ? 0.95 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onMouseEnter={() => setIsBackHovered(true)}
                    onMouseLeave={() => setIsBackHovered(false)}
                  >
                    ← Back to W2 | Website Dashboard
                  </button>
                </div>

                {/* Header section */}
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'rgba(16, 185, 129, 0.85)',
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.15)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        display: 'inline-block',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        W3 | Page Management
                      </div>
                      <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {selectedSite?.name}
                      </h2>
                      <a 
                        href={selectedSite?.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="site-url-link"
                        style={{ display: 'block', fontSize: '0.9rem', marginTop: '0.35rem', textAlign: 'left' }}
                      >
                        {selectedSite?.url} <ExternalLink size={12} />
                      </a>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button 
                        className="btn-secondary" 
                        onClick={() => handleImportPages(selectedSiteId)}
                        disabled={isImporting}
                        style={{ cursor: isImporting ? 'not-allowed' : 'pointer', opacity: isImporting ? 0.7 : 1 }}
                      >
                        {isImporting ? "Syncing..." : `Sync from ${selectedSite?.platform || "WordPress"}`}
                      </button>
                      <button 
                        className="btn-primary"
                        onClick={() => {
                          setSingleAuditPageUrl(null);
                          setCurrentView("AUDIT_CONFIG");
                        }}
                      >
                        Run Audit <Play size={14} />
                      </button>
                    </div>
                  </div>
                  {renderModuleNavigation("W3")}
                </div>

                {/* Table section */}
                <div style={{ marginTop: '2rem' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', justifyContent: 'flex-start' }}>
                    {["all", "configured", "unconfigured", "excluded"].map(f => (
                      <button
                        key={f}
                        onClick={() => setCurrentFilter(f)}
                        className="btn-secondary"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          backgroundColor: currentFilter === f ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                          color: currentFilter === f ? '#10b981' : 'var(--text-secondary)',
                          borderColor: currentFilter === f ? '#10b981' : 'var(--border-color)',
                          cursor: 'pointer',
                          outline: 'none',
                          borderRadius: '6px'
                        }}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface-color)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)' }}>
                    <table className="audit-config-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                          <th 
                            className="sortable-th"
                            onClick={() => handleSortClick('page')}
                            style={{ padding: '16px 20px', color: w3SortField === 'page' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, width: '35%', minWidth: '350px' }}
                          >
                            Page
                            {w3SortField === 'page' && <span style={{ marginLeft: '6px', color: 'var(--accent-color)', fontSize: '0.8rem' }}>{w3SortDirection === 'asc' ? '▲' : '▼'}</span>}
                          </th>
                          <th 
                            className="sortable-th"
                            onClick={() => handleSortClick('type')}
                            style={{ padding: '16px 20px', color: w3SortField === 'type' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, width: '10%', minWidth: '110px' }}
                          >
                            Type
                            {w3SortField === 'type' && <span style={{ marginLeft: '6px', color: 'var(--accent-color)', fontSize: '0.8rem' }}>{w3SortDirection === 'asc' ? '▲' : '▼'}</span>}
                          </th>
                          <th 
                            className="sortable-th"
                            onClick={() => handleSortClick('priority')}
                            style={{ padding: '16px 20px', color: w3SortField === 'priority' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, width: '10%', minWidth: '100px' }}
                          >
                            Priority
                            {w3SortField === 'priority' && <span style={{ marginLeft: '6px', color: 'var(--accent-color)', fontSize: '0.8rem' }}>{w3SortDirection === 'asc' ? '▲' : '▼'}</span>}
                          </th>
                          <th 
                            className="sortable-th"
                            onClick={() => handleSortClick('target')}
                            style={{ padding: '16px 20px', color: w3SortField === 'target' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, width: '15%', minWidth: '180px' }}
                          >
                            Target
                            {w3SortField === 'target' && <span style={{ marginLeft: '6px', color: 'var(--accent-color)', fontSize: '0.8rem' }}>{w3SortDirection === 'asc' ? '▲' : '▼'}</span>}
                          </th>
                          <th 
                            className="sortable-th"
                            onClick={() => handleSortClick('status')}
                            style={{ padding: '16px 20px', color: w3SortField === 'status' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, width: '10%', minWidth: '120px' }}
                          >
                            Status
                            {w3SortField === 'status' && <span style={{ marginLeft: '6px', color: 'var(--accent-color)', fontSize: '0.8rem' }}>{w3SortDirection === 'asc' ? '▲' : '▼'}</span>}
                          </th>
                          <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, width: '10%', minWidth: '180px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const filteredPages = w3SortedPages.filter(page => {
                            const isExcluded = isPageExcluded(page);
                            if (currentFilter === "all") return !isExcluded;
                            if (currentFilter === "configured") return page.status === "Configured" && !isExcluded;
                            if (currentFilter === "unconfigured") return page.status === "Unconfigured" && !isExcluded;
                            if (currentFilter === "action_required") return (page.status === "Configured" || page.status === "Unconfigured") && !isExcluded;
                            if (currentFilter === "excluded") return isExcluded;
                            return !isExcluded;
                          });

                          if (filteredPages.length === 0) {
                            return (
                              <tr>
                                <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                  No pages match the current criteria.
                                </td>
                              </tr>
                            );
                          }

                          return filteredPages.map((page, index) => {
                            const isExcluded = isPageExcluded(page);
                            const isConfigured = page.status === "Configured" && !isExcluded;
                            return (
                              <tr key={`${page.pageUrl}-${index}`} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} className="table-row-hover">
                                <td style={{ padding: '16px 20px', textAlign: 'left' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{page.pageTitle || "Unnamed Page"}</span>
                                    <a href={page.pageUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'none' }} className="flex align-center gap-1">
                                      {page.pageUrl} <ExternalLink size={10} />
                                    </a>
                                  </div>
                                </td>
                                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{page.assignedType || "Supporting Page"}</td>
                                <td style={{ padding: '16px 20px' }}>
                                  <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    backgroundColor: page.priority === "High" ? 'rgba(239, 68, 68, 0.1)' : page.priority === "Medium" ? 'rgba(245, 158, 11, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                    color: page.priority === "High" ? '#ef4444' : page.priority === "Medium" ? '#f59e0b' : '#9ca3af'
                                  }}>
                                    {page.priority || "Medium"}
                                  </span>
                                </td>
                                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{page.targetPhrase || "Not Set"}</td>
                                <td style={{ padding: '16px 20px' }}>
                                  <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    backgroundColor: isExcluded ? 'rgba(107,114,128,0.1)' : page.status === "Configured" ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: isExcluded ? '#9ca3af' : page.status === "Configured" ? '#10b981' : '#ef4444'
                                  }}>
                                    {isExcluded ? "Excluded" : page.status || "Unconfigured"}
                                  </span>
                                </td>
                                                                <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  {isConfigured && (
                                    <>
                                      <button 
                                        className="btn-primary site-btn-sm" 
                                        style={{ 
                                          display: 'inline-flex', width: 'auto', marginRight: '8px', padding: '6px 12px',
                                          boxShadow: 'none', background: '#f97316', backgroundColor: '#f97316', borderColor: '#f97316',
                                          color: '#ffffff', cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none'
                                        }}
                                        onClick={() => {
                                          setSelectedPageUrl(page.pageUrl);
                                          setSelectedPageId(page.wpPostId || null);
                                          setReviewPageUrl(page.pageUrl);
                                          setReviewPageId(page.wpPostId || null);
                                          setCurrentView("AUDIT_RESULTS");
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#ea580c';
                                          e.currentTarget.style.borderColor = '#ea580c';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = '#f97316';
                                          e.currentTarget.style.borderColor = '#f97316';
                                        }}
                                      >
                                        Last Audit
                                      </button>
                                      <button
                                        className="btn-primary site-btn-sm"
                                        style={{ 
                                          display: 'inline-flex', width: 'auto', marginRight: '8px', padding: '6px 12px',
                                          boxShadow: 'none', background: '#10b981', backgroundColor: '#10b981', borderColor: '#10b981',
                                          color: '#ffffff', cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none'
                                        }}
                                        onClick={() => handleAuditSinglePage(page.pageUrl, page.wpPostId)}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#059669';
                                          e.currentTarget.style.borderColor = '#059669';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = '#10b981';
                                          e.currentTarget.style.borderColor = '#10b981';
                                        }}
                                      >
                                        Audit Page
                                      </button>
                                    </>
                                  )}
                                  <button 
                                    className="btn-secondary site-btn-sm" 
                                    style={{ display: 'inline-flex', width: 'auto', padding: '6px 12px !important' }}
                                    onClick={() => handleOpenConfigModal(page)}
                                  >
                                    {isConfigured ? "Edit" : "Configure"}
                                  </button>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* STAGE 3.5: W4 INTERNAL LINKING SHELL */}
          {currentView === "WEBSITES_INTERNAL_LINKING" && selectedSiteId && (() => {
            const selectedSite = sites.find(s => s.id === selectedSiteId);
            return (
              <div>
                {/* Back navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                  <button 
                    onClick={() => {
                      if (selectedLinkPageUrl) {
                        setSelectedLinkPageUrl(null);
                      } else {
                        setCurrentView("WEBSITES_CONFIG");
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.35rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      color: 'var(--accent-color)',
                      padding: '8px 16px',
                      marginLeft: '-16px',
                      textDecoration: isBackHovered ? 'underline' : 'none',
                      opacity: isBackHovered ? 0.95 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onMouseEnter={() => setIsBackHovered(true)}
                    onMouseLeave={() => setIsBackHovered(false)}
                  >
                    {selectedLinkPageUrl ? "← Back to W4 | Internal Linking Page List" : "← Back to W2 | Website Dashboard"}
                  </button>
                </div>

                {/* Header Details */}
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#8b5cf6cc',
                        backgroundColor: '#8b5cf60c',
                        border: '1px solid #8b5cf625',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        display: 'inline-block',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        W4 | Internal Linking
                      </div>
                      <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {selectedSite?.name}
                      </h2>
                      <a 
                        href={selectedSite?.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="site-url-link"
                        style={{ display: 'block', fontSize: '0.9rem', marginTop: '0.35rem', textAlign: 'left' }}
                      >
                        {selectedSite?.url} <ExternalLink size={12} />
                      </a>
                    </div>
                    {!selectedLinkPageUrl && (
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          className="btn-primary"
                          onClick={() => handleRebuildInternalLinks(selectedSiteId)}
                          disabled={isImporting}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            cursor: isImporting ? 'not-allowed' : 'pointer',
                            opacity: isImporting ? 0.75 : 1
                          }}
                        >
                          <RefreshCw size={14} className={isImporting ? "spinner" : ""} />
                          {isImporting ? "Rebuilding..." : "Rebuild Internal Links"}
                        </button>
                      </div>
                    )}
                  </div>
                  {renderModuleNavigation("W4")}
                </div>

                {/* Content Placeholder */}
                {(() => {
  const sitePages = pagesData[selectedSiteId] || [];
  const sortedPages = sortPagesForSEO(sitePages);
                            const configuredPagesList = sortedPages.filter(p => p.status === "Configured" && p.assignedType !== "Excluded");

                            const getMergedAnchors = (incomingAnchors) => {
                              if (!incomingAnchors) return [];
                              const mergedMap = {};
                              incomingAnchors.forEach(anc => {
                                let str = anc.anchorText || anc.anchor || "";
                                str = str.replace(/<[^>]*>/g, "").trim();
                                if (!str) return;
                                const norm = str.toLowerCase();
                                if (mergedMap[norm]) {
                                  mergedMap[norm].count += (anc.count || 1);
                                } else {
                                  mergedMap[norm] = {
                                    anchor: str,
                                    count: anc.count || 1
                                  };
                                }
                              });
                              return Object.values(mergedMap).map(item => ({
                                anchor: item.anchor,
                                count: item.count
                              }));
                            };

                            const getSuggestedSources = (targetPage, allConfiguredPages, currentAnchors) => {
                              const existingAnchors = (currentAnchors || []).map(a => (a.anchorText || a.anchor || "").toLowerCase().trim());
                              
                              // Calculate which source pages already have mapped existing contextual links to this target page
                              const potentialSources = allConfiguredPages.filter(p => p.pageUrl !== targetPage.pageUrl);
                              const mergedMap = {};
                              (currentAnchors || []).forEach(anc => {
                                let str = anc.anchorText || anc.anchor || "";
                                str = str.replace(/<[^>]*>/g, "").trim();
                                if (!str) return;
                                const norm = str.toLowerCase();
                                if (mergedMap[norm]) {
                                  mergedMap[norm].count += (anc.count || 1);
                                } else {
                                  mergedMap[norm] = {
                                    anchor: str,
                                    count: anc.count || 1
                                  };
                                }
                              });
                              const merged = Object.values(mergedMap);
                              
                              let sourceIndex = 0;
                              const existingSourceUrls = [];
                              merged.forEach(item => {
                                const norm = item.anchor.toLowerCase();
                                for (let c = 0; c < item.count; c++) {
                                  let linkType = "Contextual";
                                  if (norm === "home" || norm === "homepage" || norm === "navigation") {
                                    linkType = "Navigation";
                                  } else if (norm === "contact" || norm === "about" || norm === "gallery") {
                                    linkType = "Navigation";
                                  } else if (c % 5 === 1) {
                                    linkType = "Footer";
                                  } else if (c % 5 === 2) {
                                    linkType = "Sidebar";
                                  } else if (c % 5 === 3) {
                                    linkType = "Breadcrumb";
                                  } else if (c % 5 === 4) {
                                    linkType = "Related Content";
                                  }
                                  
                                  if (linkType === "Contextual") {
                                    const sourcePage = potentialSources[sourceIndex % potentialSources.length];
                                    sourceIndex++;
                                    if (sourcePage) {
                                      existingSourceUrls.push(sourcePage.pageUrl);
                                    }
                                  }
                                }
                              });
                              
                              const candidates = allConfiguredPages.filter(p => {
                                if (p.pageUrl === targetPage.pageUrl) return false;
                                if (existingSourceUrls.includes(p.pageUrl)) return false;
                                if (existingAnchors.includes((p.pageTitle || "").toLowerCase().trim())) return false;
                                return true;
                              });

                              const scored = candidates.map(p => {
                                let score = 0;
                                if (p.pageUrl === "/") score += 10;
                                const isHub = p.assignedType === "Hub Page" || p.assignedType === "Hub Pages" || p.assignedType === "Hub";
                                if (isHub) score += 20;
                                return { page: p, score };
                              });

                              scored.sort((a, b) => b.score - a.score);
                              return scored.map(s => s.page);
                            };

                            const getAnchorVariation = (targetPhrase, sourcePage, destPage, index) => {
                              if (!targetPhrase) return "click here";
                              
                              const tp = targetPhrase.trim().toLowerCase();
                              if (index === 0) return tp;
                              
                              const seed = (sourcePage?.pageUrl || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + index;
                              
                              const wordVariations = {
                                "upgrades": ["renovations", "refurbishments", "improvements", "upgrade services"],
                                "fitters": ["installers", "specialists", "experts", "fitting services"],
                                "installation": ["installations", "fitting", "setup", "services", "installers"],
                                "refurbishment": ["refurbishments", "renovations", "remodeling", "upgrades"],
                                "renovations": ["renovation", "makeovers", "refurbishments", "projects", "upgrades"]
                              };
                              
                              for (const [key, options] of Object.entries(wordVariations)) {
                                if (tp.includes(key)) {
                                  const option = options[seed % options.length];
                                  const variedPhrase = tp.replace(key, option);
                                  if (variedPhrase.split(" ").length <= 5) {
                                    return variedPhrase;
                                  }
                                }
                              }
                              
                              const prefixes = ["professional", "expert", "complete", "reliable", "quality", "local", "modern", "affordable"];
                              const suffixes = ["services", "specialists", "experts", "solutions", "work", "projects"];
                              
                              if (seed % 2 === 0) {
                                const prefix = prefixes[seed % prefixes.length];
                                return `${prefix} ${tp}`;
                              } else {
                                const suffix = suffixes[seed % suffixes.length];
                                return `${tp} ${suffix}`;
                              }
                            };

                            const linkResults = configuredPagesList.map(page => {
                              const audit = runPageAudit(page.pageUrl, page.targetPhrase, page.pageTitle, selectedSiteId, page);
                              const linkCheck = audit.find(r => r.item === "Internal Link Count") || {
                                status: "Fail",
                                action: "No crawl data available.",
                                current: "0 incoming internal links"
                              };

                              const countMatch = linkCheck.current.match(/(\d+)\s+incoming/);
                              const currentCount = countMatch ? parseInt(countMatch[1]) : 0;
                              
                              const isFail = linkCheck.status === "Fail";
                              const isWarning = linkCheck.status === "Warning";
                              
                              let badgeColor = "#34d399";
                              let badgeBg = "rgba(16, 185, 129, 0.08)";
                              let labelText = "No Action Required";

                              if (isFail) {
                                badgeColor = "#f87171";
                                badgeBg = "rgba(239, 68, 68, 0.08)";
                                labelText = "Add Links";
                              } else if (isWarning) {
                                badgeColor = "#fbbf24";
                                badgeBg = "rgba(245, 158, 11, 0.08)";
                                labelText = "Improve Anchor Text";
                              }

                              let priority = "Low";
                              if (isFail) {
                                priority = page.assignedType === "Hub Page" || page.assignedType === "Hub Pages" || page.assignedType === "Hub" ? "High" : "Medium";
                              }

                              return {
                                page,
                                linkCheck,
                                currentCount,
                                isFail,
                                isWarning,
                                badgeColor,
                                badgeBg,
                                labelText,
                                priority
                              };
                            });

                            if (selectedLinkPageUrl) {
                              const pageResult = linkResults.find(r => r.page.pageUrl === selectedLinkPageUrl);
                              if (!pageResult) {
                                return (
                                  <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                                    Page not found.
                                  </div>
                                );
                              }
                              const { page, linkCheck, currentCount, isFail, isWarning, badgeColor, badgeBg, labelText, priority } = pageResult;
                              
                              const pageType = getPageType(page);
                              const resolvedPriority = page.priority || (
                                pageType === "Hub Page" ? 1
                                : pageType === "Landing Page" ? 2
                                : pageType === "Supporting Page" ? 3
                                : pageType === "Topical Page" ? 4
                                : 3
                              );
                              
                              let targetCount = 7;
                              if (resolvedPriority === 1) { targetCount = 15; }
                              else if (resolvedPriority === 2) { targetCount = 10; }
                              else if (resolvedPriority === 3) { targetCount = 7; }
                              else if (resolvedPriority === 4) { targetCount = 5; }
                              
                              let statusLabel = "On Target";
                              let statusColor = "#34d399";
                              let statusDesc = "Internal linking target achieved.";
                              let statusCircleBg = "rgba(16, 185, 129, 0.1)";
                              if (currentCount < targetCount) {
                                statusLabel = "Needs Links";
                                statusColor = "#fbbf24";
                                statusDesc = `Add ${targetCount - currentCount} contextual internal links`;
                                statusCircleBg = "rgba(245, 158, 11, 0.1)";
                              } else if (currentCount > targetCount) {
                                statusLabel = "Complete";
                                statusColor = "#60a5fa";
                                statusDesc = "Internal linking target exceeded.";
                                statusCircleBg = "rgba(59, 130, 246, 0.1)";
                              }

                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', textAlign: 'left' }}>
                                  {/* Breadcrumbs & Actions Row */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                                      <span style={{ cursor: 'pointer' }} onClick={() => setCurrentView("WEBSITES_CONFIG")}>Home</span>
                                      <span>&gt;</span>
                                      <span style={{ cursor: 'pointer' }} onClick={() => setCurrentView("WEBSITES_CONFIG")}>Website Management</span>
                                      <span>&gt;</span>
                                      <span style={{ cursor: 'pointer' }} onClick={() => setSelectedLinkPageUrl(null)}>Internal Links</span>
                                      <span>&gt;</span>
                                      <span style={{ color: '#fff', fontWeight: 500 }}>{page.pageUrl}</span>
                                    </div>
                                    <button
                                      className="btn-primary"
                                      onClick={() => {
                                        const needed = Math.max(0, targetCount - currentCount);
                                        if (needed > 0) {
                                          const sources = getSuggestedSources(page, configuredPagesList, linkCheck.incomingAnchors);
                                          for (let i = 0; i < needed; i++) {
                                            const srcPage = sources[i % sources.length];
                                            const key = `${page.pageUrl}-${srcPage ? srcPage.pageUrl : "/"}-${i}`;
                                            const displayAnchor = editedAnchors[key] || getAnchorVariation(page.targetPhrase, srcPage, page, i);
                                            handleGenerateSentence(page, { recommendedAnchor: displayAnchor, srcPageObject: srcPage }, srcPage, key, displayAnchor);
                                          }
                                        } else {
                                          showNotification("Target internal links already achieved!");
                                        }
                                      }}
                                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.95rem' }}
                                    >
                                      <Sparkles size={16} /> Generate Link Suggestions
                                    </button>
                                  </div>

                                  {/* Page Header */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '0.5rem' }}>
                                    <div style={{
                                      width: '56px',
                                      height: '56px',
                                      borderRadius: '50%',
                                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                      color: '#3b82f6',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0
                                    }}>
                                      <Link size={28} />
                                    </div>
                                    <div>
                                      <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: 'Outfit', lineHeight: 1.2 }}>
                                        {page.pageUrl}
                                      </h1>
                                      <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 500 }}>
                                        {page.pageTitle}
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                        <span style={{
                                          color: '#3b82f6',
                                          backgroundColor: 'rgba(59, 130, 246, 0.08)',
                                          padding: '4px 12px',
                                          borderRadius: '6px',
                                          fontSize: '0.85rem',
                                          fontWeight: 700,
                                          border: '1px solid rgba(59, 130, 246, 0.15)'
                                        }}>
                                          Priority {resolvedPriority}
                                        </span>
                                        <span style={{
                                          color: 'var(--text-primary)',
                                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                          padding: '4px 12px',
                                          borderRadius: '6px',
                                          fontSize: '0.85rem',
                                          fontWeight: 700,
                                          border: '1px solid rgba(255, 255, 255, 0.08)'
                                        }}>
                                          {pageType}
                                        </span>
                                        <span style={{ color: 'rgba(255, 255, 255, 0.15)', margin: '0 8px' }}>|</span>
                                        {page.targetPhrase && (
                                          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            Target phrase: <strong style={{ color: '#3b82f6' }}>{page.targetPhrase}</strong>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Summary Cards */}
                                  <div className="w4-summary-panel">
                                    {/* Card 1: Current Internal Links */}
                                    <div className="w4-summary-col">
                                      <div style={{
                                        width: '52px',
                                        height: '52px',
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        color: '#10b981',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                      }}>
                                        <Link size={24} />
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>
                                          Current Internal Links
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                          <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                            {currentCount}
                                          </span>
                                          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            links found
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Card 2: Recommended Target */}
                                    <div className="w4-summary-col">
                                      <div style={{
                                        width: '52px',
                                        height: '52px',
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                        color: '#3b82f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                      }}>
                                        <Target size={24} />
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>
                                          Recommended Target
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                          <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                            {targetCount}
                                          </span>
                                          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            links
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Card 3: Status */}
                                    <div className="w4-summary-col">
                                      <div style={{
                                        width: '52px',
                                        height: '52px',
                                        borderRadius: '50%',
                                        backgroundColor: statusCircleBg,
                                        color: statusColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                      }}>
                                        <TrendingUp size={24} />
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>
                                          Status
                                        </span>
                                        <span style={{ fontSize: '1.35rem', fontWeight: 800, color: statusColor }}>
                                          {statusLabel}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                          {statusDesc}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Existing Internal Links Section */}
                                  <div style={{
                                    backgroundColor: '#070b13',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem'
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Link size={16} /> Existing Internal Links ({currentCount}) <HelpCircle size={14} style={{ opacity: 0.5, cursor: 'pointer' }} title="Contextual internal links pointing to this page." />
                                      </h3>
                                      <button
                                        className="btn-secondary"
                                        onClick={() => {
                                          showNotification("Refreshed link audit");
                                        }}
                                        style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                      >
                                        <RefreshCw size={12} /> Refresh
                                      </button>
                                    </div>

                                    {currentCount === 0 ? (
                                      <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '3rem',
                                        border: '1px dashed rgba(255, 255, 255, 0.08)',
                                        borderRadius: '8px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.01)',
                                        color: 'var(--text-secondary)',
                                        gap: '8px'
                                      }}>
                                        <Inbox size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                          No internal links found for this page yet.
                                        </div>
                                        <div style={{ fontSize: '0.8rem' }}>
                                          Once links are added from other pages, they will appear here.
                                        </div>
                                      </div>
                                    ) : (
                                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#cbd5e1', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: '6px', overflow: 'hidden' }}>
                                        <thead>
                                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'left', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                            <th style={{ padding: '10px 14px', width: '20%' }}>Source Page Title</th>
                                            <th style={{ padding: '10px 14px', width: '20%' }}>Source Page URL</th>
                                            <th style={{ padding: '10px 14px', width: '20%' }}>Anchor Text (Contextual)</th>
                                            <th style={{ padding: '10px 14px', width: '30%' }}>Link Context</th>
                                            <th style={{ padding: '10px 14px', width: '10%' }}>Type</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {(() => {
                                            const existingLinks = [];
                                            const potentialSources = configuredPagesList.filter(p => p.pageUrl !== page.pageUrl);
                                            let sourceIndex = 0;

                                            if (linkCheck.incomingAnchors) {
                                              linkCheck.incomingAnchors.forEach(item => {
                                                const anchorText = item.anchorText || item.anchor || "";
                                                const norm = anchorText.toLowerCase().trim();
                                                if (!norm) return;
                                                
                                                let linkType = "Contextual";
                                                if (norm === "home" || norm === "homepage" || norm === "navigation") {
                                                  linkType = "Navigation";
                                                } else if (norm === "contact" || norm === "about" || norm === "gallery") {
                                                  linkType = "Navigation";
                                                }
                                                
                                                if (linkType === "Contextual") {
                                                  let sourcePage = null;
                                                  if (item.sourcePageUrl) {
                                                    sourcePage = sortedPages.find(p => p.pageUrl === item.sourcePageUrl);
                                                  }
                                                  if (!sourcePage) {
                                                    sourcePage = potentialSources[sourceIndex % potentialSources.length];
                                                    sourceIndex++;
                                                  }

                                                  existingLinks.push({
                                                    anchor: anchorText,
                                                    type: linkType,
                                                    sourceTitle: sourcePage ? sourcePage.pageTitle : "Unknown Source",
                                                    sourceUrl: sourcePage ? sourcePage.pageUrl : "/",
                                                    sourcePageObj: sourcePage
                                                  });
                                                }
                                              });
                                            }

                                                                                         const getLinkContext = (sourcePage, anchorText) => {


                                                                                           if (!sourcePage || !sourcePage.crawlData || !sourcePage.crawlData.htmlSnapshot) {


                                                                                             return "Context not available";


                                                                                           }


                                                                                           try {


                                                                                             const parser = new DOMParser();


                                                                                             const doc = parser.parseFromString(sourcePage.crawlData.htmlSnapshot, "text/html");


                                                                                             


                                                                                             const getPrimaryContentContainer = (d) => {


                                                                                               const selectors = [


                                                                                                 '.entry-content',


                                                                                                 '.post-content',


                                                                                                 '.elementor-widget-theme-post-content',


                                                                                                 'article',


                                                                                                 'main',


                                                                                                 'body > div.elementor'


                                                                                               ];


                                                                                               for (let i = 0; i < selectors.length; i++) {


                                                                                                 const elms = d.querySelectorAll(selectors[i]);


                                                                                                 if (elms.length > 0) {


                                                                                                   if (elms.length === 1) return elms[0];


                                                                                                   let bestCandidate = elms[0];


                                                                                                   let bestScore = -1;


                                                                                                   elms.forEach(el => {


                                                                                                     const textLength = el.textContent ? el.textContent.trim().length : 0;


                                                                                                     const pCount = el.querySelectorAll('p').length;


                                                                                                     const score = textLength + pCount * 100;


                                                                                                     if (score > bestScore) {


                                                                                                       bestScore = score;


                                                                                                       bestCandidate = el;


                                                                                                     }


                                                                                                   });


                                                                                                   return bestCandidate;


                                                                                                 }


                                                                                               }


                                                                                               return null;


                                                                                             };


                                                                                             


                                                                                             const container = getPrimaryContentContainer(doc);


                                                                                             if (!container) {


                                                                                               return "Context not found";


                                                                                             }


                                                                                             


                                                                                             const anchors = container.querySelectorAll("a");


                                                                                             let targetAnchor = null;


                                                                                             const destRel = getRelativeUrl(page.pageUrl, selectedSite.url);


                                                                                             const cleanAnchor = (anchorText || "").toLowerCase().trim();


                                                                                             


                                                                                             for (let i = 0; i < anchors.length; i++) {


                                                                                               const a = anchors[i];


                                                                                               const href = a.getAttribute("href");


                                                                                               if (!href) continue;


                                                                                               const hrefRel = getRelativeUrl(href, selectedSite.url);


                                                                                               if (hrefRel === destRel && a.textContent.replace(/<[^>]*>/g, "").trim().toLowerCase() === cleanAnchor) {


                                                                                                 targetAnchor = a;


                                                                                                 break;


                                                                                               }


                                                                                             }


                                                                                             


                                                                                             if (!targetAnchor) {


                                                                                               return "Context not found";


                                                                                             }


                                                                                             


                                                                                             let textBefore = "";


                                                                                             let textAfter = "";


                                                                                             


                                                                                             let prev = targetAnchor.previousSibling;


                                                                                             while (prev && textBefore.length < 50) {


                                                                                               textBefore = (prev.textContent || "") + textBefore;


                                                                                               prev = prev.previousSibling;


                                                                                             }


                                                                                             if (textBefore.length < 50 && targetAnchor.parentElement) {


                                                                                               let parentPrev = targetAnchor.parentElement.previousSibling;


                                                                                               while (parentPrev && textBefore.length < 50) {


                                                                                                 textBefore = (parentPrev.textContent || "") + textBefore;


                                                                                                 parentPrev = parentPrev.previousSibling;


                                                                                               }


                                                                                             }


                                                                                             


                                                                                             let next = targetAnchor.nextSibling;


                                                                                             while (next && textAfter.length < 50) {


                                                                                               textAfter = textAfter + (next.textContent || "");


                                                                                               next = next.nextSibling;


                                                                                             }


                                                                                             if (textAfter.length < 50 && targetAnchor.parentElement) {


                                                                                               let parentNext = targetAnchor.parentElement.nextSibling;


                                                                                               while (parentNext && textAfter.length < 50) {


                                                                                                 textAfter = textAfter + (parentNext.textContent || "");


                                                                                                 parentNext = parentNext.nextSibling;


                                                                                               }


                                                                                             }


                                                                                             


                                                                                             textBefore = textBefore.replace(/\s+/g, ' ');


                                                                                             textAfter = textAfter.replace(/\s+/g, ' ');


                                                                                             


                                                                                             const slicedBefore = textBefore.slice(-45);


                                                                                             const slicedAfter = textAfter.slice(0, 45);


                                                                                             


                                                                                             let snippet = (slicedBefore ? "..." : "") + slicedBefore + targetAnchor.textContent.trim() + slicedAfter + (slicedAfter ? "..." : "");


                                                                                             return snippet.replace(/\s+/g, ' ').trim();


                                                                                           } catch (e) {


                                                                                             console.error("Failed to extract hyperlink context:", e);


                                                                                             return "Context not available";


                                                                                           }


                                                                                         };
                                             // legacy declaration replacement dummy;

                                            return existingLinks.map((link, lIdx) => {
                                              const contextText = getLinkContext(link.sourcePageObj, link.anchor);
                                              return (
                                                <tr key={lIdx} style={{ borderBottom: lIdx < existingLinks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                                  <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    {link.sourceTitle}
                                                  </td>
                                                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#94a3b8' }}>
                                                    {link.sourceUrl}
                                                  </td>
                                                  <td style={{ padding: '12px 14px', color: '#cbd5e1', fontWeight: 600 }}>
                                                    {link.anchor}
                                                  </td>
                                                  <td style={{ padding: '12px 14px', color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.8rem' }} title={contextText}>
                                                    {renderHighlightedContext(contextText, link.anchor)}
                                                  </td>
                                                  <td style={{ padding: '12px 14px' }}>
                                                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#34d399", border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                                      {link.type}
                                                    </span>
                                                  </td>
                                                </tr>
                                              );
                                            });
                                          })()}
                                        </tbody>
                                      </table>
                                    )}
                                  </div>

                                  {/* Recommended Links Section */}
                                  <div style={{
                                    backgroundColor: '#070b13',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem'
                                  }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <Sparkles size={16} style={{ color: '#fbbf24' }} /> Recommended Links (Target: {targetCount}) <HelpCircle size={14} style={{ opacity: 0.5, cursor: 'pointer' }} title="AI recommended internal link source page and anchor suggestions." />
                                    </h3>

                                    {needed <= 0 ? (
                                      <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '2.5rem',
                                        border: '1px dashed rgba(52, 211, 153, 0.15)',
                                        borderRadius: '8px',
                                        backgroundColor: 'rgba(52, 211, 153, 0.01)',
                                        color: '#34d399',
                                        gap: '8px'
                                      }}>
                                        <CheckCircle size={24} />
                                        <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                                          No new links required
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                          Sufficient internal links exist.
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#cbd5e1', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: '6px', overflow: 'hidden' }}>
                                          <thead>
                                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'left', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                              <th style={{ padding: '10px 14px', width: '20%' }}>Anchor Text</th>
                                              <th style={{ padding: '10px 14px', width: '30%' }}>Suggested Source Page</th>
                                              <th style={{ padding: '10px 14px', width: '35%' }}>AI Suggested Sentence</th>
                                              <th style={{ padding: '10px 14px', width: '15%' }}>Action</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {(() => {
                                              const sources = getSuggestedSources(page, configuredPagesList, linkCheck.incomingAnchors);
                                              const recs = [];
                                              const limit = Math.min(needed, sources.length);
                                              for (let i = 0; i < limit; i++) {
                                                const srcPage = sources[i];
                                                recs.push({
                                                  recommendedAnchor: getAnchorVariation(page.targetPhrase, srcPage, page, i),
                                                  sourceTitle: srcPage ? srcPage.pageTitle : "Hub Page",
                                                  sourceUrl: srcPage ? srcPage.pageUrl : "/",
                                                  srcPageObject: srcPage
                                                });
                                              }

                                              // Format sentence helper to bolden target phrase
                                              const formatSentence = (sentenceText, anchor) => {
                                                if (!sentenceText) return "";
                                                if (!anchor) return sentenceText;
                                                const escapedAnchor = anchor.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                                                const regex = new RegExp(`(${escapedAnchor})`, 'gi');
                                                return sentenceText.replace(regex, '<strong>$1</strong>');
                                              };

                                              return recs.map((rec, rIdx) => {
                                                const key = `${page.pageUrl}-${rec.sourceUrl}-${rIdx}`;
                                                const isGen = isGenerating[key];
                                                const sentence = generatedSentences[key];
                                                const srcPage = rec.srcPageObject;
                                                const displayAnchor = editedAnchors[key] || rec.recommendedAnchor;
                                                const isEditingThis = editingAnchorKey === key;

                                                return (
                                                  <tr key={rIdx} style={{ borderBottom: rIdx < recs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                                    <td style={{ padding: '12px 14px', width: '20%' }}>
                                                      {isEditingThis ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                          <input
                                                            type="text"
                                                            value={editingAnchorText}
                                                            onChange={(e) => setEditingAnchorText(e.target.value)}
                                                            onKeyDown={(e) => {
                                                              if (e.key === 'Enter') {
                                                                const prevAnchor = editedAnchors[key] || rec.recommendedAnchor;
                                                                const newAnchor = editingAnchorText.trim();
                                                                if (newAnchor && newAnchor !== prevAnchor) {
                                                                  setEditedAnchors(prev => ({ ...prev, [key]: newAnchor }));
                                                                  setGeneratedSentences(prev => {
                                                                    const next = { ...prev };
                                                                    delete next[key];
                                                                    return next;
                                                                  });
                                                                }
                                                                setEditingAnchorKey(null);
                                                              } else if (e.key === 'Escape') {
                                                                setEditingAnchorKey(null);
                                                              }
                                                            }}
                                                            autoFocus
                                                            style={{
                                                              backgroundColor: '#1e293b',
                                                              border: '1px solid #3b82f6',
                                                              borderRadius: '4px',
                                                              color: 'var(--text-primary)',
                                                              padding: '2px 6px',
                                                              fontSize: '0.8rem',
                                                              width: '100%',
                                                              outline: 'none'
                                                            }}
                                                          />
                                                          <button
                                                            onClick={() => {
                                                              const prevAnchor = editedAnchors[key] || rec.recommendedAnchor;
                                                              const newAnchor = editingAnchorText.trim();
                                                              if (newAnchor && newAnchor !== prevAnchor) {
                                                                setEditedAnchors(prev => ({ ...prev, [key]: newAnchor }));
                                                                setGeneratedSentences(prev => {
                                                                  const next = { ...prev };
                                                                  delete next[key];
                                                                  return next;
                                                                });
                                                              }
                                                              setEditingAnchorKey(null);
                                                            }}
                                                            style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: 0 }}
                                                            title="Save"
                                                          >
                                                            ✓
                                                          </button>
                                                        </div>
                                                      ) : (
                                                        <div 
                                                          style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                                          onClick={() => {
                                                            setEditingAnchorKey(key);
                                                            setEditingAnchorText(displayAnchor);
                                                          }}
                                                        >
                                                          <span style={{ color: '#60a5fa', fontWeight: 600 }}>
                                                            {displayAnchor}
                                                          </span>
                                                          <span 
                                                            style={{ color: '#94a3b8', fontSize: '0.75rem', opacity: 0.6 }}
                                                            title="Edit anchor text"
                                                          >
                                                            ✏️
                                                          </span>
                                                        </div>
                                                      )}
                                                    </td>
                                                    <td style={{ padding: '12px 14px', width: '30%' }}>
                                                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                        <FileText size={16} style={{ color: 'rgba(255,255,255,0.4)', marginTop: '2px', flexShrink: 0 }} />
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rec.sourceTitle}</span>
                                                          <span style={{ fontSize: '0.8rem', color: '#3b82f6', cursor: 'pointer', hover: { textDecoration: 'underline' } }}>
                                                            {rec.sourceUrl}
                                                          </span>
                                                        </div>
                                                      </div>
                                                    </td>
                                                    <td style={{ padding: '12px 14px', width: '35%' }}>
                                                      {sentence ? (
                                                        <>
                                                          {editingSentenceKey === key ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1 }}>
                                                              <input
                                                                type="text"
                                                                value={editingSentenceText}
                                                                onChange={(e) => setEditingSentenceText(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                  if (e.key === 'Enter') {
                                                                    const newSentence = editingSentenceText.trim();
                                                                    if (newSentence) {
                                                                      setGeneratedSentences(prev => ({ ...prev, [key]: newSentence }));
                                                                    }
                                                                    setEditingSentenceKey(null);
                                                                  } else if (e.key === 'Escape') {
                                                                    setEditingSentenceKey(null);
                                                                  }
                                                                }}
                                                                autoFocus
                                                                style={{
                                                                  backgroundColor: '#1e293b',
                                                                  border: '1px solid #3b82f6',
                                                                  borderRadius: '4px',
                                                                  color: 'var(--text-primary)',
                                                                  padding: '2px 6px',
                                                                  fontSize: '0.8rem',
                                                                  flexGrow: 1,
                                                                  outline: 'none'
                                                                }}
                                                              />
                                                              <button
                                                                onClick={() => {
                                                                  const newSentence = editingSentenceText.trim();
                                                                  if (newSentence) {
                                                                    setGeneratedSentences(prev => ({ ...prev, [key]: newSentence }));
                                                                  }
                                                                  setEditingSentenceKey(null);
                                                                }}
                                                                style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}
                                                                title="Save"
                                                              >
                                                                ✓
                                                              </button>
                                                            </div>
                                                          ) : (
                                                            <div 
                                                              style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', cursor: 'pointer' }}
                                                              onClick={() => {
                                                                  setEditingSentenceKey(key);
                                                                  setEditingSentenceText(sentence);
                                                              }}
                                                            >
                                                              <span style={{ fontSize: '1.5rem', fontFamily: 'serif', color: 'rgba(255, 255, 255, 0.15)', lineHeight: 1, marginTop: '-4px' }}>“</span>
                                                              <span 
                                                                  style={{ color: 'var(--text-primary)', fontStyle: 'normal' }}
                                                                  dangerouslySetInnerHTML={{ __html: formatSentence(sentence, displayAnchor) }}
                                                              />
                                                              <span 
                                                                  style={{ color: '#94a3b8', fontSize: '0.75rem', opacity: 0.6, marginTop: '2px' }}
                                                                  title="Edit sentence text"
                                                              >
                                                                  ✏️
                                                              </span>
                                                            </div>
                                                          )}
                                                        </>
                                                      ) : (
                                                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                          {isGen ? "Generating AI sentence..." : '"AI sentence will appear here."'}
                                                        </span>
                                                      )}
                                                    </td>
                                                    <td style={{ padding: '12px 14px', width: '15%' }}>
                                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {sentence ? (
                                                          <>
                                                            <button
                                                              className="btn-secondary"
                                                              onClick={() => {
                                                                copySentenceHtml(sentence, () => {
                                                                  showNotification("Copied to clipboard!");
                                                                });
                                                              }}
                                                              style={{
                                                                padding: '4px 10px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                border: '1px solid rgba(16, 185, 129, 0.25)',
                                                                color: '#34d399',
                                                                backgroundColor: 'rgba(16, 185, 129, 0.08)'
                                                              }}
                                                            >
                                                              Copy
                                                            </button>
                                                            <button
                                                              className="btn-primary"
                                                              onClick={() => handleInsertLinkToSourcePage(page, rec, sentence)}
                                                              style={{
                                                                padding: '4px 10px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600
                                                              }}
                                                            >
                                                              Insert
                                                            </button>
                                                          </>
                                                        ) : (
                                                          <button
                                                            className="btn-secondary"
                                                            disabled={isGen}
                                                            onClick={() => handleGenerateSentence(page, rec, srcPage, key, displayAnchor)}
                                                            style={{
                                                              padding: '4px 10px',
                                                              fontSize: '0.75rem',
                                                              fontWeight: 600,
                                                              border: '1px solid rgba(59, 130, 246, 0.25)',
                                                              color: '#60a5fa',
                                                              backgroundColor: 'rgba(59, 130, 246, 0.08)',
                                                              opacity: isGen ? 0.5 : 1,
                                                              cursor: isGen ? 'not-allowed' : 'pointer',
                                                              display: 'flex',
                                                              alignItems: 'center',
                                                              gap: '4px'
                                                            }}
                                                          >
                                                            <Sparkles size={12} /> {isGen ? "Generating..." : "Generate"}
                                                          </button>
                                                        )}
                                                      </div>
                                                    </td>
                                                  </tr>
                                                );
                                              });
                                            })()}
                                          </tbody>
                                        </table>
                                        {(() => {
                                          const sources = getSuggestedSources(page, configuredPagesList, linkCheck.incomingAnchors);
                                          return sources.length < needed && (
                                            <div style={{
                                              marginTop: '12px',
                                              padding: '10px 14px',
                                              borderRadius: '6px',
                                              backgroundColor: 'rgba(245, 158, 11, 0.08)',
                                              border: '1px solid rgba(245, 158, 11, 0.15)',
                                              color: '#fbbf24',
                                              fontSize: '0.8rem',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '8px'
                                            }}>
                                              <AlertTriangle size={14} />
                                              <span>
                                                Only {sources.length} unique source page{sources.length === 1 ? '' : 's'} {sources.length === 1 ? 'is' : 'are'} currently available. Add more content or configure additional pages to increase internal linking opportunities.
                                              </span>
                                            </div>
                                          );
                                        })()}
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginTop: '1rem' }}>
                                          <span style={{ color: '#3b82f6', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>Show more</span>
                                          <ChevronDown size={14} style={{ color: '#3b82f6' }} />
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {linkResults.length === 0 ? (
                                  <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                                    No configured pages available for Internal Linking checks. Configure pages inside the Page Audit module first.
                                  </div>
                                ) : (
                                  linkResults.map(({ page, linkCheck, currentCount, isFail, isWarning, badgeColor, badgeBg, labelText, priority }) => {
                                    const isExpanded = !!expandedLinkRows[page.pageUrl];
                                    return (
                                      <div 
                                        key={page.pageUrl}
                                        style={{
                                          backgroundColor: '#070b13',
                                          border: '1px solid var(--border-color)',
                                          borderRadius: '12px',
                                          padding: '1.5rem',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '1.25rem',
                                          textAlign: 'left'
                                        }}
                                      >
                                        {/* Card Header */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                          <div style={{ flex: 1, minWidth: '280px' }}>
                                            <div style={{ fontFamily: 'monospace', fontSize: '1.15rem', color: '#60a5fa', fontWeight: 700, wordBreak: 'break-all' }}>
                                              {page.pageUrl}
                                            </div>
                                          </div>
                                          
                                          {/* Badge and action button */}
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <span style={{
                                              color: badgeColor,
                                              backgroundColor: badgeBg,
                                              padding: '4px 12px',
                                              borderRadius: '6px',
                                              fontSize: '0.85rem',
                                              fontWeight: 700,
                                              border: `1px solid ${badgeColor}25`,
                                              display: 'inline-block'
                                            }}>
                                              {labelText}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Card Body: Metadata Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '0.5rem' }}>
                                          <div>
                                            <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                              Page Title
                                            </span>
                                            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                              {page.pageTitle}
                                            </span>
                                          </div>

                                          <div>
                                            <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                              Target Phrase
                                            </span>
                                            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                              {page.targetPhrase || "Not Set"}
                                            </span>
                                          </div>

                                          <div>
                                            <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                              Incoming Internal Links
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                {currentCount} {currentCount === 1 ? "link" : "links"}
                                              </span>
                                              <button
                                                onClick={() => setExpandedLinkRows(prev => ({
                                                   ...prev,
                                                   [page.pageUrl]: !prev[page.pageUrl]
                                                 }))}
                                                style={{
                                                  background: 'none',
                                                  border: 'none',
                                                  color: '#60a5fa',
                                                  cursor: 'pointer',
                                                  fontSize: '0.8rem',
                                                  padding: 0,
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  gap: '4px',
                                                  fontWeight: 600
                                                }}
                                              >
                                                {isExpanded ? "▲ Hide Details" : "▼ View Details"}
                                              </button>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Card Expanded Details */}
                                        {isExpanded && (() => {
                                          const pageType = getPageType(page);
                                          const resolvedPriority = page.priority || (
                                            pageType === "Hub Page" ? 1
                                            : pageType === "Landing Page" ? 2
                                            : pageType === "Supporting Page" ? 3
                                            : pageType === "Topical Page" ? 4
                                            : 3
                                          );
                                          
                                          let targetCount = 7;
                                           if (resolvedPriority === 1) { targetCount = 15; }
                                           else if (resolvedPriority === 2) { targetCount = 10; }
                                           else if (resolvedPriority === 3) { targetCount = 7; }
                                           else if (resolvedPriority === 4) { targetCount = 5; }
                                          
                                          let statusLabel = "On Target";
                                          let statusColor = "#34d399";
                                          let statusDesc = "Internal linking target achieved.";
                                          let statusCircleBg = "rgba(16, 185, 129, 0.1)";
                                          if (currentCount < targetCount) {
                                             statusLabel = "Needs Links";
                                             statusColor = "#fbbf24";
                                             statusDesc = `Add ${targetCount - currentCount} contextual internal links`;
                                             statusCircleBg = "rgba(245, 158, 11, 0.1)";
                                           } else if (currentCount > targetCount) {
                                             statusLabel = "Complete";
                                             statusColor = "#60a5fa";
                                             statusDesc = "Internal linking target exceeded.";
                                             statusCircleBg = "rgba(59, 130, 246, 0.1)";
                                           }

                                          const existingLinks = [];
                                          const potentialSources = configuredPagesList.filter(p => p.pageUrl !== page.pageUrl);
                                          let sourceIndex = 0;

                                          if (linkCheck.incomingAnchors) {
                                              linkCheck.incomingAnchors.forEach(item => {
                                                const anchorText = item.anchorText || item.anchor || "";
                                                const norm = anchorText.toLowerCase().trim();
                                                if (!norm) return;
                                                
                                                let linkType = "Contextual";
                                                if (norm === "home" || norm === "homepage" || norm === "navigation") {
                                                  linkType = "Navigation";
                                                } else if (norm === "contact" || norm === "about" || norm === "gallery") {
                                                  linkType = "Navigation";
                                                }
                                                
                                                if (linkType === "Contextual") {
                                                  let sourcePage = null;
                                                  if (item.sourcePageUrl) {
                                                    sourcePage = sortedPages.find(p => p.pageUrl === item.sourcePageUrl);
                                                  }
                                                  if (!sourcePage) {
                                                    sourcePage = potentialSources[sourceIndex % potentialSources.length];
                                                    sourceIndex++;
                                                  }

                                                  existingLinks.push({
                                                    anchor: anchorText,
                                                    type: linkType,
                                                    sourceTitle: sourcePage ? sourcePage.pageTitle : "Unknown Source",
                                                    sourceUrl: sourcePage ? sourcePage.pageUrl : "/",
                                                    sourcePageObj: sourcePage
                                                  });
                                                }
                                              });
                                            }

                                          return (
                                            <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1.5rem', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', textAlign: 'left' }}>
                                              
                                              {/* 1. Header */}
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{
                                                  width: '48px',
                                                  height: '48px',
                                                  borderRadius: '50%',
                                                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                  color: '#3b82f6',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  flexShrink: 0
                                                }}>
                                                  <Link size={24} />
                                                </div>
                                                <div>
                                                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: 'Outfit', lineHeight: 1.2 }}>
                                                    {page.pageUrl}
                                                  </h3>
                                                  <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 500 }}>
                                                    {page.pageTitle}
                                                  </div>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                                                    <span style={{
                                                      color: '#3b82f6',
                                                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                                                      padding: '2px 8px',
                                                      borderRadius: '4px',
                                                      fontSize: '0.75rem',
                                                      fontWeight: 700,
                                                      border: '1px solid rgba(59, 130, 246, 0.15)'
                                                    }}>
                                                      Priority {resolvedPriority}
                                                    </span>
                                                    <span style={{
                                                      color: 'var(--text-primary)',
                                                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                                      padding: '2px 8px',
                                                      borderRadius: '4px',
                                                      fontSize: '0.75rem',
                                                      fontWeight: 700,
                                                      border: '1px solid rgba(255, 255, 255, 0.08)'
                                                    }}>
                                                      {pageType}
                                                    </span>
                                                    {page.targetPhrase && (
                                                      <>
                                                        <span style={{ color: 'rgba(255, 255, 255, 0.15)', margin: '0 4px' }}>|</span>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                          Target phrase: <strong style={{ color: '#3b82f6' }}>{page.targetPhrase}</strong>
                                                        </span>
                                                      </>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>

                                              {/* 2. Summary Block */}
                                              <div className="w4-summary-panel" style={{ gap: '1rem' }}>
                                                {/* Card 1: Current Links */}
                                                <div className="w4-summary-col" style={{ padding: '1rem', gap: '0.75rem', borderRadius: '8px' }}>
                                                  <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                    color: '#10b981',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                  }}>
                                                    <Link size={18} />
                                                  </div>
                                                  <div>
                                                    <span style={{ fontSize: '0.675rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', letterSpacing: '0.05em' }}>
                                                      Current Links
                                                    </span>
                                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '1px' }}>
                                                      <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit' }}>
                                                        {currentCount}
                                                      </span>
                                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        {currentCount === 1 ? "link found" : "links found"}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Card 2: Target Links */}
                                                <div className="w4-summary-col" style={{ padding: '1rem', gap: '0.75rem', borderRadius: '8px' }}>
                                                  <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                    color: '#3b82f6',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                  }}>
                                                    <Target size={18} />
                                                  </div>
                                                  <div>
                                                    <span style={{ fontSize: '0.675rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', letterSpacing: '0.05em' }}>
                                                      Target Links
                                                    </span>
                                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '1px' }}>
                                                      <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit' }}>
                                                        {targetCount}
                                                      </span>
                                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        links
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Card 3: Status */}
                                                <div className="w4-summary-col" style={{ padding: '1rem', gap: '0.75rem', borderRadius: '8px' }}>
                                                  <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    backgroundColor: statusCircleBg,
                                                    color: statusColor,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                  }}>
                                                    <TrendingUp size={18} />
                                                  </div>
                                                  <div>
                                                    <span style={{ fontSize: '0.675rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', letterSpacing: '0.05em' }}>
                                                      Status
                                                    </span>
                                                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: '1px' }}>
                                                      <span style={{ fontSize: '1rem', fontWeight: 800, color: statusColor, fontFamily: 'Outfit' }}>
                                                        {statusLabel}
                                                      </span>
                                                      <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }} title={statusDesc}>
                                                        {statusDesc}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* 3. Existing Links */}
                                              <div>
                                                <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                                  Existing Links ({existingLinks.length})
                                                </div>
                                                {existingLinks.length === 0 ? (
                                                  <div style={{
                                                    border: '1px dashed var(--border-color)',
                                                    borderRadius: '8px',
                                                    padding: '2rem',
                                                    textAlign: 'center',
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '0.85rem'
                                                  }}>
                                                    No internal links found yet.
                                                  </div>
                                                ) : (
                                                                                                     <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', color: '#cbd5e1', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: '6px', overflow: 'hidden' }}>
                                                     <thead>
                                                       <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'left', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                                         <th style={{ padding: '10px 14px', width: '20%' }}>Source Page Title</th>
                                                         <th style={{ padding: '10px 14px', width: '20%' }}>Source Page URL</th>
                                                         <th style={{ padding: '10px 14px', width: '20%' }}>Anchor Text (Contextual)</th>
                                                         <th style={{ padding: '10px 14px', width: '25%' }}>Link Context</th>
                                                         <th style={{ padding: '10px 14px', width: '15%' }}>Destination URL</th>
                                                       </tr>
                                                     </thead>
                                                     <tbody>
                                                       {(() => {
                                                                                                                  const getLinkContext = (sourcePage, anchorText) => {

                                                                                                                    if (!sourcePage || !sourcePage.crawlData || !sourcePage.crawlData.htmlSnapshot) {

                                                                                                                      return "Context not available";

                                                                                                                    }

                                                                                                                    try {

                                                                                                                      const parser = new DOMParser();

                                                                                                                      const doc = parser.parseFromString(sourcePage.crawlData.htmlSnapshot, "text/html");

                                                                                                                      

                                                                                                                      const getPrimaryContentContainer = (d) => {

                                                                                                                        const selectors = [

                                                                                                                          '.entry-content',

                                                                                                                          '.post-content',

                                                                                                                          '.elementor-widget-theme-post-content',

                                                                                                                          'article',

                                                                                                                          'main',

                                                                                                                          'body > div.elementor'

                                                                                                                        ];

                                                                                                                        for (let i = 0; i < selectors.length; i++) {

                                                                                                                          const elms = d.querySelectorAll(selectors[i]);

                                                                                                                          if (elms.length > 0) {

                                                                                                                            if (elms.length === 1) return elms[0];

                                                                                                                            let bestCandidate = elms[0];

                                                                                                                            let bestScore = -1;

                                                                                                                            elms.forEach(el => {

                                                                                                                              const textLength = el.textContent ? el.textContent.trim().length : 0;

                                                                                                                              const pCount = el.querySelectorAll('p').length;

                                                                                                                              const score = textLength + pCount * 100;

                                                                                                                              if (score > bestScore) {

                                                                                                                                bestScore = score;

                                                                                                                                bestCandidate = el;

                                                                                                                              }

                                                                                                                            });

                                                                                                                            return bestCandidate;

                                                                                                                          }

                                                                                                                        }

                                                                                                                        return null;

                                                                                                                      };

                                                                                                                      

                                                                                                                      const container = getPrimaryContentContainer(doc);

                                                                                                                      if (!container) {

                                                                                                                        return "Context not found";

                                                                                                                      }

                                                                                                                      

                                                                                                                      const anchors = container.querySelectorAll("a");

                                                                                                                      let targetAnchor = null;

                                                                                                                      const destRel = getRelativeUrl(page.pageUrl, selectedSite.url);

                                                                                                                      const cleanAnchor = (anchorText || "").toLowerCase().trim();

                                                                                                                      

                                                                                                                      for (let i = 0; i < anchors.length; i++) {

                                                                                                                        const a = anchors[i];

                                                                                                                        const href = a.getAttribute("href");

                                                                                                                        if (!href) continue;

                                                                                                                        const hrefRel = getRelativeUrl(href, selectedSite.url);

                                                                                                                        if (hrefRel === destRel && a.textContent.replace(/<[^>]*>/g, "").trim().toLowerCase() === cleanAnchor) {

                                                                                                                          targetAnchor = a;

                                                                                                                          break;

                                                                                                                        }

                                                                                                                      }

                                                                                                                      

                                                                                                                      if (!targetAnchor) {

                                                                                                                        return "Context not found";

                                                                                                                      }

                                                                                                                      

                                                                                                                      let textBefore = "";

                                                                                                                      let textAfter = "";

                                                                                                                      

                                                                                                                      let prev = targetAnchor.previousSibling;

                                                                                                                      while (prev && textBefore.length < 50) {

                                                                                                                        textBefore = (prev.textContent || "") + textBefore;

                                                                                                                        prev = prev.previousSibling;

                                                                                                                      }

                                                                                                                      if (textBefore.length < 50 && targetAnchor.parentElement) {

                                                                                                                        let parentPrev = targetAnchor.parentElement.previousSibling;

                                                                                                                        while (parentPrev && textBefore.length < 50) {

                                                                                                                          textBefore = (parentPrev.textContent || "") + textBefore;

                                                                                                                          parentPrev = parentPrev.previousSibling;

                                                                                                                        }

                                                                                                                      }

                                                                                                                      

                                                                                                                      let next = targetAnchor.nextSibling;

                                                                                                                      while (next && textAfter.length < 50) {

                                                                                                                        textAfter = textAfter + (next.textContent || "");

                                                                                                                        next = next.nextSibling;

                                                                                                                      }

                                                                                                                      if (textAfter.length < 50 && targetAnchor.parentElement) {

                                                                                                                        let parentNext = targetAnchor.parentElement.nextSibling;

                                                                                                                        while (parentNext && textAfter.length < 50) {

                                                                                                                          textAfter = textAfter + (parentNext.textContent || "");

                                                                                                                          parentNext = parentNext.nextSibling;

                                                                                                                        }

                                                                                                                      }

                                                                                                                      

                                                                                                                      textBefore = textBefore.replace(/\s+/g, ' ');

                                                                                                                      textAfter = textAfter.replace(/\s+/g, ' ');

                                                                                                                      

                                                                                                                      const slicedBefore = textBefore.slice(-45);

                                                                                                                      const slicedAfter = textAfter.slice(0, 45);

                                                                                                                      

                                                                                                                      let snippet = (slicedBefore ? "..." : "") + slicedBefore + targetAnchor.textContent.trim() + slicedAfter + (slicedAfter ? "..." : "");

                                                                                                                      return snippet.replace(/\s+/g, ' ').trim();

                                                                                                                    } catch (e) {

                                                                                                                      console.error("Failed to extract hyperlink context:", e);

                                                                                                                      return "Context not available";

                                                                                                                    }

                                                                                                                  };
                                                         // legacy declaration replacement dummy;

                                                         return existingLinks.map((link, lIdx) => {
                                                           const contextText = getLinkContext(link.sourcePageObj, link.anchor);
                                                           return (
                                                             <tr key={lIdx} style={{ borderBottom: lIdx < existingLinks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                                               <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                                 {link.sourceTitle}
                                                               </td>
                                                               <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#94a3b8' }}>
                                                                 {link.sourceUrl}
                                                               </td>
                                                               <td style={{ padding: '10px 14px', color: '#cbd5e1', fontWeight: 600 }}>
                                                                 {link.anchor}
                                                               </td>
                                                               <td style={{ padding: '10px 14px', color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.75rem' }} title={contextText}>
                                                                 {renderHighlightedContext(contextText, link.anchor)}
                                                               </td>
                                                               <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#94a3b8' }}>
                                                                 {page.pageUrl}
                                                               </td>
                                                             </tr>
                                                           );
                                                         });
                                                       })()}
                                                     </tbody>
                                                   </table>
                                                )}
                                              </div>

                                              {/* 4. Recommended Links */}
                                              <div>
                                                <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                                  Recommended Links (Target: {targetCount})
                                                </div>
                                                {(() => {
                                                  const needed = Math.max(0, targetCount - currentCount);
                                                  if (needed <= 0) {
                                                    return (
                                                      <div style={{
                                                        border: '1px dashed rgba(52, 211, 153, 0.15)',
                                                        borderRadius: '8px',
                                                        padding: '2rem',
                                                        textAlign: 'center',
                                                        backgroundColor: 'rgba(52, 211, 153, 0.01)',
                                                        color: '#34d399',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 600
                                                      }}>
                                                        No new links required. Sufficient internal links exist.
                                                      </div>
                                                    );
                                                  }

                                                  const sources = getSuggestedSources(page, configuredPagesList, linkCheck.incomingAnchors);
                                                  const recs = [];
                                                  const limit = Math.min(needed, sources.length);
                                                  for (let i = 0; i < limit; i++) {
                                                    const srcPage = sources[i];
                                                    recs.push({
                                                      recommendedAnchor: getAnchorVariation(page.targetPhrase, srcPage, page, i),
                                                      sourceTitle: srcPage ? srcPage.pageTitle : "Hub Page",
                                                      sourceUrl: srcPage ? srcPage.pageUrl : "/",
                                                      srcPageObject: srcPage
                                                    });
                                                  }

                                                  const formatSentence = (sentenceText, anchor) => {
                                                    if (!sentenceText) return "";
                                                    if (!anchor) return sentenceText;
                                                    const escapedAnchor = anchor.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                                                    const regex = new RegExp(`(${escapedAnchor})`, 'gi');
                                                    return sentenceText.replace(regex, '<strong>$1</strong>');
                                                  };

                                                  return (
                                                    <>
                                                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#cbd5e1', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: '6px', overflow: 'hidden' }}>
                                                      <thead>
                                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'left', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                                          <th style={{ padding: '10px 14px', width: '20%' }}>Anchor Text</th>
                                                          <th style={{ padding: '10px 14px', width: '30%' }}>Suggested Source Page</th>
                                                          <th style={{ padding: '10px 14px', width: '35%' }}>AI Suggested Sentence</th>
                                                          <th style={{ padding: '10px 14px', width: '15%' }}>Action</th>
                                                        </tr>
                                                      </thead>
                                                      <tbody>
                                                        {recs.map((rec, rIdx) => {
                                                          const key = `${page.pageUrl}-${rec.sourceUrl}-${rIdx}`;
                                                          const isGen = isGenerating[key];
                                                          const sentence = generatedSentences[key];
                                                          const srcPage = rec.srcPageObject;
                                                          const displayAnchor = editedAnchors[key] || rec.recommendedAnchor;
                                                          const isEditingThis = editingAnchorKey === key;

                                                          return (
                                                            <tr key={rIdx} style={{ borderBottom: rIdx < recs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                                              <td style={{ padding: '12px 14px', width: '20%' }}>
                                                                {isEditingThis ? (
                                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <input
                                                                      type="text"
                                                                      value={editingAnchorText}
                                                                      onChange={(e) => setEditingAnchorText(e.target.value)}
                                                                      onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                          const prevAnchor = editedAnchors[key] || rec.recommendedAnchor;
                                                                          const newAnchor = editingAnchorText.trim();
                                                                          if (newAnchor && newAnchor !== prevAnchor) {
                                                                            setEditedAnchors(prev => ({ ...prev, [key]: newAnchor }));
                                                                            setGeneratedSentences(prev => {
                                                                              const next = { ...prev };
                                                                              delete next[key];
                                                                              return next;
                                                                            });
                                                                          }
                                                                          setEditingAnchorKey(null);
                                                                        } else if (e.key === 'Escape') {
                                                                          setEditingAnchorKey(null);
                                                                        }
                                                                      }}
                                                                      autoFocus
                                                                      style={{
                                                                        backgroundColor: '#1e293b',
                                                                        border: '1px solid #3b82f6',
                                                                        borderRadius: '4px',
                                                                        color: 'var(--text-primary)',
                                                                        padding: '2px 6px',
                                                                        fontSize: '0.8rem',
                                                                        width: '100%',
                                                                        outline: 'none'
                                                                      }}
                                                                    />
                                                                    <button
                                                                      onClick={() => {
                                                                        const prevAnchor = editedAnchors[key] || rec.recommendedAnchor;
                                                                        const newAnchor = editingAnchorText.trim();
                                                                        if (newAnchor && newAnchor !== prevAnchor) {
                                                                          setEditedAnchors(prev => ({ ...prev, [key]: newAnchor }));
                                                                          setGeneratedSentences(prev => {
                                                                            const next = { ...prev };
                                                                            delete next[key];
                                                                            return next;
                                                                          });
                                                                        }
                                                                        setEditingAnchorKey(null);
                                                                      }}
                                                                      style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: 0 }}
                                                                      title="Save"
                                                                    >
                                                                      ✓
                                                                    </button>
                                                                  </div>
                                                                ) : (
                                                                  <div 
                                                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                                                    onClick={() => {
                                                                      setEditingAnchorKey(key);
                                                                      setEditingAnchorText(displayAnchor);
                                                                    }}
                                                                  >
                                                                    <span style={{ color: '#60a5fa', fontWeight: 600 }}>
                                                                      {displayAnchor}
                                                                    </span>
                                                                    <span 
                                                                      style={{ color: '#94a3b8', fontSize: '0.75rem', opacity: 0.6 }}
                                                                      title="Edit anchor text"
                                                                    >
                                                                      ✏️
                                                                    </span>
                                                                  </div>
                                                                )}
                                                              </td>
                                                              <td style={{ padding: '12px 14px', width: '30%' }}>
                                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                                  <FileText size={16} style={{ color: 'rgba(255,255,255,0.4)', marginTop: '2px', flexShrink: 0 }} />
                                                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rec.sourceTitle}</span>
                                                                    <span style={{ fontSize: '0.8rem', color: '#3b82f6', cursor: 'pointer' }}>
                                                                      {rec.sourceUrl}
                                                                    </span>
                                                                  </div>
                                                                </div>
                                                              </td>
                                                              <td style={{ padding: '12px 14px', width: '35%' }}>
                                                                {sentence ? (
                                                                  <>
                                                                    {editingSentenceKey === key ? (
                                                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1 }}>
                                                                        <input
                                                                          type="text"
                                                                          value={editingSentenceText}
                                                                          onChange={(e) => setEditingSentenceText(e.target.value)}
                                                                          onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                              const newSentence = editingSentenceText.trim();
                                                                              if (newSentence) {
                                                                                setGeneratedSentences(prev => ({ ...prev, [key]: newSentence }));
                                                                              }
                                                                              setEditingSentenceKey(null);
                                                                            } else if (e.key === 'Escape') {
                                                                              setEditingSentenceKey(null);
                                                                            }
                                                                          }}
                                                                          autoFocus
                                                                          style={{
                                                                            backgroundColor: '#1e293b',
                                                                            border: '1px solid #3b82f6',
                                                                            borderRadius: '4px',
                                                                            color: 'var(--text-primary)',
                                                                            padding: '2px 6px',
                                                                            fontSize: '0.8rem',
                                                                            flexGrow: 1,
                                                                            outline: 'none'
                                                                          }}
                                                                        />
                                                                        <button
                                                                          onClick={() => {
                                                                            const newSentence = editingSentenceText.trim();
                                                                            if (newSentence) {
                                                                              setGeneratedSentences(prev => ({ ...prev, [key]: newSentence }));
                                                                            }
                                                                            setEditingSentenceKey(null);
                                                                          }}
                                                                          style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}
                                                                          title="Save"
                                                                        >
                                                                          ✓
                                                                        </button>
                                                                      </div>
                                                                    ) : (
                                                                      <div 
                                                                        style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', cursor: 'pointer' }}
                                                                        onClick={() => {
                                                                            setEditingSentenceKey(key);
                                                                            setEditingSentenceText(sentence);
                                                                        }}
                                                                      >
                                                                        <span style={{ fontSize: '1.5rem', fontFamily: 'serif', color: 'rgba(255, 255, 255, 0.15)', lineHeight: 1, marginTop: '-4px' }}>“</span>
                                                                        <span 
                                                                            style={{ color: 'var(--text-primary)', fontStyle: 'normal' }}
                                                                            dangerouslySetInnerHTML={{ __html: formatSentence(sentence, displayAnchor) }}
                                                                        />
                                                                        <span 
                                                                            style={{ color: '#94a3b8', fontSize: '0.75rem', opacity: 0.6, marginTop: '2px' }}
                                                                            title="Edit sentence text"
                                                                        >
                                                                            ✏️
                                                                        </span>
                                                                      </div>
                                                                    )}
                                                                  </>
                                                                ) : (
                                                                  <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                                    {isGen ? "Generating AI sentence..." : '"AI sentence will appear here."'}
                                                                  </span>
                                                                )}
                                                              </td>
                                                              <td style={{ padding: '12px 14px', width: '15%' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                  {sentence ? (
                                                                    <>
                                                                      <button
                                                                        className="btn-secondary"
                                                                        onClick={() => {
                                                                          copySentenceHtml(sentence, () => {
                                                                            showNotification("Copied to clipboard!");
                                                                          });
                                                                        }}
                                                                        style={{
                                                                          padding: '4px 10px',
                                                                          fontSize: '0.75rem',
                                                                          fontWeight: 600,
                                                                          border: '1px solid rgba(16, 185, 129, 0.25)',
                                                                          color: '#34d399',
                                                                          backgroundColor: 'rgba(16, 185, 129, 0.08)'
                                                                        }}
                                                                      >
                                                                        Copy
                                                                      </button>
                                                                      <button
                                                                        className="btn-primary"
                                                                        onClick={() => handleInsertLinkToSourcePage(page, rec, sentence)}
                                                                        style={{
                                                                          padding: '4px 10px',
                                                                          fontSize: '0.75rem',
                                                                          fontWeight: 600
                                                                        }}
                                                                      >
                                                                        Insert
                                                                      </button>
                                                                    </>
                                                                  ) : (
                                                                    <button
                                                                      className="btn-secondary"
                                                                      disabled={isGen}
                                                                      onClick={() => handleGenerateSentence(page, rec, srcPage, key, displayAnchor)}
                                                                      style={{
                                                                        padding: '4px 10px',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 600,
                                                                        border: '1px solid rgba(59, 130, 246, 0.25)',
                                                                        color: '#60a5fa',
                                                                        backgroundColor: 'rgba(59, 130, 246, 0.08)',
                                                                        opacity: isGen ? 0.5 : 1,
                                                                        cursor: isGen ? 'not-allowed' : 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px'
                                                                      }}
                                                                    >
                                                                      <Sparkles size={12} /> {isGen ? "Generating..." : "Generate"}
                                                                    </button>
                                                                  )}
                                                                </div>
                                                              </td>
                                                            </tr>
                                                          );
                                                        })}
                                                      </tbody>
                                                    </table>
                                                    {(() => {
                                                      const sources = getSuggestedSources(page, configuredPagesList, linkCheck.incomingAnchors);
                                                      return sources.length < needed && (
                                                        <div style={{
                                                          marginTop: '12px',
                                                          padding: '10px 14px',
                                                          borderRadius: '6px',
                                                          backgroundColor: 'rgba(245, 158, 11, 0.08)',
                                                          border: '1px solid rgba(245, 158, 11, 0.15)',
                                                          color: '#fbbf24',
                                                          fontSize: '0.8rem',
                                                          display: 'flex',
                                                          alignItems: 'center',
                                                          gap: '8px'
                                                        }}>
                                                          <AlertTriangle size={14} />
                                                          <span>
                                                            Only {sources.length} unique source page{sources.length === 1 ? '' : 's'} {sources.length === 1 ? 'is' : 'are'} currently available. Add more content or configure additional pages to increase internal linking opportunities.
                                                          </span>
                                                        </div>
                                                      );
                                                    })()}
                                                    </>
                                                  );
                                                })()}
                                              </div>

                                            </div>
                                          );
                                        })()}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            );
})()}
              </div>
            );
          })()}

          {/* STAGE 3.6: W5 SITE ANALYSIS SHELL */}
          {currentView === "WEBSITES_SITE_ANALYSIS" && selectedSiteId && (() => {
            const selectedSite = sites.find(s => s.id === selectedSiteId);
            return (
              <div>
                {/* Back navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                  <button 
                    onClick={() => setCurrentView("WEBSITES_CONFIG")}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.35rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      color: 'var(--accent-color)',
                      padding: '8px 16px',
                      marginLeft: '-16px',
                      textDecoration: isBackHovered ? 'underline' : 'none',
                      opacity: isBackHovered ? 0.95 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onMouseEnter={() => setIsBackHovered(true)}
                    onMouseLeave={() => setIsBackHovered(false)}
                  >
                    ← Back to W2 | Website Dashboard
                  </button>
                </div>

                {/* Header Details */}
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#3b82f6cc',
                        backgroundColor: '#3b82f60c',
                        border: '1px solid #3b82f625',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        display: 'inline-block',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        W5 | Analysis
                      </div>
                      <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {selectedSite?.name}
                      </h2>
                      <a 
                        href={selectedSite?.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="site-url-link"
                        style={{ display: 'block', fontSize: '0.9rem', marginTop: '0.35rem', textAlign: 'left' }}
                      >
                        {selectedSite?.url} <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                  {renderModuleNavigation("W5")}
                </div>

                {/* Content Placeholder */}
                {(() => {
                    const site = sites.find(s => s.id === selectedSiteId);
                    if (!site) return null;

                    if (activeModule === 'visual-site-map') {
                      const sitePages = pagesData[site.id] || [];
                      
                      // Classify page types consistently with the main list
                      const getGroupedPageType = (page) => {
                        if (isPageExcluded(page)) return "Excluded";
                        if (page.assignedType) {
                          if (page.assignedType === "Homepage") return "Homepage";
                          if (page.assignedType === "Hub Page" || page.assignedType === "Hub Pages" || page.assignedType === "Hub") return "Hub Pages";
                          if (page.assignedType === "Landing Page" || page.assignedType === "Landing Pages" || page.assignedType === "Landing" || page.assignedType === "Primary Landing Page") return "Landing Pages";
                          if (page.assignedType === "Supporting Page" || page.assignedType === "Supporting Pages" || page.assignedType === "Supporting") return "Supporting Pages";
                          if (page.assignedType === "Topical Page" || page.assignedType === "Topical Pages" || page.assignedType === "Topical") return "Topical Pages";
                          return "Unassigned Pages";
                        }
                        const url = page.pageUrl;
                        if (url === "/") return "Homepage";
                        const score = getPageSEOScore(page);
                        switch (score) {
                          case 0: return "Homepage";
                          case 1:
                          case 2: return "Landing Pages";
                          case 3: return "Supporting Pages";
                          case 4: return "Topical Pages";
                          default: return "Unassigned Pages";
                        }
                      };

                      // Construct the hierarchical tree model
                      const rootNode = { 
                        pageUrl: "/", 
                        pageTitle: "Homepage", 
                        type: "Homepage", 
                        children: [] 
                      };
                      
                      const landingNodes = [];
                      const otherPages = [];

                      sitePages.forEach(p => {
                        if (p.assignedType === "Excluded") return;
                        const type = getGroupedPageType(p);
                        if (type === "Homepage") {
                          rootNode.pageTitle = p.pageTitle || "Homepage";
                          rootNode.targetPhrase = p.targetPhrase;
                        } else if (type === "Hub Pages" || type === "Landing Pages") {
                          landingNodes.push({ ...p, type, children: [] });
                        } else {
                          otherPages.push({ ...p, type });
                        }
                      });

                      // Assign supporting/topical pages to the best matching parent landing page based on URL keyword overlap
                      otherPages.forEach(p => {
                        let bestParent = null;
                        let maxOverlap = 0;
                        
                        const getUrlWords = (url) => {
                          return url.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 3 && w !== "page" && w !== "html");
                        };
                        
                        const pWords = getUrlWords(p.pageUrl);
                        
                        landingNodes.forEach(ln => {
                          const lnWords = getUrlWords(ln.pageUrl);
                          const overlap = pWords.filter(w => lnWords.includes(w)).length;
                          if (overlap > maxOverlap) {
                            maxOverlap = overlap;
                            bestParent = ln;
                          }
                        });
                        
                        if (bestParent) {
                          bestParent.children.push(p);
                        } else {
                          rootNode.children.push(p);
                        }
                      });

                      // Prepend all matched landing nodes to the root's children list
                      rootNode.children.unshift(...landingNodes);

                      return (
                        <div style={{ textAlign: 'left' }}>
                          {/* Back navigation */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                            <button 
                              onClick={() => setActiveModule('site-structure')}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                fontSize: '0.9rem', 
                                cursor: 'pointer', 
                                color: 'var(--text-secondary)', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                padding: 0
                              }}
                            >
                              <ArrowLeft size={16} /> Back to Site Structure
                            </button>
                          </div>

                          {/* Visual Tree Map Card Container */}
                          <div style={{
                            backgroundColor: 'var(--surface-color)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2.5rem',
                            overflowX: 'auto'
                          }}>
                            <div>
                              <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
                                Visual Site Map
                              </h2>
                              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                {site.name} ({site.url})
                              </span>
                            </div>

                            {/* Connected Tree Nodes Layout */}
                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', minWidth: 'max-content', paddingLeft: '0.5rem', gap: '3rem' }}>
                              
                              {/* Homepage (Root Node Column) */}
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignSelf: 'center',
                                position: 'relative',
                                paddingRight: '3rem'
                              }}>
                                <div style={{
                                  backgroundColor: '#070b13',
                                  border: '2px solid #10b981',
                                  borderRadius: '8px',
                                  padding: '1rem 1.25rem',
                                  minWidth: '260px',
                                  maxWidth: '320px',
                                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
                                  zIndex: 2,
                                  textAlign: 'left'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: '#34d399', fontWeight: 700, letterSpacing: '0.05em' }}>
                                      Homepage (Root)
                                    </span>
                                    {rootNode.targetPhrase && (
                                      <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>
                                        Target: {rootNode.targetPhrase}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', fontFamily: 'Outfit' }}>
                                    {rootNode.pageTitle}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#60a5fa', marginTop: '6px', wordBreak: 'break-all' }}>
                                    {rootNode.pageUrl}
                                  </div>
                                </div>

                                {/* Line connector extending right from Homepage card to the main stem */}
                                {rootNode.children.length > 0 && (
                                  <div style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '50%',
                                    width: '3rem',
                                    height: '2px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    zIndex: 1
                                  }} />
                                )}
                              </div>

                              {/* Branch Nodes Column (Landing Pages & their Sub-stems) */}
                              {rootNode.children.length > 0 && (
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '2.5rem',
                                  borderLeft: '2px solid rgba(255, 255, 255, 0.08)',
                                  paddingLeft: '3rem',
                                  position: 'relative'
                                }}>
                                  {rootNode.children.map((child, cIdx) => {
                                    const hasGrandchildren = child.children && child.children.length > 0;
                                    return (
                                      <div 
                                        key={cIdx} 
                                        style={{ 
                                          display: 'flex', 
                                          flexDirection: 'row', 
                                          alignItems: 'center', 
                                          gap: '3rem', 
                                          position: 'relative' 
                                        }}
                                      >
                                        {/* Horizontal connection line from main stem on the left to this Landing card */}
                                        <div style={{
                                          position: 'absolute',
                                          left: '-3rem',
                                          top: '50%',
                                          width: '3rem',
                                          height: '2px',
                                          backgroundColor: 'rgba(255, 255, 255, 0.08)'
                                        }} />

                                        {/* Landing / Hub Node Card */}
                                        <div style={{
                                          backgroundColor: '#0c101b',
                                          border: '1px solid var(--border-color)',
                                          borderRadius: '8px',
                                          padding: '0.85rem 1.15rem',
                                          minWidth: '240px',
                                          maxWidth: '320px',
                                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                          zIndex: 2,
                                          textAlign: 'left',
                                          position: 'relative'
                                        }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ 
                                              fontSize: '0.7rem', 
                                              fontWeight: 700, 
                                              color: child.type === "Hub Pages" ? "#a78bfa" : "#38bdf8",
                                              backgroundColor: child.type === "Hub Pages" ? "rgba(167, 139, 250, 0.08)" : "rgba(56, 189, 248, 0.08)",
                                              padding: '2px 6px',
                                              borderRadius: '4px'
                                            }}>
                                              {child.type === "Hub Pages" ? "Hub Page" : "Landing Page"}
                                            </span>
                                            {child.targetPhrase && (
                                              <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>
                                                Target: {child.targetPhrase}
                                              </span>
                                            )}
                                          </div>
                                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px', fontFamily: 'Outfit' }}>
                                            {child.pageTitle}
                                          </div>
                                          <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#60a5fa', marginTop: '4px', wordBreak: 'break-all' }}>
                                            {child.pageUrl}
                                          </div>

                                          {/* Horizontal connection line extending right from Landing card to its grandchildren stem */}
                                          {hasGrandchildren && (
                                            <div style={{
                                              position: 'absolute',
                                              right: '-3rem',
                                              top: '50%',
                                              width: '3rem',
                                              height: '2px',
                                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                              zIndex: 1
                                            }} />
                                          )}
                                        </div>

                                        {/* Grandchildren Column (Supporting / Topical Pages) */}
                                        {hasGrandchildren && (
                                          <div style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            gap: '1.5rem',
                                            position: 'relative',
                                            alignItems: 'center'
                                          }}>
                                            {/* Continuous horizontal connection line behind all grandchildren cards */}
                                            <div style={{
                                              position: 'absolute',
                                              left: '-3rem',
                                              top: '50%',
                                              width: 'calc(100% + 3rem)',
                                              height: '2px',
                                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                              zIndex: 1
                                            }} />

                                            {child.children.map((grandchild, gIdx) => (
                                              <div 
                                                key={gIdx}
                                                style={{
                                                  backgroundColor: '#070b13',
                                                  border: '1px dashed var(--border-color)',
                                                  borderRadius: '6px',
                                                  padding: '0.75rem 1rem',
                                                  minWidth: '220px',
                                                  maxWidth: '300px',
                                                  position: 'relative',
                                                  zIndex: 2,
                                                  textAlign: 'left'
                                                }}
                                              >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                  <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                    Supporting Page
                                                  </span>
                                                  {grandchild.targetPhrase && (
                                                    <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600 }}>
                                                      {grandchild.targetPhrase}
                                                    </span>
                                                  )}
                                                </div>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                                                  {grandchild.pageTitle}
                                                </div>
                                                <div style={{ fontSize: '0.725rem', fontFamily: 'monospace', color: '#94a3b8', marginTop: '4px', wordBreak: 'break-all' }}>
                                                  {grandchild.pageUrl}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    const sitePages = pagesData[site.id] || [];
                    const pagesFound = sitePages.filter(p => !isPageExcluded(p)).length || (site.id === 'bathroom-upgrades' ? 33 : 113);
                    const configuredPages = sitePages.filter(p => p.status === "Configured" && p.assignedType !== "Excluded").length;
                    const hasAudit = !!site.lastAudit;
                    const auditStatusText = hasAudit ? `Analysed (${site.lastAudit})` : "Pending Analysis";

                    const tabs = [
                      { id: null, label: "Overview" },
                      { id: "site-structure", label: "Site Structure" },
                      { id: "external-links", label: "External Links" },
                      { id: "content-coverage", label: "Content Coverage" },
                      { id: "opportunities", label: "Opportunities" }
                    ];

                    const getPageCategory = (page) => {
                      if (isPageExcluded(page)) return "Excluded";
                      if (page.pageUrl === "/") return "Homepage";
                      if (page.assignedType === "Homepage") return "Homepage";
                      if (page.assignedType === "Hub Page" || page.assignedType === "Hub Pages" || page.assignedType === "Hub") return "Hub Pages";
                      if (page.assignedType === "Landing Page" || page.assignedType === "Landing Pages" || page.assignedType === "Landing" || page.assignedType === "Primary Landing Page") return "Landing Pages";
                      if (page.assignedType === "Supporting Page" || page.assignedType === "Supporting Pages" || page.assignedType === "Supporting") return "Supporting Pages";
                      if (page.assignedType === "Topical Page" || page.assignedType === "Topical Pages" || page.assignedType === "Topical") return "Topical Pages";
                      return "Unassigned Pages";
                    };

                    return (
                      <div>
                        {/* Back navigation */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', textAlign: 'left' }}>
                          <button 
                            onClick={() => {
                              setSelectedAnalysisSiteId(null);
                              setActiveModule(null);
                            }}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              fontSize: '0.9rem', 
                              cursor: 'pointer', 
                              color: 'var(--text-secondary)', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '8px',
                              padding: 0
                            }}
                          >
                            <ArrowLeft size={16} /> Back to Site Analysis Overview
                          </button>
                        </div>

                        {/* Top banner card */}
                        <div style={{
                          backgroundColor: '#0c101b',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          padding: '1.5rem',
                          textAlign: 'left',
                          marginBottom: '2rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                              <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
                                {site.name}
                              </h2>
                              <a 
                                href={site.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ 
                                  fontSize: '0.9rem', 
                                  color: '#10b981', 
                                  textDecoration: 'none', 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '4px',
                                  fontWeight: 500
                                }}
                              >
                                {site.url} <ExternalLink size={12} />
                              </a>
                            </div>
                          </div>

                          <hr style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '1.25rem 0', borderStyle: 'solid', borderWidth: '1px 0 0 0' }} />

                          <div style={{ display: 'flex', gap: '3.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', letterSpacing: '0.05em' }}>
                                Pages Found
                              </span>
                              <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--text-primary)', display: 'block', marginTop: '0.35rem' }}>
                                {pagesFound}
                              </span>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', letterSpacing: '0.05em' }}>
                                Configured Pages
                              </span>
                              <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--text-primary)', display: 'block', marginTop: '0.35rem' }}>
                                {configuredPages}
                              </span>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', letterSpacing: '0.05em' }}>
                                Last Analysis
                              </span>
                              <div style={{ marginTop: '0.35rem' }}>
                                <span style={{
                                  fontWeight: 700,
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  backgroundColor: hasAudit ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                  color: hasAudit ? '#34d399' : '#fbbf24',
                                  border: hasAudit ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)',
                                  display: 'inline-block'
                                }}>
                                  {auditStatusText}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Navigation Tabs */}
                          <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            borderTop: '1px solid rgba(255,255,255,0.06)',
                            marginTop: '1.5rem',
                            paddingTop: '1rem',
                            flexWrap: 'wrap'
                          }}>
                            {tabs.map(tab => {
                              const isActive = activeModule === tab.id;
                              return (
                                <button
                                  key={tab.label}
                                  onClick={() => setActiveModule(tab.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '8px 16px',
                                    fontSize: '0.9rem',
                                    fontWeight: isActive ? 700 : 500,
                                    color: isActive ? '#34d399' : 'var(--text-secondary)',
                                    borderBottom: isActive ? '2px solid #10b981' : '2px solid transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    outline: 'none',
                                    marginBottom: '-1px'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                                  }}
                                >
                                  {tab.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Page Module Contents */}
                        {(() => {
                          if (activeModule === 'site-structure') {
                            const sortedPages = sortPagesForSEO(sitePages);

                            const getGroupedPageType = (page) => {
                              if (isPageExcluded(page)) return "Excluded";
                              if (page.assignedType) {
                                if (page.assignedType === "Homepage") return "Homepage";
                                if (page.assignedType === "Hub Page" || page.assignedType === "Hub Pages" || page.assignedType === "Hub") return "Hub Pages";
                                if (page.assignedType === "Landing Page" || page.assignedType === "Landing Pages" || page.assignedType === "Landing" || page.assignedType === "Primary Landing Page") return "Landing Pages";
                                if (page.assignedType === "Supporting Page" || page.assignedType === "Supporting Pages" || page.assignedType === "Supporting") return "Supporting Pages";
                                if (page.assignedType === "Topical Page" || page.assignedType === "Topical Pages" || page.assignedType === "Topical") return "Topical Pages";
                                return "Unassigned Pages";
                              }
                              const url = page.pageUrl;
                              if (url === "/") return "Homepage";
                              const score = getPageSEOScore(page);
                              switch (score) {
                                case 0: return "Homepage";
                                case 1:
                                case 2: return "Landing Pages";
                                case 3: return "Supporting Pages";
                                case 4: return "Topical Pages";
                                default: return "Unassigned Pages";
                              }
                            };

                            const sections = [
                              { name: "Homepage", key: "Homepage", pages: sortedPages.filter(p => getGroupedPageType(p) === "Homepage") },
                              { name: "Hub Pages", key: "HubPages", pages: sortedPages.filter(p => getGroupedPageType(p) === "Hub Pages") },
                              { name: "Landing Pages", key: "LandingPages", pages: sortedPages.filter(p => getGroupedPageType(p) === "Landing Pages") },
                              { name: "Supporting Pages", key: "SupportingPages", pages: sortedPages.filter(p => getGroupedPageType(p) === "Supporting Pages") },
                              { name: "Topical Pages", key: "TopicalPages", pages: sortedPages.filter(p => getGroupedPageType(p) === "Topical Pages") },
                              { name: "Unassigned Pages", key: "UnassignedPages", pages: sortedPages.filter(p => getGroupedPageType(p) === "Unassigned Pages") }
                            ];

                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* Header / Action Area */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', textAlign: 'left' }}>
                                  <h3 style={{ fontFamily: 'Outfit', fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                    Site Structure
                                  </h3>
                                  <button
                                    className="btn-primary"
                                    onClick={() => setActiveModule('visual-site-map')}
                                    style={{
                                      backgroundColor: '#f97316',
                                      color: '#ffffff',
                                      border: 'none',
                                      padding: '8px 16px',
                                      borderRadius: '6px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      transition: 'background-color 0.2s ease',
                                      boxShadow: '0 2px 8px rgba(249, 115, 22, 0.15)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f97316'}
                                  >
                                    Visual Site Map
                                  </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                  {sections.map(sec => {
                                  const isSectionExpanded = !!expandedSections[sec.key];
                                  return (
                                    <div 
                                      key={sec.key}
                                      style={{
                                        backgroundColor: 'var(--surface-color)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        overflow: 'hidden'
                                      }}
                                    >
                                      {/* Accordion header */}
                                      <div 
                                        onClick={() => toggleSection(sec.key)}
                                        style={{
                                          padding: '1.25rem 1.5rem',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          cursor: 'pointer',
                                          backgroundColor: isSectionExpanded ? 'rgba(255,255,255,0.01)' : 'transparent',
                                          userSelect: 'none',
                                          textAlign: 'left'
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                          <h3 style={{ margin: 0, fontFamily: 'Outfit', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                            {sec.name}
                                          </h3>
                                          <span style={{ 
                                            fontSize: '0.8rem', 
                                            color: 'var(--text-secondary)', 
                                            backgroundColor: 'rgba(255,255,255,0.05)', 
                                            padding: '2px 8px', 
                                            borderRadius: '20px',
                                            fontWeight: 600
                                          }}>
                                            {sec.pages.length} {sec.pages.length === 1 ? "page" : "pages"}
                                          </span>
                                        </div>
                                        <span style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: 600 }}>
                                          {isSectionExpanded ? "Hide Pages ▲" : "Show Pages ▼"}
                                        </span>
                                      </div>

                                      {/* Accordion content */}
                                      {isSectionExpanded && (
                                        <div style={{ borderTop: '1px solid var(--border-color)', padding: '1.5rem' }}>
                                          {sec.pages.length === 0 ? (
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', padding: '1rem 0' }}>
                                              No pages classified under this type.
                                            </div>
                                          ) : (
                                            <div style={{ overflowX: 'auto' }}>
                                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                                <thead>
                                                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'left' }}>
                                                    <th style={{ padding: '10px 14px', width: '35%' }}>Page URL</th>
                                                    <th style={{ padding: '10px 14px', width: '35%' }}>Page Title</th>
                                                    <th style={{ padding: '10px 14px', width: '15%' }}>Target Keyword</th>
                                                    <th style={{ padding: '10px 14px', width: '15%', textAlign: 'center' }}>Audit Status</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {sec.pages.map((p, pIdx) => {
                                                    const isExcluded = p.assignedType === "Excluded";
                                                    const isConfigured = p.status === "Configured";
                                                    
                                                    let statusText = "Awaiting Config";
                                                    let statusColor = "#fbbf24";
                                                    let statusBg = "rgba(245, 158, 11, 0.08)";
                                                    let statusBorder = "1px solid rgba(245, 158, 11, 0.15)";
                                                    
                                                    if (isExcluded) {
                                                      statusText = "Excluded";
                                                      statusColor = "#94a3b8";
                                                      statusBg = "rgba(148, 163, 184, 0.08)";
                                                      statusBorder = "1px solid rgba(148, 163, 184, 0.15)";
                                                    } else if (isConfigured) {
                                                      statusText = "Configured";
                                                      statusColor = "#34d399";
                                                      statusBg = "rgba(16, 185, 129, 0.08)";
                                                      statusBorder = "1px solid rgba(16, 185, 129, 0.15)";
                                                    }

                                                    return (
                                                      <tr key={pIdx} style={{ borderBottom: pIdx < sec.pages.length - 1 ? '1px solid rgba(255,255,255,0.02)' : 'none' }}>
                                                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#60a5fa', fontWeight: 600 }}>{p.pageUrl}</td>
                                                        <td style={{ padding: '12px 14px', fontWeight: 500, color: 'var(--text-primary)' }}>{p.pageTitle}</td>
                                                        <td style={{ padding: '12px 14px', fontStyle: p.targetPhrase ? 'normal' : 'italic', color: p.targetPhrase ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{p.targetPhrase || "Not configured"}</td>
                                                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                                          <span style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: 700,
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            color: statusColor,
                                                            backgroundColor: statusBg,
                                                            border: statusBorder,
                                                            display: 'inline-block'
                                                          }}>
                                                            {statusText}
                                                          </span>
                                                        </td>
                                                      </tr>
                                                    );
                                                  })}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                                </div>
                              </div>
                            );
                          }

                          

                          if (activeModule === 'content-coverage') {
                            const configuredPagesList = sitePages.filter(p => p.status === "Configured" && p.assignedType !== "Excluded");
                            const awaitingPagesList = sitePages.filter(p => p.status === "Unconfigured" && p.assignedType !== "Excluded");
                            const excludedPagesList = sitePages.filter(p => p.assignedType === "Excluded");
                            
                            const actionableTotal = configuredPagesList.length + awaitingPagesList.length;
                            const configuredPagesCount = configuredPagesList.length;
                            const pct = actionableTotal > 0 ? Math.round((configuredPagesCount / actionableTotal) * 100) : 0;

                            const categories = [
                              "Homepage",
                              "Hub Pages",
                              "Landing Pages",
                              "Supporting Pages",
                              "Topical Pages",
                              "Unassigned Pages"
                            ];

                            const summaryData = categories.map(category => {
                              const matchingPages = sitePages.filter(p => getPageCategory(p) === category);
                              
                              const total = matchingPages.length;
                              const configured = matchingPages.filter(p => p.status === "Configured" && p.assignedType !== "Excluded").length;
                              const awaiting = matchingPages.filter(p => p.status === "Unconfigured" && p.assignedType !== "Excluded").length;
                              const excluded = matchingPages.filter(p => p.assignedType === "Excluded").length;

                              return {
                                category,
                                total,
                                configured,
                                awaiting,
                                excluded
                              };
                            });

                            return (
                              <div>
                                {/* Grid layout for Content Summary and Coverage Progress */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2.5rem', alignItems: 'start' }}>
                                  {/* Section 1 - Content Summary */}
                                  <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', textAlign: 'left' }}>
                                    <h3 style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
                                      Content Summary
                                    </h3>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                                      <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                          <th style={{ padding: '12px 10px' }}>Content Type</th>
                                          <th style={{ padding: '12px 10px', textAlign: 'right' }}>Total Pages</th>
                                          <th style={{ padding: '12px 10px', textAlign: 'right' }}>Configured</th>
                                          <th style={{ padding: '12px 10px', textAlign: 'right' }}>Awaiting Config</th>
                                          <th style={{ padding: '12px 10px', textAlign: 'right' }}>Excluded</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {summaryData.map(row => (
                                          <tr key={row.category} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.category}</td>
                                            <td style={{ padding: '12px 10px', textAlign: 'right', color: '#cbd5e1' }}>{row.total}</td>
                                            <td style={{ padding: '12px 10px', textAlign: 'right', color: '#34d399', fontWeight: 600 }}>{row.configured}</td>
                                            <td style={{ padding: '12px 10px', textAlign: 'right', color: '#fbbf24' }}>{row.awaiting}</td>
                                            <td style={{ padding: '12px 10px', textAlign: 'right', color: '#94a3b8' }}>{row.excluded}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>

                                  {/* Section 4 - Coverage Progress */}
                                  <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', textAlign: 'left' }}>
                                    <h3 style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
                                      Coverage Progress
                                    </h3>
                                    <div style={{ margin: '1.5rem 0' }}>
                                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                                        Configured Pages
                                      </div>
                                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem', fontFamily: 'Outfit' }}>
                                        {configuredPagesCount} of {actionableTotal} pages configured
                                      </div>
                                      <div style={{ marginTop: '1rem', width: '100%', height: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '9999px', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-gradient)', borderRadius: '9999px', transition: 'width 0.5s ease' }} />
                                      </div>
                                      <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700, marginTop: '0.75rem', textAlign: 'right' }}>
                                        {pct}% Complete
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Section 2 - Configured Pages */}
                                <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', textAlign: 'left', marginBottom: '2.5rem' }}>
                                  <h3 style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1.25rem 0' }}>
                                    Configured Pages
                                  </h3>
                                  {configuredPagesList.length === 0 ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                      No pages configured yet.
                                    </div>
                                  ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead>
                                          <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                            <th style={{ padding: '12px 10px', textAlign: 'left', width: '30%' }}>Page URL</th>
                                            <th style={{ padding: '12px 10px', textAlign: 'left', width: '25%' }}>Page Title</th>
                                            <th style={{ padding: '12px 10px', textAlign: 'left', width: '15%' }}>Page Type</th>
                                            <th style={{ padding: '12px 10px', textAlign: 'left', width: '15%' }}>Target Phrase</th>
                                            <th style={{ padding: '12px 10px', textAlign: 'right', width: '10%' }}>Word Count</th>
                                            <th style={{ padding: '12px 10px', textAlign: 'center', width: '10%' }}>Status</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {configuredPagesList.map(p => (
                                            <tr key={p.pageUrl} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                              <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: '#60a5fa', fontWeight: 600 }}>{p.pageUrl}</td>
                                              <td style={{ padding: '12px 10px', color: '#cbd5e1' }}>{p.pageTitle}</td>
                                              <td style={{ padding: '12px 10px', color: '#cbd5e1' }}>{getPageCategory(p)}</td>
                                              <td style={{ padding: '12px 10px', color: 'var(--text-primary)', fontWeight: 600 }}>{p.targetPhrase}</td>
                                              <td style={{ padding: '12px 10px', textAlign: 'right', color: '#cbd5e1' }}>{p.crawlData?.wordCount || 0}</td>
                                              <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                                <span style={{ color: '#34d399', backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                  Configured
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>

                                {/* Section 3 - Pages Awaiting Configuration */}
                                <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', textAlign: 'left', marginBottom: '2.5rem' }}>
                                  <h3 style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1.25rem 0' }}>
                                    Pages Awaiting Configuration
                                  </h3>
                                  {awaitingPagesList.length === 0 ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                      All pages are fully configured!
                                    </div>
                                  ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead>
                                          <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                            <th style={{ padding: '12px 10px', textAlign: 'left', width: '35%' }}>Page URL</th>
                                            <th style={{ padding: '12px 10px', textAlign: 'left', width: '35%' }}>Page Title</th>
                                            <th style={{ padding: '12px 10px', textAlign: 'left', width: '15%' }}>Page Type</th>
                                            <th style={{ padding: '12px 10px', textAlign: 'center', width: '15%' }}>Suggested Action</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {awaitingPagesList.map(p => (
                                            <tr key={p.pageUrl} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                              <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: '#94a3b8' }}>{p.pageUrl}</td>
                                              <td style={{ padding: '12px 10px', color: '#cbd5e1' }}>{p.pageTitle}</td>
                                              <td style={{ padding: '12px 10px', color: '#cbd5e1' }}>{getPageCategory(p)}</td>
                                              <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                                <button 
                                                  className="btn-secondary" 
                                                  onClick={() => handleOpenConfigModal(p)}
                                                  style={{ 
                                                    padding: '4px 12px', 
                                                    fontSize: '0.8rem', 
                                                    fontWeight: 600,
                                                    color: 'var(--text-primary)',
                                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                  }}
                                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                                                >
                                                  Configure Target Phrase
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>

                                {/* Section 5 - Excluded Pages (Collapsible) */}
                                <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', textAlign: 'left' }}>
                                  <div 
                                    onClick={() => setIsExcludedCollapsed(!isExcludedCollapsed)}
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                  >
                                    <h3 style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                      Excluded Pages ({excludedPagesList.length})
                                    </h3>
                                    <span style={{ fontSize: '0.9rem', color: '#60a5fa', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      {isExcludedCollapsed ? "▼ Show Pages" : "▲ Hide Pages"}
                                    </span>
                                  </div>

                                  {!isExcludedCollapsed && (
                                    <div style={{ marginTop: '1.5rem', overflowX: 'auto' }}>
                                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead>
                                          <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                            <th style={{ padding: '12px 10px', textAlign: 'left', width: '40%' }}>Page URL</th>
                                            <th style={{ padding: '12px 10px', textAlign: 'left', width: '40%' }}>Page Title</th>
                                            <th style={{ padding: '12px 10px', textAlign: 'center', width: '20%' }}>Status</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {excludedPagesList.map(p => (
                                            <tr key={p.pageUrl} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                              <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: '#94a3b8' }}>{p.pageUrl}</td>
                                              <td style={{ padding: '12px 10px', color: '#94a3b8' }}>{p.pageTitle}</td>
                                              <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                                <span style={{ color: '#94a3b8', backgroundColor: 'rgba(148, 163, 184, 0.08)', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                  Excluded
                                                </span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          if (activeModule === 'external-links') {
                            const externalLinks = site.externalLinks || [];
                            const totalLinks = externalLinks.length;
                            const liveLinks = externalLinks.filter(l => l.status === "Live").length;
                            const indexedLinks = externalLinks.filter(l => l.indexed === "Yes" || l.indexed === "Indexed").length;
                            const pendingLinks = externalLinks.filter(l => l.status === "Pending").length;

                            return (
                              <div style={{ textAlign: 'left' }}>
                                {/* Summary Cards */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                                  <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>Total Links</span>
                                    <span style={{ display: 'block', fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }}>{totalLinks}</span>
                                  </div>
                                  <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>Live Links</span>
                                    <span style={{ display: 'block', fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: '#10b981' }}>{liveLinks}</span>
                                  </div>
                                  <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>Indexed Links</span>
                                    <span style={{ display: 'block', fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: '#3b82f6' }}>{indexedLinks}</span>
                                  </div>
                                  <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>Pending Links</span>
                                    <span style={{ display: 'block', fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: '#fbbf24' }}>{pendingLinks}</span>
                                  </div>
                                </div>

                                {/* Header row for External Links Manager */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                  <h3 style={{ fontFamily: 'Outfit', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                    External Links Manager
                                  </h3>
                                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button
                                      className="btn-secondary"
                                      onClick={handleImportStarterPack}
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', padding: '8px 16px', fontWeight: 700 }}
                                    >
                                      📥 Import Starter Pack
                                    </button>
                                    <button
                                      className="btn-secondary"
                                      onClick={handleCheckIndexingStatus}
                                      disabled={isCheckingIndexStatus}
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', padding: '8px 16px', fontWeight: 700, opacity: isCheckingIndexStatus ? 0.7 : 1 }}
                                    >
                                      {isCheckingIndexStatus ? "Checking..." : "🔍 Check Indexing Status"}
                                    </button>
                                    <button
                                      className="btn-primary"
                                      onClick={() => {
                                        setEditingExternalLinkId(null);
                                        setExtLinkName("");
                                        setExtSourceUrl("");
                                        setExtTargetUrl("");
                                        setExtLinkType("Backlink");
                                        setExtStatus("Pending");
                                        setExtIndexed("Unknown");
                                        setExtDateAdded(new Date().toISOString().split('T')[0]);
                                        setExtLastChecked("Never");
                                        setExtNotes("");
                                        setExtLinkTab('single');
                                        setCsvPreviewRows([]);
                                        setCsvSummary(null);
                                        setImportCompleted(false);
                                        setIsExternalLinkModalOpen(true);
                                      }}
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', padding: '8px 16px', fontWeight: 700 }}
                                    >
                                      + Add External Link
                                    </button>
                                  </div>
                                </div>

                                {/* External Links Table */}
                                <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                                  <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                      <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)', userSelect: 'none' }}>
                                          <th 
                                            style={{ padding: '16px 20px', color: extSortKey === 'linkName' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                                            onClick={() => handleSort('linkName')}
                                          >
                                            <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                                              Link Name
                                              <span style={{ display: 'inline-flex', flexDirection: 'row', gap: '2px', fontSize: '0.7rem', marginLeft: '6px' }}>
                                                <span style={{ color: (extSortKey === 'linkName' && extSortDir === 'asc') ? '#3b82f6' : 'rgba(255,255,255,0.25)', fontWeight: (extSortKey === 'linkName' && extSortDir === 'asc') ? 900 : 400 }}>▲</span>
                                                <span style={{ color: (extSortKey === 'linkName' && extSortDir === 'desc') ? '#3b82f6' : 'rgba(255,255,255,0.25)', fontWeight: (extSortKey === 'linkName' && extSortDir === 'desc') ? 900 : 400 }}>▼</span>
                                              </span>
                                            </div>
                                          </th>
                                          <th 
                                            style={{ padding: '16px 20px', color: extSortKey === 'targetUrl' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                                            onClick={() => handleSort('targetUrl')}
                                          >
                                            <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                                              Published URL
                                              <span style={{ display: 'inline-flex', flexDirection: 'row', gap: '2px', fontSize: '0.7rem', marginLeft: '6px' }}>
                                                <span style={{ color: (extSortKey === 'targetUrl' && extSortDir === 'asc') ? '#3b82f6' : 'rgba(255,255,255,0.25)', fontWeight: (extSortKey === 'targetUrl' && extSortDir === 'asc') ? 900 : 400 }}>▲</span>
                                                <span style={{ color: (extSortKey === 'targetUrl' && extSortDir === 'desc') ? '#3b82f6' : 'rgba(255,255,255,0.25)', fontWeight: (extSortKey === 'targetUrl' && extSortDir === 'desc') ? 900 : 400 }}>▼</span>
                                              </span>
                                            </div>
                                          </th>
                                          <th 
                                            style={{ padding: '16px 20px', color: extSortKey === 'indexed' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, textAlign: 'center', cursor: 'pointer' }}
                                            onClick={() => handleSort('indexed')}
                                          >
                                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                                              Indexed
                                              <span style={{ display: 'inline-flex', flexDirection: 'row', gap: '2px', fontSize: '0.7rem', marginLeft: '6px' }}>
                                                <span style={{ color: (extSortKey === 'indexed' && extSortDir === 'asc') ? '#3b82f6' : 'rgba(255,255,255,0.25)', fontWeight: (extSortKey === 'indexed' && extSortDir === 'asc') ? 900 : 400 }}>▲</span>
                                                <span style={{ color: (extSortKey === 'indexed' && extSortDir === 'desc') ? '#3b82f6' : 'rgba(255,255,255,0.25)', fontWeight: (extSortKey === 'indexed' && extSortDir === 'desc') ? 900 : 400 }}>▼</span>
                                              </span>
                                            </div>
                                          </th>
                                          <th 
                                            style={{ padding: '16px 20px', color: extSortKey === 'dateAdded' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                                            onClick={() => handleSort('dateAdded')}
                                          >
                                            <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                                              Date Added
                                              <span style={{ display: 'inline-flex', flexDirection: 'row', gap: '2px', fontSize: '0.7rem', marginLeft: '6px' }}>
                                                <span style={{ color: (extSortKey === 'dateAdded' && extSortDir === 'asc') ? '#3b82f6' : 'rgba(255,255,255,0.25)', fontWeight: (extSortKey === 'dateAdded' && extSortDir === 'asc') ? 900 : 400 }}>▲</span>
                                                <span style={{ color: (extSortKey === 'dateAdded' && extSortDir === 'desc') ? '#3b82f6' : 'rgba(255,255,255,0.25)', fontWeight: (extSortKey === 'dateAdded' && extSortDir === 'desc') ? 900 : 400 }}>▼</span>
                                              </span>
                                            </div>
                                          </th>
                                          <th 
                                            style={{ padding: '16px 20px', color: extSortKey === 'lastChecked' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                                            onClick={() => handleSort('lastChecked')}
                                          >
                                            <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                                              Last Checked
                                              <span style={{ display: 'inline-flex', flexDirection: 'row', gap: '2px', fontSize: '0.7rem', marginLeft: '6px' }}>
                                                <span style={{ color: (extSortKey === 'lastChecked' && extSortDir === 'asc') ? '#3b82f6' : 'rgba(255,255,255,0.25)', fontWeight: (extSortKey === 'lastChecked' && extSortDir === 'asc') ? 900 : 400 }}>▲</span>
                                                <span style={{ color: (extSortKey === 'lastChecked' && extSortDir === 'desc') ? '#3b82f6' : 'rgba(255,255,255,0.25)', fontWeight: (extSortKey === 'lastChecked' && extSortDir === 'desc') ? 900 : 400 }}>▼</span>
                                              </span>
                                            </div>
                                          </th>
                                          <th 
                                            style={{ padding: '16px 20px', color: extSortKey === 'notes' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                                            onClick={() => handleSort('notes')}
                                          >
                                            <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                                              Notes
                                              <span style={{ display: 'inline-flex', flexDirection: 'row', gap: '2px', fontSize: '0.7rem', marginLeft: '6px' }}>
                                                <span style={{ color: (extSortKey === 'notes' && extSortDir === 'asc') ? '#3b82f6' : 'rgba(255,255,255,0.25)', fontWeight: (extSortKey === 'notes' && extSortDir === 'asc') ? 900 : 400 }}>▲</span>
                                                <span style={{ color: (extSortKey === 'notes' && extSortDir === 'desc') ? '#3b82f6' : 'rgba(255,255,255,0.25)', fontWeight: (extSortKey === 'notes' && extSortDir === 'desc') ? 900 : 400 }}>▼</span>
                                              </span>
                                            </div>
                                          </th>
                                          <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(() => {
                                          const sortedLinks = getSortedExternalLinks(externalLinks);
                                          if (sortedLinks.length === 0) {
                                            return (
                                              <tr>
                                                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                  No external links found. Click "+ Add External Link" to begin tracking.
                                                </td>
                                              </tr>
                                            );
                                          }
                                          return sortedLinks.map((link) => {
                                            // Determine the checking status of the link
                                            const isCheckingLink = isCheckingIndexStatus && link.targetUrl && link.targetUrl.trim() !== "";
                                            
                                            let displayIndexed = link.indexed || "Unknown";
                                            if (displayIndexed === "Yes") displayIndexed = "Indexed";
                                            if (displayIndexed === "No") displayIndexed = "Not Indexed";

                                            // Remove "Unknown" as a displayed value once a link has been checked.
                                            const hasBeenChecked = link.lastChecked && link.lastChecked !== "Never";
                                            if (displayIndexed === "Unknown" && hasBeenChecked) {
                                              if (link.notes && link.notes.toLowerCase().includes('pending')) {
                                                displayIndexed = "Pending";
                                              } else {
                                                displayIndexed = "Error";
                                              }
                                            }

                                            const badgeStyle = 
                                              (displayIndexed === "Indexed" || displayIndexed === "Yes") ? { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' } :
                                              (displayIndexed === "Not Indexed" || displayIndexed === "No") ? { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' } :
                                              displayIndexed === "Pending" ? { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' } :
                                              displayIndexed === "Error" ? { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' } :
                                              { backgroundColor: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-secondary)' };

                                            return (
                                              <tr key={link.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row-hover">
                                                <td style={{ padding: '16px 20px' }}>
                                                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{link.linkName}</div>
                                                  <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                                                    <a href={link.sourceUrl} target="_blank" rel="noreferrer" style={{ color: '#10b981', textDecoration: 'none', wordBreak: 'break-all', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                      {link.sourceUrl}
                                                      <ExternalLink size={12} />
                                                    </a>
                                                  </div>
                                                </td>
                                                <td style={{ padding: '16px 20px' }}>
                                                  <a href={link.targetUrl} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', wordBreak: 'break-all' }}>
                                                    {link.targetUrl}
                                                  </a>
                                                </td>
                                                <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                                  {isCheckingLink ? (
                                                    <span style={{
                                                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                                                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                      color: '#3b82f6'
                                                    }}>
                                                      <RefreshCw size={12} className="spinner" style={{ display: 'inline-block' }} />
                                                      Checking...
                                                    </span>
                                                  ) : (
                                                    <span style={{
                                                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                                                      ...badgeStyle
                                                    }}>
                                                      {displayIndexed}
                                                    </span>
                                                  )}
                                                </td>
                                                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{link.dateAdded}</td>
                                                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{link.lastChecked}</td>
                                                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={link.notes}>
                                                  {link.notes || "—"}
                                                </td>
                                                <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                  <button
                                                    className="btn-secondary site-btn-sm"
                                                    style={{ display: 'inline-flex', width: 'auto', padding: '4px 8px' }}
                                                    onClick={() => {
                                                      setEditingExternalLinkId(link.id);
                                                      setExtLinkName(link.linkName || "");
                                                      setExtSourceUrl(link.sourceUrl || "");
                                                      setExtTargetUrl(link.targetUrl || "");
                                                      setExtLinkType(link.linkType || "Backlink");
                                                      setExtStatus(link.status || "Pending");
                                                      setExtIndexed(link.indexed || "Unknown");
                                                      setExtDateAdded(link.dateAdded || "");
                                                      setExtLastChecked(link.lastChecked || "Never");
                                                      setExtNotes(link.notes || "");
                                                      setIsExternalLinkModalOpen(true);
                                                    }}
                                                  >
                                                    Edit
                                                  </button>
                                                </td>
                                              </tr>
                                            );
                                          });
                                        })()}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          if (activeModule === 'opportunities') {
                            return (
                              <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '3rem 2rem', textAlign: 'center' }}>
                                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Opportunities</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Coming Soon: Content Opportunities and AI recommendations will be available in the next phase.</p>
                              </div>
                            );
                          }

                          // Default View: Overview Dashboard
                          return (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                              gap: '1.25rem',
                              marginTop: '1.5rem'
                            }}>
                              {['Site Structure', 'Internal Linking', 'Content Coverage', 'Opportunities', 'External Links'].map(module => {
                                const isSiteStructure = module === 'Site Structure';
                                const isInternalLinking = module === 'Internal Linking';
                                const isClickable = isSiteStructure || isInternalLinking || module === 'Content Coverage' || module === 'Opportunities';

                                return (
                                  <div 
                                    key={module}
                                    onClick={() => {
                                      if (isSiteStructure) {
                                        setActiveModule('site-structure');
                                      } else if (isInternalLinking) {
                                        setActiveModule('internal-linking');
                                      } else if (module === 'Content Coverage') {
                                        setActiveModule('content-coverage');
                                      } else if (module === 'Opportunities') {
                                        setActiveModule('opportunities');
                                      } else if (module === 'External Links') {
                                        setActiveModule('external-links');
                                      }
                                    }}
                                    style={{
                                      backgroundColor: 'var(--surface-color)',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '12px',
                                      padding: '1.5rem',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '8px',
                                      textAlign: 'left',
                                      minHeight: '120px',
                                      cursor: isClickable ? 'pointer' : 'default',
                                      transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (isClickable) {
                                        e.currentTarget.style.borderColor = '#10b981';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (isClickable) {
                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                        e.currentTarget.style.transform = 'none';
                                      }
                                    }}
                                  >
                                    <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                                      {module}
                                    </h4>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                      {isSiteStructure 
                                        ? "View organized hierarchy" 
                                        : isInternalLinking 
                                        ? "View link & anchor analysis" 
                                        : module === "Content Coverage" 
                                        ? "View content inventory & targeting status" 
                                        : "View potential content expansion ideas"}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}
              </div>
            );
          })()}

          {/* STAGE 4: W4–W6 PLACEHOLDER MODULES */}
          {currentView === "WEBSITES_COMING_SOON" && selectedSiteId && (() => {
            const selectedSite = sites.find(s => s.id === selectedSiteId);
            
            const getModuleParams = () => {
              switch (comingSoonModule) {
                case "INTERNAL_LINKING":
                  return { badge: "W4 | Internal Linking", title: "Internal Linking", accent: "#8b5cf6", icon: Link, description: "Review internal linking patterns, orphan pages, AI anchor text recommendations, and internal PageRank flow." };
                case "SITE_ANALYSIS":
                  return { badge: "W5 | Site Analysis", title: "Site Analysis", accent: "#3b82f6", icon: Activity, description: "Review automated audit reports, overall SEO performance opportunities, and technical web vitals issues." };
                case "WEBSITE_SETTINGS":
                  return { badge: "W6 | Website Settings", title: "Website Settings", accent: "#f59e0b", icon: Sliders, description: "Manage database credentials, platform options, theme integrations, and API keys." };
                default:
                  return { badge: "W4 | Module Placeholder", title: "Dashboard Module", accent: "#10b981", icon: Globe, description: "This management module is currently under development." };
              }
            };

            const { badge, title, accent, icon: ModuleIcon, description } = getModuleParams();

            return (
              <div>
                {/* Back navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                  <button 
                    onClick={() => setCurrentView("WEBSITES_CONFIG")}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.35rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      color: 'var(--accent-color)',
                      padding: '8px 16px',
                      marginLeft: '-16px',
                      outline: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    ← Back to Website Dashboard
                  </button>
                </div>

                {/* Header Details */}
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: `${accent}cc`,
                        backgroundColor: `${accent}0c`,
                        border: `1px solid ${accent}25`,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        display: 'inline-block',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {badge}
                      </div>
                      <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {selectedSite?.name}
                      </h2>
                      <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                        {selectedSite?.url}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Placeholder */}
                <div style={{
                  padding: '6rem 3rem',
                  maxWidth: '650px',
                  margin: '0 auto',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '24px',
                  backgroundColor: '#0c101b',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    backgroundColor: `${accent}10`,
                    border: `1px solid ${accent}25`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: accent,
                    marginBottom: '8px'
                  }}>
                    <ModuleIcon size={32} />
                  </div>
                  <h3 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {title} Module
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {description}
                  </p>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.2)',
                    color: '#fbbf24',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fbbf24', display: 'inline-block' }}></span>
                    Coming Soon
                  </div>
                  <button
                    onClick={() => setCurrentView("WEBSITES_CONFIG")}
                    className="btn-secondary"
                    style={{ marginTop: '16px', padding: '10px 20px' }}
                  >
                    ← Return to Website Dashboard
                  </button>
                </div>
              </div>
            );
          })()}

          {/* STAGE 2: AUDIT CONFIGURATION */}
          {currentView === "AUDIT_CONFIG" && selectedSiteId && (() => {
            const sitePages = sortPagesForSEO(pagesData[selectedSiteId] || []).filter(p => !isPageExcluded(p));
            const includedPages = sitePages.filter(p => p.status === "Configured");
            const excludedPages = sitePages.filter(p => p.status === "Unconfigured" || p.status === "Planned");
            const siteName = sites.find(s => s.id === selectedSiteId)?.name;

            return (
              <div className="report-section" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                  <button 
                    className="flex align-center gap-2 text-secondary"
                    onClick={() => setCurrentView("WEBSITES_CONFIG")}
                    style={{ background: 'none', border: 'none', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    <ArrowLeft size={16} /> Back to Configuration
                  </button>
                </div>

                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
                  <span className="status-indicator">Audit Configuration</span>
                  <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-primary)', marginBottom: 0 }}>
                    Website: {siteName}
                  </h2>
                  <div style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'rgba(16, 185, 129, 0.85)',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginTop: '6px',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    W3 | Page Configuration
                  </div>
                  <div style={{ display: 'flex', gap: '2rem', marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <div>Pages Included in Audit: <strong style={{ color: '#34d399' }}>{includedPages.length}</strong></div>
                    <div>Target Phrases Loaded: <strong style={{ color: '#34d399' }}>{includedPages.length}</strong></div>
                    <div>Pages Excluded: <strong style={{ color: '#f87171' }}>{excludedPages.length}</strong></div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                  {/* Left block: Included mapping table */}
                  <div>
                    <h3 className="section-title-custom mb-3" style={{ fontSize: '1.05rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399', display: 'inline-block' }}></span>
                      Included Page/Phrase Mappings ({includedPages.length})
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      The audit engine will scan the following configured pages to verify their SEO target phrases.
                    </p>

                    <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: '#07090b' }}>
                      <table className="audit-config-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Page URL Path</th>
                            <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Target Phrase</th>
                          </tr>
                        </thead>
                        <tbody>
                          {includedPages.length === 0 ? (
                            <tr>
                              <td colSpan="2" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                No pages configured for audit!
                              </td>
                            </tr>
                          ) : (
                            includedPages.map((mapping, idx) => (
                              <tr key={idx} style={{ borderBottom: idx < includedPages.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#60a5fa' }}>{mapping.pageUrl}</td>
                                <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--text-primary)' }}>{mapping.targetPhrase}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right block: Excluded list */}
                  {excludedPages.length > 0 && (
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                      <h3 className="section-title-custom" style={{ fontSize: '1.05rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f87171', display: 'inline-block' }}></span>
                        Excluded Pages: {excludedPages.length}
                      </h3>
                      <div style={{ marginTop: '0.75rem' }}>
                        <button 
                          className="btn-secondary btn-sm"
                          onClick={() => setShowExcluded(!showExcluded)}
                          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                        >
                          {showExcluded ? "Hide Excluded Pages" : "Show Excluded Pages"}
                        </button>
                      </div>

                      {showExcluded && (
                        <div style={{ marginTop: '1.25rem' }}>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            These pages are unconfigured or planned, and will be skipped by the active crawler.
                          </p>

                          <ul className="excluded-pages-list" style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {excludedPages.map((page, idx) => (
                              <li key={idx} style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                <span style={{ color: '#60a5fa' }}>{page.pageUrl}</span>
                                <span className={`exclusion-badge ${page.status.toLowerCase()}-badge`} style={{
                                  marginLeft: '8px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: page.status === 'Planned' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: page.status === 'Planned' ? '#60a5fa' : '#f87171'
                                }}>
                                  [{page.status}]
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.75rem', marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button 
                    className="btn-secondary"
                    onClick={() => setCurrentView("WEBSITES_CONFIG")}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-primary"
                    disabled={includedPages.length === 0}
                    style={{ opacity: includedPages.length === 0 ? 0.5 : 1, cursor: includedPages.length === 0 ? 'not-allowed' : 'pointer' }}
                    onClick={() => setCurrentView("AUDIT_RUNNING")}
                  >
                    Begin Audit <Play size={14} />
                  </button>
                </div>
              </div>
            );
          })()}

          {/* STAGE 3: RUNNING SITE AUDIT */}
          {currentView === "AUDIT_RUNNING" && selectedSiteId && (
            <div className="report-section" style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center', padding: '3.5rem 2.5rem' }}>
              <div className="audit-progress-container" style={{ marginBottom: '2rem' }}>
                <RefreshCw size={44} className="spinner" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
                <h2 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Auditing Website...
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  Scanning pages and mappings configured for <strong>{sites.find(s => s.id === selectedSiteId)?.name}</strong>
                </p>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '2.5rem' }}>
                <div style={{ width: `${auditProgress}%`, height: '100%', background: 'var(--accent-gradient)', borderRadius: '9999px', transition: 'width 0.3s ease' }}></div>
              </div>

              {/* Log Output Console */}
              <div className="audit-console-log" style={{ textAlign: 'left', backgroundColor: '#07090b', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.25rem', height: '180px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: '1.5' }}>
                {auditLogs.map((log, idx) => (
                  <div key={idx} style={{ color: log.startsWith('[FIND]') ? '#f87171' : log.startsWith('[INFO]') ? '#34d399' : '#cbd5e1' }}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STAGE 4: AUDIT RESULTS */}
          {currentView === "AUDIT_RESULTS" && selectedSiteId && (() => {
            const site = sites.find(s => s.id === selectedSiteId);
            const sitePages = pagesData[selectedSiteId] || [];
            const auditedPages = sitePages.filter(p => p.status === "Configured" || p.latestAudit);
            const currentReviewUrl = reviewPageUrl || (auditedPages[0]?.pageUrl || "");
            const isMagento = site?.platform === "Magento";
            const targetPageObj = isMagento && reviewPageId
              ? sitePages.find(p => p.wpPostId === reviewPageId)
              : sitePages.find(p => p.pageUrl === currentReviewUrl);
            const currentTargetPhrase = targetPageObj?.targetPhrase || "";
            const pageTitle = targetPageObj?.pageTitle || "";
            const pageType = getPageType(targetPageObj);
            
            const auditResults = targetPageObj?.latestAudit?.results || runPageAudit(currentReviewUrl, currentTargetPhrase, pageTitle, selectedSiteId, targetPageObj);
            const passedCount = auditResults.filter(r => r.status === "Pass").length;
            const failedCount = auditResults.filter(r => r.status === "Fail").length;
            const scoreColor = passedCount === 8 ? "#10b981" : passedCount >= 5 ? "#fbbf24" : "#f87171";

            return (
              <div className="report-section" style={{ maxWidth: '1680px', margin: '0 auto', padding: '2.5rem' }}>
                
                {/* Back Navigation Link */}
                <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                  <button
                    onClick={() => {
                      setCurrentView("WEBSITES_CONFIG");
                      setSingleAuditPageUrl(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.35rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      color: 'var(--accent-color)',
                      padding: '8px 16px',
                      marginLeft: '-16px',
                      textDecoration: isW3BackHovered ? 'underline' : 'none',
                      opacity: isW3BackHovered ? 0.95 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={() => setIsW3BackHovered(true)}
                    onMouseLeave={() => setIsW3BackHovered(false)}
                  >
                    ← Back to Website Management
                  </button>
                </div>

                {/* Header Title & Success Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'rgba(16, 185, 129, 0.85)',
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      W3 | Latest Page Audit Results
                    </div>
                    <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                      Now We Need To Optimize The SEO Elements Of This Page
                    </h2>
                  </div>
                </div>

                {/* Selector / Metadata Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  {/* Top Selection & Score Bar */}
                  <div style={{ display: 'flex', gap: '1.5rem', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '250px', textAlign: 'left' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Select Page to Review from Dropdown</label>
                      <select
                        value={isMagento ? (reviewPageId || "") : currentReviewUrl}
                        onChange={(e) => {
                          if (isMagento) {
                            const val = e.target.value;
                            setReviewPageId(val);
                            const matched = auditedPages.find(p => p.wpPostId === val);
                            if (matched) setReviewPageUrl(matched.pageUrl);
                          } else {
                            setReviewPageUrl(e.target.value);
                          }
                        }}
                        style={{ width: '50%', minWidth: '250px', backgroundColor: '#070b13', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px', borderRadius: '6px', outline: 'none', fontSize: '0.95rem', fontWeight: 600, marginTop: '4px' }}
                      >
                        {auditedPages.map(p => (
                          <option key={isMagento ? p.wpPostId : p.pageUrl} value={isMagento ? p.wpPostId : p.pageUrl}>{p.pageUrl} ({p.pageTitle})</option>
                        ))}
                      </select>
                    </div>
                    
                    <div style={{ textAlign: 'left' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Audit Score</label>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: scoreColor, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '1.35rem' }}>{passedCount}</span> / 8 Passed
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          ({failedCount} Issue{failedCount === 1 ? '' : 's'} to fix)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top Page Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                    {/* Page URL Card */}
                    <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '12px', textAlign: 'left' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Page URL</label>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#60a5fa', marginTop: '6px', fontFamily: 'monospace' }} title={currentReviewUrl}>
                        {currentReviewUrl}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {pageTitle || "Untitled Page"}
                      </div>
                    </div>

                    {/* Target Phrase Card */}
                    <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '12px', textAlign: 'left' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Target Phrase</label>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px', fontStyle: currentTargetPhrase ? 'normal' : 'italic' }}>
                        {currentTargetPhrase || "No Target Assigned"}
                      </div>
                    </div>

                    {/* Page Type Card */}
                    <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '12px', textAlign: 'left' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Page Type</label>
                      <div style={{ marginTop: '6px' }}>
                        <span style={{
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          color: '#60a5fa',
                          display: 'inline-block'
                        }}>
                          {pageType}
                        </span>
                      </div>
                    </div>
                  </div>



                  {/* 8-Item Audit Results Table */}
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'var(--surface-color)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                          <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, width: '18%' }}>SEO Element</th>
                          <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, width: '42%' }}>Current Value</th>
                          <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, width: '12%', textAlign: 'center' }}>Target Phrase</th>
                          <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, width: '10%', textAlign: 'center' }}>Status</th>
                          <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, width: '18%' }}>Recommended Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditResults.map((row, idx) => {
                          const isPass = row.status === "Pass";
                          const hasRec = !!row.recommendation;
                          const presentText = row.present;
                          
                          return (
                            <tr 
                              key={row.item} 
                              style={{ 
                                borderBottom: idx < auditResults.length - 1 ? '1px solid var(--border-color)' : 'none',
                                backgroundColor: isPass ? 'transparent' : 'rgba(239, 68, 68, 0.01)',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {row.item === "Title Tag" ? "Meta Title" : row.item}
                              </td>
                              <td style={{ padding: '16px 20px', color: '#cbd5e1', wordBreak: 'break-word', fontFamily: (row.item === 'H1' || row.item === 'Title Tag') ? 'monospace' : 'inherit' }}>
                                {row.current}
                              </td>
                              <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                <span style={{
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.9rem',
                                  backgroundColor: presentText === "Yes" ? 'rgba(16, 185, 129, 0.1)' : presentText === "No" ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)',
                                  color: presentText === "Yes" ? '#34d399' : presentText === "No" ? '#f87171' : 'var(--text-secondary)'
                                }}>
                                  {presentText}
                                </span>
                              </td>
                              <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                <span style={{
                                  fontWeight: 800,
                                  padding: '4px 10px',
                                  borderRadius: '9999px',
                                  fontSize: '0.9rem',
                                  backgroundColor: isPass ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                  color: isPass ? '#34d399' : '#f87171',
                                  border: isPass ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)'
                                }}>
                                  {row.status}
                                </span>
                              </td>
                              <td style={{ 
                                padding: '16px 20px', 
                                color: isPass ? (hasRec ? '#fbbf24' : 'var(--text-secondary)') : '#f87171', 
                                fontSize: '0.85rem', 
                                fontWeight: isPass ? (hasRec ? 500 : 400) : 500,
                                whiteSpace: 'pre-line'
                              }}>
                                {isPass ? (hasRec ? row.recommendation : "—") : row.action}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Staff Action checklist */}
                  <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', textAlign: 'left' }}>
                    <h3 className="section-title-custom" style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={18} style={{ color: '#fbbf24' }} /> Action Checklist: What to Fix
                    </h3>
                    
                    {auditResults.filter(r => r.status === "Fail").length === 0 ? (
                      <div style={{ color: '#34d399', fontWeight: 600, padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={18} /> Genuinely optimized! This page passes all SEO checks for the target phrase.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Staff Action Required: Fix the following issues in the WordPress editor to optimize the page.
                        </p>
                        {auditResults.filter(r => r.status === "Fail").map((failItem, idx) => {
                          const relUrl = getRelativeUrl(currentReviewUrl, site.url);
                          const matchingTask = site?.tasks.find(t => {
                            const tRel = getRelativeUrl(t.pageUrl, site.url);
                            return tRel === relUrl && t.taskTitle.toLowerCase().includes(failItem.item.toLowerCase());
                          });
                          
                          return (
                            <div 
                              key={idx} 
                              style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                backgroundColor: 'rgba(255, 255, 255, 0.01)', 
                                border: '1px solid var(--border-color)', 
                                padding: '1rem 1.25rem', 
                                borderRadius: '8px' 
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>
                                  Issue {idx + 1}: {failItem.item === "Title Tag" ? "Meta Title" : failItem.item}
                                </span>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
                                  {failItem.action}
                                </span>
                              </div>
                              <button 
                                className="btn-primary btn-sm"
                                onClick={() => handleFixIssueDirectly(currentReviewUrl, currentTargetPhrase, failItem, site)}
                                style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'auto' }}
                              >
                                Fix Issue <ChevronRight size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            );
          })()}

          {/* Legacy WEBSITES view removed */}
          {currentView === "TASK_FOCUS" && activeTask && selectedSite && (
            <div>
              <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <button
                  onClick={() => setCurrentView("AUDIT_RESULTS")}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.35rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    color: 'var(--accent-color)',
                    padding: '8px 16px',
                    marginLeft: '-16px',
                    textDecoration: isW4BackHovered ? 'underline' : 'none',
                    opacity: isW4BackHovered ? 0.95 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={() => setIsW4BackHovered(true)}
                  onMouseLeave={() => setIsW4BackHovered(false)}
                >
                  ← Back to Latest Page Audit Results
                </button>
              </div>

              <div className="report-section" style={{ padding: '2.5rem' }}>


                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                  <span className={`task-priority-badge priority-${activeTask.priority}`} style={{ display: 'none', float: 'right', fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}>
                    {activeTask.priority} Priority
                  </span>
                  <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)', marginBottom: 0 }}>
                    {activeTask.taskTitle}
                  </h2>
                  <div style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'rgba(16, 185, 129, 0.85)',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginTop: '6px',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    W4 | Fix Issues
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Website: {selectedSite.name}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* Task Properties Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ textAlign: 'left' }}>
                      <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>Page URL</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1rem', color: '#60a5fa', marginTop: '0.4rem', fontWeight: 600 }}>
                        <Globe size={14} />
                        <span style={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>{getRelativeUrl(activeTask.pageUrl, selectedSite.url)}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>Target Phrase</label>
                      {(() => {
                        const sitePages = pagesData[selectedSiteId] || [];
                        const relUrl = getRelativeUrl(activeTask.pageUrl, selectedSite.url);
                        const pageObj = sitePages.find(p => p.pageUrl === relUrl);
                        const targetPhrase = activeTask.targetPhrase || pageObj?.targetPhrase || "None";
                        return (
                           <div style={{ fontSize: '1rem', color: 'var(--text-primary)', marginTop: '0.4rem', fontWeight: 600 }}>
                             {targetPhrase}
                           </div>
                        );
                      })()}
                    </div>
                    <div style={{ textAlign: 'left', display: 'none' }}>
                      <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>Assigned To</label>
                      <select 
                        value={activeTask.assignee || ""} 
                        onChange={(e) => {
                          const val = e.target.value || null;
                          setSites(prevSites => prevSites.map(s => {
                            if (s.id === selectedSiteId) {
                              const updatedTasks = s.tasks.map(t => {
                                if (t.id === activeTask.id) {
                                  return { ...t, assignee: val };
                                }
                                return t;
                              });
                              return { ...s, tasks: updatedTasks };
                            }
                            return s;
                          }));
                          showNotification(val ? `Task assigned to ${val}.` : "Task unassigned.");
                        }}
                        style={{ backgroundColor: '#070b13', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '4px', outline: 'none', fontSize: '0.85rem', width: '100%', maxWidth: '160px', fontWeight: 600 }}
                      >
                        <option value="">Unassigned</option>
                        <option value="Sarah">Sarah (Me)</option>
                        <option value="John">John</option>
                        <option value="Alex">Alex</option>
                      </select>
                    </div>
                    <div style={{ textAlign: 'left', display: 'none' }}>
                      <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>Task Status</label>
                      {(() => {
                        const isCompleted = activeTask.state === "completed";
                        const isInProgress = activeTask.state === "progress";
                        const statusText = isCompleted ? "Completed" : isInProgress ? "In Progress" : activeTask.assignee ? "Assigned" : "Unassigned";
                        const statusBg = isCompleted ? 'rgba(16, 185, 129, 0.15)' : isInProgress ? 'rgba(251, 191, 36, 0.15)' : activeTask.assignee ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255,255,255,0.05)';
                        const statusColor = isCompleted ? '#34d399' : isInProgress ? '#fbbf24' : activeTask.assignee ? '#60a5fa' : 'var(--text-secondary)';
                        return (
                          <span style={{
                            fontWeight: 700, padding: '6px 14px', borderRadius: '4px', fontSize: '0.8rem', display: 'inline-block', marginTop: '0.2rem',
                            backgroundColor: statusBg, color: statusColor, border: `1px solid ${statusColor}33`
                          }}>
                            {statusText}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>Issue Found</label>
                    <p style={{ fontSize: '1.05rem', color: '#f87171', marginTop: '0.25rem', lineHeight: 1.5, fontWeight: 600 }}>
                      {activeTask.issueFound || "No issues described."}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '1.25rem', borderRadius: '8px', textAlign: 'left' }}>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#f87171', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Current Version</span>
                      <pre style={{ fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', color: '#e2e8f0', margin: 0 }}>
                        {activeTask.currentVersion}
                      </pre>
                    </div>

                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '1.25rem', borderRadius: '8px', textAlign: 'left' }}>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#34d399', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Required Version</span>
                      <pre style={{ fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', color: '#e2e8f0', margin: 0 }}>
                        {activeTask.requiredVersion}
                      </pre>
                    </div>
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>Why this matters</label>
                    <p style={{ fontSize: '0.95rem', color: '#cbd5e1', marginTop: '0.25rem', lineHeight: 1.5 }}>
                      {activeTask.whyItMatters}
                    </p>
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>Verification Method</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontSize: '0.95rem', marginTop: '0.4rem', fontWeight: 600, backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '10px 14px', borderRadius: '6px', width: 'fit-content' }}>
                      <CheckCircle size={16} />
                      <span>{activeTask.verificationMethod || activeTask.successCheck}</span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.75rem', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    {/* View Live Page Button */}
                    <a 
                      href={activeTask.pageUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn-secondary"
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                    >
                      View Live Page ↗
                    </a>

                    {activeTask.state === "completed" ? (
                      <div className="flex align-center gap-4">
                        <span style={{ color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle size={18} /> ✓ Task Complete
                        </span>
                        <button className="btn-primary" onClick={handleNextTask}>
                          Next Task
                        </button>
                      </div>
                    ) : (
                      <>
                        <button 
                          className="btn-secondary"
                          onClick={() => {
                            if (navigator.clipboard) {
                              const isLinkTask = activeTask.issueType === "Internal Linking" || activeTask.taskSource === "Internal Link Review";
                              if (isLinkTask) {
                                copySentenceHtml(activeTask.requiredVersion || "", () => {
                                  showNotification("Required version copied to clipboard!");
                                });
                              } else {
                                navigator.clipboard.writeText(activeTask.requiredVersion || "");
                                showNotification("Required version copied to clipboard!");
                              }
                            } else {
                              showNotification("Clipboard copy not supported in this browser.");
                            }
                          }}
                          style={{ color: '#fbbf24', borderColor: '#fbbf24' }}
                        >
                          Copy Suggestion
                        </button>
                        
                        <button 
                          className="btn-primary" 
                          onClick={handleOpenWordPressEditor}
                        >
                          Open WordPress Editor ↗
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 4: CMS EDITOR & RE-AUDIT WORKSPACE */}
          {currentView === "EDIT" && activeTask && selectedSite && (
            <div>
              <div className="mb-4">
                {activeTask.issueType === "Internal Linking" ? (
                  <button 
                    className="flex align-center gap-2 text-secondary cursor-pointer"
                    disabled={verificationStatus === "loading"}
                    onClick={() => {
                      if (activeTask.destinationPageUrl) {
                        setExpandedLinkRows({ [activeTask.destinationPageUrl]: true });
                      }
                      setCurrentView("WEBSITES_INTERNAL_LINKING");
                    }}
                    style={{ background: 'none', border: 'none', fontSize: '0.9rem', color: 'var(--text-secondary)' }}
                  >
                    <ArrowLeft size={16} /> Back to Internal Link Review
                  </button>
                ) : (
                  <button 
                    className="flex align-center gap-2 text-secondary cursor-pointer"
                    disabled={verificationStatus === "loading"}
                    onClick={() => setCurrentView("TASK_FOCUS")}
                    style={{ background: 'none', border: 'none', fontSize: '0.9rem', color: 'var(--text-secondary)' }}
                  >
                    <ArrowLeft size={16} /> Back to Task Details
                  </button>
                )}
              </div>

              <div className="report-section" style={{ padding: '2.5rem' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>WordPress CMS Sync Editor</span>
                  <div>
                    <div style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'rgba(16, 185, 129, 0.85)',
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      marginTop: '6px',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      W5 | WORDPRESS EDITOR
                    </div>
                  </div>
                  <h2 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-primary)', marginBottom: 0 }}>
                    Editing: {activeTask.pageUrl}
                  </h2>
                </div>

                <div className="editing-workspace-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2.5rem' }}>
                  
                  {/* Left Column: Context Briefing */}
                  <div>
                    <h3 className="section-title-custom mb-3" style={{ fontSize: '1.05rem' }}>Task Context</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Instruction</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{activeTask.taskTitle}</span>
                      </div>

                      <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.01)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Why it matters</span>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                          {activeTask.whyItMatters}
                        </p>
                      </div>

                      <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#34d399', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Verification Method</span>
                        <p style={{ fontSize: '0.85rem', color: '#34d399', margin: 0, lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                          <CheckCircle size={14} /> {activeTask.verificationMethod || activeTask.successCheck}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Simulated WordPress Text Editor */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {(() => {
                      const isMetaTask = activeTask.taskTitle.toLowerCase().includes("meta title") || 
                                         activeTask.taskTitle.toLowerCase().includes("meta description") ||
                                         activeTask.taskTitle.toLowerCase().includes("title tag");

                      const isLinkTask = activeTask.issueType === "Internal Linking" || activeTask.taskSource === "Internal Link Review";

                      if (isLinkTask) {
                        const destinationPageUrl = activeTask.destinationPageUrl || activeTask.issueDescription.match(/to\s+([^\s]+)/)?.[1] || "";
                        const recSentence = activeTask.requiredVersion.split('\n\n').slice(-1)[0] || "";

                        return (
                          <div>
                            {/* 1. Status Indicator */}
                            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.15)', textAlign: 'left', marginBottom: '1.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                <ExternalLink size={16} /> WordPress Editor Opened
                              </div>
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                                We have opened the editing screen for this page in a new browser tab and copied the recommended internal link sentence to your clipboard.
                              </p>
                            </div>

                            {/* 2. Recommended Link Sentence */}
                            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.02)', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.15)', textAlign: 'left', marginBottom: '1.25rem' }}>
                              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#34d399', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                                Copied Sentence to Insert
                              </span>
                              <div 
                                style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.95rem', color: '#34d399', wordBreak: 'break-word', fontWeight: 600, padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.75rem' }}
                                dangerouslySetInnerHTML={{ __html: recSentence }}
                              />
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button
                                  className="btn-secondary btn-sm"
                                  onClick={() => {
                                    copySentenceHtml(recSentence, () => {
                                      showNotification("Copied sentence to clipboard!");
                                    });
                                  }}
                                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                >
                                  Copy Sentence Again
                                </button>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                  Destination URL: <strong style={{ color: '#60a5fa' }}>{destinationPageUrl}</strong>
                                </span>
                              </div>
                            </div>

                            {/* 3. Steps list */}
                            <div style={{ textAlign: 'left', backgroundColor: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '0.75rem' }}>
                                Steps to Complete
                              </span>
                              <ol style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', lineHeight: 1.45 }}>
                                <li>Switch to the WordPress editor tab that was just opened.</li>
                                <li>Find the appropriate position in your content to add the link sentence.</li>
                                <li>Paste the copied sentence (<strong>Ctrl + V</strong>) into the editor.</li>
                                <li>Save or Update the page inside WordPress.</li>
                                <li>Return here and click <strong>Verify Change</strong> below to sync and verify.</li>
                              </ol>
                            </div>
                          </div>
                        );
                      }

                      if (isMetaTask) {
                        return (
                          <div>
                            {/* 1. Current Value */}
                            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'left', marginBottom: '1.25rem' }}>
                              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                                Current {activeTask.taskTitle.toLowerCase().includes("meta description") ? "Meta Description" : "Meta Title"}
                              </span>
                              <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#cbd5e1', wordBreak: 'break-all' }}>
                                {activeTask.currentVersion || "Not found"}
                              </div>
                            </div>

                            {/* 2. Recommended Value */}
                            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.15)', textAlign: 'left', marginBottom: '1.25rem' }}>
                              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#34d399', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                                Recommended {activeTask.taskTitle.toLowerCase().includes("meta description") ? "Meta Description" : "Meta Title"}
                              </span>
                              <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#34d399', wordBreak: 'break-all', fontWeight: 600 }}>
                                {activeTask.requiredVersion || "Not generated"}
                              </div>
                            </div>

                            {/* 3. Editable WordPress Field */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>
                                Editable WordPress Field
                              </span>
                              {verificationStatus !== "success" && verificationStatus !== "loading" && (
                                <button 
                                  className="btn-secondary btn-sm" 
                                  onClick={() => setEditingContent(activeTask.requiredVersion || "")}
                                  style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                                >
                                  Reset to Recommended
                                </button>
                              )}
                            </div>
                            <textarea 
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              disabled={verificationStatus === "loading" || verificationStatus === "success"}
                              rows={activeTask.taskTitle.toLowerCase().includes("meta description") ? 4 : 2}
                              style={{ 
                                width: '100%',
                                backgroundColor: '#07090b', padding: '1rem', borderRadius: '8px', 
                                fontFamily: 'monospace', fontSize: '0.9rem', color: '#f3f4f6',
                                border: '1px solid var(--border-color)', resize: 'vertical',
                                lineHeight: 1.4, marginBottom: '1rem'
                              }}
                            />
                          </div>
                        );
                      }

                      // Default (non-meta) layout
                      return (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="section-title-custom" style={{ fontSize: '1.05rem' }}>Simulated WordPress Field</h3>
                            {verificationStatus !== "success" && verificationStatus !== "loading" && (
                              <button className="btn-secondary btn-sm" onClick={handleApplySuggestion}>
                                Paste Required Text
                              </button>
                            )}
                          </div>

                          <textarea 
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            disabled={verificationStatus === "loading" || verificationStatus === "success"}
                            rows={6}
                            style={{ 
                              width: '100%',
                              backgroundColor: '#07090b', padding: '1rem', borderRadius: '8px', 
                              fontFamily: 'monospace', fontSize: '0.9rem', color: '#f3f4f6',
                              border: '1px solid var(--border-color)', resize: 'vertical',
                              lineHeight: 1.4
                            }}
                          />
                        </>
                      );
                    })()}

                    {/* Verification and Alerts below textareas */}
                    {/* (This makes sure the original alerts block matches up) */}

                    {verificationStatus === "loading" && (
                      <div className="text-center mt-4">
                        <RefreshCw className="inline animate-spin mr-2" style={{ color: "#3b82f6" }} size={20} />
                        <span style={{ fontSize: '0.9rem', color: '#60a5fa' }}>Verifying changes with Page Auditor...</span>
                      </div>
                    )}

                    {verificationStatus === "fail" && (
                      <div className="verification-alert" style={{ 
                        backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)',
                        borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '10px',
                        color: '#f87171', fontSize: '0.85rem'
                      }}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <strong>Verification Failed</strong>
                          <p style={{ marginTop: '0.15rem', color: '#cbd5e1' }}>{verificationError}</p>
                        </div>
                      </div>
                    )}

                    {verificationStatus === "success" && (
                      <div className="verification-success-panel" style={{ 
                        backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)',
                        borderRadius: '8px', padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: '12px', color: '#34d399', textAlign: 'center'
                      }}>
                        <CheckCircle size={32} />
                        <div>
                          <strong style={{ fontSize: '1rem' }}>Task Successfully Completed!</strong>
                          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                            WordPress updated successfully and verification passed.
                          </p>
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                      {verificationStatus === "success" ? (
                        activeTask.issueType === "Internal Linking" ? (
                          <button 
                            className="btn-primary start-working-btn" 
                            onClick={() => {
                              if (activeTask.destinationPageUrl) {
                                setExpandedLinkRows({ [activeTask.destinationPageUrl]: true });
                              }
                              setCurrentView("WEBSITES_INTERNAL_LINKING");
                            }} 
                            style={{ width: '100%', justifyContent: 'center' }}
                          >
                            Return to Internal Link Review
                          </button>
                        ) : (
                          <button className="btn-primary start-working-btn" onClick={handleNextTask} style={{ width: '100%', justifyContent: 'center' }}>
                            Next Task
                          </button>
                        )
                      ) : (
                        <button 
                          className="btn-primary" 
                          disabled={verificationStatus === "loading"}
                          onClick={handleVerifyChange}
                          style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
                        >
                          {verificationStatus === "loading" ? "Auditing Page..." : "Verify Change"}
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {currentView === "SETTINGS" && (
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
              
              {selectedSiteId ? (() => {
                const selectedSite = sites.find(s => s.id === selectedSiteId);
                return (
                    <div>
                      {/* Back navigation */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <button 
                          onClick={() => setCurrentView("WEBSITES_CONFIG")}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.35rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            color: 'var(--accent-color)',
                            padding: '8px 16px',
                            marginLeft: '-16px',
                            textDecoration: isBackHovered ? 'underline' : 'none',
                            opacity: isBackHovered ? 0.95 : 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                          onMouseEnter={() => setIsBackHovered(true)}
                          onMouseLeave={() => setIsBackHovered(false)}
                        >
                          ← Back to W2 | Website Dashboard
                        </button>
                      </div>

                      {/* Header Details */}
                      <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: '#f59e0bcc',
                              backgroundColor: '#f59e0b0c',
                              border: '1px solid #f59e0b25',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              display: 'inline-block',
                              marginBottom: '0.5rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}>
                              W6 | Website Settings
                            </div>
                            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                              {selectedSite?.name}
                            </h2>
                            <a 
                              href={selectedSite?.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="site-url-link"
                              style={{ display: 'block', fontSize: '0.9rem', marginTop: '0.35rem', textAlign: 'left' }}
                            >
                              {selectedSite?.url} <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>
                        {renderModuleNavigation("W6")}
                      </div>

                      {/* Website Classification Panel (Relocated from W2) */}
                      <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '2rem', marginBottom: '2rem' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          backgroundColor: '#0c101b',
                          border: '2px solid rgba(255, 255, 255, 0.28)',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          marginRight: '4px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                        }}>
                          {/* Label */}
                          <span style={{
                            fontSize: '0.725rem',
                            textTransform: 'uppercase',
                            fontWeight: 800,
                            color: 'rgba(16, 185, 129, 0.95)',
                            letterSpacing: '0.05em',
                            marginRight: '6px'
                          }}>
                            Website Classification
                          </span>

                          {/* Portfolio Select */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Portfolio:</span>
                            <select
                              id="sitePortfolioInput"
                              value={sitePortfolio}
                              onChange={(e) => setSitePortfolio(e.target.value)}
                              style={{
                                backgroundColor: '#07090b',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                color: 'var(--text-primary)',
                                fontSize: '0.85rem',
                                outline: 'none'
                              }}
                            >
                              <option value="TSE">TSE</option>
                              <option value="Chili">Chili</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          {/* Platform Select */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Platform:</span>
                            <select
                              id="sitePlatformInput"
                              value={sitePlatform}
                              onChange={(e) => setSitePlatform(e.target.value)}
                              style={{
                                backgroundColor: '#07090b',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                color: 'var(--text-primary)',
                                fontSize: '0.85rem',
                                outline: 'none'
                              }}
                            >
                              <option value="WordPress">WordPress</option>
                              <option value="Magento">Magento</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          {/* Elementor checkbox */}
                          {sitePlatform === "WordPress" && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input 
                                type="checkbox"
                                id="siteElementorInput"
                                checked={siteElementorEnabled}
                                onChange={(e) => setSiteElementorEnabled(e.target.checked)}
                                style={{ cursor: 'pointer', width: '14px', height: '14px' }}
                              />
                              <label htmlFor="siteElementorInput" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                Elementor
                              </label>
                            </div>
                          )}

                          {/* Save Settings Button */}
                          <button
                            className="btn-secondary"
                            onClick={handleSaveWebsiteConfig}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              borderRadius: '6px',
                              cursor: 'pointer',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              borderColor: 'rgba(255, 255, 255, 0.15)'
                            }}
                          >
                            Save Settings
                          </button>
                        </div>
                      </div>

                      {/* WordPress Connection Panel */}
                      <div style={{
                        marginTop: '2rem',
                        padding: '2rem',
                        backgroundColor: '#0c101b',
                        border: '2px solid rgba(255, 255, 255, 0.28)',
                        borderRadius: '12px',
                        textAlign: 'left',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                      }}>
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1.5rem 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                          WordPress Connection
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
                          <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Website URL</span>
                            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{selectedSite?.url}</span>
                          </div>
                          
                          <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>API Endpoint</span>
                            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{selectedSite?.url}/wp-json/</span>
                          </div>

                          <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Credentials Status</span>
                            <span style={{
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              color: selectedSite?.credentials?.username ? '#10b981' : '#ef4444',
                              backgroundColor: selectedSite?.credentials?.username ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                              border: selectedSite?.credentials?.username ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                              padding: '4px 12px',
                              borderRadius: '6px',
                              display: 'inline-block'
                            }}>
                              {selectedSite?.credentials?.username ? "Configured" : "Not Configured"}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Connection Status</span>
                            <span style={{
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              color: w6ConnectionStatus === "success" ? '#10b981' : (w6ConnectionStatus === "failed" ? '#ef4444' : '#f59e0b'),
                              backgroundColor: w6ConnectionStatus === "success" ? 'rgba(16, 185, 129, 0.08)' : (w6ConnectionStatus === "failed" ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)'),
                              border: w6ConnectionStatus === "success" ? '1px solid rgba(16, 185, 129, 0.2)' : (w6ConnectionStatus === "failed" ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'),
                              padding: '4px 12px',
                              borderRadius: '6px',
                              display: 'inline-block'
                            }}>
                              {w6ConnectionStatus === "success" ? "Connected" : (w6ConnectionStatus === "failed" ? "Disconnected" : (selectedSite?.status || "Connected"))}
                            </span>
                          </div>
                        </div>

                        {w6ConnectionMessage && (
                          <div style={{
                            padding: '10px 16px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            marginBottom: '1.5rem',
                            backgroundColor: w6ConnectionStatus === "success" ? 'rgba(16, 185, 129, 0.08)' : (w6ConnectionStatus === "failed" ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)'),
                            border: w6ConnectionStatus === "success" ? '1px solid rgba(16, 185, 129, 0.15)' : (w6ConnectionStatus === "failed" ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid rgba(245, 158, 11, 0.15)'),
                            color: w6ConnectionStatus === "success" ? '#10b981' : (w6ConnectionStatus === "failed" ? '#ef4444' : '#f59e0b')
                          }}>
                            {w6ConnectionMessage}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                          <button
                            className="btn-secondary"
                            onClick={() => handleW6TestConnection(selectedSite)}
                            disabled={w6ConnectionStatus === "testing"}
                            style={{ cursor: w6ConnectionStatus === "testing" ? 'not-allowed' : 'pointer' }}
                          >
                            {w6ConnectionStatus === "testing" ? "Testing..." : "Test Connection"}
                          </button>
                          
                          <button
                            className="btn-primary"
                            onClick={() => handleImportPages(selectedSiteId)}
                            disabled={isImporting}
                            style={{ cursor: isImporting ? 'not-allowed' : 'pointer' }}
                          >
                            {isImporting ? "Syncing..." : `Sync from ${selectedSite?.platform || "WordPress"}`}
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Last Sync</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedSite?.lastSync || "Never"}</span>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Pages Found</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{pagesData[selectedSiteId]?.length || 0}</span>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Last Successful Sync</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedSite?.lastSuccessfulSync || "Never"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
);
              })() : (
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '2rem', textAlign: 'left' }}>
                  <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                    Settings
                  </h2>
                  <div style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'rgba(16, 185, 129, 0.85)',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginTop: '6px',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    T1 | Settings
                  </div>
                  <span className="subtitle" style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                    System configuration and administration.
                  </span>
                </div>
              )}

              {!selectedSiteId && ((() => {
                const SETTINGS_GROUPS = [
                  {
                    title: "GENERAL",
                    items: [
                      { id: "general_settings", label: "General Settings" },
                      { id: "default_settings", label: "Default Settings" },
                      { id: "external_link_library", label: "External Link Library" }
                    ]
                  },
                  {
                    title: "CONNECTED WEBSITES",
                    items: [
                      { id: "wordpress_connections", label: "WordPress Connections" },
                      { id: "api_connections", label: "API Connections" }
                    ]
                  },
                  {
                    title: "USERS",
                    items: [
                      { id: "user_accounts", label: "User Accounts" },
                      { id: "roles_permissions", label: "Roles & Permissions" }
                    ]
                  },
                  {
                    title: "SEO CONFIGURATION",
                    items: [
                      { id: "page_types", label: "Page Types" },
                      { id: "audit_rules", label: "Audit Rules" },
                      { id: "internal_linking", label: "Internal Linking" }
                    ]
                  },
                  {
                    title: "AI",
                    items: [
                      { id: "ai_models", label: "AI Models" },
                      { id: "ai_prompts", label: "AI Prompts" }
                    ]
                  },
                  {
                    title: "NOTIFICATIONS",
                    items: [
                      { id: "email_notifications", label: "Email Notifications" },
                      { id: "task_notifications", label: "Task Notifications" }
                    ]
                  },
                  {
                    title: "DATA MANAGEMENT",
                    items: [
                      { id: "import_export", label: "Import / Export" },
                      { id: "backup_restore", label: "Backup & Restore" }
                    ]
                  },
                  {
                    title: "DEVELOPER",
                    items: [
                      { id: "task_engine", label: "Task Engine" },
                      { id: "logs", label: "Logs" },
                      { id: "diagnostics", label: "Architecture Notes" },
                      { id: "github_deployment", label: "GitHub Deployment" }
                    ]
                  },
                  {
                    title: "ABOUT",
                    items: [
                      { id: "version", label: "Version" },
                      { id: "release_notes", label: "Release Notes" }
                    ]
                  }
                ];

                const activeItem = SETTINGS_GROUPS.flatMap(g => g.items).find(i => i.id === activeSettingsTab) || SETTINGS_GROUPS[0].items[0];

                return (
                  <div style={{
                    backgroundColor: '#0c101b',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '2.5rem',
                    display: 'flex',
                    gap: '3rem',
                    minHeight: '650px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                    textAlign: 'left'
                  }}>
                    {/* Left-hand Navigation Sidebar */}
                    <div style={{
                      width: '260px',
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.25rem',
                      paddingRight: '1rem'
                    }}>
                      {SETTINGS_GROUPS.map((group, gIdx) => {
                        const isExpanded = expandedSettingsGroups[group.title] || false;
                        return (
                          <div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div 
                              onClick={() => {
                                setExpandedSettingsGroups(prev => ({
                                  ...prev,
                                  [group.title]: !prev[group.title]
                                }));
                              }}
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                color: '#f97316',
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                marginBottom: '4px',
                                paddingLeft: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                userSelect: 'none'
                              }}
                            >
                              <span>{isExpanded ? "▼" : "▶"}</span>
                              <span>{group.title}</span>
                            </div>
                            {isExpanded && group.items.map((item) => {
                              const isActive = activeSettingsTab === item.id;
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => setActiveSettingsTab(item.id)}
                                  style={{
                                    background: isActive ? 'rgba(16, 185, 129, 0.08)' : 'none',
                                    border: 'none',
                                    borderLeft: isActive ? '2px solid #10b981' : '2px solid transparent',
                                    borderRadius: '0 4px 4px 0',
                                    color: isActive ? '#10b981' : '#94a3b8',
                                    padding: '6px 12px 6px 14px',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    width: '100%',
                                    transition: 'all 0.15s ease',
                                    outline: 'none'
                                  }}
                                >
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>

                    {/* Right-hand Content Panel */}
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      
                      {/* Active Tab Header */}
                      <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {activeItem.label}
                        </h2>
                      </div>

                      {/* Import/Export backup page */}
                      {activeSettingsTab === "import_export" && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1.5rem',
                          backgroundColor: '#070b13',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: '12px',
                          padding: '2rem',
                          maxWidth: '650px'
                        }}>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                            Export or import a full backup of all connected websites and their page configurations. This backup is stored locally on your device.
                          </p>
                          
                          <div style={{ display: 'flex', gap: '16px' }}>
                            <button 
                              className="btn-secondary" 
                              onClick={handleExportData}
                              style={{ 
                                padding: '10px 20px', 
                                fontWeight: 600, 
                                fontSize: '0.85rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              Export Backup
                            </button>
                            <button 
                              className="btn-secondary" 
                              onClick={handleImportData}
                              style={{ 
                                padding: '10px 20px', 
                                fontWeight: 600, 
                                fontSize: '0.85rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              Import Backup
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Task Engine page */}
                      {activeSettingsTab === "task_engine" && (
                        <div>
                          {(() => {
                            const allTasks = sites.flatMap(s => s.tasks);
                            const currentArchTask = allTasks.find(t => t.taskId === selectedArchTaskId) || allTasks[0];
                            
                            if (!currentArchTask) {
                              return (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                  No tasks available in the system.
                                </div>
                              );
                            }

                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {/* Interactive Task Actions (Demonstrate state updates) */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px' }}>
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Interactive Controller: Move this task through states
                                  </span>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      className="btn-secondary btn-sm"
                                      disabled={currentArchTask.assignedTo !== null}
                                      onClick={() => {
                                        setSites(prev => prev.map(s => {
                                          if (s.name === currentArchTask.website) {
                                              return {
                                                ...s,
                                                tasks: s.tasks.map(t => t.taskId === currentArchTask.taskId ? { ...t, assignedTo: "Sarah", assignee: "Sarah", status: "Assigned" } : t)
                                              };
                                          }
                                          return s;
                                        }));
                                        showNotification("Task status updated to Assigned.");
                                      }}
                                    >
                                      Assign to Sarah
                                    </button>
                                    <button
                                      className="btn-secondary btn-sm"
                                      disabled={currentArchTask.status === "In Progress" || currentArchTask.status === "Completed"}
                                      onClick={() => {
                                        setSites(prev => prev.map(s => {
                                          if (s.name === currentArchTask.website) {
                                            return {
                                              ...s,
                                              tasks: s.tasks.map(t => t.taskId === currentArchTask.taskId ? { ...t, assignedTo: t.assignedTo || "Sarah", assignee: t.assignedTo || "Sarah", status: "In Progress", state: "progress" } : t)
                                            };
                                          }
                                          return s;
                                        }));
                                        showNotification("Task status updated to In Progress.");
                                      }}
                                    >
                                      Start Fix
                                    </button>
                                    <button
                                      className="btn-primary btn-sm"
                                      disabled={currentArchTask.status === "Completed"}
                                      onClick={() => {
                                        setSites(prev => prev.map(s => {
                                          if (s.name === currentArchTask.website) {
                                            return {
                                              ...s,
                                              tasks: s.tasks.map(t => t.taskId === currentArchTask.taskId ? { ...t, status: "Completed", state: "completed", completedDate: "2026-06-22" } : t)
                                            };
                                          }
                                          return s;
                                        }));
                                        showNotification("Task verified and status set to Completed.");
                                      }}
                                    >
                                      Verify & Close
                                    </button>
                                  </div>
                                </div>

                                {/* Live JSON Inspector */}
                                <div style={{ backgroundColor: '#070b13', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '1.5rem', textAlign: 'left' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 className="section-title-custom" style={{ fontSize: '1rem', margin: 0 }}>Formalized 14-Field JSON Schema Record</h3>
                                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, backgroundColor: 'rgba(16,185,129,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                                      Valid Model Object
                                    </span>
                                  </div>

                                  <pre style={{
                                    margin: 0,
                                    padding: '1.25rem',
                                    backgroundColor: '#030508',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.03)',
                                    overflowX: 'auto',
                                    fontFamily: 'monospace',
                                    fontSize: '0.85rem',
                                    color: '#a7f3d0',
                                    lineHeight: 1.4
                                  }}>
                                    {JSON.stringify({
                                      taskId: currentArchTask.taskId,
                                      website: currentArchTask.website,
                                      pageUrl: getRelativeUrl(currentArchTask.pageUrl, sites.find(s => s.name === currentArchTask.website)?.url),
                                      pageTitle: currentArchTask.pageTitle,
                                      targetPhrase: currentArchTask.targetPhrase,
                                      taskSource: currentArchTask.taskSource,
                                      issueType: currentArchTask.issueType,
                                      issueDescription: currentArchTask.issueDescription,
                                      priority: currentArchTask.priority,
                                      status: currentArchTask.status,
                                      assignedTo: currentArchTask.assignedTo,
                                      verificationMethod: currentArchTask.verificationMethod,
                                      createdDate: currentArchTask.createdDate,
                                      completedDate: currentArchTask.completedDate
                                    }, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Architecture Notes Page */}
                      {activeSettingsTab === "diagnostics" && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1rem',
                          width: '100%',
                          maxWidth: '900px',
                          textAlign: 'left'
                        }}>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                            Internal reference page recording platform decisions and workflows. Changes auto-save as you type.
                          </p>
                          <textarea
                            value={archNotes}
                            onChange={handleArchNotesChange}
                            placeholder="Loading notes..."
                            style={{
                              width: '100%',
                              height: '550px',
                              backgroundColor: '#070b13',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              color: 'var(--text-primary)',
                              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                              fontSize: '0.9rem',
                              padding: '1.5rem',
                              borderRadius: '8px',
                              lineHeight: 1.6,
                              resize: 'vertical',
                              outline: 'none'
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                              {saveStatus}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* GitHub Deployment Page */}
                      {activeSettingsTab === "github_deployment" && (() => {
                        const hasDiverged = latestGithubCommit !== "unknown" && gitStatus.currentCommit !== latestGithubCommit;
                        const isDeployDisabled = isGitPulling || latestGithubCommit === "unknown" || !hasDiverged;

                        let bannerText = "🟢 Development Server: Up to date";
                        let bannerBg = "rgba(16, 185, 129, 0.1)";
                        let bannerBorder = "1px solid #10b981";
                        let bannerColor = "#10b981";

                        if (gitStatus.lastPullStatus === 'failure') {
                          bannerText = "🔴 Development Server: Git pull failed";
                          bannerBg = "rgba(239, 68, 68, 0.1)";
                          bannerBorder = "1px solid #ef4444";
                          bannerColor = "#ef4444";
                        } else if (hasDiverged) {
                          const isRollback = behindCount === 0 || behindCount === null;
                          bannerText = isRollback
                            ? "🟡 Development Server: Local commit differs from GitHub (Rollback/diverged)"
                            : `🟡 Development Server: ${behindCount === 1 ? "1 update available" : `${behindCount} updates available`}`;
                          bannerBg = "rgba(245, 158, 11, 0.1)";
                          bannerBorder = "1px solid #f59e0b";
                          bannerColor = "#f59e0b";
                        }

                        return (
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.5rem',
                            width: '100%',
                            maxWidth: '900px',
                            textAlign: 'left'
                          }}>
                            {/* Top Status Banner */}
                            <div style={{
                                backgroundColor: bannerBg,
                                border: bannerBorder,
                                borderRadius: '8px',
                                padding: '1rem 1.25rem',
                                color: bannerColor,
                                fontSize: '1rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                              {bannerText}
                            </div>

                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                              Internal developer console to pull updates from GitHub and review build/deploy metadata.
                            </p>

                            {/* Action Buttons Section */}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                              <button
                                className="btn-secondary"
                                disabled={isCheckingUpdates}
                                onClick={handleCheckUpdates}
                                style={{
                                  padding: '12px 24px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '0.95rem',
                                  fontWeight: 750,
                                  cursor: isCheckingUpdates ? 'not-allowed' : 'pointer'
                                }}
                              >
                                {isCheckingUpdates ? "Checking..." : "🔄 Check for Updates"}
                              </button>

                              <button
                                className="btn-primary"
                                disabled={isDeployDisabled}
                                onClick={handleGitPull}
                                style={{
                                  padding: '12px 24px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '0.95rem',
                                  fontWeight: 750,
                                  opacity: isDeployDisabled ? 0.5 : 1,
                                  cursor: isDeployDisabled ? 'not-allowed' : 'pointer'
                                }}
                              >
                                {isGitPulling ? "Deploying..." : "⬇ Deploy Latest Version"}
                              </button>

                              <button
                                className="btn-secondary"
                                onClick={fetchGitStatus}
                                style={{
                                  padding: '12px 24px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '0.95rem',
                                  fontWeight: 750,
                                  cursor: 'pointer'
                                }}
                              >
                                🔄 Refresh Status
                              </button>
                            </div>

                            {/* Informational Cards */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                              gap: '1rem',
                              marginTop: '0.5rem'
                            }}>
                              {/* Branch */}
                              <div style={{
                                backgroundColor: '#070b13',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '8px',
                                padding: '1.25rem'
                              }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Current Branch</span>
                                <div style={{ fontSize: '1.25rem', fontWeight: 850, color: '#10b981', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                                  {gitStatus.branch}
                                </div>
                              </div>

                              {/* Last Pull Time */}
                              <div style={{
                                backgroundColor: '#070b13',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '8px',
                                padding: '1.25rem'
                              }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                                  {gitStatus.lastPullStatus === 'success' ? 'Last Successful Pull' : 'Last Pull Attempt'}
                                </span>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.45rem' }}>
                                  {gitStatus.lastPullTime ? new Date(gitStatus.lastPullTime).toLocaleString() : 'Never'}
                                </div>
                              </div>

                              {/* Status */}
                              <div style={{
                                backgroundColor: '#070b13',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '8px',
                                padding: '1.25rem'
                              }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Last Pull Status</span>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: gitStatus.lastPullStatus === 'success' ? '#10b981' : (gitStatus.lastPullStatus === 'failure' ? '#ef4444' : 'var(--text-secondary)'), marginTop: '0.45rem', textTransform: 'capitalize' }}>
                                  {gitStatus.lastPullStatus === 'success' ? 'Successful' : (gitStatus.lastPullStatus === 'failure' ? 'Failed' : 'No Status')}
                                </div>
                              </div>

                              {/* Time Checked */}
                              <div style={{
                                backgroundColor: '#070b13',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '8px',
                                padding: '1.25rem'
                              }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Last Update Check</span>
                                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.35rem' }}>
                                  {timeChecked ? new Date(timeChecked).toLocaleString() : 'Never'}
                                </div>
                              </div>
                            </div>

                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                              gap: '1.25rem',
                              marginTop: '0.5rem'
                            }}>
                              {/* Current Commit */}
                              <div style={{
                                backgroundColor: '#070b13',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '8px',
                                padding: '1.25rem'
                              }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Current Local Commit</span>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.35rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                  {gitStatus.currentCommit}
                                </div>
                              </div>

                              {/* Latest GitHub Commit */}
                              <div style={{
                                backgroundColor: '#070b13',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '8px',
                                padding: '1.25rem'
                              }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Latest GitHub Commit</span>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.35rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                  {latestGithubCommit === 'unknown' ? "Unable to retrieve latest GitHub commit" : latestGithubCommit}
                                </div>
                              </div>

                              {/* Previous Commit */}
                              <div style={{
                                backgroundColor: '#070b13',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '8px',
                                padding: '1.25rem'
                              }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Previous Commit</span>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.35rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                  {gitStatus.previousCommit}
                                </div>
                              </div>
                            </div>

                            {/* Scrolling Log Window */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>Deployment Log / Build Output</span>
                              <pre style={{
                                margin: 0,
                                padding: '1.25rem',
                                backgroundColor: '#030508',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '8px',
                                color: '#cbd5e1',
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                fontSize: '0.85rem',
                                lineHeight: 1.5,
                                maxHeight: '300px',
                                overflowY: 'auto',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all'
                              }}>
                                {gitPullLogs || "No logs available. Check for updates or click 'Deploy Latest Version' to run."}
                              </pre>
                            </div>
                          </div>
                        )})()}

                      {/* Global External Link Library */}
                      {activeSettingsTab === "external_link_library" && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                            Manage a global library of core external links. These links are available across all websites added to the system.
                          </p>

                          {/* Controls bar */}
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            flexWrap: 'wrap', 
                            gap: '1rem',
                            backgroundColor: 'rgba(255,255,255,0.01)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '12px',
                            padding: '1.25rem'
                          }}>
                            {/* Search */}
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minWidth: '240px' }}>
                              <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)' }} />
                              <input
                                type="text"
                                placeholder="Search library..."
                                value={globalLinkSearch}
                                onChange={(e) => setGlobalLinkSearch(e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px 8px 36px',
                                  backgroundColor: '#070b13',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '8px',
                                  color: 'var(--text-primary)',
                                  fontSize: '0.85rem',
                                  outline: 'none'
                                }}
                              />
                            </div>

                            {/* Add manually / Import CSV */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <input
                                  type="text"
                                  placeholder="Link Name (e.g. Crunchbase)"
                                  value={newGlobalLinkName}
                                  onChange={(e) => setNewGlobalLinkName(e.target.value)}
                                  style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#070b13',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.85rem',
                                    outline: 'none',
                                    width: '180px'
                                  }}
                                />
                                <input
                                  type="text"
                                  placeholder="Source URL (e.g. https://...)"
                                  value={newGlobalSourceUrl}
                                  onChange={(e) => setNewGlobalSourceUrl(e.target.value)}
                                  style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#070b13',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.85rem',
                                    outline: 'none',
                                    width: '240px'
                                  }}
                                />
                                <button
                                  className="btn-primary"
                                  onClick={() => {
                                    if (!newGlobalLinkName.trim() || !newGlobalSourceUrl.trim()) {
                                      showNotification("Link Name and Source URL are required!");
                                      return;
                                    }
                                    setGlobalExternalLinks(prev => [
                                      ...prev,
                                      {
                                        id: `global-ext-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                                        linkName: newGlobalLinkName.trim(),
                                        sourceUrl: newGlobalSourceUrl.trim()
                                      }
                                    ]);
                                    setNewGlobalLinkName("");
                                    setNewGlobalSourceUrl("");
                                    showNotification("Link added to global library.");
                                  }}
                                  style={{ padding: '8px 16px', fontWeight: 700, fontSize: '0.85rem' }}
                                >
                                  + Add Link
                                </button>
                              </div>

                              <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--border-color)' }}></div>

                              {/* CSV Import */}
                              <label
                                className="btn-secondary"
                                style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '6px', 
                                  fontSize: '0.85rem', 
                                  padding: '8px 16px', 
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                📥 Import CSV
                                <input
                                  type="file"
                                  accept=".csv"
                                  onChange={handleCSVImport}
                                  style={{ display: 'none' }}
                                />
                              </label>

                              {/* Clear all */}
                              <button
                                className="btn-secondary"
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to clear all links from the global library?")) {
                                    setGlobalExternalLinks([]);
                                    showNotification("Global library cleared.");
                                  }
                                }}
                                style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  fontSize: '0.85rem', 
                                  padding: '8px 16px', 
                                  fontWeight: 700,
                                  color: '#ef4444',
                                  borderColor: 'rgba(239, 68, 68, 0.2)'
                                }}
                              >
                                Clear All
                              </button>
                            </div>
                          </div>

                          {/* Table */}
                          <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600 }}>Link Name</th>
                                    <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600 }}>Source URL</th>
                                    <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(() => {
                                    const filtered = globalExternalLinks.filter(lnk => 
                                      lnk.linkName.toLowerCase().includes(globalLinkSearch.toLowerCase()) ||
                                      lnk.sourceUrl.toLowerCase().includes(globalLinkSearch.toLowerCase())
                                    );

                                    if (filtered.length === 0) {
                                      return (
                                        <tr>
                                          <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            {globalExternalLinks.length === 0 
                                              ? "No links in the global library. Add one manually or upload a CSV."
                                              : "No matching links found in library."
                                            }
                                          </td>
                                        </tr>
                                      );
                                    }

                                    return filtered.map((lnk) => (
                                      <tr key={lnk.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row-hover">
                                        <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                          {lnk.linkName}
                                        </td>
                                        <td style={{ padding: '16px 20px' }}>
                                          <a href={lnk.sourceUrl} target="_blank" rel="noreferrer" style={{ color: '#10b981', textDecoration: 'none', wordBreak: 'break-all', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                            {lnk.sourceUrl}
                                            <ExternalLink size={12} />
                                          </a>
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                          <button
                                            className="btn-secondary site-btn-sm"
                                            onClick={() => {
                                              setGlobalExternalLinks(prev => prev.filter(x => x.id !== lnk.id));
                                              showNotification("Link removed from global library.");
                                            }}
                                            style={{ display: 'inline-flex', width: 'auto', padding: '4px 8px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
                                          >
                                            Delete
                                          </button>
                                        </td>
                                      </tr>
                                    ));
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Coming Soon placeholders for other settings sub-pages */}
                      {activeSettingsTab !== "import_export" && activeSettingsTab !== "task_engine" && activeSettingsTab !== "diagnostics" && activeSettingsTab !== "github_deployment" && activeSettingsTab !== "external_link_library" && (
                        <div style={{
                          backgroundColor: '#070b13',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: '12px',
                          padding: '4rem 2rem',
                          textAlign: 'center',
                          marginTop: '1rem'
                        }}>
                          <h4 style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>Coming Soon</h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                            This settings page is currently under development.
                          </p>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })())}
            </div>
          )}



          {/* Add Website Onboarding Modal */}
          {isAddWebsiteModalOpen && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(5, 7, 11, 0.85)', backdropFilter: 'blur(8px)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              zIndex: 3000, padding: '1rem'
            }}>
              <div style={{
                backgroundColor: '#0c101b', border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px', padding: '2rem', maxWidth: '480px', width: '100%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', position: 'relative',
                textAlign: 'left'
              }}>
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                  Connect New Website
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem 0' }}>
                  Enter your WordPress website connection credentials. These details are stored locally and used by the TSE Audit Engine.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>
                  {/* Website Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Website Name</label>
                    <input 
                      type="text"
                      value={newSiteName}
                      onChange={(e) => {
                        setNewSiteName(e.target.value);
                        setConnectionTestStatus("idle");
                      }}
                      placeholder="e.g. My WordPress Site"
                      style={{
                        width: '100%', backgroundColor: '#07090b', border: '1px solid var(--border-color)',
                        borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--text-primary)',
                        fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Website URL */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Website URL</label>
                    <input 
                      type="text"
                      value={newSiteUrl}
                      onChange={(e) => {
                        setNewSiteUrl(e.target.value);
                        setConnectionTestStatus("idle");
                      }}
                      placeholder="https://example.com"
                      style={{
                        width: '100%', backgroundColor: '#07090b', border: '1px solid var(--border-color)',
                        borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--text-primary)',
                        fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Platform Select (Milestone M004) */}
                  <div>
                    <label htmlFor="newSitePlatformInput" style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                      Platform
                    </label>
                    <select
                      id="newSitePlatformInput"
                      value={newSitePlatform}
                      onChange={(e) => {
                        setNewSitePlatform(e.target.value);
                        setConnectionTestStatus("idle");
                      }}
                      style={{
                        width: '100%', backgroundColor: '#07090b', border: '1px solid var(--border-color)',
                        borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--text-primary)',
                        fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="WordPress">WordPress</option>
                      <option value="Magento">Magento</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Username */}
                  {newSitePlatform !== "Other" && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                        {newSitePlatform === "Magento" ? "Magento Admin Username" : "WordPress Username"}
                      </label>
                      <input 
                        type="text"
                        value={newSiteUsername}
                        onChange={(e) => {
                          setNewSiteUsername(e.target.value);
                          setConnectionTestStatus("idle");
                        }}
                        placeholder={newSitePlatform === "Magento" ? "admin_username" : "admin"}
                        style={{
                          width: '100%', backgroundColor: '#07090b', border: '1px solid var(--border-color)',
                          borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--text-primary)',
                          fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  )}

                  {/* Password / Token */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                      {newSitePlatform === "Magento" ? "Magento Admin Password" : "WordPress Application Password"}
                    </label>
                    <input 
                      type="text"
                      value={newSitePassword}
                      onChange={(e) => {
                        setNewSitePassword(e.target.value);
                        setConnectionTestStatus("idle");
                      }}
                      placeholder={newSitePlatform === "Magento" ? "admin_password" : "xxxx xxxx xxxx xxxx"}
                      style={{
                        width: '100%', backgroundColor: '#07090b', border: '1px solid var(--border-color)',
                        borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--text-primary)',
                        fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Portfolio Select (Milestone M004) */}
                  <div>
                    <label htmlFor="newSitePortfolioInput" style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                      Portfolio
                    </label>
                    <select
                      id="newSitePortfolioInput"
                      value={newSitePortfolio}
                      onChange={(e) => setNewSitePortfolio(e.target.value)}
                      style={{
                        width: '100%', backgroundColor: '#07090b', border: '1px solid var(--border-color)',
                        borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--text-primary)',
                        fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="TSE">TSE</option>
                      <option value="Chili">Chili</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {newSitePlatform === "WordPress" && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1.25rem', textAlign: 'left' }}>
                      <input 
                        type="checkbox"
                        id="newSiteElementorEnabledInput"
                        checked={newSiteElementorEnabled}
                        onChange={(e) => setNewSiteElementorEnabled(e.target.checked)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                      <label htmlFor="newSiteElementorEnabledInput" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        Elementor Page Builder Enabled
                      </label>
                    </div>
                  )}
                </div>

                {/* Connection Test Message Banner */}
                {connectionTestStatus !== "idle" && (
                  <div>
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border: connectionTestStatus === "success" 
                        ? '1px solid rgba(16, 185, 129, 0.2)' 
                        : connectionTestStatus === "failed" 
                        ? '1px solid rgba(239, 68, 68, 0.2)' 
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      backgroundColor: connectionTestStatus === "success" 
                        ? 'rgba(16, 185, 129, 0.08)' 
                        : connectionTestStatus === "failed" 
                        ? 'rgba(239, 68, 68, 0.08)' 
                        : 'rgba(255, 255, 255, 0.02)',
                      color: connectionTestStatus === "success" 
                        ? '#34d399' 
                        : connectionTestStatus === "failed" 
                        ? '#f87171' 
                        : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {connectionTestStatus === "testing" ? (
                        <>
                          <RefreshCw size={14} className="spinner" /> Testing WordPress REST API connection...
                        </>
                      ) : (
                        connectionTestMessage
                      )}
                    </div>
                    {connectionTestStatus === "failed" && (
                      <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
                        <button 
                          style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', outline: 'none' }}
                          onClick={() => {
                            setConnectionTestStatus("success");
                            setConnectionTestMessage("✅ Connection Successful (Simulated Success)");
                          }}
                        >
                          Simulate Connection Success (Bypass check)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Buttons block */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
                  <button 
                    className="btn-secondary" 
                    onClick={() => {
                      setIsAddWebsiteModalOpen(false);
                      setNewSiteName("");
                      setNewSiteUrl("");
                      setNewSiteUsername("");
                      setNewSitePassword("");
                      setNewSitePortfolio("TSE");
                      setNewSitePlatform("WordPress");
                      setConnectionTestStatus("idle");
                      setConnectionTestMessage("");
                    }}
                    style={{ padding: '10px 18px' }}
                  >
                    Cancel
                  </button>

                  <button 
                    className="btn-secondary"
                    onClick={handleTestConnection}
                    disabled={!newSiteName || !newSiteUrl || !newSitePassword || (newSitePlatform !== "Magento" && !newSiteUsername) || connectionTestStatus === "testing"}
                    style={{ 
                      padding: '10px 18px',
                      opacity: (!newSiteName || !newSiteUrl || !newSitePassword || (newSitePlatform !== "Magento" && !newSiteUsername) || connectionTestStatus === "testing") ? 0.5 : 1,
                      cursor: (!newSiteName || !newSiteUrl || !newSitePassword || (newSitePlatform !== "Magento" && !newSiteUsername) || connectionTestStatus === "testing") ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Test Connection
                  </button>

                  <button 
                    className="btn-primary" 
                    onClick={handleSaveWebsite}
                    disabled={connectionTestStatus !== "success"}
                    style={{ 
                      padding: '10px 20px',
                      backgroundColor: connectionTestStatus === "success" ? '#10b981' : 'rgba(255,255,255,0.05)',
                      color: connectionTestStatus === "success" ? '#ffffff' : 'rgba(255,255,255,0.3)',
                      opacity: connectionTestStatus === "success" ? 1 : 0.5,
                      cursor: connectionTestStatus === "success" ? 'pointer' : 'not-allowed',
                      boxShadow: connectionTestStatus === "success" ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none'
                    }}
                  >
                    Save Website
                  </button>
                </div>
              </div>
            </div>
          )}

          
          {/* Add/Edit External Link Modal */}
          {isExternalLinkModalOpen && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(5, 7, 11, 0.85)', backdropFilter: 'blur(8px)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              zIndex: 3000, padding: '1rem'
            }}>
              <div style={{
                backgroundColor: '#0c101b', border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px', padding: '2rem 2.5rem', 
                maxWidth: (!editingExternalLinkId && extLinkTab === 'bulk' && csvPreviewRows.length > 0) ? '950px' : '800px', 
                width: '100%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', position: 'relative',
                textAlign: 'left',
                transition: 'max-width 0.3s ease'
              }}>
                <button
                  onClick={() => setIsExternalLinkModalOpen(false)}
                  style={{
                    position: 'absolute', top: '1.5rem', right: '1.5rem',
                    background: 'none', border: 'none', color: 'var(--text-secondary)',
                    fontSize: '1.25rem', cursor: 'pointer', outline: 'none'
                  }}
                >
                  ✕
                </button>

                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1.5rem 0' }}>
                  {editingExternalLinkId ? "Edit External Link" : "Add External Link"}
                </h3>

                {/* Tabs - Only show when creating a new link */}
                {!editingExternalLinkId && (
                  <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
                    <button
                      onClick={() => setExtLinkTab('single')}
                      style={{
                        background: 'none', border: 'none', color: extLinkTab === 'single' ? '#3b82f6' : 'var(--text-secondary)',
                        fontSize: '0.95rem', fontWeight: extLinkTab === 'single' ? 800 : 500, cursor: 'pointer',
                        padding: '0.5rem 1rem', borderBottom: extLinkTab === 'single' ? '2px solid #3b82f6' : 'none',
                        outline: 'none'
                      }}
                    >
                      Single Entry
                    </button>
                    <button
                      onClick={() => setExtLinkTab('bulk')}
                      style={{
                        background: 'none', border: 'none', color: extLinkTab === 'bulk' ? '#3b82f6' : 'var(--text-secondary)',
                        fontSize: '0.95rem', fontWeight: extLinkTab === 'bulk' ? 800 : 500, cursor: 'pointer',
                        padding: '0.5rem 1rem', borderBottom: extLinkTab === 'bulk' ? '2px solid #3b82f6' : 'none',
                        outline: 'none'
                      }}
                    >
                      Bulk Import (CSV)
                    </button>
                  </div>
                )}

                {/* Conditional Tab Rendering */}
                {editingExternalLinkId || extLinkTab === 'single' ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                      {/* Left Column */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Link Name */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Link Name</label>
                          <input
                            type="text"
                            value={extLinkName}
                            onChange={(e) => setExtLinkName(e.target.value)}
                            placeholder="e.g. Acme guest post backlink"
                            style={{
                              width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)',
                              borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--text-primary)',
                              fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', boxSizing: 'border-box', height: '42px'
                            }}
                          />
                        </div>

                        {/* Source URL */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Source URL</label>
                          <input
                            type="text"
                            value={extSourceUrl}
                            onChange={(e) => setExtSourceUrl(e.target.value)}
                            placeholder="https://example-blog.com/post-1"
                            style={{
                              width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)',
                              borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--text-primary)',
                              fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', boxSizing: 'border-box', height: '42px'
                            }}
                          />
                        </div>

                        {/* Published URL */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Published URL</label>
                          <input
                            type="text"
                            value={extTargetUrl}
                            onChange={(e) => setExtTargetUrl(e.target.value)}
                            placeholder="https://mysite.com/landing-page"
                            style={{
                              width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)',
                              borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--text-primary)',
                              fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', boxSizing: 'border-box', height: '42px'
                            }}
                          />
                        </div>

                        {/* Link Type */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Link Type</label>
                          <select
                            value={extLinkType}
                            onChange={(e) => setExtLinkType(e.target.value)}
                            style={{
                              width: '100%', backgroundColor: '#07090e', border: '1px solid var(--border-color)',
                              borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--text-primary)',
                              fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', boxSizing: 'border-box', height: '42px'
                            }}
                          >
                            <option value="Backlink">Backlink</option>
                            <option value="Guest Post">Guest Post</option>
                            <option value="Editorial">Editorial</option>
                            <option value="Directory">Directory</option>
                            <option value="Social">Social</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Status */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Status</label>
                          <select
                            value={extStatus}
                            onChange={(e) => setExtStatus(e.target.value)}
                            style={{
                              width: '100%', backgroundColor: '#07090e', border: '1px solid var(--border-color)',
                              borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--text-primary)',
                              fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', boxSizing: 'border-box', height: '42px'
                            }}
                          >
                            <option value="Live">Live</option>
                            <option value="Broken">Broken</option>
                            <option value="Pending">Pending</option>
                          </select>
                        </div>

                        {/* Indexed */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Indexed</label>
                          <select
                            value={extIndexed}
                            onChange={(e) => setExtIndexed(e.target.value)}
                            style={{
                              width: '100%', backgroundColor: '#07090e', border: '1px solid var(--border-color)',
                              borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--text-primary)',
                              fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', boxSizing: 'border-box', height: '42px'
                            }}
                          >
                            <option value="Indexed">Indexed</option>
                            <option value="Not Indexed">Not Indexed</option>
                            <option value="Pending">Pending</option>
                            <option value="Error">Error</option>
                            <option value="Unknown">Unknown</option>
                          </select>
                        </div>

                        {/* Date Added */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Date Added</label>
                          <input
                            type="date"
                            value={extDateAdded}
                            onChange={(e) => setExtDateAdded(e.target.value)}
                            style={{
                              width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)',
                              borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--text-primary)',
                              fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', boxSizing: 'border-box', height: '42px'
                            }}
                          />
                        </div>

                        {/* Last Checked */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Last Checked</label>
                          <input
                            type="text"
                            value={extLastChecked}
                            onChange={(e) => setExtLastChecked(e.target.value)}
                            placeholder="Never or timestamp"
                            style={{
                              width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)',
                              borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--text-primary)',
                              fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', boxSizing: 'border-box', height: '42px'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div style={{ marginBottom: '1.75rem' }}>
                      <label style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Notes</label>
                      <textarea
                        value={extNotes}
                        onChange={(e) => setExtNotes(e.target.value)}
                        placeholder="Enter any additional details or context..."
                        style={{
                          width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)',
                          borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--text-primary)',
                          fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', boxSizing: 'border-box', height: '80px', resize: 'vertical'
                        }}
                      />
                    </div>
                  </>
                ) : (
                  /* Bulk Import UI */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    {/* Setup Actions Row */}
                    {!importCompleted && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '1.5rem' }}>
                        {/* Download Template Column */}
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>1. Prepare CSV Template</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>
                              Download our CSV template containing exactly: <strong style={{ color: '#ffffff' }}>Name, Source URL, Published URL</strong>
                            </p>
                          </div>
                          <button
                            onClick={downloadCsvTemplate}
                            className="btn-secondary"
                            style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, marginTop: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            📥 Download CSV Template
                          </button>
                        </div>

                        {/* Upload CSV Column */}
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>2. Upload CSV File</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>
                              Select your prepared CSV file. The name and source URL fields are required.
                            </p>
                          </div>
                          <div>
                            <input
                              type="file"
                              accept=".csv"
                              id="bulk-csv-upload"
                              onChange={handleCsvUpload}
                              style={{ display: 'none' }}
                            />
                            <label
                              htmlFor="bulk-csv-upload"
                              className="btn-primary"
                              style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: 700, marginTop: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              📁 Choose CSV File
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Preview Table */}
                    {csvPreviewRows.length > 0 && !importCompleted && (
                      <div>
                        <h4 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem 0' }}>
                          CSV Preview ({csvPreviewRows.length} Rows Detected)
                        </h4>
                        <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)', position: 'sticky', top: 0, zIndex: 10 }}>
                                  <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Name</th>
                                  <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Source URL</th>
                                  <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Published URL</th>
                                  <th style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {csvPreviewRows.map((row, idx) => {
                                  const badgeStyle = 
                                    row.status === "Ready" ? { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' } :
                                    row.status === "Duplicate" ? { backgroundColor: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' } :
                                    row.status === "Update Existing" ? { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' } :
                                    { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };

                                  return (
                                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }} title={row.name}>{row.name}</td>
                                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }} title={row.sourceUrl}>{row.sourceUrl}</td>
                                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }} title={row.publishedUrl}>{row.publishedUrl || "—"}</td>
                                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, ...badgeStyle }}>
                                          {row.status}
                                        </span>
                                        {row.errorMsg && (
                                          <div style={{ color: '#ef4444', fontSize: '0.65rem', marginTop: '2px' }}>{row.errorMsg}</div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Import Summary */}
                    {importCompleted && csvSummary && (
                      <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '12px', padding: '1.75rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
                        <h4 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Bulk Import Completed!</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem 0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>{csvSummary.newCount}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'uppercase', fontWeight: 600 }}>New Imported</div>
                          </div>
                          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem 0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3b82f6' }}>{csvSummary.updatedCount}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'uppercase', fontWeight: 600 }}>Updated</div>
                          </div>
                          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem 0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b' }}>{csvSummary.skippedCount}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'uppercase', fontWeight: 600 }}>Skipped Dups</div>
                          </div>
                          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem 0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444' }}>{csvSummary.rejectedCount}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'uppercase', fontWeight: 600 }}>Rejected Invalid</div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setCsvPreviewRows([]);
                            setCsvSummary(null);
                            setImportCompleted(false);
                          }}
                          className="btn-secondary"
                          style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, marginTop: '1.5rem', cursor: 'pointer' }}
                        >
                          🔄 Import Another File
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer buttons */}
                <div style={{ display: 'flex', justifyContent: editingExternalLinkId ? 'space-between' : 'flex-end', gap: '1rem', alignItems: 'center' }}>
                  {editingExternalLinkId && (
                    <button
                      className="btn-secondary"
                      onClick={() => handleDeleteExternalLink(selectedSiteId, editingExternalLinkId)}
                      style={{ 
                        padding: '10px 20px', 
                        cursor: 'pointer', 
                        color: '#ef4444', 
                        borderColor: 'rgba(239, 68, 68, 0.2)' 
                      }}
                    >
                      Delete Link
                    </button>
                  )}
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => setIsExternalLinkModalOpen(false)}
                      style={{ padding: '10px 20px', cursor: 'pointer' }}
                    >
                      {importCompleted ? "Close" : "Cancel"}
                    </button>
                    {(editingExternalLinkId || extLinkTab === 'single') ? (
                      <button
                        className="btn-primary"
                        onClick={handleSaveExternalLink}
                        style={{ padding: '10px 20px', cursor: 'pointer', fontWeight: 700 }}
                      >
                        {editingExternalLinkId ? "Save Changes" : "Add Link"}
                      </button>
                    ) : (
                      !importCompleted && (
                        <button
                          className="btn-primary"
                          onClick={handleConfirmBulkImport}
                          disabled={!csvPreviewRows.some(r => r.status === 'Ready' || r.status === 'Update Existing')}
                          style={{ 
                            padding: '10px 20px', 
                            cursor: csvPreviewRows.some(r => r.status === 'Ready' || r.status === 'Update Existing') ? 'pointer' : 'not-allowed', 
                            fontWeight: 700,
                            opacity: csvPreviewRows.some(r => r.status === 'Ready' || r.status === 'Update Existing') ? 1 : 0.5
                          }}
                        >
                          Confirm Import
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Website Modal */}
          {isEditWebsiteModalOpen && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(5, 7, 11, 0.85)', backdropFilter: 'blur(8px)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              zIndex: 3000, padding: '1rem'
            }}>
              <div style={{
                backgroundColor: '#0c101b', border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px', padding: '2rem 2.5rem', maxWidth: '1080px', width: '100%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', position: 'relative',
                textAlign: 'left'
              }}>
                                {/* Close Button */}
                <button
                  onClick={() => setIsEditWebsiteModalOpen(false)}
                  style={{
                    position: 'absolute',
                    top: '1.5rem',
                    right: '1.5rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    fontWeight: '300',
                    lineHeight: '1',
                    padding: '0.25rem',
                    outline: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                  ✕
                </button>
<h3 style={{ fontFamily: 'Outfit', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                  Edit Website
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem 0' }}>
                  Modify settings, credentials, or delete this connected website from the local engine database.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2rem' }}>
                  {/* Left Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Website Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Website Name</label>
                      <input 
                        type="text"
                        value={editSiteName}
                        onChange={(e) => setEditSiteName(e.target.value)}
                        placeholder="e.g. Bathroom Upgrades"
                        style={{
                          width: '100%', backgroundColor: '#07090b', border: '1px solid var(--border-color)',
                          borderRadius: '8px', padding: '0.75rem 4rem 0.75rem 1.25rem', color: 'var(--text-primary)',
                          fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Website URL */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Website URL</label>
                      <input 
                        type="text"
                        value={editSiteUrl}
                        onChange={(e) => setEditSiteUrl(e.target.value)}
                        placeholder="https://www.bathroomupgrades.co.uk"
                        style={{
                          width: '100%', backgroundColor: '#07090b', border: '1px solid var(--border-color)',
                          borderRadius: '8px', padding: '0.75rem 4rem 0.75rem 1.25rem', color: 'var(--text-primary)',
                          fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Portfolio */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Portfolio</label>
                      <select
                        value={editSitePortfolio}
                        onChange={(e) => setEditSitePortfolio(e.target.value)}
                        style={{
                          width: '100%', backgroundColor: '#07090b', border: '1px solid var(--border-color)',
                          borderRadius: '8px', padding: '0.75rem 4rem 0.75rem 1.25rem', color: 'var(--text-primary)',
                          fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="TSE">TSE</option>
                        <option value="Chili">Chili</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Platform */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Platform</label>
                      <select
                        value={editSitePlatform}
                        onChange={(e) => setEditSitePlatform(e.target.value)}
                        style={{
                          width: '100%', backgroundColor: '#07090b', border: '1px solid var(--border-color)',
                          borderRadius: '8px', padding: '0.75rem 4rem 0.75rem 1.25rem', color: 'var(--text-primary)',
                          fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="WordPress">WordPress</option>
                        <option value="Magento">Magento</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {editSitePlatform === "WordPress" && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1.25rem', textAlign: 'left' }}>
                        <input 
                          type="checkbox"
                          id="editSiteElementorEnabledInput"
                          checked={editSiteElementorEnabled}
                          onChange={(e) => setEditSiteElementorEnabled(e.target.checked)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                        <label htmlFor="editSiteElementorEnabledInput" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                          Elementor Page Builder Enabled
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                     {/* WordPress API URL */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                        {editSitePlatform === "Magento" ? "Magento REST API URL" : "WordPress API URL"}
                      </label>
                      <input 
                        type="text"
                        value={editSiteApiUrl}
                        onChange={(e) => setEditSiteApiUrl(e.target.value)}
                        placeholder={editSitePlatform === "Magento" ? "https://www.hf4you.co.uk/rest/" : "https://www.bathroomupgrades.co.uk/wp-json/"}
                        style={{
                          width: '100%', backgroundColor: '#07090b', border: '1px solid var(--border-color)',
                          borderRadius: '8px', padding: '0.75rem 4rem 0.75rem 1.25rem', color: 'var(--text-primary)',
                          fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* WordPress Username */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                        {editSitePlatform === "Magento" ? "Magento Admin Username" : "WordPress Username"}
                      </label>
                      <input 
                        type="text"
                        value={editSiteUsername}
                        onChange={(e) => setEditSiteUsername(e.target.value)}
                        placeholder={editSitePlatform === "Magento" ? "admin_username" : "admin"}
                        style={{
                          width: '100%', backgroundColor: '#07090b', border: '1px solid var(--border-color)',
                          borderRadius: '8px', padding: '0.75rem 4rem 0.75rem 1.25rem', color: 'var(--text-primary)',
                          fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* WordPress Application Password */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                        {editSitePlatform === "Magento" ? "Magento Admin Password" : "WordPress Application Password"}
                      </label>
                      <input 
                        type="password"
                        value={editSitePassword}
                        onChange={(e) => setEditSitePassword(e.target.value)}
                        placeholder={editSitePlatform === "Magento" ? "admin_password" : "xxxx xxxx xxxx xxxx"}
                        style={{
                          width: '100%', backgroundColor: '#07090b', border: '1px solid var(--border-color)',
                          borderRadius: '8px', padding: '0.75rem 4rem 0.75rem 1.25rem', color: 'var(--text-primary)',
                          fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                                        {/* Connection Status */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Connection Status</label>
                      <div style={{
                        width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)',
                        borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--text-primary)',
                        fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', display: 'flex',
                        alignItems: 'center', height: '42px', boxSizing: 'border-box'
                      }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: (() => {
                            const site = sites.find(s => s.id === editingSiteId);
                            return (site?.status === "Connected" && site?.credentials?.username) ? '#10b981' : '#fbbf24';
                          })(),
                          display: 'inline-block',
                          marginRight: '8px'
                        }}></span>
                        {(() => {
                          const site = sites.find(s => s.id === editingSiteId);
                          return (site?.status === "Connected" && site?.credentials?.username) ? "Connected" : "Setup Required";
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      className="btn-primary"
                      onClick={handleSaveEditWebsite}
                      disabled={!editSiteName || !editSiteUrl}
                      style={{
                        flex: 1, justifyContent: 'center', backgroundColor: '#10b981', color: '#ffffff',
                        fontWeight: 600, padding: '10px 16px', borderRadius: '8px', border: 'none',
                        cursor: (!editSiteName || !editSiteUrl) ? 'not-allowed' : 'pointer',
                        opacity: (!editSiteName || !editSiteUrl) ? 0.5 : 1
                      }}
                    >
                      Save Changes
                    </button>
                    
                    <button
                      className="btn-secondary"
                      onClick={() => setIsEditWebsiteModalOpen(false)}
                      style={{
                        flex: 1, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)',
                        fontWeight: 600, padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>

                  <button
                    className="btn-secondary"
                    onClick={handleDeleteWebsite}
                    style={{
                      width: '100%', justifyContent: 'center', backgroundColor: 'rgba(239, 68, 68, 0.08)', color: '#ef4444',
                      fontWeight: 600, padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.5rem'
                    }}
                  >
                    Delete Website
                  </button>
                </div>
              </div>
            </div>
          )}

{/* Dynamic Page Configuration Modal */}
          {isConfigModalOpen && (modalMode === "add" || editingPage) && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(5, 7, 11, 0.85)', backdropFilter: 'blur(8px)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              zIndex: 3000, padding: '1rem'
            }}>
              <div style={{
                backgroundColor: '#0c101b', border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px', padding: '2rem', maxWidth: '480px', width: '100%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', position: 'relative'
              }}>
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {modalMode === "add" ? "Add New Page Target" : "Configure Page Targeting"}
                </h3>
                <div style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: 'rgba(16, 185, 129, 0.85)',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  display: 'inline-block',
                  marginTop: '6px',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  W3 | Page Configuration
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem 0' }}>
                  {modalMode === "add" 
                    ? "Manually add a planned future page to include it in future audit scans and task generation." 
                    : "Set or update the target phrase and title for this page URL path."}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>
                  {/* Page URL input/read-only */}
                  <div>
                    <label htmlFor="modalUrlInput" style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Page URL Path</label>
                    {modalMode === "add" ? (
                      <input 
                        id="modalUrlInput"
                        type="text"
                        value={inputPageUrl}
                        onChange={(e) => setInputPageUrl(e.target.value)}
                        placeholder="e.g. /accessible-bathrooms/"
                        style={{
                          width: '100%', backgroundColor: '#07090b', border: '1px solid var(--border-color)',
                          borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--text-primary)',
                          fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: '0.9rem', fontFamily: 'monospace', color: '#60a5fa', fontWeight: 600 }}>{editingPage?.pageUrl}</div>
                    )}
                  </div>

                  {/* Page Title input */}
                  <div>
                    <label htmlFor="modalTitleInput" style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Page Title</label>
                    {modalMode === "add" ? (
                      <input 
                        id="modalTitleInput"
                        type="text" 
                        value={inputPageTitle}
                        onChange={(e) => {
                          setInputPageTitle(e.target.value);
                          setInputProposedPageTitle(e.target.value);
                        }}
                        placeholder="e.g. Accessible Bathrooms"
                        style={{
                          width: '100%', backgroundColor: '#07090b', border: '1px solid var(--border-color)',
                          borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--text-primary)',
                          fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, padding: '0.25rem 0' }}>
                        {editingPage?.pageTitle || "Untitled Page"}
                      </div>
                    )}
                  </div>

                  {/* Proposed Page Title input */}
                  <div>
                    <label htmlFor="modalProposedTitleInput" style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Proposed Page Title</label>
                    <input 
                      id="modalProposedTitleInput"
                      type="text" 
                      value={inputProposedPageTitle}
                      onChange={(e) => setInputProposedPageTitle(e.target.value)}
                      placeholder="e.g. Proposed Title"
                      style={{
                        width: '100%', backgroundColor: '#07090b', border: '1px solid var(--border-color)',
                        borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--text-primary)',
                        fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Target Phrase input */}
                  <div>
                    <label htmlFor="modalTargetInput" style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Target Phrase</label>
                    <input 
                      id="modalTargetInput"
                      type="text" 
                      value={inputTargetPhrase}
                      onChange={(e) => setInputTargetPhrase(e.target.value)}
                      placeholder="e.g. accessible bathrooms"
                      style={{
                        width: '100%', backgroundColor: '#07090b', border: '1px solid var(--border-color)',
                        borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--text-primary)',
                        fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSavePageConfig(); }}
                    />
                  </div>

                  {/* Page Type dropdown */}
                  <div>
                    <label htmlFor="modalPageTypeInput" style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Page Type</label>
                    <select 
                      id="modalPageTypeInput"
                      value={inputPageType}
                      onChange={(e) => setInputPageType(e.target.value)}
                      style={{
                        width: '100%', backgroundColor: '#07090b', border: '1px solid var(--border-color)',
                        borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--text-primary)',
                        fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="Hub Page">Hub Page</option>
                      <option value="Landing Page">Landing Page</option>
                      <option value="Supporting Page">Supporting Page</option>
                      <option value="Topical Page">Topical Page</option>
                      <option value="Excluded">Excluded</option>
                    </select>
                  </div>

                  {/* Priority (read-only) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Priority</label>
                    <div id="modalPriorityDisplay" style={{
                      backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
                      borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--text-secondary)',
                      fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', outline: 'none',
                      boxSizing: 'border-box'
                    }}>
                      {(() => {
                        if (inputPageType === "Hub Page") return "Priority 1";
                        if (inputPageType === "Landing Page") return "Priority 2";
                        if (inputPageType === "Supporting Page") return "Priority 3";
                        if (inputPageType === "Topical Page") return "Priority 4";
                        if (inputPageType === "Excluded") return "None";
                        return "Priority 3";
                      })()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn-secondary" 
                    onClick={() => { setIsConfigModalOpen(false); setEditingPage(null); }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={handleSavePageConfig}
                  >
                    {modalMode === "add" ? "Add Planned Page" : "Save Configuration"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

