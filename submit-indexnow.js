#!/usr/bin/env node

/**
 * IndexNow Submission Script
 * 
 * Submits URLs to IndexNow protocol (supported by Bing, Yandex, and others)
 * Documentation: https://www.indexnow.org/documentation
 * 
 * Usage:
 *   node submit-indexnow.js <url1> [url2] [url3] ...
 *   node submit-indexnow.js --all (submits all pages from sitemap)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { parseString } = require('xml2js');

// IndexNow Configuration
const INDEXNOW_KEY = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
const KEY_FILE = path.join(__dirname, 'indexnow-key.txt');
const SITE_HOST = 'vibecodes.space';

// IndexNow endpoints (Bing, Yandex, and other participating search engines)
const INDEXNOW_ENDPOINTS = [
    'https://www.bing.com/indexnow',
    'https://yandex.com/indexnow',
    'https://indexnow.org/indexnow'
];

// Read key from file if it exists
let indexNowKey = INDEXNOW_KEY;
if (fs.existsSync(KEY_FILE)) {
    try {
        const keyContent = fs.readFileSync(KEY_FILE, 'utf8').trim();
        if (keyContent) {
            indexNowKey = keyContent;
        }
    } catch (error) {
        console.warn('Could not read key file, using default key');
    }
}

/**
 * Submit a single URL to IndexNow
 */
function submitSingleURL(url, endpoint) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(endpoint);
        const queryParams = new URLSearchParams({
            url: url,
            key: indexNowKey
        });
        
        const options = {
            hostname: urlObj.hostname,
            path: `${urlObj.pathname}?${queryParams.toString()}`,
            method: 'GET',
            headers: {
                'User-Agent': 'IndexNow-Submitter/1.0'
            }
        };

        const protocol = urlObj.protocol === 'https:' ? https : http;

        const req = protocol.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    success: res.statusCode === 200 || res.statusCode === 202,
                    statusCode: res.statusCode,
                    endpoint: endpoint,
                    url: url
                });
            });
        });

        req.on('error', (error) => {
            reject({ success: false, error: error.message, endpoint: endpoint, url: url });
        });

        req.setTimeout(10000, () => {
            req.destroy();
            reject({ success: false, error: 'Timeout', endpoint: endpoint, url: url });
        });

        req.end();
    });
}

/**
 * Submit multiple URLs to IndexNow using POST
 */
function submitMultipleURLs(urls, endpoint) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(endpoint);
        
        const payload = JSON.stringify({
            host: SITE_HOST,
            key: indexNowKey,
            keyLocation: `https://${SITE_HOST}/indexnow-key.txt`,
            urlList: urls
        });

        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': Buffer.byteLength(payload),
                'User-Agent': 'IndexNow-Submitter/1.0'
            }
        };

        const protocol = urlObj.protocol === 'https:' ? https : http;

        const req = protocol.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    success: res.statusCode === 200 || res.statusCode === 202,
                    statusCode: res.statusCode,
                    endpoint: endpoint,
                    urlCount: urls.length
                });
            });
        });

        req.on('error', (error) => {
            reject({ success: false, error: error.message, endpoint: endpoint });
        });

        req.setTimeout(15000, () => {
            req.destroy();
            reject({ success: false, error: 'Timeout', endpoint: endpoint });
        });

        req.write(payload);
        req.end();
    });
}

/**
 * Read URLs from sitemap.xml
 */
function getURLsFromSitemap() {
    return new Promise((resolve, reject) => {
        const sitemapPath = path.join(__dirname, 'sitemap.xml');
        
        if (!fs.existsSync(sitemapPath)) {
            reject(new Error('sitemap.xml not found'));
            return;
        }

        fs.readFile(sitemapPath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            parseString(data, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }

                const urls = [];
                if (result.urlset && result.urlset.url) {
                    result.urlset.url.forEach(urlEntry => {
                        if (urlEntry.loc && urlEntry.loc[0]) {
                            urls.push(urlEntry.loc[0]);
                        }
                    });
                }
                resolve(urls);
            });
        });
    });
}

/**
 * Main submission function
 */
async function submitToIndexNow(urls) {
    console.log('🚀 Submitting to IndexNow...\n');
    console.log(`Key: ${indexNowKey}`);
    console.log(`Key Location: https://${SITE_HOST}/indexnow-key.txt\n`);

    if (urls.length === 0) {
        console.log('❌ No URLs to submit');
        return;
    }

    console.log(`📋 URLs to submit (${urls.length}):`);
    urls.forEach((url, index) => {
        console.log(`   ${index + 1}. ${url}`);
    });
    console.log('');

    const results = [];

    // Submit to each IndexNow endpoint
    for (const endpoint of INDEXNOW_ENDPOINTS) {
        try {
            console.log(`📤 Submitting to ${endpoint}...`);
            
            let result;
            if (urls.length === 1) {
                // Single URL - use GET
                result = await submitSingleURL(urls[0], endpoint);
            } else {
                // Multiple URLs - use POST
                result = await submitMultipleURLs(urls, endpoint);
            }

            results.push(result);

            if (result.success) {
                console.log(`   ✅ Success (Status: ${result.statusCode})`);
            } else {
                console.log(`   ⚠️  Status: ${result.statusCode}`);
            }
        } catch (error) {
            console.error(`   ❌ Error: ${error.error || error.message}`);
            results.push({ success: false, endpoint: endpoint, error: error.error || error.message });
        }
        console.log('');
    }

    // Summary
    console.log('='.repeat(60));
    console.log('📊 Summary:');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Successful: ${successful}/${results.length}`);
    console.log(`❌ Failed: ${failed}/${results.length}`);
    
    if (failed > 0) {
        console.log('\n⚠️  Failed endpoints:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`   - ${r.endpoint}: ${r.error || 'Unknown error'}`);
        });
    }

    console.log('\n📝 Notes:');
    console.log('   • IndexNow is supported by Bing, Yandex, and other search engines');
    console.log('   • Status 200 = Successfully submitted');
    console.log('   • Status 202 = Accepted, key validation pending');
    console.log('   • Make sure indexnow-key.txt is accessible at:');
    console.log(`     https://${SITE_HOST}/indexnow-key.txt`);
}

// Main execution
async function main() {
    const args = process.argv.slice(2);

    let urls = [];

    if (args.length === 0) {
        console.log('Usage: node submit-indexnow.js <url1> [url2] [url3] ...');
        console.log('   or: node submit-indexnow.js --all');
        process.exit(1);
    }

    if (args[0] === '--all') {
        try {
            urls = await getURLsFromSitemap();
            console.log(`📄 Found ${urls.length} URLs in sitemap.xml\n`);
        } catch (error) {
            console.error(`❌ Error reading sitemap: ${error.message}`);
            process.exit(1);
        }
    } else {
        urls = args.filter(arg => arg.startsWith('http'));
    }

    if (urls.length === 0) {
        console.error('❌ No valid URLs provided');
        process.exit(1);
    }

    await submitToIndexNow(urls);
}

// Install xml2js if needed
try {
    require('xml2js');
} catch (e) {
    console.log('⚠️  xml2js package not found. Installing...');
    console.log('   Run: npm install xml2js');
    console.log('   Or use: node submit-indexnow.js <url1> <url2> ...');
}

main().catch(console.error);
