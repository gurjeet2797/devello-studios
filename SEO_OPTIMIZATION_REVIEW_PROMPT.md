# SEO Optimization Review Prompt for Devello Home Improvement Product Storefront

## Context & Objectives

You are conducting a comprehensive SEO audit and optimization review for **Devello Inc**, a home improvement product storefront that sells:
- Windows and doors
- Lighting fixtures (pendants, sconces, floor lamps, table lamps, recessed, overhead fixtures)
- Bathroom products (vanities, faucets, toilets, bidets)
- Glass and mirrors
- Custom millwork
- Construction products

**Primary Goals:**
1. Position Devello as the top search result with rich site links (sitelinks) in Google search results
2. Rank highly for searches related to "ads" (Google Ads traffic optimization)
3. Optimize the entire codebase for home improvement product e-commerce SEO
4. Maximize conversion from Google Ads traffic
5. Establish Devello as a leading home improvement product storefront

**Current Setup:**
- Next.js application with multiple domains (develloinc.com, devello.shop, devellostudios.com, devellotech.com)
- Google Ads campaigns active
- Existing SEO component with basic metadata
- Product catalog with categories: doors, windows, glass, mirrors, lighting, bathroom
- Dynamic sitemap and robots.txt
- Structured data partially implemented

## Review Scope

### 1. Technical SEO Audit

**Review and optimize:**
- [ ] **Sitemap Structure**: Review `pages/api/sitemap.xml.js`
  - Ensure all product pages are included
  - Add product category pages (e.g., `/storecatalogue?category=windows`)
  - Include individual product detail pages if they exist
  - Set appropriate priorities (homepage: 1.0, product categories: 0.9, individual products: 0.8)
  - Add lastmod dates based on product update timestamps
  - Consider creating separate sitemaps for products vs. pages (sitemap index)
  
- [ ] **Robots.txt**: Review `pages/api/robots.txt.js`
  - Ensure product pages are crawlable
  - Verify sitemap reference is correct
  - Check for any unnecessary blocking of important pages
  
- [ ] **Canonical URLs**: Check all pages have proper canonical tags
  - Product pages should have unique canonicals
  - Category pages should have canonicals
  - Prevent duplicate content issues
  
- [ ] **URL Structure**: Review URL patterns
  - Product slugs should be SEO-friendly (e.g., `/products/single-hung-window`)
  - Category URLs should be descriptive (e.g., `/storecatalogue/windows`)
  - Avoid query parameters in URLs when possible
  
- [ ] **HTTPS & Security**: Verify SSL certificates and security headers
  - Check `next.config.js` security headers
  - Ensure all domains use HTTPS
  
- [ ] **Page Speed & Core Web Vitals**
  - Review image optimization (Next.js Image component usage)
  - Check for render-blocking resources
  - Optimize JavaScript bundles
  - Review lazy loading implementation
  - Test mobile page speed scores

### 2. On-Page SEO Optimization

**Homepage (`pages/index.js`):**
- [ ] **Title Tag**: Optimize for "home improvement products" + brand
  - Current: "Devello"
  - Recommended: "Devello | Premium Home Improvement Products - Windows, Doors, Lighting & More"
  - Include primary keywords: "home improvement products", "construction products", "windows and doors"
  
- [ ] **Meta Description**: Compelling, keyword-rich description
  - Include: "Shop premium home improvement products", "windows", "doors", "lighting", "bathroom fixtures"
  - Add call-to-action: "Free shipping", "Custom orders available"
  - Keep under 160 characters
  
- [ ] **H1 Tag**: Ensure single, keyword-optimized H1
  - Should include "Home Improvement Products" or similar
  - Match brand positioning
  
- [ ] **Content Structure**: Review homepage content
  - Add keyword-rich headings (H2, H3) for product categories
  - Include internal links to product categories
  - Add trust signals (reviews, certifications, years in business)
  - Include location-based content if applicable

**Product Catalog Page (`pages/storecatalogue.js`):**
- [ ] **Title Tag**: Optimize for product category searches
  - Template: "Shop [Category] | Devello - Premium [Category] Products"
  - Examples: "Shop Windows | Devello - Premium Window Products"
  - Include location modifiers if targeting local SEO
  
- [ ] **Meta Description**: Category-specific descriptions
  - Include top 3-5 product types in category
  - Add pricing information if appropriate
  - Include shipping/availability info
  
