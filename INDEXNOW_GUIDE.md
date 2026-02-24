# IndexNow Implementation Guide

IndexNow is an open protocol that allows you to instantly notify search engines when content on your website is created, updated, or deleted. This is supported by **Bing**, **Yandex**, and other participating search engines.

## What is IndexNow?

IndexNow helps search engines discover and index your content faster by allowing you to notify them immediately when you publish or update content. This is especially useful for:
- New blog posts or pages
- Updated content
- Deleted pages
- Product listings
- Any time-sensitive content

**Documentation**: https://www.indexnow.org/documentation

## Setup Complete ✅

Your IndexNow implementation is ready:

1. **Key File**: `indexnow-key.txt` - Contains your verification key
2. **Key Location**: `https://vibecodes.space/indexnow-key.txt`
3. **Submission Script**: `submit-indexnow.js` - Script to submit URLs

## How to Use

### Option 1: Submit All Pages from Sitemap

Submit all URLs from your sitemap.xml:

```bash
node submit-indexnow.js --all
```

### Option 2: Submit Specific URLs

Submit one or more specific URLs:

```bash
node submit-indexnow.js https://vibecodes.space/ https://vibecodes.space/privacy.html
```

### Option 3: Submit Single URL

```bash
node submit-indexnow.js https://vibecodes.space/
```

## Key Requirements

### Key File Location
The key file must be accessible at:
- `https://vibecodes.space/indexnow-key.txt`

This file is already configured in your server and will be served automatically.

### Key Format
- Minimum 8 characters, maximum 128 characters
- Can contain: lowercase (a-z), uppercase (A-Z), numbers (0-9), and dashes (-)
- Current key: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

## Response Codes

- **200 OK**: URL submitted successfully
- **202 Accepted**: URL received, key validation pending
- **400 Bad Request**: Invalid format
- **403 Forbidden**: Key not valid (key not found or doesn't match)
- **422 Unprocessable Entity**: URLs don't belong to the host or key doesn't match schema
- **429 Too Many Requests**: Too many requests (potential spam)

## Supported Search Engines

IndexNow is currently supported by:
- **Microsoft Bing** - https://www.bing.com/indexnow
- **Yandex** - https://yandex.com/indexnow
- Other participating search engines

## Best Practices

1. **Submit Immediately**: Submit URLs as soon as content is added, updated, or deleted
2. **Batch Submissions**: For multiple URLs, use the POST method (script does this automatically)
3. **Don't Over-Submit**: Only submit URLs that have actually changed
4. **Keep Key Secure**: Don't share your IndexNow key publicly (though it's in the key file for verification)

## Integration with Your Workflow

### After Publishing New Content

```bash
# Submit the new page
node submit-indexnow.js https://vibecodes.space/new-page.html
```

### After Updating Content

```bash
# Submit the updated page
node submit-indexnow.js https://vibecodes.space/updated-page.html
```

### After Major Site Updates

```bash
# Submit all pages from sitemap
node submit-indexnow.js --all
```

## Automatic Submission (Future Enhancement)

You can integrate IndexNow submission into your content management workflow:

```javascript
// Example: Auto-submit after content update
const { exec } = require('child_process');
exec('node submit-indexnow.js https://vibecodes.space/new-page.html', (error, stdout, stderr) => {
    if (error) {
        console.error(`Error: ${error.message}`);
        return;
    }
    console.log('IndexNow submission completed');
});
```

## Troubleshooting

### Key File Not Found (404)
- Ensure `indexnow-key.txt` exists in the root directory
- Check that the server is configured to serve the file
- Verify the file is accessible at: `https://vibecodes.space/indexnow-key.txt`

### 403 Forbidden
- Verify the key in `indexnow-key.txt` matches the key used in submission
- Ensure the key file is UTF-8 encoded
- Check that the key file contains only the key (no extra whitespace)

### 422 Unprocessable Entity
- Ensure URLs belong to your domain (vibecodes.space)
- Verify the key matches the schema requirements
- Check that URLs are properly formatted

## Testing

Test your IndexNow setup:

```bash
# Test with homepage
node submit-indexnow.js https://vibecodes.space/

# Verify key file is accessible
curl https://vibecodes.space/indexnow-key.txt
```

## Resources

- **IndexNow Documentation**: https://www.indexnow.org/documentation
- **IndexNow FAQ**: https://www.indexnow.org/faq
- **Bing Webmaster Tools**: https://www.bing.com/webmasters
- **Protocol Specification**: https://www.indexnow.org/

## Notes

- IndexNow is a **notification protocol** - it tells search engines about changes but doesn't guarantee immediate indexing
- Search engines will still crawl and validate your content
- This complements (doesn't replace) sitemap submissions
- Use both IndexNow and traditional sitemap submissions for best results
