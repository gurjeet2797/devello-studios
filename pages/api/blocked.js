// Block access to sensitive files like .env
// In production, all environment variables come from Vercel, not files
export default function handler(req, res) {
  res.status(404).json({ 
    error: 'Not found',
    message: 'This resource is not available'
  });
}

