const API_BASE = window.location.hostname === "localhost" ? "http://localhost:3001/api" : "/api";

async function fetchThroughProxy(url, options = {}) {
  if (url.startsWith("/") || url.includes(window.location.host) || url.startsWith("http://localhost:3001") || url.startsWith("/api")) {
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

async function getAdminToken(url, username, password) {
  const paths = [
    `${url}/rest/V1/integration/admin/token`,
    `${url}/index.php/rest/V1/integration/admin/token`
  ];
  let lastError = null;
  for (const tokenUrl of paths) {
    try {
      const res = await fetchThroughProxy(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });
      if (res.ok) {
        const token = await res.json();
        if (typeof token === 'string' && token.trim().length > 0) {
          return token.trim();
        }
      }
      const text = await res.text();
      lastError = new Error(`Magento returned: ${res.status} - ${text}`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Failed to obtain Magento Admin Token");
}

export class BaseConnectionProvider {
  /**
   * Validates if the base URL matches the expected pattern/structure of the platform.
   * @param {string} url 
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async validateConnection(url) {
    return { success: true };
  }

  /**
   * Tests if the credentials are valid for this platform.
   * @param {string} url 
   * @param {object} credentials { username, password } (or token inside password)
   * @returns {Promise<{success: boolean, status: number, message: string}>}
   */
  async testCredentials(url, credentials) {
    return { success: false, status: 404, message: "Not implemented" };
  }

  /**
   * Retrieves basic site information (such as site name, platform versions, etc.).
   * @param {string} url 
   * @param {object} credentials
   * @returns {Promise<{success: boolean, name?: string, message?: string}>}
   */
  async getSiteInfo(url, credentials) {
    return { success: true, name: "" };
  }

  /**
   * Retrieves pages from the sitemap or XML feed (if appropriate for this provider).
   * @param {string} url 
   * @returns {Promise<{success: boolean, urls?: string[], message?: string}>}
   */
  async getSitemap(url) {
    return { success: false, message: "Not implemented" };
  }

  /**
   * Discovers pages (e.g. via REST API or other platform endpoints).
   * @param {string} url 
   * @param {object} credentials
   * @returns {Promise<Array<{
   *   id: string|number,
   *   url: string,
   *   title: string,
   *   h1: string,
   *   metaDescription: string,
   *   wordCount: number,
   *   bodyContent: string,
   *   modifiedAt: string,
   *   parent: string|number|null,
   *   focusKeywords: string[]
   * }>>}
   */
  async getPages(url, credentials) {
    return [];
  }

  /**
   * Returns the clean name of the platform.
   * @returns {string}
   */
  getPlatformName() {
    return "Generic";
  }
}

export class WordPressProvider extends BaseConnectionProvider {
  getPlatformName() {
    return "WordPress";
  }

  async testCredentials(url, credentials) {
    const { username, password } = credentials;
    let authHeaderValue = "";
    try {
      const basic = window.btoa(username.trim() + ":" + password.trim());
      authHeaderValue = `Basic ${basic}`;
    } catch (e) {
      return { success: false, status: 0, message: "Invalid characters in username or password." };
    }

    const urls = [
      `${url}/wp-json/wp/v2/users/me`,
      `${url}/wp-json/wp/v2/types?context=edit`,
      `${url}/?rest_route=/wp/v2/users/me`,
      `${url}/?rest_route=/wp/v2/types&context=edit`
    ];

    let lastError = null;
    for (const testUrl of urls) {
      try {
        const response = await fetchThroughProxy(testUrl, {
          method: "GET",
          headers: {
            "Authorization": authHeaderValue,
            "Content-Type": "application/json"
          }
        });
        
        if (response.status === 200) {
          return { success: true, status: 200 };
        }
        if (response.status === 401 || response.status === 403) {
          return { success: false, status: response.status, message: "Invalid WordPress Username or Application Password." };
        }
        lastError = { status: response.status, message: `Received status code ${response.status} from API endpoint.` };
      } catch (err) {
        console.error(`Error checking endpoint ${testUrl}:`, err);
        if (!lastError) {
          lastError = { status: 0, message: "Network error or CORS block. Ensure the WordPress REST API is reachable." };
        }
      }
    }
    return { success: false, status: lastError ? lastError.status : 404, message: lastError ? lastError.message : "Ensure the WordPress REST API is reachable." };
  }

  async getPages(url, credentials) {
    const { username, password } = credentials;
    const basic = window.btoa(username.trim() + ":" + password.trim());
    const endpoint = `${url}/wp-json/tse-site-exporter/v1/export`;

    const response = await fetchThroughProxy(endpoint, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${basic}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`WordPress server returned status: ${response.status}`);
    }

    const data = await response.json();
    const parsedRecords = data["full-export.json"] || [];
    if (!Array.isArray(parsedRecords)) {
      throw new Error("Invalid exporter records data received.");
    }

    return parsedRecords.map(record => ({
      id: record.id,
      url: record.url,
      title: record.seo?.title || record.content?.h1 || record.slug || "/",
      h1: record.content?.h1 || "",
      metaDescription: record.seo?.description || "",
      wordCount: record.content?.word_count || 0,
      bodyContent: record.content?.body_content || record.content?.plain_text || "",
      modifiedAt: record.modified_at || "",
      parent: record.parent_id || null,
      focusKeywords: record.seo?.focus_keywords || []
    }));
  }
}

export class MagentoProvider extends BaseConnectionProvider {
  getPlatformName() {
    return "Magento";
  }

  async testCredentials(url, credentials) {
    const { username, password } = credentials || {};
    if (!username || !password) {
      return { success: false, status: 400, message: "Magento Admin Username and Password are required." };
    }

    let token;
    try {
      token = await getAdminToken(url, username, password);
    } catch (err) {
      return { success: false, status: 401, message: `Authentication failed: ${err.message || "Failed to obtain Magento Admin Token"}` };
    }

    const authHeaderValue = `Bearer ${token}`;

    const urls = [
      `${url}/rest/V1/store/storeConfigs`,
      `${url}/index.php/rest/V1/store/storeConfigs`
    ];

    let lastError = null;
    for (const testUrl of urls) {
      try {
        const response = await fetchThroughProxy(testUrl, {
          method: "GET",
          headers: {
            "Authorization": authHeaderValue,
            "Content-Type": "application/json"
          }
        });
        
        if (response.status === 200) {
          return { success: true, status: 200 };
        }
        if (response.status === 401 || response.status === 403) {
          return { success: false, status: response.status, message: "Invalid Magento Access Token." };
        }
        lastError = { status: response.status, message: `Received status code ${response.status} from API endpoint.` };
      } catch (err) {
        console.error(`Error checking endpoint ${testUrl}:`, err);
        if (!lastError) {
          lastError = { status: 0, message: "Network error or CORS block. Ensure the Magento REST API is reachable." };
        }
      }
    }
    return { success: false, status: lastError ? lastError.status : 404, message: lastError ? lastError.message : "Ensure the Magento REST API is reachable." };
  }

  async getPages(url, credentials) {
    const { username, password } = credentials || {};
    if (!username || !password) {
      return [];
    }

    let token;
    try {
      token = await getAdminToken(url, username, password);
    } catch (err) {
      console.error("Failed to obtain Magento Admin Token during sync:", err);
      return [];
    }

    const authHeaderValue = `Bearer ${token}`;
    const pages = [];

    // Helper to recursively flatten category tree
    function flattenCategories(category, parentId = null) {
      let list = [];
      if (category.is_active) {
        list.push({
          id: category.id,
          name: category.name,
          parentId: parentId,
          level: category.level
        });
      }
      if (category.children_data && Array.isArray(category.children_data)) {
        for (const child of category.children_data) {
          list = list.concat(flattenCategories(child, category.id));
        }
      }
      return list;
    }

    // 1. Retrieve & Map Category Tree
    console.log(`[MagentoProvider] Retrieving Category Tree from: ${url}/rest/default/V1/categories`);
    try {
      const catRes = await fetchThroughProxy(`${url}/rest/default/V1/categories`, {
        method: "GET",
        headers: {
          "Authorization": authHeaderValue,
          "Content-Type": "application/json"
        }
      });
      if (catRes.ok) {
        const catData = await catRes.json();
        console.log("=== MAGENTO CATEGORY TREE ===");
        console.log(catData);
        
        const flatCategories = flattenCategories(catData);
        flatCategories.forEach(cat => {
          // Skip root category placeholders
          if (cat.id === 1 || cat.id === 2 || cat.name.toLowerCase().includes("root") || cat.name.toLowerCase() === "default category") {
            return;
          }
          
          const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const pageUrl = `${url}/${slug}`;
          
          pages.push({
            id: `category-${cat.id}`,
            url: pageUrl,
            title: `${cat.name} | Category`,
            h1: cat.name,
            metaDescription: `Browse our range of ${cat.name} products.`,
            wordCount: 0,
            bodyContent: `Magento Category: ${cat.name}`,
            modifiedAt: new Date().toISOString(),
            parent: cat.parentId && cat.parentId !== 1 && cat.parentId !== 2 ? `category-${cat.parentId}` : null,
            focusKeywords: [cat.name.toLowerCase()]
          });
        });
      } else {
        console.warn(`Failed to fetch category tree: ${catRes.status} ${catRes.statusText}`);
      }
    } catch (err) {
      console.error("Error fetching category tree:", err);
    }

    // 2. Retrieve & Map CMS Pages
    console.log(`[MagentoProvider] Retrieving CMS Pages from: ${url}/rest/default/V1/cmsPage/search`);
    try {
      const cmsRes = await fetchThroughProxy(`${url}/rest/default/V1/cmsPage/search?searchCriteria[currentPage]=1`, {
        method: "GET",
        headers: {
          "Authorization": authHeaderValue,
          "Content-Type": "application/json"
        }
      });
      if (cmsRes.ok) {
        const cmsData = await cmsRes.json();
        console.log("=== MAGENTO CMS PAGES ===");
        console.log(cmsData);
        
        if (cmsData.items && Array.isArray(cmsData.items)) {
          const detailPromises = cmsData.items.map(async (item) => {
            try {
              const detailRes = await fetchThroughProxy(`${url}/rest/default/V1/cmsPage/${item.id}`, {
                method: "GET",
                headers: {
                  "Authorization": authHeaderValue,
                  "Content-Type": "application/json"
                }
              });
              if (detailRes.ok) {
                return await detailRes.json();
              }
            } catch (e) {
              console.error(`Error fetching CMS page ${item.id} details:`, e);
            }
            return item;
          });
          
          const detailedItems = await Promise.all(detailPromises);
          detailedItems.forEach(item => {
            const isActive = item.active !== undefined ? item.active : true;
            if (!isActive) return;
            
            let path = item.identifier;
            if (path === "home") {
              path = "";
            }
            const pageUrl = path ? `${url}/${path}` : `${url}/`;
            
            const plainText = (item.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
            const wordCount = plainText ? plainText.split(/\s+/).length : 0;
            
            pages.push({
              id: `cms-${item.id}`,
              url: pageUrl,
              title: item.title || "",
              h1: item.content_heading || item.title || "",
              metaDescription: item.meta_description || "",
              wordCount: wordCount,
              bodyContent: plainText || `CMS Page: ${item.title}`,
              modifiedAt: item.update_time || item.creation_time || new Date().toISOString(),
              parent: null,
              focusKeywords: item.meta_keywords ? item.meta_keywords.split(",").map(k => k.trim()) : []
            });
          });
        }
      } else {
        console.warn(`Failed to fetch CMS pages: ${cmsRes.status} ${cmsRes.statusText}`);
      }
    } catch (err) {
      console.error("Error fetching CMS pages:", err);
    }

    console.log(`[MagentoProvider] Returning ${pages.length} mapped pages to client app.`);
    return pages;
  }
}

export class ConnectionManager {
  static getProvider(platform) {
    switch (platform) {
      case "WordPress":
        return new WordPressProvider();
      case "Magento":
        return new MagentoProvider();
      default:
        return new BaseConnectionProvider();
    }
  }
}
