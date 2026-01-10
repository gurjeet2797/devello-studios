# Devello Studios - Complete Features Documentation

## Overview

Devello Studios is a collection of in-house AI-powered image editing tools designed to solve specific design and photography problems. This document details all features, editing goals, prompts, and technical specifications for each tool.

---

## 1. Image Editor (General Edit Tool)

### Purpose
Multi-point image editing tool that allows users to place targeted edits at specific coordinates on images using custom prompts and reference images.

### Main Editing Goal
Enable precise, multi-point image editing where users can click on specific areas of an image and apply custom edits with text prompts. Supports multiple simultaneous edits across different regions of the image.

### Key Features

#### Core Editing Features
- **Hotspot-Based Editing**: Click-to-place editing points on images
- **Custom Prompt Input**: Text input per hotspot for specific edit instructions
- **Multiple Simultaneous Edits**: Support for multiple hotspots with different prompts
- **Reference Image Upload**: Attach reference images to guide edits
- **Edit Sessions**: Session-based editing with limits (max 3 sessions, 2 hotspots per session, 6 total hotspots)
- **Edit Phases**: Track editing progress through phases within sessions

#### Image Management
- **Image Upload**: Drag-and-drop or file selection (supports JPEG, PNG, WebP, HEIC/HEIF)
- **Image Standardization**: Automatic HEIC to JPEG conversion
- **Before/After Comparison**: Side-by-side or toggle view of original vs. edited
- **Image Upscaling**: Optional upscaling of processed images
- **History Management**: Undo/redo functionality with full edit history
- **Image Download**: Download edited images with AI-generated filenames

#### User Interface
- **Responsive Design**: Mobile, tablet, and desktop optimized
- **Tab System**: Active tab management (retouch mode)
- **Action Buttons**: Process, Upscale, Download, Undo, Redo, Start Over
- **Loading States**: Visual feedback during processing
- **Error Handling**: User-friendly error messages and recovery

### Prompts Used

#### Base Prompt Template
```
Apply the user's custom prompt to enhance or modify this image. 

CRITICAL REQUIREMENTS:
- Maintain the EXACT same image dimensions and aspect ratio as the original
- Do NOT crop, resize, or change the composition of the original image
- Preserve the original composition, structure, and layout completely
- Keep all elements in their original positions and proportions
- The output must be identical in size and composition to the input image
- Only modify the specific areas requested, leave everything else unchanged

Maintain high quality and realistic results. Output a lossless PNG at original resolution with identical dimensions.
```

#### Specialized Prompts
- **Remove Sunflare**: `Remove all lens flare, sun flare, and glare artifacts from this image while preserving the original lighting and atmosphere. Clean up any bright spots, streaks, or circular artifacts caused by direct light hitting the camera lens. Maintain the natural lighting conditions and color balance. Preserve all details and textures in the image. CRITICAL: Maintain the EXACT same image dimensions and aspect ratio as the original.`

#### Enhanced Prompt Generator
The tool includes an `EnhancedPromptGenerator` class that provides context-aware prompt suggestions:
- **Object Removal**: Person, object, text, background removal prompts
- **Enhancement**: Quality, lighting, color, detail enhancement prompts
- **Style Changes**: Artistic, vintage, modern, dramatic style prompts
- **Specific Edits**: Sky, face, landscape, architecture enhancement prompts

### Technical Specifications

- **API Endpoint**: `/api/predictions/general-edit`
- **AI Model**: Flux Kontext Max (via Replicate)
- **State Management**: ToolStateManager with per-tool state isolation
- **Edit Limits**: 
  - Max 3 edit sessions per image
  - Max 2 hotspots per session
  - Max 6 total hotspots per image
- **File Formats**: JPEG, PNG, WebP, HEIC, HEIF
- **Storage**: Supabase Storage for image uploads

### Workflow
1. User uploads image
2. User clicks on image to place hotspots
3. User enters custom prompt for each hotspot
4. Optional: User uploads reference images
5. User clicks "Process Edits"
6. AI processes all hotspots simultaneously
7. User can undo/redo, upscale, or download result

