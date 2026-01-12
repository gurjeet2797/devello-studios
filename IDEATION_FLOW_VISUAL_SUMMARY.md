# Ideation Demo - Visual Flow Summary

## 🎯 User Journey: From Idea to Product Concept

---

## **PHASE 1: Initial State (Modal Opens)**

### Modal Container
- **Width**: Starts at `50vw` (mobile) / `60vw` (tablet) - **narrower**
- **Position**: Fixed, centered, with backdrop blur
- **Close Button**: Red-tinted (top-right corner)

### Content Layout (Top to Bottom):

1. **Title** (Inside container, top)
   ```
   "Type an idea. See what it becomes."
   - Large text (2xl/3xl)
   - Centered
   - Font: Semibold
   ```

2. **"Powered by Devello's Creative Intelligence" Badge**
   - Small badge with Zap icon
   - Rounded pill shape
   - Subtle background
   - Spacing: `my-4` (space above and below)

3. **Input Panel** (Glass-morphism card)
   - **Textarea**: 
     - Placeholder: `"I want my business Instagram to look professional"`
     - Min height: 96px
     - Rounded corners
   
   - **Action Buttons Row**:
     - **Generate Button**: 
       - Enabled when idea ≥ 8 characters
       - Shows "Generate" or "Generating..." (when busy)
       - Wand2 icon
     - **Close Button**: Secondary action
   
   - **Status Indicator** (Right side):
     - Only shows when `status !== "idle"`
     - Pulsing dot + status message
     - Messages: "Starting…", "Generating concept…", etc.

---

## **PHASE 2: User Clicks "Generate"**

### Immediate UI Changes:
1. **Button State**:
   - Text changes to "Generating..."
   - Button becomes disabled
   - `busy = true`

2. **Status Indicator Appears**:
   - Shows: "Starting…" with pulsing dot
   - Animated fade-in

3. **Modal Width**:
   - Stays narrow (50vw/60vw) during generation

### Backend Flow:
```
1. POST /api/studios/ideation/start
   - Sends: { prompt: idea.trim(), ...context }
   - Returns: { ideaId: "xxx" }

2. Polling Loop (pollUntilDone):
   - Polls: GET /api/studios/ideation/status/:id
   - Every 900ms
   - Max 40 attempts (36 seconds timeout)
   
3. Status Updates:
   - "queued" → "processing" → "completed"
   - Updates `msg` with progress messages
```

---

## **PHASE 3: Processing (Polling)**

### Visual Feedback:
- **Status Message**: Updates dynamically
  - "Starting…"
  - "Generating concept…"
  - Any custom messages from backend

- **Pulsing Indicator**: 
  - White dot with slow pulse animation
  - Continuous animation

- **Input Panel**: 
  - Textarea remains visible (read-only feel)
  - Generate button shows "Generating..."

---

## **PHASE 4: Result Ready (Status = "ready")**

### Modal Expansion:
- **Width**: Smoothly expands from `50vw/60vw` → `80vw`
- **Transition**: `duration-700 ease-out` (0.7 seconds)
- **Trigger**: `onStatusChange("ready")` callback

### Result Card Appears (AnimatePresence):
- **Layout**: 2-column grid on large screens
  - Main card: `1.4fr` (70% width)
  - Side panel: `0.6fr` (30% width)

---

## **PHASE 5: Result Display**

### **Main Card (Left - 70% width)**

#### **Header Section**:
```
┌─────────────────────────────────────┐
│ Product Name (editable input)      │ [Copy JSON]
│ Tagline (editable input)            │
└─────────────────────────────────────┘
```

#### **Content Grid (2 columns on desktop)**:

**Column 1: Core Features**
- Label: "CORE FEATURES" (uppercase, small)
- List of editable input fields (one per feature)
- "+ Add feature" button at bottom
- Max 7 features

**Column 2: Tech Stack**
- Label: "TECH STACK" (uppercase, small)
- Three inputs:
  - FRONTEND (editable)
  - BACKEND (editable)
  - DATABASE (editable)

**Full Width: Monetization**
- Label: "MONETIZATION" (uppercase, small)
- Textarea (2 rows)
- Editable

**Full Width: Roadmap**
- Label: "ROADMAP" (uppercase, small)
- List of editable input fields (one per milestone)
- "+ Add milestone" button
- Max 6 milestones

#### **Footer Actions**:
```
┌─────────────────────────────────────┐
│ [Try another idea]  [Save build request] │
└─────────────────────────────────────┘
```

---

### **Side Panel (Right - 30% width)**