- [ ] **H1**: Category name + "Products" or "Collection"
  - Example: "Premium Windows & Doors Collection"
  
- [ ] **Category Pages**: Create dedicated pages for each category
  - `/storecatalogue/windows`
  - `/storecatalogue/doors`
  - `/storecatalogue/lighting`
  - `/storecatalogue/bathroom`
  - Each with unique, optimized content
  
- [ ] **Product Filtering**: Ensure filters are crawlable
  - Use query parameters that don't create duplicate content
  - Consider using rel="canonical" for filtered views

**Individual Product Pages** (if they exist):
- [ ] **Title Tag**: Product name + category + brand
  - Template: "[Product Name] | [Category] | Devello"
  - Include key features in title if space allows
  
- [ ] **Meta Description**: Product-specific, compelling description
  - Include price, key features, availability
  - Add unique selling points
  
- [ ] **Product Content**: Rich product descriptions
  - Include specifications, dimensions, materials
  - Add usage scenarios and benefits
  - Include related products section
  - Add customer reviews/testimonials if available

### 3. Structured Data (Schema.org) Optimization

**Review `components/SEO.js` and schema implementations:**

- [ ] **Organization Schema**: Enhance existing schema
  - Add `logo`, `contactPoint`, `sameAs` (social media)
  - Include `address` if physical location exists
  - Add `aggregateRating` if reviews available
  
- [ ] **Product Schema**: Implement for all products
  - Required: `name`, `description`, `image`, `offers` (price, availability, currency)
  - Add `brand`, `category`, `sku`, `gtin` if available
  - Include `aggregateRating` and `review` if reviews exist
  - Add `shippingDetails` for shipping information
  
- [ ] **BreadcrumbList Schema**: Ensure all pages have breadcrumbs
  - Review `lib/breadcrumbSchema.js`
  - Verify breadcrumbs appear on all product and category pages
  
- [ ] **FAQ Schema**: Expand FAQ implementation
  - Add product-specific FAQs
  - Include shipping, returns, installation FAQs
  - Review `lib/faqSchema.js`
  
- [ ] **WebSite Schema**: Add search functionality schema
  - Include `potentialAction` with SearchAction
  - Helps Google understand site search
  
- [ ] **ItemList Schema**: For category/collection pages
  - List all products in category
  - Helps Google understand product relationships
  
- [ ] **LocalBusiness Schema** (if applicable):
  - Add if physical store or showroom exists
  - Include address, hours, phone

**Implementation Files to Review:**
- `components/SEO.js`
- `components/schemas/OrganizationSchema.js`
- `lib/breadcrumbSchema.js`
- `lib/faqSchema.js`
- `pages/storecatalogue.js` (add product schema)

### 4. Google Ads Landing Page Optimization

**Focus on pages receiving Google Ads traffic:**

- [ ] **Landing Page Relevance**: Ensure landing pages match ad copy
  - Review Google Ads campaigns to identify landing pages
  - Match keywords in ad copy to page content
  - Ensure product categories align with ad groups
  
- [ ] **Conversion Optimization**:
  - Clear call-to-action buttons above fold
  - Product images should be high-quality and optimized
  - Pricing should be visible and clear
  - Add trust badges (secure checkout, free shipping, etc.)
  - Include customer testimonials or reviews
  
- [ ] **Page Load Speed**: Critical for paid traffic
  - Target < 2 seconds load time
  - Optimize images (WebP format, lazy loading)
  - Minimize JavaScript bundles
  - Use Next.js Image optimization
  
- [ ] **Mobile Optimization**: Most Google Ads traffic is mobile
  - Test all landing pages on mobile devices
  - Ensure touch targets are adequate
  - Check mobile page speed
  - Verify mobile navigation works smoothly
  
- [ ] **Bounce Rate Reduction**:
  - Add related products section
  - Include "Why Choose Devello" section
  - Add product comparison tools if applicable
  - Include installation guides or resources

### 5. Keyword Research & Content Strategy

**Target Keywords for Home Improvement Products:**

**Primary Keywords:**
- "home improvement products"
- "construction products online"
- "windows and doors"
- "home improvement store"
- "construction materials"
- "premium windows"
- "designer lighting"
- "bathroom fixtures"

