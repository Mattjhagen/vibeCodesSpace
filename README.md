# Professional Web Design Website

A modern, responsive website for web design services featuring integrated payment processing with Stripe and domain purchasing through Dynadot API.

## Features

- **Modern Design**: Clean, professional layout with responsive design
- **Pricing Plans**: One-time website design packages ($2,500 - $4,500) and monthly maintenance plans ($150 - $300)
- **Stripe Integration**: Secure payment processing for both one-time payments and subscriptions
- **Domain Services**: Dynadot API integration for domain availability checking and purchasing with commission
- **Portfolio Showcase**: Display of previous work and projects
- **Contact Forms**: Lead capture and project inquiry forms

## Pricing Structure

### Website Design Packages
- **Basic Website**: $2,500 (one-time)
  - Up to 5 pages
  - Responsive design
  - Basic SEO setup
  - Contact form
  - 1 month support

- **Professional Website**: $3,500 (one-time)
  - Up to 10 pages
  - Custom design
  - Advanced SEO
  - CMS integration
  - 3 months support

- **Premium Website**: $4,500 (one-time)
  - Unlimited pages
  - E-commerce features
  - Custom functionality
  - Payment integration
  - 6 months support

### Monthly Maintenance & Hosting
- **Basic Maintenance**: $150/month
  - Website hosting
  - Security updates
  - Backup management
  - Basic content updates

- **Premium Maintenance**: $300/month
  - Everything in Basic
  - Performance optimization
  - Advanced security monitoring
  - Unlimited content updates
  - Priority support

## Setup Instructions

### 1. Frontend Setup

The website is ready to use with the included HTML, CSS, and JavaScript files. Simply open `index.html` in a web browser to view the site.

### 2. Backend Setup (Required for Payment Processing)

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file in the root directory with the following variables:
   ```env
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   DYNADOT_API_KEY=your_dynadot_api_key_here
   PORT=3000
   ```

3. **Update Frontend Configuration**:
   In `script.js`, update the `CONFIG` object with your actual API keys:
   ```javascript
   const CONFIG = {
       STRIPE_PUBLISHABLE_KEY: 'pk_test_your_stripe_publishable_key_here',
       DYNADOT_API_KEY: 'your_dynadot_api_key_here',
       BACKEND_URL: 'https://your-backend-url.com/api'
   };
   ```

4. **Start the Backend Server**:
   ```bash
   npm start
   ```

### 3. API Keys Setup

#### Stripe Setup
1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Set up webhooks for payment confirmation
4. Update the webhook endpoint URL in your Stripe dashboard

#### Dynadot API Setup
1. Create a Dynadot account at [dynadot.com](https://dynadot.com)
2. Generate an API key from your account settings
3. The API key will be used for domain availability checking and purchasing

### 4. Domain Commission Structure

The system includes a 15% commission on domain sales:
- Domain price: $12.99/year (example)
- Your commission: $1.95
- Total customer cost: $14.94

## File Structure

```
web-design-website/
├── index.html              # Main website file
├── styles.css              # CSS styling
├── script.js               # Frontend JavaScript
├── backend-example.js      # Backend API server
├── package.json            # Node.js dependencies
└── README.md              # This file
```

## Customization

### Updating Pricing
Edit the `PRICING` object in `script.js` to modify prices and plans.

### Changing Colors and Styling
Modify the CSS variables in `styles.css` to match your brand colors.

### Adding Portfolio Items
Update the portfolio section in `index.html` with your actual work samples.

### Contact Information
Update the contact details in the contact section of `index.html`.

## Security Considerations

- Never expose your Stripe secret key in frontend code
- Use environment variables for all sensitive API keys
- Implement proper error handling and validation
- Use HTTPS in production
- Regularly update dependencies

## Production Deployment

1. **Frontend**: Deploy the static files to a CDN or web hosting service
2. **Backend**: Deploy the Node.js server to a cloud platform (Heroku, AWS, etc.)
3. **SSL**: Ensure HTTPS is enabled for secure payment processing
4. **Domain**: Point your domain to the deployed frontend
5. **Webhooks**: Update Stripe webhook URLs to point to your production backend

## Support

For technical support or customization requests, please contact [matty@pacmacmobile.com].

## SEO & Search Engine Submission

This website has been optimized for Google, Bing, and AI search engines with:
- Comprehensive meta tags (Open Graph, Twitter Cards)
- JSON-LD structured data (Organization, WebSite, Service schemas)
- Sitemap.xml and robots.txt
- llms.txt for AI search optimization

### Quick Submission Guide

1. **Google Search Console**: 
   - Visit: https://search.google.com/search-console
   - Add property: `https://vibecodes.space`
   - Verify ownership and submit sitemap: `sitemap.xml`

2. **Bing Webmaster Tools**:
   - Visit: https://www.bing.com/webmasters
   - Add site: `https://vibecodes.space`
   - Verify ownership and submit sitemap: `https://vibecodes.space/sitemap.xml`

For detailed instructions, see:
- **Full Guide**: `SEO_SUBMISSION_GUIDE.md`
- **Helper Page**: `submit-search-engines.html` (open in browser)
- **Ping Script**: `node ping-search-engines.js` (optional notification)

## License

This project is licensed under the MIT License.
