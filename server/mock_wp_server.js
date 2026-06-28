const express = require('express');
const cors = require('cors');

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

// In-memory database state
let metaDescription = "Expert services across South East London...";
let seoTitle = "Bathroom Installation | Expert Bathroom Fitters";
let seoH1 = "Professional Bathroom Installation";

app.use((req, res, next) => {
  // Only require basic auth for REST API endpoints
  if (!req.path.startsWith('/wp-json/')) {
    return next();
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ 
      code: "rest_cannot_access", 
      message: "Only authenticated users can access.", 
      data: { status: 401 } 
    });
  }
  
  const token = authHeader.substring(6);
  const credentials = Buffer.from(token, 'base64').toString('ascii').split(':');
  const username = credentials[0];
  const password = credentials[1];
  
  if (username === "admin" && password === "wp-test-pass") {
    next();
  } else {
    return res.status(403).json({ 
      code: "rest_cannot_edit", 
      message: "Sorry, you are not allowed to access this resource.", 
      data: { status: 403 } 
    });
  }
});

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Bathroom Renovations South East London</title>
  <meta name="description" content="Affordable bathroom renovations across South East London including Sidcup, Dartford and nearby areas. Quality installations from £2,000–£10,000. Free quotes available.">
  <link rel="canonical" href="http://127.0.0.1:8080/">
</head>
<body>
  <main>
    <h1>Bathroom Renovations South East London</h1>
    <p>We provide high quality bathroom renovations.</p>
  </main>
</body>
</html>`);
});

app.get('/bathroom-installation/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>${seoTitle}</title>
  <meta name="description" content="${metaDescription}">
  <link rel="canonical" href="http://127.0.0.1:8080/bathroom-installation/">
</head>
<body>
  <main>
    <h1>${seoH1}</h1>
    <p>We provide high quality bathroom installation services. Here is some content about bathroom installation to make sure word count requirements are met.</p>
  </main>
</body>
</html>`);
});

app.get('/wp-json/tse-site-exporter/v1/export', (req, res) => {
  const manifest = {
    site_url: "http://127.0.0.1:8080",
    site_name: "Local Mock Site",
    wp_version: "6.5",
    exported_at: new Date().toISOString(),
    mode: "quick",
    options: {
      live_fetch: false,
      broken_check: false,
      include_slices: true
    },
    post_types: ["page"],
    total_records: 2,
    truncated: false,
    status_filter: "publish",
    files: ["manifest.json", "full-export.json", "internal-links.json"]
  };
  
  const records = [
    {
      id: 8,
      url: "http://127.0.0.1:8080/",
      slug: "",
      post_type: "page",
      status: "publish",
      published_at: "2026-06-22T00:00:00+00:00",
      modified_at: new Date().toISOString(),
      parent_id: 0,
      classification: "money",
      seo: {
        source: "yoast",
        title: "Bathroom Renovations South East London",
        description: "Affordable bathroom renovations across South East London including Sidcup, Dartford and nearby areas. Quality installations from £2,000–£10,000. Free quotes available.",
        focus_keywords: ["bathroom renovations"],
        canonical: "http://127.0.0.1:8080/",
        robots: {
          index: true,
          follow: true
        }
      },
      content: {
        h1: "Bathroom Renovations South East London",
        h2: [],
        h3: [],
        word_count: 600,
        plain_text: "We provide high quality bathroom renovations."
      },
      links: {
        internal: [],
        external: [],
        counts: {
          internal: 0,
          external: 0,
          self: 0
        }
      },
      media: {
        featured: null,
        images: []
      }
    },
    {
      id: 123,
      url: "http://127.0.0.1:8080/bathroom-installation/",
      slug: "bathroom-installation",
      post_type: "page",
      status: "publish",
      published_at: "2026-06-22T00:00:00+00:00",
      modified_at: new Date().toISOString(),
      parent_id: 0,
      classification: "money",
      seo: {
        source: "yoast",
        title: seoTitle,
        description: metaDescription,
        focus_keywords: ["bathroom installation"],
        canonical: "http://127.0.0.1:8080/bathroom-installation/",
        robots: {
          index: true,
          follow: true
        }
      },
      content: {
        h1: seoH1,
        h2: [],
        h3: [],
        word_count: 600,
        plain_text: "We provide high quality bathroom installation services."
      },
      links: {
        internal: [],
        external: [],
        counts: {
          internal: 0,
          external: 0,
          self: 0
        }
      },
      media: {
        featured: null,
        images: []
      }
    }
  ];
  
  res.json({
    "manifest.json": manifest,
    "full-export.json": records,
    "internal-links.json": { edges: [], anchor_text_frequency: {} }
  });
});

app.post('/wp-json/tse-site-exporter/v1/update-page', (req, res) => {
  const { post_id, field, value } = req.body;
  if (post_id !== 123) {
    return res.status(404).json({ success: false, message: "Page not found" });
  }
  
  if (field === 'meta_description') {
    metaDescription = value;
    res.json({ success: true, post_id, field, value });
  } else if (field === 'seo_title') {
    seoTitle = value;
    res.json({ success: true, post_id, field, value });
  } else if (field === 'h1') {
    seoH1 = value;
    res.json({ success: true, post_id, field, value });
  } else {
    res.status(400).json({ success: false, message: "Invalid field type" });
  }
});

app.listen(port, () => {
  console.log(`Mock WordPress Server listening at http://127.0.0.1:${port}`);
});