---

## 2. Lighting Tool

### Purpose
Relight interior photos with different time-of-day lighting conditions to help make better design decisions quickly.

### Main Editing Goal
Change sunlight conditions in interior photographs to simulate different times of day, allowing designers and architects to visualize how spaces will look under various natural lighting conditions without physical staging.

### Key Features

#### Lighting Presets
- **Dramatic Daylight**: Late-morning dramatic daylight (~5300K, ~35° sun elevation)
  - Warm directional sunlight
  - Natural lighting effects
  - Realistic shadows and volumetric light rays
  - No artificial light effects (no lens flares)

- **Midday Bright**: Bright neutral midday sunlight (~5800K, ~65° sun elevation)
  - Clear, bright lighting
  - Crisp shadows
  - Enhanced natural lighting without adding objects
  - Preserves original scene composition

- **Cozy Evening**: Soft evening ambience (~6500K twilight)
  - Warm ambient lighting from existing fixtures
  - Soft glows and cozy atmosphere
  - Interior lamp simulation
  - No direct sunbeams

#### Image Processing
- **Automatic Processing**: Starts immediately after lighting selection
- **Polling-Based Updates**: Real-time status updates during processing
- **Before/After Comparison**: Toggle between original and relit image
- **Image Upscaling**: Optional upscaling of processed images
- **Error Recovery**: Graceful error handling with retry options

#### User Interface
- **Lighting Interface**: Glassmorphic bottom sheet with three lighting options
- **Fade Animations**: Smooth transitions when selecting lighting
- **Processing Indicators**: Visual feedback during AI processing
- **Responsive Design**: Mobile-optimized interface

### Prompts Used

#### Dramatic Daylight Prompt
```
Relight this photo with dramatic late-morning daylight.
Add warm directional sunlight with natural lighting effects.
Create realistic shadows and volumetric light rays.
Do not add lens flares, light flares, or any artificial light effects.
Maintain the original composition, colors, and scene elements.
Do not add windows, walls, or architectural elements not present in the original.
CRITICAL: Do not adjust or rotate the image orientation. Keep the original orientation intact.
High quality, photorealistic result.
```

#### Midday Bright Prompt
```
Relight this photo with bright midday sunlight.
Enhance the natural lighting without adding new objects or windows.
Create crisp, bright lighting that preserves the original scene.
Maintain the exact same composition, colors, and elements.
Only adjust lighting - do not add windows, doors, or other objects.
CRITICAL: Do not adjust or rotate the image orientation. Keep the original orientation intact.
High quality, photorealistic result.
```

#### Cozy Evening Prompt
```
Relight this interior photo with soft evening lighting.
Add warm ambient lighting from existing fixtures.
Create cozy atmosphere with soft glows.
Maintain the original composition and colors.
CRITICAL: Do not adjust or rotate the image orientation. Keep the original orientation intact.
High quality, photorealistic result.
```

#### Advanced Prompt Template (for other variants)
For more complex lighting scenarios, the tool uses a detailed prompt template that includes:
- Solar elevation angles
- Color temperature (Kelvin)
- Volumetric lighting specifications
- Window/door beam calculations
- Interior fixture detection and simulation
- Exposure balancing instructions
- Film grain and lens characteristics preservation

### Technical Specifications

- **API Endpoint**: `/api/predictions/relight`
- **AI Model**: Flux Kontext Max (via Replicate)
- **Lighting Variants**: Defined in `lib/aiService.js` with:
  - Kelvin temperature values
  - Sun elevation angles
  - Volumetric lighting flags
  - Description strings
- **State Management**: ToolStateManager with lighting-specific state
- **Polling Mechanism**: Automatic status checking during processing

### Workflow
1. User uploads interior photo
2. User clicks "Edit" button
3. Lighting interface appears with three options
4. User selects lighting style
5. Interface fades out, processing begins
6. Real-time polling updates status
7. Processed image appears
8. User can compare, upscale, or download

---

## 3. Assisted Edit

