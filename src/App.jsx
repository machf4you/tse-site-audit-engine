import React, { useState } from 'react';
import { 
  CheckSquare, Play, CheckCircle, RefreshCw, ArrowLeft, 
  ExternalLink, User, Check, Server, AlertCircle, Award, ChevronRight, Globe
} from 'lucide-react';

const INITIAL_SITES = [
  {
    id: "bathroom-upgrades",
    name: "Bathroom Upgrades",
    url: "https://www.bathroomupgrades.co.uk",
    status: "Connected",
    lastAudit: "27 Jun 2026",
    tasks: [
      {
        id: "t1",
        pageUrl: "https://www.bathroomupgrades.co.uk/bathroom-renovations/",
        priority: "high",
        taskTitle: 'Add "Bathroom Renovations" to H1',
        currentVersion: "Professional Bathroom Services",
        requiredVersion: "Bathroom Renovations in South East London",
        whyItMatters: "The target phrase is missing from the main H1 heading.",
        successCheck: "Page Auditor will verify automatically.",
        keyword: "Bathroom Renovations",
        state: "backlog" // backlog, progress, completed
      },
      {
        id: "t2",
        pageUrl: "https://www.bathroomupgrades.co.uk/bathroom-renovations/",
        priority: "high",
        taskTitle: "Create FAQ Schema",
        currentVersion: "<!-- No FAQ Schema Block Detected -->",
        requiredVersion: '<script type="application/ld+json">{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": [...]\n}</script>',
        whyItMatters: "FAQ markup is missing. Structured schema is needed for rich snippet placement.",
        successCheck: "Page Auditor will verify automatically.",
        keyword: "FAQPage",
        state: "backlog"
      },
      {
        id: "t3",
        pageUrl: "https://www.bathroomupgrades.co.uk/cheap-bathroom-suites/",
        priority: "high",
        taskTitle: "Fix Broken Internal Link",
        currentVersion: '<a href="/cheap-suites/">Suites</a>',
        requiredVersion: '<a href="/cheap-bathroom-suites/">Cheap Bathroom Suites</a>',
        whyItMatters: "The internal link anchor text and target URL need optimization.",
        successCheck: "Page Auditor will verify automatically.",
        keyword: "cheap-bathroom-suites",
        state: "backlog"
      },
      {
        id: "t4",
        pageUrl: "https://www.bathroomupgrades.co.uk/",
        priority: "medium",
        taskTitle: "Improve Meta Description",
        currentVersion: "<meta name=\"description\" content=\"We install bathrooms.\" />",
        requiredVersion: "<meta name=\"description\" content=\"Expert bathroom renovations and suite installation in South East London.\" />",
        whyItMatters: "The search description needs to be more compelling and descriptive.",
        successCheck: "Page Auditor will verify automatically.",
        keyword: "renovations",
        state: "backlog"
      },
      {
        id: "t5",
        pageUrl: "https://www.bathroomupgrades.co.uk/bathroom-ideas/",
        priority: "medium",
        taskTitle: "Add Alt Text",
        currentVersion: '<img src="/images/ideas.jpg" alt="ideas" />',
        requiredVersion: '<img src="/images/ideas.jpg" alt="Modern Bathroom Renovation Ideas Gallery" />',
        whyItMatters: "Image description keyword is missing.",
        successCheck: "Page Auditor will verify automatically.",
        keyword: "Renovation",
        state: "backlog"
      },
      {
        id: "t6",
        pageUrl: "https://www.bathroomupgrades.co.uk/cheap-bathroom-suites/",
        priority: "low",
        taskTitle: "Expand Content",
        currentVersion: "Our suites are the best quality and cheap.",
        requiredVersion: "Our range of Cheap Bathroom Suites offers luxury styling at an affordable price, perfect for any home renovation project.",
        whyItMatters: "On-page content is too thin to rank properly.",
        successCheck: "Page Auditor will verify automatically.",
        keyword: "Bathroom Suites",
        state: "backlog"
      }
    ]
  },
  {
    id: "civion",
    name: "Civion",
    url: "https://www.civion.es",
    status: "Connected",
    lastAudit: "26 Jun 2026",
    tasks: [
      {
        id: "t7",
        pageUrl: "https://www.civion.es/nie-number-application/",
        priority: "high",
        taskTitle: "Create NIE Number landing page on Civion",
        currentVersion: "<!-- No NIE Number link found on homepage -->",
        requiredVersion: '<a href="/nie-number-application/">Get your Spanish NIE Number</a>',
        whyItMatters: "Incoming internal link is missing.",
        successCheck: "Page Auditor will verify automatically.",
        keyword: "nie-number-application",
        state: "backlog"
      },
      {
        id: "t8",
        pageUrl: "https://www.civion.es/tie-card-application/",
        priority: "high",
        taskTitle: 'Add "TIE Card Application" to H1',
        currentVersion: "Apply For TIE Card",
        requiredVersion: "TIE Card Application Process in Spain",
        whyItMatters: "H1 heading is missing keywords.",
        successCheck: "Page Auditor will verify automatically.",
        keyword: "TIE Card Application",
        state: "backlog"
      },
      {
        id: "t9",
        pageUrl: "https://www.civion.es/spanish-residency-services/",
        priority: "medium",
        taskTitle: "Optimize Page Title",
        currentVersion: "<title>Residency Services - Spanish Visas</title>",
        requiredVersion: "<title>Spanish Residency Services & Visas | Civion</title>",
        whyItMatters: "The title lacks key branding and structure.",
        successCheck: "Page Auditor will verify automatically.",
        keyword: "Spanish Residency Services",
        state: "backlog"
      }
    ]
  },
  {
    id: "hf4you",
    name: "HF4You",
    url: "https://www.hf4you.co.uk",
    status: "Connected",
    lastAudit: "25 Jun 2026",
    tasks: [
      {
        id: "t10",
        pageUrl: "https://www.hf4you.co.uk/divans/",
        priority: "high",
        taskTitle: 'Add "Divan Beds" to H1 heading',
        currentVersion: "Browse Beds With Practical Storage Options",
        requiredVersion: "Divan Beds With Practical Storage Options",
        whyItMatters: "The main page heading lacks the primary target keyword.",
        successCheck: "Page Auditor will verify automatically.",
        keyword: "Divan Beds",
        state: "backlog"
      },
      {
        id: "t11",
        pageUrl: "https://www.hf4you.co.uk/mattresses/",
        priority: "medium",
        taskTitle: "Fix duplicate H1 headings",
        currentVersion: "<h1>Mattresses</h1>\n<h1>Double Mattresses</h1>",
        requiredVersion: "<h1>Double Mattresses</h1>\n<!-- Changed secondary to H2 -->",
        whyItMatters: "Only one primary H1 should represent the page title.",
        successCheck: "Page Auditor will verify automatically.",
        keyword: "Double Mattresses",
        state: "backlog"
      }
    ]
  }
];

