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
   * @returns {Promise<{success: boolean, data?: object, message?: string}>}
   */
  async retrieveSiteInformation(url, credentials) {
    return { success: true, name: "" };
  }

  /**
   * Retrieves pages from the sitemap or XML feed (if appropriate for this provider).
   * @param {string} url 
   * @returns {Promise<{success: boolean, urls?: string[], message?: string}>}
   */
  async retrieveSitemap(url) {
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
  async discoverPages(url, credentials) {
    return [];
  }
}

export class WordPressProvider extends BaseConnectionProvider {
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

  async discoverPages(url, credentials) {
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

  async discoverPages(url, credentials) {
    // Placeholder Magento page discovery implementation
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
