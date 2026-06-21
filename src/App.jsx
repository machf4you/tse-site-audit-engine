import React, { useState, useEffect } from 'react';
import { 
  Activity, Search, Globe, Play, CheckCircle, RefreshCw, 
  FileText, List, ArrowLeft, ExternalLink, Clock, User, Check, Server, CheckSquare, AlertCircle
} from 'lucide-react';

const INITIAL_SITES = [
  {
    id: "bathroom-upgrades",
    name: "Bathroom Upgrades",
    url: "https://www.bathroomupgrades.co.uk",
    targetPhrase: "bathroom renovations",
    status: "Connected",
    score: 85,
    change: 2, // Score change: +2
    lastAudit: "2026-06-20",
    pages: [
      { id: "bu-p1", url: "/bathroom-renovations/", type: "landing", typeLabel: "Landing Page", score: 85, target: "bathroom renovations", fit: "strong", fitLabel: "Strong Fit", fitScore: 85 },
      { id: "bu-p2", url: "/", type: "landing", typeLabel: "Landing Page", score: 90, target: "bathroom fitting london", fit: "strong", fitLabel: "Strong Fit", fitScore: 92 },
      { id: "bu-p3", url: "/bathroom-ideas/", type: "hub", typeLabel: "Hub Page", score: 60, target: "bathroom design ideas", fit: "moderate", fitLabel: "Moderate Fit", fitScore: 68 },
      { id: "bu-p4", url: "/cheap-bathroom-suites/", type: "category", typeLabel: "Category Page", score: 78, target: "cheap bathroom suites", fit: "strong", fitLabel: "Strong Fit", fitScore: 82 }
    ],
    tasks: [
      { id: "t1", pageId: "bu-p4", pageUrl: "/cheap-bathroom-suites/", name: "Change Category Footer Anchor Text", priority: "low", state: "backlog", assignedTo: "Sarah (SEO Assistant)", description: "Change generic anchor text 'Products' in footer to 'Cheap Bathroom Suites' to improve localized category anchor authority.", fixApplied: false, checklistText: "Generic footer link 'Products' replaced with 'Cheap Bathroom Suites'", initialCode: '<a href="/cheap-bathroom-suites/">Products</a>', fixedCode: '<a href="/cheap-bathroom-suites/">Cheap Bathroom Suites</a>' },
      { id: "t2", pageId: "bu-p2", pageUrl: "/", name: "Include city name in Meta Title", priority: "medium", state: "progress", assignedTo: "Sarah (SEO Assistant)", description: "Add 'London' to homepage title to improve geo-targeted local search impressions.", fixApplied: false, checklistText: "City name 'London' added to homepage title metadata", initialCode: '<title>Bathroom Fitting & Installation Experts</title>', fixedCode: '<title>Bathroom Fitting & Installation Experts in London</title>' },
      { id: "t3", pageId: "bu-p3", pageUrl: "/bathroom-ideas/", name: "Add target phrase to H1 heading", priority: "high", state: "backlog", assignedTo: "Sarah (SEO Assistant)", description: "The main page title is 'Ideas'. Change it to 'Bathroom Design Ideas & Gallery' to include the target phrase.", fixApplied: false, checklistText: "H1 heading matches target phrase 'bathroom design ideas'", initialCode: '<h1>Ideas & Inspiration</h1>', fixedCode: '<h1>Bathroom Design Ideas & Gallery</h1>' },
      { id: "t4", pageId: "bu-p1", pageUrl: "/bathroom-renovations/", name: "Add FAQ schema block", priority: "low", state: "backlog", assignedTo: "Sarah (SEO Assistant)", description: "FAQ section exists in copy but has no structured JSON-LD data. Generate and add FAQ schema.", fixApplied: false, checklistText: "JSON-LD FAQPage schema successfully deployed", initialCode: '<!-- No Schema Found -->', fixedCode: '<script type="application/ld+json">{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": [...]\n}</script>' }
    ]
  },
  {
    id: "the-search-equation",
    name: "The Search Equation",
    url: "https://page-auditor.thesearchequation.com",
    targetPhrase: "seo consultancy",
    status: "Connected",
    score: 78,
    change: 4, // Score change: +4
    lastAudit: "2026-06-21",
    pages: [
      { id: "tse-p1", url: "/seo-consultancy/", type: "landing", typeLabel: "Landing Page", score: 82, target: "seo consultancy", fit: "strong", fitLabel: "Strong Fit", fitScore: 84 },
      { id: "tse-p2", url: "/local-seo/", type: "hub", typeLabel: "Hub Page", score: 68, target: "local seo services", fit: "moderate", fitLabel: "Moderate Fit", fitScore: 70 },
      { id: "tse-p3", url: "/case-studies/", type: "category", typeLabel: "Category Page", score: 70, target: "seo case studies", fit: "moderate", fitLabel: "Moderate Fit", fitScore: 72 }
    ],
    tasks: [
      { id: "t5", pageId: "tse-p1", pageUrl: "/seo-consultancy/", name: "Add outbound links to authority sources", priority: "low", state: "backlog", assignedTo: "Sarah (SEO Assistant)", description: "Add outbound links to authoritative Google search console documentation.", fixApplied: false, checklistText: "Authority outbound link verified in text", initialCode: '<p>Our agency aligns with search engine guidelines.</p>', fixedCode: '<p>Our agency aligns with the <a href="https://developers.google.com/search">Google Search Guidelines</a>.</p>' },
      { id: "t6", pageId: "tse-p3", pageUrl: "/case-studies/", name: "Add missing Service Schema", priority: "medium", state: "backlog", assignedTo: "Sarah (SEO Assistant)", description: "Deploy schema markup describing local consulting services.", fixApplied: false, checklistText: "Schema.org Service type found in header", initialCode: '<!-- No Schema Found -->', fixedCode: '<script type="application/ld+json">{\n  "@context": "https://schema.org",\n  "@type": "Service",\n  "name": "SEO Consulting Services"\n}</script>' },
      { id: "t7", pageId: "tse-p2", pageUrl: "/local-seo/", name: "Split Hub page into supporting landing pages", priority: "high", state: "backlog", assignedTo: "John (SEO Lead)", description: "Page contains 5 distinct service sub-topics. Split them into separate focused landing pages.", fixApplied: false, checklistText: "Sub-topic H2 sections reduced and structured as independent URLs", initialCode: '<h2>NIE Applications</h2>\n<h2>TIE Applications</h2>', fixedCode: '<h2>Local Services Index</h2>\n<!-- Subtopics split to standalone pages -->' },
      { id: "t7_2", pageId: "tse-p2", pageUrl: "/local-seo/", name: "Optimize image alt tags on local services page", priority: "medium", state: "backlog", assignedTo: "Sarah (SEO Assistant)", description: "Add target phrase 'local seo services' to image alt attributes on the services index page.", fixApplied: false, checklistText: "Alt text containing 'local seo services' added to image tag", initialCode: '<img src="/images/seo-consulting.jpg" alt="SEO Services" />', fixedCode: '<img src="/images/seo-consulting.jpg" alt="Local SEO Services Consultancy" />' }
    ]
  },
  {
    id: "civion",
    name: "Civion",
    url: "https://www.civion.es",
    targetPhrase: "spanish residency services",
    status: "Connected",
    score: 65,
    change: 3, // Score change: +3
    lastAudit: "2026-06-18",
    pages: [
      { id: "civ-p1", url: "/spanish-residency-services/", type: "hub", typeLabel: "Hub Page", score: 65, target: "spanish residency services", fit: "strong", fitLabel: "Strong Fit", fitScore: 80 },
      { id: "civ-p2", url: "/nie-number-application/", type: "landing", typeLabel: "Landing Page", score: 72, target: "nie number application", fit: "strong", fitLabel: "Strong Fit", fitScore: 85 },
      { id: "civ-p3", url: "/tie-card-application/", type: "landing", typeLabel: "Landing Page", score: 58, target: "tie card application", fit: "moderate", fitLabel: "Moderate Fit", fitScore: 64 }
    ],
    tasks: [
      { id: "t8", pageId: "civ-p2", pageUrl: "/nie-number-application/", name: "Flag orphan location landing page", priority: "high", state: "backlog", assignedTo: "Sarah (SEO Assistant)", description: "Page is not linked from any internal navigation or content page.", fixApplied: false, checklistText: "Incoming internal link added from residency index page", initialCode: '<!-- No links to /nie-number-application/ -->', fixedCode: '<a href="/nie-number-application/">Get your Spanish NIE Number</a>' },
      { id: "t9", pageId: "civ-p3", pageUrl: "/tie-card-application/", name: "Add target phrase to H1 heading", priority: "high", state: "backlog", assignedTo: "Sarah (SEO Assistant)", description: "Main heading is 'TIE Application'. Change to 'TIE Card Application Spain' to match user intent.", fixApplied: false, checklistText: "H1 heading contains 'TIE Card Application'", initialCode: '<h1>TIE Application</h1>', fixedCode: '<h1>TIE Card Application in Spain</h1>' },
      { id: "t10", pageId: "civ-p1", pageUrl: "/spanish-residency-services/", name: "Move target phrase to start of meta title", priority: "medium", state: "progress", assignedTo: "Sarah (SEO Assistant)", description: "Meta title is 'Residency Services - Spanish Visas'. Change to place the target phrase first.", fixApplied: false, checklistText: "Meta title starts with 'Spanish Residency Services'", initialCode: '<title>Residency Services - Spanish Visas | Civion</title>', fixedCode: '<title>Spanish Residency Services | Civion</title>' },
      { id: "t10_2", pageId: "civ-p1", pageUrl: "/spanish-residency-services/", name: "Add internal link to TIE card application", priority: "low", state: "backlog", assignedTo: "Sarah (SEO Assistant)", description: "Link to the new TIE card application page from the main Spanish Residency Services index page to establish internal keyword authority.", fixApplied: false, checklistText: "Internal hyperlink to /tie-card-application/ detected in body", initialCode: '<p>We help you with all residency steps.</p>', fixedCode: '<p>We help you with all residency steps including the <a href="/tie-card-application/">TIE card application in Spain</a>.</p>' }
    ]
  },
  {
    id: "hf4you",
    name: "HF4You",
    url: "https://www.hf4you.co.uk",
    targetPhrase: "divan beds",
    status: "Offline",
    score: 71,
    change: -1, // Score change: -1
    lastAudit: "2026-06-15",
    pages: [
      { id: "hf-p1", url: "/divans/", type: "category", typeLabel: "Category Page", score: 45, target: "divan beds", fit: "weak", fitLabel: "Weak Fit", fitScore: 48 },
      { id: "hf-p2", url: "/mattresses/", type: "category", typeLabel: "Category Page", score: 68, target: "double mattresses", fit: "moderate", fitLabel: "Moderate Fit", fitScore: 70 }
    ],
    tasks: [
      { id: "t11", pageId: "hf-p1", pageUrl: "/divans/", name: "Add target phrase to H1 heading", priority: "high", state: "backlog", assignedTo: "John (SEO Lead)", description: "H1 heading is currently 'Beds'. Change it to 'Divan Beds & Storage Bases'.", fixApplied: false, checklistText: "H1 heading contains 'Divan Beds'", initialCode: '<h1>Beds</h1>', fixedCode: '<h1>Divan Beds & Storage Bases</h1>' },
      { id: "t12", pageId: "hf-p2", pageUrl: "/mattresses/", name: "Fix duplicate H1 headings", priority: "medium", state: "backlog", assignedTo: "Sarah (SEO Assistant)", description: "Multiple H1 tags found. Retain only one primary H1 for the page title.", fixApplied: false, checklistText: "Exactly one H1 element detected on page", initialCode: '<h1>Mattresses</h1>\n<h1>Double Mattresses</h1>', fixedCode: '<h1>Double Mattresses</h1>\n<!-- Secondary H1 changed to H2 -->' }
    ]
  },
  {
    id: "fireplaces4life",
    name: "Fireplaces4Life",
    url: "https://www.fireplaces4life.co.uk",
    targetPhrase: "electric fireplaces",
    status: "Idle",
    score: 0,
    change: 0,
    lastAudit: "Never",
    pages: [],
    tasks: []
  }
];

