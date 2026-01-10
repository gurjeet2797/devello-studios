# Space Render & Hold to Compare Flow

## Overview
This document explains how the space rendering feature works and how the "hold to compare" functionality operates in the Custom Product Form.

---

## 🎯 Space Render Flow

### Step-by-Step Process

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER UPLOADS SPACE PHOTO                                     │
│    - File compressed: 1280x1280, quality 0.7                    │
│    - Stored as base64 data URL                                   │
│    - Saved to: spacePhoto state + formData.originalSpacePhoto   │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. AUTOMATIC RENDER TRIGGER                                      │
│    - renderProductInSpace() called automatically                │
│    - Requires: formData.previewImage (product preview)           │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. IMAGE PREPARATION                                             │
│    - Product preview compressed: 1280x1280, quality 0.7         │
│    - Space photo used as-is (already compressed)                │
│    - Both converted to base64 if needed                         │
│    - Size check: Total must be < 8MB (warning if exceeded)      │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. API CALL: /api/ai/render-product-in-space                    │
│    POST Request Body:                                            │
│    {                                                             │
│      spacePhoto: base64 data URL (space photo)                  │
│      productImage: base64 data URL (compressed preview)         │
│      productDescription: optional text                          │
│      refinementDescription: optional refinement text            │
│    }                                                             │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. GEMINI API PROCESSING                                         │
│    Model: gemini-2.5-flash-image (or env override)              │
│                                                                  │
│    Input to Gemini:                                              │
│    - Image 1: Space photo (inlineData, PNG or JPEG)             │
│    - Image 2: Product preview (inlineData, PNG or JPEG)         │
│    - Text: Prompt instructions                                  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. GEMINI PROMPT (What Gemini Sees)                              │
│                                                                  │
│    "Render the product from the product image intelligently     │
│     into the user's space photo. The product should be          │
│     seamlessly integrated into the scene, matching lighting,     │
│     perspective, and scale.                                      │
│                                                                  │
│     IMPORTANT: Preserve the exact aspect ratio and dimensions    │
│     of the original space photo. The output image must have      │
│     the same width, height, and aspect ratio as the space photo. │
│                                                                  │
│     [If productDescription exists:]                             │
│     Product details: {productDescription}.                       │
│                                                                  │
│     [If refinementDescription exists:]                          │
│     User requested changes: {refinementDescription}. Apply       │
│     these adjustments to the product in the rendered image.     │
│                                                                  │
│     Make the final image look realistic and professional, as    │
│     if the product is actually installed in the space. The      │
│     output image dimensions must match the space photo exactly." │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. GEMINI DECISION PROCESS                                       │
│                                                                  │
│    How Gemini Decides What To Do:                                │
│                                                                  │
│    1. Analyzes space photo:                                     │
│       - Detects room layout, lighting, perspective               │
│       - Identifies where product should be placed                │
│       - Determines scale based on room dimensions                │
│                                                                  │
│    2. Analyzes product image:                                    │
│       - Extracts product shape, color, material                  │
│       - Understands product dimensions from description          │
│                                                                  │
│    3. Integration logic:                                         │
│       - Matches lighting direction and intensity                 │
│       - Adjusts perspective to match room                        │
│       - Scales product proportionally                           │
│       - Blends shadows and reflections                           │
│                                                                  │
│    4. Aspect ratio preservation:                                 │
│       - Output MUST match space photo dimensions exactly         │
│       - No cropping or stretching                                │
│       - Same width, height, aspect ratio                         │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. RESPONSE PROCESSING                                           │
│    - Gemini returns: base64 image (inlineData)                   │
│    - Converted to data URL: data:image/{mimeType};base64,{data}  │
│    - Compressed: 1280x1280, quality 0.7                         │
│    - Stored in: formData.spaceRenderedImage                      │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. DISPLAY IN UI                                                 │
│    - ImageOverlay component shows rendered image                 │
│    - Hold to compare enabled                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Hold to Compare Flow

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│ ImageOverlay Component Props                                    │
│                                                                  │
│  originalSrc={formData.spaceRenderedImage}  ← RENDERED IMAGE    │
│  processedSrc={formData.originalSpacePhoto || spacePhoto}       │
│                    ↑                                             │
│                    ORIGINAL SPACE PHOTO                          │
│  showProcessed={true}  ← Always show processed (rendered)      │
│  allowHoldCompare={true}                                         │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ DEFAULT STATE                                                    │
│ - Shows: formData.spaceRenderedImage (product in space)         │
│ - Hidden: formData.originalSpacePhoto (original space)          │
│ - Indicator: "Hold to compare" text visible                     │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ USER HOLDS DOWN (onPointerDown)                                 │
│                                                                  │
│  Conditions checked:                                             │
│  ✓ showProcessed === true                                       │
│  ✓ isProcessing === false                                       │
│  ✓ allowHoldCompare === true                                    │
│  ✓ Not clicking on button/link/input                            │
│                                                                  │
│  Actions:                                                        │
│  - setIsHolding(true)                                            │
│  - setShowOriginalOnHold(true)                                  │
│  - Original space photo overlay appears                          │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ WHILE HOLDING                                                    │
│ - Overlay shows: formData.originalSpacePhoto                     │
│ - Underneath: formData.spaceRenderedImage (still there)          │
│ - Perfect pixel alignment (same size/position)                  │
│ - Rotation handled if aspect ratios differ                      │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ USER RELEASES (onPointerUp/Leave/Cancel)                        │
│                                                                  │
│  Actions:                                                        │
│  - setIsHolding(false)                                           │
│  - setShowOriginalOnHold(false)                                 │
│  - Overlay disappears                                            │
│  - Back to showing rendered image only                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Image URLs & Data Flow Table

