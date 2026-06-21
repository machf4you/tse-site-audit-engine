import React, { useState } from 'react';
import { Activity, Search, Globe, MapPin, Briefcase, Play, Database, LineChart, PieChart, Link as LinkIcon } from 'lucide-react';

function App() {
  const [formData, setFormData] = useState({
    url: '',
    businessType: '',
    locations: '',
    services: '',
    crawlSummary: '',
    searchConsoleData: '',
    analyticsData: '',
    backlinkData: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [auditResult, setAuditResult] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [copiedAudit, setCopiedAudit] = useState(false);

  // Domain Queue State
  const [domainQueue, setDomainQueue] = useState('');

  // Batch Mode State
  const [batchInput, setBatchInput] = useState('');
  const [batchOutput, setBatchOutput] = useState([]);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLoadNextDomain = () => {
    if (!domainQueue.trim()) return;
    const lines = domainQueue.split('\n');
    let nextDomain = '';
    while (lines.length > 0 && !nextDomain) {
      nextDomain = lines.shift().trim();
    }
    
    if (nextDomain) {
      setFormData(prev => ({ 
        ...prev, 
        url: nextDomain,
        crawlSummary: '',
        searchConsoleData: '',
        analyticsData: '',
        backlinkData: ''
      }));
      setAuditResult('');
      setShowOutput(false);
      setDomainQueue(lines.join('\n'));
    }
  };

  const handleGenerate = async () => {
    setShowOutput(true);
    setIsGenerating(true);
    setAuditResult(''); // Clear previous results

    const systemInstruction = `You are an experienced SEO consultant writing a direct, neutral, and short outreach message based on real data.

Rules:
- Keep it short: 6–10 lines total.
- Remove ALL generic sections. No "SEO optimisation", "backlinks", "analytics", "search console", or anything not visible on the site.
- Do NOT output a raw data block (no "Title: ...", no "Meta: ...", no "HTTPS: ...").
- EXACTLY 2 issues only. No lists of 5 issues.
- Each issue MUST reference the actual extracted data INLINE and be specific. Only mention data if it represents a problem.
- Tone: Neutral, observational, not salesy, not pushy. Make it feel like a real manual check.
- Do NOT use labels like "Opening:", "Issues:", "Opportunity:", or "CTA:".
- Do NOT include any closing sentences like "improving these elements" or "let me know if".
- Do NOT include ANY call to action (CTA).
- You MUST format issues as bullet points starting exactly with "* ".
- You MUST include a blank line between the opening, between each bullet point, and before the closing line.
- You MUST end with the exact closing line provided.

Examples of acceptable issues:
"Your title tag is 'Plumbers in Newbury - Local Plumbing & Heating Experts', which focuses on Newbury rather than Reading, limiting visibility in that area."
"Your main heading is 'Flexiplumb', which doesn’t include any service keywords, making it less clear to both users and search engines what you offer."

Format required:
Hi, I’m Mac — I was reviewing a few [service] websites in your area and your site came up.

Thought I’d pass on a couple of quick things I noticed that could be affecting how you show up locally.

* [Specific, visible issue 1 referencing the actual data inline and its brief impact]

* [Specific, visible issue 2 referencing the actual data inline and its brief impact]

These are usually quick fixes, but they directly affect how you rank locally and how many enquiries you get.`;

    const userPrompt = `
BUSINESS:
Website: ${formData.url || 'Unknown'}
Type: ${formData.businessType || 'Unknown'}
Locations: ${formData.locations || 'Unknown'}
Services: ${formData.services || 'Unknown'}

DATA PROVIDED:

Crawl:
${formData.crawlSummary || 'No crawl data provided'}

Search Console:
${formData.searchConsoleData || 'No search data provided'}

Analytics:
${formData.analyticsData || 'No analytics data provided'}

Backlinks:
${formData.backlinkData || 'No backlink data provided'}

Instruction:
Only use the data provided. If data is missing, do not guess or invent specifics.
`;

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemInstruction,
          userPrompt,
          scrapeUrl: formData.url
        })
      });

      if (!response.ok) {
        let errorMsg = `API Error: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) errorMsg = errorData.error;
        } catch (e) {
          // ignore parsing error
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setAuditResult(data.result);
    } catch (error) {
      setAuditResult(`Failed to generate audit: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchGenerate = async () => {
    if (!batchInput.trim()) return;
    setIsBatchGenerating(true);
    setBatchOutput([]);

    const lines = batchInput.split('\n').filter(line => line.trim());
    const results = [];

    for (const line of lines) {
      const [name, email, website, service, location] = line.split(',').map(s => s ? s.trim() : '');
      if (!name || !email || !website) continue;

      const systemInstruction = `You are an experienced SEO consultant writing a direct, neutral, and short cold outreach email based on real data.

Rules:
- Keep it short: 6–10 lines total.
- Base all observations ONLY on this content. Do not guess beyond it.
- Remove ALL generic sections. No "SEO optimisation", "backlinks", "analytics", "search console", or anything not visible on the site.
- Do NOT output a raw data block (no "Title: ...", no "Meta: ...", no "HTTPS: ...").
- EXACTLY 2 issues only.
- Each issue MUST reference the actual extracted data INLINE and be specific. Only mention data if it represents a problem.
- Tone: Neutral, observational, human, not salesy, not pushy. Make it sound completely non-templated and like a real manual check.
- Do NOT use any SEO jargon, headings, or bold text labels.
- Do NOT mention backlinks, analytics, search console, or anything not visible.
- Do NOT include any closing sentences like "improving these elements" or "let me know if".
- Do NOT include ANY call to action (CTA).
- You MUST format issues as bullet points starting exactly with "* ".
- You MUST include a blank line between the opening, between each bullet point, and before the closing line.
- You MUST end with the exact closing line provided.

Examples of acceptable issues:
"Your title tag is 'Plumbers in Newbury - Local Plumbing & Heating Experts', which focuses on Newbury rather than Reading, limiting visibility in that area."
"Your main heading is 'Flexiplumb', which doesn’t include any service keywords, making it less clear to both users and search engines what you offer."

Final format required:
Hi, I’m Mac — I was reviewing a few [service] websites in your area and your site came up.

Thought I’d pass on a couple of quick things I noticed that could be affecting how you show up locally.

* [Specific, visible issue 1 referencing the actual data inline and its brief impact]

* [Specific, visible issue 2 referencing the actual data inline and its brief impact]

These are usually quick fixes, but they directly affect how you rank locally and how many enquiries you get.`;

      const userPrompt = `
Prospect Name: ${name}
Website: ${website}
Location: ${location || 'Unknown'}
Services: ${service || 'Unknown'}

Please generate the email replacing [service], [location], and the issues based on the scraped content. If the scrape failed, generate plausible issues based on common problems for this niche.`;

      try {
        const response = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ systemInstruction, userPrompt, scrapeUrl: website })
        });

        if (!response.ok) {
          throw new Error('API Error');
        }

        const data = await response.json();
        results.push({ name, email, message: data.result });
      } catch (err) {
        results.push({ name, email, message: `Error generating message: ${err.message}` });
      }

      setBatchOutput([...results]); // Update UI incrementally
    }

    setIsBatchGenerating(false);
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>TSE Audit Engine</h1>
        <p>Internal diagnostic tool for analyzing web presence and performance.</p>
      </header>

      <div className="card">
        {/* Domain Queue Scratchpad */}
        <div className="form-group" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label htmlFor="domainQueue" style={{ margin: 0, color: 'var(--text-main)' }}><Globe size={14} className="inline mr-1" /> Domain Queue (Scratchpad)</label>
            <button 
              onClick={handleLoadNextDomain} 
              disabled={!domainQueue.trim()}
              style={{ background: domainQueue.trim() ? '#10b981' : 'var(--border-color)', color: '#fff', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: domainQueue.trim() ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '0.85rem' }}
            >
              Load Next Domain ↓
            </button>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Paste your domains from Lead Finder here. Click "Load Next Domain" to pop the top one into the Website URL field below.</p>
          <textarea
            id="domainQueue"
            className="input-textarea"
            placeholder="https://site1.co.uk&#10;https://site2.co.uk"
            value={domainQueue}
            onChange={(e) => setDomainQueue(e.target.value)}
            style={{ minHeight: '100px', backgroundColor: 'var(--bg-color)' }}
          ></textarea>
        </div>

        {/* Basic Info Fields */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="url"><Globe size={14} className="inline mr-1" /> Website URL</label>
            <input
              type="text"
              id="url"
              name="url"
              placeholder="e.g., https://example.com"
              value={formData.url}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="businessType"><Activity size={14} className="inline mr-1" /> Business Type</label>
            <input
              type="text"
              id="businessType"
              name="businessType"
              placeholder="e.g., Dental Clinic, Plumber"
              value={formData.businessType}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="locations"><MapPin size={14} className="inline mr-1" /> Target Locations</label>
            <input
              type="text"
              id="locations"
              name="locations"
              placeholder="e.g., London, Manchester"
              value={formData.locations}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="services"><Briefcase size={14} className="inline mr-1" /> Services</label>
            <input
              type="text"
              id="services"
              name="services"
              placeholder="e.g., Implants, Root Canals"
              value={formData.services}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Data Textareas */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="crawlSummary"><Database size={14} className="inline mr-1" /> Crawl Summary</label>
            <textarea
              id="crawlSummary"
              name="crawlSummary"
              className="input-textarea"
              placeholder="Paste crawl summary data..."
              value={formData.crawlSummary}
              onChange={handleInputChange}
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="searchConsoleData"><LineChart size={14} className="inline mr-1" /> Search Console Data</label>
            <textarea
              id="searchConsoleData"
              name="searchConsoleData"
              className="input-textarea"
              placeholder="Paste GSC data..."
              value={formData.searchConsoleData}
              onChange={handleInputChange}
            ></textarea>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="analyticsData"><PieChart size={14} className="inline mr-1" /> Analytics Data</label>
            <textarea
              id="analyticsData"
              name="analyticsData"
              className="input-textarea"
              placeholder="Paste GA4 data..."
              value={formData.analyticsData}
              onChange={handleInputChange}
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="backlinkData"><LinkIcon size={14} className="inline mr-1" /> Backlink Data</label>
            <textarea
              id="backlinkData"
              name="backlinkData"
              className="input-textarea"
              placeholder="Paste Ahrefs/Semrush data..."
              value={formData.backlinkData}
              onChange={handleInputChange}
            ></textarea>
          </div>
        </div>

        <button
          className="btn-generate"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <><Activity className="spinner" size={20} /> Processing Prompt...</>
          ) : (
            <><Play size={20} /> Generate Audit</>
          )}
        </button>

        {showOutput && (
          <div className="output-container">
            <div className="output-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search size={20} />
                <h3 style={{ margin: 0 }}>Audit Results</h3>
              </div>
              {!isGenerating && auditResult && (
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(auditResult);
                    setCopiedAudit(true);
                    setTimeout(() => setCopiedAudit(false), 1500);
                  }}
                  style={{ background: copiedAudit ? '#10b981' : 'transparent', color: copiedAudit ? '#fff' : 'var(--text-secondary)', border: `1px solid ${copiedAudit ? '#10b981' : 'var(--border-color)'}`, padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                >
                  {copiedAudit ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
            {isGenerating ? (
              <div className="loading-indicator">
                <Activity className="spinner" size={24} />
                <span>Generating SEO insights...</span>
              </div>
            ) : (
              <textarea
                className="output-area"
                readOnly
                value={auditResult}
                aria-label="Generated Audit Output"
              ></textarea>
            )}
          </div>
        )}
      </div>

      {/* Batch Outreach Mode Section */}
      <div className="card" style={{ marginTop: '3rem' }}>
        <div className="header" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '2rem', fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>Batch Outreach Mode</h2>
          <p>Generate 10-20 personalized outreach emails at once.</p>
        </div>

        <div className="form-group">
          <label htmlFor="batchInput"><Database size={14} className="inline mr-1" /> Paste Data (Comma Separated)</label>
          <textarea
            id="batchInput"
            name="batchInput"
            className="input-textarea"
            style={{ minHeight: '150px' }}
            placeholder="Name, Email, Website, Service, Location&#10;John Smith, john@example.com, https://example.com, Plumber, London&#10;Jane Doe, jane@test.com, https://test.com, Dentist, Manchester"
            value={batchInput}
            onChange={(e) => setBatchInput(e.target.value)}
          ></textarea>
        </div>

        <button 
          className="btn-generate" 
          onClick={handleBatchGenerate}
          disabled={isBatchGenerating}
          style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
        >
          {isBatchGenerating ? (
            <><Activity className="spinner" size={20} /> Processing Batch...</>
          ) : (
            <><Play size={20} /> Generate Outreach Emails</>
          )}
        </button>

        {batchOutput.length > 0 && (
          <div className="output-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
            {batchOutput.map((item, index) => (
              <div key={index} style={{ padding: '1.5rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Name: <span style={{ fontWeight: 'normal', color: 'var(--text-secondary)' }}>{item.name}</span></p>
                <p style={{ margin: '0 0 1rem 0', fontWeight: 'bold' }}>Email: <a href={`mailto:${item.email}`} style={{ fontWeight: 'normal', color: 'var(--accent-color)', textDecoration: 'none' }}>{item.email}</a></p>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Message:</p>
                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
