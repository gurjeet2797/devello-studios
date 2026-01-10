# Devello Inc API Documentation

## Overview

Devello Inc provides a robust AI-powered image processing API with multiple tools for interior design enhancement. The API is built with production-grade security, error handling, and performance optimizations.

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Authentication

Most API endpoints require authentication using Supabase JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

**Public Endpoints** (no authentication required):
- `POST /api/upload` - File upload (rate limited)
- `GET /api/predictions/{id}` - Check prediction status

**Protected Endpoints** (authentication required):
- `POST /api/replicate/with-tracking` - AI model execution
- `POST /api/assistant/chat` - AI chat assistant
- `POST /api/ai/product-preview` - Product image generation
- `GET /api/user/profile` - User profile data
- `POST /api/predictions/relight` - Lighting enhancement (legacy, consider using `/api/replicate/with-tracking`)

## Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP address
- **Headers**: Rate limit information is returned in response headers:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: When the rate limit window resets

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- `400`: Bad Request - Invalid input data
- `405`: Method Not Allowed - Wrong HTTP method
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server-side error

## Endpoints

### 1. File Upload

Upload images for processing.

**Endpoint**: `POST /api/upload`

**Content-Type**: `multipart/form-data`

**Request Body**:
- `file`: Image file (JPEG, PNG, WebP, HEIC)
- Max file size: 50MB
- Min file size: 1KB

**Response**:
```json
{
  "url": "https://storage-url/filename.jpg"
}
```

**Security Features**:
- File type validation
- File size limits
- Filename sanitization
- Automatic cleanup of temp files

---

### 2. Lighting Enhancement (Legacy)

Apply professional lighting effects to interior photos.

**Endpoint**: `POST /api/predictions/relight`

**Note**: This endpoint is still available but consider using `/api/replicate/with-tracking` for more flexibility.

**Request Body**:
```json
{
  "image": "https://image-url.com/image.jpg",
  "lightingType": "morning|golden|studio|evening|overcast",
  "prompt": "Custom prompt (optional)"
}
```

**Available Lighting Types**:
- `morning`: Neutral daylight (5300K) with sunbeams
- `golden`: Warm golden hour lighting (2700K)
- `studio`: Professional studio lighting with controlled contrast
- `evening`: Soft evening lighting (3000K)
- `overcast`: Natural overcast daylight (6500K)

**Response**:
```json
{
  "id": "prediction-id",
  "status": "starting",
  "input": {
    "prompt": "Applied lighting prompt",
    "input_image": "image-url"
  }
}
```

---

### 3. AI Model Execution (Generic)

Execute AI models via Replicate. This is the primary endpoint for AI operations.

**Endpoint**: `POST /api/replicate/with-tracking`

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "model": "black-forest-labs/flux-kontext-max",
  "input": {
    "prompt": "Your prompt here",
    "image": "https://image-url.com/image.jpg"
  }
}
```

**Allowed Models** (whitelisted for security):
- `black-forest-labs/flux-kontext-max` - Lighting and image enhancement
- `recraft-ai/recraft-crisp-upscale:71b4b8f299dd300f7199ec7eb433fa15cc1f493abca86719505d2021a21a5892` - Image upscaling

**Response**:
```json
{
  "id": "prediction-id",
  "status": "succeeded",
  "output": ["https://result-image-url.com"],
  "metrics": {
    "predict_time": 12.5
  },
  "cost": {
    "amount": 0.05,
    "currency": "USD"
  },
  "execution_time": 12500,
  "duration": 12.5
}
```

---

### 4. Image Upscaling

Enhance image resolution using AI upscaling.

**Endpoint**: `POST /api/predictions/upscale`

**Request Body**:
```json
{
  "image": "https://image-url.com/image.jpg",
  "scale": 2
}
```

**Parameters**:
- `scale`: Upscaling factor (1-4, default: 2)

**Response**:
```json
{
  "output": "https://upscaled-image-url.com/image.jpg"
}
```

---

### 6. Prediction Status

Check the status of a running prediction.

**Endpoint**: `GET /api/predictions/{id}`

**Response**:
```json
{
  "id": "prediction-id",
  "status": "starting|processing|succeeded|failed",
  "output": "result-url (when succeeded)",
  "error": "error-message (when failed)",
  "created_at": "2024-01-01T00:00:00.000Z",
  "completed_at": "2024-01-01T00:01:30.000Z"
}
```

**Status Values**:
- `starting`: Prediction is being initialized
- `processing`: AI model is processing the image
- `succeeded`: Processing completed successfully
- `failed`: Processing failed with an error

## Usage Examples

### JavaScript/Node.js

```javascript
// Upload an image
const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
};

