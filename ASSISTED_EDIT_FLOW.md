# Assisted Edit Tool - Workflow Flow Chart

## 🎯 **Assisted Edit Tool Workflow**

### **Phase 1: Image Upload & Processing**
```
User Uploads Image
    ↓
📁 File Selection & Validation
    ↓
🔍 Upload Limit Check
    ↓
✅ Image Standardization (HEIC → JPEG)
    ↓
📤 Upload to Supabase Storage
    ↓
📐 Preview Generation & Container Setup
    ↓
🖼️ Parallel Caption Generation (Florence-2)
```

### **Phase 2: AI Assistant Initialization**
```
Caption Generated
    ↓
🤖 Assistant Receives Image Context
    ↓
💬 Personalized Greeting Based on Image
    ↓
🎯 Ready for User Interaction
```

### **Phase 3: Interactive Editing Workflow**
```
User Types Message
    ↓
💬 Message Sent to Gemini API
    ↓
🔍 Web Search for Reference Images
    ↓
📸 4 Reference Images Returned
    ↓
👆 User Clicks on Reference Image
    ↓
🎯 Hotspot Selection Modal
    ↓
📍 Hotspot Created on Image
    ↓
🔄 Reference Image Attached to Hotspot
```

### **Phase 4: Processing & Output**
```
User Clicks "Process"
    ↓
🎨 Combined Prompt Generation
    ↓
🤖 Gemini AI Processing
    ↓
✨ Edited Image Generated
    ↓
📊 Results Displayed
```

## 🔄 **Key Interaction Points**

### **1. Image ↔ Assistant Communication**
- **Caption**: Florence-2 generates detailed image description
- **Context**: Assistant uses caption for personalized responses
- **References**: Assistant suggests relevant images based on image content

### **2. User ↔ Assistant Communication**
- **Messages**: Natural language requests for editing
- **Images**: 4 reference images per request
- **Hotspots**: Click-to-place editing points

### **3. Assistant ↔ Processing Communication**
- **Prompts**: Combined editing instructions
- **References**: Attached reference images with coordinates
- **Output**: AI-processed final image

## 🎛️ **State Management Flow**

```
Tool State Manager
    ├── Image States (originalSrc, processedSrc)
    ├── Processing States (isProcessing, isUploading)
    ├── Caption States (imageCaption, isCaptionPending)
    ├── Hotspot States (editHotspots, hotspotCounter)
    ├── History States (history, historyIndex)
    └── UI States (showEnhanced, imageReady)
```

## 🔧 **Technical Components**

### **Frontend Components**
- `AssistedEditStudio.js` - Main container
- `AssistedImageContainer.js` - Image display & hotspots
- `AssistedEditAssistantChat.js` - AI chat interface
- `AssistedEditHotspot.js` - Individual hotspot management

### **Hooks & Services**
- `useAssistedImageProcessing.js` - Image upload & caption generation
- `useAssistedProcessing.js` - AI processing logic
- `useToolState.js` - State management

### **API Endpoints**
- `/api/image-caption` - Florence-2 caption generation
- `/api/assistant/chat` - Gemini chat with web search
- `/api/predictions/general-edit` - AI image processing

## 🎯 **User Experience Flow**

1. **Upload** → User drags/drops or selects image
2. **Analyze** → AI generates caption and shows "I'm viewing the image..."
3. **Greet** → Assistant provides contextual greeting
4. **Request** → User asks for specific changes or references
5. **Suggest** → Assistant provides 4 reference images
6. **Place** → User clicks reference and selects hotspot
7. **Process** → AI applies changes and generates result
8. **Review** → User can undo/redo or make additional changes

## 🔍 **Debug Logging Focus**

### **Key Log Categories**
- `[ASSISTED_EDIT]` - Main tool operations
- `[ASSISTED_ASSISTANT]` - Chat interactions
- `[ASSISTANT_API]` - Gemini API responses
- `[IMAGE_CAPTION]` - Florence-2 processing

### **Critical Debug Points**
1. Image upload success/failure
2. Caption generation progress
3. Assistant message sending/receiving
4. Reference image selection
5. Hotspot creation and management
6. Final processing results
