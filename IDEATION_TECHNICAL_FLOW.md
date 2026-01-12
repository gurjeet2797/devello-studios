# Ideation Engine - Technical Flow

## 🔄 Simple Flow Overview

```
User Input → API → Database → AI Processing → Result Storage → Frontend Display
```

---

## 📋 Step-by-Step Technical Flow

### **STEP 1: User Submits Idea**
**Frontend:** `components/IdeaBuildDemo.js`
- User types idea (min 8 characters)
- Clicks "Generate" button
- Sends POST request to `/api/studios/ideation/start`

**Payload:**
```json
{
  "prompt": "I want my business Instagram to look professional",
  "platform": "web",           // optional
  "industry": "retail",        // optional
  "tone": "professional",      // optional
  "targetAudience": "small business owners"  // optional
}
```

---

### **STEP 2: Create Job Record**
**API:** `pages/api/studios/ideation/start.js`

1. **Validates** prompt (min 8 chars)
2. **Authenticates** user (optional - can work as guest)
3. **Creates database record** in `ideation_jobs` table:
   ```sql
   status: 'queued'
   progress: 0
   message: 'Job created, waiting to start...'
   prompt: "I want my business Instagram..."
   context: { platform, industry, tone, targetAudience }
   user_id: null or user.id
   ```
