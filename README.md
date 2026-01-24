# Portfolio Website

A modern portfolio website with integrated blog functionality built with Next.js, Tina CMS, and deployed on Vercel.

## 🚀 Features

- **Portfolio Showcase**: Display your projects with filtering and search
- **Blog**: Full-featured blog with categories, tags, and search
- **About Page**: Experience timeline, skills, and social links
- **Contact Form**: Functional contact form with validation
- **Dark/Light Mode**: Toggle between themes
- **Responsive Design**: Works on all devices
- **SEO Optimized**: Full meta tags and Open Graph support
- **RSS Feed**: Blog RSS feed at `/api/rss`
- **Tina CMS**: Content management for projects and blog posts

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Tina CMS** - Headless CMS
- **MDX** - Content format
- **Vercel Analytics** - Analytics
- **Vercel** - Hosting

## 📦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/connect2gopu.git
cd connect2gopu
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_TINA_CLIENT_ID=your_tina_client_id
TINA_TOKEN=your_tina_token
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Tina CMS Admin

To access the Tina CMS admin panel:
```bash
npm run dev:tina
```

Then navigate to [http://localhost:3000/admin](http://localhost:3000/admin)

## 📁 Project Structure

```
connect2gopu/
├── app/                    # Next.js App Router
│   ├── (main)/            # Main routes
│   ├── api/               # API routes
│   └── admin/             # Tina CMS admin
├── components/             # React components
│   ├── about/             # About page components
│   ├── blog/              # Blog components
│   ├── forms/             # Form components
│   ├── home/              # Home page components
│   ├── layout/             # Layout components
│   ├── portfolio/         # Project components
│   └── ui/                # UI components
├── content/               # MDX content files
│   ├── blog/              # Blog posts
│   └── projects/          # Projects
├── lib/                   # Utility functions
├── public/                # Static assets
└── types/                 # TypeScript types
```

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Connect GoDaddy Domain

See [DOMAIN_SETUP.md](./DOMAIN_SETUP.md) for GoDaddy DNS configuration.

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run dev:tina` - Start with Tina CMS

## 🎨 Customization

### Colors

Edit `app/globals.css` to change the color scheme.

### Content

- Projects: Add MDX files in `content/projects/`
- Blog Posts: Add MDX files in `content/blog/`
- Or use Tina CMS at `/admin`

### Skills

Edit `components/home/SkillsShowcase.tsx` to update skills.

### Experience

Edit `components/about/ExperienceTimeline.tsx` to update work experience.

## 📄 License

MIT

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Content managed with [Tina CMS](https://tina.io/)
- Deployed on [Vercel](https://vercel.com/)