// Apply lighting
const applyLighting = async (imageUrl, lightingType = 'morning') => {
  const response = await fetch('/api/predictions/relight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: imageUrl,
      lightingType
    })
  });
  
  return await response.json();
};

// Poll for results
const pollPrediction = async (predictionId) => {
  while (true) {
    const response = await fetch(`/api/predictions/${predictionId}`);
    const prediction = await response.json();
    
    if (prediction.status === 'succeeded') {
      return prediction.output;
    } else if (prediction.status === 'failed') {
      throw new Error(prediction.error);
    }
    
    // Wait 2 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
};
```

### Python

```python
import requests
import time

def upload_image(file_path):
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post('http://localhost:3000/api/upload', files=files)
        return response.json()

def apply_lighting(image_url, lighting_type='morning'):
    data = {
        'image': image_url,
        'lightingType': lighting_type
    }
    response = requests.post('http://localhost:3000/api/predictions/relight', json=data)
    return response.json()

def poll_prediction(prediction_id):
    while True:
        response = requests.get(f'http://localhost:3000/api/predictions/{prediction_id}')
        prediction = response.json()
        
        if prediction['status'] == 'succeeded':
            return prediction['output']
        elif prediction['status'] == 'failed':
            raise Exception(prediction['error'])
        
        time.sleep(2)
```

## Client Libraries

### JavaScript Client Utility

The application includes optimized client utilities in `lib/clientUtils.js`:

```javascript
import { apiClient, uploadFile, pollPrediction } from '../lib/clientUtils.js';

// Upload with progress tracking
const result = await uploadFile(file, (progress) => {
  console.log(`Upload progress: ${progress}%`);
});

// Make API requests with retry logic
const prediction = await apiClient.request('/api/predictions/relight', {
  method: 'POST',
  body: JSON.stringify({ image: imageUrl, lightingType: 'morning' }),
  retries: 3,
  timeout: 30000
});

// Poll with smart intervals
const finalResult = await pollPrediction(prediction.id, (update) => {
  console.log(`Status: ${update.status}`);
});
```

## Performance Optimization

### Caching
- API responses can be cached using the client utility
- Image URLs are cached for 5 minutes by default
- Pending requests are deduplicated automatically

### Rate Limiting
- Implement exponential backoff when rate limited
- Monitor rate limit headers to optimize request timing

### Image Processing
- Images are automatically compressed before upload
- HEIC files are converted to JPEG
- Optimal dimensions and quality settings are applied

## Security Considerations

### Input Validation
- All file uploads are validated for type and size
- Filenames are sanitized to prevent path traversal
- Request bodies are validated against schemas

### Rate Limiting
- IP-based rate limiting prevents abuse
- Different limits can be applied per endpoint

### Error Handling
- Detailed errors are only shown in development
- Production errors are sanitized to prevent information leakage

### CORS
- Configured origins prevent unauthorized cross-origin requests
- Credentials are handled securely

## Monitoring and Logging

### Structured Logging
- All API requests and responses are logged
- Performance metrics are tracked
- Error details are captured for debugging

### Performance Monitoring
- Request duration tracking
- Slow operation detection
- Resource usage monitoring

## Adding New AI Tools

To add a new AI tool, follow these steps:

1. **Add tool type** in `lib/aiService.js`:
```javascript
export const AI_TOOLS = {
  // ... existing tools
  NEW_TOOL: 'new_tool'
};
```

2. **Add prompt templates**:
```javascript
export const PROMPT_TEMPLATES = {
  // ... existing templates
  [AI_TOOLS.NEW_TOOL]: {
    variant1: 'Prompt for variant 1...',
    variant2: 'Prompt for variant 2...'
  }
};
```

3. **Create API endpoint** at `pages/api/predictions/new-tool.js`:
```javascript
import aiService, { AI_TOOLS } from '../../../lib/aiService.js';
import { withMiddleware } from '../../../lib/middleware.js';

const handler = async (req, res) => {
  const { image, variant, customPrompt } = req.body;
  
  const prediction = await aiService.createPrediction(AI_TOOLS.NEW_TOOL, {
    image,
    prompt: variant,
    customPrompt
  });
  
  return res.status(200).json(prediction);
};

export default withMiddleware(handler, {
  validation: {
    method: 'POST',
    requireBody: true,
    requiredFields: ['image']
  }
});
```

4. **Update client components** to use the new endpoint

This architecture makes it easy to add new AI tools while maintaining consistency and security across the application. 