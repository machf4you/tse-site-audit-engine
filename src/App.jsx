import React, { useState } from 'react';
import { 
  CheckSquare, Play, CheckCircle, RefreshCw, ArrowLeft, 
  ExternalLink, User, Check, Server, AlertCircle, Award, ChevronRight
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

// Workflow indicator stepper
const Stepper = ({ currentStep }) => {
  const steps = [
    { id: "select", label: "Select Task" },
    { id: "change", label: "Make Change" },
    { id: "verify", label: "Verify" },
    { id: "complete", label: "Complete" }
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
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [currentView, setCurrentView] = useState("BACKLOG"); // BACKLOG, FOCUS, EDIT, ALL_CAUGHT_UP
  const [activeTaskId, setActiveTaskId] = useState(null);
  
  // Page Auditor Edit State
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

  const handleBeginFix = () => {
    if (activeTask) {
      setEditingContent(activeTask.currentVersion);
      setVerificationStatus("idle");
      setVerificationError("");
      setCurrentView("EDIT");
    }
  };

  // Auto-paste suggestion for workers
  const handleApplySuggestion = () => {
    if (activeTask) {
      setEditingContent(activeTask.requiredVersion);
      showNotification("Suggested text copied into editor!");
    }
  };

  const handleVerifyChange = () => {
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
        showNotification("Verification passed! Task complete.");
      } else {
        setVerificationStatus("fail");
        setVerificationError(`Verification Failed. The page content is missing the required target phrase "${activeTask.keyword}".`);
      }
    }, 1500);
  };

  const handleNextTask = () => {
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

  // Helper metrics
  const pendingTasks = tasks.filter(t => !t.completed);

  // Stepper state mapping
  const getStepperStep = () => {
    if (currentView === "BACKLOG" || currentView === "FOCUS") return "select";
    if (currentView === "EDIT") {
      if (verificationStatus === "loading") return "verify";
      if (verificationStatus === "success") return "complete";
      return "change";
    }
    return "complete";
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
        <div className="hub-brand" onClick={() => { setCurrentView("BACKLOG"); setActiveTaskId(null); }}>
          <CheckSquare size={22} style={{ color: "var(--accent-color)" }} />
          <span>TSE Worker Portal</span>
        </div>
        <div className="user-profile">
          <User size={14} />
          <span>Sarah (SEO Assistant)</span>
        </div>
      </header>

      {/* Main Content Area (With header margin spacing) */}
      <main className="hub-main">
        <div className="hub-content">
          
          {/* Stepper Indicator */}
          {currentView !== "ALL_CAUGHT_UP" && (
            <Stepper currentStep={getStepperStep()} />
          )}

          {/* VIEW: WORKER BACKLOG (MY WORK TODAY) */}
          {currentView === "BACKLOG" && (
            <div>
              <div className="work-summary-card">
                <div className="summary-left">
                  <div className="summary-title-row">
                    <h3>My Work Today</h3>
                  </div>
                  <div className="summary-metrics">
                    <div className="metric-large">
                      <span className="metric-number">{pendingTasks.length}</span>
                      <span className="metric-label">Tasks Remaining</span>
                    </div>
                    <div className="metric-pills">
                      <span className="metric-pill prio-high">
                        {pendingTasks.filter(t => t.priority === "high").length} High
                      </span>
                      <span className="metric-pill prio-medium">
                        {pendingTasks.filter(t => t.priority === "medium").length} Medium
                      </span>
                      <span className="metric-pill prio-low">
                        {pendingTasks.filter(t => t.priority === "low").length} Low
                      </span>
                    </div>
                  </div>
                </div>
                <div className="summary-right">
                  <button 
                    className="btn-primary start-working-btn" 
                    disabled={pendingTasks.length === 0}
                    onClick={() => {
                      const firstIncomplete = tasks.find(t => !t.completed);
                      if (firstIncomplete) handleStartWork(firstIncomplete.id);
                    }}
                  >
                    <Play size={16} /> Begin Fixes
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '2.5rem' }}>
                <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>My Tasks</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Select a task card below to get started.</p>
              </div>

              {/* High Priority Tasks */}
              <div className="backlog-section-container">
                <div className="backlog-section-header">
                  <h3 className="section-title-custom">High Priority</h3>
                  <span className="header-pbadge badge-high">Immediate Attention</span>
                </div>
                <div className="task-cards-list">
                  {tasks.filter(t => t.priority === "high").map(task => (
                    <div key={task.id} className="task-card-item">
                      <div className="card-item-body">
                        <span className="card-website-tag">{task.website}</span>
                        <h4 className="card-task-title" style={{ textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                          {task.taskTitle}
                        </h4>
                      </div>
                      <div className="card-item-action">
                        {task.completed ? (
                          <span className="score-change-badge change-positive">✓ Complete</span>
                        ) : (
                          <button className="btn-primary btn-sm" onClick={() => handleStartWork(task.id)}>
                            Start Work <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medium Priority Tasks */}
              <div className="backlog-section-container" style={{ marginTop: '2rem' }}>
                <div className="backlog-section-header">
                  <h3 className="section-title-custom">Medium Priority</h3>
                  <span className="header-pbadge badge-medium">Standard Backlog</span>
                </div>
                <div className="task-cards-list">
                  {tasks.filter(t => t.priority === "medium").map(task => (
                    <div key={task.id} className="task-card-item">
                      <div className="card-item-body">
                        <span className="card-website-tag">{task.website}</span>
                        <h4 className="card-task-title" style={{ textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                          {task.taskTitle}
                        </h4>
                      </div>
                      <div className="card-item-action">
                        {task.completed ? (
                          <span className="score-change-badge change-positive">✓ Complete</span>
                        ) : (
                          <button className="btn-primary btn-sm" onClick={() => handleStartWork(task.id)}>
                            Start Work <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Low Priority Tasks */}
              <div className="backlog-section-container" style={{ marginTop: '2rem' }}>
                <div className="backlog-section-header">
                  <h3 className="section-title-custom">Low Priority</h3>
                  <span className="header-pbadge badge-low">Optional Optimisations</span>
                </div>
                <div className="task-cards-list">
                  {tasks.filter(t => t.priority === "low").map(task => (
                    <div key={task.id} className="task-card-item">
                      <div className="card-item-body">
                        <span className="card-website-tag">{task.website}</span>
                        <h4 className="card-task-title" style={{ textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                          {task.taskTitle}
                        </h4>
                      </div>
                      <div className="card-item-action">
                        {task.completed ? (
                          <span className="score-change-badge change-positive">✓ Complete</span>
                        ) : (
                          <button className="btn-primary btn-sm" onClick={() => handleStartWork(task.id)}>
                            Start Work <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
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

              <div className="report-section" style={{ padding: '2.5rem' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                  <span className={`task-priority-badge priority-${activeTask.priority}`} style={{ float: 'right', fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}>
                    {activeTask.priority} Priority
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Active Task on {activeTask.website}</span>
                  <h2 style={{ fontFamily: 'Outfit', fontSize: '1.85rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }}>
                    {activeTask.taskTitle}
                  </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>What am I fixing?</label>
                    <div style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '0.25rem', fontWeight: 700 }}>
                      {activeTask.taskTitle}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>What do I change?</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '1.25rem', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#f87171', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Current Version</span>
                        <pre style={{ fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', color: '#e2e8f0', margin: 0 }}>
                          {activeTask.currentVersion}
                        </pre>
                      </div>

                      <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '1.25rem', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#34d399', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Required Version</span>
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
                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>How do I verify it?</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontSize: '0.95rem', marginTop: '0.25rem', fontWeight: 600 }}>
                      <CheckCircle size={16} />
                      <span>{activeTask.successCheck}</span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.75rem', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
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
                      <button className="btn-primary start-working-btn" style={{ padding: '0.85rem 2.25rem' }} onClick={handleBeginFix}>
                        Begin Fix
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: FULL SCREEN EDIT & VERIFY WORKSPACE */}
          {currentView === "EDIT" && activeTask && (
            <div>
              <div className="mb-4">
                <button 
                  className="flex align-center gap-2 text-secondary cursor-pointer"
                  disabled={verificationStatus === "loading" || verificationStatus === "success"}
                  onClick={() => setCurrentView("FOCUS")}
                  style={{ background: 'none', border: 'none', fontSize: '0.9rem', color: 'var(--text-secondary)' }}
                >
                  <ArrowLeft size={16} /> Back to Task Details
                </button>
              </div>

              <div className="report-section" style={{ padding: '2.5rem' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '2rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>WordPress Editor Synchronization</span>
                  <h2 style={{ fontFamily: 'Outfit', fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                    Editing Content on {activeTask.website}
                  </h2>
                </div>

                <div className="editing-workspace-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                  
                  {/* Left Column: Context Briefing */}
                  <div>
                    <h3 className="section-title-custom mb-3" style={{ fontSize: '1.05rem' }}>Task Instructions</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Instruction</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{activeTask.taskTitle}</span>
                      </div>

                      <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#34d399', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Suggested Content</span>
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
                            Page Auditor has verified your changes match the required keywords.
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

          {/* VIEW: ALL CAUGHT UP SCREEN */}
          {currentView === "ALL_CAUGHT_UP" && (
            <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
              <div style={{ 
                width: '90px', height: '90px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.08)', 
                display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1.75rem',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <Award size={48} style={{ color: '#10b981' }} />
              </div>
              <h2 style={{ fontFamily: 'Outfit', fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>All Caught Up!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.5rem', marginBottom: '2.5rem' }}>
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
