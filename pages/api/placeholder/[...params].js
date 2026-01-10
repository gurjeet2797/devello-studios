export default function handler(req, res) {
  const { params } = req.query;
  const [dimensions, query] = params || [];
  
  // Parse dimensions (e.g., "600/400")
  const [width = 600, height = 400] = dimensions?.split('/').map(Number) || [600, 400];
  
  // Parse query parameters
  const searchParams = new URLSearchParams(query);
  const text = searchParams.get('text') || 'Placeholder';
  const bgColor = searchParams.get('bg') || '#f5f1eb';
  const textColor = searchParams.get('color') || '#8b5a2b';
  
  // Generate SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ede5d6;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#bg)"/>
      
      <!-- Decorative pattern -->
      <circle cx="10%" cy="10%" r="20" fill="white" opacity="0.1"/>
      <circle cx="90%" cy="20%" r="15" fill="white" opacity="0.15"/>
      <circle cx="85%" cy="85%" r="25" fill="white" opacity="0.08"/>
      <circle cx="15%" cy="90%" r="18" fill="white" opacity="0.12"/>
      
      <!-- Main text -->
      <text x="50%" y="45%" 
            text-anchor="middle" 
            dominant-baseline="middle"
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="${Math.min(width, height) * 0.08}" 
            font-weight="300"
            fill="${textColor}"
            filter="url(#shadow)">
        ${text}
      </text>
      
      <!-- Subtitle -->
      <text x="50%" y="60%" 
            text-anchor="middle" 
            dominant-baseline="middle"
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="${Math.min(width, height) * 0.04}" 
            font-weight="200"
            fill="${textColor}"
            opacity="0.7">
        ${width} × ${height}
      </text>
      
      <!-- Artistic flourish -->
      <path d="M ${width * 0.3} ${height * 0.7} Q ${width * 0.5} ${height * 0.65} ${width * 0.7} ${height * 0.7}" 
            stroke="${textColor}" 
            stroke-width="1" 
            fill="none" 
            opacity="0.3"/>
    </svg>
  `;
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.status(200).send(svg);
} 