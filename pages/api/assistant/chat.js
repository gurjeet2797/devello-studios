import { GoogleGenAI } from "@google/genai";
import { apiCostTracker } from "../../../lib/apiCostTracker";
import { requireAuth } from "../../../lib/authMiddleware";

// Initialize Google Gemini
const gemini = new GoogleGenAI({ 
  apiKey: process.env.GOOGLE_API_KEY 
});

async function handler(req, res) {
  console.log('Assistant chat request:', {
    method: req.method,
    hasMessage: !!req.body?.message,
    hasImageCaption: !!req.body?.imageCaption,
    hasUserProfile: !!req.body?.userProfile,
    messageLength: req.body?.message?.length || 0
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, imageCaption, userProfile } = req.body;

    console.log('Request body details:', {
      message: message?.substring(0, 100) + '...',
      imageCaption: imageCaption?.substring(0, 100) + '...',
      userProfile: userProfile
    });

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // System prompt: focused on finding 4 reference images from reliable sources
    const systemPrompt = `You are an image search assistant. Your ONLY job is to find 4 high-quality reference images.

CRITICAL RULES:
- ALWAYS return exactly 4 images in markdown format: ![description](https://url)
- Use ONLY these reliable sources: Unsplash, Pexels
- AVOID: Pixabay, Freepik, Shutterstock, Pinterest, IKEA, Amazon, Google Images, social media
- Use simple, clean URLs without complex query parameters
- Keep text response to 1-2 sentences maximum
- Focus on the user's specific request

CONTEXT:
${imageCaption ? `Current scene: ${imageCaption}` : 'No scene context available.'}
${userProfile?.name ? `User: ${userProfile.name}` : ''}

SEARCH STRATEGY:
- Use Google Search to find relevant images
- Look for high-resolution, professional images
- Ensure images are publicly accessible
- Provide diverse examples when possible
- Use simple Unsplash URLs like: https://images.unsplash.com/photo-1234567890
- Use simple Pexels URLs like: https://images.pexels.com/photos/1234567/pexels-photo-1234567.jpeg

EXAMPLE OUTPUT FORMAT:
![Modern office chair](https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237)
![Contemporary armchair](https://images.unsplash.com/photo-1596706037000-d16e86634882)
![Wooden dining chair](https://images.unsplash.com/photo-1549497551-c066e5113945)
![Accent chair](https://images.unsplash.com/photo-1615690325010-f1c20689ef2f)

IMPORTANT: You MUST return exactly 4 images in the markdown format above. Do not return any other format.`;

    console.log('Processing request:', {
      messageLength: message.length,
      hasImageCaption: !!imageCaption,
      hasUserProfile: !!userProfile
    });

    // Create the full prompt for Gemini
    const fullPrompt = `${systemPrompt}\n\nUser message: ${message}`;
    

    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { 
        parts: [{ text: fullPrompt }] 
      },
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 220,
        topP: 0.9,
        topK: 40
      },
      tools: [{
        googleSearchRetrieval: {}
      }]
    });
    
    
    // Log the raw response from Gemini
    console.log('Gemini response:', {
      response: response.response,
      candidates: response.response?.candidates,
      usageMetadata: response.response?.usageMetadata
    });

    // Track API costs
    if (response.response?.usageMetadata) {
      const { promptTokenCount, candidatesTokenCount } = response.response.usageMetadata;
      if (promptTokenCount && candidatesTokenCount) {
        await apiCostTracker.trackGeminiCost(
          promptTokenCount,
          candidatesTokenCount,
          'gemini-2.5-flash',
          {
            endpoint: '/api/assistant/chat',
            messageLength: message.length,
            hasImageCaption: !!imageCaption
          }
        );
      }
    }
    
    // Log the full response object for debugging

    // Extract the text response and any images from Gemini
    let responseText = '';
    let responseImages = [];
    
    
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        // Extract text from all parts
        candidate.content.parts.forEach(part => {
          if (part.text) {
            responseText += part.text;
          }
        });
        
      } else {
        responseText = 'I apologize, but I encountered an issue processing your request. Please try again.';
      }
    } else {
      responseText = 'I apologize, but I encountered an issue processing your request. Please try again.';
    }

    // Extract image URLs from markdown-style image references in the response text
    if (responseText) {
      
      // Look for markdown image format: ![Description](url)
      const imageMatches = responseText.match(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g);
      
      // Also look for plain URLs (fallback)
      const plainUrlMatches = responseText.match(/(https?:\/\/[^\s)]+\.(jpg|jpeg|png|webp|gif))/gi);
      
      
      if (imageMatches && imageMatches.length > 0) {
        
        // Process each image match
        imageMatches.slice(0, 4).forEach((match, index) => {
          const urlMatch = match.match(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/);
          if (urlMatch) {
            const description = urlMatch[1] || `Reference image ${index + 1}`;
            const url = urlMatch[2];
            
            
            try {
              const urlObj = new URL(url);
              const hostname = urlObj.hostname.toLowerCase();
              
              // Check for valid image extensions (more flexible for Unsplash URLs)
              const hasValidExtension = /\.(jpg|jpeg|png|gif|webp)$/i.test(urlObj.pathname) || 
                                       /photo-\d+/.test(urlObj.pathname); // Unsplash photo pattern
              const hasValidPath = urlObj.pathname && urlObj.pathname.length > 1;
              
              console.log('URL validation:', {
                url: url,
                pathname: urlObj.pathname,
                hasValidExtension,
                hasValidPath,
                extensionMatch: /\.(jpg|jpeg|png|gif|webp)$/i.test(urlObj.pathname),
                unsplashMatch: /photo-\d+/.test(urlObj.pathname)
              });
              
              if (!hasValidExtension || !hasValidPath) {
                return;
              }
              
              // Use direct URL instead of proxy (Weserv is blocking Unsplash)
              responseImages.push({
                type: 'web_search',
                url: url,
                description: description,
                source: 'AI Search',
                originalUrl: url
              });
              
              
            } catch (urlError) {
            }
          }
        });
        
        // Clean up the text response by removing markdown images
        responseText = responseText.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '').trim();
        
        // If no text left, provide a default message
        if (!responseText || responseText.length < 10) {
          responseText = `Found ${responseImages.length} reference images for you.`;
        }
        
      } else if (plainUrlMatches && plainUrlMatches.length > 0) {
        
        // Process plain URLs as fallback
        plainUrlMatches.slice(0, 4).forEach((url, index) => {
          try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.toLowerCase();
            
            // Check for valid image extensions (more flexible for Unsplash URLs)
            const hasValidExtension = /\.(jpg|jpeg|png|gif|webp)$/i.test(urlObj.pathname) || 
                                     /photo-\d+/.test(urlObj.pathname); // Unsplash photo pattern
            const hasValidPath = urlObj.pathname && urlObj.pathname.length > 1;
            
            if (!hasValidExtension || !hasValidPath) {
              return;
            }
            
            // Use direct URL instead of proxy (Weserv is blocking Unsplash)
            responseImages.push({
              type: 'web_search',
              url: url,
              description: `Reference image ${index + 1}`,
              source: 'AI Search',
              originalUrl: url
            });
            
            
          } catch (urlError) {
          }
        });
        
      } else {
        
        // Fallback: Create reliable images if Gemini doesn't return any
        const fallbackImages = [
          {
            type: 'web_search',
            url: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237',
            description: 'Modern office chair',
            source: 'AI Search',
            originalUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237'
          },
          {
            type: 'web_search',
            url: 'https://images.unsplash.com/photo-1596706037000-d16e86634882',
            description: 'Contemporary armchair',
            source: 'AI Search',
            originalUrl: 'https://images.unsplash.com/photo-1596706037000-d16e86634882'
          },
          {
            type: 'web_search',
            url: 'https://images.unsplash.com/photo-1549497551-c066e5113945',
            description: 'Wooden dining chair',
            source: 'AI Search',
            originalUrl: 'https://images.unsplash.com/photo-1549497551-c066e5113945'
          },
          {
            type: 'web_search',
            url: 'https://images.unsplash.com/photo-1615690325010-f1c20689ef2f',
            description: 'Accent chair',
            source: 'AI Search',
            originalUrl: 'https://images.unsplash.com/photo-1615690325010-f1c20689ef2f'
          }
        ];
        
        responseImages = fallbackImages;
      }
      
    }


    // Ensure we have exactly 4 images if possible
    const limitedImages = responseImages.slice(0, 4);
    
    // If we have fewer than 4 images, log a warning
        if (limitedImages.length < 4) {
        }
        
        console.log('Final response:', {
          responseLength: responseText.length,
          imageCount: limitedImages.length,
          images: limitedImages.map(img => ({ 
            url: img.url, 
            description: img.description,
            source: img.source 
          }))
        });

    // Send response in the format expected by the frontend
    res.status(200).json({ 
      response: responseText,
      images: limitedImages,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [ASSISTANT_API] Gemini API error:', error);
    console.error('❌ [ASSISTANT_API] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Failed to process request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// SECURITY: Require authentication for this expensive endpoint
export default requireAuth(handler);
