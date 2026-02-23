#!/usr/bin/env node

/**
 * Ping Search Engines Script
 * 
 * This script notifies Google and Bing that your sitemap has been updated.
 * Note: This is a notification only - you still need to verify ownership
 * in Google Search Console and Bing Webmaster Tools for full indexing.
 * 
 * Usage: node ping-search-engines.js
 */

const https = require('https');
const http = require('http');

const SITEMAP_URL = 'https://vibecodes.space/sitemap.xml';
const SITE_URL = 'https://vibecodes.space';

// Google Ping URL
const GOOGLE_PING_URL = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;

// Bing Ping URL
const BING_PING_URL = `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;

function pingSearchEngine(url, engineName) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SitemapPing/1.0)'
            }
        };

        const protocol = urlObj.protocol === 'https:' ? https : http;

        const req = protocol.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`✅ ${engineName}: Successfully pinged (Status: ${res.statusCode})`);
                    resolve({ success: true, statusCode: res.statusCode, engine: engineName });
                } else {
                    console.log(`⚠️  ${engineName}: Received status ${res.statusCode}`);
                    resolve({ success: false, statusCode: res.statusCode, engine: engineName });
                }
            });
        });

        req.on('error', (error) => {
            console.error(`❌ ${engineName}: Error pinging - ${error.message}`);
            reject({ success: false, error: error.message, engine: engineName });
        });

        req.setTimeout(10000, () => {
            req.destroy();
            console.error(`❌ ${engineName}: Request timeout`);
            reject({ success: false, error: 'Timeout', engine: engineName });
        });

        req.end();
    });
}

async function main() {
    console.log('🚀 Pinging Search Engines...\n');
    console.log(`Sitemap URL: ${SITEMAP_URL}\n`);

    const results = [];

    try {
        // Ping Google
        console.log('📊 Pinging Google...');
        const googleResult = await pingSearchEngine(GOOGLE_PING_URL, 'Google');
        results.push(googleResult);
    } catch (error) {
        console.error('Failed to ping Google:', error);
        results.push({ success: false, engine: 'Google', error: error.message });
    }

    console.log(''); // Empty line

    try {
        // Ping Bing
        console.log('🔍 Pinging Bing...');
        const bingResult = await pingSearchEngine(BING_PING_URL, 'Bing');
        results.push(bingResult);
    } catch (error) {
        console.error('Failed to ping Bing:', error);
        results.push({ success: false, engine: 'Bing', error: error.message });
    }

    console.log('\n' + '='.repeat(50));
    console.log('📋 Summary:');
    console.log('='.repeat(50));

    results.forEach(result => {
        if (result.success) {
            console.log(`✅ ${result.engine}: Successfully notified`);
        } else {
            console.log(`❌ ${result.engine}: Failed - ${result.error || 'Unknown error'}`);
        }
    });

    console.log('\n📝 Important Notes:');
    console.log('   • Pinging only notifies search engines - it does not guarantee indexing');
    console.log('   • You still need to verify ownership in:');
    console.log('     - Google Search Console: https://search.google.com/search-console');
    console.log('     - Bing Webmaster Tools: https://www.bing.com/webmasters');
    console.log('   • After verification, submit your sitemap in both consoles');
    console.log('   • Full indexing typically takes 1-4 weeks');
}

// Run the script
main().catch(console.error);