### Purpose
AI-powered conversational editing tool that provides reference image suggestions based on natural language requests.

### Main Editing Goal
Enable natural language image editing where users describe what they want, and an AI assistant provides visual reference images to guide the editing process. Users can then place these references at specific locations on their image.

### Key Features

#### AI Assistant
- **Conversational Interface**: Natural language chat input
- **Context-Aware Responses**: Personalized greetings based on image content
- **Web Search Integration**: Automatically searches for relevant reference images
- **Reference Image Suggestions**: Returns 4 reference images per request
- **Image Analysis**: Uses Florence-2 for automatic image captioning

#### Image Captioning
- **Automatic Caption Generation**: Florence-2 model analyzes uploaded images
- **Detailed Descriptions**: Generates comprehensive image descriptions
- **Context for Assistant**: Caption provides context for AI assistant responses
- **Parallel Processing**: Caption generation happens alongside image upload

#### Hotspot System
- **Reference Image Placement**: Click reference images to attach to hotspots
- **Coordinate-Based Editing**: Hotspots placed at specific image coordinates
- **Multiple Hotspots**: Support for multiple reference images on one image
- **Combined Prompt Generation**: All hotspots processed together in single operation

#### User Interface
- **Chat Input**: Glassmorphic input field for natural language requests
- **Reference Image Grid**: Displays 4 reference images from AI search
- **Image Selection Container**: Visual interface for selecting reference images
- **Hotspot Visualization**: Visual indicators on image showing edit points
- **Processing Flow**: Clear visual feedback during AI processing

### Prompts Used

#### Image Caption Prompt (Florence-2)
The Florence-2 model automatically generates detailed image captions without explicit prompts. The model analyzes:
- Objects and subjects in the image
- Scene composition and layout
- Colors and lighting
- Text and signage (if present)
- Overall scene description

#### Chat Assistant Prompt (Gemini API)
The assistant receives:
- User's natural language message
- Generated image caption for context
- Current edit hotspots (if any)
- User profile information

The assistant then:
1. Understands the user's editing request
2. Searches the web for relevant reference images
3. Returns 4 reference images with descriptions
4. Provides contextual responses

#### Processing Prompt (Combined)
When processing, the tool combines all hotspots into a single prompt:
```
Please apply the following targeted edits to the image:

Edit 1: At coordinates (x%, y%) - [user prompt or reference description] using the provided reference image
Edit 2: At coordinates (x%, y%) - [user prompt or reference description] using the provided reference image
...

CRITICAL REQUIREMENTS FOR REFERENCE IMAGES:
- Maintain the EXACT same dimensions as the original image
- Do NOT crop, resize, or change the aspect ratio
- Apply the reference image style/elements at the specified coordinates
- Blend seamlessly with the existing image
- Preserve the original image's composition and framing

Process all edits in a single operation for consistency.
```

### Technical Specifications

- **API Endpoints**:
  - `/api/image-caption` - Florence-2 caption generation
  - `/api/assistant/chat` - Gemini API chat with web search
  - `/api/predictions/general-edit` - Final image processing
- **AI Models**:
  - Florence-2 (Microsoft) - Image captioning
  - Gemini (Google) - Chat assistant and web search
  - Flux Kontext Max (Replicate) - Image processing
- **State Management**: ToolStateManager with assisted-edit specific state
- **Web Search**: Integrated web search for reference images

### Workflow
1. User uploads image
2. Florence-2 generates image caption (parallel processing)
3. AI assistant provides personalized greeting based on caption
4. User types natural language editing request
5. Assistant searches web and returns 4 reference images
6. User clicks on reference image
7. User places hotspot on image
8. Reference image attaches to hotspot
9. User can add more hotspots with different references
10. User clicks "Process"
11. All edits processed simultaneously
12. Result displayed with before/after comparison

---

## 4. Product Studio

### Purpose
Catalogue image editor for product photography and e-commerce image editing.

### Status
External application hosted separately. Already integrated as redirect from Devello Studios.