**Product-Specific Keywords:**
- "single hung windows"
- "casement windows"
- "interior doors"
- "exterior doors"
- "pendant lighting"
- "bathroom vanities"
- "gold faucets"
- "custom millwork"

**Long-Tail Keywords:**
- "where to buy premium windows online"
- "best bathroom fixtures for renovation"
- "custom lighting for home"
- "high-end construction products"

**Action Items:**
- [ ] Audit current keyword usage across all pages
- [ ] Create keyword mapping document (keyword → page)
- [ ] Optimize product names and descriptions with target keywords
- [ ] Create category-specific landing pages for top keywords
- [ ] Add blog/content section for long-tail keyword targeting
- [ ] Include location-based keywords if targeting local SEO

### 6. Internal Linking Strategy

**Review and optimize:**
- [ ] **Navigation Structure**: Ensure clear category hierarchy
  - Home → Categories → Products
  - Breadcrumbs on all pages
  
- [ ] **Category Cross-Linking**: Link related categories
  - Windows page links to Doors page
  - Lighting page links to Bathroom page (if related)
  - Use descriptive anchor text
  
- [ ] **Product Recommendations**: Add "Related Products" sections
  - Use internal links with keyword-rich anchor text
  - Help users discover more products
  - Distribute page authority
  
- [ ] **Footer Links**: Review footer navigation
  - Include all major categories
  - Add product category links
  - Include "Shop by Category" section

### 7. Image SEO Optimization

**Review product images:**
- [ ] **Alt Text**: Ensure all product images have descriptive alt text
  - Include product name, category, key features
  - Example: "Single Hung Window - Premium Aluminum Frame - Devello"
  - Avoid keyword stuffing
  
- [ ] **Image File Names**: Use descriptive, keyword-rich filenames
  - Current: Check if using generic names
  - Recommended: `single-hung-window-aluminum-frame.jpg`
  
- [ ] **Image Sitemap**: Consider creating image sitemap
  - Include all product images
  - Helps Google discover and index product images
  
- [ ] **Image Optimization**: Technical optimization
  - Use WebP format where possible
  - Implement lazy loading
  - Responsive images (srcset)
  - Proper sizing to avoid layout shift

### 8. Site Links (Sitelinks) Optimization

**To achieve rich site links in Google search results:**

- [ ] **Clear Site Structure**: Ensure logical hierarchy
  - Main categories should be 1-2 clicks from homepage
  - Use consistent navigation
  
- [ ] **Important Pages**: Identify 4-6 most important pages
  - Homepage
  - Main product categories (Windows, Doors, Lighting, Bathroom)
  - Store catalog
  - About/Contact
  
- [ ] **Internal Linking**: Link to important pages from homepage
  - Use descriptive anchor text
  - Include in main navigation
  - Add footer links
  
- [ ] **Page Authority**: Build authority to important pages
  - Internal links from multiple pages
  - External links (if possible)
  - Quality content on target pages
  
- [ ] **URL Structure**: Keep URLs short and descriptive
  - `/windows` not `/storecatalogue/category/windows/products`
  
- [ ] **Breadcrumbs**: Implement on all pages
  - Helps Google understand site structure
  - Already implemented, verify it's on all pages

### 9. Mobile SEO & Core Web Vitals

**Review mobile experience:**
- [ ] **Mobile-First Indexing**: Ensure mobile version is fully functional
  - All content accessible on mobile
  - Mobile navigation works smoothly
  - Forms are mobile-friendly
  
- [ ] **Core Web Vitals**:
  - **LCP (Largest Contentful Paint)**: < 2.5s
    - Optimize hero images
    - Preload critical resources
  - **FID (First Input Delay)**: < 100ms
    - Minimize JavaScript execution
    - Use code splitting
  - **CLS (Cumulative Layout Shift)**: < 0.1
    - Set image dimensions
    - Reserve space for dynamic content
  
- [ ] **Mobile Page Speed**: Target 90+ on PageSpeed Insights
  - Review `next.config.js` optimizations
  - Check image optimization
  - Minimize render-blocking resources

### 10. Content Marketing & Blog Strategy

**For long-tail keyword targeting:**
- [ ] **Blog Section**: Create `/blog` with home improvement content
  - "How to Choose the Right Windows for Your Home"
  - "Bathroom Renovation Guide: Fixtures and Finishes"
  - "Lighting Design Tips for Modern Homes"
  - "Door Styles: A Complete Buyer's Guide"
  
