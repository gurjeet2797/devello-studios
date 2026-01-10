# GPT Pro Deep Research Prompt: Intelligent Product Research Engine for Devello

> **Purpose**: This prompt is designed for GPT Pro deep research to analyze the Devello codebase architecture and design a Gemini 2.5 Pro-powered intelligent product research engine for automated catalog expansion.

---

## PART 1: BUSINESS CONTEXT

### Company Overview
**Devello** is a premium building materials supplier specializing in architectural products for residential and commercial construction. The company operates an e-commerce platform built with Next.js, serving contractors, architects, and homeowners.

### Product Categories
The store manages products across these categories:
- **Windows**: Double-hung, casement, sliding, bay, picture windows
- **Doors**: Interior (flush, paneled), exterior, patio, glass doors
- **Glass**: Shower doors, fluted glass, custom glazing
- **Mirrors**: Gold, regular, custom-framed mirrors
- **Millwork**: Casing, baseboard, crown molding (sold per linear foot)
- **Lighting**: Pendants, sconces, recessed fixtures, floor/table lamps
- **Bathroom**: Vanities, faucets, toilets, bidets
- **Build-a-House Bundles**: Pre-configured packages for whole-home projects

### Vendor Relationship Model
Devello sources products from multiple vendors who provide:
1. **PDF Catalogs**: Physical or digital product catalogs with images, specs, and pricing
2. **Websites**: Vendor product pages with detailed information
3. **Pricing Sheets**: Wholesale pricing structures with material variants

### Current Pain Points
1. Manual product entry is time-consuming (each product requires ~5-10 minutes)
2. Extracting data from PDF catalogs requires copy-paste workflows
3. No automated way to fetch product images from vendor websites
4. Scaling the catalog requires significant admin time
5. Product descriptions need to be written manually for SEO

---

## PART 2: TECHNICAL ARCHITECTURE

### Stack Overview
```
Frontend: Next.js 14 (Pages Router)
Database: PostgreSQL via Prisma ORM + Supabase
Storage: Supabase Storage (bucket: 'images')
AI: Google Gemini 2.5 Flash with Google Search Retrieval
Auth: Supabase Auth with admin role verification
Payments: Stripe
Hosting: Vercel
```

### Product Database Schema (Prisma)
```prisma
model Product {
  id                 String              @id @default(cuid())
  name               String
  description        String?
  slug               String              @unique
  price              Int                 // Price in cents (e.g., 63000 = $630.00)
  currency           String              @default("usd") @db.VarChar(3)
  stripe_price_id    String?
  product_type       String              @db.VarChar(20) // one_time, subscription, service
  status             String              @default("active") @db.VarChar(20)
  is_test            Boolean             @default(false)
  visible_in_catalog Boolean             @default(true)
  image_url          String?
  metadata           Json?               // Rich metadata object
  shippingProfile    ShippingProfileCode?
  created_at         DateTime            @default(now())
  updated_at         DateTime            @default(now()) @updatedAt
}
```

### Product Metadata Structure (JSON)
```json
{
  "category": "windows",           // windows, doors, glass, mirrors, millwork, bundles, lighting, bathroom
  "productId": "W-001",            // Internal vendor reference ID
  "referenceSize": "Up to 36\" × 60\"",
  "pricingNotes": "Custom sizes available",
  "highlights": [
    "Energy Star certified",
    "Custom sizes available",
    "Multiple glazing options"
  ],
  "variants": [
    {
      "name": "Black Aluminum Frame",
      "material": "Aluminum",
      "price": 63000,
      "imageUrl": "https://...",
      "notes": "Slim profile, black finish"
    },
    {
      "name": "Dark Bronze",
      "material": "Aluminum", 
      "price": 51000,
      "imageUrl": "https://...",
      "notes": "Dark bronze finish"
    }
  ],
  "vendor": {
    "name": "Vendor Name",
    "catalogPage": 45,
    "productCode": "ABC-123"
  }
}
```

### Existing Gemini Integration
The codebase already has Gemini 2.5 Flash integrated with Google Search Retrieval:

```javascript
// From pages/api/assistant/chat.js
import { GoogleGenAI } from "@google/genai";

const gemini = new GoogleGenAI({ 
  apiKey: process.env.GOOGLE_API_KEY 
});

const response = await gemini.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: { parts: [{ text: fullPrompt }] },
  generationConfig: {
    temperature: 0.4,
    maxOutputTokens: 220,
    topP: 0.9,
    topK: 40
  },
  tools: [{
    googleSearchRetrieval: {}  // Enables Google Search grounding
  }]
});
```

### Cost Tracking System
```javascript
// From lib/apiCostTracker.js
await apiCostTracker.trackGeminiCost(
  promptTokenCount,
  candidatesTokenCount,
  'gemini-2.5-flash',
  { endpoint: '/api/product-research', context: 'catalog-import' }
);
```