4. **Returns immediately** with `ideaId` (doesn't wait for processing)
5. **Starts async processing** in background

---

### **STEP 3: Process Job (Background)**
**Processor:** `lib/ideationJobProcessor.js`

**Status Updates:**
- `queued` → `processing` (progress: 10%)
- `processing` → `processing` (progress: 30%) - "Generating concept with AI..."
- `processing` → `processing` (progress: 90%) - "Finalizing concept..."
- `processing` → `completed` (progress: 100%) - "Concept generated successfully"

---

### **STEP 4: Build AI Prompt**
**Prompt Builder:** `lib/prompts/ideationPrompt.js`

**System Prompt** (always included):
```
You are Devello's Creative Intelligence Engine. 
Transform simple app ideas into complete product concepts.

Output JSON format:
{
  "name": "Product Name",
  "tagline": "Description",
  "features": ["Feature 1", ...],
  "tech_stack": {
    "frontend": "...",
    "backend": "...",
    "database": "...",
    "integrations": [...]
  },
  "monetization": "...",
  "roadmap": ["Phase 1: ...", ...],
  "ui_inspiration": "..."
}
```

**User Prompt** (built dynamically):
```
=== APP IDEA ===
I want my business Instagram to look professional

=== ADDITIONAL CONTEXT ===
Platform: web
Industry: retail
Target Audience: small business owners
Tone/Style: professional

=== TASK ===
Generate a complete product concept following the JSON schema exactly.
```

**Full Prompt Sent to AI:**
```
[SYSTEM_PROMPT]

[USER_PROMPT]
```

---

### **STEP 5: Select AI Model**
**Model Selection:** `lib/prompts/ideationPrompt.js`

**Logic:**
- **Short prompts** (< 200 chars) → `gemini-2.5-flash` (faster, cheaper)
- **Long prompts** (> 500 chars) → `gemini-2.5-pro` (more capable)
- **Default** → `gemini-2.5-flash` (cost-efficient)

**Models Used:**
- **Primary:** `gemini-2.5-flash` (Google Gemini 2.5 Flash)
- **Fallback:** `gemini-2.5-pro` (Google Gemini 2.5 Pro)

---

### **STEP 6: Call AI Service**
**Service:** `lib/geminiIdeationService.js`

**API Call to Google Gemini:**
```javascript
gemini.models.generateContent({
  model: 'gemini-2.5-flash',  // or 'gemini-2.5-pro'
  contents: {
    parts: [{ text: fullPrompt }]
  },
  generationConfig: {
    temperature: 0.7,        // Balanced creativity
    maxOutputTokens: 2000,   // Enough for full concept
    topP: 0.9,
    topK: 40
  }
})
```

**Response from Gemini:**
```json
{
  "response": {
    "candidates": [{
      "content": {
        "parts": [{
          "text": "{\"name\":\"InstaPro\",\"tagline\":\"...\",...}"
        }]
      }
    }],
    "usageMetadata": {
      "promptTokenCount": 245,
      "candidatesTokenCount": 523
    }
  }
}
```

---

### **STEP 7: Parse & Validate Response**
**Parser:** `lib/prompts/ideationPrompt.js`

**Process:**
1. **Extract text** from response
2. **Remove markdown** code blocks (```json ... ```)
3. **Parse JSON**
4. **Validate structure:**
   - Features: max 7 items
   - Roadmap: max 6 milestones
   - Integrations: max 6 items
5. **Normalize** (trim, filter empty values)

**Output Structure:**
```json
{
  "name": "InstaPro",
  "tagline": "Professional Instagram management for businesses",
  "features": [
    "Auto-scheduling posts",
    "Analytics dashboard",
    ...
  ],
  "tech_stack": {
    "frontend": "React/Next.js",
    "backend": "Node.js",
    "database": "PostgreSQL",
    "integrations": ["Instagram API", "Stripe", ...]
  },
  "monetization": "Subscription model: $29/month...",
  "roadmap": [
    "Phase 1: MVP with basic scheduling",
    "Phase 2: Analytics integration",
    ...
  ],
  "ui_inspiration": "Clean, modern interface inspired by..."
}
```

---

### **STEP 8: Track Costs**
**Cost Tracker:** `lib/apiCostTracker.js`

**Calculates:**
- Input tokens cost
- Output tokens cost
- Total cost in USD

**Stored in database:**
```json
{
  "total_cost": 0.000523,
  "cost_breakdown": {
    "gemini": 0.000523
  }
}
```

---

### **STEP 9: Save Result**
**Database Update:** `lib/ideationJobProcessor.js`

**Updates job record:**
```sql
status: 'completed'
progress: 100
message: 'Concept generated successfully'
result: { ...full JSON concept... }
total_cost: 0.000523
cost_breakdown: { gemini: 0.000523 }
completed_at: 2024-01-15T10:30:00Z
```

---

### **STEP 10: Frontend Polling**
**Frontend:** `components/IdeaBuildDemo.js`

**Polling Loop:**
```javascript
// Polls every 900ms, max 40 times (36 seconds)
while (status !== 'completed') {
  const response = await fetch(`/api/studios/ideation/status/${id}`);
  const data = await response.json();
  
  if (data.status === 'completed') {
    // Fetch result
    const result = await fetch(`/api/studios/ideation/result/${id}`);
    // Display result
  }
  
  await sleep(900ms);
}
```

**Status Endpoint:** `pages/api/studios/ideation/status/[id].js`
- Returns: `status`, `progress`, `message`

**Result Endpoint:** `pages/api/studios/ideation/result/[id].js`
- Returns: `result` (full JSON concept)

---

### **STEP 11: Display Result**
**Frontend:** `components/IdeaBuildDemo.js`

**Normalization:**
```javascript
function normalizeResult(raw) {
  return {
    name: raw.name || '',
    tagline: raw.tagline || '',
    features: clampList(raw.features, 7),      // Max 7
    roadmap: clampList(raw.roadmap, 6),       // Max 6
    tech_stack: {
      frontend: raw.tech_stack?.frontend || '',
      backend: raw.tech_stack?.backend || '',
      database: raw.tech_stack?.database || '',
      integrations: clampList(raw.tech_stack?.integrations, 6)  // Max 6
    },
    monetization: raw.monetization || '',
    ui_inspiration: raw.ui_inspiration || ''
  };
}
```

**Result is displayed in editable form fields**

---

## 🤖 AI Models & Configuration

### **Model: Google Gemini 2.5**
- **Primary:** `gemini-2.5-flash` (fast, cost-efficient)
- **Fallback:** `gemini-2.5-pro` (more capable for complex prompts)

### **Generation Config:**
```javascript
{
  temperature: 0.7,        // Creativity level (0-1)
  maxOutputTokens: 2000,  // Max response length
  topP: 0.9,              // Nucleus sampling
  topK: 40                // Top-k sampling
}
```

### **Cost Tracking:**
- Tracks input/output tokens
- Calculates cost per request
- Stores in database for analytics

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│   User      │
│  Types Idea │
└──────┬──────┘
       │ POST /api/studios/ideation/start
       ▼
┌─────────────────────┐
│  API: start.js      │
│  - Validate         │
│  - Create DB record  │
│  - Return ideaId    │
└──────┬──────────────┘
       │ Async processing
       ▼
┌─────────────────────┐
│  Job Processor      │
│  - Update: queued   │
│  - Update: processing│
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Prompt Builder      │
│  - System prompt     │
│  - User prompt       │
│  - Select model      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Gemini Service     │
│  - Call Gemini API  │
│  - Get response     │
│  - Track costs      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Response Parser      │
│  - Extract JSON       │
│  - Validate structure│
│  - Normalize data     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Save to Database    │
│  - status: completed │
│  - result: JSON      │
│  - cost: $0.000523   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Frontend Polling    │
│  - Check status      │
│  - Fetch result      │
│  - Display in UI     │
└─────────────────────┘
```

---

## 🔑 Key Components

### **Prompts:**
1. **System Prompt** - Defines AI role and output format
2. **User Prompt** - Contains idea + context
3. **Full Prompt** - System + User combined

### **Models:**
- **gemini-2.5-flash** - Fast, cost-efficient (default)
- **gemini-2.5-pro** - More capable (for complex prompts)

### **Processing:**
- **Asynchronous** - Job runs in background
- **Status updates** - Progress tracked in database
- **Error handling** - Failed jobs marked with errors

### **Data Structure:**
- **Input:** User idea + optional context
- **Output:** Structured JSON concept
- **Storage:** PostgreSQL (Prisma ORM)

---

## ⚡ Performance

- **Average processing time:** 2-5 seconds
- **Polling interval:** 900ms
- **Max wait time:** 36 seconds (40 polls × 900ms)
- **Cost per request:** ~$0.0005 (Flash model)

---

## 🛡️ Error Handling

1. **Invalid prompt** → 400 error (min 8 chars)
2. **AI failure** → Job marked as `failed`, error stored
3. **Parse failure** → Returns empty structure with defaults
4. **Timeout** → Frontend shows "Timed out" after 36s

---

## 📝 Summary

**Simple Flow:**
1. User submits idea → API creates job
2. Background processor builds prompt
3. Calls Gemini AI with prompt
4. Gemini returns JSON concept
5. Result saved to database
6. Frontend polls and displays result

**AI Model:** Google Gemini 2.5 (Flash or Pro)
**Output:** Structured JSON with product concept
**Storage:** PostgreSQL database
**Cost:** ~$0.0005 per request