- [ ] **Product Guides**: Create detailed product guides
  - Installation guides
  - Maintenance tips
  - Style guides
  - Comparison guides
  
- [ ] **Internal Linking**: Link from blog posts to product pages
  - Use keyword-rich anchor text
  - Natural, contextual links

### 11. Technical Implementation Review

**Files to Review and Optimize:**

1. **`components/SEO.js`**:
   - Enhance with product-specific SEO props
   - Add support for Product schema
   - Improve keyword handling
   - Add Open Graph product tags

2. **`pages/storecatalogue.js`**:
   - Add Product schema for each product
   - Optimize category page SEO
   - Add category-specific content
   - Implement proper heading structure

3. **`pages/index.js`**:
   - Optimize homepage for "home improvement products"
   - Add product category sections with links
   - Include trust signals and social proof
   - Add location-based content if applicable

4. **`pages/api/sitemap.xml.js`**:
   - Add all product pages to sitemap
   - Include product category pages
   - Set appropriate priorities
   - Add lastmod dates

5. **`next.config.js`**:
   - Review image optimization settings
   - Check compression settings
   - Verify security headers don't block SEO

6. **Product Pages** (if individual pages exist):
   - Create dynamic product pages: `/products/[slug]`
   - Implement Product schema
   - Add rich product descriptions
   - Include related products

### 12. Google Search Console & Analytics

**Verify setup:**
- [ ] **Google Search Console**: Ensure all domains verified
  - Submit sitemaps for each domain
  - Monitor search performance
  - Check for crawl errors
  
- [ ] **Google Analytics**: Verify tracking is set up
  - Track conversions from Google Ads
  - Set up e-commerce tracking
  - Monitor user behavior
  
- [ ] **Google Ads Integration**: Verify conversion tracking
  - Test conversion events
  - Ensure landing pages are tagged correctly

### 13. Competitive Analysis

**Research competitors:**
- [ ] Identify top-ranking home improvement product stores
- [ ] Analyze their SEO strategies
- [ ] Review their structured data implementation
- [ ] Check their keyword targeting
- [ ] Identify content gaps and opportunities

### 14. Local SEO (If Applicable)

**If targeting local customers:**
- [ ] **Google Business Profile**: Set up and optimize
- [ ] **Local Keywords**: Add location modifiers
  - "home improvement products [city]"
  - "windows and doors [state]"
- [ ] **NAP Consistency**: Name, Address, Phone consistent across web
- [ ] **Local Schema**: Add LocalBusiness schema if applicable

## Deliverables

After completing this review, provide:

1. **SEO Audit Report**: Comprehensive findings with priority levels
2. **Implementation Plan**: Step-by-step optimization tasks
3. **Code Changes**: Specific file modifications with code examples
4. **Keyword Mapping**: Keyword → Page mapping document
5. **Schema Implementation**: Enhanced structured data schemas
6. **Sitemap Updates**: Updated sitemap structure
7. **Content Recommendations**: Specific content to add/update
8. **Technical Fixes**: Performance and technical SEO improvements
9. **Google Ads Landing Page Optimizations**: Specific recommendations for paid traffic
10. **Site Links Strategy**: Plan to achieve rich site links

## Priority Levels

**Critical (Do First):**
- Product schema implementation
- Sitemap updates with all products
- Homepage SEO optimization
- Core Web Vitals fixes
- Google Ads landing page optimization

**High Priority:**
- Category page SEO
- Image optimization and alt text
- Internal linking strategy
- Mobile optimization
- Structured data enhancements

**Medium Priority:**
- Blog/content strategy
- Long-tail keyword content
- Competitive analysis
- Local SEO (if applicable)

## Success Metrics

Track these metrics to measure SEO success:
- Organic search traffic growth
- Keyword rankings for target terms
- Google Ads conversion rate
- Page load speed scores
- Core Web Vitals scores
- Click-through rate from search results
- Site links appearance in search results
- Product page impressions and clicks

## Notes

- Focus on e-commerce best practices for product stores
- Prioritize user experience alongside SEO
- Ensure all optimizations are mobile-first
- Maintain brand voice and positioning
- Keep Google Ads landing pages highly relevant to ad copy
- Test all changes before deploying to production

---

**Review Start Date**: [Date]  
**Target Completion**: [Date]  
**Reviewer**: [Name/Team]