export default function App() {
  const [sites, setSites] = useState(INITIAL_SITES);
  const [currentView, setCurrentView] = useState("DASHBOARD"); // DASHBOARD (My Work Today), SITES, SITE_REPORT, PAGE_CHECKLIST, GLOBAL_TASKS
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [selectedPageId, setSelectedPageId] = useState(null);
  
  // Page Auditor Slide-out Panel State
  const [pageAuditorOpen, setPageAuditorOpen] = useState(false);
  const [pageAuditorTask, setPageAuditorTask] = useState(null);
  const [pageAuditorAnalyzing, setPageAuditorAnalyzing] = useState(false);
  const [pageAuditorComplete, setPageAuditorComplete] = useState(false);

  // Notification Banner
  const [notification, setNotification] = useState("");

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4000);
  };

  const getSelectedSite = () => {
    return sites.find(s => s.id === selectedSiteId) || null;
  };

  const getSelectedPage = (site) => {
    if (!site || !selectedPageId) return null;
    return site.pages.find(p => p.id === selectedPageId) || null;
  };

  // Simulate Crawl / Audit Run
  const handleRunAudit = (siteId, e) => {
    if (e) e.stopPropagation();
    
    // Set status to Crawling
    setSites(prev => prev.map(s => {
      if (s.id === siteId) {
        return { ...s, status: "Crawling" };
      }
      return s;
    }));

    showNotification(`Initiated crawler for ${sites.find(s => s.id === siteId).name}...`);

    // Simulate completion after 2.5 seconds
    setTimeout(() => {
      setSites(prev => prev.map(s => {
        if (s.id === siteId) {
          if (s.id === "fireplaces4life") {
            return {
              ...s,
              status: "Connected",
              score: 55,
              change: 55,
              lastAudit: new Date().toISOString().slice(0, 10),
              pages: [
                { id: "f4l-p1", url: "/electric-fireplaces/", type: "landing", typeLabel: "Landing Page", score: 55, target: "electric fireplaces", fit: "moderate", fitLabel: "Moderate Fit", fitScore: 60 }
              ],
              tasks: [
                { id: "t13", pageId: "f4l-p1", pageUrl: "/electric-fireplaces/", name: "Add target phrase to H1 heading", priority: "high", state: "backlog", assignedTo: "Sarah (SEO Assistant)", description: "H1 heading is currently 'Warm Up Your Home'. Change it to 'Electric Fireplaces & Heating Stoves'.", fixApplied: false, checklistText: "H1 heading contains 'electric fireplaces'", initialCode: '<h1>Warm Up Your Home</h1>', fixedCode: '<h1>Electric Fireplaces & Heating Stoves</h1>' }
              ]
            };
          }
          return {
            ...s,
            status: "Connected",
            change: s.change + 1,
            lastAudit: new Date().toISOString().slice(0, 10)
          };
        }
        return s;
      }));
      showNotification(`Audit complete for ${sites.find(s => s.id === siteId).name}!`);
    }, 2500);
  };

  // Launch Page Auditor Overlay
  const handleLaunchPageAuditor = (task) => {
    setPageAuditorTask(task);
    setPageAuditorComplete(false);
    setPageAuditorOpen(true);
  };

  // Start Work Handler: sets context and launches page auditor
  const handleStartWork = (task, siteId) => {
    setSelectedSiteId(siteId);
    setSelectedPageId(task.pageId);
    handleLaunchPageAuditor(task);
  };

  // Start Working First Task: finds Sarah's highest priority incomplete task and starts it
  const handleStartWorkingFirstTask = () => {
    const sarahIncomplete = [];
    sites.forEach(site => {
      if (site.tasks) {
        site.tasks.forEach(t => {
          if (t.assignedTo === "Sarah (SEO Assistant)" && t.state !== "completed") {
            sarahIncomplete.push({ ...t, siteId: site.id });
          }
        });
      }
    });

    const priorityOrder = { high: 1, medium: 2, low: 3 };
    sarahIncomplete.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    if (sarahIncomplete.length > 0) {
      const target = sarahIncomplete[0];
      handleStartWork(target, target.siteId);
    } else {
      showNotification("All your assigned tasks are completed! Great job!");
    }
  };

  // Simulate Fix in Page Auditor
  const handleSimulateFix = () => {
    if (!pageAuditorTask) return;
    
    setPageAuditorAnalyzing(true);
    
    setTimeout(() => {
      setPageAuditorAnalyzing(false);
      setPageAuditorComplete(true);
      
      // Update task in state (move to Completed, set fixApplied = true)
      setSites(prev => prev.map(site => {
        if (site.id === selectedSiteId) {
          const updatedTasks = site.tasks.map(t => {
            if (t.id === pageAuditorTask.id) {
              return { ...t, state: "completed", fixApplied: true };
            }
            return t;
          });
          
          // Boost page score
          const updatedPages = site.pages.map(page => {
            if (page.id === pageAuditorTask.pageId) {
              return { ...page, score: 95, fit: "strong", fitLabel: "Strong Fit", fitScore: 95 };
            }
            return page;
          });

          // Calculate new overall score based on pages average
          const avgScore = Math.round(updatedPages.reduce((acc, curr) => acc + curr.score, 0) / updatedPages.length);
          const scoreDiff = avgScore - site.score;

          return { 
            ...site, 
            tasks: updatedTasks, 
            pages: updatedPages, 
            score: avgScore,
            change: scoreDiff !== 0 ? site.change + scoreDiff : site.change
          };
        }
        return site;
      }));

      showNotification(`Task verified and auto-closed. Page score boosted to 95!`);
      
      // Close drawer after short delay
      setTimeout(() => {
        setPageAuditorOpen(false);
        setPageAuditorTask(null);
      }, 1200);

    }, 2000);
  };

  const handleToggleTaskCheckbox = (taskId) => {
    setSites(prev => prev.map(site => {
      if (site.id === selectedSiteId) {
        const updatedTasks = site.tasks.map(t => {
          if (t.id === taskId) {
            const nextState = t.state === "completed" ? "backlog" : "completed";
            return { ...t, state: nextState, fixApplied: nextState === "completed" };
          }
          return t;
        });
        return { ...site, tasks: updatedTasks };
      }
      return site;
    }));
  };

  const selectedSite = getSelectedSite();
  const selectedPage = getSelectedPage(selectedSite);

  // Helper counts
  const getTasksResolvedCount = (site) => {
    if (!site || !site.tasks) return 0;
    return site.tasks.filter(t => t.state === "completed").length;
  };

  // Get dynamic backlog list of incomplete tasks
  const getBacklogTasks = () => {
    const tasks = [];
    sites.forEach(site => {
      if (site.tasks) {
        site.tasks.forEach(t => {
          if (t.state !== "completed") {
            tasks.push({ ...t, siteId: site.id, siteName: site.name });
          }
        });
      }
    });
    return tasks;
  };

  const backlog = getBacklogTasks();
  const sarahTasks = backlog.filter(t => t.assignedTo === "Sarah (SEO Assistant)");
  const highTasks = backlog.filter(t => t.priority === "high");
  const mediumTasks = backlog.filter(t => t.priority === "medium");
  const lowTasks = backlog.filter(t => t.priority === "low");

  const renderScoreChange = (val) => {
    if (val > 0) return <span className="score-change-badge change-positive">↑ +{val}</span>;
    if (val < 0) return <span className="score-change-badge change-negative">↓ {val}</span>;
    return <span className="score-change-badge change-zero">— 0</span>;
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

      {/* Backdrop overlay */}
      <div className={`backdrop-overlay ${pageAuditorOpen ? 'show' : ''}`} onClick={() => setPageAuditorOpen(false)}></div>

      {/* Slide-out Page Auditor Mockup Drawer */}
      <div className={`page-auditor-panel ${pageAuditorOpen ? 'open' : ''}`}>
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity className="text-secondary" style={{ color: "#10b981" }} size={20} />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>TSE Page Auditor V1.3</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Live On-Page Validation</p>
            </div>
          </div>
          <button className="panel-close-btn" onClick={() => setPageAuditorOpen(false)}>×</button>
        </div>
        
        {pageAuditorTask && (
          <div className="panel-content">
            <div className="mb-4">
              <label style={{ fontSize: "0.75rem" }}>Target Page URL</label>
              <div className="flex align-center gap-2" style={{ backgroundColor: 'var(--bg-color)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                <Globe size={14} className="text-secondary" />
                <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{selectedSite?.url}{pageAuditorTask.pageUrl}</span>
              </div>
            </div>

            <div className="mb-4">
              <label style={{ fontSize: "0.75rem" }}>Target Phrase</label>
              <div className="flex align-center gap-2" style={{ backgroundColor: 'var(--bg-color)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                <Search size={14} className="text-secondary" />
                <span className="text-bold">{selectedSite?.targetPhrase}</span>
              </div>
            </div>

            <div className="simulation-banner">
              <Server size={18} className="simulation-icon" />
              <div className="simulation-text">
                <strong>Simulated Workflow Mode</strong><br />
                Click the button below to simulate editing the codebase in WordPress. Page Auditor will run verification automatically.
              </div>
            </div>

            <div className="report-section" style={{ backgroundColor: 'var(--bg-color)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Task: {pageAuditorTask.name}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{pageAuditorTask.description}</p>
              
              <div className="mb-4">
                <label style={{ fontSize: '0.75rem' }}>Current Page Code</label>
                <pre style={{ 
                  backgroundColor: '#07090b', padding: '0.75rem', borderRadius: '6px', 
                  fontFamily: 'monospace', fontSize: '0.8rem', overflowX: 'auto',
                  border: '1px solid var(--border-color)', color: pageAuditorComplete ? '#34d399' : '#f87171'
                }}>
                  {pageAuditorComplete ? pageAuditorTask.fixedCode : pageAuditorTask.initialCode}
                </pre>
              </div>

              {pageAuditorAnalyzing && (
                <div className="text-center mt-4">
                  <RefreshCw className="inline animate-spin mr-2" style={{ color: "#3b82f6" }} size={20} />
                  <span style={{ fontSize: '0.9rem', color: '#60a5fa' }}>Verifying fixes on live page...</span>
                </div>
              )}

              {pageAuditorComplete && (
                <div className="text-center mt-4" style={{ color: "#34d399", fontWeight: "600", fontSize: '0.9rem' }}>
                  <CheckCircle className="inline mr-2" size={18} /> Fix verified! Closing task...
                </div>
              )}
            </div>
          </div>
        )}

        <div className="panel-footer">
          <button 
            className="btn-primary w-full" 
            disabled={pageAuditorAnalyzing || pageAuditorComplete}
            onClick={handleSimulateFix}
            style={{ justifyContent: 'center' }}
          >
            <Check size={16} /> Simulate WordPress Fix & Re-Audit
          </button>
        </div>
      </div>

      {/* Header Panel */}
      <header className="hub-header">
        <div className="hub-brand" onClick={() => { setCurrentView("DASHBOARD"); setSelectedSiteId(null); setSelectedPageId(null); }}>
          <Activity size={24} />
          <span>TSE Optimisation Hub</span>
        </div>
        <nav className="hub-nav">
          <span 
            className={`hub-nav-link ${currentView === "DASHBOARD" ? "active" : ""}`}
            onClick={() => { setCurrentView("DASHBOARD"); setSelectedSiteId(null); setSelectedPageId(null); }}
          >
            My Work Today
          </span>
          <span 
            className={`hub-nav-link ${currentView === "SITES" || currentView === "SITE_REPORT" || currentView === "PAGE_CHECKLIST" ? "active" : ""}`}
            onClick={() => { setCurrentView("SITES"); setSelectedSiteId(null); setSelectedPageId(null); }}
          >
            Sites Dashboard
          </span>
          <span 
            className={`hub-nav-link ${currentView === "GLOBAL_TASKS" ? "active" : ""}`}
            onClick={() => { setCurrentView("GLOBAL_TASKS"); setSelectedSiteId(null); setSelectedPageId(null); }}
          >
            Global Task List
          </span>
        </nav>
        <div className="user-profile">
          <User size={14} />
          <span>Sarah (SEO Assistant)</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="hub-main">
        <div className="hub-content">
          
          {/* VIEW: MY WORK TODAY (TASK-FIRST HOMEPAGE) */}
          {currentView === "DASHBOARD" && (
            <div>
              {/* Summary Dashboard Card */}
              <div className="work-summary-card">
                <div className="summary-left">
                  <div className="summary-title-row">
                    <CheckSquare size={20} style={{ color: "var(--accent-color)" }} />
                    <h3>My Work Today</h3>
                  </div>
                  <div className="summary-metrics">
                    <div className="metric-large">
                      <span className="metric-number">{sarahTasks.length}</span>
                      <span className="metric-label">Tasks Assigned</span>
                    </div>
                    <div className="metric-pills">
                      <span className="metric-pill prio-high">{highTasks.filter(t => t.assignedTo === "Sarah (SEO Assistant)").length} High</span>
                      <span className="metric-pill prio-medium">{mediumTasks.filter(t => t.assignedTo === "Sarah (SEO Assistant)").length} Medium</span>
                      <span className="metric-pill prio-low">{lowTasks.filter(t => t.assignedTo === "Sarah (SEO Assistant)").length} Low</span>
                    </div>
                  </div>
                </div>
                <div className="summary-right">
                  <button className="btn-primary start-working-btn" onClick={handleStartWorkingFirstTask} disabled={sarahTasks.length === 0}>
                    <Play size={16} /> Continue Optimisation
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '2.5rem' }}>
                <h2 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>Optimisation Backlog</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Select a task below to launch the live Page Auditor drawer and apply fixes.</p>
              </div>

              {/* Stacked Task Panels Grid */}
              <div className="task-workspace-grid">
                
                {/* 1. Tasks Assigned To Me */}
                <div className="task-workspace-panel pane-assigned">
                  <div className="panel-workspace-header">
                    <h4>Assigned To Me ({sarahTasks.length})</h4>
                    <span className="header-pbadge badge-assigned">Sarah's Workspace</span>
                  </div>
                  <div className="workspace-task-list">
                    {sarahTasks.map(task => (
                      <div key={task.id} className="workspace-task-item">
                        <div className="task-item-left">
                          <span className={`task-priority-badge priority-${task.priority}`}>{task.priority}</span>
                          <div className="task-item-content">
                            <span className="task-item-title">{task.name}</span>
                            <span className="task-item-site">({task.siteName})</span>
                            <div className="task-item-url">{task.pageUrl}</div>
                          </div>
                        </div>
                        <button className="btn-primary btn-sm" onClick={() => handleStartWork(task, task.siteId)}>
                          Start Work
                        </button>
                      </div>
                    ))}
                    {sarahTasks.length === 0 && (
                      <div className="workspace-empty-state">
                        <CheckCircle size={28} className="empty-state-icon" />
                        <p>No tasks assigned! All caught up.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. High Priority Tasks */}
                <div className="task-workspace-panel pane-high">
                  <div className="panel-workspace-header">
                    <h4>High Priority ({highTasks.length})</h4>
                    <span className="header-pbadge badge-high">Immediate Attention</span>
                  </div>
                  <div className="workspace-task-list">
                    {highTasks.map(task => (
                      <div key={task.id} className="workspace-task-item">
                        <div className="task-item-left">
                          <span className="task-priority-badge priority-high">High</span>
                          <div className="task-item-content">
                            <span className="task-item-title">{task.name}</span>
                            <span className="task-item-site">({task.siteName})</span>
                            <div className="task-item-url">{task.pageUrl}</div>
                          </div>
                        </div>
                        <button className="btn-primary btn-sm" onClick={() => handleStartWork(task, task.siteId)}>
                          Start Work
                        </button>
                      </div>
                    ))}
                    {highTasks.length === 0 && (
                      <div className="workspace-empty-state">
                        <CheckCircle size={28} className="empty-state-icon text-success" />
                        <p>All high-priority tasks resolved!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Medium Priority Tasks */}
                <div className="task-workspace-panel pane-medium">
                  <div className="panel-workspace-header">
                    <h4>Medium Priority ({mediumTasks.length})</h4>
                    <span className="header-pbadge badge-medium">Next In Queue</span>
                  </div>
                  <div className="workspace-task-list">
                    {mediumTasks.map(task => (
                      <div key={task.id} className="workspace-task-item">
                        <div className="task-item-left">
                          <span className="task-priority-badge priority-medium">Medium</span>
                          <div className="task-item-content">
                            <span className="task-item-title">{task.name}</span>
                            <span className="task-item-site">({task.siteName})</span>
                            <div className="task-item-url">{task.pageUrl}</div>
                          </div>
                        </div>
                        <button className="btn-primary btn-sm" onClick={() => handleStartWork(task, task.siteId)}>
                          Start Work
                        </button>
                      </div>
                    ))}
                    {mediumTasks.length === 0 && (
                      <div className="workspace-empty-state">
                        <CheckCircle size={28} className="empty-state-icon" />
                        <p>All medium-priority tasks resolved!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Low Priority Tasks */}
                <div className="task-workspace-panel pane-low">
                  <div className="panel-workspace-header">
                    <h4>Low Priority ({lowTasks.length})</h4>
                    <span className="header-pbadge badge-low">Optimisations</span>
                  </div>
                  <div className="workspace-task-list">
                    {lowTasks.map(task => (
                      <div key={task.id} className="workspace-task-item">
                        <div className="task-item-left">
                          <span className="task-priority-badge priority-low">Low</span>
                          <div className="task-item-content">
                            <span className="task-item-title">{task.name}</span>
                            <span className="task-item-site">({task.siteName})</span>
                            <div className="task-item-url">{task.pageUrl}</div>
                          </div>
                        </div>
                        <button className="btn-primary btn-sm" onClick={() => handleStartWork(task, task.siteId)}>
                          Start Work
                        </button>
                      </div>
                    ))}
                    {lowTasks.length === 0 && (
                      <div className="workspace-empty-state">
                        <CheckCircle size={28} className="empty-state-icon" />
                        <p>All low-priority tasks resolved!</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* VIEW: SITES DASHBOARD (SECONDARY VIEW) */}
          {currentView === "SITES" && (
            <div>
              <div className="flex justify-between align-center mb-4">
                <div>
                  <h2 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 800 }}>Websites Index</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Overview of pre-configured sites, dynamic health scores, and administrative crawlers.</p>
                </div>
              </div>

              <div className="dashboard-grid">
                {sites.map(site => {
                  const siteOpenTasks = site.tasks ? site.tasks.filter(t => t.state !== "completed").length : 0;
                  
                  return (
                    <div 
                      key={site.id} 
                      className="site-card"
                      onClick={() => {
                        if (site.status !== "Idle") {
                          setSelectedSiteId(site.id);
                          setCurrentView("SITE_REPORT");
                        }
                      }}
                      style={{ cursor: site.status === "Idle" ? "default" : "pointer" }}
                    >
                      <div>
                        <div className="site-card-header">
                          <div>
                            <h3 className="site-name">{site.name}</h3>
                            <span className="site-url">{site.url}</span>
                          </div>
                          <span className={`status-badge ${
                            site.status === "Connected" ? "status-connected" 
                            : site.status === "Crawling" ? "status-crawling" 
                            : site.status === "Offline" ? "status-offline" 
                            : "status-idle"
                          }`}>
                            <Server size={10} /> {site.status}
                          </span>
                        </div>
                        
                        {site.status !== "Idle" ? (
                          <div className="site-score-section-v2">
                            <div className="score-v2-main">
                              <div className="score-display">{site.score}</div>
                              <div className="score-v2-change">
                                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', display: 'block', color: 'var(--text-secondary)' }}>Score Trend</span>
                                {renderScoreChange(site.change)}
                              </div>
                            </div>
                            <div className="score-v2-details">
                              <div className="site-detail-metric">
                                <strong>{siteOpenTasks}</strong> open tasks remaining
                              </div>
                              <div className="site-detail-metric text-secondary" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                                Last Audit: {site.lastAudit}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ padding: '1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            This website is queued for connection onboarding.
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {site.status !== "Idle" && (
                          <button 
                            className="btn-secondary" 
                            style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSiteId(site.id);
                              setCurrentView("SITE_REPORT");
                            }}
                          >
                            <FileText size={12} /> View Results
                          </button>
                        )}
                        <button 
                          className="btn-primary btn-secondary-action" 
                          style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.8rem', justifyContent: 'center' }}
                          disabled={site.status === "Offline" || site.status === "Crawling"}
                          onClick={(e) => handleRunAudit(site.id, e)}
                        >
                          {site.status === "Crawling" ? (
                            <>
                              <RefreshCw size={12} className="animate-spin" /> Crawling...
                            </>
                          ) : (
                            <>
                              <Play size={12} /> Run Site Audit
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: AUDIT RESULTS SCREEN (Site Report) */}
          {currentView === "SITE_REPORT" && selectedSite && (
            <div>
              <div className="mb-4">
                <span 
                  className="flex align-center gap-2 text-secondary cursor-pointer"
                  onClick={() => { setCurrentView("SITES"); setSelectedSiteId(null); }}
                  style={{ fontSize: '0.9rem' }}
                >
                  <ArrowLeft size={16} /> Back to Sites Dashboard
                </span>
              </div>

              <div className="flex justify-between align-center mb-4">
                <div>
                  <h2 style={{ fontFamily: 'Outfit', fontSize: '2rem', fontWeight: 800 }}>{selectedSite.name}</h2>
                  <a href={selectedSite.url} target="_blank" rel="noreferrer" className="flex align-center gap-2 text-secondary" style={{ fontSize: '0.9rem', textDecoration: 'none' }}>
                    {selectedSite.url} <ExternalLink size={12} />
                  </a>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className="text-right">
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Last Crawl</div>
                    <div style={{ fontWeight: '600' }}><Clock size={12} className="inline mr-1" /> {selectedSite.lastAudit}</div>
                  </div>
                  <button className="btn-primary" onClick={(e) => handleRunAudit(selectedSite.id, e)} disabled={selectedSite.status === "Crawling"}>
                    <RefreshCw size={14} className={selectedSite.status === "Crawling" ? "animate-spin" : ""} /> Re-Run Crawl
                  </button>
                </div>
              </div>

              <div className="report-grid">
                {/* Left Column: Pages List */}
                <div>
                  <div className="report-section">
                    <div className="section-header-inline">
                      <h3 className="section-title-custom">Crawled Pages List</h3>
                      <span className="text-secondary" style={{ fontSize: '0.85rem' }}>{selectedSite.pages?.length} Pages Found</span>
                    </div>

                    <table className="page-table">
                      <thead>
                        <tr>
                          <th>URL Path</th>
                          <th>Page Type</th>
                          <th>Phrase Fit</th>
                          <th style={{ textAlign: 'right' }}>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSite.pages?.map(page => (
                          <tr 
                            key={page.id} 
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedPageId(page.id);
                              setCurrentView("PAGE_CHECKLIST");
                            }}
                          >
                            <td className="text-bold" style={{ color: "#38bdf8" }}>{page.url}</td>
                            <td>
                              <span className={`page-type-pill ${
                                page.type === "landing" ? "type-landing" 
                                : page.type === "hub" ? "type-hub" 
                                : "type-category"
                              }`}>
                                {page.typeLabel}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{page.fitLabel}</span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <span className={`small-score-pill ${
                                page.score >= 75 ? "score-good" 
                                : page.score >= 50 ? "score-warn" 
                                : "score-bad"
                              }`}>
                                {page.score}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Column: Site Summary & Tasks */}
                <div>
                  <div className="report-section" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Site Health</div>
                    <div style={{ fontSize: '4.5rem', fontWeight: '800', lineHeight: 1, fontFamily: 'Outfit', color: selectedSite.score >= 75 ? '#10b981' : '#f59e0b', marginBottom: '0.5rem' }}>
                      {selectedSite.score}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/ 100 overall score</div>
                    
                    <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                      <div className="flex justify-between" style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                        <span>Site-wide Progress</span>
                        <span>{getTasksResolvedCount(selectedSite)} / {selectedSite.tasks?.length} Tasks Fixed</span>
                      </div>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar-fill" 
                          style={{ width: `${selectedSite.tasks?.length ? (getTasksResolvedCount(selectedSite) / selectedSite.tasks.length * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="report-section">
                    <h3 className="section-title-custom mb-4">Site Auditor Tasks</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedSite.tasks?.map(task => (
                        <div 
                          key={task.id} 
                          style={{ 
                            padding: '0.75rem', border: '1px solid var(--border-color)', 
                            borderRadius: '8px', backgroundColor: 'var(--bg-color)',
                            fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', gap: '8px'
                          }}
                        >
                          <div>
                            <div className="text-bold" style={{ textDecoration: task.state === "completed" ? "line-through" : "none", color: task.state === "completed" ? "var(--text-secondary)" : "var(--text-primary)" }}>{task.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.15rem' }}>{task.pageUrl}</div>
                          </div>
                          <span className={`task-priority-badge ${
                            task.priority === "high" ? "priority-high" 
                            : task.priority === "medium" ? "priority-medium" 
                            : "priority-low"
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: PAGE CHECKLIST SCREEN (Granular single-page checks) */}
          {currentView === "PAGE_CHECKLIST" && selectedSite && selectedPage && (
            <div>
              <div className="mb-4">
                <span 
                  className="flex align-center gap-2 text-secondary cursor-pointer"
                  onClick={() => { setCurrentView("SITE_REPORT"); setSelectedPageId(null); }}
                  style={{ fontSize: '0.9rem' }}
                >
                  <ArrowLeft size={16} /> Back to Site Auditor Page List
                </span>
              </div>

              <div className="flex justify-between align-center mb-4">
                <div>
                  <h2 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 800 }}>Page Checklist: {selectedPage.url}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    Targeting Phrase: <strong>{selectedPage.target}</strong> · Type: <span className="text-bold">{selectedPage.typeLabel}</span>
                  </p>
                </div>
                <div className="flex align-center gap-4">
                  <div className="text-right">
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>On-Page Fit</span>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: '#10b981' }}>{selectedPage.fitLabel} ({selectedPage.fitScore}/100)</div>
                  </div>
                  <div className={`score-display text-center`} style={{ 
                    width: '60px', height: '60px', borderRadius: '50%', 
                    border: '3px solid ' + (selectedPage.score >= 75 ? '#10b981' : '#f59e0b'), 
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    fontSize: '1.5rem', fontWeight: '800'
                  }}>
                    {selectedPage.score}
                  </div>
                </div>
              </div>

              <div className="report-section">
                <div className="section-header-inline">
                  <h3 className="section-title-custom">Page-Level Actions Checklist</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {selectedSite.tasks.filter(t => t.pageId === selectedPage.id && t.state === "completed").length} of {selectedSite.tasks.filter(t => t.pageId === selectedPage.id).length} checks resolved
                  </span>
                </div>

                <div>
                  {selectedSite.tasks.filter(t => t.pageId === selectedPage.id).map(task => (
                    <div key={task.id} className="task-row justify-between">
                      <div className="flex align-center gap-4">
                        <input 
                          type="checkbox" 
                          className="task-checkbox" 
                          checked={task.state === "completed"}
                          onChange={() => handleToggleTaskCheckbox(task.id)}
                        />
                        <div>
                          <div className="flex align-center gap-2">
                            <span className={`task-priority-badge ${
                              task.priority === "high" ? "priority-high" 
                              : task.priority === "medium" ? "priority-medium" 
                              : "priority-low"
                            }`}>
                              {task.priority}
                            </span>
                            <span className="text-bold" style={{ 
                              textDecoration: task.state === "completed" ? "line-through" : "none",
                              color: task.state === "completed" ? "var(--text-secondary)" : "var(--text-primary)"
                            }}>
                              {task.name}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{task.description}</p>
                        </div>
                      </div>

                      <div className="flex align-center gap-2">
                        {task.state === "completed" ? (
                          <span className="task-state-badge state-completed">Verified Complete</span>
                        ) : (
                          <button className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleLaunchPageAuditor(task)}>
                            <Activity size={12} className="inline mr-1" /> Launch Page Auditor
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {selectedSite.tasks.filter(t => t.pageId === selectedPage.id).length === 0 && (
                    <div className="text-center text-secondary" style={{ padding: '2rem 0' }}>
                      <CheckCircle size={28} className="inline mb-2" style={{ color: '#10b981' }} /><br />
                      This page currently passes all on-page auditing rules!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: GLOBAL TASK LIST SCREEN */}
          {currentView === "GLOBAL_TASKS" && (
            <div>
              <div className="flex justify-between align-center mb-4">
                <div>
                  <h2 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 800 }}>Global Task Manager</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Centralized control of all pending and resolved tasks across connected websites.</p>
                </div>
              </div>

              <div className="report-section">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {sites.filter(s => s.status !== "Idle" && s.tasks?.length > 0).map(site => (
                    <div key={site.id} style={{ marginBottom: '1.5rem' }}>
                      <div className="flex align-center gap-2 mb-2" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <Globe size={14} className="text-secondary" />
                        <h4 className="text-bold" style={{ fontSize: '0.95rem' }}>{site.name}</h4>
                        <span className="text-secondary" style={{ fontSize: '0.75rem' }}>({site.tasks.length} total tasks)</span>
                      </div>

                      {site.tasks.map(task => (
                        <div key={task.id} className="task-row justify-between" style={{ padding: '0.75rem 1rem' }}>
                          <div className="flex align-center gap-4">
                            <input 
                              type="checkbox" 
                              className="task-checkbox" 
                              checked={task.state === "completed"}
                              onChange={() => {
                                setSites(prev => prev.map(s => {
                                  if (s.id === site.id) {
                                    const updatedTasks = s.tasks.map(t => {
                                      if (t.id === task.id) {
                                        const nextState = t.state === "completed" ? "backlog" : "completed";
                                        return { ...t, state: nextState, fixApplied: nextState === "completed" };
                                      }
                                      return t;
                                    });
                                    return { ...s, tasks: updatedTasks };
                                  }
                                  return s;
                                }));
                              }}
                            />
                            <div>
                              <div className="flex align-center gap-2">
                                <span className={`task-priority-badge ${
                                  task.priority === "high" ? "priority-high" 
                                  : task.priority === "medium" ? "priority-medium" 
                                  : "priority-low"
                                }`}>
                                  {task.priority}
                                </span>
                                <span className="text-bold" style={{ 
                                  textDecoration: task.state === "completed" ? "line-through" : "none",
                                  color: task.state === "completed" ? "var(--text-secondary)" : "var(--text-primary)"
                                }}>
                                  {task.name}
                                </span>
                              </div>
                              <p style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.15rem' }}>On URL: {task.pageUrl}</p>
                            </div>
                          </div>

                          <div className="flex align-center gap-2">
                            <span className={`task-state-badge ${
                              task.state === "completed" ? "state-completed" 
                              : "state-progress"
                            }`}>
                              {task.state === "completed" ? "Completed" : "In Progress"}
                            </span>
                            {task.state !== "completed" && (
                              <button className="btn-primary btn-sm" onClick={() => handleStartWork(task, site.id)}>
                                Start Work
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