### Admin Authentication
```javascript
// From lib/adminAuth.js
const authResult = await verifyAdminAccess(req);
if (!authResult.isAdmin) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### Image Upload to Supabase
```javascript
// From pages/api/admin/products/upload-image.js
const { data, error } = await supabase.storage
  .from('images')
  .upload(`products/${timestamp}-${randomId}.${ext}`, fileBuffer, {
    contentType: file.mimetype,
    cacheControl: '3600',
    upsert: false
  });

const { data: urlData } = supabase.storage
  .from('images')
  .getPublicUrl(fileName);
```

### Current Product Creation API
```javascript
// From pages/api/admin/products/create.js
const productData = {
  name,
  description,
  slug,
  price: parseInt(price),
  currency,
  stripe_price_id,
  product_type,
  status,
  is_test,
  visible_in_catalog,
  image_url,
  metadata: metadata ? JSON.parse(metadata) : null,
  shippingProfile,
};

const product = await prisma.product.create({ data: productData });
```

---

## PART 3: INTELLIGENT PRODUCT RESEARCH ENGINE REQUIREMENTS

### Core Functionality
Build an AI-powered product research engine that:

1. **Accepts Multi-Modal Inputs**:
   - PDF catalog uploads (with page references)
   - Vendor website URLs
   - Product names with context
   - Text instructions like "Add 'The Muse' from page 45"

2. **Performs Intelligent Product Research**:
   - Extracts product information from PDFs using vision/OCR
   - Scrapes vendor product pages for details
   - Uses Google Search grounding to find additional product info and images
   - Cross-references multiple sources for accuracy

3. **Generates Complete Product Data**:
   - Product name (SEO-optimized)
   - Marketing description (150-300 words)
   - Price extraction and conversion to cents
   - Variant detection (materials, finishes, sizes)
   - Category classification
   - Feature highlights (3-5 bullet points)
   - Image URLs or downloaded images

4. **Batch Processing**:
   - Process multiple products from a single catalog
   - Queue-based processing for large imports
   - Progress tracking and status updates

5. **Confirmation Workflow**:
   - Preview generated product data before saving
   - Allow admin to edit any field
   - Support additional image uploads
   - Bulk approve or reject products

### Input Interface Design

```
┌─────────────────────────────────────────────────────────────────┐
│  INTELLIGENT PRODUCT IMPORT                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📎 Upload Vendor Catalog (PDF)                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Drop PDF here or click to browse                        │   │
│  │  catalog_2025.pdf (uploaded) ✓                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  🔗 Vendor Website URL (optional)                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  https://vendor.com/products                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  📝 Product Instructions                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Add the following products:                             │   │
│  │  - "The Muse" pendant light (page 45)                   │   │
│  │  - "Enno Table" (page 23, also check vendor URL)        │   │
│  │  - "Voronio Pendant" in brass and black finishes        │   │
│  │  - All bathroom vanities from pages 60-65               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ⚙️ Import Settings                                             │
│  ○ Windows  ○ Doors  ○ Glass  ○ Lighting  ● Auto-detect        │
│  ☑ Generate SEO descriptions                                    │
│  ☑ Fetch high-res images from vendor                            │
│  ☐ Mark as test products                                        │
│                                                                  │
│  [🔍 Research Products]                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Output Preview Interface

```
┌─────────────────────────────────────────────────────────────────┐
│  PRODUCT RESEARCH RESULTS                          3 of 5 found │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☑ THE MUSE PENDANT LIGHT                    [Edit] [×]  │   │
│  │ ┌─────┐                                                  │   │
│  │ │ IMG │  Category: Lighting > Pendants                   │   │
│  │ │     │  Price: $1,450.00                               │   │
│  │ └─────┘  Variants: Brass, Matte Black, Chrome           │   │
│  │                                                          │   │
│  │  Description: The Muse pendant light combines...        │   │
│  │  ✓ Sourced from: PDF page 45, vendor website            │   │
│  │  ✓ Images: 3 found (1 from PDF, 2 from web)             │   │
│  │  [+ Add more images]                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☑ ENNO DINING TABLE                         [Edit] [×]  │   │
│  │ ...                                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [Import Selected (2)]  [Research More]  [Cancel]               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## PART 4: SYSTEM DESIGN REQUEST

### API Endpoint Architecture

Design and document the following API endpoints:

```
POST /api/admin/product-research/start
  - Accept: PDF file, URLs, text instructions
  - Return: Research job ID, estimated time

GET /api/admin/product-research/status/:jobId
  - Return: Progress, found products count, errors

GET /api/admin/product-research/results/:jobId
  - Return: Array of extracted product data

POST /api/admin/product-research/confirm
  - Accept: Array of confirmed products with edits
  - Return: Created product IDs