| **Variable/State** | **What It Contains** | **Format** | **When Set** | **Used For** |
|-------------------|---------------------|------------|--------------|--------------|
| `spacePhoto` | User's uploaded space photo | base64 data URL | On upload | Temporary storage |
| `formData.originalSpacePhoto` | Original space photo (compressed) | base64 data URL | On upload | Hold to compare (shown when holding) |
| `formData.previewImage` | Product preview image | base64 data URL | From product preview step | Sent to Gemini as productImage |
| `formData.spaceRenderedImage` | Gemini's rendered output | base64 data URL | After API response | Main display, hold to compare (shown by default) |
| `compressedPreview` | Compressed product preview | base64 data URL | Before API call | Sent to API (1280x1280, 0.7 quality) |
| `spacePhotoToUse` | Space photo for API | base64 data URL | Before API call | Sent to API (already compressed) |

---

## 🎨 Aspect Ratio Determination

### How Aspect Ratio is Preserved

```
┌─────────────────────────────────────────────────────────────────┐
│ ASPECT RATIO FLOW                                               │
└─────────────────────────────────────────────────────────────────┘

1. USER UPLOADS SPACE PHOTO
   └─> Original dimensions: e.g., 1920x1080 (16:9)
       └─> Compressed but aspect ratio maintained: 1280x720 (still 16:9)

2. SENT TO GEMINI
   └─> Space photo: 1280x720 (16:9 aspect ratio)
   └─> Product preview: 1280x1280 (1:1 aspect ratio)
   └─> Prompt explicitly states: "Preserve exact aspect ratio of space photo"

3. GEMINI PROCESSING
   └─> Gemini analyzes space photo dimensions
   └─> Renders product into space
   └─> Output MUST match space photo dimensions exactly
       - Same width: 1280px
       - Same height: 720px
       - Same aspect ratio: 16:9

4. RESPONSE
   └─> Gemini returns image with matching dimensions
   └─> Compressed again but aspect ratio preserved
   └─> Final: Still 16:9 (or whatever space photo was)

5. DISPLAY
   └─> ImageOverlay uses object-fit: contain
   └─> Aspect ratio maintained in display
   └─> No stretching or distortion
```

### Key Code Locations

**Aspect Ratio Preservation in Prompt:**
```72:72:pages/api/ai/render-product-in-space.js
    promptText += `IMPORTANT: Preserve the exact aspect ratio and dimensions of the original space photo. The output image must have the same width, height, and aspect ratio as the space photo. `;
```

**Image Display (Maintains Aspect Ratio):**
```250:252:components/ImageOverlay.js
              width: '100%',
              height: '100%',
              objectFit: 'contain'
```

---

## 🤖 Gemini Decision Logic

### What Gemini Sees and How It Decides

