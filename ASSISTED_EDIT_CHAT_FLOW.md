# Assisted Edit Chat Window Flow

## 🎯 **Overview**
The assisted edit chat window provides an AI-powered interface that analyzes uploaded images and provides reference images for editing requests.

---

## 📊 **Complete Flow Chart**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ASSISTED EDIT CHAT FLOW                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   USER UPLOADS  │───▶│  IMAGE CAPTION  │───▶│  CHAT INITIAL   │
│     IMAGE       │    │   GENERATION    │    │   MESSAGE       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  IMAGE PROCESS  │    │  FLORENCE-2 API │    │  GREETING MSG   │
│  & STANDARDIZE  │    │  (50-60 sec)    │    │  WITH CAPTION   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  UPLOAD TO      │    │  CAPTION STORED │    │  CHAT READY     │
│  SUPABASE      │    │  IN STATE       │    │  FOR USER       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🔄 **Detailed Component Flow**

### **Phase 1: Image Upload & Caption Generation**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PHASE 1: IMAGE SETUP                               │
└─────────────────────────────────────────────────────────────────────────────────┘

1. USER SELECTS IMAGE
   ├── File validation (size, type)
   ├── Upload limit check
   └── Image standardization (HEIC → JPEG)

2. IMAGE UPLOAD
   ├── Upload to Supabase Storage
   ├── Generate public URL
   └── Store upload ID

3. CAPTION GENERATION (Parallel)
   ├── Call /api/image-caption
   ├── Florence-2 API (50-60 seconds)
   ├── Parse caption from response
   └── Store in tool state

4. CHAT INITIALIZATION
   ├── Check if caption exists
   ├── Generate personalized greeting
   └── Display initial message
```

### **Phase 2: Chat Interaction**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            PHASE 2: CHAT INTERACTION                            │
└─────────────────────────────────────────────────────────────────────────────────┘

USER TYPES MESSAGE
        │
        ▼
┌─────────────────┐
│  VALIDATION     │
│  - Has caption?  │
│  - Not empty?    │
│  - Not loading?  │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│  ADD USER MSG   │
│  TO CHAT        │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│  API CALL TO    │
│  /api/assistant │
│  /chat          │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│  GEMINI API     │
│  PROCESSING     │
│  - System prompt│
│  - Image context│
│  - User profile │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│  RESPONSE       │
│  PROCESSING     │
│  - Extract text │
│  - Find images  │
│  - Filter URLs  │
│  - Apply proxy  │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│  DISPLAY        │
│  RESPONSE       │
│  - Text message │
│  - 4 images     │
└─────────────────┘
```

---

## 🧩 **Component Architecture**

### **Frontend Components**

```
AssistedEditStudio
├── AssistedImageContainer
│   ├── Image Display
│   └── AssistedEditAssistantChat
│       ├── Message List
│       ├── Input Field
│       └── Send Button
└── useAssistedImageProcessing
    ├── handleFileChange()
    ├── generateImageCaption()
    └── checkUploadLimits()
```

### **Backend API Flow**

```
/api/assistant/chat
├── Validate request
├── Build system prompt
├── Call Gemini API
├── Process response
├── Extract images
├── Filter URLs
├── Apply proxy
└── Return response

/api/image-caption
├── Validate image URL
├── Call Florence-2 API
├── Parse caption
└── Return caption
```

---

## 🔄 **State Management Flow**

### **Tool State Updates**

```javascript
// Initial state
{
  imageCaption: null,
  isCaptionPending: false,
  messages: [],
  isLoading: false
}

// After image upload
{
  imageCaption: null,
  isCaptionPending: true,
  messages: [greeting],
  isLoading: false
}

// After caption generation
{
  imageCaption: "The image shows...",
  isCaptionPending: false,
  messages: [greeting, captionAck],
  isLoading: false
}

// During chat
{
  imageCaption: "The image shows...",
  isCaptionPending: false,
  messages: [greeting, captionAck, userMsg, assistantMsg],
  isLoading: false
}
```

---

## 🎯 **Key Interaction Points**

