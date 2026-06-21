import React, { useState } from 'react';
import { 
  CheckSquare, Play, CheckCircle, RefreshCw, ArrowLeft, 
  ExternalLink, User, Check, Server, AlertCircle, Award
} from 'lucide-react';

const INITIAL_TASKS = [
  {
    id: "t1",
    website: "HF4You",
    websiteUrl: "https://www.hf4you.co.uk",
    priority: "high",
    taskTitle: 'Add "Divan Beds" to the H1 heading',
    currentVersion: "Browse Beds With Practical Storage Options",
    requiredVersion: "Divan Beds With Practical Storage Options",
    whyItMatters: "The target phrase is missing from the main H1 heading.",
    successCheck: "Page Auditor will verify automatically.",
    keyword: "Divan Beds",
    completed: false
  },
  {
    id: "t2",
    website: "Civion",
    websiteUrl: "https://www.civion.es",
    priority: "high",
    taskTitle: "Create NIE Number landing page on Civion",
    currentVersion: "<!-- No links to NIE page found on homepage -->",
    requiredVersion: '<a href="/nie-number-application/">Get your Spanish NIE Number</a>',
    whyItMatters: "The website is missing an incoming link to the NIE number application page.",
    successCheck: "Page Auditor will verify automatically.",
    keyword: "nie-number-application",
    completed: false
  },
  {
    id: "t3",
    website: "Bathroom Upgrades",
    websiteUrl: "https://www.bathroomupgrades.co.uk",
    priority: "high",
    taskTitle: 'Add target phrase "bathroom renovations" to H1 heading',
    currentVersion: "Ideas & Inspiration",
    requiredVersion: "Bathroom Renovations & Design Ideas",
    whyItMatters: "The main page title heading is too generic and lacks the target search phrase.",
    successCheck: "Page Auditor will verify automatically.",
    keyword: "bathroom renovations",
    completed: false
  },
  {
    id: "t4",
    website: "Bathroom Upgrades",
    websiteUrl: "https://www.bathroomupgrades.co.uk",
    priority: "medium",
    taskTitle: "Add FAQ schema to Bathroom Renovations page",
    currentVersion: "<!-- No FAQ Schema Found -->",
    requiredVersion: '<script type="application/ld+json">{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": [...]\n}</script>',
    whyItMatters: "FAQ markup is missing. Structured schema is needed for rich snippet placement.",
    successCheck: "Page Auditor will verify automatically.",
    keyword: "FAQPage",
    completed: false
  },
  {
    id: "t5",
    website: "Bathroom Upgrades",
    websiteUrl: "https://www.bathroomupgrades.co.uk",
    priority: "medium",
    taskTitle: 'Add local city name "London" to page title metadata',
    currentVersion: "<title>Bathroom Fitting & Installation Experts</title>",
    requiredVersion: "<title>Bathroom Fitting & Installation Experts in London</title>",
    whyItMatters: "Geo-targeted traffic requires local city identifiers in the browser window title.",
    successCheck: "Page Auditor will verify automatically.",
    keyword: "London",
    completed: false
  },
  {
    id: "t6",
    website: "The Search Equation",
    websiteUrl: "https://page-auditor.thesearchequation.com",
    priority: "medium",
    taskTitle: 'Update main services heading to include "SEO Consultancy"',
    currentVersion: "Professional Digital Growth Services",
    requiredVersion: "Professional SEO Consultancy & Growth Services",
    whyItMatters: "The primary keyword target is missing from the service index heading.",
    successCheck: "Page Auditor will verify automatically.",
    keyword: "SEO Consultancy",
    completed: false
  },
  {
    id: "t7",
    website: "The Search Equation",
    websiteUrl: "https://page-auditor.thesearchequation.com",
    priority: "low",
    taskTitle: 'Optimize image alt text on local services page',
    currentVersion: '<img src="/images/seo-consulting.jpg" alt="SEO Services" />',
    requiredVersion: '<img src="/images/seo-consulting.jpg" alt="Local SEO Services Consultancy" />',
    whyItMatters: "Search engine image indexing requires precise keyword descriptive alt labels.",
    successCheck: "Page Auditor will verify automatically.",
    keyword: "Local SEO Services",
    completed: false
  }
];