| **Input** | **What Gemini Analyzes** | **Decision/Action** |
|-----------|-------------------------|---------------------|
| **Space Photo** | Room layout, lighting direction, perspective angle, scale references (furniture, windows, etc.) | Determines WHERE and HOW to place product |
| **Product Image** | Product shape, color, material, style | Extracts product appearance to render |
| **Product Description** | Dimensions, material type, specific features | Adjusts scale and appearance accuracy |
| **Refinement Description** | User's requested changes | Applies modifications to product placement/appearance |
| **Prompt Instructions** | "Preserve aspect ratio", "Match lighting", "Seamless integration" | Follows constraints and style guidelines |

### Gemini's Internal Process (Simplified)

1. **Scene Analysis**: Understands the space photo context
2. **Product Extraction**: Identifies product from product image
3. **Placement Decision**: Chooses optimal location based on:
   - Room layout
   - Lighting conditions
   - Perspective lines
   - Scale references
4. **Integration**: Blends product into scene:
   - Matches lighting
   - Adjusts shadows
   - Maintains perspective
   - Scales appropriately
5. **Output**: Generates image matching space photo dimensions exactly

---

## 🔍 Image URL Format Details

### Base64 Data URL Structure

```
data:image/{mimeType};base64,{base64EncodedData}
```

**Examples:**
- `data:image/jpeg;base64,/9j/4AAQSkZJRg...`
- `data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...`

### MIME Type Detection

```65:67:pages/api/ai/render-product-in-space.js
    // Determine MIME types
    const spaceMimeType = spacePhoto.includes('data:image/png') ? 'image/png' : 'image/jpeg';
    const productMimeType = productImage.includes('data:image/png') ? 'image/png' : 'image/jpeg';
```

### Base64 Extraction

```58:63:pages/api/ai/render-product-in-space.js
    // Convert base64 images to inline data format
    const spacePhotoData = spacePhoto.includes('data:') 
      ? spacePhoto.split(',')[1] 
      : spacePhoto;
    const productImageData = productImage.includes('data:')
      ? productImage.split(',')[1]
      : productImage;
```

---

## 📋 Summary Table: Complete Flow

| **Step** | **Component/API** | **Input** | **Output** | **Key Decision** |
|----------|------------------|-----------|------------|------------------|
| 1. Upload | `handleSpacePhotoUpload` | File object | Compressed base64 (1280x1280, 0.7) | Compression settings |
| 2. Trigger | `renderProductInSpace` | `spacePhoto` + `formData.previewImage` | API call | Validates preview exists |
| 3. Prepare | `renderProductInSpace` | Both images | Compressed product preview | Size check (< 8MB total) |
| 4. API Call | `/api/ai/render-product-in-space` | JSON with 2 images + text | Gemini response | Model selection |
| 5. Gemini | Gemini API | 2 images + prompt | Base64 image | Aspect ratio preservation |
| 6. Process | API handler | Gemini response | Compressed data URL | Compression for storage |
| 7. Store | `setFormData` | Compressed image | `formData.spaceRenderedImage` | State update |
| 8. Display | `ImageOverlay` | Rendered + original | Visual comparison | Hold to compare logic |

---

## 🎯 Key Points in Simple Terms

1. **Space Photo**: User uploads their room photo → compressed and stored
2. **Product Preview**: Generated earlier in the form → compressed before sending
3. **Gemini Gets Both**: Space photo + product image + instructions
4. **Gemini's Job**: Put the product in the space photo, matching lighting/perspective, keeping the same aspect ratio
5. **Output**: New image with product in the space (same size as original space photo)
6. **Hold to Compare**: 
   - Default: Shows rendered image (product in space)
   - Hold down: Shows original space photo (no product)
   - Release: Back to rendered image

### Aspect Ratio
- **Input**: Space photo aspect ratio (e.g., 16:9)
- **Gemini Instruction**: "Keep the same aspect ratio as space photo"
- **Output**: Rendered image has same aspect ratio as input space photo
- **Display**: CSS `object-fit: contain` maintains aspect ratio in UI

### Image URLs
- All images stored as **base64 data URLs** (not external URLs)
- Format: `data:image/jpeg;base64,{encodedData}`
- Compressed to reduce size before sending to API
- Compressed again after receiving from API for storage

