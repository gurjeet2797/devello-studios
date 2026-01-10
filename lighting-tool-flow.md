# Lighting Tool Flow Chart

## Complete Flow Overview

```
User Upload → Image Processing → Lighting Selection → AI Processing → Polling → Upscaling → Final Result
```

## Detailed Flow with Files and Triggers

### 1. INITIAL SETUP
**Files:** `pages/lighting.js` → `components/pages/DevelloStudio.js`
- User navigates to `/lighting` page
- `DevelloStudio` component mounts with `useToolState('lighting')`
- Tool state initialized with default values

### 2. IMAGE UPLOAD
**Files:** `components/pages/ImageContainer.js` → `components/pages/ImageUploader.js`
**Triggers:** User drags/drops or selects image file
**State Updates:**
- `isUploading: true` (via `handleUploadStart`)
- `originalSrc`, `processingImageUrl`, `containerDims` set
- `imageReady: true`, `showEditFlow: false`

### 3. LIGHTING INTERFACE ACTIVATION
**Files:** `components/pages/DevelloStudio.js` → `components/pages/LightingInterface.js`
**Triggers:** User clicks "Edit" button in ImageContainer
**State Updates:**
- `showEditFlow: true` (via `handleStartEditFlow`)

### 4. LIGHTING SELECTION
**Files:** `components/pages/LightingInterface.js`
**Triggers:** User clicks lighting option button
**Flow:**
```javascript
handleOptionClick(option) → 
  setSelectedOption(option.key) → 
  setIsFadingOut(true) → 
  onProcessImage(option.key) // calls processImage from ImageProcessor
```

### 5. IMAGE PROCESSING INITIATION
**Files:** `components/pages/ImageProcessor.js`
**Triggers:** `processImage(lightingType)` called
**API Call:** `POST /api/predictions/relight`
**Payload:**
```json
{
  "image": "processingImageUrl",
  "lightingType": "Dramatic Daylight" | "Midday Bright" | "Cozy Evening"
}
```

### 6. BACKEND PROCESSING
**Files:** `pages/api/predictions/relight.js` → `lib/aiService.js`
**Flow:**
- Validates image URL
- Gets lighting prompt from `PROMPT_TEMPLATES[AI_TOOLS.LIGHTING][lightingType]`
- Creates Replicate prediction with Flux Kontext Max model
- Returns prediction object with `id` and `status: "starting"`

### 7. POLLING LOGIC
**Files:** `components/pages/ImageProcessor.js`
**Triggers:** After successful API call
**Polling Flow:**
```javascript
pollResult() → 
  GET /api/predictions/[id] → 
  Check status → 
  If "succeeded": proceed to upscale
  If "failed": show error
  If "starting"/"processing": continue polling (2s intervals, max 120 polls)
```

### 8. POLLING API
**Files:** `pages/api/predictions/[id].js` → `lib/aiService.js`
**Flow:**
- Calls `aiService.getPrediction(id)`
- Returns current prediction status from Replicate

### 9. PROCESSING COMPLETION
**Files:** `components/pages/ImageProcessor.js`
**Triggers:** Polling detects `status: "succeeded"`
**Actions:**
- Mark upload as processed: `markUploadAsProcessed(prediction.id)`
- Dispatch global event: `window.dispatchEvent(new CustomEvent('uploadProcessed'))`
- Start upscaling: `handleUpscale(status.output)`

### 10. UPSCALING PROCESS
**Files:** `components/pages/ImageProcessor.js`
**API Call:** `POST /api/predictions/upscale`
**Payload:**
```json
{
  "image": "processedImageUrl",
  "scale": 2
}
```

### 11. FINAL STATE UPDATE
**Files:** `components/pages/ImageProcessor.js` → `components/pages/DevelloStudio.js`
**State Updates:**
- `processedSrc: upscaledImageUrl`
- `showEnhanced: true`
- `isProcessing: false`
- `isUpscaling: false`

## Key State Management Files

### ToolStateManager.js
- **Purpose:** Centralized state management for all tools
- **Key Methods:**
  - `getToolState(toolId)` - Get/create tool state
  - `updateToolState(toolId, updates)` - Update tool state
  - `markUploadAsProcessed(predictionId)` - Mark upload as processed
  - `hasActiveWork(toolId)` - Check if tool has active processing

### DevelloStudio.js
- **Purpose:** Main orchestrator for lighting tool
- **Key State:**
  - Uses `useToolState('lighting')` for all lighting-specific state
  - Manages user authentication and upload limits
  - Handles payment flows and error states

### ImageProcessor.js
- **Purpose:** Handles all AI processing logic
- **Key Functions:**
  - `processImage(lightingType)` - Initiates relight processing
  - `handleUpscale(imageUrl)` - Handles image upscaling
  - Polling logic with retry mechanisms

## Error Handling & Retry Logic

### API Retries
- **Relight API:** 5 retries with exponential backoff
- **Upscale API:** 5 retries with exponential backoff
- **Rate Limiting:** Special handling for 429 status codes

### Polling Resilience
- **Tab Visibility:** Continues polling when tab becomes active
- **Timeout Handling:** 2-minute timeout (120 polls × 2s intervals)
- **State Cleanup:** Clears timeouts on component unmount

## Upload Tracking

### Upload Limits
**Files:** `components/hooks/useUploadData.js`, `components/CentralizedUploadCounter.js`
- Tracks user upload count via Supabase
- Shows remaining uploads
- Triggers payment modal when limit reached

### Processing Completion
**Files:** `pages/api/upload/mark-processed.js`
- Marks upload as processed in database
- Updates user's upload count
- Triggers global event for UI updates

## Key Configuration

### Lighting Options
**File:** `lib/aiService.js` - `LIGHTING_VARIANTS`
- Dramatic Daylight (5300K, 35° elevation, volumetric)
- Midday Bright (5800K, 65° elevation, sharp shadows)
- Cozy Evening (6500K, diffuse, interior glow)

### AI Models
- **Relight:** `black-forest-labs/flux-kontext-max`
- **Upscale:** Real-ESRGAN model via Replicate
- **Fallback:** Google Gemini 2.5 Flash (if configured)

## State Flow Summary

```
Initial State → Upload → Edit Flow → Lighting Selection → 
API Call → Polling → Processing Complete → Upscaling → 
Final State → Download/Share
```

Each step updates the centralized tool state, which triggers UI updates across all components.
