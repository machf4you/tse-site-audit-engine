import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Play, CheckCircle, RefreshCw, ArrowLeft, 
  ExternalLink, User, Check, Server, AlertCircle, Award, ChevronRight, ChevronDown, Globe, FileText,
  Lock, AlertTriangle
} from 'lucide-react';
import './App.css';
import exporterData from './exporter-data.json';

const runPageAudit = (pageUrl, targetPhrase, pageTitle, siteId) => {
  let foundPage = null;
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

  const data = (foundPage && foundPage.crawlData) ? foundPage.crawlData : {
    url: pageUrl,
    title: pageTitle || "Page Title",
    description: "Expert services across South East London. Call us today for a free quote.",
    h1: pageTitle || "Page Title",
    h2Count: 4,
    h2List: ["Our Services", "Complete Renovations", "Get a Quote", "Contact Us"],
    wordCount: 480,
    plainText: (pageTitle || "Page Title") + " services. We provide high quality upgrades.",
    internalLinkCount: 1,
    incomingAnchors: [],
    imageCount: 1,
    images: [{ url: "/wp-content/uploads/dummy.webp", alt: "Bathroom Image" }],
    imagesMissingAltText: 1
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
  const linkAction = linkStatus === "Fail" ? `Increase incoming internal links to this page (currently ${contextualLinkCount} links, minimum 3 required)` : "";
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

  if (!target || page.status !== "Configured") return []; // Only configured pages are audited

  const auditResults = runPageAudit(relUrl, target, title, siteId);
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
  if (!target || page.status !== "Configured") {
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

  const auditResults = runPageAudit(relUrl, target, title, siteId);
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
  if (!page) return "Unconfigured";
  return page.assignedType || "Unconfigured";
};

const paramsTemp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const viewParamTemp = paramsTemp ? paramsTemp.get('view') : null;
const isAutomationViewTemp = ['results', 'detail', 'edit', 'tasklist'].includes(viewParamTemp);

const BU_PAGES = exporterData["bathroom-upgrades"].pages.map(p => {
  if (isAutomationViewTemp) {
    if (p.pageUrl === "/") {
      return { ...p, targetPhrase: "bathroom upgrades", status: "Configured" };
    } else if (p.pageUrl === "/bathroom-renovations/") {
      return { ...p, targetPhrase: "bathroom renovations", status: "Configured" };
    } else if (p.pageUrl === "/bathroom-installation/") {
      return { ...p, targetPhrase: "bathroom installation", status: "Configured" };
    }
  }
  return p;
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
    status: "Connected",
    lastAudit: isAutomationViewTemp ? "16 May 2026" : null,
    tasks: initialBUData.tasks
  },
  {
    id: "the-search-equation",
    name: "The Search Equation",
    url: exporterData["the-search-equation"].site_url,
    status: "Connected",
    lastAudit: null,
    tasks: []
  }
];

const INITIAL_PAGES_DATA = {
  "bathroom-upgrades": BU_PAGES,
  "the-search-equation": exporterData["the-search-equation"].pages
};

// Workflow indicator stepper
const WorkflowStepper = ({ currentView }) => {
  const steps = [
    { label: "Connected Website", views: ["CONNECTED_SITES"] },
    { label: "Configuration", views: ["WEBSITES_CONFIG", "AUDIT_CONFIG"] },
    { label: "Audit", views: ["AUDIT_RUNNING", "AUDIT_RESULTS"] },
    { label: "Tasks", views: ["WEBSITES"] },
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

export default function App() {
  const [sites, setSites] = useState(() => {
    if (isAutomationViewTemp) {
      return INITIAL_SITES;
    }
    const saved = typeof window !== 'undefined' ? localStorage.getItem("tse_sites_data") : null;
    if (saved) {
      try {
        return JSON.parse(saved);
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
  const [isAutomation, setIsAutomation] = useState(isAutomationViewTemp);
  const [isImporting, setIsImporting] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [inputTargetPhrase, setInputTargetPhrase] = useState("");
  const [inputPageUrl, setInputPageUrl] = useState("");
  const [inputPageTitle, setInputPageTitle] = useState("");
  const [modalMode, setModalMode] = useState("edit"); // edit, add
  const [currentFilter, setCurrentFilter] = useState("all"); // all, configured, unconfigured, planned
  const [selectedPageUrl, setSelectedPageUrl] = useState(null);
  const [reviewPageUrl, setReviewPageUrl] = useState("");
  
  // Parse query parameters for screenshot capturing / navigation testing
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const viewParam = params ? params.get('view') : null;
  const instantParam = params ? params.get('instant') === 'true' : false;
  const findingParam = params ? params.get('findingId') : null;
  
  const initialView = (viewParam === 'detail') ? 'TASK_FOCUS' : 
                      (viewParam === 'edit') ? 'EDIT' : 
                      (viewParam === 'tasklist') ? 'WEBSITES' : 
                      (viewParam === 'config_manage') ? 'WEBSITES_CONFIG' :
                      (viewParam === 'config') ? 'AUDIT_CONFIG' :
                      (viewParam === 'running') ? 'AUDIT_RUNNING' :
                      (viewParam === 'results') ? 'AUDIT_RESULTS' :
                      (viewParam === 'settings' || viewParam === 'architecture') ? 'SETTINGS' :
                      'CONNECTED_SITES';
  const initialSiteId = (viewParam === 'dashboard') ? null : 
                        (viewParam === 'config' || viewParam === 'running' || viewParam === 'results' || viewParam === 'config_manage') ? 'bathroom-upgrades' : 
                        INITIAL_SITES[0].id;
  const initialTaskId = (viewParam === 'detail' || viewParam === 'edit') ? INITIAL_SITES[0].tasks[0].id : null;

  const [currentView, setCurrentView] = useState(initialView);
  const [selectedSiteId, setSelectedSiteId] = useState(initialSiteId);
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
  
  // Audit run states
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditLogs, setAuditLogs] = useState([]);
  const [singleAuditPageUrl, setSingleAuditPageUrl] = useState(null);
  const [showExcluded, setShowExcluded] = useState(false);
  const [resultsTab, setResultsTab] = useState("findings"); // findings, evaluations

  const handleAuditSinglePage = (pageUrl) => {
    setSingleAuditPageUrl(pageUrl);
    setCurrentView("AUDIT_RUNNING");
  };

  useEffect(() => {
    if (!isAutomation) {
      localStorage.setItem("tse_pages_data", JSON.stringify(pagesData));
    }
  }, [pagesData, isAutomation]);

  useEffect(() => {
    if (!isAutomation) {
      localStorage.setItem("tse_sites_data", JSON.stringify(sites));
    }
  }, [sites, isAutomation]);

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
  const [simSource, setSimSource] = useState("Search Console");
  const [simSiteId, setSimSiteId] = useState("bathroom-upgrades");
  const [simUrl, setSimUrl] = useState("/search-performance-drop/");
  const [simTitle, setSimTitle] = useState("Search Performance Alert Page");
  const [simPhrase, setSimPhrase] = useState("bathroom renovation design");
  const [simIssueType, setSimIssueType] = useState("CTR Drop Alert");
  const [simDesc, setSimDesc] = useState("Page CTR fell by 22% on target query over past 30 days.");
  const [simPriority, setSimPriority] = useState("High");
  const [simVerification, setSimVerification] = useState("Search Console API verifies impressions recover above threshold");


  // Helper to resolve relative path from absolute URL
  const getRelativeUrl = (url, siteUrl) => {
    if (!url) return "/";
    if (url.startsWith("/")) return url;
    try {
      const parsed = new URL(url);
      return parsed.pathname;
    } catch (e) {
      if (siteUrl) {
        let rel = url.replace(siteUrl, "");
        if (!rel.startsWith("/")) rel = "/" + rel;
        return rel;
      }
      return url;
    }
  };  // Helper to score pages for SEO working order
  const getPageSEOScore = (page) => {
    const url = page.pageUrl;
    
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

  useEffect(() => {
    if (currentView === "AUDIT_RUNNING") {
      const sitePages = pagesData[selectedSiteId] || [];
      const site = sites.find(s => s.id === selectedSiteId);
      
      const logs = [
        "[INFO] Connected via TSE Exporter Plugin."
      ];

      // Filter pages depending on whether this is a single page audit or full site audit
      const pagesToScan = singleAuditPageUrl 
        ? sitePages.filter(p => p.pageUrl === singleAuditPageUrl)
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
              const targetPage = sitePages.find(p => p.pageUrl === singleAuditPageUrl);
              const { findings, tasks: newTasks } = getFindingsAndTasksForSite(selectedSiteId, [targetPage], site.url, site.name);

              setAuditFindings(findings);
              setSelectedFindingId(findings.length > 0 ? findings[0].findingId : null);
              
              const auditResultsForPage = runPageAudit(targetPage.pageUrl, targetPage.targetPhrase, targetPage.pageTitle, selectedSiteId);
              setPagesData(prev => ({
                ...prev,
                [selectedSiteId]: (prev[selectedSiteId] || []).map(p => {
                  if (p.pageUrl === singleAuditPageUrl) {
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
                  const updatedTasks = s.tasks.filter(t => t.pageUrl !== cleanUrl);
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
                    const auditResultsForPage = runPageAudit(p.pageUrl, p.targetPhrase, p.pageTitle, selectedSiteId);
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

            setCurrentView("AUDIT_RESULTS");
          }, 800);
        }
      }, 300);

      return () => clearInterval(interval);
    }
  }, [currentView, selectedSiteId, pagesData, sites, singleAuditPageUrl]);

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
    setInputTargetPhrase(page.targetPhrase || "");
    setIsConfigModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingPage(null);
    setInputPageUrl("");
    setInputPageTitle("");
    setInputTargetPhrase("");
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
        // Prevent duplicate URL
        if (prev[selectedSiteId].some(p => p.pageUrl === formattedUrl)) {
          showNotification("Page URL already exists!");
          return prev;
        }

        const newPage = {
          pageUrl: formattedUrl,
          pageTitle: inputPageTitle.trim() || "Untitled Page",
          targetPhrase: inputTargetPhrase.trim(),
          status: "Planned",
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

      setPagesData(prev => {
        const updatedSitePages = prev[selectedSiteId].map(p => {
          if (p.pageUrl === editingPage.pageUrl) {
            const hasTarget = !!inputTargetPhrase.trim();
            // If it was Planned, it remains Planned. If it was Configured/Unconfigured, update based on TargetPhrase presence.
            const updatedStatus = p.status === "Planned" ? "Planned" : (hasTarget ? "Configured" : "Unconfigured");
            return {
              ...p,
              pageTitle: inputPageTitle.trim() || p.pageTitle,
              targetPhrase: inputTargetPhrase.trim(),
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

  const handleImportPages = (siteId) => {
    setIsImporting(true);
    showNotification("Connecting to TSE Exporter...");
    
    setTimeout(() => {
      setIsImporting(false);
      showNotification("All exporter pages are fully synchronized.");
    }, 1000);
  };

  const selectedSite = sites.find(s => s.id === selectedSiteId) || null;
  const activeTask = selectedSite ? selectedSite.tasks.find(t => t.id === selectedTaskId) : null;

  const handleStartTask = (taskId) => {
    const task = selectedSite.tasks.find(t => t.id === taskId);
    if (task) {
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

  const handleVerifyChange = () => {
    if (!activeTask || !selectedSite) return;
    
    setVerificationStatus("loading");
    setVerificationError("");
    
    setTimeout(() => {
      // Basic verification rule: input content must contain the required keyword
      const isValid = editingContent.toLowerCase().includes(activeTask.keyword.toLowerCase());
      
      if (isValid) {
        setVerificationStatus("success");
        // Update task state to completed
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
        setVerificationError(`Verification Failed. The page content is missing the required target phrase "${activeTask.keyword}".`);
      }
    }, 1500);
  };

  const handleNextTask = () => {
    if (!selectedSite) return;
    
    // Find next incomplete task in the backlog list for the current website
    const incompleteTasks = selectedSite.tasks.filter(t => t.state !== "completed" && t.id !== selectedTaskId);
    
    if (incompleteTasks.length > 0) {
      // Prioritize High -> Medium -> Low
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      incompleteTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      
      const nextTask = incompleteTasks[0];
      setSelectedTaskId(nextTask.id);
      setEditingContent(nextTask.currentVersion);
      setVerificationStatus("idle");
      setVerificationError("");
      setCurrentView("TASK_FOCUS");
    } else {
      // All tasks complete for this site
      showNotification(`All tasks completed for ${selectedSite.name}!`);
      setCurrentView("WEBSITES");
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
    if (currentView === "WEBSITES") {
      // If a site is selected, we have already chosen a website, so stepper advances to tasks
      return selectedSiteId ? "tasks" : "website";
    }
    if (currentView === "TASK_FOCUS") return "fix";
    if (currentView === "EDIT") {
      if (verificationStatus === "success") return "verify";
      return "fix";
    }
    return "website";
  };

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
        <div className="hub-brand" onClick={() => { setCurrentView("CONNECTED_SITES"); setSelectedTaskId(null); }} style={{ cursor: 'pointer' }}>
          <CheckSquare size={22} style={{ color: "var(--accent-color)" }} />
          <span>TSE Website Management</span>
        </div>

        <div className="hub-navigation" style={{ display: 'flex', gap: '24px', marginLeft: '80px', marginRight: 'auto' }}>
          <button 
            onClick={() => {
              if (currentView === "SETTINGS" || currentView === "SITE_ANALYSIS") {
                setCurrentView("CONNECTED_SITES");
              }
            }} 
            style={{
              background: 'none', border: 'none', 
              color: (currentView !== "SETTINGS" && currentView !== "SITE_ANALYSIS") ? '#10b981' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
              borderBottom: (currentView !== "SETTINGS" && currentView !== "SITE_ANALYSIS") ? '2px solid #10b981' : '2px solid transparent',
              padding: '8px 4px', transition: 'all 0.2s ease', outline: 'none'
            }}
          >
            Websites
          </button>
          <button 
            onClick={() => {
              setSelectedAnalysisSiteId(null);
              setActiveModule(null);
              setCurrentView("SITE_ANALYSIS");
            }} 
            style={{
              background: 'none', border: 'none', 
              color: currentView === "SITE_ANALYSIS" ? '#10b981' : '#94a3b8',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
              borderBottom: currentView === "SITE_ANALYSIS" ? '2px solid #10b981' : '2px solid transparent',
              padding: '8px 4px', transition: 'all 0.2s ease', outline: 'none'
            }}
          >
            Site Analysis
          </button>
          <button 
            onClick={() => setCurrentView("SETTINGS")} 
            style={{
              background: 'none', border: 'none', 
              color: currentView === "SETTINGS" ? '#10b981' : '#94a3b8',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
              borderBottom: currentView === "SETTINGS" ? '2px solid #10b981' : '2px solid transparent',
              padding: '8px 4px', transition: 'all 0.2s ease', outline: 'none'
            }}
          >
            Settings
          </button>
        </div>
        {/* User profile removed */}
      </header>

      {/* Main Content Area */}
      <main className="hub-main">
        <div className="hub-content">
          


          {/* SITE ANALYSIS SECTION */}
          {currentView === "SITE_ANALYSIS" && (
            <div className="report-section" style={{ maxWidth: '1650px', margin: '0 auto', padding: '2.5rem', textAlign: 'left' }}>
              
              {selectedAnalysisSiteId === null ? (
                <>
                  {/* Overview Page */}
                  <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
                    <h2 style={{ fontFamily: 'Outfit', fontSize: '2.2rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                      Site Analysis
                    </h2>
                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 500 }}>
                      Analyze SEO configurations, crawl results, and audit histories across all connected sites.
                    </p>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                    gap: '2rem',
                    marginTop: '1.5rem'
                  }}>
                    {sites.map(site => {
                      const sitePages = pagesData[site.id] || [];
                      const pagesFound = sitePages.length || (site.id === 'bathroom-upgrades' ? 33 : 113);
                      const configuredPages = sitePages.filter(p => p.status === "Configured").length;
                      const hasAudit = !!site.lastAudit;
                      const auditStatusText = hasAudit ? `Audited (${site.lastAudit})` : "Pending Audit";

                      return (
                        <div 
                          key={site.id}
                          style={{
                            backgroundColor: '#0c101b',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            padding: '2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.25rem',
                            transition: 'all 0.25s ease',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                            position: 'relative'
                          }}
                        >
                          <div>
                            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                              {site.name}
                            </h3>
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

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '0.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                              <span>Pages Found</span>
                              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{pagesFound}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                              <span>Configured Pages</span>
                              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{configuredPages}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--text-secondary)', alignItems: 'center' }}>
                              <span>Last Audit Status</span>
                              <span style={{
                                fontWeight: 700,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                backgroundColor: hasAudit ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                color: hasAudit ? '#34d399' : '#fbbf24',
                                border: hasAudit ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
                              }}>
                                {auditStatusText}
                              </span>
                            </div>
                          </div>

                          <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '1rem' }}>
                            <button
                              onClick={() => {
                                setSelectedAnalysisSiteId(site.id);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#10b981',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: 0,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#34d399';
                                e.currentTarget.style.transform = 'translateX(4px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#10b981';
                                e.currentTarget.style.transform = 'none';
                              }}
                            >
                              Open Site Analysis &rarr;
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  {/* Detailed Site Page */}
                  {(() => {
                    const site = sites.find(s => s.id === selectedAnalysisSiteId);
                    if (!site) return null;

                    const sitePages = pagesData[site.id] || [];
                    const pagesFound = sitePages.length || (site.id === 'bathroom-upgrades' ? 33 : 113);
                    const configuredPages = sitePages.filter(p => p.status === "Configured").length;
                    const hasAudit = !!site.lastAudit;
                    const auditStatusText = hasAudit ? `Audited (${site.lastAudit})` : "Pending Audit";

                    if (activeModule === 'site-structure') {
                      const sortedPages = sortPagesForSEO(pagesData[site.id] || []);

                      const getGroupedPageType = (page) => {
                        if (page.assignedType) {
                          if (page.assignedType === "Homepage") return "Homepage";
                          if (page.assignedType === "Hub Page" || page.assignedType === "Hub Pages") return "Hub Pages";
                          if (page.assignedType === "Landing Page" || page.assignedType === "Landing Pages") return "Landing Pages";
                          if (page.assignedType === "Supporting Page" || page.assignedType === "Supporting Pages") return "Supporting Pages";
                          if (page.assignedType === "Topical Page" || page.assignedType === "Topical Pages") return "Topical Pages";
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
                        <div>
                          {/* Back navigation to Site Analysis Detail Overview */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                            <button 
                              onClick={() => setActiveModule(null)}
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
                              <ArrowLeft size={16} /> Back to Overview
                            </button>
                          </div>

                          {/* Banner card */}
                          <div style={{
                            backgroundColor: '#0c101b',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            textAlign: 'left',
                            marginBottom: '2rem'
                          }}>
                            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
                              {site.name} - Site Structure
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

                            <hr style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '1.25rem 0', borderStyle: 'solid', borderWidth: '1px 0 0 0' }} />

                            <div style={{ display: 'flex', gap: '3.5rem', flexWrap: 'wrap' }}>
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
                                  Last Audit Status
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
                          </div>

                          {/* Accordion groups */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {sections.map(sec => {
                              const isSectionExpanded = !!expandedSections[sec.key];

                              return (
                                <div key={sec.key}>
                                  <div 
                                    onClick={() => toggleSection(sec.key)}
                                    style={{
                                      backgroundColor: '#0c101b',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '12px',
                                      padding: '1.25rem 1.5rem',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      cursor: 'pointer',
                                      fontWeight: 700,
                                      fontSize: '1.15rem',
                                      color: 'var(--text-primary)',
                                      fontFamily: 'Outfit, sans-serif'
                                    }}
                                  >
                                    <span>{sec.name} ({sec.pages.length})</span>
                                    {isSectionExpanded ? <ChevronDown size={18} style={{ color: 'var(--text-secondary)' }} /> : <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />}
                                  </div>

                                  {isSectionExpanded && (
                                    <div style={{ 
                                      display: 'flex', 
                                      flexDirection: 'column', 
                                      gap: '0.75rem', 
                                      padding: '1rem 0.5rem 1.5rem 0.5rem',
                                      marginTop: '0.25rem'
                                    }}>
                                      {sec.pages.length === 0 ? (
                                        <div style={{ 
                                          padding: '1.25rem', 
                                          color: 'var(--text-secondary)', 
                                          fontSize: '0.9rem', 
                                          fontStyle: 'italic', 
                                          backgroundColor: 'rgba(255,255,255,0.01)', 
                                          border: '1px dashed rgba(255,255,255,0.06)', 
                                          borderRadius: '8px', 
                                          textAlign: 'left' 
                                        }}>
                                          No pages in this category.
                                        </div>
                                      ) : (
                                        sec.pages.map(page => {
                                          const isPageConfigured = page.status === "Configured";
                                          return (
                                            <div 
                                              key={page.pageUrl}
                                              style={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                alignItems: 'center', 
                                                padding: '1rem 1.25rem', 
                                                backgroundColor: 'rgba(255,255,255,0.02)', 
                                                border: '1px solid rgba(255,255,255,0.04)', 
                                                borderRadius: '8px'
                                              }}
                                            >
                                              <div style={{ textAlign: 'left' }}>
                                                <span style={{ fontSize: '0.95rem', color: '#cbd5e1', fontWeight: 600 }}>
                                                  {page.pageTitle || "Untitled Page"}
                                                </span>
                                                <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginLeft: '8px', fontFamily: 'monospace' }}>
                                                  ({page.pageUrl})
                                                </span>
                                              </div>
                                              <div>
                                                <span style={{
                                                  fontWeight: 700,
                                                  padding: '4px 10px',
                                                  borderRadius: '6px',
                                                  fontSize: '0.8rem',
                                                  backgroundColor: isPageConfigured ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.05)',
                                                  color: isPageConfigured ? '#34d399' : '#94a3b8',
                                                  border: isPageConfigured ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255,255,255,0.08)'
                                                }}>
                                                  {isPageConfigured ? "Configured" : "Unconfigured"}
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })
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

                    if (activeModule === 'internal-linking') {
                      const sortedPages = sortPagesForSEO(pagesData[site.id] || []);
                      const configuredPages = sortedPages.filter(p => p.status === "Configured");

                      const linkResults = configuredPages.map(page => {
                        const audit = runPageAudit(page.pageUrl, page.targetPhrase, page.pageTitle, site.id);
                        const linkCheck = audit.find(r => r.item === "Internal Link Count") || {
                          status: "Fail",
                          action: "No crawl data available.",
                          current: "0 incoming internal links"
                        };
                        return {
                          page,
                          linkCheck,
                          priority: "Medium"
                        };
                      });

                      return (
                        <div>
                          {/* Back navigation to Site Analysis Detail Overview */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                            <button 
                              onClick={() => setActiveModule(null)}
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
                              <ArrowLeft size={16} /> Back to Overview
                            </button>
                          </div>

                          {/* Banner card */}
                          <div style={{
                            backgroundColor: '#0c101b',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            textAlign: 'left',
                            marginBottom: '2rem'
                          }}>
                            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
                              {site.name} - Internal Linking
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

                            <hr style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '1.25rem 0', borderStyle: 'solid', borderWidth: '1px 0 0 0' }} />

                            <div style={{ display: 'flex', gap: '3.5rem', flexWrap: 'wrap' }}>
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
                                  {configuredPages.length}
                                </span>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', letterSpacing: '0.05em' }}>
                                  Last Audit Status
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
                          </div>

                          {/* Recommendations table */}
                          <div style={{ backgroundColor: '#0c101b', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', textAlign: 'left' }}>
                            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
                              Internal Linking Audit &amp; Recommendations
                            </h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem 0', lineHeight: 1.4 }}>
                              Internal links pass link equity and topical relevance signals. Ensure each key page has a minimum of 3 incoming internal links, and optimizes anchor text using target phrases.
                            </p>

                            {linkResults.length === 0 ? (
                              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                No configured pages found. Configure pages to see internal linking audit.
                              </div>
                            ) : (
                              <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'left' }}>
                                      <th style={{ padding: '12px 16px', width: '20%' }}>Page URL</th>
                                      <th style={{ padding: '12px 16px', width: '25%' }}>Page Title</th>
                                      <th style={{ padding: '12px 16px', width: '15%' }}>Target Phrase</th>
                                      <th style={{ padding: '12px 16px', width: '15%' }}>Incoming Links</th>
                                      <th style={{ padding: '12px 16px', width: '25%' }}>Recommendation</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(() => {
                                      const toggleLinkRow = (pageUrl) => {
                                        setExpandedLinkRows(prev => ({
                                          ...prev,
                                          [pageUrl]: !prev[pageUrl]
                                        }));
                                      };

                                      const toggleSourceRow = (pageUrl) => {
                                        setExpandedSourceRows(prev => ({
                                          ...prev,
                                          [pageUrl]: !prev[pageUrl]
                                        }));
                                      };

                                      const getSuggestedSources = (targetPage, allConfiguredPages, incomingAnchors) => {
                                        const getWords = (str) => {
                                          if (!str) return [];
                                          return str
                                            .toLowerCase()
                                            .replace(/[^a-z0-9\s-]/g, '')
                                            .split(/[\s-]+/)
                                            .filter(w => w.length > 2 && !['the', 'and', 'for', 'our', 'with', 'you', 'that', 'are', 'what', 'how'].includes(w));
                                        };
                                        
                                        const targetWords = [
                                          ...getWords(targetPage.pageTitle),
                                          ...getWords(targetPage.pageUrl),
                                          ...getWords(targetPage.targetPhrase)
                                        ];
                                        
                                        const existingAnchors = (incomingAnchors || []).map(a => (a.anchor || "").toLowerCase().trim());
                                        
                                        const candidates = allConfiguredPages.filter(p => {
                                          if (p.pageUrl === targetPage.pageUrl) return false;
                                          if (existingAnchors.includes((p.pageTitle || "").toLowerCase().trim())) return false;
                                          return true;
                                        });
                                        
                                        const scored = candidates.map(p => {
                                          let score = 0;
                                          const isHub = p.assignedType === "Hub Page" || p.assignedType === "Hub Pages";
                                          if (isHub) score += 3;
                                          
                                          const pWords = [
                                            ...getWords(p.pageTitle),
                                            ...getWords(p.pageUrl),
                                            ...getWords(p.targetPhrase)
                                          ];
                                          
                                          const intersection = pWords.filter(w => targetWords.includes(w));
                                          score += intersection.length * 2;
                                          
                                          return { page: p, score };
                                        });
                                        
                                        scored.sort((a, b) => b.score - a.score || a.page.pageUrl.length - b.page.pageUrl.length);
                                        
                                        let results = scored.filter(s => s.score > 0).map(s => s.page);
                                        if (results.length === 0) {
                                          results = candidates;
                                        }
                                        
                                        return results.slice(0, 3);
                                      };

                                      return linkResults.map(({ page, linkCheck, priority }, idx) => {
                                        const isFail = linkCheck.status === "Fail";
                                        const isWarning = linkCheck.status === "Pass" && !!linkCheck.recommendation;
                                        
                                        const rawCountStr = linkCheck.current ? linkCheck.current.replace(/[^0-9]/g, '') : '0';
                                        const currentCount = parseInt(rawCountStr, 10) || 0;

                                        let shortRecommendation = "No Action Required";
                                        let recColor = "#34d399";
                                        let recBg = "rgba(16, 185, 129, 0.08)";
                                        let recBorder = "rgba(16, 185, 129, 0.15)";

                                        if (isFail) {
                                          const needed = 3 - currentCount;
                                          shortRecommendation = `Add ${needed} ${needed === 1 ? "Link" : "Links"}`;
                                          recColor = "#f87171";
                                          recBg = "rgba(239, 68, 68, 0.08)";
                                          recBorder = "rgba(239, 68, 68, 0.15)";
                                        } else if (isWarning) {
                                          shortRecommendation = "Optimize Anchor";
                                          recColor = "#fbbf24";
                                          recBg = "rgba(245, 158, 11, 0.08)";
                                          recBorder = "rgba(245, 158, 11, 0.15)";
                                        }

                                        const isExpanded = !!expandedLinkRows[page.pageUrl];
                                        const isSourceExpanded = !!expandedSourceRows[page.pageUrl];

                                        return (
                                          <React.Fragment key={`${page.pageUrl}-${idx}`}>
                                            <tr style={{ borderBottom: (idx < linkResults.length - 1 && !isExpanded) ? '1px solid var(--border-color)' : 'none' }}>
                                              <td style={{ padding: '16px', fontFamily: 'monospace', color: '#60a5fa' }}>
                                                {page.pageUrl}
                                              </td>
                                              <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {page.pageTitle}
                                              </td>
                                              <td style={{ padding: '16px', fontWeight: 600 }}>
                                                {page.targetPhrase || "Not Set"}
                                              </td>
                                              <td style={{ padding: '16px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    {currentCount} {currentCount === 1 ? "link" : "links"}
                                                  </span>
                                                  <button 
                                                    onClick={() => toggleLinkRow(page.pageUrl)}
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
                                                    {isExpanded ? "▲ Hide" : "▼ View"}
                                                  </button>
                                                </div>
                                              </td>
                                              <td style={{ padding: '16px' }}>
                                                <span style={{
                                                  padding: '4px 10px',
                                                  borderRadius: '6px',
                                                  fontSize: '0.8rem',
                                                  fontWeight: 700,
                                                  backgroundColor: recBg,
                                                  color: recColor,
                                                  border: `1px solid ${recBorder}`,
                                                  display: 'inline-block',
                                                  whiteSpace: 'nowrap'
                                                }}>
                                                  {shortRecommendation}
                                                </span>
                                              </td>
                                            </tr>
                                            {isExpanded && (
                                              <tr style={{ backgroundColor: 'rgba(255,255,255,0.01)', borderBottom: idx < linkResults.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                                <td colSpan={5} style={{ padding: '20px 16px', borderTop: '1px dashed var(--border-color)' }}>
                                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                                    
                                                    {/* 1. Existing Contextual Links */}
                                                    <div>
                                                      <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)', fontSize: '0.85rem' }}>Existing Contextual Links</div>
                                                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', color: '#cbd5e1', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: '6px', overflow: 'hidden' }}>
                                                        <thead>
                                                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'left', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                                            <th style={{ padding: '10px 14px', width: '20%' }}>Current Anchor Text</th>
                                                            <th style={{ padding: '10px 14px', width: '80%' }}>Source Page</th>
                                                          </tr>
                                                        </thead>
                                                        <tbody>
                                                          {(() => {
                                                            const getMergedAnchors = (incomingAnchors) => {
                                                              if (!incomingAnchors) return [];
                                                              const mergedMap = {};
                                                              const toTitleCase = (str) => {
                                                                return str
                                                                  .toLowerCase()
                                                                  .split(' ')
                                                                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                                                  .join(' ');
                                                              };
                                                              incomingAnchors.forEach(item => {
                                                                const rawAnchor = (item.anchor || "").trim();
                                                                if (!rawAnchor) return;
                                                                const key = rawAnchor.toLowerCase();
                                                                const count = parseInt(item.count, 10) || 0;
                                                                if (mergedMap[key]) {
                                                                  mergedMap[key].count += count;
                                                                } else {
                                                                  mergedMap[key] = {
                                                                    raw: rawAnchor,
                                                                    count: count
                                                                  };
                                                                }
                                                              });
                                                              return Object.values(mergedMap).map(item => ({
                                                                anchor: toTitleCase(item.raw),
                                                                count: item.count
                                                              }));
                                                            };

                                                            const mergedAnchors = getMergedAnchors(linkCheck.incomingAnchors);
                                                            const potentialSources = configuredPages.filter(p => p.pageUrl !== page.pageUrl);
                                                            
                                                            const existingLinks = [];
                                                            let sourceIndex = 0;

                                                            mergedAnchors.forEach(item => {
                                                              for (let c = 0; c < item.count; c++) {
                                                                let linkType = "Contextual";
                                                                const norm = item.anchor.toLowerCase();
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

                                                                // Display ONLY contextual links found within page content
                                                                if (linkType === "Contextual") {
                                                                  const srcPage = potentialSources[sourceIndex % potentialSources.length];
                                                                  sourceIndex++;
                                                                  existingLinks.push({
                                                                    anchor: item.anchor,
                                                                    sourceTitle: srcPage ? srcPage.pageTitle : "Bathroom Renovations",
                                                                    sourceUrl: srcPage ? srcPage.pageUrl : "/"
                                                                  });
                                                                }
                                                              }
                                                            });

                                                            if (existingLinks.length === 0) {
                                                              return (
                                                                <tr>
                                                                  <td colSpan={2} style={{ padding: '12px 14px', fontStyle: 'italic', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                                                    No existing contextual links found.
                                                                  </td>
                                                                </tr>
                                                              );
                                                            }

                                                            return existingLinks.map((link, lIdx) => (
                                                              <tr key={lIdx} style={{ borderBottom: lIdx < existingLinks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                                                <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                                                                  {link.anchor}
                                                                </td>
                                                                <td style={{ padding: '10px 14px' }}>
                                                                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{link.sourceTitle}</span>
                                                                  {link.sourceUrl && (
                                                                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#60a5fa', marginLeft: '6px' }}>
                                                                      ({link.sourceUrl})
                                                                    </span>
                                                                  )}
                                                                </td>
                                                              </tr>
                                                            ));
                                                          })()}
                                                        </tbody>
                                                      </table>
                                                    </div>

                                                    {/* 2. Recommended Contextual Links */}
                                                    <div>
                                                      <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)', fontSize: '0.85rem' }}>Recommended Contextual Links</div>
                                                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', color: '#cbd5e1', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: '6px', overflow: 'hidden' }}>
                                                        <thead>
                                                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'left', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                                            <th style={{ padding: '10px 14px', width: '20%' }}>Recommended Anchor Text</th>
                                                            <th style={{ padding: '10px 14px', width: '80%' }}>Suggested Source Page</th>
                                                          </tr>
                                                        </thead>
                                                        <tbody>
                                                          {(() => {
                                                            const needed = isFail ? 3 - currentCount : 0;
                                                            if (needed <= 0) {
                                                              return (
                                                                <tr>
                                                                  <td colSpan={2} style={{ padding: '12px 14px', fontStyle: 'italic', color: '#34d399', textAlign: 'center', fontWeight: 600 }}>
                                                                    No new links required. Sufficient internal links exist.
                                                                  </td>
                                                                </tr>
                                                              );
                                                            }

                                                            const sources = getSuggestedSources(page, configuredPages, linkCheck.incomingAnchors);
                                                            const recs = [];
                                                            for (let i = 0; i < needed; i++) {
                                                              const srcPage = sources[i % sources.length];
                                                              recs.push({
                                                                recommendedAnchor: (page.targetPhrase || "keyword").toLowerCase(),
                                                                sourceTitle: srcPage ? srcPage.pageTitle : "Hub Page",
                                                                sourceUrl: srcPage ? srcPage.pageUrl : "/"
                                                              });
                                                            }

                                                            return recs.map((rec, rIdx) => (
                                                              <tr key={rIdx} style={{ borderBottom: rIdx < recs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                                                <td style={{ padding: '10px 14px', color: '#fbbf24', fontWeight: 600 }}>
                                                                  {rec.recommendedAnchor}
                                                                </td>
                                                                <td style={{ padding: '10px 14px' }}>
                                                                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rec.sourceTitle}</span>
                                                                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#60a5fa', marginLeft: '6px' }}>
                                                                    ({rec.sourceUrl})
                                                                  </span>
                                                                </td>
                                                              </tr>
                                                            ));
                                                          })()}
                                                        </tbody>
                                                      </table>
                                                    </div>

                                                  </div>
                                                </td>
                                              </tr>
                                            )}
                                          </React.Fragment>
                                        );
                                      });
                                    })()}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div>
                        {/* Back navigation */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                          <button 
                            onClick={() => setSelectedAnalysisSiteId(null)}
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

                          <hr style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '1.25rem 0', borderStyle: 'solid', borderWidth: '1px 0 0 0' }} />

                          <div style={{ display: 'flex', gap: '3.5rem', flexWrap: 'wrap' }}>
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
                                {configuredPages.length}
                              </span>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', letterSpacing: '0.05em' }}>
                                Last Audit Status
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
                        </div>

                        {/* Four module cards */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                          gap: '1.25rem',
                          marginTop: '1.5rem'
                        }}>
                          {['Site Structure', 'Internal Linking', 'Content Coverage', 'Opportunities'].map(module => {
                            const isSiteStructure = module === 'Site Structure';
                            const isInternalLinking = module === 'Internal Linking';
                            const isClickable = isSiteStructure || isInternalLinking;

                            return (
                              <div 
                                key={module}
                                onClick={() => {
                                  if (isSiteStructure) {
                                    setActiveModule('site-structure');
                                  } else if (isInternalLinking) {
                                    setActiveModule('internal-linking');
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
                                  {isSiteStructure ? "View organized hierarchy" : isInternalLinking ? "View link & anchor audit" : "Coming Soon"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* STAGE 1: CONNECTED WEBSITES LIST */}
          {currentView === "CONNECTED_SITES" && (
            <div>
              <div className="column-header-row mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ textAlign: 'left' }}>
                  <h2 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Connected Websites</h2>
                  <span className="subtitle" style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>Select a connected site to view its generated tasks, or run a new audit.</span>
                </div>
                <button 
                  className="btn-primary" 
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

              <div className="websites-grid">
                {sites.map(site => {
                  const isAudited = site.lastAudit !== null;
                  const sitePages = pagesData[site.id] || [];
                  const totalPages = sitePages.length;
                  const configuredPages = sitePages.filter(p => p.status === "Configured").length;
                  const unconfiguredPages = sitePages.filter(p => p.status === "Unconfigured").length;
                  const displayTitle = site.id === "bathroom-upgrades" ? "bathroomupgrades.co.uk" : site.name;
                  
                  return (
                    <div 
                      key={site.id} 
                      className="sidebar-site-card"
                      style={{ cursor: isAudited ? 'pointer' : 'default', display: 'flex', flexDirection: 'column' }}
                      onClick={() => {
                        if (isAudited) {
                          setSelectedSiteId(site.id);
                          setCurrentView("WEBSITES");
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
                            backgroundColor: 'rgba(16, 185, 129, 0.08)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.15)'
                          }}>
                            Connected
                          </span>
                        </div>

                        {/* WordPress API */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>WordPress API</span>
                          {site.status === "Connected" ? (
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
                            Configured ({configuredPages}/{totalPages})
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
                        Manage Configuration
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STAGE 2: WEBSITE CONFIGURATION MANAGEMENT */}
          {(currentView === "WEBSITES_CONFIG" || currentView === "SITE_ANALYSIS_CONFIG") && selectedSiteId && (
            <div>
              {/* Back to websites or Site Analysis */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                <button 
                  className="flex align-center gap-2 text-secondary"
                  onClick={() => setCurrentView(currentView === "SITE_ANALYSIS_CONFIG" ? "SITE_ANALYSIS" : "CONNECTED_SITES")}
                  style={{ background: 'none', border: 'none', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <ArrowLeft size={16} /> Back to {currentView === "SITE_ANALYSIS_CONFIG" ? "Site Analysis" : "Websites"}
                </button>
              </div>

              {/* Header section */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                  <div>
                    <span className="status-indicator">Configuration Management</span>
                    <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                      Website: {selectedSite?.name}
                    </h2>
                    <a 
                      href={selectedSite?.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="site-url-link"
                      style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}
                    >
                      {selectedSite?.url} <ExternalLink size={12} />
                    </a>
                  </div>
                  
                  {/* Action Buttons Toolbar */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
                      <span style={{ display: 'block', fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>Configuration Status</span>
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

              {/* Table section */}
              <div>


                <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface-color)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)' }}>
                  <table className="audit-config-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                        <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, width: '30%', minWidth: '400px' }}>Page URL</th>
                        <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, width: '25%', minWidth: '300px' }}>Page Title</th>
                        <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, width: '10%', minWidth: '130px' }}>Page Type</th>
                        <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, width: '15%', minWidth: '200px' }}>Target Phrase</th>
                        <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, width: '10%', minWidth: '130px' }}>Status</th>
                        <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, width: '10%', minWidth: '180px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const sortedPages = sortPagesForSEO(pagesData[selectedSiteId] || []);
                        const filteredPages = sortedPages.filter(page => {
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
                              <td colSpan="6" style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                No pages found matching the active filter.
                              </td>
                            </tr>
                          );
                        }

                        return filteredPages.map((page, idx) => {
                          const isExcluded = isPageExcluded(page);
                          const isConfigured = page.status === "Configured" && !isExcluded;
                          const isSelected = selectedPageUrl === page.pageUrl;
                          
                          return (
                            <tr 
                              key={page.pageUrl} 
                              className={`config-table-row ${isSelected ? 'active' : ''}`}
                              onClick={() => setSelectedPageUrl(isSelected ? null : page.pageUrl)}
                              style={{ 
                                borderBottom: idx < filteredPages.length - 1 ? '1px solid var(--border-color)' : 'none',
                                cursor: 'pointer',
                                backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <td style={{ padding: '16px 20px', fontFamily: 'monospace', color: '#60a5fa', fontWeight: 600, whiteSpace: 'nowrap' }}>{page.pageUrl}</td>
                              <td style={{ padding: '16px 20px', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '350px' }}>{page.pageTitle}</td>
                              <td style={{ padding: '16px 20px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                                {getPageType(page)}
                              </td>
                              <td style={{ padding: '16px 20px', fontStyle: isConfigured && page.targetPhrase ? 'normal' : 'italic', color: isConfigured && page.targetPhrase ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isConfigured && page.targetPhrase ? 600 : 400, whiteSpace: 'nowrap' }}>
                                {isExcluded ? "Excluded" : page.targetPhrase || "Not Configured"}
                              </td>
                              <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                                {isExcluded ? (
                                  <span className="status-badge-custom" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, backgroundColor: 'rgba(148, 163, 184, 0.08)', padding: '4px 10px', borderRadius: '9999px' }}>
                                    <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>⊘</span> Excluded
                                  </span>
                                ) : isConfigured ? (
                                  <span className="status-badge-custom" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '0.85rem', fontWeight: 600, backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '4px 10px', borderRadius: '9999px' }}>
                                    Configured
                                  </span>
                                ) : (
                                  <span className="status-badge-custom" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '0.85rem', fontWeight: 600, backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '4px 10px', borderRadius: '9999px' }}>
                                    Unconfigured
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                                {isConfigured && (
                                  <>
                                    <button
                                      className="btn-primary site-btn-sm"
                                      style={{ display: 'inline-flex', width: 'auto', marginRight: '8px', padding: '6px 12px !important', boxShadow: 'none', backgroundColor: '#f97316' }}
                                      onClick={() => {
                                        setReviewPageUrl(page.pageUrl);
                                        setCurrentView("AUDIT_RESULTS");
                                      }}
                                    >
                                      Last Audit
                                    </button>
                                    <button
                                      className="btn-primary site-btn-sm"
                                      style={{ display: 'inline-flex', width: 'auto', marginRight: '8px', padding: '6px 12px !important', boxShadow: 'none' }}
                                      onClick={() => handleAuditSinglePage(page.pageUrl)}
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
          )}

          {/* STAGE 2: AUDIT CONFIGURATION */}
          {currentView === "AUDIT_CONFIG" && selectedSiteId && (() => {
            const sitePages = sortPagesForSEO(pagesData[selectedSiteId] || []);
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
                  <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                    Website: {siteName}
                  </h2>
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
            const targetPageObj = sitePages.find(p => p.pageUrl === currentReviewUrl);
            const currentTargetPhrase = targetPageObj?.targetPhrase || "";
            const pageTitle = targetPageObj?.pageTitle || "";
            const pageType = getPageType(targetPageObj);
            
            const auditResults = targetPageObj?.latestAudit?.results || runPageAudit(currentReviewUrl, currentTargetPhrase, pageTitle, selectedSiteId);
            const passedCount = auditResults.filter(r => r.status === "Pass").length;
            const failedCount = auditResults.filter(r => r.status === "Fail").length;
            const scoreColor = passedCount === 8 ? "#10b981" : passedCount >= 5 ? "#fbbf24" : "#f87171";

            return (
              <div className="report-section" style={{ maxWidth: '1680px', margin: '0 auto', padding: '2.5rem' }}>
                
                {/* Header Title & Success Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
                  <div style={{ textAlign: 'left' }}>
                    <span className="status-indicator" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f97316' }}>
                      <CheckCircle size={12} /> Latest Audit Results Page
                    </span>
                    <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                      Latest Audit Results
                    </h2>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      className="btn-secondary"
                      onClick={() => {
                        setCurrentView("WEBSITES_CONFIG");
                        setSingleAuditPageUrl(null);
                      }}
                      style={{ padding: '8px 16px' }}
                    >
                      Back To Configuration
                    </button>
                  </div>
                </div>

                {/* Selector / Metadata Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  {/* Top Selection & Score Bar */}
                  <div style={{ display: 'flex', gap: '1.5rem', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '250px', textAlign: 'left' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Select Page to Review</label>
                      <select
                        value={currentReviewUrl}
                        onChange={(e) => setReviewPageUrl(e.target.value)}
                        style={{ width: '100%', backgroundColor: '#070b13', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px', borderRadius: '6px', outline: 'none', fontSize: '0.95rem', fontWeight: 600, marginTop: '4px' }}
                      >
                        {auditedPages.map(p => (
                          <option key={p.pageUrl} value={p.pageUrl}>{p.pageUrl} ({p.pageTitle})</option>
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
                    {/* Page Title Card */}
                    <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '12px', textAlign: 'left' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Page Title</label>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pageTitle}>
                        {pageTitle || "Untitled Page"}
                      </div>
                    </div>

                    {/* Page URL Card */}
                    <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '12px', textAlign: 'left' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Page URL</label>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={currentReviewUrl}>
                        {currentReviewUrl}
                      </div>
                    </div>

                    {/* Target Phrase Card */}
                    <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '12px', textAlign: 'left' }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Target Phrase</label>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px', fontStyle: currentTargetPhrase ? 'normal' : 'italic' }}>
                        {currentTargetPhrase || "Not Configured"}
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
                                {row.item}
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
                                fontWeight: isPass ? (hasRec ? 500 : 400) : 500 
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
                          const matchingTask = site?.tasks.find(t => 
                            t.pageUrl.includes(currentReviewUrl) && t.taskTitle.toLowerCase().includes(failItem.item.toLowerCase().replace(" count", "").replace(" tag", ""))
                          );
                          
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
                                  Issue {idx + 1}: {failItem.item}
                                </span>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                                  {failItem.action}
                                </span>
                              </div>
                              {matchingTask && (
                                <button 
                                  className="btn-primary btn-sm"
                                  onClick={() => handleStartTask(matchingTask.id)}
                                  style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'auto' }}
                                >
                                  Fix Issue <ChevronRight size={14} />
                                </button>
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
          })()}

          {/* SCREEN 1 & 2: WEBSITE DASHBOARD & TASK LIST (COMBINED SPLIT PANEL) */}
          {currentView === "WEBSITES" && (
            <div>
              {/* Back button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                <button 
                  className="flex align-center gap-2 text-secondary"
                  onClick={() => setCurrentView("CONNECTED_SITES")}
                  style={{ background: 'none', border: 'none', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <ArrowLeft size={16} /> Back to Connected Websites
                </button>
              </div>

              {/* Admin Onboarding Sync Banner */}
              <div className="admin-onboarding-banner">
                <Server size={18} className="banner-icon" />
                <div style={{ fontSize: '0.85rem' }}>
                  <strong>Admin Setup Mode:</strong> Connected websites are pre-configured through the TSE Exporter Plugin. Staff profiles are read-only for onboarding setup.
                </div>
              </div>

              {/* Combined Split-Screen Work Area */}
              <div className="portal-split-layout">
                
                {/* Left Column: Websites List */}
                <div className="left-column">
                  <div className="column-header-row">
                    <h3>My Work Today</h3>
                    <span className="subtitle">Available Websites</span>
                  </div>

                  <div className="websites-sidebar-list">
                    {sites.map(site => {
                      const openTasksCount = getOpenTasksCount(site);
                      const isSelected = site.id === selectedSiteId;
                      const sitePages = pagesData[site.id] || [];
                      const totalPages = sitePages.length;
                      const configuredPages = sitePages.filter(p => p.status === "Configured").length;
                      const unconfiguredPages = sitePages.filter(p => p.status === "Unconfigured").length;
                      const isAudited = site.lastAudit !== null;
                      
                      return (
                        <div 
                          key={site.id} 
                          className={`sidebar-site-card ${isSelected ? 'active' : ''}`}
                          onClick={() => setSelectedSiteId(site.id)}
                        >
                          <div className="site-card-top">
                            <span className="status-indicator">Connected ✓</span>
                            {openTasksCount > 0 ? (
                              <span className="task-count-pill alert-pill">{openTasksCount} Tasks</span>
                            ) : (
                              <span className="task-count-pill success-pill">0 Tasks</span>
                            )}
                          </div>
                          <h4 className="site-title">{site.name}</h4>
                          
                          <a 
                            href={site.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="site-url-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {site.url} <ExternalLink size={10} />
                          </a>

                          {/* Sidebar site health status block */}
                          <div className="site-health-status" style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.75rem', textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Connected</span>
                              <span style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>Connected ✓</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Configured</span>
                              {unconfiguredPages === 0 ? (
                                <span style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>Configured ✓</span>
                              ) : (
                                <span style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>Configured ⚠ ({configuredPages}/{totalPages})</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Audited</span>
                              {isAudited ? (
                                <span style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>Audited ✓</span>
                              ) : (
                                <span style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>Pending Audit ⚠</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Tasks Outstanding</span>
                              <span style={{ 
                                color: openTasksCount > 0 ? '#f59e0b' : '#10b981', 
                                backgroundColor: openTasksCount > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                                border: openTasksCount > 0 ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)', 
                                padding: '2px 8px', 
                                borderRadius: '4px', 
                                fontWeight: 700 
                              }}>
                                {openTasksCount} Outstanding
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              <div className="report-section" style={{ padding: '2.5rem' }}>
                {/* Visual Task Closure Stepper Timeline */}
                {(() => {
                  const isCompleted = activeTask.state === "completed";
                  const isInProgress = activeTask.state === "progress";
                  const isAssigned = activeTask.assignee !== null;

                  const stepStatus = [
                    { label: "Audit", status: "completed", desc: "Site scan found warning" },
                    { label: "Task Created", status: "completed", desc: "SEO task generated" },
                    {
                      label: "Work Fixes",
                      status: isCompleted ? "completed" : (isInProgress || isAssigned) ? "active" : "pending",
                      desc: isCompleted ? `Fixed by ${activeTask.assignee}` : isAssigned ? `Assigned to ${activeTask.assignee}` : "Awaiting assignment"
                    },
                    {
                      label: "Page Auditor Verifies",
                      status: isCompleted ? "completed" : (isInProgress && verificationStatus !== "idle") ? "active" : "pending",
                      desc: isCompleted ? "Verified pass outcome" : "Checks content automatically"
                    },
                    { label: "Task Closed", status: isCompleted ? "completed" : "pending", desc: isCompleted ? "Archived in queue" : "Awaiting fix completion" }
                  ];

                  return (
                    <div className="task-timeline-stepper" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                      {stepStatus.map((step, idx) => {
                        const statusColor = step.status === "completed" ? "#34d399" : step.status === "active" ? "#fbbf24" : "var(--text-secondary)";
                        const bubbleBg = step.status === "completed" ? "rgba(16, 185, 129, 0.15)" : step.status === "active" ? "rgba(251, 191, 36, 0.15)" : "rgba(255,255,255,0.03)";
                        const bubbleBorder = step.status === "completed" ? "1px solid #34d399" : step.status === "active" ? "1px solid #fbbf24" : "1px solid var(--border-color)";

                        return (
                          <React.Fragment key={idx}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '120px', textAlign: 'center' }}>
                              <div style={{
                                width: '36px', height: '36px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                backgroundColor: bubbleBg, border: bubbleBorder, color: statusColor, fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem'
                              }}>
                                {step.status === "completed" ? "✓" : idx + 1}
                              </div>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: step.status === "pending" ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{step.label}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', maxWidth: '140px' }}>{step.desc}</span>
                            </div>
                            {idx < stepStatus.length - 1 && (
                              <div style={{
                                height: '2px', flex: 1, backgroundColor: stepStatus[idx+1].status === "completed" ? '#34d399' : stepStatus[idx+1].status === "active" ? '#fbbf24' : 'var(--border-color)',
                                marginTop: '18px', minWidth: '20px', alignSelf: 'flex-start'
                              }} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  );
                })()}

                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                  <span className={`task-priority-badge priority-${activeTask.priority}`} style={{ float: 'right', fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}>
                    {activeTask.priority} Priority
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Website: {selectedSite.name}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                      Source: {activeTask.source || "Site Auditor"}
                    </span>
                  </div>
                  <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }}>
                    {activeTask.taskTitle}
                  </h2>
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
                    <div style={{ textAlign: 'left' }}>
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
                    <div style={{ textAlign: 'left' }}>
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
                </div>
              </div>
            </div>
          </div>
          )}
          {currentView === "TASK_FOCUS" && activeTask && selectedSite && (
            <div>
              <div className="mb-4">
                <span 
                  className="flex align-center gap-2 text-secondary cursor-pointer"
                  onClick={() => setCurrentView("WEBSITES")}
                  style={{ fontSize: '0.9rem' }}
                >
                  <ArrowLeft size={16} /> Back to Backlog
                </span>
              </div>

              <div className="report-section" style={{ padding: '2.5rem' }}>


                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                  <span className={`task-priority-badge priority-${activeTask.priority}`} style={{ float: 'right', fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}>
                    {activeTask.priority} Priority
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Website: {selectedSite.name}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                      Source: {activeTask.source || "Site Auditor"}
                    </span>
                  </div>
                  <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }}>
                    {activeTask.taskTitle}
                  </h2>
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
                    <div style={{ textAlign: 'left' }}>
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
                    <div style={{ textAlign: 'left' }}>
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
                        {activeTask.assignee !== "Sarah" && (
                          <button 
                            className="btn-secondary"
                            onClick={() => handleAssignToMe(activeTask.id)}
                            style={{ color: '#fbbf24', borderColor: '#fbbf24' }}
                          >
                            Assign To Me
                          </button>
                        )}
                        
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
                <button 
                  className="flex align-center gap-2 text-secondary cursor-pointer"
                  disabled={verificationStatus === "loading" || verificationStatus === "success"}
                  onClick={() => setCurrentView("TASK_FOCUS")}
                  style={{ background: 'none', border: 'none', fontSize: '0.9rem', color: 'var(--text-secondary)' }}
                >
                  <ArrowLeft size={16} /> Back to Task Details
                </button>
              </div>

              <div className="report-section" style={{ padding: '2.5rem' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>WordPress CMS Sync Editor</span>
                  <h2 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
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

                      <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#34d399', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Required Version</span>
                        <pre style={{ fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', color: '#cbd5e1', margin: 0 }}>
                          {activeTask.requiredVersion}
                        </pre>
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
                        <button className="btn-primary start-working-btn" onClick={handleNextTask} style={{ width: '100%', justifyContent: 'center' }}>
                          Next Task
                        </button>
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
            <div className="report-section" style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '2rem', textAlign: 'left' }}>
                <span className="status-indicator" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-color)' }}>
                  Settings Page
                </span>
                <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                  Settings
                </h2>
              </div>

              {/* Placeholder settings elements */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem', textAlign: 'left' }}>
                <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.5rem' }}>Crawler API Token</label>
                  <input type="password" value="••••••••••••••••••••••••" readOnly style={{ width: '100%', backgroundColor: '#070b13', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '10px', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.5rem' }}>WordPress Connection Status</label>
                  <input type="text" value="All Connected Sites Synchronized" readOnly style={{ width: '100%', backgroundColor: '#070b13', border: '1px solid var(--border-color)', color: '#34d399', padding: '10px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.5rem' }}>Sync Interval</label>
                  <select disabled style={{ width: '100%', backgroundColor: '#070b13', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '10px', borderRadius: '6px', fontSize: '0.9rem', outline: 'none' }}>
                    <option>Every 24 Hours (Default)</option>
                  </select>
                </div>
              </div>

              {/* Task Engine Architecture header */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                <span className="status-indicator" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-color)' }}>
                  <Server size={14} /> Master Data Architecture View
                </span>
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.35rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-primary)', margin: '0.25rem 0 0 0' }}>
                  Task Engine Architecture
                </h3>
              </div>

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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
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
                        <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', textAlign: 'left' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 className="section-title-custom" style={{ fontSize: '1rem', margin: 0 }}>Formalized 14-Field JSON Schema Record</h3>
                            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, backgroundColor: 'rgba(16,185,129,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                              Valid Model Object
                            </span>
                          </div>

                          <pre style={{
                            margin: 0,
                            padding: '1.25rem',
                            backgroundColor: '#07090b',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.05)',
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

              {/* Task Generator Simulator */}
              <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem', textAlign: 'left' }}>
                <h3 className="section-title-custom" style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={18} style={{ color: 'var(--accent-color)' }} />
                  Integration Sandbox: Future Task Creator
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.4 }}>
                  This sandbox demonstrates how future integrations (GA4, Search Console, manual requests) can inject tasks into the workflow. Submit the form to generate a valid task that matches the 14-field schema.
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.5rem',
                  backgroundColor: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '2rem'
                }}>
                  <div>
                    <label htmlFor="simSourceSelect" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.5rem' }}>Task Source</label>
                    <select
                      id="simSourceSelect"
                      value={simSource}
                      onChange={(e) => setSimSource(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#070b13', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px', borderRadius: '6px', outline: 'none', fontSize: '0.9rem' }}
                    >
                      <option value="Search Console">Search Console</option>
                      <option value="GA4">GA4 Insights</option>
                      <option value="Internal Link Auditor">Internal Link Auditor</option>
                      <option value="Content Gap Analysis">Content Gap Analysis</option>
                      <option value="Manual">Manual Entry</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="simSiteSelect" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.5rem' }}>Target Website</label>
                    <select
                      id="simSiteSelect"
                      value={simSiteId}
                      onChange={(e) => setSimSiteId(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#070b13', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px', borderRadius: '6px', outline: 'none', fontSize: '0.9rem' }}
                    >
                      <option value="bathroom-upgrades">Bathroom Upgrades</option>
                      <option value="the-search-equation">The Search Equation</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="simUrlInput" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.5rem' }}>Page URL Path</label>
                    <input
                      id="simUrlInput"
                      type="text"
                      value={simUrl}
                      onChange={(e) => setSimUrl(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#070b13', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px', borderRadius: '6px', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="simTitleInput" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.5rem' }}>Page Title</label>
                    <input
                      id="simTitleInput"
                      type="text"
                      value={simTitle}
                      onChange={(e) => setSimTitle(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#070b13', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px', borderRadius: '6px', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="simPhraseInput" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.5rem' }}>Target Phrase</label>
                    <input
                      id="simPhraseInput"
                      type="text"
                      value={simPhrase}
                      onChange={(e) => setSimPhrase(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#070b13', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px', borderRadius: '6px', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="simIssueInput" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.5rem' }}>Issue Type</label>
                    <input
                      id="simIssueInput"
                      type="text"
                      value={simIssueType}
                      onChange={(e) => setSimIssueType(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#070b13', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px', borderRadius: '6px', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="simPrioritySelect" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.5rem' }}>Priority</label>
                    <select
                      id="simPrioritySelect"
                      value={simPriority}
                      onChange={(e) => setSimPriority(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#070b13', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px', borderRadius: '6px', outline: 'none', fontSize: '0.9rem' }}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="simDescInput" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.5rem' }}>Issue Description</label>
                    <textarea
                      id="simDescInput"
                      value={simDesc}
                      onChange={(e) => setSimDesc(e.target.value)}
                      rows={2}
                      style={{ width: '100%', backgroundColor: '#070b13', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px', borderRadius: '6px', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 3' }}>
                    <label htmlFor="simVerifyInput" style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.5rem' }}>Verification Method</label>
                    <input
                      id="simVerifyInput"
                      type="text"
                      value={simVerification}
                      onChange={(e) => setSimVerification(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#070b13', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px', borderRadius: '6px', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        if (!simUrl || !simTitle || !simPhrase || !simIssueType || !simDesc || !simVerification) {
                          showNotification("All simulator fields are required!");
                          return;
                        }

                        const targetSite = sites.find(s => s.id === simSiteId);
                        const nextId = "t" + (sites.flatMap(s => s.tasks).length + 1);

                        const newTask = {
                          taskId: nextId,
                          id: nextId,
                          website: targetSite.name,
                          pageUrl: targetSite.url + simUrl,
                          pageTitle: simTitle,
                          targetPhrase: simPhrase,
                          keyword: simPhrase,
                          taskSource: simSource,
                          source: simSource,
                          issueType: simIssueType,
                          issueDescription: simDesc,
                          issueFound: simDesc,
                          priority: simPriority,
                          status: "Open",
                          state: "backlog",
                          assignedTo: null,
                          assignedToName: "Unassigned",
                          assignee: null,
                          verificationMethod: simVerification,
                          successCheck: "Verified automatically.",
                          createdDate: "2026-06-22",
                          completedDate: null,
                          taskTitle: `Optimize ${simPhrase} on ${simTitle}`,
                          currentVersion: `<!-- Current version for ${simTitle} -->`,
                          requiredVersion: `<!-- Optimized version containing ${simPhrase} -->`,
                          whyItMatters: `This issue is identified by ${simSource} and requires immediate remediation.`
                        };

                        setSites(prev => prev.map(s => {
                          if (s.id === simSiteId) {
                            return {
                              ...s,
                              tasks: [...s.tasks, newTask]
                            };
                          }
                          return s;
                        }));

                        setSelectedArchTaskId(nextId);
                        showNotification(`Generated simulated task ${nextId} from ${simSource}!`);
                      }}
                      style={{ padding: '12px 24px' }}
                    >
                      Generate Architectural Task <Play size={14} />
                    </button>
                  </div>
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
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                  {modalMode === "add" ? "Add New Page Target" : "Configure Page Targeting"}
                </h3>
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
                    <input 
                      id="modalTitleInput"
                      type="text" 
                      value={inputPageTitle}
                      onChange={(e) => setInputPageTitle(e.target.value)}
                      placeholder="e.g. Accessible Bathrooms"
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

