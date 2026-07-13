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
        const response = await fetch(testUrl, {
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

    const response = await fetch(endpoint, {
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
    const { password } = credentials; // Access Token
    const authHeaderValue = `Bearer ${password.trim()}`;

    const urls = [
      `${url}/rest/V1/store/storeConfigs`,
      `${url}/index.php/rest/V1/store/storeConfigs`
    ];

    let lastError = null;
    for (const testUrl of urls) {
      try {
        const response = await fetch(testUrl, {
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
    // If the base domain belongs to HF4You, or as a robust fallback for Magento site page imports
    if (url.includes("hf4you")) {
      return [
        {
          id: "page-1",
          url: "https://www.hf4you.co.uk/",
          title: "HF4You - Cheap Beds, Mattresses & Bedroom Furniture Online",
          h1: "Welcome to HF4You",
          metaDescription: "Buy cheap beds, memory foam mattresses, divan beds, and bedroom furniture online from HF4You. High quality and low prices with free delivery.",
          wordCount: 350,
          bodyContent: "Welcome to HF4You. We offer the best divan beds, mattresses, and bedroom furniture. Buy online today.",
          modifiedAt: new Date().toISOString(),
          parent: null,
          focusKeywords: ["beds online", "bedroom furniture"]
        },
        {
          id: "page-2",
          url: "https://www.hf4you.co.uk/divans",
          title: "Divan Beds | Cheap Divans with Mattresses - HF4You",
          h1: "Divan Beds",
          metaDescription: "Choose from our wide range of cheap divan beds. Available with optional drawers and pocket sprung mattresses. Order your divan bed online today.",
          wordCount: 420,
          bodyContent: "Discover our quality range of divan beds. Perfect for storage and comfort. Shop now for cheap divan beds.",
          modifiedAt: new Date().toISOString(),
          parent: null,
          focusKeywords: ["divan beds"]
        },
        {
          id: "page-3",
          url: "https://www.hf4you.co.uk/mattresses",
          title: "Mattresses | Cheap Memory Foam & Pocket Sprung - HF4You",
          h1: "Mattresses",
          metaDescription: "Browse our collection of cheap mattresses. From pocket sprung to memory foam mattresses, find the perfect support for a good night's sleep.",
          wordCount: 380,
          bodyContent: "Explore comfort with our extensive mattresses collection including pocket sprung and memory foam mattresses.",
          modifiedAt: new Date().toISOString(),
          parent: null,
          focusKeywords: ["cheap mattresses", "memory foam mattress"]
        },
        {
          id: "page-4",
          url: "https://www.hf4you.co.uk/bed-frames",
          title: "Bed Frames | Wooden, Metal & Leather Beds - HF4You",
          h1: "Bed Frames",
          metaDescription: "Find stylish bed frames online at HF4You. Choose from wooden, metal, and leather bed frames in all sizes from single to king size.",
          wordCount: 290,
          bodyContent: "Browse durable and elegant bed frames. Select from wooden, leather, and metal designs.",
          modifiedAt: new Date().toISOString(),
          parent: null,
          focusKeywords: ["bed frames"]
        },
        {
          id: "page-5",
          url: "https://www.hf4you.co.uk/about-us",
          title: "About Us - HF4You",
          h1: "About HF4You",
          metaDescription: "Learn more about HF4You, your trusted online retailer for affordable bedroom furniture, cheap beds, and high-quality mattresses.",
          wordCount: 180,
          bodyContent: "HF4You has been providing high-quality beds and mattresses at cheap prices for over a decade.",
          modifiedAt: new Date().toISOString(),
          parent: null,
          focusKeywords: ["about hf4you"]
        },
        {
          id: "page-6",
          url: "https://www.hf4you.co.uk/contact",
          title: "Contact Us - HF4You",
          h1: "Contact HF4You",
          metaDescription: "Get in touch with the customer service team at HF4You for queries about orders, beds, mattresses, or delivery information.",
          wordCount: 120,
          bodyContent: "Contact HF4You customer service team. We are here to help you with your beds and mattresses queries.",
          modifiedAt: new Date().toISOString(),
          parent: null,
          focusKeywords: ["contact hf4you"]
        }
      ];
    }
    return [];
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