#### **"Next" Section**:
- Label: "NEXT" (uppercase, small)
- Bullet list of suggestions:
  - Generate 3 variations
  - Suggest page/screen structure
  - Suggest UI components from library
  - Turn roadmap into tasks

#### **"Prompt Tips" Section**:
- Label: "PROMPT TIPS" (uppercase, small)
- Example text:
  ```
  Add audience + outcome:
  "For NYC contractors, quote jobs from photos
   and collect deposits."
  ```

---

## **PHASE 6: User Interactions with Result**

### **Editable Fields**:
- All text inputs are **editable**
- User can modify:
  - Product name
  - Tagline
  - Features (add/remove/edit)
  - Tech stack (frontend/backend/database)
  - Monetization strategy
  - Roadmap milestones (add/remove/edit)

### **Actions Available**:

1. **Copy JSON Button** (Top-right of main card)
   - Copies entire card data as JSON
   - Shows checkmark when copied
   - Tooltip: "Copy JSON"

2. **Try Another Idea Button** (Bottom-left)
   - Resets everything:
     - Clears idea input
     - Removes result card
     - Resets status to "idle"
     - Modal width returns to narrow

3. **Save Build Request Button** (Bottom-right)
   - Requires authentication
   - POST to `/api/studios/ideation/confirm`
   - Saves to conversation system
   - Closes modal on success
   - Shows error if not signed in

---

## **ERROR STATES**

### **Error Display**:
- **Location**: Below input panel
- **Style**: 
  - Red background (`bg-red-500/10`)
  - Red border
  - Red text
  - Rounded corners
- **Messages**:
  - "Failed to start."
  - "Generation failed. Try again."
  - "Timed out. Try again."
  - "Please sign in to save your build request"

---

## **VISUAL HIERARCHY**

### **Color Scheme**:
- **Background**: Glass-morphism (blur + transparency)
- **Text**: White/90 or Black/90 (based on theme)
- **Subtle Text**: White/60 or Black/50
- **Inputs**: White/10 background, White/15 border
- **Buttons**: White/08 background, White/15 border

### **Typography**:
- **Title**: 2xl/3xl, Semibold
- **Product Name**: 2xl/3xl, Semibold
- **Tagline**: sm/base, Regular
- **Labels**: xs, Uppercase, Tracking-wide
- **Inputs**: sm, Regular

### **Spacing**:
- **Modal padding**: `pt-4 sm:pt-6` (reduced top)
- **Title to badge**: `mb-2` (reduced)
- **Badge spacing**: `my-4` (above and below)
- **Card spacing**: `gap-4` between sections

---

## **RESPONSIVE BEHAVIOR**

### **Mobile (< 640px)**:
- Modal: `w-[50vw]`
- Result: Single column layout
- All inputs stack vertically

### **Tablet (640px - 1024px)**:
- Modal: `w-[60vw]`
- Result: 2-column grid for features/tech stack
- Side panel stacks below

### **Desktop (> 1024px)**:
- Modal: Expands to `w-[80vw]` when ready
- Result: Full 2-column layout (main + side panel)
- Optimal viewing experience

---

## **ANIMATION TIMELINE**

```
0ms:    User clicks "Generate"
        → Button: "Generate" → "Generating..."
        → Status indicator appears
        → Modal stays narrow

100ms:  Status: "Starting…"
        → Fade-in animation

500ms:  POST request completes
        → Status: "Generating concept…"
        → Polling starts

1-30s:  Polling loop (every 900ms)
        → Status messages update
        → Pulsing indicator continues

30s:    Processing completes
        → Status: "ready"
        → Modal expands: 50vw → 80vw (700ms transition)
        → Result card fades in (opacity + y animation)
```

---

## **DATA STRUCTURE**

### **Card Object**:
```javascript
{
  name: "Product Name",
  tagline: "One-line description",
  features: ["Feature 1", "Feature 2", ...], // Max 7
  tech_stack: {
    frontend: "React/Next.js",
    backend: "Node.js",
    database: "PostgreSQL",
    integrations: ["Stripe", "Auth0", ...] // Max 6
  },
  monetization: "Subscription model...",
  roadmap: ["Phase 1", "Phase 2", ...], // Max 6
  ui_inspiration: "Notes on UI/UX direction"
}
```

---

## **KEY FEATURES**

✅ **Real-time status updates** during processing  
✅ **Smooth modal expansion** when result is ready  
✅ **Fully editable result** - user can refine AI output  
✅ **Copy JSON** functionality for export  
✅ **Save to conversations** for project tracking  
✅ **Error handling** with clear messages  
✅ **Responsive design** across all devices  
✅ **Authentication-aware** (works for guests, save requires login)
