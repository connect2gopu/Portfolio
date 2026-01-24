# Portfolio + Blog Website

A modern portfolio website with integrated blog functionality built with Next.js, Tina CMS, and deployed on Vercel.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_TINA_CLIENT_ID=your_tina_client_id
TINA_TOKEN=your_tina_token
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Tina CMS Admin

To access the Tina CMS admin panel:
```bash
npm run dev:tina
```

Then navigate to [http://localhost:3000/admin](http://localhost:3000/admin)

## 📁 Project Structure

- `app/` - Next.js App Router pages and layouts
- `components/` - React components
- `content/` - MDX content files (projects, blog posts)
- `.tina/` - Tina CMS configuration
- `lib/` - Utility functions
- `types/` - TypeScript type definitions
- `public/` - Static assets

## 🛠️ Tech Stack

- **Next.js 14** - React framework
- **Tina CMS** - Headless CMS
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **MDX** - Content format
- **Vercel Analytics** - Analytics

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run dev:tina` - Start with Tina CMS

## 🚢 Deployment

The project is configured for deployment on Vercel. Simply connect your GitHub repository to Vercel and deploy.

## 📄 License

MIT