export default function App() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [currentView, setCurrentView] = useState("BACKLOG"); // BACKLOG, FOCUS, ALL_CAUGHT_UP
  const [activeTaskId, setActiveTaskId] = useState(null);
  
  // Page Auditor Drawer State
  const [pageAuditorOpen, setPageAuditorOpen] = useState(false);
  const [editingContent, setEditingContent] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("idle"); // idle, loading, success, fail
  const [verificationError, setVerificationError] = useState("");
  const [notification, setNotification] = useState("");

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4000);
  };

  const activeTask = tasks.find(t => t.id === activeTaskId) || null;

  const handleStartWork = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setActiveTaskId(taskId);
      setEditingContent(task.currentVersion);
      setVerificationStatus("idle");
      setVerificationError("");
      setCurrentView("FOCUS");
    }
  };

  const handleLaunchPageAuditor = () => {
    if (activeTask) {
      setEditingContent(activeTask.currentVersion);
      setVerificationStatus("idle");
      setVerificationError("");
      setPageAuditorOpen(true);
    }
  };

  // Auto-paste suggestion for workers
  const handleApplySuggestion = () => {
    if (activeTask) {
      setEditingContent(activeTask.requiredVersion);
      showNotification("Suggested fix copied into editor!");
    }
  };

  const handleReAudit = () => {
    if (!activeTask) return;
    
    setVerificationStatus("loading");
    setVerificationError("");
    
    setTimeout(() => {
      // Basic verification rule: input content must contain the required keyword
      const isValid = editingContent.toLowerCase().includes(activeTask.keyword.toLowerCase());
      
      if (isValid) {
        setVerificationStatus("success");
        // Update task state to completed
        setTasks(prev => prev.map(t => {
          if (t.id === activeTask.id) {
            return { ...t, completed: true, currentVersion: editingContent };
          }
          return t;
        }));
        showNotification("Verification passed! Task completed.");
      } else {
        setVerificationStatus("fail");
        setVerificationError(`Verification Failed. The page content is missing the required target phrase "${activeTask.keyword}".`);
      }
    }, 1500);
  };

  const handleNextTask = () => {
    setPageAuditorOpen(false);
    
    // Find next incomplete task in the backlog list
    const incompleteTasks = tasks.filter(t => !t.completed && t.id !== activeTaskId);
    
    if (incompleteTasks.length > 0) {
      // Prioritize High -> Medium -> Low
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      incompleteTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      
      const nextTask = incompleteTasks[0];
      setActiveTaskId(nextTask.id);
      setEditingContent(nextTask.currentVersion);
      setVerificationStatus("idle");
      setVerificationError("");
      setCurrentView("FOCUS");
    } else {
      // Check if all tasks are complete
      const allDone = tasks.every(t => t.completed);
      if (allDone) {
        setCurrentView("ALL_CAUGHT_UP");
      } else {
        setCurrentView("BACKLOG");
      }
    }
  };

  // Helper counts
  const totalCompleted = tasks.filter(t => t.completed).length;

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
            <Server style={{ color: "#10b981" }} size={20} />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Page Editor & Auditor</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Live WordPress Sync</p>
            </div>
          </div>
          <button className="panel-close-btn" onClick={() => setPageAuditorOpen(false)}>×</button>
        </div>
        
        {activeTask && (
          <div className="panel-content">
            <div className="mb-4">
              <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-secondary)" }}>Website Link</label>
              <div style={{ backgroundColor: 'var(--bg-color)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                <span className="text-bold" style={{ color: '#60a5fa' }}>{activeTask.website}</span>
                <span style={{ color: 'var(--text-secondary)', marginLeft: '8px', fontSize: '0.75rem' }}>({activeTask.websiteUrl})</span>
              </div>
            </div>

            <div className="report-section" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
              <div className="flex justify-between align-center mb-2">
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>WordPress Text Editor</h4>
                <button className="btn-secondary btn-sm" onClick={handleApplySuggestion}>
                  Copy Suggested Fix
                </button>
              </div>
              
              <div className="mb-4">
                <textarea 
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  disabled={verificationStatus === "loading" || verificationStatus === "success"}
                  rows={4}
                  style={{ 
                    width: '100%',
                    backgroundColor: '#07090b', padding: '0.75rem', borderRadius: '6px', 
                    fontFamily: 'monospace', fontSize: '0.85rem', color: '#f3f4f6',
                    border: '1px solid var(--border-color)', resize: 'vertical'
                  }}
                />
              </div>

              {verificationStatus === "loading" && (
                <div className="text-center mt-4">
                  <RefreshCw className="inline animate-spin mr-2" style={{ color: "#3b82f6" }} size={20} />
                  <span style={{ fontSize: '0.9rem', color: '#60a5fa' }}>Running automated success checks...</span>
                </div>
              )}

              {verificationStatus === "fail" && (
                <div className="verification-alert mt-4" style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '6px', padding: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '8px',
                  color: '#f87171', fontSize: '0.8rem'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Verification Failed</strong>
                    <p style={{ marginTop: '0.15rem' }}>{verificationError}</p>
                  </div>
                </div>
              )}

              {verificationStatus === "success" && (
                <div className="text-center mt-4" style={{ color: "#34d399", fontWeight: "600", fontSize: '0.95rem' }}>
                  <CheckCircle className="inline mr-2" size={18} /> ✓ Task Complete!
                </div>
              )}
            </div>
          </div>
        )}

        <div className="panel-footer flex gap-2">
          {verificationStatus === "success" ? (
            <button className="btn-primary w-full" onClick={handleNextTask} style={{ justifyContent: 'center' }}>
              Next Task
            </button>
          ) : (
            <button 
              className="btn-primary w-full" 
              disabled={verificationStatus === "loading"}
              onClick={handleReAudit}
              style={{ justifyContent: 'center' }}
            >
              <Check size={16} /> Re-Audit Page
            </button>
          )}
        </div>
      </div>

      {/* Header Panel */}
      <header className="hub-header">
        <div className="hub-brand" onClick={() => { setCurrentView("BACKLOG"); setActiveTaskId(null); }}>
          <CheckSquare size={24} style={{ color: "var(--accent-color)" }} />
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
          
          {/* VIEW: WORKER BACKLOG (MY WORK TODAY) */}
          {currentView === "BACKLOG" && (
            <div>
              <div className="work-summary-card" style={{ marginBottom: '2.5rem' }}>
                <div className="summary-left">
                  <div className="summary-title-row">
                    <h3>My Work Today</h3>
                  </div>
                  <div className="summary-metrics">
                    <div className="metric-large">
                      <span className="metric-number">{tasks.filter(t => !t.completed).length}</span>
                      <span className="metric-label">Tasks Remaining</span>
                    </div>
                    <div className="metric-pills">
                      <span className="metric-pill prio-high">
                        {tasks.filter(t => !t.completed && t.priority === "high").length} High
                      </span>
                      <span className="metric-pill prio-medium">
                        {tasks.filter(t => !t.completed && t.priority === "medium").length} Medium
                      </span>
                      <span className="metric-pill prio-low">
                        {tasks.filter(t => !t.completed && t.priority === "low").length} Low
                      </span>
                    </div>
                  </div>
                </div>
                <div className="summary-right">
                  <button 
                    className="btn-primary start-working-btn" 
                    disabled={tasks.every(t => t.completed)}
                    onClick={() => {
                      // Find first incomplete task
                      const firstIncomplete = tasks.find(t => !t.completed);
                      if (firstIncomplete) handleStartWork(firstIncomplete.id);
                    }}
                  >
                    <Play size={16} /> Start Work
                  </button>
                </div>
              </div>

              {/* High Priority Tasks */}
              <div className="report-section" style={{ borderTop: '4px solid #ef4444' }}>
                <h3 className="section-title-custom mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>High Priority</span>
                  <span className="header-pbadge badge-high">Immediate</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tasks.filter(t => t.priority === "high").map(task => (
                    <div key={task.id} className="workspace-task-item">
                      <div className="task-item-left">
                        <div className="task-item-content">
                          <span className="task-item-title" style={{ textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                            {task.taskTitle}
                          </span>
                          <span className="task-item-site">on {task.website}</span>
                        </div>
                      </div>
                      {task.completed ? (
                        <span className="score-change-badge change-positive">✓ Done</span>
                      ) : (
                        <button className="btn-primary btn-sm" onClick={() => handleStartWork(task.id)}>
                          Start Work
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Medium Priority Tasks */}
              <div className="report-section" style={{ borderTop: '4px solid #f59e0b', marginTop: '2rem' }}>
                <h3 className="section-title-custom mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Medium Priority</span>
                  <span className="header-pbadge badge-medium">Standard</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tasks.filter(t => t.priority === "medium").map(task => (
                    <div key={task.id} className="workspace-task-item">
                      <div className="task-item-left">
                        <div className="task-item-content">
                          <span className="task-item-title" style={{ textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                            {task.taskTitle}
                          </span>
                          <span className="task-item-site">on {task.website}</span>
                        </div>
                      </div>
                      {task.completed ? (
                        <span className="score-change-badge change-positive">✓ Done</span>
                      ) : (
                        <button className="btn-primary btn-sm" onClick={() => handleStartWork(task.id)}>
                          Start Work
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Low Priority Tasks */}
              <div className="report-section" style={{ borderTop: '4px solid #94a3b8', marginTop: '2rem' }}>
                <h3 className="section-title-custom mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Low Priority</span>
                  <span className="header-pbadge badge-low">Optional</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tasks.filter(t => t.priority === "low").map(task => (
                    <div key={task.id} className="workspace-task-item">
                      <div className="task-item-left">
                        <div className="task-item-content">
                          <span className="task-item-title" style={{ textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                            {task.taskTitle}
                          </span>
                          <span className="task-item-site">on {task.website}</span>
                        </div>
                      </div>
                      {task.completed ? (
                        <span className="score-change-badge change-positive">✓ Done</span>
                      ) : (
                        <button className="btn-primary btn-sm" onClick={() => handleStartWork(task.id)}>
                          Start Work
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: WORKER TASK FOCUS SCREEN */}
          {currentView === "FOCUS" && activeTask && (
            <div>
              <div className="mb-4">
                <span 
                  className="flex align-center gap-2 text-secondary cursor-pointer"
                  onClick={() => setCurrentView("BACKLOG")}
                  style={{ fontSize: '0.9rem' }}
                >
                  <ArrowLeft size={16} /> Back to Backlog
                </span>
              </div>

              <div className="report-section" style={{ padding: '2rem' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                  <span className={`task-priority-badge priority-${activeTask.priority}`} style={{ float: 'right', fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}>
                    {activeTask.priority} Priority
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Active Task on {activeTask.website}</span>
                  <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }}>
                    {activeTask.taskTitle}
                  </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>What needs fixing</label>
                    <div style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginTop: '0.25rem', fontWeight: 500 }}>
                      {activeTask.taskTitle}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                      <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#f87171', fontWeight: 600 }}>Current Version</label>
                      <pre style={{ fontFamily: 'monospace', fontSize: '0.85rem', marginTop: '0.5rem', whiteSpace: 'pre-wrap', color: '#cbd5e1' }}>
                        {activeTask.currentVersion}
                      </pre>
                    </div>

                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                      <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#34d399', fontWeight: 600 }}>Required Version</label>
                      <pre style={{ fontFamily: 'monospace', fontSize: '0.85rem', marginTop: '0.5rem', whiteSpace: 'pre-wrap', color: '#cbd5e1' }}>
                        {activeTask.requiredVersion}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Why this matters</label>
                    <p style={{ fontSize: '0.9rem', color: '#d1d5db', marginTop: '0.25rem' }}>
                      {activeTask.whyItMatters}
                    </p>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>How success is measured</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontSize: '0.9rem', marginTop: '0.25rem', fontWeight: 500 }}>
                      <CheckCircle size={16} />
                      <span>{activeTask.successCheck}</span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    {activeTask.completed ? (
                      <div className="flex align-center gap-4">
                        <span style={{ color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle size={18} /> ✓ Task Complete
                        </span>
                        <button className="btn-primary" onClick={handleNextTask}>
                          Next Task
                        </button>
                      </div>
                    ) : (
                      <button className="btn-primary start-working-btn" style={{ padding: '0.75rem 2rem' }} onClick={handleLaunchPageAuditor}>
                        Launch Page Auditor
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: ALL CAUGHT UP SCREEN */}
          {currentView === "ALL_CAUGHT_UP" && (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ 
                width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1.5rem'
              }}>
                <Award size={48} style={{ color: '#10b981' }} />
              </div>
              <h2 style={{ fontFamily: 'Outfit', fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>All Caught Up!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.5rem', marginBottom: '2rem' }}>
                You have resolved all pre-assigned optimization tasks for today. Outstanding work!
              </p>
              <button className="btn-primary" onClick={() => { setCurrentView("BACKLOG"); setActiveTaskId(null); }}>
                Back to Backlog
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