// Workflow indicator stepper
const Stepper = ({ currentStep }) => {
  const steps = [
    { id: "website", label: "Select Website" },
    { id: "tasks", label: "Choose Task" },
    { id: "fix", label: "Edit Content" },
    { id: "verify", label: "Verify Success" }
  ];

  return (
    <div className="workflow-stepper">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        return (
          <React.Fragment key={step.id}>
            <div className={`stepper-item ${isActive ? 'active' : ''}`}>
              <div className="stepper-bubble">{index + 1}</div>
              <span className="stepper-label">{step.label}</span>
            </div>
            {index < steps.length - 1 && <div className="stepper-connector" />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default function App() {
  const [sites, setSites] = useState(INITIAL_SITES);
  const [currentView, setCurrentView] = useState("WEBSITES"); // WEBSITES, SITE_TASKS, TASK_FOCUS, EDIT
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  
  // Page Auditor Edit State
  const [editingContent, setEditingContent] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("idle"); // idle, loading, success, fail
  const [verificationError, setVerificationError] = useState("");
  const [notification, setNotification] = useState("");

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4000);
  };

  const selectedSite = sites.find(s => s.id === selectedSiteId) || null;
  const activeTask = selectedSite ? selectedSite.tasks.find(t => t.id === selectedTaskId) : null;

  const handleOpenSite = (siteId) => {
    setSelectedSiteId(siteId);
    setCurrentView("SITE_TASKS");
  };

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
            return { ...t, state: "progress" };
          }
          return t;
        });
        return { ...s, tasks: updatedTasks };
      }
      return s;
    }));
    showNotification("Task marked as In Progress.");
  };

  // Auto-paste suggestion for workers
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
      setCurrentView("SITE_TASKS");
    }
  };

  // Helper metrics
  const getOpenTasksCount = (site) => {
    return site.tasks.filter(t => t.state !== "completed").length;
  };

  const totalOpenTasks = sites.reduce((acc, s) => acc + getOpenTasksCount(s), 0);

  // Stepper state mapping
  const getStepperStep = () => {
    if (currentView === "WEBSITES") return "website";
    if (currentView === "SITE_TASKS") return "tasks";
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

      {/* Fixed top header */}
      <header className="hub-header">
        <div className="hub-brand" onClick={() => { setCurrentView("WEBSITES"); setSelectedSiteId(null); setSelectedTaskId(null); }}>
          <CheckSquare size={22} style={{ color: "var(--accent-color)" }} />
          <span>TSE Worker Portal</span>
        </div>
        <div className="user-profile">
          <User size={14} />
          <span>Sarah (SEO Assistant)</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="hub-main">
        <div className="hub-content">
          
          {/* Stepper Indicator */}
          <Stepper currentStep={getStepperStep()} />

          {/* SCREEN 1: WEBSITE DASHBOARD */}
          {currentView === "WEBSITES" && (
            <div>
              {/* Admin Onboarding Sync Banner */}
              <div style={{
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                borderRadius: '8px',
                padding: '1rem 1.25rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Server size={18} style={{ color: '#60a5fa', flexShrink: 0 }} />
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: '#e2e8f0' }}>Admin Setup Mode:</strong> Connected websites are pre-configured through the TSE Exporter Plugin. Worker profiles are read-only for onboarding setup.
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>My Work Today</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Which websites are available to work on?</p>
              </div>

              <div className="task-cards-list">
                {sites.map(site => {
                  const openTasksCount = getOpenTasksCount(site);
                  return (
                    <div key={site.id} className="task-card-item">
                      <div className="card-item-body">
                        <span className="card-website-tag" style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Connected ✓
                        </span>
                        <h3 className="card-task-title" style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>{site.name}</h3>
                        <a 
                          href={site.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ 
                            fontSize: '0.8rem', 
                            color: '#60a5fa', 
                            textDecoration: 'none', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            marginTop: '0.15rem'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {site.url} <ExternalLink size={10} />
                        </a>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>Last Audit: {site.lastAudit}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: '800', display: 'block', lineHeight: 1, color: openTasksCount > 0 ? '#fbbf24' : '#10b981' }}>
                            {openTasksCount}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Open Tasks</span>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => handleOpenSite(site.id)}>
                            Open Tasks
                          </button>
                          <a 
                            href={site.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="btn-secondary" 
                            style={{ 
                              padding: '0.5rem 1rem', 
                              fontSize: '0.8rem', 
                              textDecoration: 'none', 
                              justifyContent: 'center',
                              boxSizing: 'border-box' 
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Website ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SCREEN 2: WEBSITE TASK LIST */}
          {currentView === "SITE_TASKS" && selectedSite && (
            <div>
              <div className="mb-4">
                <span 
                  className="flex align-center gap-2 text-secondary cursor-pointer"
                  onClick={() => { setCurrentView("WEBSITES"); setSelectedSiteId(null); }}
                  style={{ fontSize: '0.9rem' }}
                >
                  <ArrowLeft size={16} /> Back to Websites
                </span>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>{selectedSite.name} Tasks</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Select an optimization task below to begin.</p>
              </div>

              {/* High Priority Tasks */}
              {selectedSite.tasks.filter(t => t.priority === "high").length > 0 && (
                <div className="backlog-section-container">
                  <div className="backlog-section-header">
                    <h3 className="section-title-custom">High Priority</h3>
                    <span className="header-pbadge badge-high">Immediate</span>
                  </div>
                  <div className="task-cards-list">
                    {selectedSite.tasks.filter(t => t.priority === "high").map(task => (
                      <div key={task.id} className="task-card-item">
                        <div className="card-item-body">
                          <h4 className="card-task-title" style={{ textDecoration: task.state === "completed" ? 'line-through' : 'none', color: task.state === "completed" ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                            {task.state === "completed" ? '✓ ' : task.state === "progress" ? '⌛ ' : '□ '}{task.taskTitle}
                          </h4>
                          {task.state === "progress" && (
                            <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 500 }}>In Progress</span>
                          )}
                        </div>
                        <div className="card-item-action">
                          {task.state === "completed" ? (
                            <span className="score-change-badge change-positive">✓ Complete</span>
                          ) : (
                            <button className="btn-primary btn-sm" onClick={() => handleStartTask(task.id)}>
                              Start Work <ChevronRight size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medium Priority Tasks */}
              {selectedSite.tasks.filter(t => t.priority === "medium").length > 0 && (
                <div className="backlog-section-container" style={{ marginTop: '2rem' }}>
                  <div className="backlog-section-header">
                    <h3 className="section-title-custom">Medium Priority</h3>
                    <span className="header-pbadge badge-medium">Standard</span>
                  </div>
                  <div className="task-cards-list">
                    {selectedSite.tasks.filter(t => t.priority === "medium").map(task => (
                      <div key={task.id} className="task-card-item">
                        <div className="card-item-body">
                          <h4 className="card-task-title" style={{ textDecoration: task.state === "completed" ? 'line-through' : 'none', color: task.state === "completed" ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                            {task.state === "completed" ? '✓ ' : task.state === "progress" ? '⌛ ' : '□ '}{task.taskTitle}
                          </h4>
                          {task.state === "progress" && (
                            <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 500 }}>In Progress</span>
                          )}
                        </div>
                        <div className="card-item-action">
                          {task.state === "completed" ? (
                            <span className="score-change-badge change-positive">✓ Complete</span>
                          ) : (
                            <button className="btn-primary btn-sm" onClick={() => handleStartTask(task.id)}>
                              Start Work <ChevronRight size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Low Priority Tasks */}
              {selectedSite.tasks.filter(t => t.priority === "low").length > 0 && (
                <div className="backlog-section-container" style={{ marginTop: '2rem' }}>
                  <div className="backlog-section-header">
                    <h3 className="section-title-custom">Low Priority</h3>
                    <span className="header-pbadge badge-low">Optional</span>
                  </div>
                  <div className="task-cards-list">
                    {selectedSite.tasks.filter(t => t.priority === "low").map(task => (
                      <div key={task.id} className="task-card-item">
                        <div className="card-item-body">
                          <h4 className="card-task-title" style={{ textDecoration: task.state === "completed" ? 'line-through' : 'none', color: task.state === "completed" ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                            {task.state === "completed" ? '✓ ' : task.state === "progress" ? '⌛ ' : '□ '}{task.taskTitle}
                          </h4>
                          {task.state === "progress" && (
                            <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 500 }}>In Progress</span>
                          )}
                        </div>
                        <div className="card-item-action">
                          {task.state === "completed" ? (
                            <span className="score-change-badge change-positive">✓ Complete</span>
                          ) : (
                            <button className="btn-primary btn-sm" onClick={() => handleStartTask(task.id)}>
                              Start Work <ChevronRight size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SCREEN 3: TASK DETAIL (TASK BRIEFING) */}
          {currentView === "TASK_FOCUS" && activeTask && selectedSite && (
            <div>
              <div className="mb-4">
                <span 
                  className="flex align-center gap-2 text-secondary cursor-pointer"
                  onClick={() => setCurrentView("SITE_TASKS")}
                  style={{ fontSize: '0.9rem' }}
                >
                  <ArrowLeft size={16} /> Back to Task List
                </span>
              </div>

              <div className="report-section" style={{ padding: '2.5rem' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                  <span className={`task-priority-badge priority-${activeTask.priority}`} style={{ float: 'right', fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}>
                    {activeTask.priority} Priority
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Website: {selectedSite.name}</span>
                  <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }}>
                    {activeTask.taskTitle}
                  </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Page URL</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', color: '#60a5fa', marginTop: '0.25rem', fontWeight: 700 }}>
                      <Globe size={18} />
                      <span style={{ wordBreak: 'break-all' }}>{activeTask.pageUrl}</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Task Title</label>
                    <div style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginTop: '0.25rem', fontWeight: 600 }}>
                      {activeTask.taskTitle}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>What to change</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '1.25rem', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#f87171', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Current Version</span>
                        <pre style={{ fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', color: '#e2e8f0', margin: 0 }}>
                          {activeTask.currentVersion}
                        </pre>
                      </div>

                      <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '1.25rem', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#34d399', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Required Version</span>
                        <pre style={{ fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', color: '#e2e8f0', margin: 0 }}>
                          {activeTask.requiredVersion}
                        </pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Why this matters</label>
                    <p style={{ fontSize: '0.95rem', color: '#d1d5db', marginTop: '0.25rem', lineHeight: 1.5 }}>
                      {activeTask.whyItMatters}
                    </p>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Success Check</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontSize: '0.95rem', marginTop: '0.25rem', fontWeight: 600 }}>
                      <CheckCircle size={16} />
                      <span>{activeTask.successCheck}</span>
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
                        {activeTask.state !== "progress" && (
                          <button 
                            className="btn-secondary"
                            onClick={() => handleMarkInProgress(activeTask.id)}
                            style={{ color: '#fbbf24', borderColor: '#fbbf24' }}
                          >
                            Mark As In Progress
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
                    </div>
                  </div>

                  {/* Right Column: Simulated WordPress Text Editor */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignCenter: 'center' }}>
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

        </div>
      </main>
    </div>
  );
}