### **1. Image Upload → Caption Generation**
- **Trigger**: User selects image
- **Process**: Florence-2 API call (50-60 seconds)
- **Result**: Caption stored in state
- **UI Update**: Chat shows caption acknowledgment

### **2. Caption → Chat Initialization**
- **Trigger**: Caption received
- **Process**: Generate personalized greeting
- **Result**: Chat ready for user input
- **UI Update**: Input field enabled

### **3. User Message → Assistant Response**
- **Trigger**: User sends message
- **Process**: Gemini API call with context
- **Result**: Text + 4 reference images
- **UI Update**: Message added to chat

### **4. Image Selection → Hotspot Creation**
- **Trigger**: User clicks on image
- **Process**: Create edit hotspot
- **Result**: Visual marker on image
- **UI Update**: Hotspot overlay displayed

---

## 🔧 **Technical Details**

### **Caption Generation Process**
```javascript
// 1. Image upload triggers caption generation
generateImageCaption(imageUrl) {
  // 2. Call Florence-2 API
  fetch('/api/image-caption', {
    method: 'POST',
    body: JSON.stringify({ imageUrl })
  })
  
  // 3. Parse response
  const result = await response.json()
  
  // 4. Store in state
  updateState({ 
    imageCaption: result.caption, 
    isCaptionPending: false 
  })
}
```

### **Chat Message Flow**
```javascript
// 1. User sends message
sendMessage() {
  // 2. Add user message to chat
  setMessages(prev => [...prev, userMessage])
  
  // 3. Call assistant API
  const response = await fetch('/api/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: inputMessage,
      imageCaption,
      userProfile,
      editHotspots
    })
  })
  
  // 4. Add assistant response
  setMessages(prev => [...prev, assistantMessage])
}
```

### **Image Processing Pipeline**
```javascript
// 1. Image validation
validateImage(file) {
  // Check size, type, format
}

// 2. Image standardization
standardizeImage(file) {
  // Convert HEIC to JPEG
  // Compress if needed
  // Fix orientation
}

// 3. Upload to storage
uploadToSupabase(file) {
  // Upload to Supabase Storage
  // Generate public URL
  // Store upload record
}
```

---

## 🚀 **Performance Optimizations**

### **Timeout Management**
- **Frontend**: 2-minute timeout for caption generation
- **Backend**: 60-second timeout for Florence-2 API
- **Chat**: No timeout (real-time)

### **State Updates**
- **Throttled**: Refresh service limited to 5-second intervals
- **Optimized**: Only update when necessary
- **Cached**: User profile and upload stats

### **API Efficiency**
- **Parallel**: Caption generation runs alongside image processing
- **Filtered**: Only trusted image domains
- **Proxied**: All images go through CORS proxy

---

## 🎨 **User Experience Flow**

### **Initial State**
1. User sees empty chat with greeting
2. "Please upload your image" message
3. Upload button available

### **After Image Upload**
1. Image appears in preview
2. Caption generation starts (loading indicator)
3. Chat shows "Generating caption..." message

### **After Caption Generation**
1. Caption acknowledgment message
2. Chat ready for user input
3. Personalized greeting with image context

### **During Chat**
1. User types message
2. Message appears in chat
3. Assistant processes request
4. Response with images appears
5. User can continue conversation

---

## 🔍 **Debug Logging Focus**

### **Key Log Points**
- `🖼️ [ASSISTED_EDIT]` - Image processing
- `💬 [ASSISTED_ASSISTANT]` - Chat interactions
- `🤖 [ASSISTANT_API]` - API responses
- `🔄 [REFRESH_SERVICE]` - State updates

### **Error Handling**
- Caption generation timeouts
- API call failures
- Image upload errors
- Chat message errors

---

## 📋 **Summary**

The assisted edit chat window provides a seamless AI-powered editing experience:

1. **Image Upload** → Automatic caption generation
2. **Caption Analysis** → Personalized chat initialization  
3. **User Interaction** → AI-powered reference image retrieval
4. **Visual Feedback** → Real-time chat with image context

The system is optimized for performance with proper timeout management, state optimization, and efficient API calls.
