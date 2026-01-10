# Devello Studios

AI-powered creative tools for professional photo editing and enhancement. Devello Studios offers three main tools: Professional Lighting Studio, General Image Editor, and Assisted Edit.

## Features

- **Lighting Studio**: Add studio-quality lighting to photos with AI-powered time-of-day simulation
- **General Image Editor**: Multi-point image editing with custom prompts and reference images
- **Assisted Edit**: AI-powered conversational editing with reference image suggestions
- Real-time processing with Replicate AI
- Supabase authentication and storage
- Responsive design for mobile and desktop

## Tech Stack

- Next.js 15
- React 18
- Prisma (PostgreSQL via Supabase)
- TailwindCSS
- Supabase (Auth, Storage, Database)
- Replicate AI (Image Processing)
- Stripe (Payments)
- Vercel (Deployment)

## Prerequisites

- Node.js 16.x or later
- Supabase account
- Replicate API key
- Stripe account (for payments)

## Environment Variables

Create a `.env.local` file in the root directory. See `.env.example` for template.

**Required variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `DATABASE_URL` - PostgreSQL connection string
- `REPLICATE_API_TOKEN` - Replicate API token for AI processing
- `NEXT_PUBLIC_DOMAIN_TYPE=studios` - Domain type identifier

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Devello-studioscode.git
cd Devello-studioscode
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy .env.example to .env.local and fill in your values
cp .env.example .env.local
```

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3001`

## Deployment on Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables (see `.env.example` for all required variables)
4. Set `NEXT_PUBLIC_DOMAIN_TYPE=studios` in Vercel environment variables
5. Deploy!

## Project Structure

- `pages/` - Next.js pages (lighting, general-edit, assisted-edit, studios homepage)
- `components/` - React components
  - `pages/` - Page components (StudiosPage, DevelloStudio, etc.)
  - `general-edit/` - General edit tool components
  - `assisted-edit/` - Assisted edit tool components
  - `auth/` - Authentication components
  - `contexts/` - React contexts (ToolStateManager, UserProfile, etc.)
- `lib/` - Utility libraries (Supabase client, API services, etc.)
- `pages/api/` - API routes
  - `predictions/` - AI prediction endpoints (relight, general-edit, assisted-edit)
  - `upload/` - File upload endpoints
  - `auth/` - Authentication endpoints

## Tools

### Lighting Tool
- Route: `/lighting`
- AI Model: Flux Kontext Max via Replicate
- Features: Time-of-day lighting simulation, upscaling, before/after comparison

### General Edit Tool
- Route: `/general-edit`
- AI Model: Flux Kontext Max via Replicate
- Features: Multi-point editing, custom prompts, reference images, hotspot-based editing

### Assisted Edit Tool
- Route: `/assisted-edit`
- AI Model: Flux Kontext Max via Replicate
- Features: Conversational editing, AI assistant chat, reference image suggestions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