POST /api/admin/product-research/parse-pdf
  - Accept: PDF file
  - Return: Extracted text and images by page

POST /api/admin/product-research/fetch-url
  - Accept: Product page URL
  - Return: Extracted product data
```

### Gemini System Prompt Optimization

Design an optimized system prompt for the product research engine that:

1. **Is Focused**: Only extracts product information, no tangential exploration
2. **Is Structured**: Always outputs in a consistent JSON format
3. **Is Efficient**: Minimizes token usage while maximizing accuracy
4. **Uses Grounding**: Leverages Google Search for missing information
5. **Handles Uncertainty**: Flags low-confidence extractions

Example system prompt structure:
```
You are Devello's Product Research Engine. Your ONLY purpose is to extract 
product information for a building materials catalog.

STRICT OUTPUT FORMAT (JSON):
{
  "products": [{
    "name": "...",
    "description": "...",
    "price_cents": 63000,
    "category": "windows|doors|glass|mirrors|millwork|lighting|bathroom",
    "variants": [...],
    "highlights": [...],
    "images": [...],
    "confidence": 0.95,
    "sources": ["pdf:45", "url:vendor.com/product"]
  }],
  "errors": [...],
  "suggestions": [...]
}

RULES:
1. Extract ONLY the products specified in the instructions
2. Price MUST be converted to cents (USD)
3. If information is missing, use Google Search to find it
4. Flag any product with confidence < 0.8
5. Never hallucinate specifications - mark as "unknown" if unsure
```

### PDF Processing Strategy

Research and recommend the best approach for:
1. **PDF Text Extraction**: pdf-parse, pdfjs-dist, or cloud solutions
2. **PDF Image Extraction**: Extracting embedded product images
3. **Page-Specific References**: Mapping "page 45" to actual content
4. **OCR for Scanned PDFs**: Tesseract.js vs Google Cloud Vision
5. **Gemini Vision**: Using Gemini's native PDF/image understanding

### Image Acquisition Strategy

Design a system for:
1. Extracting images from PDF catalogs
2. Scraping images from vendor product pages
3. Using Google Image Search (via grounding) for product photos
4. Downloading and storing images to Supabase
5. Generating image variants (thumbnails, optimized)

### Cost Optimization

The engine should be cost-efficient:
1. Use Gemini 2.5 Flash for simple extractions
2. Reserve Gemini 2.5 Pro for complex multi-page analysis
3. Cache PDF parsing results
4. Batch similar products together
5. Track and display cost per product imported

---

## PART 5: DELIVERABLES REQUESTED

Please provide deep research analysis and recommendations for:

### 1. Architecture Design
- Complete system architecture diagram
- Data flow from input to stored product
- Error handling and retry strategies
- Queue/job management for batch processing

### 2. API Implementation
- Detailed API endpoint specifications
- Request/response schemas
- Authentication and rate limiting
- Webhook support for long-running jobs

### 3. AI/ML Components
- Optimized Gemini prompts for each task type
- PDF parsing pipeline design
- Image extraction and validation
- Multi-source data reconciliation

### 4. Frontend Components
- React components for the import interface
- Real-time progress updates (WebSocket or polling)
- Product preview and editing interface
- Bulk operations UI

### 5. Integration Points
- How to integrate with existing admin store page
- Database migration requirements (if any)
- Supabase storage organization
- Stripe product sync considerations

### 6. Testing Strategy
- Unit tests for extraction logic
- Integration tests for API endpoints
- Mock data for development
- Cost simulation tools

---

## APPENDIX: EXISTING CODE REFERENCES

### Key Files to Understand
- `pages/admin/store/index.js` - Current store management UI
- `pages/api/admin/products/create.js` - Product creation endpoint
- `pages/api/admin/products/upload-image.js` - Image upload handling
- `pages/api/assistant/chat.js` - Gemini with Google Search example
- `lib/aiService.js` - AI service with Gemini integration
- `lib/apiCostTracker.js` - Cost tracking implementation
- `scripts/import-devello-catalogue.js` - Manual catalog import script
- `prisma/schema.prisma` - Database schema

### Environment Variables Required
```
GOOGLE_API_KEY=... (Gemini API)
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### NPM Packages Already Installed
- `@google/genai` - Google Gemini SDK
- `formidable` - File upload parsing
- `@prisma/client` - Database ORM
- `@supabase/supabase-js` - Supabase client

---

## SUCCESS CRITERIA

The product research engine is successful when:

1. **Speed**: A single product can be researched and added in < 30 seconds
2. **Accuracy**: 90%+ of extracted data requires no manual correction
3. **Batch Efficiency**: 20+ products can be imported from a single catalog in one session
4. **Cost**: Average cost per product is < $0.05 in API usage
5. **UX**: Admin can complete import without leaving the store management page
6. **Reliability**: Failed imports can be retried without data loss

---

*End of Deep Research Prompt*
