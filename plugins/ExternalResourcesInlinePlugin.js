const https = require('https');
const http = require('http');

class ExternalResourcesInlinePlugin {
  constructor(options = {}) {
    this.options = options || {};
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('ExternalResourcesInlinePlugin', (compilation) => {
      const HtmlWebpackPlugin = require('html-webpack-plugin');
      
      if (HtmlWebpackPlugin.getHooks) {
        HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
          'ExternalResourcesInlinePlugin',
          async (data, cb) => {
            try {
              let html = data.html;
              
              console.log('🔄 Processing external resources...');
              
              // Process external Google Fonts links in HTML
              html = await this.processExternalGoogleFonts(html);
              
              // Process external JavaScript files
              html = await this.processExternalScripts(html);
              
              // Process external CSS files
              html = await this.processExternalCSS(html);

              console.log('✅ Finished processing external resources');
              console.log(`📊 Final file size: ${Math.round(html.length / 1024)}KB`);
              
              data.html = html;
              cb(null, data);
            } catch (error) {
              console.warn('❌ Failed to process external resources:', error.message);
              cb(null, data);
            }
          }
        );
      }
    });
  }

  async processExternalGoogleFonts(html) {
    const googleFontsRegex = /<link[^>]*href=['"](https:\/\/fonts\.googleapis\.com\/css[^'"]*)['"][^>]*>/g;
    let match;
    let processedHtml = html;
    const matches = [];
    
    // Collect all matches first to avoid regex issues
    while ((match = googleFontsRegex.exec(html)) !== null) {
      matches.push({
        fullMatch: match[0],
        url: match[1]
      });
    }
    
    for (const matchData of matches) {
      const fontUrl = matchData.url;
      console.log(`🔤 Processing Google Fonts: ${fontUrl}`);
      
      try {
        const fontCss = await this.fetchUrl(fontUrl);
        const fontUrls = this.extractFontUrls(fontCss);
        const inlinedCss = await this.inlineFontFiles(fontCss, fontUrls);
        
        // Replace the link tag with inline styles
        processedHtml = processedHtml.replace(matchData.fullMatch, `<style type="text/css">${inlinedCss}</style>`);
        console.log(`✅ Successfully inlined Google Fonts (${Math.round(inlinedCss.length / 1024)}KB)`);
      } catch (error) {
        console.warn(`❌ Failed to process Google Fonts ${fontUrl}:`, error.message);
      }
    }
    
    return processedHtml;
  }

  async processExternalScripts(html) {
    // Updated regex to handle scripts with additional attributes like data-source, data-exports-type
    const scriptRegex = /<script[^>]*src=['"](https?:\/\/[^'"]*)['"][^>]*><\/script>/g;
    let match;
    let processedHtml = html;
    const matches = [];
    
    // Collect all matches first
    while ((match = scriptRegex.exec(html)) !== null) {
      matches.push({
        fullMatch: match[0],
        url: match[1]
      });
    }
    
    for (const matchData of matches) {
      const scriptUrl = matchData.url;
      console.log(`📜 Processing external script: ${scriptUrl}`);
      console.log(`📋 Original tag: ${matchData.fullMatch}`);
      
      try {
        const scriptContent = await this.fetchUrl(scriptUrl);
        
        // Create inline script without the extra attributes
        const inlineScript = `<script type="text/javascript">${scriptContent}</script>`;
        
        // Replace the external script with inline script
        processedHtml = processedHtml.replace(matchData.fullMatch, inlineScript);
        console.log(`✅ Successfully inlined script (${Math.round(scriptContent.length / 1024)}KB)`);
      } catch (error) {
        console.warn(`❌ Failed to process script ${scriptUrl}:`, error.message);
      }
    }
    
    return processedHtml;
  }

  async processExternalCSS(html) {
    // Updated regex to handle link tags with additional attributes like data-version, data-exports-type
    const cssRegex = /<link[^>]*href=['"](https?:\/\/[^'"]*\.css[^'"]*)['"][^>]*>/g;
    let match;
    let processedHtml = html;
    const matches = [];
    
    // Collect all matches first
    while ((match = cssRegex.exec(html)) !== null) {
      // Skip Google Fonts (already processed)
      if (!match[1].includes('fonts.googleapis.com')) {
        matches.push({
          fullMatch: match[0],
          url: match[1]
        });
      }
    }
    
    for (const matchData of matches) {
      const cssUrl = matchData.url;
      console.log(`🎨 Processing external CSS: ${cssUrl}`);
      console.log(`📋 Original tag: ${matchData.fullMatch}`);
      
      try {
        const cssContent = await this.fetchUrl(cssUrl);
        const inlineStyle = `<style type="text/css">${cssContent}</style>`;
        
        // Replace the external CSS with inline styles
        processedHtml = processedHtml.replace(matchData.fullMatch, inlineStyle);
        console.log(`✅ Successfully inlined CSS (${Math.round(cssContent.length / 1024)}KB)`);
      } catch (error) {
        console.warn(`❌ Failed to process CSS ${cssUrl}:`, error.message);
      }
    }
    
    return processedHtml;
  }

  fetchUrl(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;
      const options = {
        headers: {
          'User-Agent': this.userAgent
        }
      };

      protocol.get(url, options, (res) => {
        // Handle redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return this.fetchUrl(res.headers.location).then(resolve).catch(reject);
        }

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      }).on('error', reject);
    });
  }

  extractFontUrls(css) {
    const urlRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
    const urls = [];
    let match;
    
    while ((match = urlRegex.exec(css)) !== null) {
      urls.push(match[1]);
    }
    
    return Array.from(new Set(urls)); // Remove duplicates
  }

  async inlineFontFiles(css, fontUrls) {
    if (fontUrls.length === 0) {
      return css;
    }

    console.log(`🔤 Downloading ${fontUrls.length} font files...`);

    const fontPromises = fontUrls.map(async (url) => {
      try {
        const fontData = await this.fetchBinaryUrl(url);
        const base64 = fontData.toString('base64');
        const mimeType = this.getMimeType(url);
        console.log(`   ✓ Font file: ${Math.round(base64.length / 1024)}KB`);
        return { url, dataUrl: `data:${mimeType};base64,${base64}` };
      } catch (error) {
        console.warn(`❌ Failed to download font file ${url}:`, error.message);
        return { url, dataUrl: url }; // Fallback to original URL
      }
    });

    const fontMappings = await Promise.all(fontPromises);
    
    let inlinedCss = css;
    fontMappings.forEach(mapping => {
      const { url, dataUrl } = mapping;
      // Escape special regex characters in URL
      const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      inlinedCss = inlinedCss.replace(new RegExp(escapedUrl, 'g'), dataUrl);
    });

    return inlinedCss;
  }

  fetchBinaryUrl(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;
      const options = {
        headers: {
          'User-Agent': this.userAgent
        }
      };

      protocol.get(url, options, (res) => {
        // Handle redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return this.fetchBinaryUrl(res.headers.location).then(resolve).catch(reject);
        }

        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(Buffer.concat(chunks));
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      }).on('error', reject);
    });
  }

  getMimeType(url) {
    if (url.includes('.woff2')) return 'font/woff2';
    if (url.includes('.woff')) return 'font/woff';
    if (url.includes('.ttf')) return 'font/ttf';
    if (url.includes('.eot')) return 'application/vnd.ms-fontobject';
    return 'font/woff2'; // Default
  }
}

module.exports = ExternalResourcesInlinePlugin;