### Implementation
- **Redirect Method**: Opens in new tab via `window.open()`
- **URL**: `https://catalog-editor-989777430052.us-west1.run.app`
- **Integration**: Card on Studios page with glassmorphic design matching other tools
- **Access**: Available from main Studios page alongside other tools

### Features (External)
- Product catalogue image editing
- E-commerce image optimization
- Batch processing capabilities
- Professional product photography tools

---

## Shared Features Across All Tools

### Image Upload System
- **Drag-and-Drop**: Visual drag-and-drop interface
- **File Selection**: Traditional file input
- **Format Support**: JPEG, PNG, WebP, HEIC, HEIF
- **HEIC Conversion**: Automatic conversion to JPEG
- **Upload Limits**: Guest and user-specific upload limits
- **Storage**: Supabase Storage integration
- **Progress Tracking**: Visual upload progress indicators

### State Management
- **ToolStateManager**: Centralized state management per tool
- **State Isolation**: Each tool maintains independent state
- **Persistence**: State persists across navigation
- **Activity Tracking**: Monitors tool usage and activity

### User Authentication
- **Guest Mode**: Limited functionality for non-authenticated users
- **User Accounts**: Full functionality for authenticated users
- **Upload Tracking**: Per-user upload counting
- **Payment Integration**: Stripe integration for additional uploads

### UI Components
- **Glassmorphic Design**: Consistent glassmorphism throughout
- **Responsive Layout**: Mobile-first responsive design
- **Dark/Light Themes**: Theme switching support
- **Animations**: Framer Motion animations
- **Loading States**: Consistent loading indicators
- **Error Handling**: User-friendly error messages

### Image Processing
- **AI Models**: Flux Kontext Max via Replicate
- **Polling System**: Real-time status updates
- **Error Recovery**: Retry mechanisms for failed requests
- **Upscaling**: Optional image upscaling
- **Format Preservation**: Maintains original image quality

---

## Technical Architecture

### Frontend
- **Framework**: Next.js 14 (React 18.2.0)
- **Styling**: Tailwind CSS with custom CSS variables
- **Animations**: Framer Motion
- **State Management**: React Context API (ToolStateManager)
- **Image Handling**: Next.js Image component with optimization

### Backend
- **API Routes**: Next.js API routes
- **AI Services**: Replicate API, Google Gemini API, Microsoft Florence-2
- **Storage**: Supabase Storage
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth

### Design System
- **Glassmorphism**: Custom glassmorphic components
- **Color Scheme**: Dark mode (#1b1b1d) and light mode (#e8e8e9)
- **Typography**: DM Sans font family
- **Spacing**: Tailwind spacing system
- **Components**: Reusable UI component library

---

## Usage Statistics & Limits

### Guest Users
- Limited uploads per session
- Basic editing functionality
- No history persistence

### Authenticated Users
- Higher upload limits
- Full editing functionality
- History persistence
- Payment options for additional uploads

### Edit Limits
- **Image Editor**: 3 sessions, 2 hotspots per session, 6 total hotspots
- **Lighting Tool**: No session limits, one lighting change per processing
- **Assisted Edit**: Similar to Image Editor with reference image support

---

## Future Enhancements

### Planned Features
- Additional lighting presets
- More AI model options
- Batch processing capabilities
- Advanced editing tools
- Collaboration features
- Export options (various formats and sizes)

### Integration Opportunities
- API access for third-party integrations
- Webhook support for automated workflows
- Mobile app versions
- Desktop application

---

## Support & Documentation

### Additional Resources
- `ASSISTED_EDIT_FLOW.md` - Detailed Assisted Edit workflow
- `lighting-tool-flow.md` - Lighting Tool flow documentation
- `GLASSMORPHISM_STYLING_GUIDE.md` - Design system documentation
- `DEVELLO_STUDIO_TEMPLATE_PROMPT.md` - Template prompts

### API Documentation
- All API endpoints documented in codebase
- Error codes and responses standardized
- Rate limiting and usage tracking

---

*Last Updated: Based on current codebase analysis*
*Version: 1.0*
